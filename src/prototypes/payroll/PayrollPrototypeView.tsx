import { useMemo, useState, type ReactNode } from "react"
import { FlaskConical } from "lucide-react"

import { Select } from "@/components/ui/select"

import { FinancePayrollView } from "./FinancePayrollView"
import { ManagerPayrollView } from "./ManagerPayrollView"
import {
  DEFAULT_CALC_META,
  PAYROLL_MOCK_BY_MONTH,
  PAYROLL_MONTH_OPTIONS,
  withMpf,
  withWfhApplied,
  type CalcVersionMeta,
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollPreviewRole,
  type PayrollRunStatus,
  type PayrollTeacherRow,
  type ReviewAudit,
  type TeacherSubmitState,
  type WfhMockState,
} from "./mockData"

export function PayrollPrototypeView() {
  const [previewRole, setPreviewRole] = useState<PayrollPreviewRole>("finance")
  const [monthKey, setMonthKey] = useState("2026-08")
  const [overrides, setOverrides] = useState<
    Record<string, { status: PayrollRunStatus } & Partial<PayrollMonthMock>>
  >({})
  const [calcByMonth, setCalcByMonth] = useState<Record<string, CalcVersionMeta>>({
    "2026-08": { ...DEFAULT_CALC_META },
    "2026-07": {
      version: 1,
      computedAt: "2026-07-28 16:00",
      dataCutoffAt: "2026-07-28 15:30",
    },
  })
  const [codyHours, setCodyHours] = useState<number | null>(null)
  const [codyStatus, setCodyStatus] = useState<WfhMockState["status"]>("missing")
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([])
  const [reviewAudits, setReviewAudits] = useState<ReviewAudit[]>([])
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set())
  const [teacherSubmits, setTeacherSubmits] = useState<TeacherSubmitState[]>([])

  const base = PAYROLL_MOCK_BY_MONTH[monthKey] ?? PAYROLL_MOCK_BY_MONTH["2026-08"]
  const calc = calcByMonth[monthKey] ?? DEFAULT_CALC_META

  const teachers: PayrollTeacherRow[] = useMemo(() => {
    const o = overrides[monthKey]
    const statusTeachers = o?.teachers ?? base.teachers
    return statusTeachers.map((t) => {
      let row = t
      if (t.id === "cody") {
        row = withWfhApplied(t, codyHours, codyStatus)
      }
      const approved = adjustments.filter(
        (a) => a.teacherId === row.id && a.status === "approved"
      )
      if (approved.length > 0) {
        const latest = approved[0]!
        row = withMpf({
          ...row,
          gross: latest.toAmount,
        })
      }
      return row
    })
  }, [base.teachers, monthKey, overrides, codyHours, codyStatus, adjustments])

  const month: PayrollMonthMock = useMemo(() => {
    const o = overrides[monthKey]
    return {
      ...base,
      ...o,
      teachers,
      calc,
    }
  }, [base, monthKey, overrides, teachers, calc])

  const status = month.status
  const reviewedIds = useMemo(
    () => new Set(reviewAudits.filter((r) => r.calcVersion === calc.version).map((r) => r.teacherId)),
    [reviewAudits, calc.version]
  )

  const onStatusChange = (next: PayrollRunStatus, meta?: Partial<PayrollMonthMock>) => {
    setOverrides((prev) => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        status: next,
        ...meta,
      },
    }))
  }

  const onMonthChange = (value: string) => {
    setMonthKey(value)
    setReviewAudits([])
    setExcludedIds(new Set())
    setTeacherSubmits([])
    setCodyHours(null)
    setCodyStatus("missing")
  }

  const onSubmitTeacher = (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId)
    if (!t) return
    setTeacherSubmits((prev) => {
      const rest = prev.filter((s) => s.teacherId !== teacherId)
      return [
        ...rest,
        {
          teacherId,
          status: "submitted",
          submittedAt: new Date().toLocaleString("zh-HK"),
          submittedBy: "Cody Cheong（財務示範）",
        },
      ]
    })
    // 單人送核不鎖整月；財務可繼續審其他人。管理層佇列依 teacherSubmits 顯示。
  }

  const onResolveTeacherSubmit = (
    teacherId: string,
    next: "accepted" | "returned",
    note?: string
  ) => {
    setTeacherSubmits((prev) =>
      prev.map((s) =>
        s.teacherId === teacherId
          ? {
              ...s,
              status: next,
              returnNote: note,
            }
          : s
      )
    )
  }

  const onRecalc = () => {
    const now = new Date().toLocaleString("zh-HK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    setCalcByMonth((prev) => {
      const cur = prev[monthKey] ?? DEFAULT_CALC_META
      return {
        ...prev,
        [monthKey]: {
          version: cur.version + 1,
          computedAt: now,
          dataCutoffAt: now,
          previousVersion: cur.version,
          previousComputedAt: cur.computedAt,
        },
      }
    })
    setReviewAudits([])
  }

  const onToggleReviewed = (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId)
    if (!t) return
    setReviewAudits((prev) => {
      const existing = prev.find(
        (r) => r.teacherId === teacherId && r.calcVersion === calc.version
      )
      if (existing) {
        return prev.filter((r) => r !== existing)
      }
      return [
        ...prev,
        {
          teacherId,
          teacherName: t.name,
          reviewer: "Cody Cheong（財務示範）",
          reviewedAt: new Date().toLocaleString("zh-HK"),
          calcVersion: calc.version,
          scope: t.anomalies.length > 0 ? "已審核有異常／已知悉" : "已審核無異常",
          note: t.anomalies[0],
        },
      ]
    })
  }

  const monthSelect: ReactNode = (
    <Select
      aria-label="計糧月份"
      value={monthKey}
      onChange={(e) => onMonthChange(e.target.value)}
      className="w-full sm:w-56"
    >
      {PAYROLL_MONTH_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 space-y-3">
        <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-sm sm:px-4">
          <div className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-medium text-foreground">計糧 UI 沙盒（審計證據鏈 mock）</p>
              <p className="mt-1 text-muted-foreground">
                版本／截止、母名單、$0 人、跨模式、逐學生 HC、原價時點、Cody
                職責分離、已審審計、重算 diff、管理層抽查。不連 Supabase。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
          <label className="block min-w-[12rem]">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              預覽身份（非正式角色）
            </span>
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
            {previewRole === "finance"
              ? "財務：逐人審核 → 下載工資單 PDF → 可單人送核；缺點名可發提醒"
              : "管理層：收單人送核佇列 → 核准工時／調整 → 抽查 → 結算"}
          </p>
        </div>
      </div>

      {previewRole === "finance" ? (
        <FinancePayrollView
          month={month}
          status={status}
          teachers={teachers}
          adjustments={adjustments}
          reviewedIds={reviewedIds}
          reviewAudits={reviewAudits}
          excludedIds={excludedIds}
          onToggleReviewed={onToggleReviewed}
          onToggleExcluded={(id) =>
            setExcludedIds((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }
          onStatusChange={onStatusChange}
          onAddAdjustment={(adj) => setAdjustments((prev) => [adj, ...prev])}
          onCodyChange={(hours, st) => {
            setCodyHours(hours)
            setCodyStatus(st)
            if (st === "approved") {
              setExcludedIds((prev) => {
                const next = new Set(prev)
                next.delete("cody")
                return next
              })
            }
          }}
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
          onResolveAdjustment={(id, st, note) =>
            setAdjustments((prev) =>
              prev.map((a) =>
                a.id === id ? { ...a, status: st, reviewerNote: note } : a
              )
            )
          }
          onResolveTeacherSubmit={onResolveTeacherSubmit}
          onCodyApprove={(hours) => {
            setCodyHours(hours)
            setCodyStatus("approved")
            setExcludedIds((prev) => {
              const next = new Set(prev)
              next.delete("cody")
              return next
            })
          }}
          monthSelect={monthSelect}
        />
      )}
    </div>
  )
}
