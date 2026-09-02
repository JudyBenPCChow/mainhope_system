import type { ConfirmResult } from "@/lib/appConfirm"

type ConfirmFn = (opts: {
 title: string
 description: string
 confirmText?: string
 cancelText?: string
 tone?: "default" | "warning" | "destructive"
}) => Promise<ConfirmResult>

export type EnrollmentNoticeItem = {
 notice: string | null | undefined
 classLabel?: string | null
}

function normalizeNotice(notice: string | null | undefined): string {
 return (notice ?? "").trim()
}

function buildDescription(items: Array<{ notice: string; classLabel?: string }>): string {
 const intro = "請提醒報讀學生（或家長）以下事項："
 if (items.length === 1) {
  const only = items[0]!
  const label = only.classLabel?.trim()
  return label ? `${intro}\n\n【${label}】\n${only.notice}` : `${intro}\n\n${only.notice}`
 }
 const body = items
  .map((item) => {
   const label = item.classLabel?.trim()
   return label ? `【${label}】\n${item.notice}` : item.notice
  })
  .join("\n\n")
 return `${intro}\n\n${body}`
}

/**
 * 班別有填寫「報讀須知」時，新增報讀前彈窗提醒；無內容則直接放行。
 * 回傳 false 表示同事取消，不應繼續建立報讀。
 */
export async function confirmEnrollmentNoticeIfPresent(
 confirmDialog: ConfirmFn,
 noticeOrItems: string | null | undefined | EnrollmentNoticeItem[]
): Promise<boolean> {
 const items: Array<{ notice: string; classLabel?: string }> = Array.isArray(noticeOrItems)
  ? noticeOrItems
     .map((item) => ({
      notice: normalizeNotice(item.notice),
      classLabel: item.classLabel?.trim() || undefined,
     }))
     .filter((item) => item.notice)
  : (() => {
     const notice = normalizeNotice(noticeOrItems)
     return notice ? [{ notice }] : []
    })()

 if (items.length === 0) return true

 const result = await confirmDialog({
  title: "報讀須知",
  description: buildDescription(items),
  confirmText: "已知悉，繼續報讀",
  cancelText: "取消",
  tone: "warning",
 })
 return result === true
}
