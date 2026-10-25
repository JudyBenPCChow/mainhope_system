import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  GraduationCap,
  Hash,
  MessageCircle,
  Phone,
  Receipt,
  UserRound,
} from "lucide-react"

import { PreviewPropertyRow, PreviewSection } from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { HintTooltip } from "@/components/ui/tooltip"
import { useAppBanner } from "@/lib/appBanner"
import { paymentsReceiveHref } from "@/lib/paymentsReceiveHref"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { displayTrialTypeLabel, trialIsAwaitingReschedule } from "@/lib/trialFollowupAction"
import { TRIAL_OUTCOME_LABELS, outcomeTagTone, trialOutcomeClosed } from "@/lib/trialOutcome"
import { trialReceiptGate } from "@/lib/trialReceiptGate"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  formatTrialTeacherCommentAt,
  isWrittenTrialComment,
  trialCommentAuthorLabel,
  trialCommentWhatsappDraft,
} from "@/lib/trialTeacherComment"
import { updateTrialSession, type TrialManageRow } from "@/services/trialQueries"

type Props = {
  row: TrialManageRow
  onChanged: () => void | Promise<void>
}

function TrialRemarksField({
  trialId,
  remarks,
  onChanged,
}: {
  trialId: string
  remarks: string | null
  onChanged: () => void | Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const start = () => {
    setDraft(remarks ?? "")
    setErr(null)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    setErr(null)
    try {
      await updateTrialSession(trialId, { remarks: draft.trim() || null })
      await onChanged()
      setEditing(false)
    } catch (e) {
      reportUserFacingError(e, { source: "TrialPreviewPanel.remarks", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-border/70 pt-2">
      <p className="text-[11px] text-muted-foreground">備註</p>
      {editing ? (
        <div className="mt-1 space-y-2">
          <Textarea
            autoFocus
            value={draft}
            disabled={saving}
            placeholder="例如家長考慮中、下星期一再聯絡"
            aria-label="備註"
            className="min-h-[4.5rem]"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape" || saving) return
              e.stopPropagation()
              setEditing(false)
            }}
          />
          {err ? (
            <p role="alert" className="text-xs text-destructive">
              {err}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => setEditing(false)}>
              取消
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </div>
        </div>
      ) : (
        <HintTooltip hint="按下可以修改備註" delay={0} className="w-full">
          <button
            type="button"
            className="mt-1 w-full cursor-pointer whitespace-pre-wrap rounded-md px-1 py-0.5 text-left text-sm hover:bg-muted"
            aria-label="寫備註"
            onClick={start}
          >
            {remarks?.trim() || "—"}
          </button>
        </HintTooltip>
      )}
    </div>
  )
}

function TrialCommentChaseButton({ row }: { row: TrialManageRow }) {
  const { pushBanner } = useAppBanner()
  const url = row.teacher_whatsapp_group_url
  if (!url) return null
  const draft = trialCommentWhatsappDraft({
    studentName: row.student_name,
    gradeLabel: formatStudentGrade(row.student_grade),
    trialDate: row.trial_date,
    subject: row.class_subject,
  })
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          void navigator.clipboard.writeText(draft).then(
            () => {
              pushBanner({ tone: "success", title: "已複製提醒文字" })
            },
            () => {
              pushBanner({ tone: "warning", title: "無法複製", message: draft })
            }
          )
        }}
      >
        複製提醒文字
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          window.open(url, "_blank", "noopener,noreferrer")
        }}
      >
        前往老師 WhatsApp 群組
      </Button>
    </div>
  )
}

function registrationLabel(value: TrialManageRow["student_registration"]): string {
  return value === "已註冊" ? "已註冊" : "未註冊"
}

function headcountLabel(value: boolean | null): string {
  if (value === true) return "計人頭"
  if (value === false) return "不計人頭"
  return "未填"
}

function timeLabel(row: TrialManageRow): string | null {
  if (!row.sched_start || !row.sched_end) return null
  return `${String(row.sched_start).slice(0, 5)}–${String(row.sched_end).slice(0, 5)}`
}

export function TrialPreviewPanel({ row, onChanged }: Props) {
  const awaiting = trialIsAwaitingReschedule(row.status)
  const when = timeLabel(row)
  const gate = trialReceiptGate({ paymentId: row.payment_id, paymentStatus: row.payment_status })
  const paid = gate === "received"
  const payStatusLabel = paid ? "已收款（已在點名紙）" : "未收款"
  const closed = trialOutcomeClosed(row.outcome)
  const commentWritten = isWrittenTrialComment(row.teacher_comment_at) && Boolean(row.teacher_comment?.trim())
  const showOutcome =
    closed || Boolean(row.outcome_reason?.trim()) || Boolean(row.outcome_note?.trim()) || Boolean(row.outcome_at)
  const collectHref = paymentsReceiveHref({
    studentId: row.student_id,
    trials: [{ classId: row.class_id, trialType: row.trial_type }],
  })

  return (
    <div className="flex min-h-full flex-col text-sm">
      <header className="px-4 pb-3 pr-12 pt-4">
        <p className="text-xs font-medium text-muted-foreground">試堂紀錄</p>
        <h2 className="mt-1 text-xl font-semibold leading-tight">{row.student_name ?? "—"}</h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          {formatStudentGrade(row.student_grade)}
          {" · "}
          {row.class_subject ?? "—"}
        </p>
        <p className="mt-1 tabular-nums text-foreground">
          {awaiting ? "待改期 · 原訂 " : null}
          {row.trial_date || "—"}
          {when ? ` ${when}` : null}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Tag tone={statusToTagTone(row.status)} size="sm">
            {row.status}
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
          <Tag tone={statusToTagTone(payStatusLabel)} size="sm">
            {payStatusLabel}
          </Tag>
          {row.counts_toward_headcount === true ? (
            <Tag tone="info" size="sm">
              計人頭
            </Tag>
          ) : row.counts_toward_headcount === false ? (
            <Tag tone="default" size="sm">
              不計人頭
            </Tag>
          ) : null}
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
          <PreviewPropertyRow label="人頭">{headcountLabel(row.counts_toward_headcount)}</PreviewPropertyRow>
          <TrialRemarksField trialId={row.id} remarks={row.remarks} onChanged={onChanged} />
        </PreviewSection>

        <PreviewSection title="課堂" icon={CalendarDays}>
          <PreviewPropertyRow icon={UserRound} label="老師">
            {row.teacher_name ?? "—"}
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={Hash} label="課程編號">
            <span className="tabular-nums">{row.course_code_full ?? "—"}</span>
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={CalendarDays} label="日期時間">
            <span className="tabular-nums">
              {(row.sched_date ?? row.trial_date) || "—"}
              {when ? ` ${when}` : " 未有時段"}
            </span>
          </PreviewPropertyRow>
        </PreviewSection>

        <PreviewSection title="學生與聯絡" icon={Phone}>
          <PreviewPropertyRow icon={GraduationCap} label="年級">
            {formatStudentGrade(row.student_grade)}
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={BadgeCheck} label="註冊">
            {registrationLabel(row.student_registration)}
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={Phone} label="學生電話">
            <span className="tabular-nums">{row.student_phone ?? "—"}</span>
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={Phone} label="家長電話">
            <span className="tabular-nums">{row.parent_phone ?? "—"}</span>
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={MessageCircle} label="WhatsApp">
            <span className="tabular-nums">{row.student_whatsapp ?? "—"}</span>
          </PreviewPropertyRow>
        </PreviewSection>

        <PreviewSection title="收款" icon={Banknote}>
          <PreviewPropertyRow
            icon={Banknote}
            label="繳費狀態"
            action={
              paid ? null : (
                <Button asChild size="sm" className="shrink-0">
                  <Link to={collectHref}>前往收款</Link>
                </Button>
              )
            }
          >
            {payStatusLabel}
          </PreviewPropertyRow>
          <PreviewPropertyRow icon={Receipt} label="收據編號">
            <span className="tabular-nums">{row.receipt_number ?? "—"}</span>
          </PreviewPropertyRow>
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

        <PreviewSection title="老師評語">
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
            <>
              <p className="text-sm text-muted-foreground">尚未撰寫</p>
              <TrialCommentChaseButton row={row} />
            </>
          )}
        </PreviewSection>
      </div>

      <div className="sticky bottom-0 z-[1] space-y-2 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/Students/${row.student_id}`}>
            開學生詳情
            <ArrowUpRight />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/Classes/${row.class_id}`}>
            開班別
            <ArrowUpRight />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/Schedule/${row.schedule_id}`}>
            開此排程
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
    </div>
  )
}
