import { givenNameForCopy } from "@/lib/promotionMatchWhatsApp"

/**
 * 試堂邀請：WhatsApp／WeChat 預填通知。
 * 稱呼只用名字、不帶姓氏。
 */
export function buildTrialInviteNotifyMessage(opts: {
  fullName: string
  url: string
}): string {
  const given = givenNameForCopy(opts.fullName) || opts.fullName.trim() || "同學"
  return [
    `${given}／${given}家長你好！`,
    "",
    "明學教育正舉辦「免費試堂」！",
    "👉🏻只要click入以下專屬連結，便可以馬上登記各科試堂",
    "👉🏻仲可以即時見到可預約的日期時間！",
    "👉🏻完成試堂內三天內登記報讀，仲可享額外HKD100元即時學費減免優惠",
    "",
    opts.url,
    "",
    "如有任何疑問，可回覆此訊息與職員聯絡",
    "",
    "明學教育",
  ].join("\n")
}
