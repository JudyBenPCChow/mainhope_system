import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Copy, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  createScriptLibraryEntry,
  deleteScriptLibraryEntry,
  fetchScriptLibraryEntries,
  normalizeScriptTags,
  updateScriptLibraryEntry,
  type ScriptLibraryEntry,
} from "@/services/scriptLibraryQueries"

type FormState = {
  question: string
  answer: string
  tags: string[]
}

const emptyForm = (): FormState => ({ question: "", answer: "", tags: [] })

export function ScriptLibraryView() {
  const { role } = useAuth()
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()

  const [rows, setRows] = useState<ScriptLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [keyword, setKeyword] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ScriptLibraryEntry | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      setRows(await fetchScriptLibraryEntries())
    } catch (e) {
      reportUserFacingError(e, { source: "ScriptLibraryView.load", setErr })
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) for (const t of r.tags) set.add(t)
    return [...set].sort((a, b) => a.localeCompare(b, "zh-Hant"))
  }, [rows])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return rows.filter((r) => {
      if (selectedTags.length > 0 && !selectedTags.every((t) => r.tags.includes(t))) return false
      if (!q) return true
      const hay = `${r.question} ${r.answer} ${r.tags.join(" ")}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, keyword, selectedTags])

  const toggleFilterTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setTagInput("")
    setFormErr(null)
    setDialogOpen(true)
  }

  const openEdit = (row: ScriptLibraryEntry) => {
    setEditing(row)
    setForm({ question: row.question, answer: row.answer, tags: [...row.tags] })
    setTagInput("")
    setFormErr(null)
    setDialogOpen(true)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    setForm((f) => ({ ...f, tags: normalizeScriptTags([...f.tags, t]) }))
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
  }

  const onSave = async () => {
    setSaving(true)
    setFormErr(null)
    try {
      if (editing) {
        await updateScriptLibraryEntry(editing.id, form)
        pushBanner({ tone: "success", title: "已更新話術" })
      } else {
        await createScriptLibraryEntry(form)
        pushBanner({ tone: "success", title: "已新增話術" })
      }
      setDialogOpen(false)
      await load()
    } catch (e) {
      reportUserFacingError(e, {
        source: "ScriptLibraryView.onSave",
        setErr: setFormErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (row: ScriptLibraryEntry) => {
    const ok = await confirmDialog({
      title: "刪除話術",
      description: `確定刪除「${row.question}」？此操作無法復原。`,
      confirmText: "確認刪除",
      tone: "destructive",
    })
    if (!ok) return
    try {
      await deleteScriptLibraryEntry(row.id)
      pushBanner({ tone: "info", title: "已刪除話術" })
      await load()
    } catch (e) {
      reportUserFacingError(e, { source: "ScriptLibraryView.onDelete", setErr })
    }
  }

  const onCopy = async (row: ScriptLibraryEntry) => {
    try {
      await navigator.clipboard.writeText(row.answer)
      setCopiedId(row.id)
      pushBanner({ tone: "success", title: "已複製回答" })
      window.setTimeout(() => setCopiedId((id) => (id === row.id ? null : id)), 2000)
    } catch (e) {
      reportUserFacingError(e, {
        source: "ScriptLibraryView.onCopy",
        setErr,
        userMessage: "無法複製到剪貼簿，請手動選取文字。",
      })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {role === "admin" ? (
        <AdminPageHeader
          eyebrow="行政工作"
          title="話術庫"
          description="儲存常見問答話術，一鍵複製後貼至通訊工具回覆家長。"
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                重新載入
              </Button>
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden />
                新增話術
              </Button>
            </>
          }
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">話術庫</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground md:block">
              儲存常見客戶問題與建議回答，一鍵複製後可貼到其他通訊工具回覆客人。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              重新載入
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              新增話術
            </Button>
          </div>
        </div>
      )}

      {err ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {err}
        </p>
      ) : null}

      {!isSupabaseConfigured ? (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          尚未設定 Supabase，無法載入話術庫。
        </p>
      ) : null}

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜尋問題或回答…"
          aria-label="搜尋話術"
        />
        {allTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">標籤篩選：</span>
            {allTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFilterTag(tag)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted/80"
                  )}
                >
                  {tag}
                </button>
              )
            })}
            {selectedTags.length > 0 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setSelectedTags([])}
              >
                清除標籤
              </button>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          顯示 {filtered.length} / {rows.length} 筆
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "尚未有話術，請按「新增話術」開始建立。" : "沒有符合篩選條件的話術。"}
        </div>
      ) : (
        <StaggerList as="ul" className="space-y-3">
          {filtered.map((row) => (
            <StaggerItem
              key={row.id}
              as="li"
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="text-base font-semibold leading-snug">{row.question}</h2>
                  {row.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.tags.map((tag) => (
                        <Tag key={tag} tone="default" size="sm">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {row.answer}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void onCopy(row)}>
                    {copiedId === row.id ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copiedId === row.id ? "已複製" : "複製回答"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    編輯
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => void onDelete(row)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    刪除
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "編輯話術" : "新增話術"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formErr ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formErr}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <label htmlFor="script-question" className="text-sm font-medium">
                問題
              </label>
              <Input
                id="script-question"
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="客人常問的問題"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="script-answer" className="text-sm font-medium">
                回答
              </label>
              <Textarea
                id="script-answer"
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="建議回覆內容（可一鍵複製）"
                rows={6}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">標籤</span>
              <div className="flex flex-wrap gap-2">
                <Input
                  className="h-9 max-w-[200px] text-sm"
                  value={tagInput}
                  disabled={saving}
                  placeholder="輸入標籤後加入"
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving || !tagInput.trim()}
                  onClick={addTag}
                >
                  加入標籤
                </Button>
              </div>
              {form.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1">
                      <Tag tone="default" size="sm">
                        {tag}
                      </Tag>
                      {!saving ? (
                        <button
                          type="button"
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`移除標籤 ${tag}`}
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">尚未加入標籤</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDialogOpen(false)}
            >
              取消
            </Button>
            <Button type="button" disabled={saving} onClick={() => void onSave()}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
