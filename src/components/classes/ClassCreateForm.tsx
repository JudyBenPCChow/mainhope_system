import { useEffect, useState } from "react"

import {
 CLASS_GRADE_FORM_OPTIONS,
 CLASS_TIME_SLOT_OPTIONS,
 KANBAN_DAY_COLUMNS,
 STATUS_CHIPS,
 weekdaysToStored,
} from "@/components/classes/classesUi"
import { gradeChineseToCode } from "@/lib/courseCode"
import { filterAcademicYearOptionsForEdit } from "@/lib/mgmtRole"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
 fetchAcademicYearOptions,
 fetchCourseOptions,
 fetchSubjectOptions,
 fetchTeacherOptions,
 type ClassRecord,
} from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import { fetchAcademicYearsWithDates, type AcademicYearRange } from "@/services/teacherAvailabilityQueries"

const PRICE_PRESETS_HKD = [250, 275, 825] as const

export type ClassCreateFormValues = {
 subject: string
 subject_id: string
 subject_code: string
 academic_year_id: string
 academic_year_label: string
 grade_code: string
 course_id: string
 section_code: string
 day_of_week: string[]
 time_slot: string
 teacher_id: string
 classroom_id: string
 price: string
 status: string
 start_date: string
 end_date: string
 enrollment_notice: string
}

export const emptyClassCreateForm = (): ClassCreateFormValues => ({
 subject: "",
 subject_id: "",
 subject_code: "",
 academic_year_id: "",
 academic_year_label: "",
 grade_code: "",
 course_id: "",
 section_code: "",
 day_of_week: [],
 time_slot: "",
 teacher_id: "",
 classroom_id: "",
 price: "",
 status: "進行中",
 start_date: "",
 end_date: "",
 enrollment_notice: "",
})

type Props = {
 values: ClassCreateFormValues
 onChange: (patch: Partial<ClassCreateFormValues>) => void
 disabled?: boolean
 showDates?: boolean
 showClassroom?: boolean
}

export function ClassCreateForm({
 values,
 onChange,
 disabled,
 showDates = true,
 showClassroom = true,
}: Props) {
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
 const [subjectOptions, setSubjectOptions] = useState<{ id: string; code: string; name_zh: string }[]>([])
 const [yearOptions, setYearOptions] = useState<{ id: string; label: string; is_current: boolean }[]>([])
 const [yearRanges, setYearRanges] = useState<AcademicYearRange[]>([])
 const [courseOptions, setCourseOptions] = useState<{ id: string; label: string }[]>([])
 const [rooms, setRooms] = useState<RoomRecord[]>([])

 useEffect(() => {
  void (async () => {
   const [teacherOpts, subjectOpts, yearOpts, yrs, rm] = await Promise.all([
    fetchTeacherOptions(),
    fetchSubjectOptions(),
    fetchAcademicYearOptions(),
    fetchAcademicYearsWithDates(),
    fetchClassrooms(),
   ])
   setTeachers(teacherOpts)
   setSubjectOptions(subjectOpts)
   setYearOptions(filterAcademicYearOptionsForEdit(yearOpts))
   setYearRanges(yrs)
   setRooms(rm.filter((r) => !r.is_online))
  })()
 }, [])

 useEffect(() => {
  if (yearOptions.length === 0) return
  if (values.academic_year_id && yearOptions.some((y) => y.id === values.academic_year_id)) return
  const picked = yearOptions.find((y) => y.is_current) ?? yearOptions[0]
  if (!picked) return
  const yr = yearRanges.find((y) => y.id === picked.id)
  onChange({
   academic_year_id: picked.id,
   academic_year_label: picked.label,
   start_date: yr?.start_date.slice(0, 10) ?? "",
   end_date: yr?.end_date.slice(0, 10) ?? "",
  })
 }, [values.academic_year_id, yearOptions, yearRanges, onChange])

 useEffect(() => {
  if (!values.academic_year_id || yearRanges.length === 0) return
  const yr = yearRanges.find((y) => y.id === values.academic_year_id)
  if (!yr) return
  if (values.start_date && values.end_date) return
  onChange({
   start_date: yr.start_date.slice(0, 10),
   end_date: yr.end_date.slice(0, 10),
  })
 }, [values.academic_year_id, values.start_date, values.end_date, yearRanges, onChange])

 useEffect(() => {
  const sid = values.subject_id
  const g = values.grade_code
  if (!sid || !g) {
   setCourseOptions([])
   return
  }
  void (async () => {
   try {
    const opts = await fetchCourseOptions({ subject_id: sid, grade_code: g })
    setCourseOptions(opts.map((o) => ({ id: o.id, label: o.label })))
   } catch {
    setCourseOptions([])
   }
  })()
 }, [values.subject_id, values.grade_code])

 const setYear = (yearId: string) => {
  const y = yearOptions.find((x) => x.id === yearId)
  const yr = yearRanges.find((x) => x.id === yearId)
  onChange({
   academic_year_id: yearId,
   academic_year_label: y?.label ?? "",
   start_date: yr?.start_date.slice(0, 10) ?? "",
   end_date: yr?.end_date.slice(0, 10) ?? "",
  })
 }

 return (
  <div className="grid gap-3 sm:grid-cols-2">
   <div className="sm:col-span-2">
    <label className="text-xs text-muted-foreground">學年 *</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.academic_year_id}
     onChange={(e) => setYear(e.target.value)}
     disabled={disabled}
    >
     <option value="">請選擇</option>
     {yearOptions.map((y) => (
      <option key={y.id} value={y.id}>
       {y.label} {y.is_current ? "（目前）" : ""}
      </option>
     ))}
    </Select>
   </div>
   <div>
    <label className="text-xs text-muted-foreground">科目 *</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.subject_id}
     onChange={(e) => {
      const s = subjectOptions.find((x) => x.id === e.target.value)
      onChange({
       subject_id: e.target.value,
       subject: s?.name_zh ?? "",
       subject_code: s?.code ?? "",
       course_id: "",
      })
     }}
     disabled={disabled}
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
    <label className="text-xs text-muted-foreground">年級 *</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.grade_code}
     onChange={(e) => onChange({ grade_code: e.target.value, course_id: "" })}
     disabled={disabled}
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
    <label className="text-xs text-muted-foreground">課程 *</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.course_id}
     onChange={(e) => onChange({ course_id: e.target.value })}
     disabled={disabled || !values.subject_id || !values.grade_code}
    >
     <option value="">請選擇課程</option>
     {courseOptions.map((c) => (
      <option key={c.id} value={c.id}>
       {c.label}
      </option>
     ))}
    </Select>
   </div>
   <div>
    <label className="text-xs text-muted-foreground">班號（可留空）</label>
    <Input
     className="mt-1 font-mono uppercase"
     value={values.section_code}
     onChange={(e) => onChange({ section_code: e.target.value })}
     disabled={disabled}
    />
   </div>
   <div className="sm:col-span-2">
    <label className="text-xs text-muted-foreground">逢星期（可多選）</label>
    <div className="mt-1 grid grid-cols-2 gap-2 rounded-md border border-input bg-background p-3 sm:grid-cols-4">
     {KANBAN_DAY_COLUMNS.map((d) => (
      <label key={d} className="flex cursor-pointer items-center gap-2 text-sm">
       <input
        type="checkbox"
        className="h-4 w-4 rounded border-input"
        checked={values.day_of_week.includes(d)}
        disabled={disabled}
        onChange={() =>
         onChange({
          day_of_week: values.day_of_week.includes(d)
           ? values.day_of_week.filter((x) => x !== d)
           : [...values.day_of_week, d],
         })
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
     value={values.time_slot}
     onChange={(e) => onChange({ time_slot: e.target.value })}
     disabled={disabled}
    >
     <option value="">未指定</option>
     {CLASS_TIME_SLOT_OPTIONS.map((slot) => (
      <option key={slot} value={slot}>
       {slot}
      </option>
     ))}
    </Select>
   </div>
   <div>
    <label className="text-xs text-muted-foreground">老師</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.teacher_id}
     onChange={(e) => onChange({ teacher_id: e.target.value })}
     disabled={disabled}
    >
     <option value="">未指定</option>
     {teachers.map((t) => (
      <option key={t.id} value={t.id}>
       {t.label}
      </option>
     ))}
    </Select>
   </div>
   {showClassroom ? (
    <div>
     <label className="text-xs text-muted-foreground">預設課室（批量排程用）</label>
     <Select
      className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
      value={values.classroom_id}
      onChange={(e) => onChange({ classroom_id: e.target.value })}
      disabled={disabled}
     >
      <option value="">稍後指定</option>
      {rooms.map((r) => (
       <option key={r.id} value={r.id}>
        {r.name}
       </option>
      ))}
     </Select>
    </div>
   ) : null}
   {showDates ? (
    <>
     <div>
      <label className="text-xs text-muted-foreground">開始日期</label>
      <Input
       type="date"
       className="mt-1"
       value={values.start_date}
       onChange={(e) => onChange({ start_date: e.target.value })}
       disabled={disabled}
      />
     </div>
     <div>
      <label className="text-xs text-muted-foreground">結束日期</label>
      <Input
       type="date"
       className="mt-1"
       value={values.end_date}
       onChange={(e) => onChange({ end_date: e.target.value })}
       disabled={disabled}
      />
     </div>
    </>
   ) : null}
   <div className="sm:col-span-2">
    <label className="text-xs text-muted-foreground">每節學費（HKD）</label>
    <div className="mt-1 flex flex-wrap gap-2">
     {PRICE_PRESETS_HKD.map((p) => (
      <Button
       key={p}
       type="button"
       size="sm"
       variant={values.price === String(p) ? "default" : "outline"}
       disabled={disabled}
       onClick={() => onChange({ price: String(p) })}
      >
       {p}
      </Button>
     ))}
    </div>
    <Input
     className="mt-2"
     type="number"
     min={0}
     value={values.price}
     onChange={(e) => onChange({ price: e.target.value })}
     disabled={disabled}
     placeholder="或手動輸入"
    />
   </div>
   <div>
    <label className="text-xs text-muted-foreground">狀態</label>
    <Select
     className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
     value={values.status}
     onChange={(e) => onChange({ status: e.target.value })}
     disabled={disabled}
    >
     {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
      <option key={s} value={s}>
       {s}
      </option>
     ))}
    </Select>
   </div>
   <div className="sm:col-span-2">
    <label className="text-xs text-muted-foreground">報讀須知</label>
    <Textarea
     className="mt-1 min-h-[100px]"
     value={values.enrollment_notice}
     onChange={(e) => onChange({ enrollment_notice: e.target.value })}
     disabled={disabled}
     placeholder="可填寫此班報讀注意事項、課程要求或備註"
     rows={4}
    />
   </div>
  </div>
 )
}

export function classCreateFormToInsertPayload(
 values: ClassCreateFormValues,
 selectedSubjectName: string
): Partial<ClassRecord> & { subject: string } {
 const dayStored = weekdaysToStored(values.day_of_week)
 const rawPrice = values.price.trim()
 const priceNum = rawPrice === "" ? null : Number(rawPrice)
 return {
  subject: selectedSubjectName,
  subject_id: values.subject_id,
  subject_code: values.subject_code,
  academic_year_id: values.academic_year_id,
  academic_year_label: values.academic_year_label,
  grade_code: values.grade_code,
  course_id: values.course_id,
  section_code: values.section_code.trim() || null,
  course_code: null,
  day_of_week: dayStored,
  time_slot: values.time_slot.trim() || null,
  teacher_id: values.teacher_id || null,
  classroom_id: values.classroom_id || null,
  price_per_lesson: priceNum != null && !Number.isNaN(priceNum) ? Math.max(0, priceNum) : null,
  start_date: values.start_date || null,
  end_date: values.end_date || null,
  status: values.status,
  enrollment_notice: values.enrollment_notice.trim() || null,
 }
}
