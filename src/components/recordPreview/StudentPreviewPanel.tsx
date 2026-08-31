import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useOpenClassRecord } from "@/components/recordPreview/recordPreviewContext"
import {
 PhoneRow,
 PreviewCell,
 PreviewError,
 PreviewLoading,
 PreviewMessageButton,
} from "@/components/recordPreview/previewUi"
import { StudentClassificationTags } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { classKindLabel, resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { classDisplayName } from "@/lib/courseLabel"
import { formatStudentGrade } from "@/lib/studentGrade"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
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

 const active = useMemo(
  () => enrollments.filter((e) => e.status !== "已退讀"),
  [enrollments]
 )

 const exception = useMemo(() => {
  const bits: string[] = []
  if (pendingCount > 0) bits.push(`待補 ${pendingCount} 堂`)
  if (leaveCount > 0) bits.push(`請假未安排 ${leaveCount} 堂`)
  return bits
 }, [pendingCount, leaveCount])

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

 if (loading) return <PreviewLoading />
 if (error || !student) return <PreviewError message="學生資料未能載入。" />

 const contactPerson = normalizePrimaryContactPerson(student.primary_contact_person) ?? "家長"
 const contactName = contactPerson === "家長" ? (student.parent_name ?? "家長") : student.full_name
 const messaging = resolvePrimaryMessagingTarget(student)

 return (
  <div className="space-y-3 text-sm">
   <h2 className="pr-6 text-2xl font-bold leading-tight">{student.full_name}</h2>
   <div className="font-mono text-xs tabular-nums text-muted-foreground">{student.student_code ?? student.id.slice(0, 8)}</div>
   {student.english_name ? <p className="text-xs text-muted-foreground">{student.english_name}</p> : null}
   <StudentClassificationTags student={student} size="sm" />
   <div className="grid grid-cols-2 gap-2">
    <PreviewCell label="年級">{formatStudentGrade(student.grade)}</PreviewCell>
    <PreviewCell label="學校">{student.school ?? "—"}</PreviewCell>
    <PreviewCell label="第一聯絡人">
     {contactPerson}（{contactName}）
    </PreviewCell>
    <PreviewCell label="進行中">{enrollmentsLoading ? "…" : `${active.length} 班`}</PreviewCell>
   </div>
   <PhoneRow
    label="學生電話"
    value={student.student_phone}
    action={messaging?.person === "學生" ? <PreviewMessageButton messaging={messaging} /> : null}
   />
   <PhoneRow
    label="家長電話"
    value={student.parent_phone}
    action={messaging?.person === "家長" ? <PreviewMessageButton messaging={messaging} /> : null}
   />
   {exception.length > 0 ? (
    <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
     {exception.join(" · ")}
    </div>
   ) : null}
   <div className="rounded-xl border border-border p-3">
    <p className="text-xs font-semibold">進行中報讀</p>
    {enrollmentsLoading ? (
     <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      載入報讀…
     </p>
    ) : active.length === 0 ? (
     <p className="mt-2 text-xs text-muted-foreground">目前沒有進行中報讀</p>
    ) : (
     groupedChips.blocks.map((block) => (
      <div key={block.kind} className="mt-2">
       <p className="text-[11px] font-medium text-muted-foreground">{classKindLabel(block.kind)}</p>
       <div className="mt-1 flex flex-wrap gap-1.5">
        {block.items.map((e) => (
         <button
          key={e.id}
          type="button"
          className="inline-flex"
          onClick={() => openClass(e.classId)}
         >
          <Tag tone="info" size="sm">
           {classDisplayName({ subject: e.subject, courseName: e.courseName })}
          </Tag>
         </button>
        ))}
       </div>
      </div>
     ))
    )}
    {groupedChips.rest > 0 ? (
     <Link
      to={`/Students/${student.id}?tab=enrollments`}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
     >
      仲有 {groupedChips.rest} 班
     </Link>
    ) : null}
   </div>
   <div className="space-y-2 border-t border-border pt-3">
    <Button asChild className="w-full justify-start">
     <Link to={`/Students/${student.id}`}>開完整詳情</Link>
    </Button>
    {canPay ? (
     <Button asChild variant="outline" className="w-full justify-start">
      <Link to={`/Payments?studentId=${encodeURIComponent(student.id)}`}>收款登記</Link>
     </Button>
    ) : null}
    {canLeave ? (
     <Button asChild variant="outline" className="w-full justify-start">
      <Link to={`/LeaveManagement?studentId=${encodeURIComponent(student.id)}`}>請假</Link>
     </Button>
    ) : null}
   </div>
  </div>
 )
}
