import { useEffect, useMemo, useState } from "react"

import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import { Field, localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import {
 ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
 SUMMER_ENROLLMENT_FORM_OPTIONS,
 type EnrollmentFormValue,
 type EnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { fetchAllClasses, fetchSubjectOptions, fetchTeacherOptions } from "@/services/classQueries"
import { fetchUpcomingSchedulesForClass } from "@/services/leaveQueries"
import { countBoundSchedulesForEnrollment } from "@/services/pendingLessonQueries"
import { createPrivateTutoringEnrollment } from "@/services/privateTutoringQueries"
import {
 fetchOpenTrialsForStudent,
 insertTrialSession,
 trialTypeCategory,
 type StudentTrialSummary,
} from "@/services/trialQueries"
import {
 fetchClassOptions,
 fetchEnrollmentsForStudent,
 insertEnrollment,
 type ClassOption,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"

type Props = {
 student: StudentRecord
 /** 報讀筆數變更（不跳步） */
 onEnrollmentCountChange: (count: number) => void
 /** 試堂筆數變更（不跳步） */
 onTrialCountChange: (count: number) => void
 /** 使用者確認進入收款 */
 onContinueToPayment: (counts: { enrolledCount: number; trialCount: number }) => void
}

const TRIAL_TYPE_OPTIONS = ["免費試堂", "半價試堂", "原價試堂", "體驗課"] as const

export function EnrollClassStep({
 student,
 onEnrollmentCountChange,
 onTrialCountChange,
 onContinueToPayment,
}: Props) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [mode, setMode] = useState<"group" | "private" | "trial">("group")
 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [trials, setTrials] = useState<StudentTrialSummary[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [classOptions, setClassOptions] = useState<ClassOption[]>([])
 const [pickClass, setPickClass] = useState("")
 const [pickForm, setPickForm] = useState<string>("兩期全報")
 const [pickScheduleIds, setPickScheduleIds] = useState<string[]>([])
 const [pickEntitledCount, setPickEntitledCount] = useState("")
 const [pickBoundPreview, setPickBoundPreview] = useState<number | null>(null)
 const [groupSaving, setGroupSaving] = useState(false)

 const [subjectOptions, setSubjectOptions] = useState<{ id: string; name_zh: string }[]>([])
 const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([])
 const [privateSubjectId, setPrivateSubjectId] = useState("")
 const [privateTeacherId, setPrivateTeacherId] = useState("")
 const [privatePrice, setPrivatePrice] = useState("")
 const [privateClassName, setPrivateClassName] = useState("")
 const [privateSaving, setPrivateSaving] = useState(false)

 const [trialClassOptions, setTrialClassOptions] = useState<{ id: string; label: string }[]>([])
 const [trialClassId, setTrialClassId] = useState("")
 const [trialScheduleId, setTrialScheduleId] = useState("")
 const [trialScheduleOptions, setTrialScheduleOptions] = useState<
  { id: string; label: string; date: string }[]
 >([])
 const [trialSchedulesLoading, setTrialSchedulesLoading] = useState(false)
 const [trialType, setTrialType] = useState<string>("免費試堂")
 const [trialRemarks, setTrialRemarks] = useState("")
 const [trialSaving, setTrialSaving] = useState(false)

 const reloadEnrollments = async () => {
  const list = await fetchEnrollmentsForStudent(student.id)
  setEnrollments(list)
  return list
 }

 const reloadTrials = async () => {
  const list = await fetchOpenTrialsForStudent(student.id)
  setTrials(list)
  return list
 }

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void Promise.all([
   fetchClassOptions(),
   reloadEnrollments(),
   reloadTrials(),
   fetchSubjectOptions(),
   fetchTeacherOptions(),
   fetchAllClasses(),
  ])
   .then(([classes, , , subjects, teachers, allClasses]) => {
    if (cancelled) return
    setClassOptions(classes)
    setTrialClassOptions(
     allClasses.map((c) => ({
      id: c.id,
      label: formatClassLabel({
       subject: c.subject,
       courseCode: c.course_code_full,
       courseName: c.course_name,
      }),
     }))
    )
    setSubjectOptions(subjects.map((s) => ({ id: s.id, name_zh: s.name_zh })))
    setTeacherOptions(teachers.map((t) => ({ id: t.id, label: t.label })))
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "EnrollClassStep.load", setErr })
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when student changes
 }, [student.id])

 useEffect(() => {
  if (!trialClassId) {
   setTrialScheduleOptions([])
   setTrialScheduleId("")
   setTrialSchedulesLoading(false)
   return
  }
  let cancelled = false
  setTrialSchedulesLoading(true)
  setTrialScheduleOptions([])
  setTrialScheduleId("")
  void fetchUpcomingSchedulesForClass(trialClassId, localTodayYmd(), student.id)
   .then((sched) => {
    if (cancelled) return
    const opts = sched.slice(0, 15).map((s) => ({
     id: s.id,
     date: s.scheduled_date,
     label: `${s.scheduled_date} ${s.start_time?.slice(0, 5) ?? "—"}–${s.end_time?.slice(0, 5) ?? "—"}`,
    }))
    setTrialScheduleOptions(opts)
    setTrialScheduleId((prev) => (prev && opts.some((o) => o.id === prev) ? prev : (opts[0]?.id ?? "")))
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "EnrollClassStep.loadTrialSchedules", setErr })
   })
   .finally(() => {
    if (!cancelled) setTrialSchedulesLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [trialClassId, student.id])

 const occupiedClassIds = useMemo(
  () => new Set(enrollments.filter((e) => e.status !== "已退讀").map((e) => e.classId)),
  [enrollments]
 )

 const availableClasses = useMemo(
  () => classOptions.filter((c) => !occupiedClassIds.has(c.id)),
  [classOptions, occupiedClassIds]
 )

 const pickedClassOption = availableClasses.find((o) => o.id === pickClass) ?? null
 const isSummerPick = pickedClassOption?.courseMode === "summer_two_period"
 const showSessionPicker = Boolean(pickClass) && pickForm === SINGLE_SESSION_ENROLLMENT

 useEffect(() => {
  if (!pickClass) {
   setPickBoundPreview(null)
   return
  }
  const isSingle = pickForm === SINGLE_SESSION_ENROLLMENT
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (isSummerPick && ENROLLMENT_PERIOD_OPTIONS.includes(pickForm as EnrollmentPeriod)) {
   period = pickForm as EnrollmentPeriod
  }
  let cancelled = false
  void countBoundSchedulesForEnrollment({
   classId: pickClass,
   enrollmentPeriod: period,
   scheduleIds: isSingle ? pickScheduleIds : undefined,
  })
   .then((n) => {
    if (!cancelled) setPickBoundPreview(n)
   })
   .catch(() => {
    if (!cancelled) setPickBoundPreview(isSingle ? pickScheduleIds.length : null)
   })
  return () => {
   cancelled = true
  }
 }, [pickClass, pickForm, pickScheduleIds, isSummerPick])

 const activeCount = enrollments.filter((e) => e.status !== "已退讀").length
 const trialCount = trials.length
 const canContinue = activeCount > 0 || trialCount > 0

 const continueLabel = () => {
  if (activeCount > 0 && trialCount > 0) {
   return `已報讀 ${activeCount} 班、試堂 ${trialCount} 堂，繼續前往收款`
  }
  if (trialCount > 0) return `已登記 ${trialCount} 堂試堂，繼續前往收款`
  return `已報讀 ${activeCount} 班，繼續前往收款`
 }

 const syncCounts = async () => {
  const [enrList, trialList] = await Promise.all([reloadEnrollments(), reloadTrials()])
  const enr = enrList.filter((e) => e.status !== "已退讀").length
  onEnrollmentCountChange(enr)
  onTrialCountChange(trialList.length)
  return { enrolledCount: enr, trialCount: trialList.length }
 }

 const addGroupEnrollment = async () => {
  if (!pickClass || groupSaving) return
  const isSummer = pickedClassOption?.courseMode === "summer_two_period"
  const isSingle = pickForm === SINGLE_SESSION_ENROLLMENT
  if (isSingle && pickScheduleIds.length === 0) {
   setErr("單堂報讀請至少勾選一堂")
   return
  }
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(pickForm as EnrollmentPeriod)) {
   period = pickForm as EnrollmentPeriod
  }
  const entitledRaw = pickEntitledCount.trim()
  const entitled = entitledRaw === "" ? null : Math.floor(Number(entitledRaw))
  if (entitledRaw !== "" && (!Number.isFinite(entitled) || (entitled ?? 0) < 1)) {
   setErr("應享堂數請輸入正整數，或留空")
   return
  }
  let bound = pickBoundPreview
  if (bound == null) {
   try {
    bound = await countBoundSchedulesForEnrollment({
     classId: pickClass,
     enrollmentPeriod: period,
     scheduleIds: isSingle ? pickScheduleIds : undefined,
    })
   } catch {
    bound = isSingle ? pickScheduleIds.length : 0
   }
  }
  const owed = entitled != null && bound != null && entitled > bound ? entitled - bound : 0
  if (owed > 0) {
   const ok = await confirmDialog({
    title: "將記錄待補堂",
    description: `應享 ${entitled} 堂，目前只會綁定 ${bound} 堂，將同時記錄待補 ${owed} 堂。`,
    confirmText: "確認加入並記待補",
   })
   if (!ok) return
  }

  setGroupSaving(true)
  setErr(null)
  try {
   await insertEnrollment(
    student.id,
    pickClass,
    period,
    isSingle ? pickScheduleIds : undefined,
    owed > 0 ? { owedCount: owed, reason: "遲報缺堂", remarks: `應享 ${entitled}／綁定 ${bound}` } : null
   )
   setPickClass("")
   setPickForm(isSummer ? "兩期全報" : "full")
   setPickScheduleIds([])
   setPickEntitledCount("")
   setPickBoundPreview(null)
   const list = await reloadEnrollments()
   const count = list.filter((e) => e.status !== "已退讀").length
   pushBanner({
    tone: "success",
    title: "已加入班別",
    message: owed > 0 ? `已記錄待補 ${owed} 堂。可再新增其他班別。` : "可再新增其他班別，或繼續收款。",
   })
   onEnrollmentCountChange(count)
  } catch (e) {
   reportUserFacingError(e, { source: "EnrollClassStep.addGroup", setErr })
  } finally {
   setGroupSaving(false)
  }
 }

 const addPrivateEnrollment = async () => {
  if (privateSaving) return
  const subjectName = subjectOptions.find((s) => s.id === privateSubjectId)?.name_zh ?? ""
  const custom = privateClassName.trim()
  if (!subjectName && !custom) {
   setErr("請選擇科目或填寫自訂班名")
   return
  }
  const priceNum = privatePrice.trim() === "" ? null : Number(privatePrice)
  if (privatePrice.trim() !== "" && (!Number.isFinite(priceNum) || (priceNum ?? 0) < 0)) {
   setErr("學費不可為負數")
   return
  }

  setPrivateSaving(true)
  setErr(null)
  const payload = {
   studentIds: [student.id],
   subjectName: subjectName || "一對一",
   teacherId: privateTeacherId || null,
   pricePerLesson: priceNum,
   academicYearId: null as string | null,
   gradeLabel: student.grade && student.grade !== "—" ? student.grade : null,
   customClassSubject: custom || null,
  }
  try {
   try {
    await createPrivateTutoringEnrollment(payload)
   } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/重複|已存在|duplicate/i.test(msg)) {
     const ok = await confirmDialog({
      title: "可能重複報讀",
      description: `${msg}\n仍要建立嗎？`,
      confirmText: "仍要建立",
     })
     if (!ok) return
     await createPrivateTutoringEnrollment({ ...payload, allowDuplicate: true })
    } else {
     throw e
    }
   }
   setPrivateSubjectId("")
   setPrivateTeacherId("")
   setPrivatePrice("")
   setPrivateClassName("")
   const list = await reloadEnrollments()
   const count = list.filter((e) => e.status !== "已退讀").length
   pushBanner({ tone: "success", title: "已建立一對一報讀", message: "可再新增其他班別，或繼續收款。" })
   onEnrollmentCountChange(count)
  } catch (e) {
   reportUserFacingError(e, { source: "EnrollClassStep.addPrivate", setErr })
  } finally {
   setPrivateSaving(false)
  }
 }

 const addTrialSession = async () => {
  if (trialSaving) return
  const selectedSched = trialScheduleOptions.find((o) => o.id === trialScheduleId)
  if (!trialClassId || !trialScheduleId || !selectedSched) {
   setErr("請選擇班別與試堂排程")
   return
  }
  const cat = trialTypeCategory(trialType)
  if (cat === "half" || cat === "full") {
   pushBanner({
    tone: "info",
    title: "半價／原價試堂",
    message: "試堂紀錄將先建立；收費請於下一步前往「收款登記」處理。",
   })
  }

  setTrialSaving(true)
  setErr(null)
  try {
   await insertTrialSession({
    student_id: student.id,
    class_id: trialClassId,
    schedule_id: trialScheduleId,
    trial_date: selectedSched.date,
    trial_type: trialType,
    status: "已預約",
    remarks: trialRemarks.trim() || null,
   })
   setTrialClassId("")
   setTrialScheduleId("")
   setTrialType("免費試堂")
   setTrialRemarks("")
   const counts = await syncCounts()
   pushBanner({
    tone: "success",
    title: "已登記試堂",
    message: "學生已加入該堂點名名單；可再新增試堂或報讀，或繼續收款。",
   })
   onTrialCountChange(counts.trialCount)
  } catch (e) {
   reportUserFacingError(e, { source: "EnrollClassStep.addTrial", setErr })
  } finally {
   setTrialSaving(false)
  }
 }

 const canSubmitGroup =
  Boolean(pickClass) &&
  !groupSaving &&
  !(showSessionPicker && pickScheduleIds.length === 0)

 return (
  <div className="space-y-6">
   <p className="text-sm text-muted-foreground">
    可正式報讀班別，或<strong className="font-medium text-foreground">只登記試堂</strong>（無需報讀）。至少完成一筆報讀或試堂後再進入收款。選「單堂」報讀時必須勾選要報讀的堂次。
   </p>
   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}

   {enrollments.filter((e) => e.status !== "已退讀").length > 0 ? (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
     <div className="font-medium">已報讀班別（{activeCount}）— 可繼續新增</div>
     <ul className="mt-1 list-inside list-disc text-muted-foreground">
      {enrollments
       .filter((e) => e.status !== "已退讀")
       .map((e) => (
        <li key={e.id}>
         {classDisplayName({ subject: e.subject, courseName: e.courseName })}
         {e.enrollmentFormLabel ? ` · ${e.enrollmentFormLabel}` : ""}
         {e.classKind === "private" ? "（一對一）" : ""}
         {e.sessionNumbers?.length ? `（第 ${e.sessionNumbers.join("、")} 堂）` : ""}
        </li>
       ))}
     </ul>
    </div>
   ) : null}

   {trials.length > 0 ? (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
     <div className="font-medium">已登記試堂（{trialCount}）— 可繼續新增</div>
     <ul className="mt-1 list-inside list-disc text-muted-foreground">
      {trials.map((t) => (
       <li key={t.id}>
        {t.classLabel} · {t.trialType} · {t.scheduleLabel}
       </li>
      ))}
     </ul>
    </div>
   ) : null}

   <div className="flex flex-wrap gap-2">
    <Button type="button" variant={mode === "group" ? "default" : "outline"} onClick={() => setMode("group")}>
     小組課報讀
    </Button>
    <Button type="button" variant={mode === "private" ? "default" : "outline"} onClick={() => setMode("private")}>
     一對一／一對二
    </Button>
    <Button type="button" variant={mode === "trial" ? "default" : "outline"} onClick={() => setMode("trial")}>
     只登記試堂
    </Button>
   </div>

   {mode === "group" ? (
    <div className="space-y-4">
     <Field label="選擇班別">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={pickClass}
       onChange={(e) => {
        const id = e.target.value
        setPickClass(id)
        const opt = availableClasses.find((c) => c.id === id)
        setPickForm(opt?.courseMode === "summer_two_period" ? "兩期全報" : "full")
        setPickScheduleIds([])
        setPickEntitledCount("")
       }}
      >
       <option value="">請選擇班別</option>
       {availableClasses.map((c) => (
        <option key={c.id} value={c.id}>
         {c.label}
        </option>
       ))}
      </Select>
     </Field>

     {pickClass ? (
      <>
       <Field label={isSummerPick ? "報讀期數" : "報讀方式"}>
        <Select
         className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
         value={pickForm}
         onChange={(e) => {
          setPickForm(e.target.value)
          setPickScheduleIds([])
         }}
        >
         {(isSummerPick
          ? [...SUMMER_ENROLLMENT_FORM_OPTIONS]
          : (["full", SINGLE_SESSION_ENROLLMENT] as const)
         ).map((opt) => (
          <option key={opt} value={opt}>
           {opt === "full" ? "報足全期" : opt}
          </option>
         ))}
        </Select>
       </Field>
       {showSessionPicker ? (
        <div className="space-y-2">
         <p className="text-sm font-medium text-foreground">請勾選要報讀的堂次（必填）</p>
         {pickScheduleIds.length === 0 ? (
          <p role="status" className="text-xs text-warning">
           尚未選擇堂次；選完單堂後必須勾選至少一堂才能新增報讀。
          </p>
         ) : (
          <p className="text-xs text-success">已選 {pickScheduleIds.length} 堂</p>
         )}
         <EnrollmentSessionPicker
          classId={pickClass}
          selectedIds={pickScheduleIds}
          onChange={setPickScheduleIds}
          disabled={groupSaving}
         />
        </div>
       ) : null}
       <Field label="應享／繳費堂數（選填）">
        <Input
         inputMode="numeric"
         value={pickEntitledCount}
         onChange={(e) => setPickEntitledCount(e.target.value)}
         placeholder={pickBoundPreview != null ? `預估綁定 ${pickBoundPreview} 堂` : "留空則不記待補"}
        />
       </Field>
      </>
     ) : null}

     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={!canSubmitGroup} onClick={() => void addGroupEnrollment()}>
       {groupSaving ? "加入中…" : activeCount > 0 ? "新增另一班報讀" : "新增此班報讀"}
      </Button>
      {canContinue ? (
       <Button
        type="button"
        variant="outline"
        onClick={() => void syncCounts().then((c) => onContinueToPayment(c))}
       >
        {continueLabel()}
       </Button>
      ) : null}
     </div>
    </div>
   ) : mode === "private" ? (
    <div className="space-y-4">
     <Field label="科目">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={privateSubjectId}
       onChange={(e) => setPrivateSubjectId(e.target.value)}
      >
       <option value="">請選擇科目</option>
       {subjectOptions.map((s) => (
        <option key={s.id} value={s.id}>
         {s.name_zh}
        </option>
       ))}
      </Select>
     </Field>
     <Field label="自訂班名（選填）">
      <Input value={privateClassName} onChange={(e) => setPrivateClassName(e.target.value)} placeholder="覆寫顯示名稱" />
     </Field>
     <Field label="老師（選填）">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={privateTeacherId}
       onChange={(e) => setPrivateTeacherId(e.target.value)}
      >
       <option value="">稍後指定</option>
       {teacherOptions.map((t) => (
        <option key={t.id} value={t.id}>
         {t.label}
        </option>
       ))}
      </Select>
     </Field>
     <Field label="每堂學費（選填）">
      <Input inputMode="decimal" value={privatePrice} onChange={(e) => setPrivatePrice(e.target.value)} placeholder="例如 825" />
     </Field>
     <div className="flex flex-wrap gap-2">
      <Button type="button" disabled={privateSaving} onClick={() => void addPrivateEnrollment()}>
       {privateSaving ? "建立中…" : activeCount > 0 ? "再新增一對一報讀" : "建立一對一報讀"}
      </Button>
      {canContinue ? (
       <Button
        type="button"
        variant="outline"
        onClick={() => void syncCounts().then((c) => onContinueToPayment(c))}
       >
        {continueLabel()}
       </Button>
      ) : null}
     </div>
    </div>
   ) : (
    <div className="space-y-4">
     <p className="text-sm text-info-foreground">
      僅試讀／試堂：不需建立報讀，登記後學生會出現在該堂點名名單。
     </p>
     <Field label="試堂班別 *">
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
       value={trialClassId}
       onChange={(e) => setTrialClassId(e.target.value)}
      >
       <option value="">請選擇班別</option>
       {trialClassOptions.map((c) => (
        <option key={c.id} value={c.id}>
         {c.label}
        </option>
       ))}
      </Select>
     </Field>
     {trialClassId ? (
      <>
       <Field label="試堂排程 *">
        {trialSchedulesLoading ? (
         <p className="text-sm text-muted-foreground">載入排程…</p>
        ) : trialScheduleOptions.length === 0 ? (
         <p className="text-sm text-warning">此班別沒有可用的未來排程</p>
        ) : (
         <Select
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={trialScheduleId}
          onChange={(e) => setTrialScheduleId(e.target.value)}
         >
          {trialScheduleOptions.map((s) => (
           <option key={s.id} value={s.id}>
            {s.label}
           </option>
          ))}
         </Select>
        )}
       </Field>
       <Field label="試堂類型">
        <Select
         className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
         value={trialType}
         onChange={(e) => setTrialType(e.target.value)}
        >
         {TRIAL_TYPE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
           {opt}
          </option>
         ))}
        </Select>
       </Field>
       <Field label="備註（選填）">
        <Textarea value={trialRemarks} onChange={(e) => setTrialRemarks(e.target.value)} rows={2} />
       </Field>
      </>
     ) : null}
     <div className="flex flex-wrap gap-2">
      <Button
       type="button"
       disabled={trialSaving || !trialClassId || !trialScheduleId}
       onClick={() => void addTrialSession()}
      >
       {trialSaving ? "登記中…" : trialCount > 0 ? "再登記一堂試堂" : "登記試堂"}
      </Button>
      {canContinue ? (
       <Button
        type="button"
        variant="outline"
        onClick={() => void syncCounts().then((c) => onContinueToPayment(c))}
       >
        {continueLabel()}
       </Button>
      ) : null}
     </div>
    </div>
   )}
  </div>
 )
}
