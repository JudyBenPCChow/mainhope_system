import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
 ArrowUpRight,
 BookOpen,
 CalendarClock,
 Clock,
 DoorOpen,
 GraduationCap,
 Loader2,
 PencilLine,
 UserRound,
 Users,
 type LucideIcon,
} from "lucide-react"

import {
 useOpenStudentRecord,
 useOpenTeacherRecord,
} from "@/components/recordPreview/recordPreviewContext"
import {
 PreviewClassSkeleton,
 PreviewError,
 PreviewPropertyRow,
 PreviewSection,
 PreviewStat,
} from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerStack } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { formatClassTimeDisplay } from "@/lib/consecutiveLesson"
import { classDisplayName } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { classKindLabel, resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import {
 fetchClassStudents,
 getClassById,
 type ClassRecord,
 type ClassStudentRow,
} from "@/services/classQueries"

const PREVIEW_ROSTER_CAP = 8

const KIND_MARK: Record<ClassKind, { icon: LucideIcon; wrap: string }> = {
 group: { icon: BookOpen, wrap: "bg-info/15 text-info" },
 private: { icon: Users, wrap: "bg-muted text-muted-foreground" },
 homework: { icon: PencilLine, wrap: "bg-success/15 text-success" },
}

type Props = {
 classId: string
}

export function ClassPreviewPanel({ classId }: Props) {
 const openStudent = useOpenStudentRecord()
 const openTeacher = useOpenTeacherRecord()
 const [cls, setCls] = useState<ClassRecord | null>(null)
 const [roster, setRoster] = useState<ClassStudentRow[]>([])
 const [rosterLoading, setRosterLoading] = useState(true)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(false)
  setCls(null)
  setRoster([])
  setRosterLoading(true)

  void (async () => {
   try {
    const row = await getClassById(classId)
    if (cancelled) return
    setCls(row)
    if (!row) setError(true)
   } catch (e) {
    reportUserFacingError(e, { source: "ClassPreviewPanel.load" })
    if (!cancelled) {
     setCls(null)
     setError(true)
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()

  void (async () => {
   try {
    const students = await fetchClassStudents(classId)
    if (!cancelled) setRoster(students.filter((s) => s.status !== "已退讀"))
   } catch (e) {
    reportUserFacingError(e, { source: "ClassPreviewPanel.roster" })
    if (!cancelled) setRoster([])
   } finally {
    if (!cancelled) setRosterLoading(false)
   }
  })()

  return () => {
   cancelled = true
  }
 }, [classId])

 const shown = useMemo(() => roster.slice(0, PREVIEW_ROSTER_CAP), [roster])
 const rest = Math.max(0, roster.length - shown.length)

 if (loading) return <PreviewClassSkeleton />
 if (error || !cls) {
  return (
   <div className="px-3 py-3 pr-10">
    <PreviewError message="班別資料未能載入。" />
   </div>
  )
 }

 const kind = resolveClassKind(cls.class_kind, cls.subject)
 const KindIcon = KIND_MARK[kind].icon
 const timeLine = formatClassTimeDisplay({
  dayOfWeek: formatWeekdaysDisplay(cls.day_of_week),
  timeSlot: cls.time_slot,
  lessonSlotsPerSession: cls.lesson_slots_per_session,
 })
 const atCapacity = cls.capacity != null && roster.length >= cls.capacity

 return (
  <div className="flex min-h-full flex-col text-sm">
   <header>
    <div className="h-20 bg-gradient-to-b from-primary/20 to-primary/5" />
    <div className="-mt-10 flex flex-col items-center px-4 pb-4 text-center">
     <div
      className={cn(
       "flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm ring-4 ring-card",
       KIND_MARK[kind].wrap
      )}
      aria-hidden
     >
      <KindIcon className="h-9 w-9" />
     </div>
     <p className="mt-3">
      <Tag tone="default" size="sm" className="font-mono tabular-nums">
       {cls.course_code_full ?? cls.id.slice(0, 8)}
      </Tag>
     </p>
     <h2 className="mt-1.5 text-2xl font-bold leading-tight">
      {classDisplayName({ subject: cls.subject, courseName: cls.course_name })}
     </h2>
     <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
      <Tag tone="info" size="sm">
       {classKindLabel(kind)}
      </Tag>
      {kind === "private" ? (
       <Tag tone="info" size="sm">
        {cls.capacity === 2 ? "一對二" : "一對一"}
       </Tag>
      ) : null}
      {cls.academic_year_label ? (
       <Tag tone="default" size="sm">
        {cls.academic_year_label}
       </Tag>
      ) : null}
      <Tag tone={statusToTagTone(cls.status)} size="sm">
       {cls.status}
      </Tag>
     </div>
    </div>
   </header>

   <div className="flex-1 space-y-3 px-3 pb-3">
    <div className="grid grid-cols-2 gap-2">
     <PreviewStat
      label="在讀"
      value={rosterLoading ? "…" : roster.length}
      tone={
       rosterLoading || roster.length === 0 ? "default" : atCapacity ? "warning" : "info"
      }
     />
     <PreviewStat
      label="名額"
      value={rosterLoading ? "…" : (cls.capacity ?? "—")}
     />
    </div>

    <PreviewSection title="班別資料" icon={CalendarClock}>
     <PreviewPropertyRow icon={Clock} label="時間">
      <span title={timeLine || undefined}>{timeLine || "—"}</span>
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={GraduationCap} label="年級">
      {(cls.grade ?? []).join("、") || "—"}
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={DoorOpen} label="課室">
      {cls.classroom_name ?? "未指定"}
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={UserRound} label="任教老師">
      {cls.teacher_id ? (
       <button
        type="button"
        className="font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => openTeacher(cls.teacher_id as string)}
       >
        {cls.teacher_name ?? "—"}
       </button>
      ) : (
       "未指定"
      )}
     </PreviewPropertyRow>
    </PreviewSection>

    <PreviewSection title="學生名單" icon={Users}>
     {rosterLoading ? (
      <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
       <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
       載入名單…
      </p>
     ) : roster.length === 0 ? (
      <p className="text-xs text-muted-foreground">目前沒有在讀學生</p>
     ) : (
      <StaggerStack className="flex flex-wrap gap-1.5">
       {shown.map((s) => (
        <StaggerItem key={s.studentId} as="span" className="inline-flex">
         <button type="button" className="inline-flex" onClick={() => openStudent(s.studentId)}>
          <Tag tone="info" size="sm">
           {s.fullName}
          </Tag>
         </button>
        </StaggerItem>
       ))}
      </StaggerStack>
     )}
     {rest > 0 ? (
      <Link to={`/Classes/${cls.id}`} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
       還有 {rest} 人
      </Link>
     ) : null}
    </PreviewSection>
   </div>

   <div className="sticky bottom-0 z-[1] space-y-2 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
    <Button asChild className="w-full">
     <Link to={`/Classes/${cls.id}`}>
      開完整詳情
      <ArrowUpRight />
     </Link>
    </Button>
   </div>
  </div>
 )
}
