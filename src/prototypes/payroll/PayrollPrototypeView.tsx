import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"

import { Select } from "@/components/ui/select"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { getMgmtRole } from "@/lib/mgmtRole"
import {
  acceptTeacherSubmit,
  createPayrollAdjustment,
  listPayrollMonthOptions,
  loadPayrollWorkbench,
  recalcPayrollRun,
  returnPayrollMonth,
  returnTeacherSubmit,
  reviewPayrollAdjustment,
  setFinanceReviewed,
  setTeacherExcluded,
  settlePayrollMonth,
  submitPayrollMonth,
  submitTeacherForReview,
  upsertManualHours,
  type PayrollWorkbench,
} from "@/services/payrollQueries"

import { FinancePayrollView } from "./FinancePayrollView"
import { ManagerPayrollView } from "./ManagerPayrollView"
import {
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollPreviewRole,
  type PayrollRunStatus,
  type ReviewAudit,
  type TeacherSubmitState,
  type WfhMockState,
} from "./mockData"

function actorLabel(): string {
  const role = getMgmtRole()
  if (role === "finance") return "Cody Cheong（財務）"
  if (role === "manager") return "管理層"
  if (role === "alien") return "外星人"
  return "行政"
}

export function PayrollPrototypeView() {
  const { confirmDialog } = useAppConfirm()
  const { pushBanner } = useAppBanner()
  const realRole = getMgmtRole()
  const isFinanceUser = realRole === "finance"
  const [previewRole, setPreviewRole] = useState<PayrollPreviewRole>(
    realRole === "manager" ? "manager" : "finance"
  )
  const effectiveRole: PayrollPreviewRole = isFinanceUser ? "finance" : previewRole

  const monthOptions = useMemo(() => listPayrollMonthOptions(), [])
  const [monthKey, setMonthKey] = useState(() => monthOptions[1]?.value ?? monthOptions[0]?.value ?? "2026-07")
  const [workbench, setWorkbench] = useState<PayrollWorkbench | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (key: string) => {
    setLoading(true)
    setError(null)
    try {
      const wb = await loadPayrollWorkbench(key)
      setWorkbench(wb)
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入計糧失敗")
      setWorkbench(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload(monthKey)
  }, [monthKey, reload])

  const month: PayrollMonthMock = workbench?.month ?? {
    monthKey,
    monthLabel: monthKey,
    status: "財務審閱中",
    teachers: [],
  }
  const teachers = month.teachers
  const status = month.status
  const adjustments = workbench?.adjustments ?? []
  const runId = workbench?.run.id

  const reviewedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of workbench?.teacherStates ?? []) {
      if (s.financeReviewed) ids.add(s.teacherId)
    }
    return ids
  }, [workbench?.teacherStates])

  const reviewAudits: ReviewAudit[] = useMemo(() => {
    return (workbench?.teacherStates ?? [])
      .filter((s) => s.financeReviewed)
      .map((s) => {
        const t = teachers.find((x) => x.id === s.teacherId)
        return {
          teacherId: s.teacherId,
          teacherName: t?.name ?? s.teacherId,
          reviewer: actorLabel(),
          reviewedAt: "—",
          calcVersion: workbench?.run.calcVersion ?? 1,
          scope: (t?.anomalies.length ?? 0) > 0 ? "已審核有異常／已知悉" : "已審核無異常",
          note: t?.anomalies[0],
        }
      })
  }, [workbench, teachers])

  const excludedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of workbench?.teacherStates ?? []) {
      if (s.excluded) ids.add(s.teacherId)
    }
    return ids
  }, [workbench?.teacherStates])

  const teacherSubmits: TeacherSubmitState[] = useMemo(() => {
    return (workbench?.teacherStates ?? [])
      .filter((s) => s.submitStatus !== "not_submitted")
      .map((s) => ({
        teacherId: s.teacherId,
        status: s.submitStatus,
        returnNote: s.submitNote ?? undefined,
      }))
  }, [workbench?.teacherStates])

  const codyTeacher = teachers.find((t) => t.mode === "WFH 時薪")
  const codyHours = codyTeacher?.wfh?.hours ?? null
  const codyStatus: WfhMockState["status"] = codyTeacher?.wfh?.status ?? "missing"

  const onMonthChange = (value: string) => {
    if (value === monthKey) return
    void (async () => {
      const ok = await confirmDialog({
        title: "切換月份？",
        description: "將載入該月份的計糧資料與審核狀態。",
        confirmText: "切換",
        cancelText: "取消",
        tone: "warning",
      })
      if (ok) setMonthKey(value)
    })()
  }

  const onStatusChange = (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => {
    if (!runId) return
    void (async () => {
      try {
        if (next === "待管理層核實") {
          await submitPayrollMonth(runId, actorLabel())
        } else if (next === "財務審閱中" && status === "待管理層核實") {
          await returnPayrollMonth(runId, meta?.returnReason ?? "退回財務")
        } else if (next === "已結算") {
          await settlePayrollMonth(runId, actorLabel(), teachers)
        } else {
          pushBanner({ tone: "warning", title: `未支援的狀態變更：${next}` })
          return
        }
        await reload(monthKey)
        pushBanner({ tone: "success", title: `月份狀態已更新為「${next}」` })
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "更新狀態失敗",
        })
      }
    })()
  }

  const onRecalc = () => {
    void (async () => {
      const ok = await confirmDialog({
        title: "重新計算？",
        description: "將依最新點名／排程重算本月薪酬，並遞增計算版本。已標記的「已審核」會保留於資料庫。",
        confirmText: "重算",
        cancelText: "取消",
        tone: "warning",
      })
      if (!ok) return
      try {
        const wb = await recalcPayrollRun(monthKey)
        setWorkbench(wb)
        pushBanner({ tone: "success", title: `已重算（v${wb.run.calcVersion}）` })
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "重算失敗",
        })
      }
    })()
  }

  const onToggleReviewed = (teacherId: string) => {
    if (!runId) return
    const next = !reviewedIds.has(teacherId)
    void (async () => {
      try {
        await setFinanceReviewed(runId, teacherId, next)
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "更新審核狀態失敗",
        })
      }
    })()
  }

  const onToggleExcluded = (id: string) => {
    if (!runId) return
    const next = !excludedIds.has(id)
    void (async () => {
      try {
        await setTeacherExcluded(runId, id, next, next ? "財務排除／移交跟進" : undefined)
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "更新排除狀態失敗",
        })
      }
    })()
  }

  const onSubmitTeacher = (teacherId: string) => {
    if (!runId) return
    void (async () => {
      try {
        await submitTeacherForReview(runId, teacherId)
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "送核失敗",
        })
      }
    })()
  }

  const onResolveTeacherSubmit = (
    teacherId: string,
    next: "accepted" | "returned",
    note?: string
  ) => {
    if (!runId) return
    void (async () => {
      try {
        if (next === "accepted") await acceptTeacherSubmit(runId, teacherId)
        else await returnTeacherSubmit(runId, teacherId, note ?? "退回")
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "處理送核失敗",
        })
      }
    })()
  }

  const onAddAdjustment = (adj: ManualAdjustment) => {
    if (!runId) return
    void (async () => {
      try {
        await createPayrollAdjustment({
          runId,
          teacherId: adj.teacherId,
          fromAmount: adj.fromAmount ?? 0,
          toAmount: adj.toAmount,
          reason: adj.reason,
          createdBy: actorLabel(),
        })
        await reload(monthKey)
        pushBanner({ tone: "success", title: "已建立人手調整申請" })
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "建立調整失敗",
        })
      }
    })()
  }

  const onResolveAdjustment = (
    id: string,
    st: "approved" | "rejected",
    _note?: string
  ) => {
    void (async () => {
      try {
        await reviewPayrollAdjustment(id, st, actorLabel())
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "審批調整失敗",
        })
      }
    })()
  }

  const onCodyChange = (hours: number | null, st: WfhMockState["status"]) => {
    if (!codyTeacher || hours == null) return
    void (async () => {
      try {
        const dbStatus = st === "approved" ? "approved" : st === "submitted" ? "submitted" : "draft"
        await upsertManualHours({
          monthKey,
          teacherId: codyTeacher.id,
          hours,
          status: dbStatus,
          actor: actorLabel(),
        })
        await reload(monthKey)
      } catch (e) {
        pushBanner({
          tone: "error",
          title: e instanceof Error ? e.message : "更新工時失敗",
        })
      }
    })()
  }

  const onCodyApprove = (hours: number) => {
    onCodyChange(hours, "approved")
  }

  const monthSelect: ReactNode = (
    <Select
      aria-label="計糧月份"
      value={monthKey}
      onChange={(e) => onMonthChange(e.target.value)}
      className="w-full sm:w-56"
    >
      {monthOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {isFinanceUser ? (
            <p className="pb-1 text-sm text-muted-foreground sm:max-w-md">
              財務工作台：審核及提交每月教師薪酬（分頁：概覽 → 審核 → 調整 → 提交）
            </p>
          ) : (
            <>
              <label className="block min-w-[12rem]">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">預覽身份</span>
                <Select
                  aria-label="預覽身份"
                  value={previewRole}
                  onChange={(e) => setPreviewRole(e.target.value as PayrollPreviewRole)}
                >
                  <option value="finance">財務 — 計糧工作台</option>
                  <option value="manager">管理層 — 計糧核實</option>
                </Select>
              </label>
              <p className="pb-1 text-xs text-muted-foreground sm:max-w-md">
                {effectiveRole === "finance"
                  ? "此頁面協助你審核及提交每月教師薪酬（分頁：概覽 → 審核 → 調整 → 提交）"
                  : "管理層：概覽 → 待核佇列 → 抽查 → 結算"}
              </p>
            </>
          )}
        </div>
        <p className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
          正式資料 · 點名／排程即時計算
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入計糧中…</p>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : effectiveRole === "finance" ? (
        <FinancePayrollView
          month={month}
          status={status}
          teachers={teachers}
          adjustments={adjustments}
          reviewedIds={reviewedIds}
          reviewAudits={reviewAudits}
          excludedIds={excludedIds}
          onToggleReviewed={onToggleReviewed}
          onToggleExcluded={onToggleExcluded}
          onStatusChange={onStatusChange}
          onAddAdjustment={onAddAdjustment}
          onCodyChange={onCodyChange}
          onRecalc={onRecalc}
          teacherSubmits={teacherSubmits}
          onSubmitTeacher={onSubmitTeacher}
          monthSelect={monthSelect}
        />
      ) : (
        <ManagerPayrollView
          month={month}
          status={status}
          teachers={teachers}
          adjustments={adjustments}
          excludedIds={excludedIds}
          teacherSubmits={teacherSubmits}
          codyStatus={codyStatus}
          codyHours={codyHours}
          onStatusChange={onStatusChange}
          onResolveAdjustment={onResolveAdjustment}
          onResolveTeacherSubmit={onResolveTeacherSubmit}
          onCodyApprove={onCodyApprove}
          monthSelect={monthSelect}
        />
      )}
    </div>
  )
}
