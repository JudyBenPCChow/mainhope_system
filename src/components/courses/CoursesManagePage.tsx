import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
 ALL_GRADE_CODES,
 clampCourseSeq,
 DEFAULT_COURSE_SEQ,
} from "@/lib/courseCode"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 fetchAllCourses,
 fetchSubjectOptions,
 insertCourse,
 updateCourse,
 type CourseRecord,
} from "@/services/classQueries"

export function CoursesManagePage() {
 const [rows, setRows] = useState<CourseRecord[]>([])
 const [subjects, setSubjects] = useState<{ id: string; code: string; name_zh: string }[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [open, setOpen] = useState(false)
 const [editingId, setEditingId] = useState<string | null>(null)
 const [saving, setSaving] = useState(false)
 const [form, setForm] = useState({
  subject_id: "",
  grade_code: "S1",
  course_seq: "1",
  price_per_lesson: "",
 })

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

 const openCreate = () => {
  setEditingId(null)
  setForm({
   subject_id: subjects[0]?.id ?? "",
   grade_code: "S1",
   course_seq: String(DEFAULT_COURSE_SEQ),
   price_per_lesson: "",
  })
  setOpen(true)
 }

 const openEdit = (row: CourseRecord) => {
  setEditingId(row.id)
  setForm({
   subject_id: row.subject_id,
   grade_code: row.grade_code,
   course_seq: String(row.course_seq),
   price_per_lesson: row.price_per_lesson != null ? String(row.price_per_lesson) : "",
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
  const price = form.price_per_lesson.trim() === "" ? null : Number(form.price_per_lesson)
  if (price != null && (!Number.isFinite(price) || price < 0)) {
   setErr("學費需為 0 或以上")
   return
  }
  setSaving(true)
  setErr(null)
  try {
   if (editingId) {
    await updateCourse(editingId, {
     subject_id: form.subject_id,
     grade_code: form.grade_code,
     course_seq: seq,
     price_per_lesson: price,
    })
   } else {
    await insertCourse({
     subject_id: form.subject_id,
     grade_code: form.grade_code,
     course_seq: seq,
     price_per_lesson: price,
    })
   }
   setOpen(false)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "CoursesManagePage.onSave", setErr })
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className="space-y-5 p-4 md:p-6">
   <div className="flex items-center justify-between gap-3">
    <h1 className="text-2xl font-semibold tracking-tight">課程管理（Courses）</h1>
    <Button type="button" onClick={openCreate}>新增課程</Button>
   </div>

   {err ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <div className="overflow-x-auto">
     <table className="w-full min-w-[60rem] border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/50 text-left">
        <th className="px-4 py-3 font-medium">課程模板</th>
        <th className="px-3 py-3 font-medium">科目</th>
        <th className="px-3 py-3 font-medium">年級碼</th>
        <th className="px-3 py-3 font-medium">課程序號</th>
        <th className="px-3 py-3 font-medium">學費（HKD/節）</th>
        <th className="px-3 py-3 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">載入中…</td></tr>
       ) : rows.length === 0 ? (
        <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">尚無課程</td></tr>
       ) : (
        rows.map((r) => (
         <tr key={r.id} className="border-b border-border">
          <td className="px-4 py-3 font-mono text-xs">{r.course_code_base}</td>
          <td className="px-3 py-3">{subjectLabelById.get(r.subject_id) ?? r.subject_name_zh}</td>
          <td className="px-3 py-3">{r.grade_code}</td>
          <td className="px-3 py-3">{r.course_seq}</td>
          <td className="px-3 py-3">{r.price_per_lesson != null ? r.price_per_lesson : "—"}</td>
          <td className="px-3 py-3">
           <button type="button" className="text-primary hover:underline" onClick={() => openEdit(r)}>
            編輯
           </button>
          </td>
         </tr>
        ))
       )}
      </tbody>
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
       <label className="text-xs text-muted-foreground">年級碼 *</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.grade_code}
        onChange={(e) => setForm((f) => ({ ...f, grade_code: e.target.value }))}
       >
        {ALL_GRADE_CODES.map((g) => (
         <option key={g} value={g}>{g}</option>
        ))}
       </Select>
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
       <label className="text-xs text-muted-foreground">學費（HKD/節）</label>
       <Input
        className="mt-1"
        type="number"
        min={0}
        step={1}
        value={form.price_per_lesson}
        onChange={(e) => setForm((f) => ({ ...f, price_per_lesson: e.target.value }))}
       />
      </div>
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

