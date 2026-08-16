import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  APO_PO_NAME,
  APO_PO_STARTER_SUGGESTIONS,
  APO_PO_WELCOME_TEXT,
} from "@/lib/apoPoConfig"
import { poSlotsToInsertPayload } from "@/lib/apoPo/slots"
import { EMPTY_PO_CONTEXT, type PoChoice, type PoPendingExecute } from "@/lib/apoPo/types"
import { loadApoPoSession, saveApoPoSession } from "@/lib/apoPoSession"
import { classDisplayName } from "@/lib/courseLabel"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatUnknownError } from "@/lib/formatUnknownError"
import type { PoChatContext } from "@/lib/apoPo/types"
import { appendMgmtAuditLog } from "@/services/mgmtGodViewQueries"
import { insertClass, type ClassRecord } from "@/services/classQueries"
import { sendApoPoChatMessage, type ApoPoMessage } from "@/services/apoPoQueries"
import { cn } from "@/lib/utils"

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `apo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildWelcomeMessage(): ApoPoMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: APO_PO_WELCOME_TEXT,
    suggestions: [...APO_PO_STARTER_SUGGESTIONS],
    choices: [],
    pendingExecute: null,
  }
}

function loadInitial(): { messages: ApoPoMessage[]; poContext: PoChatContext } {
  const welcome = [buildWelcomeMessage()]
  const { messages, poContext } = loadApoPoSession()
  if (!messages?.length) return { messages: welcome, poContext: EMPTY_PO_CONTEXT }
  return { messages, poContext }
}

function userDisplayText(m: ApoPoMessage): string {
  if (m.displayContent?.trim()) return m.displayContent.trim()
  if (m.content.startsWith("__apo_choice__")) return "（已選擇）"
  return m.content
}

export function ApoPoChatView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const initial = loadInitial()
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ApoPoMessage[]>(() => initial.messages)
  const [poContext, setPoContext] = useState<PoChatContext>(() => initial.poContext)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveApoPoSession(messages, poContext)
  }, [messages, poContext])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const appendAssistant = useCallback((result: Extract<Awaited<ReturnType<typeof sendApoPoChatMessage>>, { ok: true }>) => {
    setPoContext(result.poContext)
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        content: result.reply,
        suggestions: result.suggestions,
        choices: result.choices,
        pendingExecute: result.pendingExecute,
      },
    ])
  }, [])

  const submit = useCallback(
    async (text: string, displayContent?: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending || executing) return

      const userMsg: ApoPoMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        displayContent: displayContent?.trim() || undefined,
      }
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      setDraft("")
      setError(null)
      setSending(true)

      try {
        const history = nextMessages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }))

        const result = await sendApoPoChatMessage({
          messages: history,
          poContext,
        })

        if (!result.ok) {
          setError(result.message)
          return
        }

        appendAssistant(result)
      } catch (e) {
        setError(formatUnknownError(e))
      } finally {
        setSending(false)
      }
    },
    [messages, poContext, sending, executing, appendAssistant]
  )

  const onChoice = useCallback(
    (choice: PoChoice) => {
      void submit(choice.payload, choice.label)
    },
    [submit]
  )

  const confirmCreate = useCallback(
    async (pending: PoPendingExecute) => {
      const lines = pending.previewLines.join("\n")
      const ok = await confirmDialog({
        title: "確認建立班別？",
        description: lines,
        confirmText: "確認建立",
        tone: "warning",
      })
      if (!ok) return

      setExecuting(true)
      setError(null)
      try {
        const row: ClassRecord = await insertClass(poSlotsToInsertPayload(pending.slots))
        await appendMgmtAuditLog({
          action: "apo_po.chat.create_class",
          path: "/Apo",
          detail: JSON.stringify({
            class_id: row.id,
            course_code_full: row.course_code_full,
          }).slice(0, 2000),
        })

        const name = classDisplayName({
          subject: row.subject,
          courseName: row.course_name,
        })

        setPoContext({ ...EMPTY_PO_CONTEXT })
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content:
              `班別已建立：${name}` +
              (row.course_code_full ? `（${row.course_code_full}）` : "") +
              "\n\n你可以到班別詳情安排排程，或者繼續開另一個班。",
            suggestions: ["幫我開新班", "系統診斷"],
            choices: [],
            pendingExecute: null,
          },
        ])
        pushBanner({ tone: "success", title: "班別已建立" })
      } catch (e) {
        reportUserFacingError(e, { source: "ApoPoChatView.confirmCreate", setErr: setError })
      } finally {
        setExecuting(false)
      }
    },
    [confirmDialog, pushBanner]
  )

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "welcome")
  const showStarters = messages.length === 1 && messages[0]?.id === "welcome" && !sending

  return (
    <div className="mx-auto flex h-[min(78vh,52rem)] max-w-3xl flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold">{APO_PO_NAME}</h1>
          <p className="text-xs text-muted-foreground">對話式工作流 · 確認後才寫入</p>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {messages.map((m) => {
          const isUser = m.role === "user"
          const display = isUser ? userDisplayText(m) : m.content
          return (
            <div key={m.id} className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-br-md bg-[#2A4E8A] text-white"
                    : "rounded-bl-md bg-muted text-foreground"
                )}
              >
                {display}
              </div>

              {!isUser && m.pendingExecute?.workflow === "create_class" ? (
                <div className="w-full max-w-[92%] rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                  <p className="mb-2 font-medium">待你確認</p>
                  <ul className="mb-3 space-y-0.5 text-muted-foreground">
                    {m.pendingExecute.previewLines.map((line) => (
                      <li key={line}>• {line}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={executing}
                      onClick={() => void confirmCreate(m.pendingExecute!)}
                    >
                      {executing ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                      )}
                      確認建立
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={executing}
                      onClick={() => void submit("取消")}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : null}

              {!isUser && m.choices && m.choices.length > 0 && !m.pendingExecute ? (
                <div className="flex max-w-[92%] flex-wrap gap-1.5">
                  {m.choices.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={sending || executing}
                      className="rounded-full border border-primary/30 bg-background px-3 py-1 text-left text-xs text-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
                      onClick={() => onChoice(c)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}

        {sending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            阿Po 諗緊…
          </div>
        ) : null}
      </div>

      {showStarters ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-t bg-muted/30 px-4 py-2.5">
          {APO_PO_STARTER_SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1 text-xs transition-colors hover:bg-muted"
              onClick={() => void submit(q)}
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {!showStarters && lastAssistant?.suggestions && lastAssistant.suggestions.length > 0 && !sending ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-t bg-muted/30 px-4 py-2.5">
          {lastAssistant.suggestions.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-full border border-border bg-background px-3 py-1 text-xs transition-colors hover:bg-muted"
              onClick={() => void submit(q)}
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <form
        className="flex shrink-0 items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          void submit(draft)
        }}
      >
        <Textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void submit(draft)
            }
          }}
          placeholder="同阿Po講你想做咩…"
          rows={2}
          disabled={sending || executing}
          className="min-h-[2.75rem] resize-none py-2"
          aria-label="輸入訊息"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || executing || !draft.trim()}
          className="h-10 w-10 shrink-0"
          aria-label="傳送"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <p className="shrink-0 border-t px-4 py-2 text-center text-[10px] text-muted-foreground">
        日常查詢請用{" "}
        <Link to="/AllFeatures" className="text-primary underline-offset-2 hover:underline">
          明學IT狗
        </Link>
        （右下角浮動按鈕）
      </p>
    </div>
  )
}
