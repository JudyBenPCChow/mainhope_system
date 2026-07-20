/** 輪詢遠端版本的間隔（有更新時盡快發現，不必等滿 6 小時）。 */
export const APP_UPDATE_POLL_MS = 5 * 60 * 1000

/** 同一分頁最長存活；逾時強制重載，避免同事整晚開著舊版。 */
export const APP_MAX_SESSION_MS = 6 * 60 * 60 * 1000

/** 偵測到需更新後，給使用者幾秒收尾再重載。 */
export const APP_RELOAD_COUNTDOWN_MS = 8_000

export type AppUpdateReason = "new_deploy" | "max_session" | "chunk_error"

type VersionPayload = {
  buildId?: unknown
}

export function getClientBuildId(): string {
  return typeof __APP_BUILD_ID__ === "string" && __APP_BUILD_ID__ ? __APP_BUILD_ID__ : "dev"
}

export function isStaleChunkError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes("failed to fetch dynamically imported module") ||
    m.includes("importing a module script failed") ||
    m.includes("error loading dynamically imported module") ||
    m.includes("loading chunk") ||
    m.includes("chunkloaderror")
  )
}

export async function fetchRemoteBuildId(signal?: AbortSignal): Promise<string | null> {
  const url = `/version.json?t=${Date.now()}`
  const res = await fetch(url, { cache: "no-store", signal })
  if (!res.ok) return null
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
    // SPA rewrite 誤回 HTML 時略過，避免誤判
    const text = await res.text()
    if (text.trimStart().startsWith("<")) return null
    try {
      const parsed = JSON.parse(text) as VersionPayload
      return typeof parsed.buildId === "string" ? parsed.buildId : null
    } catch {
      return null
    }
  }
  const data = (await res.json()) as VersionPayload
  return typeof data.buildId === "string" ? data.buildId : null
}

export function hardReloadPage(): void {
  window.location.reload()
}
