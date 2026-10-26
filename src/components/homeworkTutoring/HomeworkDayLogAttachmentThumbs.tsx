import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { useAppBanner } from "@/lib/appBanner"
import {
  deleteHomeworkDayLogAttachment,
  getHomeworkDayLogAttachmentSignedUrl,
  type HomeworkDayLogAttachmentRow,
} from "@/services/homeworkDayLogQueries"
import { cn } from "@/lib/utils"

function kindLabel(kind: HomeworkDayLogAttachmentRow["kind"]): string {
  if (kind === "handbook") return "手冊"
  if (kind === "dictation") return "默書"
  return "其他"
}

function Thumb({
  attachment,
  onDeleted,
  canDelete,
}: {
  attachment: HomeworkDayLogAttachmentRow
  onDeleted?: (id: string) => void
  canDelete?: boolean
}) {
  const { pushBanner } = useAppBanner()
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const signed = await getHomeworkDayLogAttachmentSignedUrl(attachment.storagePath)
        if (!cancelled) setUrl(signed)
      } catch {
        if (!cancelled) setUrl(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [attachment.storagePath])

  return (
    <div className="group relative w-[4.5rem] shrink-0">
      <button
        type="button"
        disabled={busy}
        className={cn(
          "block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-md border border-border bg-muted/40",
          !url && "flex items-center justify-center"
        )}
        title={`${kindLabel(attachment.kind)} · ${attachment.fileName}`}
        onClick={() => {
          void (async () => {
            try {
              const signed =
                url ?? (await getHomeworkDayLogAttachmentSignedUrl(attachment.storagePath))
              window.open(signed, "_blank", "noopener,noreferrer")
            } catch (e) {
              pushBanner({
                title: "開啟失敗",
                tone: "error",
                message: formatUnknownError(e),
              })
            }
          })()
        }}
      >
        {url ? (
          <img
            src={url}
            alt={attachment.fileName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-1 text-center text-[10px] text-muted-foreground">
            {kindLabel(attachment.kind)}
          </span>
        )}
      </button>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
        {kindLabel(attachment.kind)}
      </p>
      {canDelete && onDeleted ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-1 h-7 w-full px-1 text-[10px]"
          disabled={busy}
          onClick={() => {
            void (async () => {
              setBusy(true)
              try {
                await deleteHomeworkDayLogAttachment(attachment)
                onDeleted(attachment.id)
              } catch (e) {
                pushBanner({
                  title: "刪除失敗",
                  tone: "error",
                  message: formatUnknownError(e),
                })
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          刪
        </Button>
      ) : null}
    </div>
  )
}

type Props = {
  attachments: HomeworkDayLogAttachmentRow[]
  canDelete?: boolean
  onDeleted?: (id: string) => void
  emptyLabel?: string
}

/** 相片縮圖列：點開簽章 URL；可選刪除。 */
export function HomeworkDayLogAttachmentThumbs({
  attachments,
  canDelete,
  onDeleted,
  emptyLabel = "尚未上載",
}: Props) {
  if (attachments.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((a) => (
        <Thumb key={a.id} attachment={a} canDelete={canDelete} onDeleted={onDeleted} />
      ))}
    </div>
  )
}
