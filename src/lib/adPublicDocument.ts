/** 管理系統分頁名稱。與 `index.html` 預設 `<title>` 相同。 */
export const ADMIN_DOCUMENT_TITLE = "明學教育 — 管理系統"

/** 廣告網域沒有對應公開頁時的分頁名稱。 */
export const AD_PUBLIC_DOCUMENT_TITLE = "明學教育"

const AD_PUBLIC_HOST = "ad.mainhope.edu.hk"

/**
 * 公開頁路徑 → 分頁名稱。
 * `index.html`／`ad.html` 開頭的同步 script 須保持同一對照，避免首屏先閃出管理系統名稱。
 */
const AD_PUBLIC_PATH_TITLES: Record<string, string> = {
  "/AdTrial": "新生試堂登記 — 明學教育",
  "/AdTrial/thanks": "已收到試堂登記 — 明學教育",
  "/AdInterest": "查詢登記 — 明學教育",
  "/AdInterest/thanks": "已收到查詢 — 明學教育",
  "/AdHomework": "功課輔導班查詢 — 明學教育",
  "/Privacy": "私隱政策 — 明學教育",
}

export function isAdPublicHost(hostname: string): boolean {
  return hostname.trim().toLowerCase().split(":")[0] === AD_PUBLIC_HOST
}

export function adPublicPathDocumentTitle(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  if (path.startsWith("/AdHomework/") || path === "/AdHomework") {
    return AD_PUBLIC_PATH_TITLES["/AdHomework"]
  }
  return AD_PUBLIC_PATH_TITLES[path] ?? null
}

/** 廣告公開頁用對外名稱；廣告網域其餘路徑也不再用管理系統名稱。 */
export function documentTitleForLocation(pathname: string, hostname: string): string {
  return (
    adPublicPathDocumentTitle(pathname) ??
    (isAdPublicHost(hostname) ? AD_PUBLIC_DOCUMENT_TITLE : ADMIN_DOCUMENT_TITLE)
  )
}
