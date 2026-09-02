import type { MonthRosterState } from "@/lib/homeworkTutoringUi"

export type HomeworkRosterStatusPersistInput = {
 previous: Record<string, MonthRosterState>
 yearMonth: string
 nextState: MonthRosterState
 classId: string | null
 rosterMonthId: string
 sheetMonth: string
 clearOccupancy: (classId: string, yearMonth: string) => Promise<void>
 setRosterStatus: (rosterMonthId: string, status: MonthRosterState) => Promise<void>
}

/** 先寫庫，成功後才回傳下一份編更狀態。失敗時拋錯，呼叫端不得更新畫面。 */
export async function applyHomeworkRosterStatusChange(
 input: HomeworkRosterStatusPersistInput
): Promise<Record<string, MonthRosterState>> {
 const prevState = input.previous[input.yearMonth]
 if (prevState === input.nextState) return input.previous

 if (input.nextState === "未編更") {
  if (!input.classId) throw new Error("尚未建立功課輔導班")
  await input.clearOccupancy(input.classId, input.yearMonth)
 }

 if (input.rosterMonthId && input.yearMonth === input.sheetMonth) {
  await input.setRosterStatus(input.rosterMonthId, input.nextState)
 }

 return { ...input.previous, [input.yearMonth]: input.nextState }
}
