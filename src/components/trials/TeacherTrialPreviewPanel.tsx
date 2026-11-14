import { Link } from "react-router-dom"
import { ArrowUpRight, CalendarDays, GraduationCap } from "lucide-react"

import { PreviewPropertyRow, PreviewSection } from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { displayTrialTypeLabel, trialIsAwaitingReschedule } from "@/lib/trialFollowupAction"
import { TRIAL_OUTCOME_LABELS, outcomeTagTone, trialOutcomeClosed } from "@/lib/trialOutcome"
import {
 formatTrialTeacherCommentAt,
 isWrittenTrialComment,
 trialCommentAuthorLabel,
} from "@/lib/trialTeacherComment"
import { teacherCanWriteTrialComment } from "@/lib/teacherTrialList"
import type { TeacherTrialRow } from "@/services/trialQueries"

type Props = {
 row: TeacherTrialRow
 teacherId: string
}

function timeLabel(row: TeacherTrialRow): string | null {
 if (!row.sched_start || !row.sched_end) return null
 return `${String(row.sched_start).slice(0, 5)}–${String(row.sched_end).slice(0, 5)}`
}

function registrationLabel(value: TeacherTrialRow["student_registration"]): string {
 if (value === "已註冊") return "已註冊"
 if (value === "非注冊") return "未註冊"
 return "—"
}

export function TeacherTrialPreviewPanel({ row, teacherId }: Props) {
 const awaiting = trialIsAwaitingReschedule(row.status)
 const when = timeLabel(row)
 const closed = trialOutcomeClosed(row.outcome)
 const commentWritten = isWrittenTrialComment(row.teacher_comment_at) && Boolean(row.teacher_comment?.trim())
 const showOutcome =
  closed || Boolean(row.outcome_reason?.trim()) || Boolean(row.outcome_note?.trim()) || Boolean(row.outcome_at)
 const canWrite = teacherCanWriteTrialComment(row.schedule_teacher_id, teacherId)
 const substitute =
  row.schedule_teacher_name && row.schedule_teacher_id && row.schedule_teacher_id !== teacherId
   ? row.schedule_teacher_name
   : null

 return (
  <div className="flex min-h-full flex-col text-sm">
   <header className="px-4 pb-3 pr-12 pt-4">
    <p className="text-xs font-medium text-muted-foreground">試堂學生</p>
    <h2 className="mt-1 text-xl font-semibold leading-tight">{row.student_name ?? "—"}</h2>
    <p className="mt-1 break-words text-sm text-muted-foreground">
     {formatStudentGrade(row.student_grade)}
     {" · "}
     {row.class_label || "—"}
    </p>
    <p className="mt-1 tabular-nums text-foreground">
     {awaiting ? "待改期 · 原訂 " : null}
     {row.trial_date || "—"}
     {when ? ` ${when}` : null}
    </p>
    <div className="mt-2 flex flex-wrap gap-1">
     <Tag tone={statusToTagTone(row.status)} size="sm">
      {row.status || "—"}
     </Tag>
     <Tag tone={statusToTagTone(row.roll_call_done ? "已點名" : "未點名")} size="sm">
      {row.roll_call_done ? "已點名" : "未點名"}
     </Tag>
     {row.attendance_status ? (
      <Tag tone={statusToTagTone(row.attendance_status)} size="sm">
       {row.attendance_status}
      </Tag>
     ) : null}
     <Tag tone={statusToTagTone(displayTrialTypeLabel(row.trial_type))} size="sm">
      {displayTrialTypeLabel(row.trial_type)}
     </Tag>
     {closed ? (
      <Tag tone={outcomeTagTone(row.outcome)} size="sm">
       {TRIAL_OUTCOME_LABELS[row.outcome]}
      </Tag>
     ) : null}
    </div>
   </header>

   <div className="flex-1 space-y-3 px-3 pb-3">
    <PreviewSection title="試堂" icon={GraduationCap}>
     <PreviewPropertyRow label="類型">{displayTrialTypeLabel(row.trial_type)}</PreviewPropertyRow>
     <PreviewPropertyRow label="狀態">{row.status || "—"}</PreviewPropertyRow>
     <div className="border-t border-border/70 pt-2">
      <p className="text-[11px] text-muted-foreground">備註</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{row.remarks?.trim() || "—"}</p>
     </div>
    </PreviewSection>

    <PreviewSection title="課堂" icon={CalendarDays}>
     <PreviewPropertyRow label="班別">{row.class_label || "—"}</PreviewPropertyRow>
     <PreviewPropertyRow label="課程編號">
      <span className="tabular-nums">{row.course_code_full ?? "—"}</span>
     </PreviewPropertyRow>
     <PreviewPropertyRow icon={CalendarDays} label="日期時間">
      <span className="tabular-nums">
       {(row.sched_date ?? row.trial_date) || "—"}
       {when ? ` ${when}` : " 未有時段"}
      </span>
     </PreviewPropertyRow>
     {substitute ? <PreviewPropertyRow label="本堂授課">{substitute}</PreviewPropertyRow> : null}
    </PreviewSection>

    <PreviewSection title="學生" icon={GraduationCap}>
     <PreviewPropertyRow label="年級">{formatStudentGrade(row.student_grade)}</PreviewPropertyRow>
     <PreviewPropertyRow label="註冊">{registrationLabel(row.student_registration)}</PreviewPropertyRow>
    </PreviewSection>

    {showOutcome ? (
     <PreviewSection title="結果">
      <PreviewPropertyRow label="結果">{TRIAL_OUTCOME_LABELS[row.outcome]}</PreviewPropertyRow>
      {row.outcome_reason?.trim() ? (
       <PreviewPropertyRow label="原因">{row.outcome_reason}</PreviewPropertyRow>
      ) : null}
      {row.outcome_note?.trim() ? (
       <div className="border-t border-border/70 pt-2">
        <p className="text-[11px] text-muted-foreground">補充</p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{row.outcome_note}</p>
       </div>
      ) : null}
      {row.outcome_at ? (
       <PreviewPropertyRow label="登記時間">
        <span className="tabular-nums">{formatTrialTeacherCommentAt(row.outcome_at)}</span>
       </PreviewPropertyRow>
      ) : null}
     </PreviewSection>
    ) : null}

    <PreviewSection title="評語">
     {commentWritten ? (
      <>
       <p className="whitespace-pre-wrap text-sm">{row.teacher_comment}</p>
       <p className="mt-1 text-xs text-muted-foreground">
        {trialCommentAuthorLabel(row.teacher_comment_by_name)}
        {" · "}
        {formatTrialTeacherCommentAt(row.teacher_comment_at)}
        {row.teacher_comment_edited_at
         ? ` · 其後改過 ${formatTrialTeacherCommentAt(row.teacher_comment_edited_at)}`
         : null}
       </p>
      </>
     ) : (
      <p className="text-sm text-muted-foreground">
       {canWrite ? "尚未撰寫。可在清單的評語欄填入。" : "只有該堂實際授課老師可以撰寫評語。"}
      </p>
     )}
    </PreviewSection>
   </div>

   <div className="sticky bottom-0 z-[1] space-y-2 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
    <Button asChild variant="outline" className="w-full">
     <Link to={`/Classes/${row.class_id}`}>
      開班別
      <ArrowUpRight />
     </Link>
    </Button>
    {row.schedule_id ? (
     <Button asChild variant="outline" className="w-full">
      <Link to={`/Schedule/${row.schedule_id}`}>
       開此排程
       <ArrowUpRight />
      </Link>
     </Button>
    ) : null}
   </div>
  </div>
 )
}
