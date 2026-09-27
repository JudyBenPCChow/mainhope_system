import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Textarea } from "@/components/ui/textarea"
import {
  ADMIN_OPS_NAME,
  ADMIN_OPS_PATH,
  ADMIN_OPS_STARTER_SUGGESTIONS,
  ADMIN_OPS_WELCOME_TEXT,
} from "@/lib/adminOpsAssistant/config"
import {
  adminOpsConfirmLabel,
  adminOpsConfirmTitle,
  isActionablePendingMessage,
} from "@/lib/adminOpsAssistant/confirm"
import { EMPTY_ADMIN_OPS_CONTEXT, type AdminOpsChoice, type AdminOpsPendingExecute } from "@/lib/adminOpsAssistant/types"
import { loadAdminOpsSession, saveAdminOpsSession } from "@/lib/adminOpsAssistant/session"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { cn } from "@/lib/utils"
import { appendMgmtAuditLog } from "@/services/mgmtGodViewQueries"
import {
  sendAdminOpsChatMessage,
  type AdminOpsMessage,
} from "@/services/adminOpsAssistantQueries"
import { invalidateClassesListDataCache } from "@/components/classes/classesListState"
import { enrichPendingPreview, executeAdminOpsPending } from "@/services/adminOpsWriteQueries"

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `ops-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildWelcomeMessage(): AdminOpsMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: ADMIN_OPS_WELCOME_TEXT,
    suggestions: [...ADMIN_OPS_STARTER_SUGGESTIONS],
    choices: [],
    pendingExecute: null,
  }
}

function loadInitial(): {
  messages: AdminOpsMessage[]
  opsContext: typeof EMPTY_ADMIN_OPS_CONTEXT
} {
  const welcome = [buildWelcomeMessage()]
  const { messages, opsContext } = loadAdminOpsSession()
  if (!messages?.length) return { messages: welcome, opsContext: EMPTY_ADMIN_OPS_CONTEXT }
  return { messages, opsContext }
}

function userDisplayText(m: AdminOpsMessage): string {
  if (m.displayContent?.trim()) return m.displayContent.trim()
  if (m.content.startsWith("__admin_ops_choice__")) return "（已選擇）"
  return m.content
}

export function AdminOpsChatView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const initial = loadInitial()
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminOpsMessage[]>(() => initial.messages)
  const [opsContext, setOpsContext] = useState(() => initial.opsContext)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    saveAdminOpsSession(messages, opsContext)
  }, [messages, opsContext])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending])

  const appendAssistant = useCallback((msg: Omit<AdminOpsMessage, "id" | "role">) => {
    setMessages((prev) => [
      ...prev,
      {
        id: newId(),
        role: "assistant",
        ...msg,
      },
    ])
  }, [])

  const submit = useCallback(
    async (text: string, displayContent?: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending || executing) return

      const userMsg: AdminOpsMessage = {
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

        const result = await sendAdminOpsChatMessage({
          messages: history,
          opsContext,
        })

        if (!result.ok) {
          setError(result.message)
          return
        }

        setOpsContext(result.opsContext)
        let pending = result.pendingExecute
        if (pending) {
          try {
            pending = await enrichPendingPreview(pending)
          } catch (e) {
            appendAssistant({
              content: `${result.reply}\n\n${formatUnknownError(e)}`,
              suggestions: result.suggestions,
              choices: [],
              pendingExecute: null,
            })
            return
          }
        }
        appendAssistant({
          content: result.reply,
          suggestions: result.suggestions,
          choices: result.choices,
          pendingExecute: pending,
        })
      } catch (e) {
        setError(formatUnknownError(e))
      } finally {
        setSending(false)
      }
    },
    [messages, opsContext, sending, executing, appendAssistant]
  )

  const onChoice = useCallback(
    (choice: AdminOpsChoice) => {
      void submit(choice.payload, choice.label)
    },
    [submit]
  )

  const confirmPending = useCallback(
    async (pending: AdminOpsPendingExecute) => {
      const lines = pending.previewLines.join("\n")
      const destructive =
        pending.workflow === "delete_empty_class" ||
        (pending.workflow === "replace_empty_slot" && pending.step === "delete")
      const ok = await confirmDialog({
        title: adminOpsConfirmTitle(pending),
        description: lines,
        confirmText: adminOpsConfirmLabel(pending),
        tone: destructive ? "destructive" : "warning",
        confirmInput: destructive
          ? { label: "請輸入「硬刪」以確認", expected: "硬刪" }
          : undefined,
      })
      if (!ok) return

      setExecuting(true)
      setError(null)
      try {
        const outcome = await executeAdminOpsPending(pending)
        invalidateClassesListDataCache()
        await appendMgmtAuditLog({
          action: `admin_ops.chat.${pending.workflow}`,
          path: ADMIN_OPS_PATH,
          detail: JSON.stringify({ workflow: pending.workflow }).slice(0, 2000),
        })
        const notice = outcome.noticeDraft
          ? `\n\n同事公告草稿：\n${outcome.noticeDraft}`
          : ""
        if (outcome.nextPending) {
          let next = outcome.nextPending
          try {
            next = await enrichPendingPreview(next)
          } catch (e) {
            setOpsContext({ ...EMPTY_ADMIN_OPS_CONTEXT })
            appendAssistant({
              content: `${outcome.message}${notice}\n\n${formatUnknownError(e)}`,
              suggestions: ["取消沒有學生的班", "開新班並排堂"],
              choices: [],
              pendingExecute: null,
            })
            pushBanner({ tone: "success", title: "已寫入" })
            return
          }
          appendAssistant({
            content: `${outcome.message}${notice}`,
            suggestions: ["取消"],
            choices: [],
            pendingExecute: next,
          })
        } else {
          setOpsContext({ ...EMPTY_ADMIN_OPS_CONTEXT })
          appendAssistant({
            content: `${outcome.message}${notice}\n\n可以繼續處理下一項班務。`,
            suggestions: [...ADMIN_OPS_STARTER_SUGGESTIONS],
            choices: [],
            pendingExecute: null,
          })
        }
        pushBanner({ tone: "success", title: "已寫入" })
      } catch (e) {
        reportUserFacingError(e, { source: "AdminOpsChatView.confirmPending", setErr: setError })
      } finally {
        setExecuting(false)
      }
    },
    [appendAssistant, confirmDialog, pushBanner]
  )

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "welcome")
  const showStarters = messages.length === 1 && messages[0]?.id === "welcome" && !sending

  return (
    <div className="mx-auto flex h-[min(78vh,52rem)] max-w-3xl flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold">{ADMIN_OPS_NAME}</h1>
          <p className="text-xs text-muted-foreground">行政班務 · 預覽後確認才寫入</p>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <StaggerList as="div" className="flex min-h-0 flex-1 flex-col gap-3" staggerMs={60}>
          {messages.map((m) => {
            const isUser = m.role === "user"
            const display = isUser ? userDisplayText(m) : m.content
            return (
              <StaggerItem key={m.id} as="div" className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    isUser ? "rounded-br-md bg-[#2A4E8A] text-white" : "rounded-bl-md bg-muted text-foreground"
                  )}
                >
                  {display}
                </div>

                {!isUser &&
                isActionablePendingMessage({
                  messageId: m.id,
                  hasPending: Boolean(m.pendingExecute),
                  latestAssistantId: lastAssistant?.id,
                }) &&
                m.pendingExecute ? (
                  <div className="w-full max-w-[92%] rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
                    <p className="mb-2 font-medium text-warning">待你確認</p>
                    <ul className="mb-3 space-y-0.5 text-muted-foreground">
                      {m.pendingExecute.previewLines.map((line, i) => (
                        <li key={`${i}-${line}`}>• {line}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={executing || sending}
                        onClick={() => void confirmPending(m.pendingExecute!)}
                      >
                        {executing ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                        )}
                        {adminOpsConfirmLabel(m.pendingExecute)}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={executing || sending}
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
              </StaggerItem>
            )
          })}
        </StaggerList>

        {sending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在整理預覽…
          </div>
        ) : null}
      </div>

      {showStarters ? (
        <div className="flex shrink-0 flex-wrap gap-2 border-t bg-muted/30 px-4 py-2.5">
          {ADMIN_OPS_STARTER_SUGGESTIONS.map((q) => (
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
          placeholder="說明要改的班碼、逢星期或時段…"
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
        查學生與教學路徑請用右下角{" "}
        <Link to="/AllFeatures" className="text-primary underline-offset-2 hover:underline">
          明學IT狗
        </Link>
        ；本頁確認後才寫入。
      </p>
    </div>
  )
}
