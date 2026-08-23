import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  fetchHomeworkTutoringTeacherAccess,
  setTeacherHomeworkTutoringNav,
  type HomeworkTutoringTeacherAccess,
} from "@/services/homeworkTutoringAccessQueries"

export function HomeworkTutoringTeacherAccess() {
  const { pushBanner } = useAppBanner()
  const [rows, setRows] = useState<HomeworkTutoringTeacherAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const employed = useMemo(() => rows.filter((r) => r.employed), [rows])
  const enabledCount = employed.filter((r) => r.enabled).length

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      setRows(await fetchHomeworkTutoringTeacherAccess())
    } catch (e) {
      reportUserFacingError(e, {
        source: "HomeworkTutoringTeacherAccess.load",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const onToggle = async (id: string, next: boolean) => {
    setSavingId(id)
    setErr(null)
    const prev = rows
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, enabled: next } : r)))
    try {
      await setTeacherHomeworkTutoringNav(id, next)
      pushBanner({
        title: next ? "已開入口" : "已關入口",
        tone: "success",
        message: next
          ? "該專科老師登入後，側欄會出現「功課輔導」。"
          : "該專科老師側欄不再顯示「功課輔導」。",
      })
    } catch (e) {
      setRows(prev)
      reportUserFacingError(e, {
        source: "HomeworkTutoringTeacherAccess.onToggle",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">功課輔導側欄入口</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          剔選專科老師。獲選者登入後，系統側欄會出現一級「功課輔導」，打開後有功輔報更、我的當值。未剔選者側欄不顯示。
        </p>
      </div>
      {err ? (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {loading ? "載入中…" : `已剔選 ${enabledCount}／${employed.length} 位在職老師`}
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">載入老師名單…</p>
      ) : employed.length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有在職老師。</p>
      ) : (
        <ul className="space-y-2">
          {employed.map((t) => (
            <li key={t.id}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                <Checkbox
                  checked={t.enabled}
                  disabled={savingId === t.id}
                  onCheckedChange={(next) => void onToggle(t.id, next)}
                  aria-label={`${t.name}可在側欄進入功課輔導`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">專科 · {t.subjectLabel}</p>
                </div>
                <Tag
                  tone={statusToTagTone(t.enabled ? "側欄有功課輔導" : "無入口")}
                  size="sm"
                >
                  {t.enabled ? "側欄有功課輔導" : "無入口"}
                </Tag>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
        重新載入
      </Button>
    </div>
  )
}
