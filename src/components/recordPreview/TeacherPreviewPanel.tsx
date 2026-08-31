import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, MessageCircle } from "lucide-react"

import { useOpenClassRecord } from "@/components/recordPreview/recordPreviewContext"
import { PhoneRow, PreviewCell, PreviewError, PreviewLoading } from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { openWhatsAppChat } from "@/lib/whatsappReminder"
import {
 fetchTeacherClasses,
 getTeacherById,
 type TeacherClassRow,
 type TeacherRecord,
} from "@/services/teacherQueries"

const PREVIEW_CLASS_CAP = 5

type Props = {
 teacherId: string
}

export function TeacherPreviewPanel({ teacherId }: Props) {
 const openClass = useOpenClassRecord()
 const [teacher, setTeacher] = useState<TeacherRecord | null>(null)
 const [classes, setClasses] = useState<TeacherClassRow[]>([])
 const [classesLoading, setClassesLoading] = useState(true)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(false)
  setTeacher(null)
  setClasses([])
  setClassesLoading(true)

  void (async () => {
   try {
    const row = await getTeacherById(teacherId)
    if (cancelled) return
    setTeacher(row)
    if (!row) setError(true)
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherPreviewPanel.load" })
    if (!cancelled) {
     setTeacher(null)
     setError(true)
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()

  void (async () => {
   try {
    const rows = await fetchTeacherClasses(teacherId)
    if (!cancelled) setClasses(rows)
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherPreviewPanel.classes" })
    if (!cancelled) setClasses([])
   } finally {
    if (!cancelled) setClassesLoading(false)
   }
  })()

  return () => {
   cancelled = true
  }
 }, [teacherId])

 const shown = useMemo(() => classes.slice(0, PREVIEW_CLASS_CAP), [classes])
 const rest = Math.max(0, classes.length - shown.length)

 if (loading) return <PreviewLoading />
 if (error || !teacher) return <PreviewError message="老師資料未能載入。" />

 return (
  <div className="space-y-3 text-sm">
   <h2 className="pr-6 text-2xl font-bold leading-tight">{teacher.full_name}</h2>
   {teacher.english_name ? <p className="text-xs text-muted-foreground">{teacher.english_name}</p> : null}
   <div className="flex flex-wrap items-center gap-1.5">
    {teacher.abbr ? (
     <span className="font-mono text-xs tabular-nums text-muted-foreground">{teacher.abbr}</span>
    ) : null}
    <Tag tone={statusToTagTone(teacher.status)} size="sm">
     {teacher.status ?? "—"}
    </Tag>
   </div>
   <div className="grid grid-cols-2 gap-2">
    <PreviewCell label="任教">{classesLoading ? "…" : `${classes.length} 班`}</PreviewCell>
    <PreviewCell label="專長">
     {(teacher.subject_speciality ?? []).length > 0 ? (teacher.subject_speciality ?? []).join("、") : "—"}
    </PreviewCell>
   </div>
   <PhoneRow
    label="電話"
    value={teacher.phone}
    action={teacher.phone ? <TeacherWhatsAppButton phone={teacher.phone} /> : null}
   />
   {teacher.email ? (
    <p className="truncate text-xs">
     <span className="text-muted-foreground">電郵 </span>
     <span>{teacher.email}</span>
    </p>
   ) : null}
   <div className="rounded-xl border border-border p-3">
    <p className="text-xs font-semibold">任教班別</p>
    {classesLoading ? (
     <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      載入班別…
     </p>
    ) : classes.length === 0 ? (
     <p className="mt-2 text-xs text-muted-foreground">尚未指派任教班別</p>
    ) : (
     <div className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((c) => (
       <button key={c.id} type="button" className="inline-flex" onClick={() => openClass(c.id)}>
        <Tag tone="info" size="sm">
         {c.subject}
        </Tag>
       </button>
      ))}
     </div>
    )}
    {rest > 0 ? (
     <Link
      to={`/Teachers/${teacher.id}`}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
     >
      仲有 {rest} 班
     </Link>
    ) : null}
   </div>
   <div className="space-y-2 border-t border-border pt-3">
    <Button asChild className="w-full justify-start">
     <Link to={`/Teachers/${teacher.id}`}>開完整詳情</Link>
    </Button>
   </div>
  </div>
 )
}

function TeacherWhatsAppButton({ phone }: { phone: string }) {
 return (
  <button
   type="button"
   className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-success transition-colors hover:bg-success hover:text-success-foreground"
   title="開啟 WhatsApp"
   aria-label="開啟 WhatsApp"
   onClick={() => {
    openWhatsAppChat(phone)
   }}
  >
   <MessageCircle className="h-4 w-4" aria-hidden />
  </button>
 )
}
