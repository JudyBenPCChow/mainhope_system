import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import {
  formatTrialTeacherCommentAt,
  isTeacherCommentNudgeInScope,
  isWrittenTrialComment,
} from "@/lib/trialTeacherComment"
import { isActualPresentStatus } from "@/lib/attendancePresence"
import type { TrialFollowupKind } from "@/lib/trialFollowupAction"

export type TrialTeacherCommentBlockRow = {
  teacher_comment: string | null
  teacher_comment_at: string | null
  teacher_comment_by_name: string | null
  teacher_comment_edited_at: string | null
  attendance_status: string | null
  trial_date: string
}

function shouldShowTrialTeacherCommentBlock(
  followup: TrialFollowupKind,
  attendanceStatus: string | null | undefined
): boolean {
  return followup === "convert" && isActualPresentStatus(attendanceStatus)
}

export function TrialTeacherCommentBlock({
  row,
  followup,
  onCopy,
}: {
  row: TrialTeacherCommentBlockRow
  followup: TrialFollowupKind
  onCopy?: (text: string) => void
}) {
  const [copied, setCopied] = useState(false)
  if (!shouldShowTrialTeacherCommentBlock(followup, row.attendance_status)) return null

  const written = isWrittenTrialComment(row.teacher_comment_at) && Boolean(row.teacher_comment?.trim())
  const nudge = isTeacherCommentNudgeInScope(row.trial_date)

  if (written) {
    const text = row.teacher_comment ?? ""
    return (
      <div className="rounded-md border border-border bg-card px-2.5 py-2 text-sm">
        <p className="whitespace-pre-wrap text-foreground">{text}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {row.teacher_comment_by_name ?? "老師"}
          {" · "}
          {formatTrialTeacherCommentAt(row.teacher_comment_at)}
          {row.teacher_comment_edited_at ? " · 其後改過" : null}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text)
              setCopied(true)
              onCopy?.(text)
              window.setTimeout(() => setCopied(false), 1500)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? "已複製" : "複製"}
        </Button>
      </div>
    )
  }

  if (nudge) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Tag tone="default" size="sm">
          評語未到
        </Tag>
        <span>仍可正式報讀</span>
      </div>
    )
  }

  return (
    <div className="text-xs text-muted-foreground">
      <Tag tone="default" size="sm">
        尚無評語
      </Tag>
    </div>
  )
}
