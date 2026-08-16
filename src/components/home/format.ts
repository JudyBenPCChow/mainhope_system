/** 儀表板金額顯示（港式 $ 千分位） */
export function formatMoney(n: number): string {
 const v = Math.round(n)
 return `$${v.toLocaleString("zh-Hant-TW")}`
}

/** `YYYY-MM-DD` → 顯示用 */
export function formatDateZh(ymd: string): string {
 if (!ymd || ymd.length < 10) return ymd
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return ymd
 try {
  return new Date(y, m - 1, d).toLocaleDateString("zh-Hant", {
   year: "numeric",
   month: "long",
   day: "numeric",
  })
 } catch {
  return ymd
 }
}

export function dashboardTitleDate(): string {
 return new Date().toLocaleDateString("zh-Hant", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
 })
}

export { addDaysYmd as addDaysToYmd, todayYmdLocal } from "@/lib/weekdayUtils"

/** 首頁課堂排程列：日期 + 週幾 */
export function formatScheduleBoardHeading(ymd: string): string {
 if (!ymd || ymd.length < 10) return ymd
 const [y, m, d] = ymd.split("-").map(Number)
 if (!y || !m || !d) return ymd
 try {
  return new Date(y, m - 1, d).toLocaleDateString("zh-Hant", {
   weekday: "short",
   year: "numeric",
   month: "long",
   day: "numeric",
  })
 } catch {
  return ymd
 }
}
