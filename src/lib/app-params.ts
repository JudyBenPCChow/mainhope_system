/**
 * 遷移期對齊 Base44：之後可刪除 Base44 專用鍵，改只用 `VITE_SUPABASE_*`。
 */
const LS_PREFIX = "base44_"

function readLs(key: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(`${LS_PREFIX}${key}`)
}

export type AppParams = {
  appId: string
  token: string | null
  fromUrl: string
  functionsVersion: string
  appBaseUrl: string
}

export function getAppParams(): AppParams {
  const appId =
    readLs("app_id") ?? import.meta.env.VITE_BASE44_APP_ID ?? ""
  const token = readLs("access_token")
  const fromUrl =
    typeof window !== "undefined" ? window.location.href : ""
  const functionsVersion =
    readLs("functions_version") ??
    import.meta.env.VITE_BASE44_FUNCTIONS_VERSION ??
    ""
  const appBaseUrl =
    readLs("app_base_url") ?? import.meta.env.VITE_BASE44_APP_BASE_URL ?? ""

  return { appId, token, fromUrl, functionsVersion, appBaseUrl }
}
