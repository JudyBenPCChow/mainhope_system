/**
 * 廣告公開頁（/AdTrial、/AdInterest）對外聯絡與信任資料。
 * 真源對齊 mainhope_web `src/lib/contact.ts` 與收據 `paymentPrint` COMPANY。
 */
export const AD_PUBLIC_CONTACT = {
  brandZh: "明學教育",
  brandEn: "Main Hope Education",
  companyZh: "明學教育有限公司",
  companyEn: "MAIN HOPE EDUCATION LTD.",
  /** 顯示用，含空格 */
  phoneDisplay: "3705 5140",
  /** tel: 連線用，純數字 */
  phoneTel: "37055140",
  /** wa.me 用；與 openWhatsAppWithPrefilledText 一致（本地號碼，可帶或不帶 852） */
  whatsappDigits: "94849539",
  whatsappDisplay: "9484 9539",
  /** 國際格式（官網 wa.me 用） */
  whatsappDigitsIntl: "85294849539",
  wechat: "mh_edu_HK",
  educationRegNo: "620211",
  addressZh: "粉嶺綠悠軒商場 2 樓 11 號鋪（鄰近聯和墟總站）",
  addressEn: "Shop No.11, 2/F., Belair Monte, 3 Ma Sik Road, Fanling, N.T., HK",
  website: "https://mainhope.edu.hk/",
  hoursHint: "請以 WhatsApp 查詢上課時間",
} as const

export function adPublicTelHref(): string {
  return `tel:${AD_PUBLIC_CONTACT.phoneTel}`
}

export function adPublicWhatsAppPrefill(kind: "interest" | "trial", name?: string): string {
  const who = (name ?? "").trim() || "家長"
  const label = kind === "interest" ? "查詢登記" : "新生試堂登記"
  return `你好，我是${who}，剛在網上提交了${label}，想跟進確認。`
}

export function adPublicWhatsAppBrowsePrefill(): string {
  return "想查詢／報讀試堂"
}
