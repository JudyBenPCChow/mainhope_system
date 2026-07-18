import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CalendarDays, Pencil, ScrollText, Users } from "lucide-react"

import { DetailLayerShell } from "@/components/detail/DetailLayerShell"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { BatchSchedulePanel } from "@/components/classes/BatchSchedulePanel"
import { CancelReasonDialog } from "@/components/schedule/CancelReasonDialog"
import { ScheduleListCard } from "@/components/schedules/ScheduleListCard"
import { ScheduleDateTime } from "@/lib/scheduleDisplay"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import {
 CLASS_GRADE_FORM_OPTIONS,
 CLASS_TIME_SLOT_OPTIONS,
 KANBAN_DAY_COLUMNS,
 STATUS_CHIPS,
 formatWeekdaysDisplay,
 normalizeClassGradeForForm,
 timeSlotSelectValueFromStored,
 weekdaysEqual,
 weekdaysFromStored,
 weekdaysToStored,
} from "@/components/classes/classesUi"
import {
 canUseConsecutiveFromTimeSlot,
 formatClassTimeDisplay,
 isConsecutiveClass,
} from "@/lib/consecutiveLesson"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isAlien, isMgmtStaff } from "@/lib/mgmtRole"
import { gradeChineseToCode } from "@/lib/courseCode"
import {
 academicYearEditBlockedMessage,
 academicYearLabelForClass,
 canEditAcademicYear,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { classDisplayName } from "@/lib/courseLabel"
import {
 classGradeDisplayText,
 normalizeStoredClassGradeLabels,
} from "@/lib/classGrade"
import { cn } from "@/lib/utils"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 deleteSchedule,
 fetchClassStudents,
 fetchClassSchedules,
 fetchClassroomOptions,
 fetchCourseOptions,
 fetchScheduleStudentHintsForClass,
 fetchSubjectOptions,
 fetchTeacherOptions,
 getClassById,
 insertScheduleForClass,
 insertSchedulesForClassSession,
 nextSessionNumberForClass,
 reorderClassScheduleSessionNumbers,
 type ClassRecord,
 type ClassScheduleRow,
 type ClassStudentRow,
 type ScheduleStudentHints,
 type SubjectOption,
 updateClass,
 updateSchedule,
} from "@/services/classQueries"
import {
 buildWeeklyDates,
 checkPrivateBookingConflicts,
 createPrivateRecurringBookings,
 previewPrivateRecurringBookings,
 updatePrivateClassSettings,
} from "@/services/privateTutoringQueries"
import {
 fetchRoomCalendarBundle,
 occupiersForSlot,
} from "@/services/roomBookingQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import {
 formatMin,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"
import {
 fetchEnrollmentChangeEventsForClass,
 type ClassEnrollmentChangeEvent,
 fetchAllStudents,
 insertEnrollment,
 purgeMistakenEnrollment,
 withdrawStudentFromClass,
 type StudentRecord,
} from "@/services/studentQueries"
import { withdrawPrivateEnrollment } from "@/services/privateTutoringQueries"
import {
 ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
 SUMMER_ENROLLMENT_FORM_OPTIONS,
 type EnrollmentFormValue,
 type EnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import { localYmd } from "@/services/scheduleQueries"
import { countBoundSchedulesForEnrollment } from "@/services/pendingLessonQueries"

const PRICE_PRESETS_HKD = [250, 275, 825] as const

/** 日期／文字欄清空時勿送 "" 給 Postgres（date 欄位會報錯） */
function nullIfBlankYmd(v: string | null | undefined): string | null {
 if (v == null) return null
 const t = String(v).trim()
 if (!t) return null
 return t.slice(0, 10)
}

function nullIfBlankText(v: string | null | undefined): string | null {
 if (v == null) return null
 const t = String(v).trim()
 return t === "" ? null : t
}

function normYmd(v: string | null | undefined): string | null {
 if (v == null) return null
 const t = String(v).trim().slice(0, 10)
 return t === "" ? null : t
}

function normNum(v: number | null | undefined): number | null {
 if (v == null || Number.isNaN(v)) return null
 return v
}

function normalizedGradesFromClass(cls: ClassRecord): string[] {
 return [
  ...new Set(
   (cls.grade ?? [])
    .map((g) => normalizeClassGradeForForm(g))
    .filter((x): x is string => x != null)
  ),
 ].sort()
}

function gradesEqual(a: string[] | undefined, b: string[]): boolean {
 const sa = [...(a ?? [])].sort()
 const sb = [...b].sort()
 return sa.length === sb.length && sa.every((v, i) => v === sb[i])
}

function isClassEditFormDirty(
 cls: ClassRecord,
 form: Partial<ClassRecord>,
 gradeSelections: string[],
 weekdaySelections: string[],
 templateCourseId: string
): boolean {
 if (cls.course_id && templateCourseId !== (cls.course_id ?? "")) return true
 if (!gradesEqual(gradeSelections, normalizedGradesFromClass(cls))) return true
 if (!weekdaysEqual(weekdaySelections, cls.day_of_week)) return true
 const safeCap = cls.capacity != null && cls.capacity < 0 ? null : cls.capacity
 return [
  (form.subject ?? "") !== (cls.subject ?? ""),
  (form.time_slot ?? null) !== (cls.time_slot ?? null),
  (form.lesson_slots_per_session ?? 1) !== (cls.lesson_slots_per_session ?? 1),
  (form.teacher_id ?? null) !== (cls.teacher_id ?? null),
  (form.classroom_id ?? null) !== (cls.classroom_id ?? null),
  normNum(form.capacity ?? null) !== normNum(safeCap),
  normNum(form.price_per_lesson ?? null) !== normNum(cls.price_per_lesson ?? null),
  normYmd(form.start_date) !== normYmd(cls.start_date),
  normYmd(form.end_date) !== normYmd(cls.end_date),
  (form.status ?? "進行中") !== (cls.status ?? "進行中"),
  (form.section_code ?? null) !== (cls.section_code ?? null),
  (form.enrollment_notice?.trim() || null) !== (cls.enrollment_notice?.trim() || null),
 ].some(Boolean)
}

type TabId = "basic" | "students" | "enrollment" | "schedule"

type UnsavedLeaveChoice = "save" | "discard" | "cancel"

const TABS: {
 id: TabId
 label: (n: { st: number; ev: number; sc: number }) => string
 icon: typeof BookOpen
}[] = [
 { id: "basic", label: () => "基本資料", icon: BookOpen },
 { id: "students", label: ({ st }) => `學生名單 (${st})`, icon: Users },
 { id: "enrollment", label: ({ ev }) => `增退紀錄 (${ev})`, icon: ScrollText },
 { id: "schedule", label: ({ sc }) => `排程 (${sc})`, icon: CalendarDays },
]

export function ClassDetailView() {
 const { classId } = useParams<{ classId: string }>()
 const navigate = useNavigate()
 const location = useLocation()
 const cid = classId ?? ""
 const canManageClass = isMgmtStaff()
 const fromPrivateTutoring =
  Boolean((location.state as { fromPrivateTutoring?: boolean } | null)?.fromPrivateTutoring)
 const [tab, setTab] = useState<TabId>("basic")
 const [cls, setCls] = useState<ClassRecord | null>(null)
 const [students, setStudents] = useState<ClassStudentRow[]>([])
 const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
 const [enrollmentEvents, setEnrollmentEvents] = useState<ClassEnrollmentChangeEvent[]>([])
 const [schedules, setSchedules] = useState<ClassScheduleRow[]>([])
 const [scheduleHints, setScheduleHints] = useState<Map<string, ScheduleStudentHints>>(
  new Map()
 )
 const [hintsLoading, setHintsLoading] = useState(false)
 const hintsRequestIdRef = useRef(0)
 const [savingSessionId, setSavingSessionId] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [editOpen, setEditOpen] = useState(false)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [savingEdit, setSavingEdit] = useState(false)
 const [privateLightOpen, setPrivateLightOpen] = useState(false)
 const [privateLightTeacherId, setPrivateLightTeacherId] = useState("")
 const [privateLightPrice, setPrivateLightPrice] = useState("")
 const [privateLightErr, setPrivateLightErr] = useState<string | null>(null)
 const [privateLightSaving, setPrivateLightSaving] = useState(false)
 const [privateBookOpen, setPrivateBookOpen] = useState(false)
 const [privateBookDate, setPrivateBookDate] = useState(() => localYmd())
 const [privateBookSlotIdx, setPrivateBookSlotIdx] = useState(0)
 const [privateBookRoomId, setPrivateBookRoomId] = useState("")
 const [privateBookTeacherId, setPrivateBookTeacherId] = useState("")
 const [privateBookMode, setPrivateBookMode] = useState<"single" | "weekly">("single")
 const [privateBookWeekCount, setPrivateBookWeekCount] = useState("4")
 const [privateBookSaving, setPrivateBookSaving] = useState(false)
 const [privateBookErr, setPrivateBookErr] = useState<string | null>(null)
 const [privateBookRooms, setPrivateBookRooms] = useState<RoomRecord[]>([])
 const [privateBookSchedules, setPrivateBookSchedules] = useState<
  Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["schedules"]
 >([])
 const [privateBookPending, setPrivateBookPending] = useState<
  Awaited<ReturnType<typeof fetchRoomCalendarBundle>>["pending"]
 >([])
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
 const [rooms, setRooms] = useState<{ id: string; label: string }[]>([])
 const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([])
 const [templateSubjectId, setTemplateSubjectId] = useState("")
 const [templateGradeCode, setTemplateGradeCode] = useState("")
 const [templateCourseId, setTemplateCourseId] = useState("")
 const [templateCourseOptions, setTemplateCourseOptions] = useState<{ id: string; label: string }[]>([])
 const [form, setForm] = useState<Partial<ClassRecord>>({})
 const [gradeSelections, setGradeSelections] = useState<string[]>([])
 const [weekdaySelections, setWeekdaySelections] = useState<string[]>([])
 const [schedFilter, setSchedFilter] = useState<"all" | "future" | "past" | "cancel">("future")
 const [addSchedOpen, setAddSchedOpen] = useState(false)
 const [newSchedDate, setNewSchedDate] = useState(() => localYmd())
 const [newSchedTimeSlot, setNewSchedTimeSlot] = useState("")
 const [newSchedSession, setNewSchedSession] = useState<number | null>(null)
 const [savingAddSched, setSavingAddSched] = useState(false)
 const [reorderingSessions, setReorderingSessions] = useState(false)
 const [addSchedErr, setAddSchedErr] = useState<string | null>(null)
 const [addStudentOpen, setAddStudentOpen] = useState(false)
 const [addStudentForm, setAddStudentForm] = useState<string>("兩期全報")
 const [addStudentScheduleIds, setAddStudentScheduleIds] = useState<string[]>([])
 const [addStudentEntitledCount, setAddStudentEntitledCount] = useState("")
 const [addStudentBoundPreview, setAddStudentBoundPreview] = useState<number | null>(null)
 const [studentQuery, setStudentQuery] = useState("")
 const [addingStudentId, setAddingStudentId] = useState<string | null>(null)
 const [addStudentErr, setAddStudentErr] = useState<string | null>(null)
 const [schedActionErr, setSchedActionErr] = useState<string | null>(null)
 const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null)
 const [cancelSaving, setCancelSaving] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)
 const [unsavedLeaveOpen, setUnsavedLeaveOpen] = useState(false)

 const teacherScopeId = getTeacherScopeTeacherId()
 const isTeacherPortal = Boolean(teacherScopeId)

 const classYearLocked = useMemo(
  () => (cls ? !canEditAcademicYear(academicYearLabelForClass(cls)) : false),
  [cls]
 )
 const isPrivateClass = cls?.class_kind === "private"
 const privateCapacity = cls?.capacity != null ? Math.max(0, cls.capacity) : null
 const canAddPrivateStudent =
  Boolean(isPrivateClass) &&
  canManageClass &&
  !classYearLocked &&
  !isTeacherPortal &&
  (privateCapacity == null || students.length < privateCapacity)
 const isOwnTeacherClass = Boolean(
  teacherScopeId && cls?.teacher_id && cls.teacher_id === teacherScopeId
 )
 /** 一對一：不開放小組課式「編輯班別」表單（固定星期／課室）；排程可在此管理 */
 const canEditClass = canManageClass && !classYearLocked && !isPrivateClass
 /** 一對一輕量編輯：老師／學費（admin／alien；老師入口不可改） */
 const canEditPrivateLight =
  canManageClass && !classYearLocked && Boolean(isPrivateClass) && !isTeacherPortal
 /** 一對一可在詳情頁預約（admin／alien，或指派老師本人） */
 const canBookPrivate =
  Boolean(isPrivateClass) &&
  !classYearLocked &&
  (canManageClass || isOwnTeacherClass)
 const canEditSchedule = (scheduledDate: string) =>
  (canManageClass || isOwnTeacherClass) && canEditAcademicYearForDate(scheduledDate)
 const classesListPath = isPrivateClass || fromPrivateTutoring ? "/PrivateTutoring" : "/Classes"

 const unsavedLeaveResolverRef = useRef<((choice: UnsavedLeaveChoice) => void) | null>(null)
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()

 const promptUnsavedLeave = useCallback(
  () =>
   new Promise<UnsavedLeaveChoice>((resolve) => {
    unsavedLeaveResolverRef.current = resolve
    setUnsavedLeaveOpen(true)
   }),
  []
 )

 const finishUnsavedLeave = useCallback((choice: UnsavedLeaveChoice) => {
  setUnsavedLeaveOpen(false)
  unsavedLeaveResolverRef.current?.(choice)
  unsavedLeaveResolverRef.current = null
 }, [])

 const resetEditFormFromClass = useCallback(() => {
  if (!cls) return
  const safeCap = cls.capacity != null && cls.capacity < 0 ? null : cls.capacity
  setForm({
   ...cls,
   capacity: safeCap,
  })
  setGradeSelections(normalizedGradesFromClass(cls))
  setWeekdaySelections(weekdaysFromStored(cls.day_of_week))
  setTemplateSubjectId(cls.subject_id ?? "")
  setTemplateGradeCode(cls.grade_code ?? "")
  setTemplateCourseId(cls.course_id ?? "")
 }, [cls])

 const reload = useCallback(async () => {
  if (!cid) return
  setLoading(true)
  setPageErr(null)
  try {
   const teacherScope = getTeacherScopeTeacherId()
   const [c, st, ev, sc, tch, rm, allSt, subjectOpts] = await Promise.all([
    getClassById(cid),
    fetchClassStudents(cid),
    fetchEnrollmentChangeEventsForClass(cid),
    fetchClassSchedules(cid),
    fetchTeacherOptions(),
    fetchClassroomOptions(),
    teacherScope ? Promise.resolve([] as StudentRecord[]) : fetchAllStudents(),
    fetchSubjectOptions(),
   ])
   setCls(c)
   if (c) {
    const safeCap = c.capacity != null && c.capacity < 0 ? null : c.capacity
    setForm({
     ...c,
     capacity: safeCap,
    })
    const grades = (c.grade ?? [])
     .map((g) => normalizeClassGradeForForm(g))
     .filter((x): x is string => x != null)
    setGradeSelections([...new Set(grades)])
    setWeekdaySelections(weekdaysFromStored(c.day_of_week))
    setTemplateSubjectId(c.subject_id ?? "")
    setTemplateGradeCode(c.grade_code ?? "")
    setTemplateCourseId(c.course_id ?? "")
   } else {
    setForm({})
    setGradeSelections([])
    setWeekdaySelections([])
    setTemplateSubjectId("")
    setTemplateGradeCode("")
    setTemplateCourseId("")
   }
   setStudents(st)
   setEnrollmentEvents(ev)
   setSchedules(sc)
   setTeachers(tch)
   setRooms(rm)
   setAllStudents(allSt)
   setSubjectOptions(subjectOpts)
   setLoading(false)

   const reqId = ++hintsRequestIdRef.current
   setHintsLoading(true)
   try {
    const hints = await fetchScheduleStudentHintsForClass(
     cid,
     sc.map((s) => ({ id: s.id, scheduled_date: s.scheduled_date }))
    )
    if (reqId !== hintsRequestIdRef.current) return
    setScheduleHints(hints)
   } catch (e) {
    if (reqId !== hintsRequestIdRef.current) return
    reportUserFacingError(e, {
     source: "ClassDetailView.reload.hints",
     userMessage: "排程學生名單載入失敗",
    })
   } finally {
    if (reqId === hintsRequestIdRef.current) setHintsLoading(false)
   }
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.reload",
    setErr: setPageErr,
    userMessage: msg,
   })
   setLoading(false)
  }
 }, [cid])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  if (!templateSubjectId || !templateGradeCode) {
   setTemplateCourseOptions([])
   return
  }
  void (async () => {
   try {
    const opts = await fetchCourseOptions({
     subject_id: templateSubjectId,
     grade_code: templateGradeCode,
    })
    setTemplateCourseOptions(opts.map((o) => ({ id: o.id, label: o.label })))
   } catch {
    setTemplateCourseOptions([])
   }
  })()
 }, [templateSubjectId, templateGradeCode])

 const today = localYmd()

 const schedFiltered = useMemo(() => {
  return schedules.filter((s) => {
   if (schedFilter === "all") return true
   if (schedFilter === "cancel") return s.status.includes("取消")
   if (schedFilter === "past")
    return s.scheduled_date < today && !s.status.includes("取消")
   return s.scheduled_date >= today && !s.status.includes("取消")
  })
 }, [schedules, schedFilter, today])

 const parts = useMemo(() => {
  let fut = 0
  let past = 0
  let canc = 0
  for (const s of schedules) {
   if (s.status.includes("取消")) {
    canc++
    continue
   }
   if (s.scheduled_date >= today) fut++
   else past++
  }
  return { fut, past, canc }
 }, [schedules, today])

 const saveClass = async (): Promise<boolean> => {
  if (!cid || !cls) return false
  setEditErr(null)
  const cap = form.capacity
  if (cap != null && cap < 0) {
   pushBanner({ tone: "warning", title: "收生上限不可為負數" })
   return false
  }
  const courseChanging =
   Boolean(cls.course_id) &&
   templateCourseId !== "" &&
   templateCourseId !== cls.course_id
  if (cls.course_id && !templateCourseId) {
   pushBanner({ tone: "warning", title: "請選擇課程模板" })
   return false
  }
  if (courseChanging) {
   const parts = [
    "更換課程模板後，班別編碼、科目與年級會一併更新。",
    students.length > 0 ? `目前已有 ${students.length} 位就讀學生。` : null,
    schedules.length > 0 ? `目前已有 ${schedules.length} 筆排程。` : null,
    "這些紀錄不會自動清除。確定繼續？",
   ].filter(Boolean)
   if (
    !(await confirmDialog({
     title: "確認更換課程模板？",
     description: parts.join("\n"),
     confirmText: "確認更換",
    }))
   )
    return false
  }
  const gradeArr = cls.course_id
   ? gradeSelections
   : normalizeStoredClassGradeLabels(gradeSelections.length > 0 ? gradeSelections : null)
  const dayStored = weekdaysToStored(weekdaySelections)
  setSavingEdit(true)
  try {
   await updateClass(cid, {
    ...(courseChanging ? { course_id: templateCourseId } : {}),
    subject: cls.course_id ? cls.subject : form.subject ?? cls.subject,
    section_code: form.section_code?.trim() || null,
    grade: gradeArr,
    day_of_week: dayStored,
    time_slot: nullIfBlankText(form.time_slot),
    lesson_slots_per_session: isConsecutiveClass(form.lesson_slots_per_session) ? 2 : 1,
    teacher_id: form.teacher_id ?? null,
    classroom_id: form.classroom_id ?? null,
    capacity: cap == null ? null : Math.max(0, Math.floor(cap)),
    price_per_lesson:
     form.price_per_lesson != null && !Number.isNaN(form.price_per_lesson)
      ? Math.max(0, form.price_per_lesson)
      : null,
    start_date: nullIfBlankYmd(form.start_date),
    end_date: nullIfBlankYmd(form.end_date),
    status: form.status ?? cls.status,
    enrollment_notice: form.enrollment_notice?.trim() || null,
   })
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.saveClass",
    setErr: setEditErr,
    userMessage: msg,
   })
   return false
  } finally {
   setSavingEdit(false)
  }
  setEditOpen(false)
  await reload()
  pushBanner({ tone: "success", title: "已儲存班別設定", message: "班別資料已更新。" })
  return true
 }

 const requestCloseEdit = useCallback(async (): Promise<boolean> => {
  if (
   !cls ||
   !isClassEditFormDirty(cls, form, gradeSelections, weekdaySelections, templateCourseId)
  )
   return true
  const choice = await promptUnsavedLeave()
  if (choice === "cancel") return false
  if (choice === "save") {
   const ok = await saveClass()
   return ok
  }
  resetEditFormFromClass()
  return true
 }, [
  cls,
  form,
  gradeSelections,
  weekdaySelections,
  templateCourseId,
  promptUnsavedLeave,
  resetEditFormFromClass,
 ])

 const requestLeavePage = useCallback(async () => {
  if (editOpen) {
   const canClose = await requestCloseEdit()
   if (!canClose) return
   setEditOpen(false)
   setEditErr(null)
  }
  navigate(classesListPath)
 }, [editOpen, requestCloseEdit, navigate, classesListPath])

 const openPrivateLightEdit = useCallback(() => {
  if (!cls) return
  setPrivateLightTeacherId(cls.teacher_id ?? "")
  setPrivateLightPrice(cls.price_per_lesson != null ? String(cls.price_per_lesson) : "")
  setPrivateLightErr(null)
  setPrivateLightOpen(true)
 }, [cls])

 const savePrivateLightEdit = useCallback(async () => {
  if (!cls) return
  const priceNum = privateLightPrice.trim() === "" ? null : Number(privateLightPrice)
  if (priceNum != null && (Number.isNaN(priceNum) || priceNum < 0)) {
   setPrivateLightErr("學費不可為負數")
   return
  }
  setPrivateLightSaving(true)
  setPrivateLightErr(null)
  try {
   await updatePrivateClassSettings(cls.id, {
    teacherId: privateLightTeacherId || null,
    pricePerLesson: priceNum,
   })
   pushBanner({
    tone: "success",
    title: "已更新私人班別設定",
    message: "老師／學費已儲存。",
   })
   setPrivateLightOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, {
    source: "ClassDetailView.savePrivateLightEdit",
    setErr: setPrivateLightErr,
   })
  } finally {
   setPrivateLightSaving(false)
  }
 }, [cls, privateLightPrice, privateLightTeacherId, pushBanner, reload])

 const openPrivateBook = useCallback(async () => {
  if (!cls) return
  const tid = getTeacherScopeTeacherId()
  setPrivateBookDate(localYmd())
  setPrivateBookSlotIdx(0)
  setPrivateBookRoomId("")
  setPrivateBookTeacherId(tid || cls.teacher_id || "")
  setPrivateBookMode("single")
  setPrivateBookWeekCount("4")
  setPrivateBookErr(null)
  setPrivateBookOpen(true)
  try {
   const ymd = localYmd()
   const bundle = await fetchRoomCalendarBundle(ymd, ymd)
   setPrivateBookRooms(bundle.rooms)
   setPrivateBookSchedules(bundle.schedules)
   setPrivateBookPending(bundle.pending)
  } catch {
   setPrivateBookRooms([])
   setPrivateBookSchedules([])
   setPrivateBookPending([])
  }
 }, [cls])

 const onPrivateBookDateChange = useCallback(async (ymd: string) => {
  setPrivateBookDate(ymd)
  setPrivateBookRoomId("")
  if (!ymd) return
  try {
   const bundle = await fetchRoomCalendarBundle(ymd, ymd)
   setPrivateBookRooms(bundle.rooms)
   setPrivateBookSchedules(bundle.schedules)
   setPrivateBookPending(bundle.pending)
  } catch {
   /* ignore */
  }
 }, [])

 const privateBookFreeRoomIds = useMemo(() => {
  if (!privateBookDate) return new Set<string>()
  const slotStart = lessonSlotStartMinute(privateBookSlotIdx)
  const slotEnd = lessonSlotEndMinute(privateBookSlotIdx)
  const active = classroomsActiveOnDate(
   privateBookRooms.filter((r) => !r.is_online),
   privateBookDate
  )
  return new Set(
   active
    .filter(
     (room) =>
      occupiersForSlot(
       privateBookDate,
       room.id,
       slotStart,
       slotEnd,
       privateBookSchedules,
       privateBookPending
      ).length === 0
    )
    .map((r) => r.id)
  )
 }, [
  privateBookDate,
  privateBookSlotIdx,
  privateBookRooms,
  privateBookSchedules,
  privateBookPending,
 ])

 const privateBookActiveRooms = useMemo(
  () =>
   classroomsActiveOnDate(
    privateBookRooms.filter((r) => !r.is_online),
    privateBookDate
   ),
  [privateBookRooms, privateBookDate]
 )

 const submitPrivateBook = useCallback(async () => {
  if (!cls || !privateBookDate) {
   setPrivateBookErr("請選擇日期")
   return
  }
  const startTime = formatMin(lessonSlotStartMinute(privateBookSlotIdx))
  const endTime = formatMin(lessonSlotEndMinute(privateBookSlotIdx))
  const teacherId = teacherScopeId || privateBookTeacherId || cls.teacher_id
  const classroomId = privateBookRoomId.trim() || null
  const studentIds = students
   .filter((student) => student.status === "就讀中")
   .map((student) => student.studentId)
  setPrivateBookSaving(true)
  setPrivateBookErr(null)
  try {
   if (privateBookMode === "weekly") {
    const count = Number(privateBookWeekCount)
    if (!Number.isFinite(count) || count < 1 || count > 52) {
     setPrivateBookErr("堂數請輸入 1–52")
     return
    }
    if (studentIds.length === 0) {
     setPrivateBookErr("此班尚無就讀中學生，無法做學生衝突檢查；請先確認報讀。")
     return
    }
    const dates = buildWeeklyDates(privateBookDate, count)
    const preview = await previewPrivateRecurringBookings({
     dates,
     classroomId,
     startTime,
     endTime,
     teacherId,
     studentIds,
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
      setPrivateBookErr(lines.join("\n"))
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
     classId: cls.id,
     studentIds,
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
       ? `建成 ${result.created} 堂，略過 ${result.skipped.length} 堂`
       : `建成 ${result.created} 堂`,
    })
   } else {
    const conflicts = await checkPrivateBookingConflicts({
     classroomId,
     scheduledDate: privateBookDate,
     startTime,
     endTime,
     teacherId,
     studentIds,
    })
    if (conflicts.length > 0) {
     const ok = await confirmDialog({
      title: "發現時段衝突",
      description: `${conflicts.map((c) => c.label).join("\n")}\n\n仍要建立預約嗎？`,
      confirmText: "仍要預約",
      tone: "warning",
     })
     if (!ok) {
      setPrivateBookErr(conflicts.map((c) => c.label).join("\n"))
      return
     }
    }
    await insertScheduleForClass(cls.id, teacherId, {
     scheduled_date: privateBookDate,
     start_time: startTime,
     end_time: endTime,
     classroom_id: classroomId,
     status: "正常",
    })
    pushBanner({
     tone: "success",
     title: "已建立預約",
     message: `${privateBookDate} ${lessonSlotLabel(privateBookSlotIdx)}`,
    })
   }
   setPrivateBookOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, {
    source: "ClassDetailView.submitPrivateBook",
    setErr: setPrivateBookErr,
   })
  } finally {
   setPrivateBookSaving(false)
  }
 }, [
  cls,
  privateBookDate,
  privateBookSlotIdx,
  privateBookRoomId,
  privateBookTeacherId,
  privateBookMode,
  privateBookWeekCount,
  teacherScopeId,
  students,
  confirmDialog,
  pushBanner,
  reload,
 ])

 useEffect(() => {
  if (!addSchedOpen || !cid) return
  setNewSchedDate(localYmd())
  setNewSchedTimeSlot(
   cls?.time_slot ? timeSlotSelectValueFromStored(cls.time_slot) || cls.time_slot : ""
  )
  setAddSchedErr(null)
  void nextSessionNumberForClass(cid).then(setNewSchedSession)
 }, [addSchedOpen, cls?.time_slot, cid])

 const addSched = async () => {
  if (!cls) return
  if (!newSchedTimeSlot.trim() && !cls.time_slot) {
   setAddSchedErr("請選擇時段")
   return
  }
  setSavingAddSched(true)
  setAddSchedErr(null)
  try {
   const timeSlot = newSchedTimeSlot.trim() || cls.time_slot || ""
   await insertSchedulesForClassSession(
    cid,
    { ...cls, time_slot: timeSlot || cls.time_slot },
    {
     scheduled_date: newSchedDate,
     session_number: newSchedSession,
     classroom_id: cls.classroom_id,
    }
   )
   setAddSchedOpen(false)
   setNewSchedDate(localYmd())
   setNewSchedTimeSlot("")
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.addSched",
    setErr: setAddSchedErr,
    userMessage: msg,
   })
  } finally {
   setSavingAddSched(false)
  }
 }

 const timeLine = (c: ClassRecord) =>
  formatClassTimeDisplay({
   dayOfWeek: formatWeekdaysDisplay(c.day_of_week),
   timeSlot: c.time_slot,
   lessonSlotsPerSession: c.lesson_slots_per_session,
  })

 useEffect(() => {
  if (!addStudentOpen || !cid || isPrivateClass) {
   setAddStudentBoundPreview(null)
   return
  }
  let cancelled = false
  const isSingle = addStudentForm === SINGLE_SESSION_ENROLLMENT
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (
   cls?.course_mode === "summer_two_period" &&
   ENROLLMENT_PERIOD_OPTIONS.includes(addStudentForm as EnrollmentPeriod)
  ) {
   period = addStudentForm as EnrollmentPeriod
  }
  void countBoundSchedulesForEnrollment({
   classId: cid,
   enrollmentPeriod: period,
   scheduleIds: isSingle ? addStudentScheduleIds : undefined,
  })
   .then((n) => {
    if (!cancelled) setAddStudentBoundPreview(n)
   })
   .catch(() => {
    if (!cancelled) setAddStudentBoundPreview(isSingle ? addStudentScheduleIds.length : null)
   })
  return () => {
   cancelled = true
  }
 }, [
  addStudentOpen,
  cid,
  isPrivateClass,
  addStudentForm,
  addStudentScheduleIds,
  cls?.course_mode,
 ])

 if (!cid) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel={null}>
    <p className="p-6 text-muted-foreground">無效路由</p>
   </DetailLayerShell>
  )
 }
 if (!loading && !cls) {
  return (
   <DetailLayerShell
    variant="student"
    onDismiss={() => navigate(fromPrivateTutoring ? "/PrivateTutoring" : "/Classes")}
    layerLabel="班別詳情"
   >
    <div className="p-6">
     <p className="text-muted-foreground">找不到班別。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to={fromPrivateTutoring ? "/PrivateTutoring" : "/Classes"}>返回</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 const scopeTeacherId = teacherScopeId
 if (!loading && cls && scopeTeacherId && cls.teacher_id !== scopeTeacherId) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate(classesListPath)} layerLabel="班別詳情">
    <div className="p-6">
     <p>此班別不屬於您的指派，無法檢視。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to={classesListPath}>返回</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 /** 名單不顯示已退讀；已退讀可再次加入。休學／退選仍佔名額。 */
 const rosterStudents = students.filter((s) => s.status !== "已退讀")
 const tabCounts = { st: rosterStudents.length, ev: enrollmentEvents.length, sc: schedules.length }
 const addableStudents = (() => {
  const occupiedIds = new Set(rosterStudents.map((s) => s.studentId))
  const q = studentQuery.trim().toLowerCase()
  const list = allStudents.filter((s) => !occupiedIds.has(s.id))
  if (!q) return list.slice(0, 50)
  return list
   .filter((s) => {
    const hay = [s.full_name, s.english_name, s.student_code, s.student_phone, s.parent_phone]
     .filter(Boolean)
     .join(" ")
     .toLowerCase()
    return hay.includes(q)
   })
   .slice(0, 50)
 })()

 const onAddStudentToClass = async (studentId: string) => {
  if (!cid) return
  setAddingStudentId(studentId)
  setAddStudentErr(null)
  try {
   if (isPrivateClass && privateCapacity != null && students.length >= privateCapacity) {
    setAddStudentErr("此私人班別已達人數上限")
    return
   }
   const isSummer = cls?.course_mode === "summer_two_period"
   const isSingle = !isPrivateClass && addStudentForm === SINGLE_SESSION_ENROLLMENT
   if (isSingle && addStudentScheduleIds.length === 0) {
    setAddStudentErr("單堂報讀請至少選擇一堂")
    return
   }
   let period: EnrollmentPeriod | typeof SINGLE_SESSION_ENROLLMENT | null = null
   if (isSingle) period = SINGLE_SESSION_ENROLLMENT
   else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(addStudentForm as EnrollmentPeriod)) {
    period = addStudentForm as EnrollmentPeriod
   }
   const entitledRaw = addStudentEntitledCount.trim()
   const entitled = entitledRaw === "" ? null : Math.floor(Number(entitledRaw))
   if (entitledRaw !== "" && (!Number.isFinite(entitled) || (entitled ?? 0) < 1)) {
    setAddStudentErr("應享堂數請輸入正整數，或留空")
    return
   }
   let bound = addStudentBoundPreview
   if (bound == null && !isPrivateClass) {
    bound = await countBoundSchedulesForEnrollment({
     classId: cid,
     enrollmentPeriod: period,
     scheduleIds: isSingle ? addStudentScheduleIds : undefined,
    })
   }
   const owed =
    !isPrivateClass && entitled != null && bound != null && entitled > bound
     ? entitled - bound
     : 0
   if (owed > 0) {
    const ok = await confirmDialog({
     title: "將記錄待補堂",
     description: `應享 ${entitled} 堂，目前只會綁定 ${bound} 堂，將同時記錄待補 ${owed} 堂。`,
     confirmText: "確認加入並記待補",
    })
    if (!ok) return
   }
   await insertEnrollment(
    studentId,
    cid,
    period,
    isSingle ? addStudentScheduleIds : undefined,
    owed > 0
     ? { owedCount: owed, reason: "遲報缺堂", remarks: `應享 ${entitled}／綁定 ${bound}` }
     : null
   )
   const addedName =
    allStudents.find((s) => s.id === studentId)?.full_name?.trim() || "學生"
   pushBanner({
    tone: "success",
    title: `已加入報讀：${addedName}`,
    message: owed > 0 ? `已記錄待補 ${owed} 堂。可前往收款／出單。` : "可前往收款／出單。",
    action: {
     pageLabel: "收款／出單",
     to: `/Payments?studentId=${encodeURIComponent(studentId)}&mode=receive`,
    },
   })
   setStudentQuery("")
   setAddStudentForm(isSummer ? "兩期全報" : "full")
   setAddStudentScheduleIds([])
   setAddStudentEntitledCount("")
   setAddStudentOpen(false)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onAddStudentToClass",
    setErr: setAddStudentErr,
    userMessage: msg,
   })
  } finally {
   setAddingStudentId(null)
  }
 }

 const onWithdrawStudent = async (s: ClassStudentRow) => {
  if (
   !(await confirmDialog({
    title: "確認退讀",
    description: isPrivateClass
     ? `確定將「${s.fullName}」自此班退讀？會保留增退紀錄，並取消今日起尚未取消的預約課堂。若只是手誤加錯人，請改用「其他操作 → 手誤清除」。`
     : `確定將「${s.fullName}」自此班退讀？會保留增退紀錄；若只是手誤加錯人，請改用「其他操作 → 手誤清除」。`,
    confirmText: "確認退讀",
    tone: "destructive",
   }))
  ) {
   return
  }
  try {
   if (isPrivateClass) {
    await withdrawPrivateEnrollment({
     enrollmentId: s.enrollmentId,
     studentId: s.studentId,
     classId: cid,
    })
   } else {
    await withdrawStudentFromClass({
     enrollmentId: s.enrollmentId,
     studentId: s.studentId,
     classId: cid,
     effectiveDate: localYmd(),
     reason: null,
    })
   }
   pushBanner({ tone: "success", title: "已退讀", message: `${s.fullName} 已標為已退讀。` })
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onWithdrawStudent",
    userMessage: msg,
   })
   pushBanner({ tone: "error", title: "退讀失敗", message: msg })
  }
 }

 const onPurgeMistakenStudent = async (s: ClassStudentRow) => {
  const studentName = s.fullName.trim()
  if (!studentName) {
   pushBanner({ tone: "error", title: "無法清除", message: "缺少學生姓名，請重新載入頁面後再試。" })
   return
  }
  if (
   !(await confirmDialog({
    title: "手誤清除報讀",
    description: `確定清除「${studentName}」在此班的報讀？會刪除該筆報讀及相關增退紀錄，不留下任何痕跡。若要保留紀錄請改用「退讀」。`,
    confirmText: "確認清除",
    tone: "destructive",
    confirmInput: {
     label: `請輸入學生姓名以確認：${studentName}`,
     expected: studentName,
     placeholder: studentName,
    },
   }))
  ) {
   return
  }
  try {
   await purgeMistakenEnrollment({
    enrollmentId: s.enrollmentId,
    studentId: s.studentId,
   })
   pushBanner({ tone: "success", title: "已清除手誤報讀", message: `${studentName} 已自本班名單移除，無增退紀錄。` })
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onPurgeMistakenStudent",
    userMessage: msg,
   })
   pushBanner({ tone: "error", title: "清除失敗", message: msg })
  }
 }

 const onChangeScheduleStatus = async (scheduleId: string, status: string) => {
  setSchedActionErr(null)
  if (status.includes("取消")) {
   setCancelScheduleId(scheduleId)
   return
  }
  try {
   await updateSchedule(scheduleId, { status, cancel_reason: null })
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onChangeScheduleStatus",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  }
 }

 const onConfirmCancelSchedule = async (reason: string) => {
  if (!cancelScheduleId) return
  setCancelSaving(true)
  setSchedActionErr(null)
  try {
   await updateSchedule(cancelScheduleId, { status: "取消", cancel_reason: reason })
   setCancelScheduleId(null)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onConfirmCancelSchedule",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  } finally {
   setCancelSaving(false)
  }
 }

 const onSaveSessionNumber = async (scheduleId: string, sessionNumber: number) => {
  setSavingSessionId(scheduleId)
  setSchedActionErr(null)
  try {
   await updateSchedule(scheduleId, { session_number: sessionNumber })
   setSchedules((prev) =>
    prev.map((s) => (s.id === scheduleId ? { ...s, session_number: sessionNumber } : s))
   )
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onSaveSessionNumber",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  } finally {
   setSavingSessionId(null)
  }
 }

 const onDeleteSchedule = async (scheduleId: string) => {
  setSchedActionErr(null)
  try {
   await deleteSchedule(scheduleId)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onDeleteSchedule",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  }
 }

 const onReorderSessionNumbers = async () => {
  if (!cid || schedules.length === 0) return
  if (
   !(await confirmDialog({
    title: "按日期重排堂次",
    description:
     "將依上課日期、開始時間（連堂班別同一日兩節按連堂順序）重新編排堂次為 1、2、3…，包含已取消課堂。確定繼續？",
    confirmText: "確認重排",
   }))
  )
   return
  setReorderingSessions(true)
  setSchedActionErr(null)
  try {
   const { updated, total } = await reorderClassScheduleSessionNumbers(cid)
   await reload()
   pushBanner({
    tone: updated > 0 ? "success" : "info",
    title: updated > 0 ? "堂次已重排" : "堂次無需調整",
    message:
     updated > 0
      ? `已更新 ${updated} 筆排程（共 ${total} 筆）。`
      : `共 ${total} 筆排程，堂次已符合日期順序。`,
   })
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onReorderSessionNumbers",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  } finally {
   setReorderingSessions(false)
  }
 }

 return (
  <DetailLayerShell
   variant="student"
   onDismiss={() => void requestLeavePage()}
   layerLabel="班別詳情 · 次層檢視"
  >
   <div className="flex min-h-full flex-col bg-background">
   <div className="bg-primary px-4 py-4 text-primary-foreground shadow-md md:px-6">
    <div className="flex flex-wrap items-start gap-4">
     <Button
      type="button"
      variant="secondary"
      size="sm"
      className="bg-white/90 text-foreground hover:bg-white"
      onClick={() => void requestLeavePage()}
     >
      <ArrowLeft className="h-4 w-4" />
      返回
     </Button>
     <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
       
      </div>
      <div className="min-w-0">
       {loading ? (
        <p className="text-lg">載入中…</p>
       ) : cls ? (
        <>
         <h1 className="text-xl font-bold md:text-2xl">
          {classDisplayName({ subject: cls.subject, courseName: cls.course_name })}
         </h1>
         <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
          <span className="font-mono">{cls.course_code_full ?? "—"}</span>
          {cls.class_kind === "private" ? (
           <Tag tone="info" size="sm">
            {privateCapacity === 2 ? "一對二" : "一對一"}
           </Tag>
          ) : null}
          <Tag tone={statusToTagTone(cls.status)} size="sm">{cls.status}</Tag>
          <span>{timeLine(cls)}</span>
         </div>
        </>
       ) : null}
      </div>
     </div>
     {canEditClass ? (
     <Button
      type="button"
      variant="secondary"
      className="bg-white/20 text-white hover:bg-white/30"
      onClick={() => {
       setEditErr(null)
       setEditOpen(true)
      }}
     >
      <Pencil className="h-4 w-4" />
      編輯班別
     </Button>
     ) : isPrivateClass && canManageClass ? (
     <div className="flex flex-wrap gap-2">
      {canBookPrivate ? (
       <Button
        type="button"
        variant="secondary"
        className="bg-white/20 text-white hover:bg-white/30"
        onClick={() => void openPrivateBook()}
       >
        預約上堂
       </Button>
      ) : null}
      {canEditPrivateLight ? (
       <Button
        type="button"
        variant="secondary"
        className="bg-white/20 text-white hover:bg-white/30"
        onClick={openPrivateLightEdit}
       >
        <Pencil className="h-4 w-4" />
        編輯老師／學費
       </Button>
      ) : null}
      <Button
       type="button"
       variant="secondary"
       className="bg-white/20 text-white hover:bg-white/30"
       asChild
      >
      <Link to="/PrivateTutoring">返回一對一／一對二學生</Link>
      </Button>
     </div>
     ) : isPrivateClass && canBookPrivate ? (
     <Button
      type="button"
      variant="secondary"
      className="bg-white/20 text-white hover:bg-white/30"
      onClick={() => void openPrivateBook()}
     >
      預約上堂
     </Button>
     ) : null}
    </div>
   </div>

   <div className="border-b border-border bg-card px-2 md:px-4">
    <nav className="flex gap-1 overflow-x-auto py-1">
     {TABS.map((t) => {
      const Icon = t.icon
      const active = tab === t.id
      return (
       <button
        key={t.id}
        type="button"
        onClick={() => setTab(t.id)}
        className={cn(
         "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
         active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        <Icon className="h-4 w-4" />
        {t.label(tabCounts)}
       </button>
      )
     })}
    </nav>
   </div>

   <div className="p-4 md:p-6">
    {pageErr ? (
     <div
      role="alert"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
     >
      {pageErr}
     </div>
    ) : null}
    {classYearLocked && canManageClass ? (
     <div
      role="status"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-950"
     >
      {academicYearEditBlockedMessage()}
     </div>
    ) : null}
    {isPrivateClass ? (
     <div
      role="status"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-info/40 bg-info/10 px-3 py-2 text-sm text-foreground"
     >
      私人班別詳情：可在此查看報讀／排程、編輯老師／學費，並直接預約上堂（不必退回列表）。
      <Link
       to="/PrivateTutoring"
       className="ml-2 font-medium text-primary underline-offset-4 hover:underline"
      >
       返回一對一／一對二學生
      </Link>
     </div>
    ) : null}
    {tab === "basic" && cls ? (
     <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
       {[
        { k: "科目", v: cls.subject },
        { k: "班別編碼", v: cls.course_code_full ?? "—" },
        { k: "適用年級", v: (cls.grade ?? []).join("、") || "—" },
        { k: "星期 / 時間", v: timeLine(cls) },
        {
         k: "負責老師",
         v: cls.teacher_id ? (
          <Link
           to={`/Teachers/${cls.teacher_id}`}
           className="font-medium text-primary underline-offset-4 hover:underline"
          >
           {cls.teacher_name ?? "—"}
          </Link>
         ) : (
          "未指定"
         ),
        },
        { k: "上課課室", v: cls.classroom_name ?? "未指定" },
        { k: "收生上限", v: cls.capacity != null ? `${cls.capacity} 人` : "—" },
        {
         k: "每節學費",
         v:
          cls.price_per_lesson != null
           ? `HKD $${cls.price_per_lesson.toLocaleString("zh-Hant-TW")}`
           : "—",
        },
        { k: "開始日期", v: cls.start_date ?? "—" },
        { k: "結束日期", v: cls.end_date ?? "—" },
       ].map((cell) => (
        <div
         key={cell.k}
         className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
         <div className="text-xs font-medium text-muted-foreground">{cell.k}</div>
         <div className="mt-1 text-sm font-semibold text-foreground">{cell.v}</div>
        </div>
       ))}
       <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:col-span-2">
        <div className="text-xs font-medium text-muted-foreground">報讀須知</div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
         {cls.enrollment_notice?.trim() ? cls.enrollment_notice : "—"}
        </p>
       </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
       <div className="rounded-xl border border-info bg-info p-2.5 text-center text-info-foreground shadow-sm transition-transform hover:scale-[1.02] md:p-4">
        <div className="text-xl font-bold tabular-nums md:text-3xl">{students.length}</div>
        <div className="text-[11px] font-medium opacity-90 md:text-xs">就讀學生</div>
       </div>
       <div className="rounded-xl border border-info bg-info p-2.5 text-center text-info-foreground shadow-sm transition-transform hover:scale-[1.02] md:p-4">
        <div className="text-xl font-bold tabular-nums md:text-3xl">{parts.fut}</div>
        <div className="text-[11px] font-medium opacity-90 md:text-xs">未來排程</div>
       </div>
       <div className="rounded-xl border border-success bg-success p-2.5 text-center text-success-foreground shadow-sm transition-transform hover:scale-[1.02] md:p-4">
        <div className="text-xl font-bold tabular-nums md:text-3xl">{parts.past}</div>
        <div className="text-[11px] font-medium opacity-90 md:text-xs">已完成課堂</div>
       </div>
      </div>
     </div>
    ) : null}

    {tab === "students" ? (
     <div className="mx-auto max-w-2xl space-y-3">
      {addStudentErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
       >
        {addStudentErr}
       </div>
      ) : null}
      <div className="flex justify-end">
       {!getTeacherScopeTeacherId() && (canEditClass || canAddPrivateStudent) ? (
       <Dialog
        open={addStudentOpen}
        onOpenChange={(open) => {
         setAddStudentOpen(open)
         if (open) {
          setAddStudentForm(
           cls?.course_mode === "summer_two_period" ? "兩期全報" : "full"
          )
          setAddStudentScheduleIds([])
          setAddStudentEntitledCount("")
          setAddStudentErr(null)
         }
        }}
       >
        <DialogTrigger asChild>
         <Button type="button">+ 增加學生</Button>
        </DialogTrigger>
        <DialogContent>
         <DialogHeader>
          <DialogTitle>{isPrivateClass ? "增加第二位學生" : "增加學生到本班"}</DialogTitle>
         </DialogHeader>
         <div className="space-y-3">
          {!isPrivateClass ? (
          <div className="space-y-1">
           <span className="text-sm text-muted-foreground">報讀形式</span>
           <Select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={addStudentForm}
            onChange={(e) => {
             setAddStudentForm(e.target.value)
             if (e.target.value !== SINGLE_SESSION_ENROLLMENT) setAddStudentScheduleIds([])
            }}
           >
            {(cls?.course_mode === "summer_two_period"
             ? SUMMER_ENROLLMENT_FORM_OPTIONS.map((p) => ({
                value: p,
                label: p === SINGLE_SESSION_ENROLLMENT ? "單堂／自選堂數" : p,
               }))
             : [
                { value: "full", label: "報足全期" },
                { value: SINGLE_SESSION_ENROLLMENT, label: "單堂／自選堂數" },
               ]
            ).map((o) => (
             <option key={o.value} value={o.value}>
              {o.label}
             </option>
            ))}
           </Select>
          </div>
          ) : (
           <p className="text-sm text-muted-foreground">
            私人班別最多兩位學生；加入後會共用同一班別與排程。
           </p>
          )}
          {!isPrivateClass ? (
           <div className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2">
            <label className="text-sm text-muted-foreground">應享／繳費堂數（選填）</label>
            <Input
             type="number"
             min={1}
             inputMode="numeric"
             placeholder="例如 12"
             value={addStudentEntitledCount}
             onChange={(e) => setAddStudentEntitledCount(e.target.value)}
             className="h-9"
            />
            <p className="text-xs text-muted-foreground">
             將綁定{" "}
             <strong className="tabular-nums text-foreground">
              {addStudentBoundPreview == null ? "…" : addStudentBoundPreview}
             </strong>{" "}
             堂
             {(() => {
              const entitled = Math.floor(Number(addStudentEntitledCount))
              if (
               !addStudentEntitledCount.trim() ||
               !Number.isFinite(entitled) ||
               addStudentBoundPreview == null ||
               entitled <= addStudentBoundPreview
              ) {
               return null
              }
              return (
               <span className="ml-1 text-amber-800">
                · 將記待補 {entitled - addStudentBoundPreview} 堂
               </span>
              )
             })()}
            </p>
           </div>
          ) : null}
          {addStudentForm === SINGLE_SESSION_ENROLLMENT && cid && !isPrivateClass ? (
           <EnrollmentSessionPicker
            classId={cid}
            selectedIds={addStudentScheduleIds}
            onChange={setAddStudentScheduleIds}
            disabled={Boolean(addingStudentId)}
           />
          ) : null}
          <Input
           placeholder="搜尋姓名 / 學號 / 電話"
           value={studentQuery}
           onChange={(e) => setStudentQuery(e.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
           {addableStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">找不到可加入的學生。</p>
           ) : (
            addableStudents.map((s) => (
             <button
              key={s.id}
              type="button"
              disabled={
               addingStudentId === s.id ||
               (addStudentForm === SINGLE_SESSION_ENROLLMENT &&
                addStudentScheduleIds.length === 0)
              }
              onClick={() => void onAddStudentToClass(s.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
             >
              <span className="min-w-0">
               <span className="block truncate text-sm font-medium">{s.full_name}</span>
               <span className="block truncate text-xs text-muted-foreground">
                {s.student_code ?? "—"} · {s.grade ?? "—"} · {s.student_phone ?? s.parent_phone ?? "—"}
               </span>
              </span>
              <span className="text-xs text-primary">
               {addingStudentId === s.id ? "加入中…" : "加入"}
              </span>
             </button>
            ))
           )}
          </div>
         </div>
        </DialogContent>
       </Dialog>
       ) : null}
      </div>
      {rosterStudents.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚無學生名單。</p>
      ) : (
       rosterStudents.map((s) => (
        <div
         key={s.enrollmentId}
         className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
         <Link
          to={`/Students/${s.studentId}`}
          state={{ from: `/Classes/${cid}` }}
          className="min-w-0 flex-1 transition-all hover:opacity-90 active:scale-[0.99]"
         >
          <div className="text-lg font-semibold text-primary">{s.fullName}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
           <span>
            {s.grade ?? "—"} · {s.school ?? "—"} · 報讀：{s.enrollDate ?? "—"}
           </span>
           {s.enrollmentFormLabel ? (
            <Tag tone={statusToTagTone(s.enrollmentFormLabel)} size="sm">
             {s.enrollmentFormLabel}
            </Tag>
           ) : null}
          </div>
         </Link>
         <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
          {!getTeacherScopeTeacherId() && (canEditClass || canAddPrivateStudent) ? (
           <>
            <Button
             type="button"
             variant="outline"
             size="sm"
             className="border-amber-700/45 text-amber-950 hover:bg-amber-50"
             onClick={() => void onWithdrawStudent(s)}
            >
             退讀
            </Button>
            <details className="relative">
             <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
              其他操作
             </summary>
             <div className="absolute right-0 z-10 mt-1 min-w-[8.5rem] rounded-md border border-border bg-background p-1 shadow-sm">
              <Button
               type="button"
               variant="ghost"
               size="sm"
               className="h-8 w-full justify-start text-xs text-muted-foreground"
               onClick={() => void onPurgeMistakenStudent(s)}
              >
               手誤清除
              </Button>
             </div>
            </details>
           </>
          ) : null}
         </div>
        </div>
       ))
      )}
     </div>
    ) : null}

    {tab === "enrollment" ? (
     <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
       此班別的報讀與退讀事件（依生效日新到舊排列）。
      </p>
      {enrollmentEvents.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚無增退紀錄。</p>
      ) : (
       <ul className="space-y-2">
        {enrollmentEvents.map((ev) => (
         <li
          key={ev.id}
          className={cn(
           "flex flex-col gap-2 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between",
           ev.action === "withdraw" ? "border-warning/50" : "border-info/50"
          )}
         >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
           <Tag
            tone={
             ev.action === "withdraw"
              ? "warning"
              : "info"
            }
            size="sm"
           >
            {ev.action === "withdraw"
             ? "退讀"
             : ev.action === "period_change"
               ? "期數變更"
               : ev.action === "session_change"
                 ? "選堂變更"
                 : "報讀"}
           </Tag>
           <Link
            to={`/Students/${ev.studentId}`}
            state={{ from: `/Classes/${cid}` }}
            className="font-medium text-primary hover:underline"
           >
            {ev.studentName}
           </Link>
           <span className="text-muted-foreground">
            · 生效{" "}
            <span className="font-medium tabular-nums text-foreground">{ev.effectiveDate}</span>
            {ev.enrollmentPeriod ? ` · ${ev.enrollmentPeriod}` : ""}
           </span>
          </div>
          {ev.reason ? (
           <span className="text-xs text-muted-foreground sm:max-w-[40%] sm:text-right">
            原因：{ev.reason}
           </span>
          ) : null}
         </li>
        ))}
       </ul>
      )}
     </div>
    ) : null}

    {tab === "schedule" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      {cls && canEditClass ? (
       <BatchSchedulePanel
        classId={cid}
        cls={cls}
        compact
        onComplete={({ createdCount }) => {
         pushBanner({
          tone: "success",
          title: "已成功新增排程",
          message: `共建立 ${createdCount} 筆排程。`,
         })
         void reload()
        }}
       />
      ) : null}
      {schedActionErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
       >
        {schedActionErr}
       </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="flex flex-wrap gap-2">
        {(
         [
          ["all", `所有排程 (${schedules.length})`],
          ["future", `未來排程 (${parts.fut})`],
          ["past", `過去排程 (${parts.past})`],
          ["cancel", `取消課堂 (${parts.canc})`],
         ] as const
        ).map(([key, label]) => (
         <button
          key={key}
          type="button"
          onClick={() => setSchedFilter(key)}
          className={cn(
           "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
           schedFilter === key
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-card hover:bg-muted/70"
          )}
         >
          {label}
         </button>
        ))}
       </div>
       {canEditClass ? (
       <div className="flex flex-wrap items-center gap-2">
        <Button
         type="button"
         variant="outline"
         disabled={reorderingSessions || schedules.length === 0}
         onClick={() => void onReorderSessionNumbers()}
        >
         {reorderingSessions ? "重排中…" : "按日期重排堂次"}
        </Button>
        <Dialog open={addSchedOpen} onOpenChange={setAddSchedOpen}>
        <DialogTrigger asChild>
         <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
         >
          + 新增排程
         </Button>
        </DialogTrigger>
        <DialogContent>
         <DialogHeader>
          <DialogTitle>新增排程</DialogTitle>
         </DialogHeader>
         <div className="grid gap-3">
          {addSchedErr ? (
           <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
           >
            {addSchedErr}
           </div>
          ) : null}
          <div>
           <label className="text-xs text-muted-foreground">日期</label>
           <Input
            type="date"
            className="mt-1"
            value={newSchedDate}
            onChange={(e) => setNewSchedDate(e.target.value)}
           />
          </div>
          <div>
           <label className="text-xs text-muted-foreground">堂次（可選）</label>
           <Input
            type="number"
            min={1}
            className="mt-1 w-24"
            value={newSchedSession ?? ""}
            onChange={(e) => {
             const n = parseInt(e.target.value, 10)
             setNewSchedSession(!Number.isNaN(n) && n >= 1 ? n : null)
            }}
           />
          </div>
          <div>
           <label className="text-xs text-muted-foreground">時段</label>
           <Select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={timeSlotSelectValueFromStored(newSchedTimeSlot)}
            onChange={(e) => setNewSchedTimeSlot(e.target.value)}
           >
            <option value="">請選擇時段</option>
            {CLASS_TIME_SLOT_OPTIONS.map((slot) => (
             <option key={slot} value={slot}>
              {slot}
             </option>
            ))}
            {newSchedTimeSlot &&
            !CLASS_TIME_SLOT_OPTIONS.some(
             (slot) =>
              slot === newSchedTimeSlot ||
              slot.replace(/\u2013/g, "-") === newSchedTimeSlot.replace(/\u2013/g, "-")
            ) ? (
             <option value={newSchedTimeSlot}>{newSchedTimeSlot}（原資料）</option>
            ) : null}
           </Select>
           <p className="mt-1 text-xs text-muted-foreground">
            每格 75 分鐘，由 09:00 起；預設帶入班別時段。
            {cls && isConsecutiveClass(cls.lesson_slots_per_session)
             ? " 連堂班別將一次建立 2 筆排程（2 個堂次）。"
             : ""}
           </p>
          </div>
          <Button
           type="button"
           disabled={savingAddSched || (!newSchedTimeSlot.trim() && !cls?.time_slot)}
           onClick={() => void addSched()}
          >
           {savingAddSched ? "建立中…" : "建立"}
          </Button>
         </div>
        </DialogContent>
       </Dialog>
       </div>
       ) : canBookPrivate ? (
       <Button
        type="button"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={() => void openPrivateBook()}
       >
        + 預約上堂
       </Button>
       ) : null}
      </div>
      <div className="space-y-2">
       {schedFiltered.length === 0 ? (
        <p className="text-sm text-muted-foreground">此分類尚無排程。</p>
       ) : (
        schedFiltered.map((s) => {
         const hints = scheduleHints.get(s.id)
         return (
          <ScheduleListCard
           key={s.id}
           sessionNumber={s.session_number}
           scheduledDate={s.scheduled_date}
           startTime={s.start_time}
           endTime={s.end_time}
           attendingNames={hints?.attendingNames}
           leaveNames={hints?.leaveNames}
           namesLoading={hintsLoading}
           editableSessionNumber={canEditSchedule(s.scheduled_date)}
           savingSessionNumber={savingSessionId === s.id}
           onSessionNumberSave={
            canEditSchedule(s.scheduled_date)
             ? (n) => void onSaveSessionNumber(s.id, n)
             : undefined
           }
           subtitle={(() => {
            const subTag = formatScheduleSubstituteTag(
             {
              teacher_id: s.teacher_id,
              teacher_name: s.teacher_name,
              original_teacher_id: s.original_teacher_id,
              original_teacher_name: s.original_teacher_name,
             },
             teacherScopeId
            )
            if (!subTag) return null
            return (
             <Tag tone={statusToTagTone(subTag)} size="sm">
              {subTag}
             </Tag>
            )
           })()}
           title={
            <Link
             to={`/Schedule/${s.id}`}
             className="underline-offset-4 hover:underline"
            >
             <ScheduleDateTime
              date={s.scheduled_date}
              startTime={s.start_time}
              endTime={s.end_time}
             />
            </Link>
           }
           controls={
            canEditSchedule(s.scheduled_date) ? (
            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
             <Select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-primary/50"
              value={s.status}
              onChange={(e) => void onChangeScheduleStatus(s.id, e.target.value)}
             >
              <option value="正常">正常</option>
              <option value="完成">完成</option>
              <option value="取消">取消</option>
             </Select>
             <button
              type="button"
              className="text-sm text-destructive hover:underline"
              onClick={async () => {
               if (
                !(await confirmDialog({
                 title: "刪除排程",
                 description: "刪除此排程？",
                 confirmText: "確認刪除",
                 tone: "destructive",
                }))
               )
                return
               await onDeleteSchedule(s.id)
              }}
             >
              刪除
             </button>
            </div>
            ) : (
             <span className="text-sm text-muted-foreground">{s.status}</span>
            )
           }
          />
         )
        })
       )}
      </div>
     </div>
    ) : null}
   </div>

   <Dialog
    open={editOpen}
    onOpenChange={(open) => {
     if (open) {
      setEditOpen(true)
      return
     }
     void (async () => {
      if (await requestCloseEdit()) {
       setEditOpen(false)
       setEditErr(null)
      }
     })()
    }}
   >
    <DialogContent className="max-h-[90vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>編輯班別</DialogTitle>
     </DialogHeader>
     {cls ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {editErr ? (
        <div
         role="alert"
         className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {editErr}
        </div>
       ) : null}
       {cls.course_id ? (
        <div className="sm:col-span-2 space-y-3 rounded-md border border-border bg-muted/30 p-3">
         <div className="text-sm font-medium text-foreground">課程模板</div>
         <div className="grid gap-3 sm:grid-cols-2">
          <div>
           <label className="text-xs text-muted-foreground">科目</label>
           <Select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={templateSubjectId}
            onChange={(e) => {
             setTemplateSubjectId(e.target.value)
             setTemplateGradeCode("")
             setTemplateCourseId("")
            }}
           >
            <option value="">請選擇</option>
            {subjectOptions.map((s) => (
             <option key={s.id} value={s.id}>
              {s.name_zh}（{s.code}）
             </option>
            ))}
           </Select>
          </div>
          <div>
           <label className="text-xs text-muted-foreground">年級</label>
           <Select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={templateGradeCode}
            onChange={(e) => {
             setTemplateGradeCode(e.target.value)
             setTemplateCourseId("")
            }}
            disabled={!templateSubjectId}
           >
            <option value="">請選擇</option>
            {CLASS_GRADE_FORM_OPTIONS.map((g) => {
             const code = gradeChineseToCode(g)
             if (!code) return null
             return (
              <option key={g} value={code}>
               {g}（{code}）
              </option>
             )
            })}
           </Select>
          </div>
          <div className="sm:col-span-2">
           <label className="text-xs text-muted-foreground">課程</label>
           <Select
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={templateCourseId}
            onChange={(e) => setTemplateCourseId(e.target.value)}
            disabled={!templateSubjectId || !templateGradeCode}
           >
            <option value="">請選擇</option>
            {templateCourseOptions.map((c) => (
             <option key={c.id} value={c.id}>
              {c.label}
             </option>
            ))}
            {templateCourseId &&
            !templateCourseOptions.some((c) => c.id === templateCourseId) ? (
             <option value={templateCourseId}>目前課程（{templateCourseId.slice(0, 8)}…）</option>
            ) : null}
           </Select>
          </div>
         </div>
         <p className="text-xs text-muted-foreground">
          更換模板會更新班別編碼、科目與年級；已有學生與排程不會自動清除。
         </p>
         {isAlien() ? (
          <Link to="/Courses" className="text-xs font-medium text-primary hover:underline">
           前往課程管理編輯模板內容
          </Link>
         ) : null}
        </div>
       ) : (
        <div className="sm:col-span-2">
         <label className="text-xs text-muted-foreground">科目</label>
         <Input
          className="mt-1"
          value={form.subject ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
         />
        </div>
       )}
       <div>
        <label className="text-xs text-muted-foreground">班號（section_code）</label>
        <Input
         className="mt-1 font-mono uppercase"
         value={form.section_code ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, section_code: e.target.value.toUpperCase() }))}
        />
       </div>
       <div className="sm:col-span-2">
        <label className="text-xs text-muted-foreground">年級{cls.course_id ? "" : "（可多選）"}</label>
        {!cls.course_id ? (
         <>
          <div className="mt-1 grid grid-cols-2 gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-3">
           {CLASS_GRADE_FORM_OPTIONS.map((g) => (
            <label key={g} className="flex cursor-pointer items-center gap-2 text-sm">
             <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={gradeSelections.includes(g)}
              onChange={() =>
               setGradeSelections((prev) =>
                prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
               )
              }
             />
             {g}
            </label>
           ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">可勾選多個年級；全部不勾表示清空年級。</p>
         </>
        ) : (
         <p className="mt-1 text-sm text-muted-foreground">
          由所選課程模板決定（目前：{classGradeDisplayText(cls.grade, cls.grade_code)}）
         </p>
        )}
       </div>
       <div className="sm:col-span-2">
        <label className="text-xs text-muted-foreground">逢星期（可多選）</label>
        <div className="mt-1 grid grid-cols-2 gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-4">
         {KANBAN_DAY_COLUMNS.map((d) => (
          <label key={d} className="flex cursor-pointer items-center gap-2 text-sm">
           <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={weekdaySelections.includes(d)}
            onChange={() =>
             setWeekdaySelections((prev) =>
              prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
             )
            }
           />
           {d}
          </label>
         ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">可勾選多個上課日；全部不勾表示未指定。</p>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">時段</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
         value={timeSlotSelectValueFromStored(form.time_slot)}
         onChange={(e) => {
          const next = e.target.value || null
          setForm((f) => ({
           ...f,
           time_slot: next,
           lesson_slots_per_session:
            isConsecutiveClass(f.lesson_slots_per_session) && next && !canUseConsecutiveFromTimeSlot(next)
             ? 1
             : f.lesson_slots_per_session,
          }))
         }}
        >
         <option value="">未指定</option>
         {CLASS_TIME_SLOT_OPTIONS.map((slot) => (
          <option key={slot} value={slot}>
           {slot}
          </option>
         ))}
         {form.time_slot &&
         !CLASS_TIME_SLOT_OPTIONS.some(
          (slot) =>
           slot === form.time_slot ||
           slot.replace(/\u2013/g, "-") === String(form.time_slot).replace(/\u2013/g, "-")
         ) ? (
          <option value={form.time_slot}>{form.time_slot}（原資料）</option>
         ) : null}
        </Select>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
         <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={isConsecutiveClass(form.lesson_slots_per_session)}
          disabled={!form.time_slot || !canUseConsecutiveFromTimeSlot(String(form.time_slot))}
          onChange={(e) =>
           setForm((f) => ({ ...f, lesson_slots_per_session: e.target.checked ? 2 : 1 }))
          }
         />
         連堂（每次 2 節 · 150 分鐘 · 計 2 堂學費）
        </label>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">老師</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input px-2 text-sm"
         value={form.teacher_id ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value || null }))}
        >
         <option value="">未指定</option>
         {teachers.map((t) => (
          <option key={t.id} value={t.id}>
           {t.label}
          </option>
         ))}
        </Select>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">課室</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input px-2 text-sm"
         value={form.classroom_id ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, classroom_id: e.target.value || null }))}
        >
         <option value="">未指定</option>
         {rooms.map((r) => (
          <option key={r.id} value={r.id}>
           {r.label}
          </option>
         ))}
        </Select>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">收生上限</label>
        <Input
         type="number"
         min={0}
         step={1}
         className="mt-1"
         value={form.capacity ?? ""}
         onChange={(e) => {
          const v = e.target.value
          setForm((f) => {
           if (v === "") return { ...f, capacity: null }
           const n = Number(v)
           if (Number.isNaN(n)) return { ...f, capacity: null }
           return { ...f, capacity: Math.max(0, Math.floor(n)) }
          })
         }}
        />
        <p className="mt-1 text-xs text-muted-foreground">不可為負數；留空表示不設上限。</p>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">每節學費（HKD）</label>
        <div className="mt-1 flex flex-wrap gap-2">
         {PRICE_PRESETS_HKD.map((p) => (
          <Button
           key={p}
           type="button"
           size="sm"
           variant={form.price_per_lesson === p ? "default" : "outline"}
           className={form.price_per_lesson === p ? "" : "bg-background"}
           onClick={() => setForm((f) => ({ ...f, price_per_lesson: p }))}
          >
           {p}
          </Button>
         ))}
        </div>
        <Input
         type="number"
         min={0}
         step={1}
         className="mt-2"
         placeholder="或手動輸入金額（HKD）"
         value={
          form.price_per_lesson != null && !Number.isNaN(form.price_per_lesson)
           ? form.price_per_lesson
           : ""
         }
         onChange={(e) => {
          const v = e.target.value
          setForm((f) => {
           if (v === "") return { ...f, price_per_lesson: null }
           const n = Number(v)
           if (Number.isNaN(n)) return { ...f, price_per_lesson: null }
           return { ...f, price_per_lesson: Math.max(0, n) }
          })
         }}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">開始日期</label>
        <Input
         type="date"
         className="mt-1"
         value={(form.start_date ?? "").slice(0, 10)}
         onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">結束日期</label>
        <Input
         type="date"
         className="mt-1"
         value={(form.end_date ?? "").slice(0, 10)}
         onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
       </div>
      <div className="sm:col-span-2">
       <label className="text-xs text-muted-foreground">狀態</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.status ?? "進行中"}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
       >
        {(STATUS_CHIPS.filter((s) => s !== "全部") as string[]).map((s) => (
         <option key={s} value={s}>
          {s}
         </option>
        ))}
        {form.status &&
        !(STATUS_CHIPS.filter((s) => s !== "全部") as string[]).includes(form.status) ? (
         <option value={form.status}>{form.status}（原資料）</option>
        ) : null}
       </Select>
      </div>
      <div className="sm:col-span-2">
       <label className="text-xs text-muted-foreground">報讀須知</label>
       <Textarea
        className="mt-1 min-h-[100px]"
        value={form.enrollment_notice ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, enrollment_notice: e.target.value }))}
        placeholder="可填寫此班報讀注意事項、課程要求或備註"
        rows={4}
       />
      </div>
       <div className="sm:col-span-2 flex gap-2">
        <Button type="button" disabled={savingEdit} onClick={() => void saveClass()}>
         {savingEdit ? "儲存中…" : "儲存"}
        </Button>
        <Button
         type="button"
         variant="outline"
         disabled={savingEdit}
         onClick={() =>
          void (async () => {
           if (await requestCloseEdit()) {
            setEditOpen(false)
            setEditErr(null)
           }
          })()
         }
        >
         取消
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog open={privateLightOpen} onOpenChange={setPrivateLightOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>編輯老師／學費</DialogTitle>
     </DialogHeader>
     {cls ? (
      <div className="space-y-4">
       <p className="text-sm text-muted-foreground truncate" title={cls.subject}>
        {cls.subject}
       </p>
       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">授課老師</label>
        <Select
         value={privateLightTeacherId}
         onChange={(e) => setPrivateLightTeacherId(e.target.value)}
        >
         <option value="">未指定</option>
         {teachers.map((t) => (
          <option key={t.id} value={t.id}>
           {t.label}
          </option>
         ))}
        </Select>
       </div>
       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">每節學費</label>
        <Input
         type="number"
         min={0}
         step={1}
         value={privateLightPrice}
         onChange={(e) => setPrivateLightPrice(e.target.value)}
         placeholder="金額"
        />
        <div className="mt-1 flex flex-wrap gap-1.5">
         {[250, 275, 825].map((p) => (
          <Button
           key={p}
           type="button"
           size="sm"
           variant="outline"
           onClick={() => setPrivateLightPrice(String(p))}
          >
           HKD {p}
          </Button>
         ))}
        </div>
       </div>
       {privateLightErr ? <p className="text-sm text-destructive">{privateLightErr}</p> : null}
       <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setPrivateLightOpen(false)}>
         取消
        </Button>
        <Button
         type="button"
         disabled={privateLightSaving}
         onClick={() => void savePrivateLightEdit()}
        >
         {privateLightSaving ? "儲存中…" : "儲存"}
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog open={privateBookOpen} onOpenChange={setPrivateBookOpen}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
     <DialogHeader>
      <DialogTitle>預約上堂</DialogTitle>
     </DialogHeader>
     {cls ? (
      <div className="space-y-4">
       <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <p className="font-medium truncate" title={cls.subject}>
         {cls.subject}
        </p>
        <p className="text-muted-foreground">
         {cls.teacher_name ? `老師：${cls.teacher_name}` : "老師未指定"}
        </p>
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">預約方式</label>
        <Select
         value={privateBookMode}
         onChange={(e) => setPrivateBookMode(e.target.value as "single" | "weekly")}
        >
         <option value="single">單堂</option>
         <option value="weekly">每週重複（共 N 堂）</option>
        </Select>
       </div>

       {privateBookMode === "weekly" ? (
        <div className="space-y-1">
         <label className="text-xs text-muted-foreground">共幾堂（1–52）</label>
         <Input
          type="number"
          min={1}
          max={52}
          value={privateBookWeekCount}
          onChange={(e) => setPrivateBookWeekCount(e.target.value)}
         />
        </div>
       ) : null}

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">上課日期</label>
        <Input
         type="date"
         value={privateBookDate}
         onChange={(e) => void onPrivateBookDateChange(e.target.value)}
        />
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">時段</label>
        <Select
         value={String(privateBookSlotIdx)}
         onChange={(e) => {
          setPrivateBookSlotIdx(Number(e.target.value))
          setPrivateBookRoomId("")
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
        <Select
         value={privateBookRoomId}
         onChange={(e) => setPrivateBookRoomId(e.target.value)}
        >
         <option value="">暫不指定課室</option>
         {privateBookActiveRooms
          .filter((r) => privateBookFreeRoomIds.has(r.id) || r.id === privateBookRoomId)
          .map((r) => (
           <option key={r.id} value={r.id}>
            {r.name}
           </option>
          ))}
        </Select>
        {privateBookDate && privateBookFreeRoomIds.size === 0 ? (
         <p className="text-xs text-warning">此時段沒有空房；可暫不指定課室並確認預約。</p>
        ) : null}
       </div>

       <div className="space-y-1">
        <label className="text-xs text-muted-foreground">授課老師</label>
        <Select
         value={privateBookTeacherId}
         onChange={(e) => setPrivateBookTeacherId(e.target.value)}
         disabled={isTeacherPortal}
        >
         <option value="">選擇老師</option>
         {teachers.map((t) => (
          <option key={t.id} value={t.id}>
           {t.label}
          </option>
         ))}
        </Select>
        {isTeacherPortal ? (
         <p className="text-xs text-muted-foreground">老師入口固定為本人授課。</p>
        ) : null}
       </div>

       {privateBookErr ? (
        <p className="whitespace-pre-wrap text-sm text-destructive">{privateBookErr}</p>
       ) : null}

       <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setPrivateBookOpen(false)}>
         關閉
        </Button>
        <Button
         type="button"
         disabled={privateBookSaving}
         onClick={() => void submitPrivateBook()}
        >
         {privateBookSaving
          ? "建立中…"
          : privateBookMode === "weekly"
            ? "預覽並建立週期"
            : "確認預約"}
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog
    open={unsavedLeaveOpen}
    onOpenChange={(open) => {
     if (!open) finishUnsavedLeave("cancel")
    }}
   >
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>有未儲存的變更</DialogTitle>
     </DialogHeader>
     <p className="text-sm text-muted-foreground">
      班別資料已修改但尚未儲存。要儲存後離開，還是放棄變更？
     </p>
     <div className="mt-6 flex flex-wrap justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("cancel")}>
       繼續編輯
      </Button>
      <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("discard")}>
       放棄變更
      </Button>
      <Button type="button" onClick={() => finishUnsavedLeave("save")}>
       儲存並離開
      </Button>
     </div>
    </DialogContent>
   </Dialog>

   <CancelReasonDialog
    open={cancelScheduleId != null}
    saving={cancelSaving}
    onCancel={() => setCancelScheduleId(null)}
    onConfirm={onConfirmCancelSchedule}
   />
  </div>
  </DetailLayerShell>
 )
}
