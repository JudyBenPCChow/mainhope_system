import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, DoorOpen, Search, UserRound } from "lucide-react"

import { StudentClassificationTags } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 formatMin,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import { fetchTeacherOptions, insertScheduleForClass } from "@/services/classQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import {
 fetchPrivateClassSchedules,
 fetchPrivateTutoringStudents,
 type PrivateTutoringStudentRow,
} from "@/services/privateTutoringQueries"
import {
 fetchRoomCalendarBundle,
 occupiersForSlot,
 slotIsFreeForBooking,
} from "@/services/roomBookingQueries"
import { localYmd } from "@/services/scheduleQueries"

type Tab = "students" | "rooms"

const REGISTRATION_FILTERS = [
 { key: "all", label: "全部" },
 { key: "已註冊", label: "已註冊" },
 { key: "非注冊", label: "非注冊" },
] as const

const ACTIVITY_FILTERS = [
 { key: "all", label: "全部" },
 { key: "活躍生", label: "活躍生" },
 { key: "非活躍生", label: "非活躍生" },
] as const

function weekdayLabel(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const w = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()]
 return `週${w}`
}

export function PrivateTutoringView() {
 const { pushBanner } = useAppBanner()
 const [tab, setTab] = useState<Tab>("students")
 const [rows, setRows] = useState<PrivateTutoringStudentRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [search, setSearch] = useState("")
 const [regFilter, setRegFilter] = useState<(typeof REGISTRATION_FILTERS)[number]["key"]>("all")
 const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]["key"]>("all")

 const [roomDate, setRoomDate] = useState(() => localYmd())
 const [roomSlotIdx, setRoomSlotIdx] = useState(0)
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomSchedules, setRoomSchedules] = useState<Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["schedules"]>([])
 const [roomPending, setRoomPending] = useState<Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["pending"]>([])
 const [roomLoading, setRoomLoading] = useState(false)

 const [bookOpen, setBookOpen] = useState(false)
 const [bookRow, setBookRow] = useState<PrivateTutoringStudentRow | null>(null)
 const [bookDate, setBookDate] = useState("")
 const [bookSlotIdx, setBookSlotIdx] = useState(0)
 const [bookRoomId, setBookRoomId] = useState("")
 const [bookTeacherId, setBookTeacherId] = useState("")
 const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([])
 const [bookSaving, setBookSaving] = useState(false)
 const [bookErr, setBookErr] = useState<string | null>(null)
 const [upcomingSchedules, setUpcomingSchedules] = useState<Awaited<ReturnType<typeof fetchPrivateClassSchedules>>>([])

 const reloadStudents = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   setRows(await fetchPrivateTutoringStudents())
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.reloadStudents", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 const reloadRooms = useCallback(async () => {
  if (!isSupabaseConfigured || !roomDate) return
  setRoomLoading(true)
  try {
   const bundle = await fetchRoomCalendarBundle(roomDate, roomDate)
   setRooms(bundle.rooms)
   setRoomSchedules(bundle.schedules)
   setRoomPending(bundle.pending)
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.reloadRooms" })
  } finally {
   setRoomLoading(false)
  }
 }, [roomDate])

 useEffect(() => {
  void reloadStudents()
 }, [reloadStudents])

 useEffect(() => {
  if (tab === "rooms") void reloadRooms()
 }, [tab, reloadRooms])

 useEffect(() => {
  void fetchTeacherOptions().then(setTeacherOptions).catch(() => setTeacherOptions([]))
 }, [])

 const filteredRows = useMemo(() => {
  const q = search.trim().toLowerCase()
  return rows.filter((r) => {
   if (regFilter !== "all" && r.registrationStatus !== regFilter) return false
   if (activityFilter !== "all" && r.activityStatus !== activityFilter) return false
   if (!q) return true
   return (
    r.fullName.toLowerCase().includes(q) ||
    r.studentCode.toLowerCase().includes(q) ||
    r.classSubject.toLowerCase().includes(q) ||
    (r.teacherName ?? "").toLowerCase().includes(q)
   )
  })
 }, [rows, search, regFilter, activityFilter])

 const activeRooms = useMemo(
  () => classroomsActiveOnDate(rooms.filter((r) => !r.is_online), roomDate),
  [rooms, roomDate]
 )

 const roomSlotStart = lessonSlotStartMinute(roomSlotIdx)
 const roomSlotEnd = lessonSlotEndMinute(roomSlotIdx)

 const roomStatuses = useMemo(() => {
  return activeRooms.map((room) => {
   const occupiers = occupiersForSlot(
    roomDate,
    room.id,
    roomSlotStart,
    roomSlotEnd,
    roomSchedules,
    roomPending
   )
   return { room, free: occupiers.length === 0, occupiers }
  })
 }, [activeRooms, roomDate, roomSlotStart, roomSlotEnd, roomSchedules, roomPending])

 const freeRoomIdsForBook = useMemo(() => {
  if (!bookDate) return new Set<string>()
  const slotStart = lessonSlotStartMinute(bookSlotIdx)
  const slotEnd = lessonSlotEndMinute(bookSlotIdx)
  const active = classroomsActiveOnDate(rooms.filter((r) => !r.is_online), bookDate)
  return new Set(
   active
    .filter(
     (room) =>
      occupiersForSlot(bookDate, room.id, slotStart, slotEnd, roomSchedules, roomPending).length ===
      0
    )
    .map((r) => r.id)
  )
 }, [bookDate, bookSlotIdx, rooms, roomSchedules, roomPending])

 const bookActiveRooms = useMemo(
  () => classroomsActiveOnDate(rooms.filter((r) => !r.is_online), bookDate),
  [rooms, bookDate]
 )

 const openBookDialog = useCallback(
  async (row: PrivateTutoringStudentRow) => {
   setBookRow(row)
   setBookDate(localYmd())
   setBookSlotIdx(0)
   setBookRoomId("")
   setBookTeacherId(row.teacherId ?? "")
   setBookErr(null)
   setBookOpen(true)
   try {
    const [schedules, bundle] = await Promise.all([
     fetchPrivateClassSchedules(row.classId),
     fetchRoomCalendarBundle(localYmd(), localYmd()),
    ])
    setUpcomingSchedules(schedules)
    setRooms(bundle.rooms)
    setRoomSchedules(bundle.schedules)
    setRoomPending(bundle.pending)
   } catch {
    setUpcomingSchedules([])
   }
  },
  []
 )

 const onBookDateChange = useCallback(async (ymd: string) => {
  setBookDate(ymd)
  setBookRoomId("")
  if (!ymd) return
  try {
   const bundle = await fetchRoomCalendarBundle(ymd, ymd)
   setRooms(bundle.rooms)
   setRoomSchedules(bundle.schedules)
   setRoomPending(bundle.pending)
  } catch {
   /* ignore */
  }
 }, [])

 const submitBooking = useCallback(async () => {
  if (!bookRow || !bookDate || !bookRoomId) {
   setBookErr("請選擇日期與課室")
   return
  }
  const startTime = formatMin(lessonSlotStartMinute(bookSlotIdx))
  const endTime = formatMin(lessonSlotEndMinute(bookSlotIdx))
  setBookSaving(true)
  setBookErr(null)
  try {
   const free = await slotIsFreeForBooking({
    classroomId: bookRoomId,
    scheduledDate: bookDate,
    startTime,
    endTime,
   })
   if (!free) {
    setBookErr("此課室在該時段已被佔用（含小組課與待審約房），請另選課室或時段")
    return
   }
   await insertScheduleForClass(bookRow.classId, bookTeacherId || bookRow.teacherId, {
    scheduled_date: bookDate,
    start_time: startTime,
    end_time: endTime,
    classroom_id: bookRoomId,
    status: "正常",
   })
   pushBanner({
    tone: "success",
    title: "已建立預約",
    message: `${bookRow.fullName} · ${bookDate} ${lessonSlotLabel(bookSlotIdx)}`,
   })
   setBookOpen(false)
   void reloadStudents()
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.submitBooking", setErr: setBookErr })
  } finally {
   setBookSaving(false)
  }
 }, [bookRow, bookDate, bookRoomId, bookSlotIdx, bookTeacherId, pushBanner, reloadStudents])

 return (
  <div className="space-y-6 p-4 md:p-6">
   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="text-xl font-semibold text-foreground">一對一學生</h1>
     <p className="mt-1 text-sm text-muted-foreground">
      管理一對一／單對單課程學生，查詢課室空檔並建立預約（與小組課共用課室，自動檢查衝突）。
     </p>
    </div>
   </div>

   <div className="flex gap-2 border-b border-border pb-1">
    <Button
     type="button"
     variant={tab === "students" ? "default" : "ghost"}
     size="sm"
     onClick={() => setTab("students")}
    >
     <UserRound className="mr-1.5 h-4 w-4" />
     學生列表
    </Button>
    <Button
     type="button"
     variant={tab === "rooms" ? "default" : "ghost"}
     size="sm"
     onClick={() => setTab("rooms")}
    >
     <DoorOpen className="mr-1.5 h-4 w-4" />
     查空房
    </Button>
   </div>

   {tab === "students" && (
    <div className="space-y-4">
     <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="relative min-w-[12rem] flex-1">
       <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
       <Input
        className="pl-9"
        placeholder="搜尋姓名、學號、科目、老師…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
       />
      </div>
      <Select
       value={regFilter}
       onChange={(e) => setRegFilter(e.target.value as (typeof REGISTRATION_FILTERS)[number]["key"])}
      >
       {REGISTRATION_FILTERS.map((f) => (
        <option key={f.key} value={f.key}>
         {f.label}
        </option>
       ))}
      </Select>
      <Select
       value={activityFilter}
       onChange={(e) => setActivityFilter(e.target.value as (typeof ACTIVITY_FILTERS)[number]["key"])}
      >
       {ACTIVITY_FILTERS.map((f) => (
        <option key={f.key} value={f.key}>
         {f.label}
        </option>
       ))}
      </Select>
     </div>

     {err && (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
       {err}
      </div>
     )}

     {loading ? (
      <p className="text-sm text-muted-foreground">載入中…</p>
     ) : filteredRows.length === 0 ? (
      <p className="text-sm text-muted-foreground">沒有符合條件的一對一學生。</p>
     ) : (
      <div className="overflow-x-auto rounded-lg border border-border">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
          <th className="w-[14%] px-3 py-2 font-medium">學生</th>
          <th className="w-[8%] px-3 py-2 font-medium">學號</th>
          <th className="w-[8%] px-3 py-2 font-medium">年級</th>
          <th className="w-[22%] px-3 py-2 font-medium">一對一班別</th>
          <th className="w-[10%] px-3 py-2 font-medium">老師</th>
          <th className="w-[18%] px-3 py-2 font-medium">狀態</th>
          <th className="w-[8%] px-3 py-2 font-medium">待上堂</th>
          <th className="w-[12%] px-3 py-2 font-medium">操作</th>
         </tr>
        </thead>
        <tbody>
         {filteredRows.map((r) => (
          <tr key={r.enrollmentId} className="border-b border-border/60 last:border-0">
           <td className="min-w-0 truncate px-3 py-2">
            <Link
             to={`/Students/${r.studentId}`}
             className="font-medium text-primary hover:underline"
             title={r.fullName}
            >
             {r.fullName}
            </Link>
           </td>
           <td className="px-3 py-2 font-mono text-xs">{r.studentCode}</td>
           <td className="min-w-0 truncate px-3 py-2" title={r.grade ?? ""}>
            {r.grade ?? "—"}
           </td>
           <td className="min-w-0 truncate px-3 py-2" title={r.classSubject}>
            {r.classSubject}
           </td>
           <td className="min-w-0 truncate px-3 py-2" title={r.teacherName ?? ""}>
            {r.teacherName ?? "—"}
           </td>
           <td className="px-3 py-2">
            <StudentClassificationTags
             student={{
              registration_status: r.registrationStatus as "已註冊" | "非注冊",
              enrollment_status: r.enrollmentStatus as "在讀" | "非在讀",
              activity_status: r.activityStatus as "活躍生" | "非活躍生",
              academic_stage: r.academicStage as "中學階段" | "已畢業",
             }}
             compact
             size="sm"
            />
           </td>
           <td className="px-3 py-2 text-center">
            {r.upcomingLessonCount > 0 ? (
             <Tag tone="info">{r.upcomingLessonCount}</Tag>
            ) : (
             <span className="text-muted-foreground">0</span>
            )}
           </td>
           <td className="px-3 py-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void openBookDialog(r)}>
             <CalendarClock className="mr-1 h-3.5 w-3.5" />
             預約上堂
            </Button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
     <p className="text-xs text-muted-foreground">
      共 {filteredRows.length} 筆（全部 {rows.length} 筆一對一在讀報讀）
     </p>
    </div>
   )}

   {tab === "rooms" && (
    <div className="space-y-4">
     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">日期</label>
       <Input type="date" value={roomDate} onChange={(e) => setRoomDate(e.target.value)} />
      </div>
      <div className="min-w-[10rem] space-y-1">
       <label className="text-xs text-muted-foreground">時段</label>
       <Select value={String(roomSlotIdx)} onChange={(e) => setRoomSlotIdx(Number(e.target.value))}>
        {LESSON_SLOT_INDICES.map((i) => (
         <option key={i} value={String(i)}>
          {lessonSlotLabel(i)}
         </option>
        ))}
       </Select>
      </div>
      <p className="text-sm text-muted-foreground sm:pb-2">
       {roomDate ? `${roomDate}（${weekdayLabel(roomDate)}）` : ""} · {lessonSlotLabel(roomSlotIdx)}
      </p>
     </div>

     {roomLoading ? (
      <p className="text-sm text-muted-foreground">載入課室狀態…</p>
     ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       {roomStatuses.map(({ room, free, occupiers }) => (
        <div
         key={room.id}
         className={cn(
          "rounded-lg border px-4 py-3",
          free ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
         )}
        >
         <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{room.name}</span>
          <Tag tone={free ? "success" : "warning"}>{free ? "空房" : "已佔用"}</Tag>
         </div>
         {!free && (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
           {occupiers.map((o) => (
            <li key={`${o.kind}-${o.id}`} className="truncate" title={o.label}>
             {o.label}
             {o.teacherName ? ` · ${o.teacherName}` : ""}
             {o.statusNote ? `（${o.statusNote}）` : ""}
            </li>
           ))}
          </ul>
         )}
        </div>
       ))}
      </div>
     )}
     <p className="text-xs text-muted-foreground">
      空房判斷包含所有小組課排程與待審批的約房申請，與老師預約空房頁面使用同一套邏輯。
     </p>
    </div>
   )}

   <Dialog open={bookOpen} onOpenChange={setBookOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>預約上堂</DialogTitle>
     </DialogHeader>
     {bookRow && (
      <div className="space-y-4">
       <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <p className="font-medium">{bookRow.fullName}</p>
        <p className="text-muted-foreground">{bookRow.classSubject}</p>
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">上課日期</label>
        <Input type="date" value={bookDate} onChange={(e) => void onBookDateChange(e.target.value)} />
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">時段</label>
        <Select
         value={String(bookSlotIdx)}
         onChange={(e) => {
          setBookSlotIdx(Number(e.target.value))
          setBookRoomId("")
         }}
        >
         {LESSON_SLOT_INDICES.map((i) => (
          <option key={i} value={String(i)}>
           {lessonSlotLabel(i)}
          </option>
         ))}
        </Select>
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">課室（僅顯示空房）</label>
        <Select value={bookRoomId} onChange={(e) => setBookRoomId(e.target.value)}>
         <option value="">選擇課室</option>
         {bookActiveRooms
          .filter((r) => freeRoomIdsForBook.has(r.id))
          .map((r) => (
           <option key={r.id} value={r.id}>
            {r.name}
           </option>
          ))}
        </Select>
        {bookDate && freeRoomIdsForBook.size === 0 && (
         <p className="text-xs text-warning">此時段沒有空房，請改日期或時段。</p>
        )}
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">授課老師</label>
        <Select value={bookTeacherId} onChange={(e) => setBookTeacherId(e.target.value)}>
         <option value="">選擇老師</option>
         {teacherOptions.map((t) => (
          <option key={t.id} value={t.id}>
           {t.label}
          </option>
         ))}
        </Select>
       </div>

       {upcomingSchedules.length > 0 && (
        <div className="space-y-1">
         <p className="text-xs font-medium text-muted-foreground">近期已排課堂</p>
         <ul className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
          {upcomingSchedules.slice(0, 5).map((s) => (
           <li key={s.id}>
            {s.scheduledDate}
            {s.startTime ? ` ${s.startTime}` : ""}
            {s.classroomName ? ` · ${s.classroomName}` : ""}
            <Tag tone={statusToTagTone(s.status)} className="ml-1">
             {s.status}
            </Tag>
           </li>
          ))}
         </ul>
        </div>
       )}

       {bookErr && <p className="text-sm text-destructive">{bookErr}</p>}

       <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setBookOpen(false)}>
         取消
        </Button>
        <Button type="button" onClick={() => void submitBooking()} disabled={bookSaving}>
         {bookSaving ? "建立中…" : "確認預約"}
        </Button>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 )
}
