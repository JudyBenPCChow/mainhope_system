import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
 ArrowUpRight,
 Banknote,
 BookOpen,
 CalendarOff,
 GraduationCap,
 Loader2,
 Phone,
 School,
 UserRound,
} from "lucide-react"

import { useOpenClassRecord } from "@/components/recordPreview/recordPreviewContext"
import {
 PreviewError,
 PreviewMessageButton,
 PreviewPropertyRow,
 PreviewSection,
 PreviewStat,
 PreviewStudentSkeleton,
} from "@/components/recordPreview/previewUi"
import { StudentClassificationTags } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerStack } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { formatClassTimeDisplay } from "@/lib/consecutiveLesson"
import { classKindLabel, resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { classDisplayName } from "@/lib/courseLabel"
import { formatStudentGrade } from "@/lib/studentGrade"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { partitionEnrollmentsByAcademicYear } from "@/lib/enrollmentYearDisplay"
import { cn } from "@/lib/utils"
import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import { resolvePrimaryMessagingTarget } from "@/lib/whatsappReminder"
import {
 fetchEnrollmentsForStudent,
 getStudentById,
 normalizePrimaryContactPerson,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"
import {
 fetchPendingLessonsForStudent,
 isPendingLessonOpen,
} from "@/services/pendingLessonQueries"
import { fetchLeavesAwaitingMakeupDateForStudent } from "@/services/leaveQueries"

const PREVIEW_ENROLL_CAP = 5
const KIND_ORDER: ClassKind[] = ["group", "private", "homework"]
const KIND_ACCENT: Record<ClassKind, string> = {
 group: "border-l-info",
 private: "border-l-neutral-400",
 homework: "border-l-success",
}

function enrollmentTimeLine(e: EnrollmentWithClass): string | null {
 const line = formatClassTimeDisplay({
  dayOfWeek: formatWeekdaysDisplay(e.dayOfWeek),
  timeSlot: e.timeSlot,
 })
 return line && line !== "—" ? line : null
}

type Props = {
 studentId: string
}

export function StudentPreviewPanel({ studentId }: Props) {
 const openClass = useOpenClassRecord()
 const { profile } = useAuth()
 const caps = profile?.activeCapabilities
 const canPay = can(caps, "payments.create") || can(caps, "payments.mark_received")
 const canLeave = can(caps, "leaves.read") || can(caps, "leaves.manage")

 const [student, setStudent] = useState<StudentRecord | null>(null)
 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
 const [pendingCount, setPendingCount] = useState(0)
 const [leaveCount, setLeaveCount] = useState(0)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(false)
  setStudent(null)
  setEnrollments([])
  setEnrollmentsLoading(true)
  setPendingCount(0)
  setLeaveCount(0)

  void (async () => {
   try {
    const s = await getStudentById(studentId)
    if (cancelled) return
    setStudent(s)
    if (!s) setError(true)
   } catch (e) {
    reportUserFacingError(e, { source: "StudentPreviewPanel.load" })
    if (!cancelled) {
     setStudent(null)
     setError(true)
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()

  void (async () => {
   try {
    const ens = await fetchEnrollmentsForStudent(studentId)
    if (!cancelled) setEnrollments(ens)
   } catch (e) {
    reportUserFacingError(e, { source: "StudentPreviewPanel.enrollments" })
    if (!cancelled) setEnrollments([])
   } finally {
    if (!cancelled) setEnrollmentsLoading(false)
   }
  })()

  void (async () => {
   try {
    const [pending, leaves] = await Promise.all([
     fetchPendingLessonsForStudent(studentId),
     fetchLeavesAwaitingMakeupDateForStudent(studentId),
    ])
    if (cancelled) return
    setPendingCount(
     pending.filter((p) => isPendingLessonOpen(p.status)).reduce((sum, p) => sum + p.owedCount, 0)
    )
    setLeaveCount(leaves.length)
   } catch (e) {
    reportUserFacingError(e, { source: "StudentPreviewPanel.exceptions" })
    if (!cancelled) {
     setPendingCount(0)
     setLeaveCount(0)
    }
   }
  })()

  return () => {
   cancelled = true
  }
 }, [studentId])

 const { current: active, past: pastYearEnrollments } = useMemo(
  () => partitionEnrollmentsByAcademicYear(enrollments),
  [enrollments]
 )

 const groupedChips = useMemo(() => {
  const byKind = new Map<ClassKind, EnrollmentWithClass[]>()
  for (const e of active) {
   const k = resolveClassKind(e.classKind, e.subject)
   const list = byKind.get(k) ?? []
   list.push(e)
   byKind.set(k, list)
  }
  let shown = 0
  const blocks: { kind: ClassKind; items: EnrollmentWithClass[] }[] = []
  for (const k of KIND_ORDER) {
   const items = byKind.get(k) ?? []
   if (items.length === 0) continue
   const room = PREVIEW_ENROLL_CAP - shown
   if (room <= 0) break
   const slice = items.slice(0, room)
   blocks.push({ kind: k, items: slice })
   shown += slice.length
  }
  return { blocks, rest: Math.max(0, active.length - shown) }
 }, [active])

 if (loading) return <PreviewStudentSkeleton />
 if (error || !student) {
  return (
   <div className="px-3 py-3 pr-10">
    <PreviewError message="學生資料未能載入。" />
   </div>
  )
 }

 const contactPerson = normalizePrimaryContactPerson(student.primary_contact_person) ?? "家長"
 const contactName = contactPerson === "家長" ? (student.parent_name ?? "家長") : student.full_name
 const contactDetail =
  contactPerson === "家長" && student.parent_relationship
   ? `${student.parent_relationship} · ${contactName}`
   : contactName
 const messaging = resolvePrimaryMessagingTarget(student)
 const secondaryActions = [
  canPay ? (
   <Button key="pay" asChild variant="outline" className="w-full">
    <Link to={`/Payments?studentId=${encodeURIComponent(student.id)}`}>
     <Banknote />
     收款登記
    </Link>
   </Button>
  ) : null,
  canLeave ? (
   <Button key="leave" asChild variant="outline" className="w-full">
    <Link to={`/LeaveManagement?studentId=${encodeURIComponent(student.id)}`}>
     <CalendarOff />
     請假
    </Link>
   </Button>
  ) : null,
 ].filter(Boolean)

 return (
  <div className="flex min-h-full flex-col text-sm">
   <header>
    <div className="h-20 bg-gradient-to-b from-primary/20 to-primary/5" />
    <div className="-mt-12 flex flex-col items-center px-4 pb-4 text-center">
     <img
      src="/student-avatar-placeholder.svg"
      alt=""
      aria-hidden="true"
      className="h-24 w-24 rounded-full object-cover shadow-sm ring-4 ring-card"
     />
     <p className="mt-3">
      <Tag tone="default" size="sm" className="font-mono tabular-nums">
       {student.student_code ?? student.id.slice(0, 8)}
      </Tag>
     </p>
     <h2 className="mt-1.5 text-2xl font-bold leading-tight">{student.full_name}</h2>
     {student.english_name ? (
      <p className="mt-0.5 text-xs text-neutral-700">{student.english_name}</p>
     ) : null}
     <StudentClassificationTags student={student} size="sm" className="mt-2 justify-center" />
    </div>
   </header>

   <div className="flex-1 space-y-3 px-3 pb-3">
    <div className="grid grid-cols-3 gap-2">
     <PreviewStat
      label="進行中"
      value={enrollmentsLoading ? "…" : active.length}
      tone={enrollmentsLoading || active.length === 0 ? "default" : "info"}
     />
     <PreviewStat label="待補堂" value={pendingCount} tone={pendingCount > 0 ? "warning" : "default"} />
     <PreviewStat label="請假未安排" value={leaveCount} tone={leaveCount > 0 ? "warning" : "default"} />
    </div>

    <PreviewSection title="基本資料" icon={GraduationCap}>
     <PreviewPropertyRow icon={GraduationCap} label="年級">
      {formatStudentGrade(student.grade)}
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={School} label="學校">
      {student.school ?? "—"}
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={UserRound} label="第一聯絡人">
      {contactPerson}（{contactDetail}）
     </PreviewPropertyRow>
    </PreviewSection>

    <PreviewSection title="聯絡" icon={Phone}>
     <PreviewPropertyRow
      icon={Phone}
      label="學生電話"
      action={messaging?.person === "學生" ? <PreviewMessageButton messaging={messaging} /> : null}
     >
      <span className="font-mono text-xs tabular-nums">{student.student_phone ?? "—"}</span>
     </PreviewPropertyRow>
     <PreviewPropertyRow
      icon={Phone}
      label="家長電話"
      action={messaging?.person === "家長" ? <PreviewMessageButton messaging={messaging} /> : null}
     >
      <span className="font-mono text-xs tabular-nums">{student.parent_phone ?? "—"}</span>
     </PreviewPropertyRow>
    </PreviewSection>

    <PreviewSection title="進行中報讀" icon={BookOpen}>
     {enrollmentsLoading ? (
      <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
       <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
       載入報讀…
      </p>
     ) : active.length === 0 ? (
      <p className="text-xs text-muted-foreground">目前沒有進行中報讀</p>
     ) : (
      groupedChips.blocks.map((block) => (
       <div key={block.kind} className="mt-2 first:mt-0">
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">{classKindLabel(block.kind)}</p>
        <StaggerStack className="space-y-1.5">
         {block.items.map((e) => {
          const timeLine = enrollmentTimeLine(e)
          return (
           <StaggerItem key={e.id}>
            <button
             type="button"
             className={cn(
              "flex w-full flex-col rounded-lg border border-border border-l-[3px] bg-muted/20 px-2.5 py-2 text-left transition-colors hover:bg-muted/40",
              KIND_ACCENT[block.kind]
             )}
             onClick={() => openClass(e.classId)}
            >
             <span className="truncate font-medium">
              {classDisplayName({ subject: e.subject, courseName: e.courseName })}
             </span>
             {timeLine ? <span className="mt-0.5 text-[11px] text-muted-foreground">{timeLine}</span> : null}
            </button>
           </StaggerItem>
          )
         })}
        </StaggerStack>
       </div>
      ))
     )}
     {groupedChips.rest > 0 ? (
      <Link
       to={`/Students/${student.id}?tab=enrollments`}
       className="mt-2 block text-xs font-medium text-primary hover:underline"
      >
       還有 {groupedChips.rest} 班
      </Link>
     ) : null}
     {pastYearEnrollments.length > 0 ? (
      <Link
       to={`/Students/${student.id}?tab=enrollments`}
       className="mt-2 block text-xs font-medium text-primary hover:underline"
      >
       過往學年報讀 {pastYearEnrollments.length} 班
      </Link>
     ) : null}
    </PreviewSection>
   </div>

   <div className="sticky bottom-0 z-[1] space-y-2 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
    <Button asChild className="w-full">
     <Link to={`/Students/${student.id}`}>
      開完整詳情
      <ArrowUpRight />
     </Link>
    </Button>
    {secondaryActions.length > 0 ? (
     <div className={secondaryActions.length === 1 ? "grid grid-cols-1 gap-2" : "grid grid-cols-2 gap-2"}>
      {secondaryActions}
     </div>
    ) : null}
   </div>
  </div>
 )
}
