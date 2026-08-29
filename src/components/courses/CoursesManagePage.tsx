import { useCallback, useEffect, useMemo, useState } from "react"
import { BookOpen, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import {
 ALL_GRADE_CODES,
 clampCourseSeq,
 DEFAULT_COURSE_SEQ,
} from "@/lib/courseCode"
import { eligibleGradeDisplayText, normalizeEligibleGradeCodes } from "@/lib/classGrade"
import { formatStudentGrade } from "@/lib/studentGrade"
import type { CourseMode } from "@/lib/enrollmentPeriod"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 buildCourseGradeFilterChips,
 buildCourseSubjectFilterChips,
 COURSE_MODE_FILTER_CHIPS,
 courseMatchesGrade,
 courseMatchesMode,
 courseMatchesSearch,
 courseMatchesSubject,
 type CourseModeFilterKey,
} from "@/components/courses/coursesUi"
import {
 fetchAllCourses,
 fetchSubjectOptions,
 insertCourse,
 updateCourse,
 type CourseRecord,
} from "@/services/classQueries"

import { TUITION_PRICE_PRESETS_HKD } from "@/lib/tuitionPricePresets"

type CourseForm = {
 subject_id: string
 grade_code: string
 eligible_grade_codes: string[]
 course_seq: string
 course_name: string
 course_mode: CourseMode
 price_per_lesson: string
 price_per_lesson_period_2: string
 price_per_lesson_both_periods: string
}

const EMPTY_FORM: CourseForm = {
 subject_id: "",
 grade_code: "S1",
 eligible_grade_codes: ["S1"],
 course_seq: "1",
 course_name: "",
 course_mode: "regular",
 price_per_lesson: "",
 price_per_lesson_period_2: "",
 price_per_lesson_both_periods: "",
}

const GRADE_MULTI_OPTIONS = ALL_GRADE_CODES.map((g) => ({
 value: g,
 label: `${formatStudentGrade(g)}（${g}）`,
}))

function parsePriceField(raw: string): number | null {
 if (raw.trim() === "") return null
 const n = Number(raw)
 if (!Number.isFinite(n) || n < 0) return null
 return n
}

export function CoursesManagePage() {
 const [rows, setRows] = useState<CourseRecord[]>([])
 const [subjects, setSubjects] = useState<{ id: string; code: string; name_zh: string }[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [open, setOpen] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [saving, setSaving] = useState(false)
 const [form, setForm] = useState<CourseForm>(EMPTY_FORM)
 const [subjectKey, setSubjectKey] = useState("全部")
 const [gradeKey, setGradeKey] = useState("全部")
 const [modeKey, setModeKey] = useState<CourseModeFilterKey>("全部")
 const [search, setSearch] = useState("")

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   const [courseRows, subjectRows] = await Promise.all([fetchAllCourses(), fetchSubjectOptions()])
   setRows(courseRows)
   setSubjects(subjectRows)
  } catch (e) {
   reportUserFacingError(e, { source: "CoursesManagePage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const subjectLabelById = useMemo(
  () =>
   new Map(
    subjects.map((s) => [s.id, `${s.name_zh}（${s.code}）`] as const)
   ),
  [subjects]
 )

 const subjectChips = useMemo(
  () => buildCourseSubjectFilterChips(rows, subjects),
  [rows, subjects]
 )

 const gradeChips = useMemo(() => buildCourseGradeFilterChips(rows), [rows])

 useEffect(() => {
  if (!subjectChips.some((c) => c.key === subjectKey)) setSubjectKey("全部")
 }, [subjectChips, subjectKey])

 useEffect(() => {
  if (!gradeChips.includes(gradeKey)) setGradeKey("全部")
 }, [gradeChips, gradeKey])

 const filteredRows = useMemo(() => {
  return rows.filter(
   (r) =>
    courseMatchesSubject(r, subjectKey) &&
    courseMatchesGrade(r, gradeKey) &&
    courseMatchesMode(r, modeKey) &&
    courseMatchesSearch(r, search, subjectLabelById.get(r.subject_id) ?? r.subject_name_zh)
  )
 }, [rows, subjectKey, gradeKey, modeKey, search, subjectLabelById])

 const stats = useMemo(
  () => ({
   total: rows.length,
   filtered: filteredRows.length,
   summer: rows.filter((r) => r.course_mode === "summer_two_period").length,
  }),
  [rows, filteredRows]
 )

 const openCreate = () => {
  setEditingId(null)
  setForm({
   ...EMPTY_FORM,
   subject_id: subjects[0]?.id ?? "",
   course_seq: String(DEFAULT_COURSE_SEQ),
  })
  setOpen(true)
 }

 const openEdit = (row: CourseRecord) => {
  setEditingId(row.id)
  setForm({
   subject_id: row.subject_id,
   grade_code: row.grade_code,
   eligible_grade_codes: normalizeEligibleGradeCodes(row.eligible_grade_codes, row.grade_code),
   course_seq: String(row.course_seq),
   course_name: row.course_name ?? "",
   course_mode: row.course_mode,
   price_per_lesson: row.price_per_lesson != null ? String(row.price_per_lesson) : "",
   price_per_lesson_period_2:
    row.price_per_lesson_period_2 != null ? String(row.price_per_lesson_period_2) : "",
   price_per_lesson_both_periods:
    row.price_per_lesson_both_periods != null ? String(row.price_per_lesson_both_periods) : "",
  })
  setOpen(true)
 }

 const onSave = async () => {
  if (!form.subject_id) {
   setErr("請先選擇科目")
   return
  }
  const seqRaw = Number(form.course_seq)
  if (!Number.isFinite(seqRaw) || seqRaw < 1 || seqRaw > 999) {
   setErr("課程序號需為 1–999 的正整數")
   return
  }
  const seq = clampCourseSeq(seqRaw)
  const price = parsePriceField(form.price_per_lesson)
  const priceP2 = parsePriceField(form.price_per_lesson_period_2)
  const priceBoth = parsePriceField(form.price_per_lesson_both_periods)
  if (
   (form.price_per_lesson.trim() !== "" && price == null) ||
   (form.price_per_lesson_period_2.trim() !== "" && priceP2 == null) ||
   (form.price_per_lesson_both_periods.trim() !== "" && priceBoth == null)
  ) {
   setErr("學費需為 0 或以上")
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const payload = {
    subject_id: form.subject_id,
    grade_code: form.grade_code,
    eligible_grade_codes: normalizeEligibleGradeCodes(form.eligible_grade_codes, form.grade_code),
    course_seq: seq,
    course_name: form.course_name,
    course_mode: form.course_mode,
    price_per_lesson: price,
    price_per_lesson_period_2: form.course_mode === "summer_two_period" ? priceP2 : null,
    price_per_lesson_both_periods: form.course_mode === "summer_two_period" ? priceBoth : null,
   }
   if (editingId) {
    await updateCourse(editingId, payload)
   } else {
    await insertCourse(payload)
   }
   setOpen(false)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "CoursesManagePage.onSave", setErr })
  } finally {
   setSaving(false)
  }
 }

 const isSummer = form.course_mode === "summer_two_period"

 const chipBtn = (active: boolean) =>
  cn(
   "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
   active
    ? "border-primary bg-primary text-primary-foreground shadow-sm"
    : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
  )

 return (
  <div className="space-y-5 p-4 md:p-6">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <BookOpen className="h-7 w-7 shrink-0 text-primary" aria-hidden />
     課程管理
     <Tag tone="info" size="sm">{loading ? "…" : `${stats.total} 課程`}</Tag>
    </h1>
    <Button type="button" onClick={openCreate}>新增課程</Button>
   </div>

   {err ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {err}
    </div>
   ) : null}

   <div className="grid grid-cols-3 gap-2 md:gap-3">
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold md:text-2xl">{loading ? "…" : stats.total}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">課程總數</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold text-info md:text-2xl">{loading ? "…" : stats.filtered}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">篩選結果</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold text-warning md:text-2xl">{loading ? "…" : stats.summer}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">暑期兩期</div>
    </div>
   </div>

   <div className="space-y-4">
    <div className="space-y-2">
     <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">科目</div>
     <div className="flex flex-wrap gap-2">
      {subjectChips.map((chip) => (
       <button
        key={chip.key}
        type="button"
        onClick={() => setSubjectKey(chip.key)}
        className={chipBtn(subjectKey === chip.key)}
       >
        {chip.label}
       </button>
      ))}
     </div>
    </div>

    <div className="space-y-2">
     <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">年級碼</div>
     <div className="flex flex-wrap gap-2">
      {gradeChips.map((g) => (
       <button
        key={g}
        type="button"
        onClick={() => setGradeKey(g)}
        className={chipBtn(gradeKey === g)}
       >
        {g}
       </button>
      ))}
     </div>
    </div>

    <div className="space-y-2">
     <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">課程模式</div>
     <div className="flex flex-wrap gap-2">
      {COURSE_MODE_FILTER_CHIPS.map((chip) => (
       <button
        key={chip.key}
        type="button"
        onClick={() => setModeKey(chip.key)}
        className={chipBtn(modeKey === chip.key)}
       >
        {chip.label}
       </button>
      ))}
     </div>
    </div>

    <div className="relative">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
     <Input
      className="pl-9"
      placeholder="搜尋課程模板、名稱、科目…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
     />
    </div>
   </div>

   <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <div className="overflow-x-auto">
     <table className="w-full min-w-[72rem] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/50 text-left">
        <th className="w-[12%] px-4 py-3 font-medium">課程模板</th>
        <th className="w-[14%] px-3 py-3 font-medium">課程名稱</th>
        <th className="w-[10%] px-3 py-3 font-medium">科目</th>
        <th className="w-[14%] px-3 py-3 font-medium">接受年級</th>
        <th className="w-[8%] px-3 py-3 font-medium">課程序號</th>
        <th className="w-[10%] px-3 py-3 font-medium">模式</th>
        <th className="w-[18%] px-3 py-3 font-medium">學費（HKD/節）</th>
        <th className="w-[10%] px-3 py-3 font-medium">操作</th>
       </tr>
      </thead>
      {loading ? (
       <tbody>
        <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">載入中…</td></tr>
       </tbody>
      ) : rows.length === 0 ? (
       <tbody>
        <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">尚無課程</td></tr>
       </tbody>
      ) : filteredRows.length === 0 ? (
       <tbody>
        <tr><td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">沒有符合篩選條件的課程</td></tr>
       </tbody>
      ) : (
       <StaggerList as="tbody">
        {filteredRows.map((r) => (
         <StaggerItem key={r.id} as="tr" className="border-b border-border">
          <td className="px-4 py-3 font-mono text-xs">{r.course_code_base}</td>
          <td className="px-3 py-3">{r.course_name?.trim() || "—"}</td>
          <td className="px-3 py-3">{subjectLabelById.get(r.subject_id) ?? r.subject_name_zh}</td>
          <td className="px-3 py-3">{eligibleGradeDisplayText(r.eligible_grade_codes, r.grade_code)}</td>
          <td className="px-3 py-3">{r.course_seq}</td>
          <td className="px-3 py-3">{r.course_mode === "summer_two_period" ? "暑期兩期" : "常規"}</td>
          <td className="px-3 py-3 text-xs leading-relaxed">
           {r.course_mode === "summer_two_period" ? (
            <>
             <div>第一期：{r.price_per_lesson ?? "—"}</div>
             <div>第二期：{r.price_per_lesson_period_2 ?? "—"}</div>
             <div>兩期全報：{r.price_per_lesson_both_periods ?? "—"}</div>
            </>
           ) : (
            r.price_per_lesson ?? "—"
           )}
          </td>
          <td className="px-3 py-3">
           <button type="button" className="text-primary hover:underline" onClick={() => openEdit(r)}>
            編輯
           </button>
          </td>
         </StaggerItem>
        ))}
       </StaggerList>
      )}
     </table>
    </div>
   </div>

   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>{editingId ? "編輯課程" : "新增課程"}</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3">
      <div>
       <label className="text-xs text-muted-foreground">科目 *</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.subject_id}
        onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
       >
        <option value="">請選擇</option>
        {subjects.map((s) => (
         <option key={s.id} value={s.id}>{s.name_zh}（{s.code}）</option>
        ))}
       </Select>
      </div>
      <div>
       <label className="text-xs text-muted-foreground">編號年級 *（寫入課程模板碼）</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.grade_code}
        onChange={(e) => {
         const next = e.target.value
         setForm((f) => ({
          ...f,
          grade_code: next,
          eligible_grade_codes: normalizeEligibleGradeCodes(
           f.eligible_grade_codes.filter((g) => g !== f.grade_code),
           next
          ),
         }))
        }}
       >
        {ALL_GRADE_CODES.map((g) => (
         <option key={g} value={g}>{formatStudentGrade(g)}（{g}）</option>
        ))}
       </Select>
      </div>
      <div>
       <label className="text-xs text-muted-foreground">接受年級 *</label>
       <div className="mt-1">
        <MultiSelect
         value={form.eligible_grade_codes}
         onChange={(next) =>
          setForm((f) => ({
           ...f,
           eligible_grade_codes: normalizeEligibleGradeCodes(next, f.grade_code),
          }))
         }
         options={GRADE_MULTI_OPTIONS}
         placeholder="請選擇接受年級"
        />
       </div>
       <p className="mt-1 text-xs text-muted-foreground">
        專科班通常只選一級。高中混級班可同時接受中四、中五、中六。
       </p>
      </div>
      <div>
       <label className="text-xs text-muted-foreground">課程序號 *（001 起）</label>
       <Input
        className="mt-1"
        type="number"
        min={1}
        step={1}
        value={form.course_seq}
        onChange={(e) => setForm((f) => ({ ...f, course_seq: e.target.value }))}
       />
      </div>
      <div>
       <label className="text-xs text-muted-foreground">課程名稱</label>
       <Input
        className="mt-1"
        value={form.course_name}
        onChange={(e) => setForm((f) => ({ ...f, course_name: e.target.value }))}
        placeholder="例如：中四中國歷史精修班"
       />
      </div>
      <div>
       <label className="text-xs text-muted-foreground">課程模式</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.course_mode}
        onChange={(e) =>
         setForm((f) => ({
          ...f,
          course_mode: e.target.value === "summer_two_period" ? "summer_two_period" : "regular",
         }))
        }
       >
        <option value="regular">常規學年</option>
        <option value="summer_two_period">暑期兩期（可選報第一期／第二期／兩期全報）</option>
       </Select>
      </div>
      <div>
       <label className="text-xs text-muted-foreground">
        {isSummer ? "第一期學費（HKD/節）" : "學費（HKD/節）"}
       </label>
       <div className="mt-1 flex flex-wrap gap-2">
        {TUITION_PRICE_PRESETS_HKD.map((p) => (
         <Button
          key={p}
          type="button"
          size="sm"
          variant={Number(form.price_per_lesson) === p ? "default" : "outline"}
          onClick={() => setForm((f) => ({ ...f, price_per_lesson: String(p) }))}
         >
          {p}
         </Button>
        ))}
       </div>
       <Input
        className="mt-2"
        type="number"
        min={0}
        step={1}
        value={form.price_per_lesson}
        onChange={(e) => setForm((f) => ({ ...f, price_per_lesson: e.target.value }))}
       />
      </div>
      {isSummer ? (
       <>
        <div>
         <label className="text-xs text-muted-foreground">第二期學費（HKD/節）</label>
         <Input
          className="mt-1"
          type="number"
          min={0}
          step={1}
          value={form.price_per_lesson_period_2}
          onChange={(e) => setForm((f) => ({ ...f, price_per_lesson_period_2: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">兩期全報學費（HKD/節）</label>
         <Input
          className="mt-1"
          type="number"
          min={0}
          step={1}
          value={form.price_per_lesson_both_periods}
          onChange={(e) => setForm((f) => ({ ...f, price_per_lesson_both_periods: e.target.value }))}
         />
        </div>
       </>
      ) : null}
      <div className="flex justify-end gap-2 pt-1">
       <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
        取消
       </Button>
       <Button type="button" onClick={() => void onSave()} disabled={saving}>
        {saving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
