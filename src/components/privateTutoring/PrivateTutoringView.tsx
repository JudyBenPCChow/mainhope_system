import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarClock, DoorOpen, Plus, Search, SlidersHorizontal, TriangleAlert, UserMinus, UserRound } from "lucide-react"

import { AdminPageHeader, pagePadClass } from "@/components/detail/AdminPageHeader"
import {
 PRIVATE_TUTORING_ROW_GRID,
 PrivateTutoringStudentDisclosure,
} from "@/components/privateTutoring/PrivateTutoringStudentDisclosure"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { Button } from "@/components/ui/button"
import { SkeletonTableRows } from "@/components/ui/skeleton"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import { resolveEnrollmentAttendanceOptions } from "@/lib/enrollmentAttendanceConfirm"
import { resolveSoftCancelScheduleOptions } from "@/lib/scheduleSoftCancelConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 canUseConsecutiveFromSlotIndex,
 consecutivePairFromFirstSlotIndex,
} from "@/lib/consecutiveLesson"
import {
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"
import { cn } from "@/lib/utils"
import {
 fetchSubjectOptions,
 fetchTeacherOptions,
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
 fetchPrivateScheduleTeacherNullAudit,
 fetchPrivateTutoringStudents,
 formatNextLessonLabel,
 insertPrivateBookingSchedules,
 previewPrivateRecurringBookings,
 privateBookingTimeBounds,
 reschedulePrivateLesson,
 sortSchedulesByDateTime,
 withdrawPrivateEnrollment,
 type PrivateClassScheduleRow,
 type PrivateScheduleTeacherNullAuditRow,
 type PrivateTutoringStudentRow,
} from "@/services/privateTutoringQueries"
import {
 fetchRoomCalendarBundle,
 occupiersForSlot,
} from "@/services/roomBookingQueries"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllStudents, previewEnrollmentAttendanceImpact, type StudentRecord } from "@/services/studentQueries"
import { PRIVATE_TUITION_PRICE_PRESETS_HKD } from "@/lib/tuitionPricePresets"
import {
 getPrivateTutoringDataCache,
 invalidatePrivateTutoringDataCache,
 isPrivateTutoringCacheFresh,
 setPrivateTutoringDataCache,
} from "@/components/privateTutoring/privateTutoringState"

type Tab = "students" | "rooms"
type PrivateCreateMode = "1to1" | "1to2"

const REGISTRATION_FILTERS = [
 { key: "all", label: "全部" },
 { key: "已註冊", label: "已註冊" },
 { key: "非注冊", label: "非註冊" },
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
 const { profile, role } = useAuth()
 const isMobile = useIsMobile()
 const [searchParams, setSearchParams] = useSearchParams()
 const teacherTid = getTeacherScopeTeacherId(profile)
 const isTeacherPortal = Boolean(teacherTid)
 /** 老師：可預約；不可新建報讀／改學費／退讀 */
 const canManageEnrollment = !isTeacherPortal

 const [tab, setTab] = useState<Tab>("students")
 const initialPrivateCache = getPrivateTutoringDataCache()
 const hydratePrivate =
  initialPrivateCache != null && initialPrivateCache.teacherTid === teacherTid
 const [rows, setRows] = useState<PrivateTutoringStudentRow[]>(
  () => (hydratePrivate ? initialPrivateCache!.rows : [])
 )
 const [loading, setLoading] = useState(() => !isPrivateTutoringCacheFresh(teacherTid))
 const [err, setErr] = useState<string | null>(null)
 const [highlightStudentId, setHighlightStudentId] = useState<string | null>(null)
 const [teacherNullAudit, setTeacherNullAudit] = useState<PrivateScheduleTeacherNullAuditRow[]>(
  []
 )
 const [teacherNullAuditLoading, setTeacherNullAuditLoading] = useState(false)

 const [search, setSearch] = useState("")
 const [regFilter, setRegFilter] = useState<(typeof REGISTRATION_FILTERS)[number]["key"]>("all")
 const [activityFilter, setActivityFilter] = useState<(typeof ACTIVITY_FILTERS)[number]["key"]>("all")
 const [enrollRowFilter, setEnrollRowFilter] =
  useState<(typeof ENROLLMENT_ROW_FILTERS)[number]["key"]>("all")
 const [filtersOpen, setFiltersOpen] = useState(false)

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
 const [bookConsecutive, setBookConsecutive] = useState(false)
 const [bookRoomId, setBookRoomId] = useState("")
 const [bookTeacherId, setBookTeacherId] = useState("")
 const [bookMode, setBookMode] = useState<"single" | "weekly">("single")
 const [bookWeekCount, setBookWeekCount] = useState("4")
 const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([])
 const [bookSaving, setBookSaving] = useState(false)
 const [bookErr, setBookErr] = useState<string | null>(null)
 const [upcomingSchedules, setUpcomingSchedules] = useState<PrivateClassScheduleRow[]>([])
 const [rescheduleScheduleId, setRescheduleScheduleId] = useState<string | null>(null)
 /** 列表 disclosure 展開後快取的未來排程（依 classId） */
 const [rowSchedulesByClassId, setRowSchedulesByClassId] = useState<
  Record<string, PrivateClassScheduleRow[]>
 >({})
 const [rowSchedulesLoadingIds, setRowSchedulesLoadingIds] = useState<Record<string, true>>({})

 const [createOpen, setCreateOpen] = useState(false)
 const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
 const [subjects, setSubjects] = useState<SubjectOption[]>([])
 const [createStudentSearch, setCreateStudentSearch] = useState("")
 const [createMode, setCreateMode] = useState<PrivateCreateMode>("1to1")
 const [createStudentId, setCreateStudentId] = useState("")
 const [createSecondStudentId, setCreateSecondStudentId] = useState("")
 const [createStudentPickerOpen, setCreateStudentPickerOpen] = useState(false)
 const [createSecondStudentSearch, setCreateSecondStudentSearch] = useState("")
 const [createSecondStudentPickerOpen, setCreateSecondStudentPickerOpen] = useState(false)
 const [createSubjectQuery, setCreateSubjectQuery] = useState("")
 const [createSubjectPickerOpen, setCreateSubjectPickerOpen] = useState(false)
 const [createTeacherId, setCreateTeacherId] = useState("")
 const [createPrice, setCreatePrice] = useState("")
 const [createClassNameOverride, setCreateClassNameOverride] = useState("")
 const [createSaving, setCreateSaving] = useState(false)
 const [createErr, setCreateErr] = useState<string | null>(null)

 const reloadTeacherNullAudit = useCallback(async () => {
  if (!isSupabaseConfigured || isTeacherPortal) {
   setTeacherNullAudit([])
   return
  }
  setTeacherNullAuditLoading(true)
  try {
   setTeacherNullAudit(await fetchPrivateScheduleTeacherNullAudit())
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.reloadTeacherNullAudit" })
   setTeacherNullAudit([])
  } finally {
   setTeacherNullAuditLoading(false)
  }
 }, [isTeacherPortal])

 const reloadStudents = useCallback(async (opts?: { silent?: boolean }) => {
  if (!isSupabaseConfigured) return
  if (!opts?.silent) invalidatePrivateTutoringDataCache()
  const cached = getPrivateTutoringDataCache()
  if (!opts?.silent && !cached) setLoading(true)
  setErr(null)
  try {
   const list = await fetchPrivateTutoringStudents()
   const next = teacherTid ? list.filter((r) => r.teacherId === teacherTid) : list
   setRows(next)
   setPrivateTutoringDataCache({ teacherTid, rows: next })
   if (!teacherTid) void reloadTeacherNullAudit()
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.reloadStudents", setErr })
  } finally {
   setLoading(false)
  }
 }, [reloadTeacherNullAudit, teacherTid])

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
   const list = await fetchPrivateClassSchedules(classId)
   setUpcomingSchedules(list)
   setRowSchedulesByClassId((prev) => ({ ...prev, [classId]: list }))
  } catch {
   setUpcomingSchedules([])
  }
 }, [])

 const ensureRowSchedules = useCallback(async (classId: string) => {
  setRowSchedulesLoadingIds((prev) => ({ ...prev, [classId]: true }))
  try {
   const list = await fetchPrivateClassSchedules(classId)
   setRowSchedulesByClassId((prev) => ({ ...prev, [classId]: list }))
  } catch {
   setRowSchedulesByClassId((prev) => ({ ...prev, [classId]: [] }))
  } finally {
   setRowSchedulesLoadingIds((prev) => {
    const next = { ...prev }
    delete next[classId]
    return next
   })
  }
 }, [])

 useEffect(() => {
  if (isPrivateTutoringCacheFresh(teacherTid)) return
  void reloadStudents({ silent: getPrivateTutoringDataCache() != null })
 }, [reloadStudents, teacherTid])

 useEffect(() => {
  if (tab === "rooms") void reloadRooms()
 }, [tab, reloadRooms])

 useEffect(() => {
  void fetchTeacherOptions().then(setTeacherOptions).catch(() => setTeacherOptions([]))
 }, [])

 const openCreateDialog = useCallback(async (preselectStudentId?: string) => {
  setCreateOpen(true)
  setCreateErr(null)
  setCreateMode("1to1")
  setCreateStudentSearch("")
  setCreateStudentId(preselectStudentId?.trim() || "")
  setCreateSecondStudentSearch("")
  setCreateSecondStudentId("")
  setCreateStudentPickerOpen(false)
  setCreateSecondStudentPickerOpen(false)
  setCreateSubjectQuery("")
  setCreateSubjectPickerOpen(false)
  setCreateTeacherId("")
  setCreatePrice("")
  setCreateClassNameOverride("")
  try {
   const [sts, subs] = await Promise.all([fetchAllStudents(), fetchSubjectOptions()])
   setAllStudents(sts)
   setSubjects(subs)
   const pref = preselectStudentId?.trim()
   if (pref && !sts.some((s) => s.id === pref)) {
    setCreateStudentId("")
    setCreateErr("找不到指定學生，請重新選擇。")
   }
  } catch (e) {
   reportUserFacingError(e, { source: "PrivateTutoringView.openCreateDialog", setErr: setCreateErr })
  }
 }, [])

 useEffect(() => {
  const prefId = searchParams.get("studentId")?.trim() ?? ""
  const wantCreate = searchParams.get("create") === "1"
  if (!prefId && !wantCreate) return
  if (loading) return

  if (prefId) {
   const match = rows.find((r) => r.studentId === prefId)
   if (match) {
    setSearch(match.fullName)
    setHighlightStudentId(prefId)
    setEnrollRowFilter("all")
   } else {
    setHighlightStudentId(prefId)
   }
  }

  if (wantCreate && canManageEnrollment) {
   void openCreateDialog(prefId || undefined)
  }

  setSearchParams(
   (prev) => {
    const next = new URLSearchParams(prev)
    next.delete("studentId")
    next.delete("create")
    return next
   },
   { replace: true }
  )
 }, [searchParams, setSearchParams, loading, rows, canManageEnrollment, openCreateDialog])

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

 const createSecondStudentOptions = useMemo(() => {
  const q = createSecondStudentSearch.trim().toLowerCase()
  if (!q) return []
  return allStudents
   .filter((s) => {
    if (s.id === createStudentId) return false
    return (
     s.full_name.toLowerCase().includes(q) ||
     (s.student_code ?? "").toLowerCase().includes(q) ||
     formatStudentGrade(s.grade).toLowerCase().includes(q)
    )
   })
   .slice(0, 40)
 }, [allStudents, createSecondStudentSearch, createStudentId])

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
   s.registration_status === "非注冊" ? " · 非註冊" : "",
  ].join("")
 }, [])

 const pickCreateStudent = useCallback((s: StudentRecord) => {
  setCreateStudentId(s.id)
  if (createSecondStudentId === s.id) {
   setCreateSecondStudentId("")
   setCreateSecondStudentSearch("")
  }
  setCreateStudentSearch("")
  setCreateStudentPickerOpen(false)
 }, [createSecondStudentId])

 const pickCreateSecondStudent = useCallback((s: StudentRecord) => {
  setCreateSecondStudentId(s.id)
  setCreateSecondStudentSearch("")
  setCreateSecondStudentPickerOpen(false)
 }, [])

 const pickCreateSubject = useCallback((name: string) => {
  setCreateSubjectQuery(name)
  setCreateSubjectPickerOpen(false)
 }, [])

 const selectedCreateStudent = useMemo(
  () => allStudents.find((s) => s.id === createStudentId) ?? null,
  [allStudents, createStudentId]
 )

 const selectedCreateSecondStudent = useMemo(
  () => allStudents.find((s) => s.id === createSecondStudentId) ?? null,
  [allStudents, createSecondStudentId]
 )

 const selectedCreateStudents = useMemo(
  () =>
   [selectedCreateStudent, createMode === "1to2" ? selectedCreateSecondStudent : null].filter(
    (student): student is StudentRecord => Boolean(student)
   ),
  [selectedCreateSecondStudent, selectedCreateStudent, createMode]
 )

 const selectedSubjectName = createSubjectQuery.trim()

 const previewClassSubject = useMemo(() => {
  if (createClassNameOverride.trim()) return createClassNameOverride.trim()
  if (selectedCreateStudents.length === 0) return ""
  return buildPrivateClassSubject(
   selectedCreateStudents.map((student) => student.full_name),
   selectedSubjectName || "科目",
   createMode
  )
 }, [createClassNameOverride, selectedCreateStudents, selectedSubjectName, createMode])

 const submitCreate = useCallback(async () => {
  if (!createStudentId) {
   setCreateErr("請選擇第一位學生")
   return
  }
  if (createMode === "1to2" && !createSecondStudentId) {
   setCreateErr("請選擇第二位學生")
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
  const selectedIds = [createStudentId, createMode === "1to2" ? createSecondStudentId : ""].filter(Boolean)
  const grade = formatStudentGrade(selectedCreateStudents[0]?.grade)
  const payload = {
   studentIds: selectedIds,
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
   const payStudentId = result.studentIds[0]
   pushBanner({
    tone: "success",
    title: `已建立${createMode === "1to2" ? "一對二" : "一對一"}報讀`,
    message: `${result.studentNames.join("、")} · ${result.classSubject}。可前往收款／出單。`,
    action: payStudentId
     ? {
        pageLabel: "收款／出單",
        to: `/Payments?studentId=${encodeURIComponent(payStudentId)}&mode=receive`,
       }
     : undefined,
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
  createMode,
  createSecondStudentId,
  selectedSubjectName,
  createClassNameOverride,
  createPrice,
  createTeacherId,
  selectedCreateStudents,
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
    const hits = await previewEnrollmentAttendanceImpact(row.studentId, row.classId)
    const attOpts = await resolveEnrollmentAttendanceOptions(
     confirmDialog,
     hits,
     "withdraw",
     row.fullName
    )
    if (attOpts === "abort") return
    await withdrawPrivateEnrollment({
     enrollmentId: row.enrollmentId,
     studentId: row.studentId,
     classId: row.classId,
     ...attOpts,
    })
    pushBanner({
     tone: "success",
     title: "已退讀",
     message: `${row.fullName} · ${row.classSubject}`,
    })
    setRowSchedulesByClassId((prev) => {
     const next = { ...prev }
     delete next[row.classId]
     return next
    })
    void reloadStudents()
   } catch (e) {
    reportUserFacingError(e, { source: "PrivateTutoringView.onWithdraw", setErr })
   }
  },
  [confirmDialog, pushBanner, reloadStudents]
 )

 /** 狀態篩選後的報讀列（搜尋稍後以班別為單位套用，避免一對二被拆開） */
 const statusFilteredRows = useMemo(() => {
  return rows.filter((r) => {
   if (enrollRowFilter !== "all" && r.enrollmentRowStatus !== enrollRowFilter) return false
   if (regFilter !== "all" && r.registrationStatus !== regFilter) return false
   if (activityFilter !== "all" && r.activityStatus !== activityFilter) return false
   return true
  })
 }, [rows, regFilter, activityFilter, enrollRowFilter])

 /** 同一私人班別（含一對二）合併為一列；搜尋命中任一學生則整班保留 */
 const filteredClassGroups = useMemo(() => {
  const q = search.trim().toLowerCase()
  const groups = new Map<string, PrivateTutoringStudentRow[]>()
  const order: string[] = []
  for (const r of statusFilteredRows) {
   const existing = groups.get(r.classId)
   if (existing) {
    existing.push(r)
    continue
   }
   groups.set(r.classId, [r])
   order.push(r.classId)
  }
  return order
   .map((classId) => {
    const list = groups.get(classId) ?? []
    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
   })
   .filter((group) => {
    if (!q) return true
    return group.some(
     (r) =>
      r.fullName.toLowerCase().includes(q) ||
      r.studentCode.toLowerCase().includes(q) ||
      r.classSubject.toLowerCase().includes(q) ||
      (r.teacherName ?? "").toLowerCase().includes(q)
    )
   })
 }, [statusFilteredRows, search])

 const filteredRows = useMemo(
  () => filteredClassGroups.flat(),
  [filteredClassGroups]
 )

 const activeFilterCount = useMemo(() => {
  let n = 0
  if (enrollRowFilter !== "all") n++
  if (regFilter !== "all") n++
  if (activityFilter !== "all") n++
  return n
 }, [enrollRowFilter, regFilter, activityFilter])

 const activeStudentIdsByClass = useMemo(() => {
  const map = new Map<string, string[]>()
  for (const row of rows) {
   if (row.enrollmentRowStatus !== "就讀中") continue
   const prev = map.get(row.classId) ?? []
   if (!prev.includes(row.studentId)) prev.push(row.studentId)
   map.set(row.classId, prev)
  }
  return map
 }, [rows])

 const studentNamesByClassId = useMemo(() => {
  const map = new Map<string, string[]>()
  for (const row of rows) {
   if (row.enrollmentRowStatus !== "就讀中") continue
   const prev = map.get(row.classId) ?? []
   if (!prev.includes(row.fullName)) prev.push(row.fullName)
   map.set(row.classId, prev)
  }
  return map
 }, [rows])

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

 const bookUsesConsecutive =
  bookConsecutive && !rescheduleScheduleId && canUseConsecutiveFromSlotIndex(bookSlotIdx)

 const freeRoomIdsForBook = useMemo(() => {
  if (!bookDate) return new Set<string>()
  const { startMin, endMin } = privateBookingTimeBounds(bookSlotIdx, bookUsesConsecutive)
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
       startMin,
       endMin,
       schedulesForBookFreeCheck,
       roomPending
      ).length === 0
    )
    .map((r) => r.id)
  )
 }, [bookDate, bookSlotIdx, bookUsesConsecutive, rooms, schedulesForBookFreeCheck, roomPending])

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
  setBookConsecutive(false)
  setBookRoomId("")
  setBookTeacherId(teacherTid || row.teacherId || "")
  setBookMode("single")
  setBookWeekCount("4")
  setRescheduleScheduleId(null)
  setBookErr(null)
 }, [teacherTid])

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
    setRowSchedulesByClassId((prev) => ({ ...prev, [row.classId]: schedules }))
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
   setBookConsecutive(false)
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
  const consecutive =
   bookConsecutive && !rescheduleScheduleId && canUseConsecutiveFromSlotIndex(bookSlotIdx)
  if (bookConsecutive && !rescheduleScheduleId && !consecutive) {
   setBookErr("連堂需選擇可連續兩格的起始時段（最後一格不可連堂）。")
   return
  }
  const { startTime, endTime } = privateBookingTimeBounds(bookSlotIdx, consecutive)
  const pair = consecutive ? consecutivePairFromFirstSlotIndex(bookSlotIdx) : null
  const timeLabel = pair
   ? `${pair.displayRange}（連堂 · 計 2 堂）`
   : lessonSlotLabel(bookSlotIdx)
  const teacherId = teacherTid || bookTeacherId || bookRow.teacherId
  const classroomId = bookRoomId.trim() || null
  const classStudentIds = activeStudentIdsByClass.get(bookRow.classId) ?? [bookRow.studentId]
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
     studentIds: classStudentIds,
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
     message: `${bookRow.fullName} · ${bookDate} ${timeLabel}`,
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
     studentIds: classStudentIds,
    })
    const conflictItems = preview.filter((p) => p.conflicts.length > 0)
    let skipConflictDates = false
    let ignoreConflicts = false
    const lessonsPerDate = consecutive ? 2 : 1
    if (conflictItems.length > 0) {
     const lines = conflictItems.map(
      (p) => `${p.date}：${p.conflicts.map((c) => c.label).join("；")}`
     )
     const choice = await confirmDialog({
      title: "週期預約有衝突",
      description: `${lines.join("\n")}\n\n共 ${dates.length} 次上課${consecutive ? "（連堂每次計 2 堂）" : ""}，其中 ${conflictItems.length} 次衝突。\n選「略過衝突日」會建立其餘無衝突堂次；選「無視衝突建立排程」會建立全部堂次；選取消則不建立任何堂。`,
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
      description: consecutive
       ? `將建立每週共 ${dates.length} 次連堂（每次 2 節，合共最多 ${dates.length * lessonsPerDate} 堂；${dates[0]} 起）。確定繼續？`
       : `將建立每週共 ${dates.length} 堂（${dates[0]} 起）。確定繼續？`,
      confirmText: "確認建立",
     })
     if (!ok) return
    }
    const result = await createPrivateRecurringBookings({
     classId: bookRow.classId,
     studentIds: classStudentIds,
     dates,
     classroomId,
     firstSlotIndex: bookSlotIdx,
     consecutive,
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
       ? `建成 ${result.created} 堂，略過 ${result.skipped.length} 次（${result.skipped.join("、")}）`
       : `建成 ${result.created} 堂`,
    })
   } else {
    const conflicts = await checkPrivateBookingConflicts({
     classroomId,
     scheduledDate: bookDate,
     startTime,
     endTime,
     teacherId,
     studentIds: classStudentIds,
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
    await insertPrivateBookingSchedules({
     classId: bookRow.classId,
     teacherId,
     scheduledDate: bookDate,
     firstSlotIndex: bookSlotIdx,
     consecutive,
     classroomId,
    })
    pushBanner({
     tone: "success",
     title: consecutive ? "已建立連堂預約" : "已建立預約",
     message: `${bookRow.fullName} · ${bookDate} ${timeLabel}`,
    })
   }

   await Promise.all([reloadUpcomingSchedules(bookRow.classId), reloadStudents()])
   setBookDate(localYmd())
   setBookSlotIdx(0)
   setBookConsecutive(false)
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
  bookConsecutive,
  bookTeacherId,
  bookMode,
  bookWeekCount,
  rescheduleScheduleId,
  teacherTid,
  confirmDialog,
  pushBanner,
  reloadStudents,
  reloadUpcomingSchedules,
  activeStudentIdsByClass,
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
    const softOpts = await resolveSoftCancelScheduleOptions(confirmDialog, [s.id])
    if (softOpts === "abort") return
    await cancelPrivateLesson(s.id, undefined, softOpts)
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
  () =>
   sortSchedulesByDateTime(upcomingSchedules.filter((s) => !isCancelledStatus(s.status))),
  [upcomingSchedules]
 )

 return (
  <div className={cn("space-y-5 text-sm leading-relaxed", pagePadClass(role, "md:p-6"))}>
   {role === "admin" ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="私人課程"
     description="管理一對一及一對二私人課程。"
     actions={
      canManageEnrollment ? (
       <Button type="button" className="text-sm" onClick={() => void openCreateDialog()}>
        <Plus className="mr-1.5 h-4 w-4" />
        新增私人課程報讀
       </Button>
      ) : null
     }
    />
   ) : (
   <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <h1 className="text-2xl font-semibold tracking-tight text-foreground">
      {isTeacherPortal ? "我的私人課程學生" : "私人課程學生"}
     </h1>
     <p className="mt-2 hidden text-sm text-muted-foreground md:block">
      {isTeacherPortal
       ? "查看指派給你的私人課程（一對一／一對二）學生、查空房並預約上堂。點列展開可看未來排程；點班名可進入班別詳情。"
       : "此頁顯示私人課程（一對一／一對二）學生。若要查專科班，請到學生詳情的「管理專科班報讀」。列表可新增報讀、預約與退讀。"}
     </p>
    </div>
    {canManageEnrollment ? (
     <Button type="button" className="text-sm" onClick={() => void openCreateDialog()}>
      <Plus className="mr-1.5 h-4 w-4" />
      新增私人課程報讀
     </Button>
    ) : null}
   </header>
   )}

   {!isTeacherPortal && (teacherNullAuditLoading || teacherNullAudit.length > 0) ? (
    <section
     role="alert"
     className="rounded-xl border-2 border-warning/40 bg-warning/10 p-4 shadow-sm md:p-5"
    >
     <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
       <TriangleAlert className="h-5 w-5 shrink-0 text-warning" aria-hidden />
       排程老師缺漏稽核
       <Tag tone="warning" size="sm">
        {teacherNullAuditLoading
         ? "…"
         : `${teacherNullAudit.length} 班／${teacherNullAudit.reduce(
            (n, r) => n + r.nullScheduleTeacherCount,
            0
           )} 堂`}
       </Tag>
      </h2>
      <Button
       type="button"
       size="sm"
       variant="ghost"
       disabled={teacherNullAuditLoading}
       onClick={() => void reloadTeacherNullAudit()}
      >
       重新稽核
      </Button>
     </div>
     <p className="mb-3 text-sm text-muted-foreground">
      以下私人班已指定班別老師，但仍有未取消排程的「排程老師」為空；老師時間表會看不到這些堂。請進入班別詳情按「同步排程老師」，或重新儲存老師設定。
     </p>
     {teacherNullAuditLoading ? (
      <p className="text-sm text-muted-foreground">稽核載入中…</p>
     ) : (
      <StaggerList as="ul" className="max-h-56 space-y-2 overflow-y-auto overscroll-contain">
       {teacherNullAudit.map((row) => (
        <StaggerItem
         key={row.classId}
         as="li"
         className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm"
        >
         <div className="min-w-0">
          <Link
           to={`/Classes/${row.classId}`}
           state={{ fromPrivateTutoring: true }}
           className="font-medium text-primary hover:underline"
          >
           {row.classSubject}
          </Link>
          <span className="ml-2 text-muted-foreground">
           老師：{row.classTeacherName ?? "—"}
          </span>
         </div>
         <Tag tone="warning" size="sm" className="shrink-0">
          空老師 {row.nullScheduleTeacherCount}／{row.activeScheduleCount} 堂
         </Tag>
        </StaggerItem>
       ))}
      </StaggerList>
     )}
    </section>
   ) : null}

   <div className="flex flex-wrap gap-2 border-b border-border pb-1">
    <Button
     type="button"
     variant={tab === "students" ? "default" : "ghost"}
     className="gap-1.5 text-sm"
     onClick={() => setTab("students")}
    >
     <UserRound className="h-4 w-4" />
     學生列表
    </Button>
    <Button
     type="button"
     variant={tab === "rooms" ? "default" : "ghost"}
     className="gap-1.5 text-sm"
     onClick={() => setTab("rooms")}
    >
     <DoorOpen className="h-4 w-4" />
     查空房
    </Button>
   </div>

   {tab === "students" && (
    <div className="space-y-4">
     {isMobile ? (
      <>
       <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
         <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
         <Input
          className="h-10 pl-10 text-sm"
          placeholder="搜尋姓名、學號、科目…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
         />
        </div>
        <Button type="button" variant="outline" className="h-10 shrink-0 gap-2" onClick={() => setFiltersOpen(true)}>
         <SlidersHorizontal className="h-4 w-4" aria-hidden />
         篩選
         {activeFilterCount > 0 ? (
          <Tag tone="info" size="sm">
           {activeFilterCount}
          </Tag>
         ) : null}
        </Button>
       </div>
       <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="篩選私人課程"
        activeCount={activeFilterCount}
        onReset={() => {
         setSearch("")
         setEnrollRowFilter("all")
         setRegFilter("all")
         setActivityFilter("all")
        }}
       >
        <label className="grid gap-1 text-sm">
         <span className="text-muted-foreground">搜尋</span>
         <Input
          className="h-10"
          placeholder="姓名、學號、科目、老師…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
         />
        </label>
        <label className="grid gap-1 text-sm">
         <span className="text-muted-foreground">報讀狀態</span>
         <Select
          className="h-10 text-sm"
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
        </label>
        <label className="grid gap-1 text-sm">
         <span className="text-muted-foreground">註冊</span>
         <Select
          className="h-10 text-sm"
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
        </label>
        <label className="grid gap-1 text-sm">
         <span className="text-muted-foreground">活躍</span>
         <Select
          className="h-10 text-sm"
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
        </label>
       </MobileFilterSheet>
      </>
     ) : (
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
       <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
         className="h-10 pl-10 text-sm"
         placeholder="搜尋姓名、學號、科目、老師…"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
        />
       </div>
       <Select
        className="h-10 text-sm"
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
        className="h-10 text-sm"
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
        className="h-10 text-sm"
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
     )}

     {err && (
      <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
       {err}
      </div>
     )}

     {loading ? (
      <SkeletonTableRows rows={6} columns={5} />
     ) : rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">
       {isTeacherPortal
        ? "目前沒有指派給你的私人課程報讀。"
        : "尚無私人課程報讀。按上方「新增私人課程報讀」開始。"}
      </p>
     ) : filteredClassGroups.length === 0 ? (
      <div className="space-y-1 text-sm text-muted-foreground">
       <p>沒有符合條件的私人課程學生。</p>
       <p>
        此頁只顯示私人課程。若要查專科班，請到{" "}
        <Link className="text-primary underline-offset-2 hover:underline" to="/Students">
         學生管理
        </Link>{" "}
        開啟學生詳情的「管理專科班報讀」。
       </p>
      </div>
     ) : isMobile ? (
      <StaggerList as="div" className="space-y-3">
       {filteredClassGroups.map((group) => {
        const primary =
         group.find((r) => r.enrollmentRowStatus !== "已退讀") ?? group[0]
        if (!primary) return null
        const activeRows = group.filter((r) => r.enrollmentRowStatus !== "已退讀")
        const allWithdrawn = activeRows.length === 0
        const highlighted = group.some((r) => r.studentId === highlightStudentId)
        return (
         <StaggerItem
          key={primary.classId}
          as="article"
          className={cn(
           "rounded-xl border border-border bg-card p-4 shadow-sm",
           highlighted && "ring-2 ring-info/40"
          )}
         >
          <div className="flex flex-wrap items-start justify-between gap-2">
           <div className="min-w-0 space-y-0.5">
            {group.map((r) => (
             <Link
              key={r.enrollmentId}
              to={`/Students/${r.studentId}`}
              className="block font-semibold text-primary hover:underline"
             >
              {r.fullName}
             </Link>
            ))}
           </div>
           {allWithdrawn ? (
            <Tag tone="default" size="sm">
             已退讀
            </Tag>
           ) : group.some((r) => r.enrollmentRowStatus === "已退讀") ? (
            <Tag tone="default" size="sm">
             部分退讀
            </Tag>
           ) : (
            <Tag tone={statusToTagTone(primary.enrollmentRowStatus)} size="sm">
             {primary.enrollmentRowStatus}
            </Tag>
           )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
           <p className="text-muted-foreground">私人班別</p>
           <p className="truncate text-right">
            <Link
             to={`/Classes/${primary.classId}`}
             state={{ fromPrivateTutoring: true }}
             className="text-primary hover:underline"
            >
             {primary.classSubject}
            </Link>
           </p>
           {!isTeacherPortal ? (
            <>
             <p className="text-muted-foreground">老師</p>
             <p className="truncate text-right">{primary.teacherName ?? "—"}</p>
            </>
           ) : null}
           <p className="text-muted-foreground">下一堂</p>
           <p className="truncate text-right tabular-nums">
            {formatNextLessonLabel(primary.nextLesson)}
            {primary.upcomingLessonCount > 1 ? (
             <span className="ml-1 text-xs text-muted-foreground">
              +{primary.upcomingLessonCount - 1}
             </span>
            ) : null}
           </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
           {!allWithdrawn ? (
            <Button
             type="button"
             size="sm"
             variant="outline"
             className="gap-1.5"
             onClick={() => void openBookDialog(primary)}
            >
             <CalendarClock className="h-4 w-4" aria-hidden />
             預約
            </Button>
           ) : null}
           {canManageEnrollment
            ? activeRows.map((r) => (
               <Button
                key={r.enrollmentId}
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive"
                onClick={() => void onWithdraw(r)}
               >
                <UserMinus className="h-4 w-4" aria-hidden />
                {group.length > 1 ? `退讀：${r.fullName}` : "退讀"}
               </Button>
              ))
            : null}
          </div>
         </StaggerItem>
        )
       })}
      </StaggerList>
     ) : (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
       <div className="min-w-[56rem]">
        <div
         className={cn(
          PRIVATE_TUTORING_ROW_GRID,
          "border-b border-border bg-muted/40 text-left text-sm text-muted-foreground"
         )}
        >
         <div className="px-1 py-3" aria-hidden />
         <div className="px-4 py-3 font-medium">學生</div>
         <div className="px-4 py-3 font-medium">學號</div>
         <div className="px-4 py-3 font-medium">年級</div>
         <div className="px-4 py-3 font-medium">私人班別</div>
         <div className="px-4 py-3 font-medium">老師</div>
         <div className="px-4 py-3 font-medium">狀態</div>
         <div className="px-4 py-3 font-medium">下一堂</div>
         <div className="px-4 py-3 font-medium">操作</div>
        </div>
        <StaggerList as="div">
         {filteredClassGroups.map((group) => {
          const primary =
           group.find((r) => r.enrollmentRowStatus !== "已退讀") ?? group[0]
          if (!primary) return null
          const highlighted = group.some((r) => r.studentId === highlightStudentId)
          return (
           <StaggerItem
            key={primary.classId}
            className={cn(highlighted && "bg-info/10 ring-2 ring-inset ring-info/40")}
           >
            <PrivateTutoringStudentDisclosure
             rows={group}
             canManageEnrollment={canManageEnrollment}
             schedules={rowSchedulesByClassId[primary.classId]}
             schedulesLoading={Boolean(rowSchedulesLoadingIds[primary.classId])}
             onToggleOpen={(open) => {
              if (open) void ensureRowSchedules(primary.classId)
             }}
             onBook={() => void openBookDialog(primary)}
             onWithdraw={(row) => void onWithdraw(row)}
            />
           </StaggerItem>
          )
         })}
        </StaggerList>
       </div>
      </div>
     )}
     <p className="text-sm text-muted-foreground">
      共 {filteredClassGroups.length} 班／{filteredRows.length} 筆報讀（全部 {rows.length}{" "}
      筆私人課程報讀，含已退讀）
     </p>
    </div>
   )}

   {tab === "rooms" && (
    <div className="space-y-4">
     <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1">
       <label className="text-sm font-medium text-muted-foreground">日期</label>
       <Input
        type="date"
        className="h-10 w-[12rem] text-sm"
        value={roomDate}
        onChange={(e) => setRoomDate(e.target.value)}
       />
      </div>
      <div className="min-w-[10rem] space-y-1">
       <label className="text-sm font-medium text-muted-foreground">時段</label>
       <Select
        className="h-10 text-sm"
        value={String(roomSlotIdx)}
        onChange={(e) => setRoomSlotIdx(Number(e.target.value))}
       >
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
      <StaggerList as="div" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       {roomStatuses.map(({ room, free, occupiers }) => (
        <StaggerItem
         key={room.id}
         className={cn(
          "rounded-xl border px-4 py-3 shadow-sm",
          free ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
         )}
        >
         <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold">{room.name}</span>
          <Tag tone={free ? "success" : "warning"}>{free ? "空房" : "已佔用"}</Tag>
         </div>
         {!free && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
           {occupiers.map((o) => (
            <li key={`${o.kind}-${o.id}`} className="truncate" title={o.label}>
             {o.label}
             {o.teacherName ? ` · ${o.teacherName}` : ""}
             {o.statusNote ? `（${o.statusNote}）` : ""}
            </li>
           ))}
          </ul>
         )}
        </StaggerItem>
       ))}
      </StaggerList>
     )}
     <p className="text-sm text-muted-foreground">
      空房判斷包含所有專科班排程與待審批的約房申請，與老師預約空房頁面使用同一套邏輯。
     </p>
    </div>
   )}

   <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>新增私人課程報讀</DialogTitle>
     </DialogHeader>
     <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
       會自動建立私人課程班別（無固定時間／課室）並為學生報讀，無需走專科班開班流程。
      </p>

      <div className="space-y-1">
       <label className="text-sm font-medium text-muted-foreground">報讀類型</label>
       <Select
        value={createMode}
        onChange={(e) => {
         const next = e.target.value as PrivateCreateMode
         setCreateMode(next)
         if (next === "1to1") {
          setCreateSecondStudentId("")
          setCreateSecondStudentSearch("")
          setCreateSecondStudentPickerOpen(false)
         }
        }}
       >
        <option value="1to1">一對一</option>
        <option value="1to2">一對二</option>
       </Select>
      </div>

      <div className="space-y-1">
       <label className="text-sm font-medium text-muted-foreground">第一位學生（可搜尋姓名／學號／年級）</label>
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
         className="text-left text-sm text-primary underline-offset-4 hover:underline"
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

      {createMode === "1to2" ? (
       <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">第二位學生（不可與第一位重複）</label>
        <div className="relative">
         <Input
          placeholder="輸入姓名、學號或年級搜尋…"
          value={
           createSecondStudentId
            ? selectedCreateSecondStudent
              ? createStudentLabel(selectedCreateSecondStudent)
              : ""
            : createSecondStudentSearch
          }
          onChange={(e) => {
           setCreateSecondStudentId("")
           setCreateSecondStudentSearch(e.target.value)
           setCreateSecondStudentPickerOpen(true)
          }}
          onFocus={() => setCreateSecondStudentPickerOpen(true)}
         />
         {createSecondStudentPickerOpen &&
         !createSecondStudentId &&
         createSecondStudentSearch.trim() ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
           {createSecondStudentOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">找不到學生</div>
           ) : (
            createSecondStudentOptions.map((s) => (
             <button
              key={s.id}
              type="button"
              className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pickCreateSecondStudent(s)}
             >
              {createStudentLabel(s)}
             </button>
            ))
           )}
          </div>
         ) : null}
        </div>
        {createSecondStudentId ? (
         <button
          type="button"
          className="text-left text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => {
           setCreateSecondStudentId("")
           setCreateSecondStudentSearch("")
           setCreateSecondStudentPickerOpen(false)
          }}
         >
          清除第二位學生
         </button>
        ) : null}
       </div>
      ) : null}

      <div className="space-y-1">
       <label className="text-sm font-medium text-muted-foreground">科目（可搜尋或直接輸入）</label>
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
       <p className="text-sm text-muted-foreground">
        可從列表選取，亦可直接輸入未列出的科目名稱。
       </p>
      </div>

      <div className="space-y-1">
       <label className="text-sm font-medium text-muted-foreground">授課老師（可留空）</label>
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
       <label className="text-sm font-medium text-muted-foreground">每節學費（可留空）</label>
       <Input
        type="number"
        min={0}
        step={1}
        value={createPrice}
        onChange={(e) => setCreatePrice(e.target.value)}
        placeholder="金額"
       />
       <div className="mt-1 flex flex-wrap gap-1.5">
        {PRIVATE_TUITION_PRICE_PRESETS_HKD.map((p) => (
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
       <label className="text-sm font-medium text-muted-foreground">自訂班名（可留空，預設自動產生）</label>
       <Input
        value={createClassNameOverride}
        onChange={(e) => setCreateClassNameOverride(e.target.value)}
        placeholder={previewClassSubject || "例如：陳大文英文一對一 / 陳大文＋林小明英文一對二"}
       />
       {previewClassSubject ? (
        <p className="text-sm text-muted-foreground">將建立班別：{previewClassSubject}</p>
       ) : null}
      </div>

      {createErr && <p role="alert" className="text-sm text-destructive whitespace-pre-wrap">{createErr}</p>}

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
        <p className="font-medium">
         {(studentNamesByClassId.get(bookRow.classId) ?? [bookRow.fullName]).join("、")}
        </p>
        <p className="text-muted-foreground">{bookRow.classSubject}</p>
       </div>

       {!rescheduleScheduleId ? (
        <div className="space-y-1">
         <label className="text-sm font-medium text-muted-foreground">預約方式</label>
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
         <label className="text-sm font-medium text-muted-foreground">共幾堂（1–52）</label>
         <Input
          type="number"
          min={1}
          max={52}
          value={bookWeekCount}
          onChange={(e) => setBookWeekCount(e.target.value)}
         />
         <p className="text-sm text-muted-foreground">
          自選定日期起每週同一時段；有衝突時會先預覽，可略過衝突日或無視衝突建立。
         </p>
        </div>
       ) : null}

       <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">
         {rescheduleScheduleId ? "改約日期" : "上課日期"}
        </label>
        <Input type="date" value={bookDate} onChange={(e) => void onBookDateChange(e.target.value)} />
       </div>

       <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">時段</label>
        <Select
         value={String(bookSlotIdx)}
         onChange={(e) => {
          const next = Number(e.target.value)
          setBookSlotIdx(next)
          if (!canUseConsecutiveFromSlotIndex(next)) setBookConsecutive(false)
          setBookRoomId("")
         }}
        >
         {LESSON_SLOT_INDICES.map((i) => (
          <option key={i} value={String(i)}>
           {bookConsecutive &&
           !rescheduleScheduleId &&
           canUseConsecutiveFromSlotIndex(i)
            ? `${consecutivePairFromFirstSlotIndex(i)?.displayRange ?? lessonSlotLabel(i)}（連堂）`
            : lessonSlotLabel(i)}
          </option>
         ))}
        </Select>
        {!rescheduleScheduleId ? (
         <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
          <input
           type="checkbox"
           className="h-4 w-4 rounded border-input"
           checked={bookConsecutive && canUseConsecutiveFromSlotIndex(bookSlotIdx)}
           disabled={!canUseConsecutiveFromSlotIndex(bookSlotIdx)}
           onChange={(e) => {
            setBookConsecutive(e.target.checked)
            setBookRoomId("")
           }}
          />
          連堂（連續 2 節 · 150 分鐘 · 計 2 堂學費）
         </label>
        ) : null}
        {bookConsecutive && canUseConsecutiveFromSlotIndex(bookSlotIdx) ? (
         <p className="text-sm text-muted-foreground">
          將一次建立 2 筆排程
          {bookMode === "weekly" ? "；週期預約每次上課亦為連堂" : ""}。
         </p>
        ) : null}
       </div>

       <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">課室（選填，僅顯示空房）</label>
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
         <p className="text-sm text-warning">此時段沒有空房；可暫不指定課室並確認預約。</p>
        )}
       </div>

       <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">授課老師</label>
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
         <p className="text-sm text-muted-foreground">老師入口固定為本人授課。</p>
        ) : null}
       </div>

       {activeUpcomingSchedules.length > 0 && (
        <div className="space-y-2">
         <p className="text-sm font-medium text-muted-foreground">已排課堂</p>
         <ul className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2">
          {activeUpcomingSchedules.map((s) => (
           <li
            key={s.id}
            className={cn(
             "rounded-md px-2.5 py-2 text-sm",
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

       {bookErr && (
        <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{bookErr}</p>
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
