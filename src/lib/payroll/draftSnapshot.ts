/**
 * 未結算計糧草稿快取：是否重用 payroll_runs.snapshot，以及 snapshot 形狀。
 * 結算凍結仍寫同一欄；讀取時以 run.status 分流。
 */

import type { PayrollRunStatus, PayrollTeacherRow } from "@/lib/payroll/viewTypes"

/** 財務審閱中：超過此時長的進頁會 live 重算。待管理層核實不套 TTL。 */
export const PAYROLL_DRAFT_SNAPSHOT_TTL_MS = 10 * 60 * 1000

export type LoadPayrollWorkbenchOptions = {
  /** 強制依最新點名／排程／工時重算（「重算」鈕、工時變更） */
  force?: boolean
  /** 審核／排除等不影響金額：有草稿就用，不理 TTL */
  preferDraft?: boolean
  /** 重算時遞增 calc_version */
  bumpVersion?: boolean
}

export function teachersFromPayrollSnapshot(
  snapshot: unknown
): PayrollTeacherRow[] | null {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null
  }
  const teachers = (snapshot as { teachers?: unknown }).teachers
  if (!Array.isArray(teachers) || teachers.length === 0) return null
  return teachers as PayrollTeacherRow[]
}

export function hardBlocksFromPayrollSnapshot(snapshot: unknown): string[] {
  if (snapshot == null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return []
  }
  const xs = (snapshot as { hardBlockAnomalies?: unknown }).hardBlockAnomalies
  if (!Array.isArray(xs)) return []
  return xs.filter((x): x is string => typeof x === "string")
}

export function formatPayrollCalcAt(iso: string | null | undefined): string {
  if (iso == null || iso === "") return "—"
  return iso.replace("T", " ").slice(0, 16)
}

export function shouldReusePayrollDraftSnapshot(args: {
  status: PayrollRunStatus | string
  hasTeachers: boolean
  calcAt: string | null
  nowMs: number
  force?: boolean
  preferDraft?: boolean
  ttlMs?: number
}): boolean {
  if (args.force) return false
  if (!args.hasTeachers) return false
  if (args.status === "已結算") return false
  if (args.status === "待管理層核實") return true
  if (args.preferDraft) return true
  if (args.calcAt == null || args.calcAt === "") return false
  const computedMs = Date.parse(args.calcAt)
  if (!Number.isFinite(computedMs)) return false
  const age = args.nowMs - computedMs
  if (age < 0) return false
  return age < (args.ttlMs ?? PAYROLL_DRAFT_SNAPSHOT_TTL_MS)
}

export function buildUnsettledPayrollSnapshot(args: {
  teachers: PayrollTeacherRow[]
  hardBlockAnomalies: string[]
  calcVersion: number
  computedAt: string
}): Record<string, unknown> {
  return {
    kind: "draft",
    teachers: args.teachers,
    hardBlockAnomalies: args.hardBlockAnomalies,
    calcVersion: args.calcVersion,
    computedAt: args.computedAt,
  }
}
