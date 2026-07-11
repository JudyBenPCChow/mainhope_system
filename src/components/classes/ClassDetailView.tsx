import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
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
 fetchEnrollmentChangeEventsForClass,
 type ClassEnrollmentChangeEvent,
 fetchAllStudents,
 insertEnrollment,
 type StudentRecord,
} from "@/services/studentQueries"
import { ENROLLMENT_PERIOD_OPTIONS, SINGLE_SESSION_ENROLLMENT, SUMMER_ENROLLMENT_FORM_OPTIONS, type EnrollmentPeriod } from "@/lib/enrollmentPeriod"
import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import { localYmd } from "@/services/teacherQueries"

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
 const cid = classId ?? ""
 const canManageClass = isMgmtStaff()
 const [tab, setTab] = useState<TabId>("basic")
 const [cls, setCls] = useState<ClassRecord | null>(null)
 const [students, setStudents] = useState<ClassStudentRow[]>([])
 const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
 const [enrollmentEvents, setEnrollmentEvents] = useState<ClassEnrollmentChangeEvent[]>([])
 const [schedules, setSchedules] = useState<ClassScheduleRow[]>([])
 const [scheduleHints, setScheduleHints] = useState<Map<string, ScheduleStudentHints>>(
  new Map()
 )
 const [savingSessionId, setSavingSessionId] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [editOpen, setEditOpen] = useState(false)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [savingEdit, setSavingEdit] = useState(false)
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
 const [studentQuery, setStudentQuery] = useState("")
 const [addingStudentId, setAddingStudentId] = useState<string | null>(null)
 const [addStudentErr, setAddStudentErr] = useState<string | null>(null)
 const [schedActionErr, setSchedActionErr] = useState<string | null>(null)
 const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null)
 const [cancelSaving, setCancelSaving] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)
 const [unsavedLeaveOpen, setUnsavedLeaveOpen] = useState(false)

 const classYearLocked = useMemo(
  () => (cls ? !canEditAcademicYear(academicYearLabelForClass(cls)) : false),
  [cls]
 )
 const isPrivateClass = cls?.class_kind === "private"
 const canEditClass = canManageClass && !classYearLocked && !isPrivateClass
 const canEditSchedule = (scheduledDate: string) =>
  canManageClass && canEditAcademicYearForDate(scheduledDate) && !isPrivateClass

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
   const hints = await fetchScheduleStudentHintsForClass(
    cid,
    sc.map((s) => ({ id: s.id, scheduled_date: s.scheduled_date }))
   )
   setScheduleHints(hints)
   setTeachers(tch)
   setRooms(rm)
   setAllStudents(allSt)
   setSubjectOptions(subjectOpts)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.reload",
    setErr: setPageErr,
    userMessage: msg,
   })
  } finally {
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
  navigate("/Classes")
 }, [editOpen, requestCloseEdit, navigate])

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

 if (!cid) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel={null}>
    <p className="p-6 text-muted-foreground">無效路由</p>
   </DetailLayerShell>
  )
 }
 if (!loading && !cls) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel="班別詳情">
    <div className="p-6">
     <p className="text-muted-foreground">找不到班別。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to="/Classes">返回</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 const scopeTeacherId = getTeacherScopeTeacherId()
 if (!loading && cls && scopeTeacherId && cls.teacher_id !== scopeTeacherId) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel="班別詳情">
    <div className="p-6">
     <p>此班別不屬於您的指派，無法檢視。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to="/Classes">返回班別列表</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

const tabCounts = { st: students.length, ev: enrollmentEvents.length, sc: schedules.length }
const addableStudents = (() => {
  const enrolledIds = new Set(students.map((s) => s.studentId))
  const q = studentQuery.trim().toLowerCase()
  const list = allStudents.filter((s) => !enrolledIds.has(s.id))
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
   const isSummer = cls?.course_mode === "summer_two_period"
   const isSingle = addStudentForm === SINGLE_SESSION_ENROLLMENT
   if (isSingle && addStudentScheduleIds.length === 0) {
    setAddStudentErr("單堂報讀請至少選擇一堂")
    return
   }
   let period: EnrollmentPeriod | typeof SINGLE_SESSION_ENROLLMENT | null = null
   if (isSingle) period = SINGLE_SESSION_ENROLLMENT
   else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(addStudentForm as EnrollmentPeriod)) {
    period = addStudentForm as EnrollmentPeriod
   }
   await insertEnrollment(studentId, cid, period, isSingle ? addStudentScheduleIds : undefined)
   setStudentQuery("")
   setAddStudentForm(isSummer ? "兩期全報" : "full")
   setAddStudentScheduleIds([])
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
            一對一
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
     <Button
      type="button"
      variant="secondary"
      className="bg-white/20 text-white hover:bg-white/30"
      asChild
     >
      <Link to="/PrivateTutoring">前往一對一學生</Link>
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
      此為一對一班別（唯讀）。請至「一對一學生」頁預約、編輯學費／老師或退讀。
      <Link to="/PrivateTutoring" className="ml-2 font-medium text-primary underline-offset-4 hover:underline">
       前往一對一學生
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

      <div className="grid gap-3 sm:grid-cols-3">
       <div className="rounded-xl border border-info bg-info p-4 text-center text-info-foreground shadow-sm transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold tabular-nums">{students.length}</div>
        <div className="text-xs font-medium opacity-90">就讀學生</div>
       </div>
       <div className="rounded-xl border border-info bg-info p-4 text-center text-info-foreground shadow-sm transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold tabular-nums">{parts.fut}</div>
        <div className="text-xs font-medium opacity-90">未來排程</div>
       </div>
       <div className="rounded-xl border border-success bg-success p-4 text-center text-success-foreground shadow-sm transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold tabular-nums">{parts.past}</div>
        <div className="text-xs font-medium opacity-90">已完成課堂</div>
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
       {!getTeacherScopeTeacherId() && canEditClass ? (
       <Dialog
        open={addStudentOpen}
        onOpenChange={(open) => {
         setAddStudentOpen(open)
         if (open) {
          setAddStudentForm(
           cls?.course_mode === "summer_two_period" ? "兩期全報" : "full"
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
          <DialogTitle>增加學生到本班</DialogTitle>
         </DialogHeader>
         <div className="space-y-3">
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
          {addStudentForm === SINGLE_SESSION_ENROLLMENT && cid ? (
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
      {students.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚無學生名單。</p>
      ) : (
       students.map((s) => (
        <Link
         key={s.enrollmentId}
         to={`/Students/${s.studentId}`}
         state={{ from: `/Classes/${cid}` }}
         className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
        >
         <div>
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
         </div>
         <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
        </Link>
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
           editableSessionNumber={canEditSchedule(s.scheduled_date)}
           savingSessionNumber={savingSessionId === s.id}
           onSessionNumberSave={
            canEditSchedule(s.scheduled_date)
             ? (n) => void onSaveSessionNumber(s.id, n)
             : undefined
           }
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
