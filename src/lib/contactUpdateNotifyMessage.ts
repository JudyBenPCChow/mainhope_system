import { givenNameForCopy } from "@/lib/promotionMatchWhatsApp"

/**
 * 聯絡資料更新活動：WhatsApp／WeChat 預填通知。
 * 稱呼只用名字、不帶姓氏。
 */
export function buildContactUpdateNotifyMessage(opts: {
  fullName: string
  url: string
}): string {
  const given = givenNameForCopy(opts.fullName) || opts.fullName.trim() || "同學"
  return [
    `${given}你好！`,
    "為了方便我們進行上課通知及溝通，",
    "請開啟以下專屬連結，更新你最新的電話號碼及通訊偏好。",
    "如有任何填寫的問題，可以回覆此訊息",
    "",
    opts.url,
    "",
    "*第一聯絡人＝ 如有任何通知，我們會優先發送至此電話。",
    "",
    "感謝你的配合！",
    "",
    "明學教育示",
  ].join("\n")
}
