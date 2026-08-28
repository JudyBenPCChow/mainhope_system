import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Checkbox } from "@/components/ui/checkbox"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  fetchHomeworkTutoringTeacherAccess,
  setTeacherHomeworkTutorOnly,
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
  const tutorOnlyCount = employed.filter((r) => r.tutorOnly).length

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

  const onToggleNav = async (id: string, next: boolean) => {
    setSavingId(id)
    setErr(null)
    const prev = rows
    setRows((cur) =>
      cur.map((r) =>
        r.id === id ? { ...r, enabled: next, tutorOnly: next ? r.tutorOnly : false } : r
      )
    )
    try {
      await setTeacherHomeworkTutoringNav(id, next)
      pushBanner({
        title: next ? "已開入口" : "已關入口",
        tone: "success",
        message: next
          ? "該老師登入後，側欄會出現「功課輔導」。"
          : "該老師側欄不再顯示「功課輔導」。",
      })
    } catch (e) {
      setRows(prev)
      reportUserFacingError(e, {
        source: "HomeworkTutoringTeacherAccess.onToggleNav",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingId(null)
    }
  }

  const onToggleTutorOnly = async (id: string, next: boolean) => {
    setSavingId(id)
    setErr(null)
    const prev = rows
    setRows((cur) =>
      cur.map((r) =>
        r.id === id
          ? { ...r, tutorOnly: next, enabled: next ? true : r.enabled }
          : r
      )
    )
    try {
      await setTeacherHomeworkTutorOnly(id, next)
      pushBanner({
        title: next ? "已設純功輔側欄" : "已恢復專科側欄",
        tone: "success",
        message: next
          ? "該導師側欄只保留功輔報更／我的當值（及首頁、收件匣、設定）。"
          : "該老師恢復一般專科老師側欄（若仍有功輔入口則繼續顯示功課輔導）。",
      })
    } catch (e) {
      setRows(prev)
      reportUserFacingError(e, {
        source: "HomeworkTutoringTeacherAccess.onToggleTutorOnly",
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
          剔選有功輔入口的老師。另可設「純功輔側欄」：隱藏專科點名／班別／排程等，只留功輔報更與我的當值。
        </p>
      </div>
      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {loading
          ? "載入中…"
          : `已剔選入口 ${enabledCount}／${employed.length}；純功輔側欄 ${tutorOnlyCount}`}
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">載入老師名單…</p>
      ) : employed.length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有在職老師。</p>
      ) : (
        <StaggerList as="ul" className="space-y-2">
          {employed.map((t) => (
            <StaggerItem key={t.id} as="li">
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Checkbox
                    checked={t.enabled}
                    disabled={savingId === t.id}
                    onCheckedChange={(next) => void onToggleNav(t.id, next)}
                    aria-label={`${t.name}可在側欄進入功課輔導`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">專科 · {t.subjectLabel}</p>
                    <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={t.tutorOnly}
                        disabled={savingId === t.id || !t.enabled}
                        onCheckedChange={(next) => void onToggleTutorOnly(t.id, next)}
                        aria-label={`${t.name}使用純功輔側欄`}
                      />
                      純功輔側欄（隱藏專科項目）
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  <Tag
                    tone={statusToTagTone(t.enabled ? "側欄有功課輔導" : "無入口")}
                    size="sm"
                  >
                    {t.enabled ? "側欄有功課輔導" : "無入口"}
                  </Tag>
                  {t.tutorOnly ? (
                    <Tag tone={statusToTagTone("純功輔側欄")} size="sm">
                      純功輔側欄
                    </Tag>
                  ) : null}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
        重新載入
      </Button>
    </div>
  )
}
