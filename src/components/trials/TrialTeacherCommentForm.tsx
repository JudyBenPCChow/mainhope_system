import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  clampTrialTeacherComment,
  commentCharCount,
  commentCountLabel,
  commentCountTone,
  hasNonBlankTrialComment,
} from "@/lib/trialTeacherComment"
import { cn } from "@/lib/utils"

export type TrialTeacherCommentTarget = {
  trialId: string
  studentName: string
  studentGrade: string | null
  classLabel: string
  trialDate: string
  timeLabel: string | null
  initialComment?: string
}

type DraftMap = Record<string, string>

function subtitle(target: TrialTeacherCommentTarget): string {
  const parts = [
    target.studentGrade,
    target.classLabel,
    [target.trialDate, target.timeLabel].filter(Boolean).join(" "),
  ].filter((p) => p && p !== "—")
  return parts.join(" · ")
}

type Props = {
  targets: TrialTeacherCommentTarget[]
  saving?: boolean
  error?: string | null
  onSave: (entries: { trialId: string; comment: string }[]) => void | Promise<void>
  onLater: () => void
  headingNote?: string | null
}

export function TrialTeacherCommentForm({
  targets,
  saving = false,
  error,
  onSave,
  onLater,
  headingNote,
}: Props) {
  const [drafts, setDrafts] = useState<DraftMap>(() => {
    const next: DraftMap = {}
    for (const t of targets) next[t.trialId] = t.initialComment ?? ""
    return next
  })

  const filled = useMemo(
    () =>
      targets
        .map((t) => ({ trialId: t.trialId, comment: (drafts[t.trialId] ?? "").trim() }))
        .filter((row) => hasNonBlankTrialComment(row.comment)),
    [drafts, targets]
  )
  const canSave = filled.length > 0 && !saving

  const setDraft = (trialId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [trialId]: clampTrialTeacherComment(value) }))
  }

  return (
    <div className="grid gap-4">
      {headingNote ? <p className="text-sm text-muted-foreground">{headingNote}</p> : null}
      {targets.map((target) => {
        const value = drafts[target.trialId] ?? ""
        const count = commentCharCount(value)
        const tone = commentCountTone(count)
        return (
          <div key={target.trialId} className="grid gap-2">
            <div>
              <p className="font-medium text-foreground">{target.studentName}</p>
              <p className="text-xs text-muted-foreground">{subtitle(target)}</p>
            </div>
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">
                約 30 字。前台會用這段向家長說明學習情況，以及補習如何幫到他。請寫可對家長說的話。
              </span>
              <Textarea
                value={value}
                maxLength={80}
                rows={3}
                disabled={saving}
                placeholder="代數基礎弱、計算尚可；每週跟校進度可補上。"
                onChange={(e) => setDraft(target.trialId, e.target.value)}
              />
            </label>
            <p
              className={cn(
                "text-xs tabular-nums",
                tone === "warning" ? "text-warning" : "text-muted-foreground"
              )}
            >
              {commentCountLabel(count)}
            </p>
          </div>
        )
      })}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={saving} onClick={onLater}>
          稍後再寫
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          loading={saving}
          onClick={() => void onSave(filled)}
        >
          儲存評語
        </Button>
      </div>
    </div>
  )
}
