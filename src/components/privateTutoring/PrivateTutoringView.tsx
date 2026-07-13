import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, DoorOpen, Plus, Search, UserRound, UserMinus } from "lucide-react"

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
import { useAppConfirm } from "@/lib/appConfirm"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 formatMin,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import {
 fetchSubjectOptions,
 fetchTeacherOptions,
 insertScheduleForClass,
 type SubjectOption,
} from "@/services/classQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import {
 buildPrivateClassSubject,
 buildWeeklyDates,
 cancelPrivateLesson,
 checkPrivateBookingConflicts,
 createPrivateRecurringBookings,
 createPrivateTutoringEnrollment,
 fetchPrivateClassSchedules,
 fetchPrivateTutoringStudents,
 formatNextLessonLabel,
 previewPrivateRecurringBookings,
 reschedulePrivateLesson,
 withdrawPrivateEnrollment,
 type PrivateClassScheduleRow,
 type PrivateTutoringStudentRow,
} from "@/services/privateTutoringQueries"
import {
 fetchRoomCalendarBundle,
 occupiersForSlot,
} from "@/services/roomBookingQueries"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllStudents, type StudentRecord } from "@/services/studentQueries"

const PRICE_QUICK = [250, 275, 625, 825] as const

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

const ENROLLMENT_ROW_FILTERS = [
 { key: "all", label: "全部報讀" },
 { key: "就讀中", label: "就讀中" },
 { key: "已退讀", label: "已退讀" },
] as const

function weekdayLabel(ymd: string): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const dt = new Date(y, m - 1, d)
 const w = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()]
 return `週${w}`
}

function isCancelledStatus(status: string): boolean {
 return status.includes("取消")
}

export function PrivateTutoringView() {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const teacherTid = getTeacherScopeTeacherId()
 const isTeacherPortal = Boolean(teacherTid)
 /** 老師：可預約；不可新建報讀／改學費／退讀 */
 const canManageEnrollment = !isTeacherPortal

 const [tab, setTab] = useState<Tab>("students")
 const [rows, setRows] = useState<PrivateTutoringStudentRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [search, setSearch] = useState("")
 const [regFilter, setRegFilter] = useState<(typeof REGISTRATION_FILTERS)[number]["key"]>("all")
 const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]["key"]>("all")
 const [enrollRowFilter, setEnrollRowFilter] =
  useState<(typeof ENROLLMENT_ROW_FILTERS)[number]["key"]>("all")

 const [roomDate, setRoomDate] = useState(() => localYmd())
 const [roomSlotIdx, setRoomSlotIdx] = useState(0)
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomSchedules, setRoomSchedules] = useState<
  Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["schedules"]
 >([])
 const [roomPending, setRoomPending] = useState<
  Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["pending"]
 >([])
 const [roomLoading, setRoomLoading] = useState(false)

 const [bookOpen, setBookOpen] = useState(false)
 const [bookRow, setBookRow] = useState<PrivateTutoringStudentRow | null>(null)
 const [bookDate, setBookDate] = useState("")
 const [bookSlotIdx, setBookSlotIdx] = useState(0)
 const [bookRoomId, setBookRoomId] = useState("")
 const [bookTeacherId, setBookTeacherId] = useState("")
 const [bookMode, setBookMode] = useState<"single" | "weekly">("single")
 const [bookWeekCount, setBookWeekCount] = useState("4")
 const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([])
 const [bookSaving, setBookSaving] = useState(false)
 const [bookErr, setBookErr] = useState<string | null>(null)
 const [upcomingSchedules, setUpcomingSchedules] = useState<PrivateClassScheduleRow[]>([])
 const [rescheduleScheduleId, setRescheduleScheduleId] = useState<string | null>(null)

 const [createOpen, setCreateOpen] = useState(false)
 const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
 const [subjects, setSubjects] = useState<SubjectOption[]>([])
 const [createStudentSearch, setCreateStudentSearch] = useState("")
 const [createStudentId, setCreateStudentId] = useState("")
 const [createStudentPickerOpen, setCreateStudentPickerOpen] = useState(false)
 const [createSubjectQuery, setCreateSubjectQuery] = useState("")
 const [createSubjectPickerOpen, setCreateSubjectPickerOpen] = useState(false)
 const [createTeacherId, setCreateTeacherId] = useState("")
 const [createPrice, setCreatePrice] = useState("")
 const [createClassNameOverride, setCreateClassNameOverride] = useState("")
 const [createSaving, setCreateSaving] = useState(false)
 const [createErr, setCreateErr] = useState<string | null>(null)

 const reloadStudents = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const list = await fetchPrivateTutoringStudents()
   const tid = getTeacherScopeTeacherId()
   setRows(tid ? list.filter((r) => r.teacherId === tid) : list)
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

 const reloadUpcomingSchedules = useCallback(async (classId: string) => {
  try {
   setUpcomingSchedules(await fetchPrivateClassSchedules(classId))
  } catch {
   setUpcomingSchedules([])
  }
 }, [])

 useEffect(() => {
  void reloadStudents()
 }, [reloadStudents])

 useEffect(() => {
  if (tab === "rooms") void reloadRooms()
 }, [tab, reloadRooms])

 useEffect(() => {
  void fetchTeacherOptions().then(setTeacherOptions).catch(() => setTeacherOptions([]))
 }, [])

 const openCreateDialog = useCallback(async () => {
  setCreateOpen(true)
  setCreateErr(null)
  setCreateStudentSearch("")
  setCreateStudentId("")
  setCreateStudentPickerOpen(false)
  setCreateSubjectQuery("")
  setCreateSubjectPickerOpen(false)
  setCreateTeacherId("")
  setCreatePrice("")
  setCreateClassNameOverride("")
  try {
   const [sts, subs] = await Promise.all([fetchAllStudents(), fetchSubjectOptions()])
   setAllStudents(sts)
   setSubjects(subs)
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.openCreateDialog", setErr: setCreateErr })
  }
 }, [])

 const createStudentOptions = useMemo(() => {
  const q = createStudentSearch.trim().toLowerCase()
  if (!q) return []
  return allStudents
   .filter((s) => {
    return (
     s.full_name.toLowerCase().includes(q) ||
     (s.student_code ?? "").toLowerCase().includes(q) ||
     formatStudentGrade(s.grade).toLowerCase().includes(q)
    )
   })
   .slice(0, 40)
 }, [allStudents, createStudentSearch])

 const createSubjectOptions = useMemo(() => {
  const q = createSubjectQuery.trim().toLowerCase()
  if (!q) return subjects.slice(0, 40)
  return subjects
   .filter(
    (s) =>
     s.name_zh.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
   )
   .slice(0, 40)
 }, [subjects, createSubjectQuery])

 const createStudentLabel = useCallback((s: StudentRecord) => {
  const grade = formatStudentGrade(s.grade)
  return [
   s.full_name,
   s.student_code ? `（${s.student_code}）` : "",
   grade !== "—" ? ` · ${grade}` : "",
   s.registration_status === "非注冊" ? " · 非注冊" : "",
  ].join("")
 }, [])

 const pickCreateStudent = useCallback((s: StudentRecord) => {
  setCreateStudentId(s.id)
  setCreateStudentSearch("")
  setCreateStudentPickerOpen(false)
 }, [])

 const pickCreateSubject = useCallback((name: string) => {
  setCreateSubjectQuery(name)
  setCreateSubjectPickerOpen(false)
 }, [])

 const selectedCreateStudent = useMemo(
  () => allStudents.find((s) => s.id === createStudentId) ?? null,
  [allStudents, createStudentId]
 )

 const selectedSubjectName = createSubjectQuery.trim()

 const previewClassSubject = useMemo(() => {
  if (createClassNameOverride.trim()) return createClassNameOverride.trim()
  if (!selectedCreateStudent) return ""
  return buildPrivateClassSubject(selectedCreateStudent.full_name, selectedSubjectName || "科目")
 }, [createClassNameOverride, selectedCreateStudent, selectedSubjectName])

 const submitCreate = useCallback(async () => {
  if (!createStudentId) {
   setCreateErr("請選擇學生")
   return
  }
  if (!selectedSubjectName && !createClassNameOverride.trim()) {
   setCreateErr("請選擇或輸入科目，或輸入自訂班名")
   return
  }
  const priceNum = createPrice.trim() === "" ? null : Number(createPrice)
  if (priceNum != null && (Number.isNaN(priceNum) || priceNum < 0)) {
   setCreateErr("學費不可為負數")
   return
  }
  const grade = formatStudentGrade(selectedCreateStudent?.grade)
  const payload = {
   studentId: createStudentId,
   subjectName: selectedSubjectName || "一對一",
   teacherId: createTeacherId || null,
   pricePerLesson: priceNum,
   academicYearId: null as string | null,
   gradeLabel: grade && grade !== "—" ? grade : null,
   customClassSubject: createClassNameOverride.trim() || null,
  }
  setCreateSaving(true)
  setCreateErr(null)
  try {
   let result
   try {
    result = await createPrivateTutoringEnrollment(payload)
   } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!msg.includes("已有同科目")) throw e
    const ok = await confirmDialog({
     title: "已有同科目一對一",
     description: `${msg}\n\n是否仍要強制建立另一個報讀？`,
     confirmText: "強制建立",
     tone: "warning",
    })
    if (!ok) {
     setCreateErr(msg)
     return
    }
    result = await createPrivateTutoringEnrollment({ ...payload, allowDuplicate: true })
   }
   pushBanner({
    tone: "success",
    title: "已建立一對一報讀",
    message: `${result.studentName} · ${result.classSubject}`,
   })
   setCreateOpen(false)
   void reloadStudents()
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.submitCreate", setErr: setCreateErr })
  } finally {
   setCreateSaving(false)
  }
 }, [
  createStudentId,
  selectedSubjectName,
  createClassNameOverride,
  createPrice,
  createTeacherId,
  selectedCreateStudent,
  pushBanner,
  reloadStudents,
  confirmDialog,
 ])

 const onWithdraw = useCallback(
  async (row: PrivateTutoringStudentRow) => {
   const ok = await confirmDialog({
    title: "確認退讀",
    description: `確定將 ${row.fullName} 從「${row.classSubject}」退讀？\n今日起尚未取消的預約課堂亦會一併取消。`,
    confirmText: "確認退讀",
    tone: "destructive",
   })
   if (!ok) return
   try {
    await withdrawPrivateEnrollment({
     enrollmentId: row.enrollmentId,
     studentId: row.studentId,
     classId: row.classId,
    })
    pushBanner({
     tone: "success",
     title: "已退讀",
     message: `${row.fullName} · ${row.classSubject}`,
    })
    void reloadStudents()
   } catch (e) {
    reportUserFacingError(e, { source: "PrivateTutoringView.onWithdraw", setErr })
   }
  },
  [confirmDialog, pushBanner, reloadStudents]
 )

 const filteredRows = useMemo(() => {
  const q = search.trim().toLowerCase()
  return rows.filter((r) => {
   if (enrollRowFilter !== "all" && r.enrollmentRowStatus !== enrollRowFilter) return false
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
 }, [rows, search, regFilter, activityFilter, enrollRowFilter])

 const activeRooms = useMemo(
  () => classroomsActiveOnDate(
   rooms.filter((r) => !r.is_online),
   roomDate
  ),
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

 const schedulesForBookFreeCheck = useMemo(() => {
  if (!rescheduleScheduleId) return roomSchedules
  return roomSchedules.filter((s) => s.id !== rescheduleScheduleId)
 }, [roomSchedules, rescheduleScheduleId])

 const freeRoomIdsForBook = useMemo(() => {
  if (!bookDate) return new Set<string>()
  const slotStart = lessonSlotStartMinute(bookSlotIdx)
  const slotEnd = lessonSlotEndMinute(bookSlotIdx)
  const active = classroomsActiveOnDate(
   rooms.filter((r) => !r.is_online),
   bookDate
  )
  return new Set(
   active
    .filter(
     (room) =>
      occupiersForSlot(
       bookDate,
       room.id,
       slotStart,
       slotEnd,
       schedulesForBookFreeCheck,
       roomPending
      ).length === 0
    )
    .map((r) => r.id)
  )
 }, [bookDate, bookSlotIdx, rooms, schedulesForBookFreeCheck, roomPending])

 const bookActiveRooms = useMemo(
  () => classroomsActiveOnDate(
   rooms.filter((r) => !r.is_online),
   bookDate
  ),
  [rooms, bookDate]
 )

 const resetBookForm = useCallback((row: PrivateTutoringStudentRow) => {
  setBookDate(localYmd())
  setBookSlotIdx(0)
  setBookRoomId("")
  const tid = getTeacherScopeTeacherId()
  setBookTeacherId(tid || row.teacherId || "")
  setBookMode("single")
  setBookWeekCount("4")
  setRescheduleScheduleId(null)
  setBookErr(null)
 }, [])

 const openBookDialog = useCallback(
  async (row: PrivateTutoringStudentRow) => {
   setBookRow(row)
   resetBookForm(row)
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
  [resetBookForm]
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

 const enterRescheduleMode = useCallback(
  async (s: PrivateClassScheduleRow) => {
   setRescheduleScheduleId(s.id)
   setBookMode("single")
   setBookErr(null)
   const ymd = s.scheduledDate
   setBookDate(ymd)
   setBookRoomId(s.classroomId ?? "")
   setBookTeacherId(s.teacherId ?? bookRow?.teacherId ?? "")
   if (s.startTime) {
    const startMin =
     Number(String(s.startTime).slice(0, 2)) * 60 + Number(String(s.startTime).slice(3, 5) || 0)
    const matchIdx = LESSON_SLOT_INDICES.find((i) => lessonSlotStartMinute(i) === startMin)
    setBookSlotIdx(matchIdx ?? 0)
   } else {
    setBookSlotIdx(0)
   }
   if (ymd) {
    try {
     const bundle = await fetchRoomCalendarBundle(ymd, ymd)
     setRooms(bundle.rooms)
     setRoomSchedules(bundle.schedules)
     setRoomPending(bundle.pending)
    } catch {
     /* ignore */
    }
   }
  },
  [bookRow]
 )

 const cancelRescheduleMode = useCallback(() => {
  if (!bookRow) return
  setRescheduleScheduleId(null)
  setBookDate(localYmd())
  setBookSlotIdx(0)
  setBookRoomId("")
  setBookTeacherId(bookRow.teacherId ?? "")
  setBookErr(null)
 }, [bookRow])

 const submitBooking = useCallback(async () => {
  if (!bookRow || !bookDate) {
   setBookErr("請選擇日期")
   return
  }
  const startTime = formatMin(lessonSlotStartMinute(bookSlotIdx))
  const endTime = formatMin(lessonSlotEndMinute(bookSlotIdx))
  const teacherId = teacherTid || bookTeacherId || bookRow.teacherId
  const classroomId = bookRoomId.trim() || null
  setBookSaving(true)
  setBookErr(null)
  try {
   if (rescheduleScheduleId) {
    const conflicts = await checkPrivateBookingConflicts({
     classroomId,
     scheduledDate: bookDate,
     startTime,
     endTime,
     teacherId,
     studentId: bookRow.studentId,
     excludeScheduleId: rescheduleScheduleId,
    })
    if (conflicts.length > 0) {
     const ok = await confirmDialog({
      title: "發現時段衝突",
      description: `${conflicts.map((c) => c.label).join("\n")}\n\n仍要改約嗎？`,
      confirmText: "仍要改約",
      tone: "warning",
     })
     if (!ok) {
      setBookErr(conflicts.map((c) => c.label).join("\n"))
      return
     }
    }
    await reschedulePrivateLesson({
     scheduleId: rescheduleScheduleId,
     scheduledDate: bookDate,
     startTime,
     endTime,
     classroomId,
     teacherId,
    })
    pushBanner({
     tone: "success",
     title: "已改約",
     message: `${bookRow.fullName} · ${bookDate} ${lessonSlotLabel(bookSlotIdx)}`,
    })
    setRescheduleScheduleId(null)
   } else if (bookMode === "weekly") {
    const count = Number(bookWeekCount)
    if (!Number.isFinite(count) || count < 1 || count > 52) {
     setBookErr("堂數請輸入 1–52")
     return
    }
    const dates = buildWeeklyDates(bookDate, count)
    const preview = await previewPrivateRecurringBookings({
     dates,
     classroomId,
     startTime,
     endTime,
     teacherId,
     studentId: bookRow.studentId,
    })
    const conflictItems = preview.filter((p) => p.conflicts.length > 0)
    let skipConflictDates = false
    let ignoreConflicts = false
    if (conflictItems.length > 0) {
     const lines = conflictItems.map(
      (p) => `${p.date}：${p.conflicts.map((c) => c.label).join("；")}`
     )
     const choice = await confirmDialog({
      title: "週期預約有衝突",
      description: `${lines.join("\n")}\n\n共 ${dates.length} 堂，其中 ${conflictItems.length} 堂衝突。\n選「略過衝突日」會建立其餘無衝突堂次；選「無視衝突建立排程」會建立全部堂次；選取消則不建立任何堂。`,
      confirmText: "略過衝突日並建立",
      alternateText: "無視衝突建立排程",
      tone: "warning",
      alternateTone: "destructive",
     })
     if (!choice) {
      setBookErr(lines.join("\n"))
      return
     }
     if (choice === "alternate") {
      ignoreConflicts = true
     } else {
      skipConflictDates = true
     }
    } else {
     const ok = await confirmDialog({
      title: "確認週期預約",
      description: `將建立每週共 ${dates.length} 堂（${dates[0]} 起）。確定繼續？`,
      confirmText: "確認建立",
     })
     if (!ok) return
    }
    const result = await createPrivateRecurringBookings({
     classId: bookRow.classId,
     studentId: bookRow.studentId,
     dates,
     classroomId,
     startTime,
     endTime,
     teacherId,
     skipConflictDates,
     ignoreConflicts,
    })
    pushBanner({
     tone: "success",
     title: "已建立週期預約",
     message:
      result.skipped.length > 0
       ? `建成 ${result.created} 堂，略過 ${result.skipped.length} 堂（${result.skipped.join("、")}）`
       : `建成 ${result.created} 堂`,
    })
   } else {
    const conflicts = await checkPrivateBookingConflicts({
     classroomId,
     scheduledDate: bookDate,
     startTime,
     endTime,
     teacherId,
     studentId: bookRow.studentId,
    })
    if (conflicts.length > 0) {
     const ok = await confirmDialog({
      title: "發現時段衝突",
      description: `${conflicts.map((c) => c.label).join("\n")}\n\n仍要建立預約嗎？`,
      confirmText: "仍要預約",
      tone: "warning",
     })
     if (!ok) {
      setBookErr(conflicts.map((c) => c.label).join("\n"))
      return
     }
    }
    await insertScheduleForClass(bookRow.classId, teacherId, {
     scheduled_date: bookDate,
     start_time: startTime,
     end_time: endTime,
     classroom_id: classroomId,
     status: "正常",
    })
    pushBanner({
     tone: "success",
     title: "已建立預約",
     message: `${bookRow.fullName} · ${bookDate} ${lessonSlotLabel(bookSlotIdx)}`,
    })
   }

   await Promise.all([reloadUpcomingSchedules(bookRow.classId), reloadStudents()])
   setBookDate(localYmd())
   setBookSlotIdx(0)
   setBookRoomId("")
   setBookTeacherId(bookRow.teacherId ?? "")
   setBookMode("single")
   setBookWeekCount("4")
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.submitBooking", setErr: setBookErr })
  } finally {
   setBookSaving(false)
  }
 }, [
  bookRow,
  bookDate,
  bookRoomId,
  bookSlotIdx,
  bookTeacherId,
  bookMode,
  bookWeekCount,
  rescheduleScheduleId,
  teacherTid,
  confirmDialog,
  pushBanner,
  reloadStudents,
  reloadUpcomingSchedules,
 ])

 const onCancelLesson = useCallback(
  async (s: PrivateClassScheduleRow) => {
   if (!bookRow) return
   const ok = await confirmDialog({
    title: "確認取消課堂",
    description: `確定取消 ${s.scheduledDate}${s.startTime ? ` ${String(s.startTime).slice(0, 5)}` : ""} 的預約？`,
    confirmText: "確認取消",
    tone: "destructive",
   })
   if (!ok) return
   try {
    await cancelPrivateLesson(s.id)
    if (rescheduleScheduleId === s.id) {
     setRescheduleScheduleId(null)
    }
    pushBanner({
     tone: "success",
     title: "已取消課堂",
     message: `${bookRow.fullName} · ${s.scheduledDate}`,
    })
    await Promise.all([reloadUpcomingSchedules(bookRow.classId), reloadStudents()])
   } catch (e) {
    reportUserFacingError(e, { source: "PrivateTutoringView.onCancelLesson", setErr: setBookErr })
   }
  },
  [
   bookRow,
   confirmDialog,
   pushBanner,
   reloadUpcomingSchedules,
   reloadStudents,
   rescheduleScheduleId,
  ]
 )

 const activeUpcomingSchedules = useMemo(
  () => upcomingSchedules.filter((s) => !isCancelledStatus(s.status)),
  [upcomingSchedules]
 )

 return (
  <div className="space-y-6 p-4 md:p-6">
   <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
     <h1 className="text-xl font-semibold text-foreground">
      {isTeacherPortal ? "我的一對一學生" : "一對一學生"}
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      {isTeacherPortal
       ? "查看指派給你的一對一學生、查空房並預約上堂。點班名可進入班別詳情。"
       : "列表負責新增報讀、預約與退讀；點班名進入詳情可編輯老師／學費並查看排程。"}
     </p>
    </div>
    {canManageEnrollment ? (
     <Button type="button" onClick={() => void openCreateDialog()}>
      <Plus className="mr-1.5 h-4 w-4" />
      新增一對一報讀
     </Button>
    ) : null}
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
       value={enrollRowFilter}
       onChange={(e) =>
        setEnrollRowFilter(e.target.value as (typeof ENROLLMENT_ROW_FILTERS)[number]["key"])
       }
      >
       {ENROLLMENT_ROW_FILTERS.map((f) => (
        <option key={f.key} value={f.key}>
         {f.label}
        </option>
       ))}
      </Select>
      <Select
       value={regFilter}
       onChange={(e) =>
        setRegFilter(e.target.value as (typeof REGISTRATION_FILTERS)[number]["key"])
       }
      >
       {REGISTRATION_FILTERS.map((f) => (
        <option key={f.key} value={f.key}>
         {f.label}
        </option>
       ))}
      </Select>
      <Select
       value={activityFilter}
       onChange={(e) =>
        setActivityFilter(e.target.value as (typeof ACTIVITY_FILTERS)[number]["key"])
       }
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
     ) : rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">
       {isTeacherPortal
        ? "目前沒有指派給你的一對一報讀。"
        : "尚無一對一報讀。按上方「新增一對一報讀」開始。"}
      </p>
     ) : filteredRows.length === 0 ? (
      <p className="text-sm text-muted-foreground">沒有符合條件的一對一學生。</p>
     ) : (
      <div className="overflow-x-auto rounded-lg border border-border">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
          <th className="w-[12%] px-3 py-2 font-medium">學生</th>
          <th className="w-[8%] px-3 py-2 font-medium">學號</th>
          <th className="w-[7%] px-3 py-2 font-medium">年級</th>
          <th className="w-[18%] px-3 py-2 font-medium">一對一班別</th>
          <th className="w-[9%] px-3 py-2 font-medium">老師</th>
          <th className="w-[16%] px-3 py-2 font-medium">狀態</th>
          <th className="w-[14%] px-3 py-2 font-medium">下一堂</th>
          <th className="w-[16%] px-3 py-2 font-medium">操作</th>
         </tr>
        </thead>
        <tbody>
         {filteredRows.map((r) => {
          const isWithdrawn = r.enrollmentRowStatus === "已退讀"
          return (
          <tr
           key={r.enrollmentId}
           className={cn(
            "border-b border-border/60 last:border-0",
            isWithdrawn && "bg-muted/30 text-muted-foreground"
           )}
          >
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
            <span className="inline-flex max-w-full items-center gap-1">
             <Link
              to={`/Classes/${r.classId}`}
              state={{ fromPrivateTutoring: true }}
              className="truncate font-medium text-primary hover:underline"
              title={r.classSubject}
             >
              {r.classSubject}
             </Link>
             {isWithdrawn ? (
              <Tag tone="default" className="shrink-0">
               已退讀
              </Tag>
             ) : null}
            </span>
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
           <td className="min-w-0 px-3 py-2">
            <div className="flex min-w-0 items-center gap-1">
             <span className="min-w-0 truncate" title={formatNextLessonLabel(r.nextLesson)}>
              {formatNextLessonLabel(r.nextLesson)}
             </span>
             {r.upcomingLessonCount > 1 ? (
              <Tag tone="info" className="shrink-0">
               +{r.upcomingLessonCount - 1}
              </Tag>
             ) : null}
            </div>
           </td>
           <td className="px-3 py-2">
            {isWithdrawn ? (
             <span className="text-xs text-muted-foreground">—</span>
            ) : (
             <div className="flex items-center gap-0.5">
              <Button
               type="button"
               size="sm"
               variant="outline"
               title="預約"
               aria-label="預約"
               onClick={() => void openBookDialog(r)}
              >
               <CalendarClock className="h-3.5 w-3.5" />
              </Button>
              {canManageEnrollment ? (
                <Button
                 type="button"
                 size="sm"
                 variant="ghost"
                 className="text-destructive hover:text-destructive"
                 title="退讀"
                 aria-label="退讀"
                 onClick={() => void onWithdraw(r)}
                >
                 <UserMinus className="h-3.5 w-3.5" />
                </Button>
              ) : null}
             </div>
            )}
           </td>
          </tr>
          )
         })}
        </tbody>
       </table>
      </div>
     )}
     <p className="text-xs text-muted-foreground">
      共 {filteredRows.length} 筆（全部 {rows.length} 筆一對一報讀，含已退讀）
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

   <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>新增一對一報讀</DialogTitle>
     </DialogHeader>
     <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
       會自動建立一對一班別（無固定時間／課室）並為學生報讀，無需走小組開班流程。
      </p>

      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">學生（可搜尋姓名／學號／年級）</label>
       <div className="relative">
        <Input
         placeholder="輸入姓名、學號或年級搜尋…"
         value={
          createStudentId
           ? selectedCreateStudent
             ? createStudentLabel(selectedCreateStudent)
             : ""
           : createStudentSearch
         }
         onChange={(e) => {
          setCreateStudentId("")
          setCreateStudentSearch(e.target.value)
          setCreateStudentPickerOpen(true)
         }}
         onFocus={() => setCreateStudentPickerOpen(true)}
        />
        {createStudentPickerOpen && !createStudentId && createStudentSearch.trim() ? (
         <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
          {createStudentOptions.length === 0 ? (
           <div className="px-3 py-2 text-sm text-muted-foreground">找不到學生</div>
          ) : (
           createStudentOptions.map((s) => (
            <button
             key={s.id}
             type="button"
             className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
             onMouseDown={(e) => e.preventDefault()}
             onClick={() => pickCreateStudent(s)}
            >
             {createStudentLabel(s)}
            </button>
           ))
          )}
         </div>
        ) : null}
       </div>
       {createStudentId ? (
        <button
         type="button"
         className="text-left text-xs text-primary underline-offset-4 hover:underline"
         onClick={() => {
          setCreateStudentId("")
          setCreateStudentSearch("")
          setCreateStudentPickerOpen(false)
         }}
        >
         清除選取
        </button>
       ) : null}
      </div>

      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">科目（可搜尋或直接輸入）</label>
       <div className="relative">
        <Input
         placeholder="輸入科目名稱（如：英文、M2、BAFS）…"
         value={createSubjectQuery}
         onChange={(e) => {
          setCreateSubjectQuery(e.target.value)
          setCreateSubjectPickerOpen(true)
         }}
         onFocus={() => setCreateSubjectPickerOpen(true)}
         onBlur={() => {
          // delay so option click can register
          window.setTimeout(() => setCreateSubjectPickerOpen(false), 150)
         }}
        />
        {createSubjectPickerOpen && createSubjectOptions.length > 0 ? (
         <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
          {createSubjectOptions.map((s) => (
           <button
            key={s.id}
            type="button"
            className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pickCreateSubject(s.name_zh)}
           >
            {s.name_zh}
           </button>
          ))}
         </div>
        ) : null}
       </div>
       <p className="text-xs text-muted-foreground">
        可從列表選取，亦可直接輸入未列出的科目名稱。
       </p>
      </div>

      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">授課老師（可留空）</label>
       <Select value={createTeacherId} onChange={(e) => setCreateTeacherId(e.target.value)}>
        <option value="">稍後指定</option>
        {teacherOptions.map((t) => (
         <option key={t.id} value={t.id}>
          {t.label}
         </option>
        ))}
       </Select>
      </div>

      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">每節學費（可留空）</label>
       <Input
        type="number"
        min={0}
        step={1}
        value={createPrice}
        onChange={(e) => setCreatePrice(e.target.value)}
        placeholder="金額"
       />
       <div className="mt-1 flex flex-wrap gap-1.5">
        {PRICE_QUICK.map((p) => (
         <Button
          key={p}
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setCreatePrice(String(p))}
         >
          HKD {p}
         </Button>
        ))}
       </div>
      </div>

      <div className="space-y-1">
       <label className="text-xs text-muted-foreground">自訂班名（可留空，預設自動產生）</label>
       <Input
        value={createClassNameOverride}
        onChange={(e) => setCreateClassNameOverride(e.target.value)}
        placeholder={previewClassSubject || "例如：陳大文英文一對一"}
       />
       {previewClassSubject ? (
        <p className="text-xs text-muted-foreground">將建立班別：{previewClassSubject}</p>
       ) : null}
      </div>

      {createErr && <p className="text-sm text-destructive whitespace-pre-wrap">{createErr}</p>}

      <div className="flex justify-end gap-2">
       <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
        取消
       </Button>
       <Button type="button" onClick={() => void submitCreate()} disabled={createSaving}>
        {createSaving ? "建立中…" : "確認建立"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <Dialog
    open={bookOpen}
    onOpenChange={(open) => {
     setBookOpen(open)
     if (!open) setRescheduleScheduleId(null)
    }}
   >
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{rescheduleScheduleId ? "改約上堂" : "預約上堂"}</DialogTitle>
     </DialogHeader>
     {bookRow && (
      <div className="space-y-4">
       <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <p className="font-medium">{bookRow.fullName}</p>
        <p className="text-muted-foreground">{bookRow.classSubject}</p>
       </div>

       {!rescheduleScheduleId ? (
        <div className="space-y-1">
         <label className="text-xs text-muted-foreground">預約方式</label>
         <Select
          value={bookMode}
          onChange={(e) => setBookMode(e.target.value as "single" | "weekly")}
         >
          <option value="single">單堂</option>
          <option value="weekly">每週重複（共 N 堂）</option>
         </Select>
        </div>
       ) : null}

       {bookMode === "weekly" && !rescheduleScheduleId ? (
        <div className="space-y-1">
         <label className="text-xs text-muted-foreground">共幾堂（1–52）</label>
         <Input
          type="number"
          min={1}
          max={52}
          value={bookWeekCount}
          onChange={(e) => setBookWeekCount(e.target.value)}
         />
         <p className="text-xs text-muted-foreground">
          自選定日期起每週同一時段；有衝突時會先預覽，可略過衝突日或無視衝突建立。
         </p>
        </div>
       ) : null}

       {activeUpcomingSchedules.length > 0 && (
        <div className="space-y-2">
         <p className="text-xs font-medium text-muted-foreground">已排課堂</p>
         <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2">
          {activeUpcomingSchedules.map((s) => (
           <li
            key={s.id}
            className={cn(
             "rounded-md px-2 py-1.5 text-xs",
             rescheduleScheduleId === s.id ? "bg-info/10" : "bg-muted/40"
            )}
           >
            <div className="flex flex-wrap items-center gap-1">
             <Link
              to={`/Schedule/${s.id}`}
              className="font-medium text-primary hover:underline"
             >
              {s.scheduledDate}
              {s.startTime ? ` ${String(s.startTime).slice(0, 5)}` : ""}
             </Link>
             {s.classroomName ? (
              <span className="text-muted-foreground">· {s.classroomName}</span>
             ) : null}
             <Tag tone={statusToTagTone(s.status)} className="ml-auto">
              {s.status}
             </Tag>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
             <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rescheduleScheduleId === s.id}
              onClick={() => void enterRescheduleMode(s)}
             >
              改約
             </Button>
             <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => void onCancelLesson(s)}
             >
              取消
             </Button>
            </div>
           </li>
          ))}
         </ul>
        </div>
       )}

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
         {rescheduleScheduleId ? "改約日期" : "上課日期"}
        </label>
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
        <label className="text-xs text-muted-foreground">課室（選填，僅顯示空房）</label>
        <Select value={bookRoomId} onChange={(e) => setBookRoomId(e.target.value)}>
         <option value="">暫不指定課室</option>
         {bookActiveRooms
          .filter((r) => freeRoomIdsForBook.has(r.id) || r.id === bookRoomId)
          .map((r) => (
           <option key={r.id} value={r.id}>
            {r.name}
           </option>
          ))}
        </Select>
        {bookDate && freeRoomIdsForBook.size === 0 && (
         <p className="text-xs text-warning">此時段沒有空房；可暫不指定課室並確認預約。</p>
        )}
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">授課老師</label>
        <Select
         value={bookTeacherId}
         onChange={(e) => setBookTeacherId(e.target.value)}
         disabled={isTeacherPortal}
        >
         <option value="">選擇老師</option>
         {teacherOptions.map((t) => (
          <option key={t.id} value={t.id}>
           {t.label}
          </option>
         ))}
        </Select>
        {isTeacherPortal ? (
         <p className="text-xs text-muted-foreground">老師入口固定為本人授課。</p>
        ) : null}
       </div>

       {bookErr && (
        <p className="whitespace-pre-wrap text-sm text-destructive">{bookErr}</p>
       )}

       <div className="flex justify-end gap-2">
        {rescheduleScheduleId ? (
         <Button type="button" variant="ghost" onClick={cancelRescheduleMode}>
          取消改約
         </Button>
        ) : (
         <Button type="button" variant="ghost" onClick={() => setBookOpen(false)}>
          關閉
         </Button>
        )}
        <Button type="button" onClick={() => void submitBooking()} disabled={bookSaving}>
         {bookSaving
          ? rescheduleScheduleId
            ? "改約中…"
            : bookMode === "weekly"
              ? "建立中…"
              : "建立中…"
          : rescheduleScheduleId
            ? "確認改約"
            : bookMode === "weekly"
              ? "預覽並建立週期"
              : "確認預約"}
        </Button>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 )
}
