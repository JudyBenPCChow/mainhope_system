/**
 * 營運總覽用：只讀未結算 payroll_runs.snapshot，唔重算、唔寫 calc_at。
 */
import { applyApprovedPayrollAdjustments, sumEstimatedTutorLabor } from "@/lib/payroll/laborEstimate"
import { teachersFromPayrollSnapshot } from "@/lib/payroll/draftSnapshot"
import type { ManualAdjustment } from "@/lib/payroll/viewTypes"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export async function fetchUnsettledPayrollLaborByMonth(
  monthKeys: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (monthKeys.length === 0 || !isSupabaseConfigured || !supabase) return out

  const unique = [...new Set(monthKeys.filter((k) => /^\d{4}-\d{2}$/.test(k)))]
  if (unique.length === 0) return out

  const { data, error } = await supabase
    .from("payroll_runs")
    .select("id, month_key, status, snapshot")
    .in("month_key", unique)
  if (error) throw new Error(error.message)

  const unsettled = ((data ?? []) as Record<string, unknown>[]).filter((row) => {
    const status = String(row.status ?? "")
    return status !== "已結算" && teachersFromPayrollSnapshot(row.snapshot) != null
  })
  if (unsettled.length === 0) return out

  const runIds = unsettled.map((row) => String(row.id))
  const excludedByRun = new Map<string, Set<string>>()
  const adjustmentsByRun = new Map<string, ManualAdjustment[]>()

  await forEachIdChunk(runIds, DEFAULT_ID_CHUNK, async (slice) => {
    const [{ data: states, error: statesErr }, { data: adjs, error: adjErr }] = await Promise.all([
      supabase!.from("payroll_teacher_states").select("run_id, teacher_id, excluded").in("run_id", slice),
      supabase!.from("payroll_adjustments").select("*").in("run_id", slice),
    ])
    if (statesErr) throw new Error(statesErr.message)
    if (adjErr) throw new Error(adjErr.message)

    for (const row of (states ?? []) as Record<string, unknown>[]) {
      if (!row.excluded) continue
      const runId = String(row.run_id)
      const set = excludedByRun.get(runId) ?? new Set<string>()
      set.add(String(row.teacher_id))
      excludedByRun.set(runId, set)
    }
    for (const row of (adjs ?? []) as Record<string, unknown>[]) {
      const runId = String(row.run_id)
      const list = adjustmentsByRun.get(runId) ?? []
      list.push({
        id: String(row.id),
        teacherId: String(row.teacher_id),
        teacherName: "",
        fromAmount: row.from_amount == null ? null : Number(row.from_amount),
        toAmount: Number(row.to_amount),
        reason: String(row.reason ?? ""),
        createdBy: String(row.created_by ?? ""),
        createdAt: String(row.created_at ?? ""),
        status: String(row.status) as ManualAdjustment["status"],
      })
      adjustmentsByRun.set(runId, list)
    }
    return null
  })

  for (const row of unsettled) {
    const runId = String(row.id)
    const monthKey = String(row.month_key)
    const teachers = teachersFromPayrollSnapshot(row.snapshot)
    if (!teachers) continue
    const withAdj = applyApprovedPayrollAdjustments(teachers, adjustmentsByRun.get(runId) ?? [])
    out.set(
      monthKey,
      sumEstimatedTutorLabor({
        teachers: withAdj,
        excludedTeacherIds: excludedByRun.get(runId) ?? new Set(),
      })
    )
  }
  return out
}
