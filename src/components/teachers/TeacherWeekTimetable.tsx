import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { classDisplayName } from "@/lib/courseLabel"
import {
 intervalsOverlapMinutes,
 LESSON_SLOT_DURATION_MIN,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
 parseHm,
} from "@/lib/lessonSlots"
import {
 formatWeekTimetableStudentLine,
 weekTimetableCardClassName,
 weekTimetableCardKind,
} from "@/lib/weekTimetableCard"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import { addDaysYmd, localYmd, type ScheduleRow } from "@/services/teacherQueries"

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const

/** 週視圖共用：老師詳情 / 老師首頁 / 時間表頁 */
export type WeekTimetableItem = {
 id: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 status: string
 subject: string
 courseCode: string | null
 classroomName: string | null
 hasTeachingNotes: boolean
 isExtraLesson: boolean
 /** null＝點名冊尚未載入，不標空班灰底 */
 enrollCount: number | null
 /** null＝點名冊姓名尚未載入 */
 studentNames: string[] | null
}

export function weekItemsFromTeacherScheduleRows(rows: ScheduleRow[]): WeekTimetableItem[] {
 return rows.map((r) => ({
  id: r.id,
  scheduledDate: r.scheduledDate,
  startTime: r.startTime,
  endTime: r.endTime,
  status: r.status,
  subject: classDisplayName({ subject: r.subject, courseName: r.courseName }),
  courseCode: r.courseCode,
  classroomName: r.classroomName,
  hasTeachingNotes: Boolean(r.teachingNotes?.trim()),
  isExtraLesson: r.isExtraLesson,
  enrollCount: r.enrollCount,
  studentNames: r.studentNames,
 }))
}

export function weekItemsFromManageRows(rows: ScheduleManageRow[]): WeekTimetableItem[] {
 return rows.map((r) => ({
  id: r.id,
  scheduledDate: r.scheduled_date,
  startTime: r.start_time,
  endTime: r.end_time,
  status: r.status,
  subject: classDisplayName({ subject: r.subject, courseName: r.course_name }),
  courseCode: r.course_code_full,
  classroomName: r.classroom_name,
  hasTeachingNotes: Boolean(r.teaching_notes?.trim()),
  isExtraLesson: r.is_extra_lesson,
  enrollCount: r.enrollCount,
  studentNames: r.studentNames ?? null,
 }))
}

function mondayYmdOfWeekContaining(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const dow = dt.getDay()
 const diff = dow === 0 ? -6 : 1 - dow
 dt.setDate(dt.getDate() + diff)
 return localYmd(dt)
}

function scheduleOverlapsSlot(s: WeekTimetableItem, dateYmd: string, slotIndex: number): boolean {
 if (s.scheduledDate !== dateYmd) return false
 const a = parseHm(s.startTime)
 if (a == null) return false
 let b = parseHm(s.endTime)
 if (b == null) b = a + LESSON_SLOT_DURATION_MIN
 if (b <= a) b = a + LESSON_SLOT_DURATION_MIN
 const s0 = lessonSlotStartMinute(slotIndex)
 const s1 = lessonSlotEndMinute(slotIndex)
 return intervalsOverlapMinutes(a, b, s0, s1)
}

function formatWeekTitle(mondayYmd: string): string {
 const end = addDaysYmd(mondayYmd, 6)
 const [y1, m1, d1] = mondayYmd.split("-").map(Number)
 const [, m2, d2] = end.split("-").map(Number)
 return `${y1} 年 ${m1} 月 ${d1} 日 — ${m2} 月 ${d2} 日`
}

type Props = {
 items: WeekTimetableItem[]
 /** 目前已載入的日期下界（含） */
 loadedFromYmd?: string
 /** 目前已載入的日期上界（含） */
 loadedToYmd?: string
 rangeExtending?: boolean
 onRequestLoadEarlier?: () => void | Promise<void>
 onRequestLoadLater?: () => void | Promise<void>
}

function LessonCard({ item, compact }: { item: WeekTimetableItem; compact: boolean }) {
 const kind = weekTimetableCardKind(item)
 const time = `${item.startTime ?? "—"}–${item.endTime ?? "—"}`
 const room = item.classroomName?.trim() ? item.classroomName : "課室未定"
 const nameLine = formatWeekTimetableStudentLine(item.studentNames, compact)
 const nameTitle =
  item.studentNames && item.studentNames.length > 0 ? item.studentNames.join("、") : undefined
 const metaCls = compact
  ? "text-[0.6rem] opacity-80 md:text-[0.65rem]"
  : "mt-0.5 text-sm opacity-80"
 return (
  <Link to={`/Schedule/${item.id}`} className={weekTimetableCardClassName(kind, compact)}>
   {item.courseCode ? (
    <div className={compact ? "font-mono text-[0.6rem] opacity-80 md:text-[0.65rem]" : "font-mono text-xs opacity-80"}>
     {item.courseCode}
    </div>
   ) : null}
   <div className="font-semibold">{item.subject}</div>
   <div className={compact ? "tabular-nums opacity-80" : "mt-0.5 tabular-nums text-sm opacity-80"}>
    {time}
   </div>
   {nameLine ? (
    <div className={metaCls} title={nameTitle}>
     {nameLine}
    </div>
   ) : null}
   <div className={metaCls}>{room}</div>
  </Link>
 )
}

export function TeacherWeekTimetable({
 items,
 loadedFromYmd,
 loadedToYmd,
 rangeExtending,
 onRequestLoadEarlier,
 onRequestLoadLater,
}: Props) {
 const isMobile = useIsMobile()
 const [weekMondayYmd, setWeekMondayYmd] = useState(() => mondayYmdOfWeekContaining(localYmd()))
 const [pickerYmd, setPickerYmd] = useState(() => localYmd())

 const columnDates = useMemo(
  () => Array.from({ length: 7 }, (_, i) => addDaysYmd(weekMondayYmd, i)),
  [weekMondayYmd]
 )

 const weekEndYmd = useMemo(() => addDaysYmd(weekMondayYmd, 6), [weekMondayYmd])
 const needEarlier =
  loadedFromYmd != null && weekMondayYmd < loadedFromYmd && Boolean(onRequestLoadEarlier)
 const needLater =
  loadedToYmd != null && weekEndYmd > loadedToYmd && Boolean(onRequestLoadLater)

 const slotMatches = useMemo(() => {
  const grid = new Map<string, WeekTimetableItem[]>()
  for (const slot of LESSON_SLOT_INDICES) {
   for (let col = 0; col < 7; col++) {
    const dateYmd = addDaysYmd(weekMondayYmd, col)
    const key = `${slot}-${col}`
    const list = items.filter((s) => scheduleOverlapsSlot(s, dateYmd, slot))
    grid.set(key, list)
   }
  }
  return grid
 }, [items, weekMondayYmd])

 const dayGroups = useMemo(() => {
  return columnDates.map((ymd, i) => {
   const dayItems = items
    .filter((s) => s.scheduledDate === ymd)
    .slice()
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))
   return { ymd, weekday: WEEKDAY_LABELS[i], items: dayItems }
  })
 }, [columnDates, items])

 const weekGridColPct = useMemo(() => {
  const timePct = 10
  const each = (100 - timePct) / 7
  return { timePct, each }
 }, [])

 const goPrevWeek = () => {
  const nextMonday = addDaysYmd(weekMondayYmd, -7)
  if (loadedFromYmd && nextMonday < loadedFromYmd && onRequestLoadEarlier) {
   void Promise.resolve(onRequestLoadEarlier()).then(() => setWeekMondayYmd(nextMonday))
   return
  }
  setWeekMondayYmd(nextMonday)
 }
 const goNextWeek = () => {
  const nextMonday = addDaysYmd(weekMondayYmd, 7)
  const nextEnd = addDaysYmd(nextMonday, 6)
  if (loadedToYmd && nextEnd > loadedToYmd && onRequestLoadLater) {
   void Promise.resolve(onRequestLoadLater()).then(() => setWeekMondayYmd(nextMonday))
   return
  }
  setWeekMondayYmd(nextMonday)
 }

 const applyPicker = () => {
  const monday = mondayYmdOfWeekContaining(pickerYmd)
  const end = addDaysYmd(monday, 6)
  const tasks: Promise<void>[] = []
  if (loadedFromYmd && monday < loadedFromYmd && onRequestLoadEarlier) {
   tasks.push(Promise.resolve(onRequestLoadEarlier()))
  }
  if (loadedToYmd && end > loadedToYmd && onRequestLoadLater) {
   tasks.push(Promise.resolve(onRequestLoadLater()))
  }
  void Promise.all(tasks).then(() => setWeekMondayYmd(monday))
 }

 return (
  <div className="mx-auto max-w-[110rem] space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-2">
     <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={goPrevWeek}
      disabled={rangeExtending}
      aria-label="上一週"
     >
      <ChevronLeft className="h-4 w-4" />
     </Button>
     <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={goNextWeek}
      disabled={rangeExtending}
      aria-label="下一週"
     >
      <ChevronRight className="h-4 w-4" />
     </Button>
     <h2 className="text-base font-semibold text-foreground md:text-lg">
      {formatWeekTitle(weekMondayYmd)}
     </h2>
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <label className="text-sm text-muted-foreground">跳至日期</label>
     <Input
      type="date"
      className="w-auto min-w-[10.5rem]"
      value={pickerYmd}
      onChange={(e) => setPickerYmd(e.target.value)}
     />
     <Button type="button" variant="secondary" size="sm" onClick={applyPicker} disabled={rangeExtending}>
      顯示該週
     </Button>
    </div>
   </div>

   <p className="text-sm text-muted-foreground">
    {isMobile
     ? "按日列出本週課堂；點卡片可開啟排程詳情。"
     : "橫軸為本週一至日；直軸為預設堂數格（每格 75 分鐘）。點卡片可開啟排程詳情。"}
    {rangeExtending ? " 正在載入更多課堂…" : null}
   </p>
   <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <li className="inline-flex items-center gap-1.5">
     <span className="h-2.5 w-2.5 rounded-sm bg-success/40 ring-1 ring-success/50" aria-hidden />
     有學生
    </li>
    <li className="inline-flex items-center gap-1.5">
     <span className="h-2.5 w-2.5 rounded-sm bg-muted ring-1 ring-border" aria-hidden />
     尚無學生
    </li>
    <li className="inline-flex items-center gap-1.5">
     <span className="h-2.5 w-2.5 rounded-sm bg-warning/40 ring-1 ring-warning/50" aria-hidden />
     加堂
    </li>
    <li className="inline-flex items-center gap-1.5">
     <span className="h-2.5 w-2.5 rounded-sm bg-destructive/40 ring-1 ring-destructive/50" aria-hidden />
     已取消
    </li>
   </ul>

   {(needEarlier || needLater) && !rangeExtending ? (
    <div className="flex flex-wrap gap-2">
     {needEarlier ? (
      <Button type="button" variant="outline" size="sm" onClick={() => void onRequestLoadEarlier?.()}>
       載入更早的課堂
      </Button>
     ) : null}
     {needLater ? (
      <Button type="button" variant="outline" size="sm" onClick={() => void onRequestLoadLater?.()}>
       載入更晚的課堂
      </Button>
     ) : null}
    </div>
   ) : null}

   {isMobile ? (
    <div className="space-y-5">
     {dayGroups.map((group) => (
      <div key={group.ymd}>
       <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        週{group.weekday}
        <span className="ml-2 font-normal tabular-nums">{group.ymd}</span>
       </h3>
       {group.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
         沒有排程
        </p>
       ) : (
        <ul className="space-y-2">
         {group.items.map((s) => (
          <li key={s.id}>
           <LessonCard item={s} compact={false} />
          </li>
         ))}
        </ul>
       )}
      </div>
     ))}
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-xs md:text-sm">
      <colgroup>
       <col style={{ width: `${weekGridColPct.timePct}%` }} />
       {columnDates.map((ymd) => (
        <col key={ymd} style={{ width: `${weekGridColPct.each}%` }} />
       ))}
      </colgroup>
      <thead>
       <tr>
        <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/90 px-2 py-2 font-medium text-muted-foreground">
         節次
        </th>
        {columnDates.map((ymd, i) => (
         <th
          key={ymd}
          className="min-w-0 border-b border-border bg-muted/60 px-1.5 py-2 text-center font-medium leading-tight"
         >
          <div className="text-muted-foreground">週{WEEKDAY_LABELS[i]}</div>
          <div className="tabular-nums text-foreground">{ymd.slice(5).replace("-", "/")}</div>
         </th>
        ))}
       </tr>
      </thead>
      <tbody>
       {LESSON_SLOT_INDICES.map((slot) => (
        <tr key={slot}>
         <th className="sticky left-0 z-10 border-b border-r border-border bg-muted/40 px-2 py-1.5 text-xs font-medium tabular-nums text-muted-foreground md:text-sm">
          {lessonSlotLabel(slot)}
         </th>
         {columnDates.map((ymd, col) => {
          const key = `${slot}-${col}`
          const list = slotMatches.get(key) ?? []
          return (
           <td
            key={`${slot}-${ymd}`}
            className="border-b border-border bg-background/80 p-1 align-top"
           >
            <div className="flex min-h-[3.25rem] flex-col gap-1">
             {list.length === 0 ? (
              <span className="block min-h-[2rem] text-[0.65rem] text-muted-foreground/40 md:text-xs">
               —
              </span>
             ) : (
              list.map((s) => <LessonCard key={s.id} item={s} compact />)
             )}
            </div>
           </td>
          )
         })}
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}
  </div>
 )
}
