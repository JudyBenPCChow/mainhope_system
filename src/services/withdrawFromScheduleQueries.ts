import { formatClassScheduleLabel } from "@/lib/enrollmentStart"
import { supabase } from "@/lib/supabaseClient"
import { parseMakeupOfScheduleId } from "@/lib/scheduleMakeupMarkers"

export type WithdrawFromScheduleOption = {
 id: string
 scheduledDate: string
 label: string
 isMakeup: boolean
 isCancelled: boolean
}

/**
 * 退讀／轉時間「從哪一堂起不上」選項。
 * 含正常堂、已約補回堂、已取消堂（未約補回時可選取消堂＝其後補回也不上紙）。
 */
export async function fetchWithdrawFromScheduleOptions(
 classId: string
): Promise<WithdrawFromScheduleOption[]> {
 if (!supabase || !classId) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, start_time, end_time, status, remarks, session_number")
  .eq("class_id", classId)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error

 return (data ?? []).map((raw) => {
  const row = raw as {
   id: string
   scheduled_date: string
   start_time: string | null
   end_time: string | null
   status: string
   remarks: string | null
   session_number: number | null
  }
  const status = String(row.status ?? "")
  const isCancelled = status.includes("取消")
  const isMakeup = parseMakeupOfScheduleId(row.remarks) != null
  const base = formatClassScheduleLabel({
   session_number: row.session_number,
   scheduled_date: String(row.scheduled_date).slice(0, 10),
   start_time: row.start_time,
  })
  const tags = [isMakeup ? "補回" : null, isCancelled ? "已取消" : null].filter(Boolean)
  return {
   id: String(row.id),
   scheduledDate: String(row.scheduled_date).slice(0, 10),
   label: tags.length > 0 ? `${base}（${tags.join("・")}）` : base,
   isMakeup,
   isCancelled,
  }
 })
}
