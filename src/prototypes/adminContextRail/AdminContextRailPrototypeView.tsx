import { useEffect, useState } from "react"
import { FlaskConical, X } from "lucide-react"

import { ClassesSandboxPage } from "./ClassesSandboxPage"
import { SandboxShell } from "./SandboxShell"
import { StudentsSandboxPage } from "./StudentsSandboxPage"
import { type SandboxPageId, type SandboxStudent } from "./mockData"

/**
 * 管理員桌面三欄 UX 沙盒。
 * 硬編碼假資料；不呼叫 services／Supabase；側欄／快捷不跳轉正式路由。
 */
export function AdminContextRailPrototypeView() {
  const [page, setPage] = useState<SandboxPageId>("students")
  const [railCollapsed, setRailCollapsed] = useState(true)
  const [pinned, setPinned] = useState<SandboxStudent | null>(null)
  const [previewLabel, setPreviewLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!previewLabel) return
    const t = window.setTimeout(() => setPreviewLabel(null), 3200)
    return () => window.clearTimeout(t)
  }, [previewLabel])

  const pin = (student: SandboxStudent) => {
    setPinned(student)
    setRailCollapsed(false)
  }

  return (
    <div className="flex h-svh min-h-0 flex-col bg-background text-foreground">
      <div className="shrink-0 border-b border-warning/35 bg-warning/10 px-4 py-2.5 text-sm">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">管理員三欄右欄沙盒（不接真實資料／正式頁）</p>
            <p className="text-muted-foreground">
              試：學生列表按「固定」→ 左欄切「班別管理」→ 右欄學生仍在。摺疊符號跟 Cursor：撳先開關，鼠標去主欄唔會自動關。
            </p>
          </div>
        </div>
      </div>

      <SandboxShell
        page={page}
        onPageChange={setPage}
        pinnedStudent={pinned}
        railCollapsed={railCollapsed}
        onToggleRail={() => setRailCollapsed((v) => !v)}
        onUnpin={() => setPinned(null)}
        onPreview={(label) => setPreviewLabel(`沙盒：不會進入正式頁（${label}）`)}
      >
        {page === "students" ? (
          <StudentsSandboxPage pinnedId={pinned?.id ?? null} onPin={pin} />
        ) : (
          <ClassesSandboxPage pinnedStudent={pinned} />
        )}
      </SandboxShell>

      {previewLabel ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex justify-center px-4">
          <div
            role="status"
            className="pointer-events-auto flex max-w-lg items-start gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-lg"
          >
            <p className="min-w-0 flex-1">{previewLabel}</p>
            <button
              type="button"
              className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setPreviewLabel(null)}
              aria-label="關閉提示"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
