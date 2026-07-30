import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import {
 BatchSchedulePanel,
} from "@/components/classes/BatchSchedulePanel"
import {
 ClassCreateForm,
 classCreateFormToInsertPayload,
 emptyClassCreateForm,
 type ClassCreateFormValues,
} from "@/components/classes/ClassCreateForm"
import { timeSlotSelectValueFromStored, weekdaySelectValueFromStored } from "@/components/classes/classesUi"
import { Button } from "@/components/ui/button"
import { classDisplayName } from "@/lib/courseLabel"
import { filterAcademicYearOptionsForEdit } from "@/lib/mgmtRole"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { deleteClassCascade, fetchAcademicYearOptions, fetchSubjectOptions, insertClass, type ClassRecord } from "@/services/classQueries"
import { useAppConfirm } from "@/lib/appConfirm"

export function ClassCreatePage() {
 const navigate = useNavigate()
 const [searchParams] = useSearchParams()
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [step, setStep] = useState<1 | 2>(1)
 const [form, setForm] = useState<ClassCreateFormValues>(() => {
  const base = emptyClassCreateForm()
  const ay = searchParams.get("academic_year_id") ?? searchParams.get("academic_year")
  const teacherId = searchParams.get("teacher_id") ?? ""
  const dow = searchParams.get("day_of_week") ?? ""
  const slotRaw = searchParams.get("time_slot") ?? ""
  const dowCanonical = dow ? weekdaySelectValueFromStored(dow) || dow : ""
  return {
   ...base,
   academic_year_id: searchParams.get("academic_year_id") ?? "",
   academic_year_label: typeof ay === "string" && !searchParams.get("academic_year_id") ? ay : "",
   teacher_id: teacherId,
   day_of_week: dowCanonical ? [dowCanonical] : base.day_of_week,
   time_slot: slotRaw ? timeSlotSelectValueFromStored(decodeURIComponent(slotRaw)) || decodeURIComponent(slotRaw) : "",
  }
 })
 const [createdClass, setCreatedClass] = useState<ClassRecord | null>(null)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [subjectOptions, setSubjectOptions] = useState<{ id: string; name_zh: string }[]>([])

 useEffect(() => {
  void fetchSubjectOptions().then((s) => setSubjectOptions(s.map((x) => ({ id: x.id, name_zh: x.name_zh }))))
 }, [])

 useEffect(() => {
  if (form.academic_year_id) return
  void fetchAcademicYearOptions().then((years) => {
   const editableYears = filterAcademicYearOptionsForEdit(years)
   const fromLabel = searchParams.get("academic_year")
   const fromId = searchParams.get("academic_year_id")
   const picked =
    (fromId ? editableYears.find((y) => y.id === fromId) : null) ??
    (fromLabel ? editableYears.find((y) => y.label === fromLabel) : null) ??
    editableYears.find((y) => y.is_current) ??
    editableYears[0]
   if (picked) {
    setForm((f) => ({
     ...f,
     academic_year_id: picked.id,
     academic_year_label: picked.label,
    }))
   }
  })
 }, [form.academic_year_id, searchParams])

 const patchForm = useCallback((patch: Partial<ClassCreateFormValues>) => {
  setForm((f) => ({ ...f, ...patch }))
 }, [])

 const onStep1Next = async () => {
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: form.academic_year_label || null,
    source: "ClassCreatePage.onStep1Next",
   }))
  ) {
   return
  }
  if (!form.subject_id || !form.academic_year_id || !form.grade_code || !form.course_id) {
   pushBanner({ tone: "warning", title: "請填寫學年、科目、年級與課程" })
   return
  }
  const sub = subjectOptions.find((s) => s.id === form.subject_id)
  if (!sub) {
   pushBanner({ tone: "warning", title: "科目無效" })
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const row = await insertClass(classCreateFormToInsertPayload(form, sub.name_zh))
   setCreatedClass(row)
   setStep(2)
   pushBanner({ tone: "success", title: "班別已建立", message: "請繼續批量產生排程，或選擇稍後再排。" })
  } catch (e) {
   reportUserFacingError(e, { source: "ClassCreatePage.onStep1Next", setErr })
  } finally {
   setSaving(false)
  }
 }

 const onSkipSchedule = () => {
  if (createdClass) navigate(`/Classes/${createdClass.id}`)
 }

 const onCreateAnother = () => {
  const preservedYear = {
   academic_year_id: form.academic_year_id,
   academic_year_label: form.academic_year_label,
  }
  setCreatedClass(null)
  setStep(1)
  setErr(null)
  setForm({ ...emptyClassCreateForm(), ...preservedYear })
  navigate("/Classes/New", { replace: true })
 }

 const onDiscardClass = async () => {
  if (!createdClass) return
  if (
   !(await confirmDialog({
    title: "撤銷並刪除班別",
    description: "確定刪除此班別？尚未建立的排程將一併放棄。",
    confirmText: "確認刪除",
    tone: "destructive",
   }))
  )
   return
  try {
   await deleteClassCascade(createdClass.id)
   setCreatedClass(null)
   setStep(1)
   pushBanner({ tone: "info", title: "已刪除班別" })
  } catch (e) {
   reportUserFacingError(e, { source: "ClassCreatePage.onDiscardClass", setErr })
  }
 }

 return (
  <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
     <h1 className="text-xl font-semibold">新增班別</h1>
     <p className="text-sm text-muted-foreground">
      步驟 {step}/2：{step === 1 ? "班別基本資料" : "批量產生排程"}
     </p>
    </div>
    <Button variant="outline" size="sm" asChild>
     <Link to="/Classes">返回班別列表</Link>
    </Button>
   </div>

   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {step === 1 ? (
    <>
     <ClassCreateForm values={form} onChange={patchForm} disabled={saving} />
     <Button type="button" disabled={saving} onClick={() => void onStep1Next()}>
      {saving ? "建立中…" : "下一步：批量排程"}
     </Button>
    </>
   ) : createdClass ? (
    <>
     <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
      已建立班別：<span className="font-medium">
       {classDisplayName({ subject: createdClass.subject, courseName: createdClass.course_name })}
       {createdClass.course_code_full ? `（${createdClass.course_code_full}）` : ""}
      </span>
     </div>
     <BatchSchedulePanel
      classId={createdClass.id}
      cls={createdClass}
      onComplete={({ createdCount }) => {
       pushBanner({
        tone: "success",
        title: "已成功新增排程",
        message: `共建立 ${createdCount} 筆排程。`,
        action: { to: `/Classes/${createdClass.id}`, pageLabel: "班別詳情" },
       })
      }}
     />
     <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={onSkipSchedule}>
       稍後再排 · 前往班別詳情
      </Button>
      <Button type="button" variant="outline" onClick={onCreateAnother}>
       再建一班
      </Button>
      <Button type="button" variant="destructive" onClick={() => void onDiscardClass()}>
       撤銷並刪除此班別
      </Button>
     </div>
    </>
   ) : null}
  </div>
 )
}
