import { isSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import {
 listRetainedAcademicYearLabels,
 opsWindowDateBounds,
 type AcademicYearWindowInput,
} from "@/lib/softArchiveWindow"
import { supabase } from "@/lib/supabaseClient"

export type OpsAcademicYearWindow = {
 ids: string[]
 labels: string[]
 startYmd: string | null
 endYmd: string | null
}

/**
 * 日常營運窗學年 id／日期界。flag 關閉或無學年時回 null（呼叫端唔篩）。
 */
export async function fetchOpsAcademicYearWindow(): Promise<OpsAcademicYearWindow | null> {
 if (!isSoftArchiveQueriesEnabled()) return null
 if (!supabase) return null
 const { data, error } = await supabase
  .from("academic_years")
  .select("id, label, is_current, start_date, end_date")
 if (error) throw error
 const years = (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   label: String(row.label ?? ""),
   is_current: Boolean(row.is_current),
   start_date: row.start_date != null ? String(row.start_date).slice(0, 10) : null,
   end_date: row.end_date != null ? String(row.end_date).slice(0, 10) : null,
  }
 })
 const inputs: AcademicYearWindowInput[] = years.map((y) => ({
  label: y.label,
  is_current: y.is_current,
  start_date: y.start_date,
  end_date: y.end_date,
 }))
 const labels = listRetainedAcademicYearLabels(inputs, "ops")
 if (labels.length === 0) return null
 const wanted = new Set(labels)
 const retained = years.filter((y) => wanted.has(y.label))
 if (retained.length === 0) return null
 const bounds = opsWindowDateBounds(inputs, labels)
 return {
  ids: retained.map((y) => y.id),
  labels,
  startYmd: bounds.startYmd,
  endYmd: bounds.endYmd,
 }
}
