import { useCallback, useEffect, useState } from "react"

import {
 ClassCreateForm,
 classCreateFormToInsertPayload,
 emptyClassCreateForm,
 type ClassCreateFormValues,
} from "@/components/classes/ClassCreateForm"
import { weekdaySelectValueFromStored } from "@/components/classes/classesUi"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { lessonSlotLabel } from "@/lib/lessonSlots"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { useAppBanner } from "@/lib/appBanner"
import { weekdayLabelFromYmd } from "@/lib/weekdayUtils"
import type { RoomRecord } from "@/services/classroomQueries"
import { fetchSubjectOptions, insertClass, type ClassRecord } from "@/services/classQueries"
import type {
 AcademicYearRange,
 TeacherAvailabilitySlot,
} from "@/services/teacherAvailabilityQueries"

export type FreeRoomSlotContext = {
 ymd: string
 room: RoomRecord
 slotIndex: number
 availableTeachers: TeacherAvailabilitySlot[]
}

type Props = {
 open: boolean
 onOpenChange: (open: boolean) => void
 context: FreeRoomSlotContext | null
 academicYear: AcademicYearRange | null
 onCreated: (cls: ClassRecord) => void
}

export function QuickClassFromSlotDialog({
 open,
 onOpenChange,
 context,
 academicYear,
 onCreated,
}: Props) {
 const { pushBanner } = useAppBanner()
 const [form, setForm] = useState<ClassCreateFormValues>(() => emptyClassCreateForm())
 const [subjectOptions, setSubjectOptions] = useState<{ id: string; name_zh: string }[]>([])
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 useEffect(() => {
  void fetchSubjectOptions().then((s) => setSubjectOptions(s.map((x) => ({ id: x.id, name_zh: x.name_zh }))))
 }, [])

 useEffect(() => {
  if (!open || !context || !academicYear) return
  const dow = weekdayLabelFromYmd(context.ymd) ?? ""
  setForm({
   ...emptyClassCreateForm(),
   academic_year_id: academicYear.id,
   academic_year_label: academicYear.label,
   day_of_week: weekdaySelectValueFromStored(dow) || dow,
   time_slot: lessonSlotLabel(context.slotIndex),
   classroom_id: context.room.id,
   teacher_id: context.availableTeachers[0]?.teacher_id ?? "",
   start_date: academicYear.start_date.slice(0, 10),
   end_date: academicYear.end_date.slice(0, 10),
  })
  setErr(null)
 }, [open, context, academicYear])

 const patchForm = useCallback((patch: Partial<ClassCreateFormValues>) => {
  setForm((f) => ({ ...f, ...patch }))
 }, [])

 const onSubmit = async () => {
  if (!context) return
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
   pushBanner({
    tone: "success",
    title: "班別已建立",
    message: "排程可於班別詳情稍後批量新增。",
   })
   onCreated(row)
   onOpenChange(false)
  } catch (e) {
   reportUserFacingError(e, { source: "QuickClassFromSlotDialog.onSubmit", setErr })
  } finally {
   setSaving(false)
  }
 }

 const dow = context ? weekdayLabelFromYmd(context.ymd) : null

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
    <DialogHeader>
     <DialogTitle>由此空檔建班</DialogTitle>
    </DialogHeader>
    {context ? (
     <div className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm leading-relaxed">
       <span className="tabular-nums">{context.ymd}</span>
       {dow ? `（${dow}）` : ""}
       <br />
       {lessonSlotLabel(context.slotIndex)} · {context.room.name}
       {context.availableTeachers.length > 0 ? (
        <>
         <br />
         <span className="text-muted-foreground">
          可任教：
          {context.availableTeachers.map((t) => t.teacher_name).filter(Boolean).join("、")}
         </span>
        </>
       ) : null}
      </p>
      <p className="text-xs text-muted-foreground">
       僅建立班別，不會自動產生排程；排程請於班別詳情批量新增。
      </p>
      {err ? (
       <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {err}
       </div>
      ) : null}
      <ClassCreateForm values={form} onChange={patchForm} disabled={saving} />
      <div className="flex flex-wrap justify-end gap-2">
       <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
        取消
       </Button>
       <Button type="button" disabled={saving} onClick={() => void onSubmit()}>
        {saving ? "建立中…" : "建立班別"}
       </Button>
      </div>
     </div>
    ) : null}
   </DialogContent>
  </Dialog>
 )
}
