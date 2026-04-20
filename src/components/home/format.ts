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

/** 本機日曆的今日 `YYYY-MM-DD`（與排程 `scheduled_date` 對齊） */
export function todayYmdLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** `YYYY-MM-DD` 加減天數（本機時區） */
export function addDaysToYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!y || !m || !d) return ymd
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + deltaDays)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const dd = String(dt.getDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

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
