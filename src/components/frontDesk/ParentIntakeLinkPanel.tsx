import { Copy, Link2, MessageCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FrontDeskIntakeSession } from "@/services/frontDeskIntakeQueries"

type Props = {
  intake: FrontDeskIntakeSession | null
  intakeUrl: string
  intakeLoading: boolean
  checking: boolean
  parentSubmitted: boolean
  onCreateLink: () => void
  onCopyLink: () => void
  onShareWhatsApp: () => void
  onCheckStatus: () => void
}

/** 家長連結產生／複製／檢查（前台精靈與學生管理共用） */
export function ParentIntakeLinkPanel({
  intake,
  intakeUrl,
  intakeLoading,
  checking,
  parentSubmitted,
  onCreateLink,
  onCopyLink,
  onShareWhatsApp,
  onCheckStatus,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">家長填表連結</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>不必一直留在本頁。</strong>
            連結約 4 小時有效；家長填完後會出現在收件匣，亦可回來按「檢查是否已提交」。
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={intakeLoading} onClick={onCreateLink}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          {intake ? "重新產生" : "產生連結"}
        </Button>
      </div>
      {intakeLoading ? <p className="text-sm text-muted-foreground">產生中…</p> : null}
      {intake && intakeUrl ? (
        <div className="space-y-3 text-sm">
          <p>
            狀態：
            <span className="font-medium">
              {parentSubmitted || intake.status === "submitted" ? "家長已提交，請核對" : "等待家長填寫中"}
            </span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input readOnly value={intakeUrl} className="font-mono text-xs" aria-label="家長填表連結" />
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onCopyLink}>
                <Copy className="h-4 w-4" aria-hidden />
                複製連結
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onShareWhatsApp}>
                <MessageCircle className="h-4 w-4" aria-hidden />
                用 WhatsApp 傳送
              </Button>
            </div>
          </div>
          {!parentSubmitted ? (
            <Button type="button" variant="secondary" size="sm" disabled={checking} onClick={onCheckStatus}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {checking ? "檢查中…" : "檢查是否已提交"}
            </Button>
          ) : null}
        </div>
      ) : null}
      {parentSubmitted ? (
        <p className="text-sm text-success" role="status">
          已收到家長資料，請核對下方欄位後確認建立學生。
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">亦可切換「前台填寫」自行輸入。</p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        家長提交後，收件匣會出現待核對通知。
      </p>
    </div>
  )
}
