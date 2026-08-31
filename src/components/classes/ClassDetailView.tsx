import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
 ArrowLeft,
 BookOpen,
 CalendarDays,
 Pencil,
 ScrollText,
 TriangleAlert,
 Users,
} from "lucide-react"

import { AdaptiveDetailLayer } from "@/components/detail/DetailLayerShell"
import { useOpenStudentRecord, useOpenTeacherRecord, useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { statusToTagTone } from "@/lib/statusTag"
import { BatchSchedulePanel } from "@/components/classes/BatchSchedulePanel"
import { CancelReasonDialog } from "@/components/schedule/CancelReasonDialog"
import { ExtraLessonRosterPicker } from "@/components/schedule/ExtraLessonRosterPicker"
import { ScheduleListCard } from "@/components/schedules/ScheduleListCard"
import { ScheduleDateTime, formatStudentNameList } from "@/lib/scheduleDisplay"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { parseTimeSlotBounds } from "@/services/batchScheduleHelpers"
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
 canUseConsecutiveFromSlotIndex,
 canUseConsecutiveFromTimeSlot,
 consecutivePairFromFirstSlotIndex,
 formatClassTimeDisplay,
 isConsecutiveClass,
} from "@/lib/consecutiveLesson"
import { summarizeClassTeacherScheduleMismatch } from "@/lib/privateClassTeacherAudit"
import { sortSchedulesByDateTime } from "@/services/privateTutoringQueries"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { gradeChineseToCode } from "@/lib/courseCode"
import {
 academicYearLabelForClass,
} from "@/lib/academicYearEditGuard"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { resolveEnrollmentAttendanceOptions } from "@/lib/enrollmentAttendanceConfirm"
import { resolveSoftCancelScheduleOptions } from "@/lib/scheduleSoftCancelConfirm"
import { classDisplayName } from "@/lib/courseLabel"
import { classKindLabel, resolveClassKind } from "@/lib/privateClassKind"
import {
 classGradeDisplayText,
 normalizeStoredClassGradeLabels,
} from "@/lib/classGrade"
import { TUITION_PRICE_PRESETS_HKD } from "@/lib/tuitionPricePresets"
import { cn } from "@/lib/utils"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 fetchClassStudents,
 fetchClassSchedules,
 fetchClassroomOptions,
 fetchCourseOptions,
 fetchScheduleStudentHintsForClass,
 fetchSubjectOptions,
 fetchTeacherOptions,
 getClassById,
 reorderClassScheduleSessionNumbers,
 type ClassRecord,
 type ClassScheduleRow,
 type ClassStudentRow,
 type ScheduleStudentHints,
 type SubjectOption,
 updateClass,
} from "@/services/classQueries"
import {
 deleteSchedule,
 insertSchedulesForClassSession,
 nextSessionNumberForClass,
 updateSchedule,
} from "@/services/scheduleWriteQueries"
import {
 listExtraLessonRosterCandidates,
 type ExtraLessonRosterCandidate,
} from "@/services/scheduleRosterPolicyQueries"
import {
 arrangeMakeupForCancelledSchedule,
 previewMakeupForCancelledSchedule,
 type MakeupPreview,
} from "@/services/scheduleMakeupQueries"
import {
 buildWeeklyDates,
 checkPrivateBookingConflicts,
 createPrivateRecurringBookings,
 insertPrivateBookingSchedules,
 previewPrivateRecurringBookings,
 privateBookingTimeBounds,
 updatePrivateClassSettings,
 withdrawPrivateEnrollment,
} from "@/services/privateTutoringQueries"
import {
 fetchRoomCalendarBundle,
 occupiersForSlot,
} from "@/services/roomBookingQueries"
import type { RoomRecord } from "@/services/classroomQueries"
import { classroomsActiveOnDate } from "@/lib/classroomEligibility"
import {
 LESSON_SLOT_INDICES,
 lessonSlotLabel,
} from "@/lib/lessonSlots"
import {
 fetchEnrollmentChangeEventsForClass,
 type ClassEnrollmentChangeEvent,
 fetchAllStudents,
 insertEnrollment,
 previewEnrollmentAttendanceImpact,
 purgeMistakenEnrollment,
 withdrawStudentFromClass,
 type StudentRecord,
} from "@/services/studentQueries"
import {
 ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
 SUMMER_ENROLLMENT_FORM_OPTIONS,
 type EnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import { localYmd } from "@/services/scheduleQueries"

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
 const openStudent = useOpenStudentRecord()
 const openTeacher = useOpenTeacherRecord()
 const { preview } = useRecordPreview()
 const isMobile = useIsMobile()
 const location = useLocation()
 const cid = classId ?? ""
 const { profile } = useAuth()
 const canManageClass = can(profile?.activeCapabilities, "classes.update")
 const canOpenCourseCatalog = can(profile?.activeCapabilities, "catalog.manage")
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
 const [privateTeacherSyncing, setPrivateTeacherSyncing] = useState(false)
 const [privateBookOpen, setPrivateBookOpen] = useState(false)
 const [privateBookDate, setPrivateBookDate] = useState(() => localYmd())
 const [privateBookSlotIdx, setPrivateBookSlotIdx] = useState(0)
 const [privateBookConsecutive, setPrivateBookConsecutive] = useState(false)
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
 const [addSchedExtra, setAddSchedExtra] = useState(false)
 const [addSchedRosterCandidates, setAddSchedRosterCandidates] = useState<
  ExtraLessonRosterCandidate[]
 >([])
 const [addSchedRosterIds, setAddSchedRosterIds] = useState<string[]>([])
 const [addSchedRosterLoading, setAddSchedRosterLoading] = useState(false)
 const [addStudentOpen, setAddStudentOpen] = useState(false)
 const [addStudentForm, setAddStudentForm] = useState<string>("兩期全報")
 const [addStudentScheduleIds, setAddStudentScheduleIds] = useState<string[]>([])
 const [studentQuery, setStudentQuery] = useState("")
 const [addingStudentId, setAddingStudentId] = useState<string | null>(null)
 const [addStudentErr, setAddStudentErr] = useState<string | null>(null)
 const [schedActionErr, setSchedActionErr] = useState<string | null>(null)
 const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null)
 const [cancelSaving, setCancelSaving] = useState(false)
 const [makeupTargetId, setMakeupTargetId] = useState<string | null>(null)
 const [makeupPreview, setMakeupPreview] = useState<MakeupPreview | null>(null)
 const [makeupDate, setMakeupDate] = useState("")
 const [makeupTimeSlot, setMakeupTimeSlot] = useState("")
 const [makeupLoading, setMakeupLoading] = useState(false)
 const [makeupSaving, setMakeupSaving] = useState(false)
 const [makeupErr, setMakeupErr] = useState<string | null>(null)
 const [pageErr, setPageErr] = useState<string | null>(null)
 const [unsavedLeaveOpen, setUnsavedLeaveOpen] = useState(false)

 const teacherScopeId = getTeacherScopeTeacherId(profile)
 const isTeacherPortal = Boolean(teacherScopeId)

 const classYearLocked = false
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
 const canEditSchedule = (_scheduledDate: string) => canManageClass || isOwnTeacherClass
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
   const [c, st, ev, sc, tch, rm, allSt, subjectOpts] = await Promise.all([
    getClassById(cid),
    fetchClassStudents(cid),
    fetchEnrollmentChangeEventsForClass(cid),
    fetchClassSchedules(cid),
    fetchTeacherOptions({ excludeHomeworkTutorOnly: true }),
    fetchClassroomOptions(),
    teacherScopeId ? Promise.resolve([] as StudentRecord[]) : fetchAllStudents(),
    fetchSubjectOptions({ specialtyOnly: true }),
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
 }, [cid, teacherScopeId])

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
  const filtered = schedules.filter((s) => {
   if (schedFilter === "all") return true
   if (schedFilter === "cancel") return s.status.includes("取消")
   if (schedFilter === "past")
    return s.scheduled_date < today && !s.status.includes("取消")
   return s.scheduled_date >= today && !s.status.includes("取消")
  })
  /** 一對一／一對二與小組課皆依上課日期、時間先後（不依堂次編號） */
  return sortSchedulesByDateTime(filtered)
 }, [schedules, schedFilter, today])

 const privateTeacherMismatch = useMemo(() => {
  if (!isPrivateClass || !cls) return null
  return summarizeClassTeacherScheduleMismatch(cls.teacher_id, schedules)
 }, [isPrivateClass, cls, schedules])

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
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: academicYearLabelForClass(cls),
    source: "ClassDetailView.saveClass",
   }))
  ) {
   return false
  }
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
   const result = await updatePrivateClassSettings(cls.id, {
    teacherId: privateLightTeacherId || null,
    pricePerLesson: priceNum,
   })
   pushBanner({
    tone: "success",
    title: "已更新私人班別設定",
    message:
     result.syncedScheduleCount > 0
      ? `老師／學費已儲存；已同步 ${result.syncedScheduleCount} 堂未取消排程的負責老師。`
      : "老師／學費已儲存。",
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

 const syncPrivateTeacherToSchedules = useCallback(async () => {
  if (!cls?.teacher_id) {
   pushBanner({
    tone: "warning",
    title: "尚未指定班別老師",
    message: "請先在「編輯老師／學費」指定負責老師，再同步排程。",
   })
   return
  }
  setPrivateTeacherSyncing(true)
  try {
   const result = await updatePrivateClassSettings(cls.id, {
    teacherId: cls.teacher_id,
    pricePerLesson: cls.price_per_lesson,
   })
   pushBanner({
    tone: "success",
    title: "已同步排程老師",
    message:
     result.syncedScheduleCount > 0
      ? `已更新 ${result.syncedScheduleCount} 堂未取消排程的負責老師。`
      : "排程老師已與班別一致，無需變更。",
   })
   await reload()
  } catch (e) {
   reportUserFacingError(e, {
    source: "ClassDetailView.syncPrivateTeacherToSchedules",
    setErr: setPageErr,
   })
  } finally {
   setPrivateTeacherSyncing(false)
  }
 }, [cls, pushBanner, reload])

 const openPrivateBook = useCallback(async () => {
  if (!cls) return
  setPrivateBookDate(localYmd())
  setPrivateBookSlotIdx(0)
  setPrivateBookConsecutive(false)
  setPrivateBookRoomId("")
  setPrivateBookTeacherId(teacherScopeId || cls.teacher_id || "")
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
 }, [cls, teacherScopeId])

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

 const privateBookUsesConsecutive =
  privateBookConsecutive && canUseConsecutiveFromSlotIndex(privateBookSlotIdx)

 const privateBookFreeRoomIds = useMemo(() => {
  if (!privateBookDate) return new Set<string>()
  const { startMin, endMin } = privateBookingTimeBounds(
   privateBookSlotIdx,
   privateBookUsesConsecutive
  )
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
       startMin,
       endMin,
       privateBookSchedules,
       privateBookPending
      ).length === 0
    )
    .map((r) => r.id)
  )
 }, [
  privateBookDate,
  privateBookSlotIdx,
  privateBookUsesConsecutive,
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
  const consecutive =
   privateBookConsecutive && canUseConsecutiveFromSlotIndex(privateBookSlotIdx)
  if (privateBookConsecutive && !consecutive) {
   setPrivateBookErr("連堂需選擇可連續兩格的起始時段（最後一格不可連堂）。")
   return
  }
  const { startTime, endTime } = privateBookingTimeBounds(privateBookSlotIdx, consecutive)
  const pair = consecutive ? consecutivePairFromFirstSlotIndex(privateBookSlotIdx) : null
  const timeLabel = pair
   ? `${pair.displayRange}（連堂 · 計 2 堂）`
   : lessonSlotLabel(privateBookSlotIdx)
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
      description: consecutive
       ? `將建立每週共 ${dates.length} 次連堂（每次 2 節，合共最多 ${dates.length * lessonsPerDate} 堂；${dates[0]} 起）。確定繼續？`
       : `將建立每週共 ${dates.length} 堂（${dates[0]} 起）。確定繼續？`,
      confirmText: "確認建立",
     })
     if (!ok) return
    }
    const result = await createPrivateRecurringBookings({
     classId: cls.id,
     studentIds,
     dates,
     classroomId,
     firstSlotIndex: privateBookSlotIdx,
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
       ? `建成 ${result.created} 堂，略過 ${result.skipped.length} 次`
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
    await insertPrivateBookingSchedules({
     classId: cls.id,
     teacherId,
     scheduledDate: privateBookDate,
     firstSlotIndex: privateBookSlotIdx,
     consecutive,
     classroomId,
    })
    pushBanner({
     tone: "success",
     title: consecutive ? "已建立連堂預約" : "已建立預約",
     message: `${privateBookDate} ${timeLabel}`,
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
  privateBookConsecutive,
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
  setAddSchedExtra(false)
  setAddSchedRosterCandidates([])
  setAddSchedRosterIds([])
  void nextSessionNumberForClass(cid).then(setNewSchedSession)
 }, [addSchedOpen, cls?.time_slot, cid])

 useEffect(() => {
  if (!addSchedOpen || !addSchedExtra || !cid) {
   setAddSchedRosterCandidates([])
   setAddSchedRosterIds([])
   setAddSchedRosterLoading(false)
   return
  }
  let cancelled = false
  setAddSchedRosterLoading(true)
  void listExtraLessonRosterCandidates({ classId: cid, scheduleDate: newSchedDate })
   .then((rows) => {
    if (cancelled) return
    setAddSchedRosterCandidates(rows)
    setAddSchedRosterIds(rows.map((row) => row.studentId))
    setAddSchedRosterLoading(false)
   })
   .catch(() => {
    if (cancelled) return
    setAddSchedRosterCandidates([])
    setAddSchedRosterIds([])
    setAddSchedRosterLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [addSchedOpen, addSchedExtra, cid, newSchedDate])

 const addSched = async () => {
  if (!cls) return
  const timeSlot = newSchedTimeSlot.trim() || cls.time_slot?.trim() || ""
  if (!timeSlot) {
   setAddSchedErr("請選擇時段")
   return
  }
  const { start, end } = parseTimeSlotBounds(timeSlot)
  if (!start || !end) {
   setAddSchedErr("時段格式無效，請重新選擇")
   return
  }
  setSavingAddSched(true)
  setAddSchedErr(null)
  try {
   await insertSchedulesForClassSession(
    cid,
    { ...cls, time_slot: timeSlot },
    {
     scheduled_date: newSchedDate,
     start_time: start,
     end_time: end,
     session_number: newSchedSession,
     classroom_id: cls.classroom_id,
     is_extra_lesson: addSchedExtra,
     rosterStudentIds: addSchedExtra ? addSchedRosterIds : undefined,
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

 if (!cid) {
  return (
   <AdaptiveDetailLayer variant="student" onDismiss={() => navigate("/Classes")} layerLabel={null}>
    <p className="p-6 text-muted-foreground">無效路由</p>
   </AdaptiveDetailLayer>
  )
 }
 if (!loading && !cls) {
  return (
   <AdaptiveDetailLayer
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
   </AdaptiveDetailLayer>
  )
 }

 const scopeTeacherId = teacherScopeId
 if (!loading && cls && scopeTeacherId && cls.teacher_id !== scopeTeacherId) {
  return (
   <AdaptiveDetailLayer variant="student" onDismiss={() => navigate(classesListPath)} layerLabel="班別詳情">
    <div className="p-6">
     <p>此班別不屬於您的指派，無法檢視。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to={classesListPath}>返回</Link>
     </Button>
    </div>
   </AdaptiveDetailLayer>
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
   await insertEnrollment(
    studentId,
    cid,
    period,
    isSingle ? addStudentScheduleIds : undefined,
    null
   )
   const addedName =
    allStudents.find((s) => s.id === studentId)?.full_name?.trim() || "學生"
   pushBanner({
    tone: "success",
    title: `已加入報讀：${addedName}`,
    message: "報讀已建立。請前往收款／出單確認學費，權益池才會增加可上課堂數。",
    action: {
     pageLabel: "收款／出單",
     to: `/Payments?studentId=${encodeURIComponent(studentId)}&mode=receive`,
    },
   })
   setStudentQuery("")
   setAddStudentForm(isSummer ? "第一期" : "full")
   setAddStudentScheduleIds([])
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
   const hits = await previewEnrollmentAttendanceImpact(s.studentId, cid)
   const attOpts = await resolveEnrollmentAttendanceOptions(
    confirmDialog,
    hits,
    "withdraw",
    s.fullName
   )
   if (attOpts === "abort") return
   if (isPrivateClass) {
    await withdrawPrivateEnrollment({
     enrollmentId: s.enrollmentId,
     studentId: s.studentId,
     classId: cid,
     ...attOpts,
    })
   } else {
    await withdrawStudentFromClass({
     enrollmentId: s.enrollmentId,
     studentId: s.studentId,
     classId: cid,
     effectiveDate: localYmd(),
     reason: null,
     ...attOpts,
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
   const hits = await previewEnrollmentAttendanceImpact(s.studentId, cid)
   const attOpts = await resolveEnrollmentAttendanceOptions(
    confirmDialog,
    hits,
    "purge",
    studentName
   )
   if (attOpts === "abort") return
   await purgeMistakenEnrollment({
    enrollmentId: s.enrollmentId,
    studentId: s.studentId,
    ...attOpts,
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
  const sched = schedules.find((x) => x.id === scheduleId)
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: sched?.scheduled_date,
    label: cls ? academicYearLabelForClass(cls) : null,
    source: "ClassDetailView.onChangeScheduleStatus",
   }))
  ) {
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
  const sched = schedules.find((x) => x.id === cancelScheduleId)
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: sched?.scheduled_date,
    label: cls ? academicYearLabelForClass(cls) : null,
    source: "ClassDetailView.onConfirmCancelSchedule",
   }))
  ) {
   return
  }
  setCancelSaving(true)
  setSchedActionErr(null)
  try {
   const softOpts = await resolveSoftCancelScheduleOptions(confirmDialog, [cancelScheduleId])
   if (softOpts === "abort") return
   await updateSchedule(cancelScheduleId, { status: "取消", cancel_reason: reason }, softOpts)
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

 const openArrangeMakeup = async (scheduleId: string) => {
  setMakeupTargetId(scheduleId)
  setMakeupPreview(null)
  setMakeupErr(null)
  setMakeupDate("")
  setMakeupTimeSlot("")
  setMakeupLoading(true)
  try {
   const preview = await previewMakeupForCancelledSchedule(scheduleId)
   setMakeupPreview(preview)
   setMakeupDate("")
   setMakeupTimeSlot(preview.originalTimeSlot)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.openArrangeMakeup",
    setErr: setMakeupErr,
    userMessage: msg,
   })
  } finally {
   setMakeupLoading(false)
  }
 }

 const closeArrangeMakeup = () => {
  if (makeupSaving) return
  setMakeupTargetId(null)
  setMakeupPreview(null)
  setMakeupErr(null)
  setMakeupDate("")
  setMakeupTimeSlot("")
 }

 const onConfirmArrangeMakeup = async () => {
  if (!makeupTargetId) return
  if (!makeupDate.trim()) {
   setMakeupErr("請選擇補堂日期")
   return
  }
  if (!makeupTimeSlot.trim()) {
   setMakeupErr("請選擇補堂時段")
   return
  }
  if (makeupPreview && makeupPreview.alreadyHasMakeupIds.length > 0) {
   setMakeupErr("此取消堂已安排過補回排程，請勿重複建立。")
   return
  }
  setMakeupSaving(true)
  setMakeupErr(null)
  try {
   const result = await arrangeMakeupForCancelledSchedule({
    cancelledScheduleId: makeupTargetId,
    newDate: makeupDate,
    timeSlot: makeupTimeSlot,
   })
   const slotLabel = makeupTimeSlot.trim()
   setMakeupTargetId(null)
   setMakeupPreview(null)
   setMakeupErr(null)
   setMakeupDate("")
   setMakeupTimeSlot("")
   pushBanner({
    tone: "success",
    title: "已安排補回加堂",
    message: [
     `${result.newDate}${slotLabel ? ` ${slotLabel}` : ""} 已建立 ${result.newScheduleIds.length} 筆排程`,
     result.attendingNames.length > 0
      ? `原應出席：${formatStudentNameList(result.attendingNames)}`
      : null,
     result.singleSessionMoved > 0
      ? `單堂選堂已改掛 ${result.singleSessionMoved} 人`
      : null,
    ]
     .filter(Boolean)
     .join("。"),
   })
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onConfirmArrangeMakeup",
    setErr: setMakeupErr,
    userMessage: msg,
   })
  } finally {
   setMakeupSaving(false)
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
  const sched = schedules.find((x) => x.id === scheduleId)
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: sched?.scheduled_date,
    label: cls ? academicYearLabelForClass(cls) : null,
    source: "ClassDetailView.onDeleteSchedule",
   }))
  ) {
   return
  }
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
  <AdaptiveDetailLayer
   variant="student"
   onDismiss={() => void requestLeavePage()}
   layerLabel="班別詳情"
  >
   <div className="flex min-h-full flex-col bg-background">
   <div
    className={
     isMobile
      ? "bg-primary px-4 py-4 text-primary-foreground shadow-md md:px-6"
      : "rounded-xl border border-border bg-card px-4 py-4 shadow-sm md:px-6"
    }
   >
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
     <Button
      type="button"
      variant={isMobile ? "secondary" : "outline"}
      size="sm"
      className={cn("w-fit shrink-0", isMobile && "bg-white/90 text-foreground hover:bg-white")}
      onClick={() => void requestLeavePage()}
     >
      <ArrowLeft className="h-4 w-4" />
      返回
     </Button>
     <div className="flex min-w-0 flex-1 items-start gap-3">
      {isMobile ? (
       <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
        
       </div>
      ) : null}
      <div className="min-w-0">
       {loading ? (
        <p className="text-lg">載入中…</p>
       ) : cls ? (
        <>
         <h1 className="text-xl font-bold md:text-2xl">
          {classDisplayName({ subject: cls.subject, courseName: cls.course_name })}
         </h1>
         <div
          className={cn(
           "mt-1 flex flex-wrap items-center gap-2 text-sm",
           isMobile ? "text-white/90" : "text-muted-foreground"
          )}
         >
          <span className="font-mono">{cls.course_code_full ?? "—"}</span>
          <Tag tone="info" size="sm">
           {classKindLabel(resolveClassKind(cls.class_kind, cls.subject))}
          </Tag>
          {cls.class_kind === "private" ? (
           <Tag tone="info" size="sm">
            {privateCapacity === 2 ? "一對二" : "一對一"}
           </Tag>
          ) : null}
          <Tag tone={statusToTagTone(cls.status)} size="sm">{cls.status}</Tag>
         </div>
         <p className={cn("mt-1 text-sm", isMobile ? "text-white/85" : "text-muted-foreground")}>
          {timeLine(cls)}
         </p>
        </>
       ) : null}
      </div>
     </div>
     {canEditClass ? (
     <Button
      type="button"
      variant={isMobile ? "secondary" : "default"}
      className={isMobile ? "bg-white/20 text-white hover:bg-white/30" : undefined}
      onClick={() => {
       setEditErr(null)
       setEditOpen(true)
      }}
     >
      <Pencil className="h-4 w-4" />
      編輯班別
     </Button>
     ) : isPrivateClass && canManageClass ? (
     <div className="flex w-fit shrink-0 flex-col gap-2 sm:items-end">
      {canBookPrivate ? (
       <Button
        type="button"
        variant={isMobile ? "secondary" : "default"}
        className={isMobile ? "bg-white/20 text-white hover:bg-white/30" : undefined}
        onClick={() => void openPrivateBook()}
       >
        預約上堂
       </Button>
      ) : null}
      {canEditPrivateLight ? (
       <Button
        type="button"
        variant={isMobile ? "secondary" : "outline"}
        className={isMobile ? "bg-white/20 text-white hover:bg-white/30" : undefined}
        onClick={openPrivateLightEdit}
       >
        <Pencil className="h-4 w-4" />
        編輯老師／學費
       </Button>
      ) : null}
      <Button
       type="button"
       variant={isMobile ? "secondary" : "outline"}
       className={isMobile ? "bg-white/20 text-white hover:bg-white/30" : undefined}
       asChild
      >
      <Link to="/PrivateTutoring">返回私人課程學生</Link>
      </Button>
     </div>
     ) : isPrivateClass && canBookPrivate ? (
     <Button
      type="button"
      variant={isMobile ? "secondary" : "default"}
      className={isMobile ? "bg-white/20 text-white hover:bg-white/30" : undefined}
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
    {isPrivateClass ? (
     <div
      role="status"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-info/40 bg-info/10 px-3 py-2 text-sm text-foreground"
     >
      私人課程詳情：可在此查看報讀／排程、編輯老師／學費，並直接預約上堂（不必退回列表）。
      <Link
       to="/PrivateTutoring"
       className="ml-2 font-medium text-primary underline-offset-4 hover:underline"
      >
       返回私人課程學生
      </Link>
     </div>
    ) : null}
    {isPrivateClass && privateTeacherMismatch && privateTeacherMismatch.mismatchCount > 0 ? (
     <div
      role="alert"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-warning/50 bg-warning/10 px-3 py-3 text-sm text-foreground"
     >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
       <div className="min-w-0 space-y-1">
        <p className="flex items-start gap-2 font-medium text-warning">
         <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
         班別老師與排程老師不一致（{privateTeacherMismatch.mismatchCount}／
         {privateTeacherMismatch.activeCount} 堂）
        </p>
        <p className="text-muted-foreground">
         老師時間表只認排程上的老師。目前：排程老師為空{" "}
         {privateTeacherMismatch.nullScheduleTeacherCount} 堂
         {privateTeacherMismatch.differentTeacherCount > 0
          ? `；與班別老師不同 ${privateTeacherMismatch.differentTeacherCount} 堂`
          : ""}
         {privateTeacherMismatch.substituteOriginalMismatchCount > 0
          ? `；代堂原任不符 ${privateTeacherMismatch.substituteOriginalMismatchCount} 堂`
          : ""}
         。
         {!cls?.teacher_id
          ? "請先指定班別負責老師。"
          : "可同步為班別負責老師，或到「編輯老師／學費」重新儲存。"}
        </p>
       </div>
       {canEditPrivateLight && cls?.teacher_id ? (
        <Button
         type="button"
         size="sm"
         variant="outline"
         className="shrink-0 border-warning/60"
         disabled={privateTeacherSyncing}
         onClick={() => void syncPrivateTeacherToSchedules()}
        >
         {privateTeacherSyncing ? "同步中…" : "同步排程老師"}
        </Button>
       ) : null}
      </div>
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
          <button
           type="button"
           className="font-medium text-primary underline-offset-4 hover:underline"
           onClick={() => openTeacher(cls.teacher_id as string)}
          >
           {cls.teacher_name ?? "—"}
          </button>
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
       {!teacherScopeId && (canEditClass || canAddPrivateStudent) ? (
       <Dialog
        open={addStudentOpen}
        onOpenChange={(open) => {
         setAddStudentOpen(open)
         if (open) {
          setAddStudentForm(
           cls?.course_mode === "summer_two_period" ? "第一期" : "full"
          )
          setAddStudentScheduleIds([])
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
                label:
                 p === SINGLE_SESSION_ENROLLMENT
                  ? "單堂／自選堂數"
                  : p === "第一期"
                    ? "暑期第一期"
                    : p === "第二期"
                      ? "暑期第二期"
                      : "暑期兩期全報",
               }))
             : [
                { value: "full", label: "報讀" },
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
           <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            報讀只建立就讀關係。可上課堂數須經收款確認後才入權益池，請勿在此手動填寫堂數。
           </p>
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
       <StaggerList as="div" className="space-y-3">
        {rosterStudents.map((s) => (
         <StaggerItem
          key={s.enrollmentId}
          as="div"
          className={cn(
           "flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm",
           preview?.kind === "student" && preview.id === s.studentId && "bg-info/15"
          )}
         >
         <button
          type="button"
          onClick={() => openStudent(s.studentId)}
          className="min-w-0 flex-1 text-left transition-all hover:opacity-90 active:scale-[0.99]"
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
         </button>
         <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
          {!teacherScopeId && (canEditClass || canAddPrivateStudent) ? (
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
        </StaggerItem>
       ))}
       </StaggerList>
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
       <StaggerList as="ul" className="space-y-2">
        {enrollmentEvents.map((ev) => (
         <StaggerItem
          key={ev.id}
          as="li"
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
           <button
            type="button"
            onClick={() => openStudent(ev.studentId)}
            className="font-medium text-primary hover:underline"
           >
            {ev.studentName}
           </button>
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
         </StaggerItem>
        ))}
       </StaggerList>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          <label className="flex items-center gap-2 text-sm">
           <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-warning"
            checked={addSchedExtra}
            onChange={(e) => setAddSchedExtra(e.target.checked)}
           />
           <span className="text-muted-foreground">標記為加堂（額外加開課堂）</span>
          </label>
          {addSchedExtra ? (
           addSchedRosterLoading ? (
            <p className="text-sm text-muted-foreground">載入就讀生名單…</p>
           ) : (
            <ExtraLessonRosterPicker
             candidates={addSchedRosterCandidates}
             selectedIds={addSchedRosterIds}
             onChange={setAddSchedRosterIds}
             disabled={savingAddSched}
            />
           )
          ) : null}
          <Button
           type="button"
           disabled={savingAddSched || !newSchedTimeSlot.trim()}
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
      {schedFiltered.length === 0 ? (
        <p className="text-sm text-muted-foreground">此分類尚無排程。</p>
       ) : (
        <StaggerList as="div" className="space-y-2">
        {schedFiltered.map((s) => {
         const hints = scheduleHints.get(s.id)
         return (
          <StaggerItem key={s.id} as="div">
          <ScheduleListCard
           sessionNumber={s.session_number}
           scheduledDate={s.scheduled_date}
           startTime={s.start_time}
           endTime={s.end_time}
           attendingNames={hints?.attendingNames}
           leaveNames={hints?.leaveNames}
           namesLoading={hintsLoading}
           cancelReason={s.status.includes("取消") ? s.cancel_reason : null}
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
           actions={
            s.status.includes("取消") && canManageClass && !classYearLocked ? (
             <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => void openArrangeMakeup(s.id)}
             >
              安排補堂
             </button>
            ) : null
           }
           controls={
            canManageClass ? (
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
          </StaggerItem>
         )
        })}
        </StaggerList>
       )}
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
         {canOpenCourseCatalog ? (
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
          由所選課程模板決定（目前：{classGradeDisplayText(cls.grade, cls.grade_code, cls.eligible_grade_codes)}）
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
         {TUITION_PRICE_PRESETS_HKD.map((p) => (
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
        <p className="text-xs text-muted-foreground">
         變更老師後，會同步此班所有未取消排程的負責老師（老師時間表依排程老師顯示）。
        </p>
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
         {TUITION_PRICE_PRESETS_HKD.map((p) => (
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
       {privateLightErr ? <p role="alert" className="text-sm text-destructive">{privateLightErr}</p> : null}
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
          const next = Number(e.target.value)
          setPrivateBookSlotIdx(next)
          if (!canUseConsecutiveFromSlotIndex(next)) setPrivateBookConsecutive(false)
          setPrivateBookRoomId("")
         }}
        >
         {LESSON_SLOT_INDICES.map((i) => (
          <option key={i} value={String(i)}>
           {privateBookConsecutive && canUseConsecutiveFromSlotIndex(i)
            ? `${consecutivePairFromFirstSlotIndex(i)?.displayRange ?? lessonSlotLabel(i)}（連堂）`
            : lessonSlotLabel(i)}
          </option>
         ))}
        </Select>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
         <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={privateBookConsecutive && canUseConsecutiveFromSlotIndex(privateBookSlotIdx)}
          disabled={!canUseConsecutiveFromSlotIndex(privateBookSlotIdx)}
          onChange={(e) => {
           setPrivateBookConsecutive(e.target.checked)
           setPrivateBookRoomId("")
          }}
         />
         連堂（連續 2 節 · 150 分鐘 · 計 2 堂學費）
        </label>
        {privateBookConsecutive && canUseConsecutiveFromSlotIndex(privateBookSlotIdx) ? (
         <p className="text-xs text-muted-foreground">
          將一次建立 2 筆排程
          {privateBookMode === "weekly" ? "；週期預約每次上課亦為連堂" : ""}。
         </p>
        ) : null}
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
        <p role="alert" className="whitespace-pre-wrap text-sm text-destructive">{privateBookErr}</p>
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

   <Dialog
    open={makeupTargetId != null}
    onOpenChange={(open) => {
     if (!open) closeArrangeMakeup()
    }}
   >
    <DialogContent className="max-w-md text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">安排補堂</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3">
      {makeupLoading ? (
       <p className="text-muted-foreground">載入中…</p>
      ) : null}
      {makeupErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
       >
        {makeupErr}
       </div>
      ) : null}
      {makeupPreview ? (
       <>
        <p className="text-muted-foreground">
         將於同班新建加堂排程（沿用原老師／課室；日期與時段可改）
         {makeupPreview.isConsecutive ? "；連堂已取消的節次會一併補回" : ""}
         。報讀生依報讀自動出現在新日子點名紙；單堂報讀會把原堂選堂改掛到新堂。
        </p>
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
         <p>
          原堂：{makeupPreview.originalDate}
          {makeupPreview.originalTimeSlot ? ` ${makeupPreview.originalTimeSlot}` : ""}
          {makeupPreview.cancelReason
           ? ` · 取消原因：${makeupPreview.cancelReason}`
           : ""}
         </p>
         {makeupPreview.attendingNames.length > 0 ? (
          <p className="mt-1 text-muted-foreground">
           原應出席：{formatStudentNameList(makeupPreview.attendingNames)}
          </p>
         ) : (
          <p className="mt-1 text-muted-foreground">原堂點名冊暫無應出席學生</p>
         )}
         {makeupPreview.singleSessionMoveCount > 0 ? (
          <p className="mt-1 text-muted-foreground">
           將改掛單堂選堂 {makeupPreview.singleSessionMoveCount} 人
          </p>
         ) : null}
         {makeupPreview.alreadyHasMakeupIds.length > 0 ? (
          <p role="alert" className="mt-1 text-destructive">此取消堂已安排過補回，請勿重複建立。</p>
         ) : null}
        </div>
        <div>
         <label className="text-xs text-muted-foreground">補堂日期</label>
         <Input
          type="date"
          className="mt-1"
          value={makeupDate}
          disabled={makeupSaving || makeupPreview.alreadyHasMakeupIds.length > 0}
          onChange={(e) => {
           setMakeupDate(e.target.value)
           if (makeupErr) setMakeupErr(null)
          }}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">
          補堂時段{makeupPreview.isConsecutive ? "（連堂起始格）" : ""}
         </label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={timeSlotSelectValueFromStored(makeupTimeSlot)}
          disabled={makeupSaving || makeupPreview.alreadyHasMakeupIds.length > 0}
          onChange={(e) => {
           setMakeupTimeSlot(e.target.value)
           if (makeupErr) setMakeupErr(null)
          }}
         >
          <option value="">請選擇時段</option>
          {CLASS_TIME_SLOT_OPTIONS.map((slot) => (
           <option key={slot} value={slot}>
            {slot}
           </option>
          ))}
          {makeupTimeSlot &&
          !CLASS_TIME_SLOT_OPTIONS.some(
           (slot) =>
            slot === makeupTimeSlot ||
            slot.replace(/\u2013/g, "-") === makeupTimeSlot.replace(/\u2013/g, "-")
          ) ? (
           <option value={makeupTimeSlot}>{makeupTimeSlot}（原資料）</option>
          ) : null}
         </Select>
         <p className="mt-1 text-xs text-muted-foreground">
          每格 75 分鐘，由 09:00 起
          {makeupPreview.isConsecutive ? "；連堂會自動帶下一格。" : "。"}
         </p>
        </div>
       </>
      ) : null}
      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" disabled={makeupSaving} onClick={closeArrangeMakeup}>
        返回
       </Button>
       <Button
        type="button"
        disabled={
         makeupSaving ||
         makeupLoading ||
         !makeupPreview ||
         makeupPreview.alreadyHasMakeupIds.length > 0
        }
        onClick={() => void onConfirmArrangeMakeup()}
       >
        {makeupSaving ? "建立中…" : "確認安排"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
  </AdaptiveDetailLayer>
 )
}
