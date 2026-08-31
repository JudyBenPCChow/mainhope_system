import { isSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import {
 listEnrollableAcademicYearLabels,
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

type AcademicYearRow = {
 id: string
 label: string
 is_current: boolean
 start_date: string | null
 end_date: string | null
}

async function loadAcademicYearRows(): Promise<AcademicYearRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_years")
  .select("id, label, is_current, start_date, end_date")
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   label: String(row.label ?? ""),
   is_current: Boolean(row.is_current),
   start_date: row.start_date != null ? String(row.start_date).slice(0, 10) : null,
   end_date: row.end_date != null ? String(row.end_date).slice(0, 10) : null,
  }
 })
}

function toWindowInputs(years: AcademicYearRow[]): AcademicYearWindowInput[] {
 return years.map((y) => ({
  label: y.label,
  is_current: y.is_current,
  start_date: y.start_date,
  end_date: y.end_date,
 }))
}

/**
 * 日常營運窗學年 id／日期界。flag 關閉或無學年時回 null（呼叫端唔篩）。
 */
export async function fetchOpsAcademicYearWindow(): Promise<OpsAcademicYearWindow | null> {
 if (!isSoftArchiveQueriesEnabled()) return null
 const years = await loadAcademicYearRows()
 const inputs = toWindowInputs(years)
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

/**
 * 新增報讀可選學年（不受軟封存 flag 影響）。
 * 目前學年；暑期目前時另含下一常規。
 */
export async function fetchEnrollableAcademicYearWindow(): Promise<{
 ids: string[]
 labels: string[]
} | null> {
 const years = await loadAcademicYearRows()
 const labels = listEnrollableAcademicYearLabels(toWindowInputs(years))
 if (labels.length === 0) return null
 const wanted = new Set(labels)
 const retained = years.filter((y) => wanted.has(y.label))
 if (retained.length === 0) return null
 return { ids: retained.map((y) => y.id), labels }
}

/** head count；失敗回 null（呼叫端當 0，唔空表）。 */
export async function headCountOrNull(
 query: PromiseLike<{ count: number | null; error: { message?: string } | null }>
): Promise<number | null> {
 try {
  const { count, error } = await query
  if (error) {
   console.warn("[softArchive hidden count]", error.message)
   return null
  }
  return count ?? 0
 } catch (e) {
  console.warn("[softArchive hidden count]", e)
  return null
 }
}
