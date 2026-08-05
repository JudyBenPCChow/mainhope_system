import { useEffect, useState } from "react"
import { FlaskConical, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { AdminHomeSandbox } from "./AdminHomeSandbox"
import { TeacherHomeSandbox } from "./TeacherHomeSandbox"
import type { SandboxRole } from "./mockData"

const ROLE_OPTIONS: { value: SandboxRole; label: string }[] = [
  { value: "admin", label: "行政" },
  { value: "teacher", label: "老師" },
]

/**
 * 首頁 wayfinding UX 沙盒。
 * 硬編碼假資料；不呼叫 services／Supabase；按鈕唔跳正式路由。
 */
export function HomeWayfindingPrototypeView() {
  const [role, setRole] = useState<SandboxRole>("admin")
  const [previewLabel, setPreviewLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!previewLabel) return
    const t = window.setTimeout(() => setPreviewLabel(null), 3200)
    return () => window.clearTimeout(t)
  }, [previewLabel])

  const onPreviewAction = (label: string) => {
    setPreviewLabel(label)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:max-w-6xl">
      <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-sm sm:px-4">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground">首頁指引 UX 沙盒（行政／老師）</p>
            <p className="text-muted-foreground">
              純畫面參考：唔接真實資料庫、唔跳去正式系統頁。撳任何掣只會顯示底部提示，方便對齊「員工點樣搵功能」。
            </p>
            <ul className="list-inside list-disc text-muted-foreground">
              <li>行政：今日待辦 +「我想做…」情境卡（取代功能目錄式快速入口）</li>
              <li>老師：先點名、再今日課堂；次要入口收斂，減少近似掣</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">切換角色睇兩套首頁草案</p>
        <div
          className="flex rounded-lg border border-border bg-muted/30 p-0.5"
          role="group"
          aria-label="沙盒角色"
        >
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                role === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {role === "admin" ? (
        <AdminHomeSandbox onPreviewAction={onPreviewAction} />
      ) : (
        <TeacherHomeSandbox onPreviewAction={onPreviewAction} />
      )}

      {previewLabel ? (
        <div
          role="status"
          className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-lg rounded-xl border border-border bg-foreground px-4 py-3 text-sm text-background shadow-lg sm:inset-x-auto"
        >
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1">
              <span className="font-medium">沙盒預覽</span>
              <span className="mt-0.5 block text-background/80">
                已模擬撳「{previewLabel}」— 唔會進入正式系統。
              </span>
            </p>
            <button
              type="button"
              aria-label="關閉提示"
              onClick={() => setPreviewLabel(null)}
              className="shrink-0 rounded-md p-1 text-background/70 hover:bg-background/10 hover:text-background"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
