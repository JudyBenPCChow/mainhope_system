import { useMemo, useState, type ReactNode } from "react"
import { FlaskConical } from "lucide-react"

import { Select } from "@/components/ui/select"

import { FinancePayrollView } from "./FinancePayrollView"
import { ManagerPayrollView } from "./ManagerPayrollView"
import {
  PAYROLL_MOCK_BY_MONTH,
  PAYROLL_MONTH_OPTIONS,
  withMpf,
  withWfhApplied,
  type ManualAdjustment,
  type PayrollMonthMock,
  type PayrollPreviewRole,
  type PayrollRunStatus,
  type PayrollTeacherRow,
  type WfhMockState,
} from "./mockData"

export function PayrollPrototypeView() {
  const [previewRole, setPreviewRole] = useState<PayrollPreviewRole>("finance")
  const [monthKey, setMonthKey] = useState("2026-08")
  const [overrides, setOverrides] = useState<
    Record<string, { status: PayrollRunStatus } & Partial<PayrollMonthMock>>
  >({})
  const [codyHours, setCodyHours] = useState<number | null>(null)
  const [codyStatus, setCodyStatus] = useState<WfhMockState["status"]>("missing")
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([])
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => new Set())
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set())

  const base = PAYROLL_MOCK_BY_MONTH[monthKey] ?? PAYROLL_MOCK_BY_MONTH["2026-08"]

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
    }
  }, [base, monthKey, overrides, teachers])

  const status = month.status

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
    setReviewedIds(new Set())
    setExcludedIds(new Set())
    setCodyHours(null)
    setCodyStatus("missing")
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
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 space-y-3">
        <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-sm sm:px-4">
          <div className="flex items-start gap-2">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-medium text-foreground">計糧 UI 沙盒（示範資料 · 雙角色）</p>
              <p className="mt-1 text-muted-foreground">
                含齊備度、逐人已審、硬阻擋排除、Cody 工時、分成原價池、代堂跳轉、調整核准鏈。不連
                Supabase。
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
              ? "財務：齊備度 → 異常 → 逐人已審 → 提交核實"
              : "管理層：核准調整 → 摘要核實 → 退回／結算"}
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
          excludedIds={excludedIds}
          onToggleReviewed={(id) =>
            setReviewedIds((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }
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
          monthSelect={monthSelect}
        />
      ) : (
        <ManagerPayrollView
          month={month}
          status={status}
          teachers={teachers}
          adjustments={adjustments}
          excludedIds={excludedIds}
          onStatusChange={onStatusChange}
          onResolveAdjustment={(id, st, note) =>
            setAdjustments((prev) =>
              prev.map((a) =>
                a.id === id ? { ...a, status: st, reviewerNote: note } : a
              )
            )
          }
          monthSelect={monthSelect}
        />
      )}
    </div>
  )
}
