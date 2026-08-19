import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Loader2, Send, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
 APO_ASSISTANT_NAME,
 APO_MS_FAN_WHATSAPP_URL,
 APO_STARTER_SUGGESTIONS,
 APO_WELCOME_TEXT,
} from "@/lib/apoConfig"
import { useAuth } from "@/lib/authBootstrap"
import { cleanReplyPathNoise, mergePathHints } from "@/lib/apoPaths"
import { EMPTY_APO_CHAT_CONTEXT, loadApoSession, saveApoSession, type ApoChatContext } from "@/lib/apoSession"
import { formatUnknownError } from "@/lib/formatUnknownError"
import type { Role } from "@/lib/navStructure"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 sendApoChatMessage,
 submitApoChatFeedback,
 submitApoChatSatisfaction,
 type ApoChatMessage,
} from "@/services/apoChatQueries"
import { cn } from "@/lib/utils"

const AVATAR_SRC = "/mingxue-it-dog-avatar.png"

function buildWelcomeMessage(): ApoChatMessage {
 return {
  id: "welcome",
  role: "assistant",
  content: APO_WELCOME_TEXT,
  suggestions: [...APO_STARTER_SUGGESTIONS],
 }
}

function newId(): string {
 if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
  return crypto.randomUUID()
 }
 return `itdog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadInitialSession(): { messages: ApoChatMessage[]; context: ApoChatContext } {
 const welcome = [buildWelcomeMessage()]
 const { messages, context } = loadApoSession()
 if (!messages || messages.length === 0) {
  return { messages: welcome, context: EMPTY_APO_CHAT_CONTEXT }
 }
 const hasLegacyPersona = messages.some(
  (m) => m.role === "assistant" && (m.content.includes("雞先生") || m.content.includes("扮工"))
 )
 if (hasLegacyPersona) {
  return { messages: welcome, context: EMPTY_APO_CHAT_CONTEXT }
 }
 return { messages, context }
}

function ItDogAvatar({ className }: { className?: string }) {
 return (
  <img
   src={AVATAR_SRC}
   alt=""
   className={cn("object-cover object-center", className)}
   draggable={false}
  />
 )
}

type ApoAssistantProps = {
 role: Role
}

const floatingAnchorClass = "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6"

export function ApoAssistant({ role }: ApoAssistantProps) {
 const navigate = useNavigate()
 const { profile } = useAuth()
 const teacherId = getTeacherScopeTeacherId(profile)
 const [open, setOpen] = useState(false)
 const [draft, setDraft] = useState("")
 const [sending, setSending] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const initial = loadInitialSession()
 const [messages, setMessages] = useState<ApoChatMessage[]>(() => initial.messages)
 const [chatContext, setChatContext] = useState<ApoChatContext>(() => initial.context)
 const listRef = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLTextAreaElement>(null)

 useEffect(() => {
  saveApoSession(messages, chatContext)
 }, [messages, chatContext])

 useEffect(() => {
  if (!open) return
  const el = listRef.current
  if (el) el.scrollTop = el.scrollHeight
 }, [messages, open, sending])

 useEffect(() => {
  if (!open) return
  const t = window.setTimeout(() => inputRef.current?.focus(), 120)
  return () => window.clearTimeout(t)
 }, [open])

 const submit = useCallback(
  async (text: string) => {
   const trimmed = text.trim()
   if (!trimmed || sending) return

   const userMsg: ApoChatMessage = { id: newId(), role: "user", content: trimmed }
   const nextMessages = [...messages, userMsg]
   setMessages(nextMessages)
   setDraft("")
   setError(null)
   setSending(true)

   try {
    const history = nextMessages
     .filter((m) => m.id !== "welcome")
     .map((m) => ({ role: m.role, content: m.content }))

    const result = await sendApoChatMessage({
     messages: history,
     userRole: role,
     teacherId,
     chatContext,
    })

    if (!result.ok) {
     setError(result.message)
     return
    }

    if (result.context && Object.keys(result.context).length > 0) {
     setChatContext((prev) => ({ ...prev, ...result.context }))
    }

    setMessages((prev) => [
     ...prev,
     {
      id: newId(),
      role: "assistant",
      content: result.reply,
      suggestions: result.suggestions,
      paths: result.paths,
      feedback: null,
      satisfaction: null,
     },
    ])
   } catch (e) {
    setError(formatUnknownError(e))
   } finally {
    setSending(false)
   }
  },
  [messages, role, sending, chatContext, teacherId]
 )

 const goToPage = useCallback(
  (path: string) => {
   navigate(path)
   setOpen(false)
  },
  [navigate]
 )

 const setSatisfaction = useCallback(
  (assistantId: string, satisfied: boolean) => {
   const idx = messages.findIndex((m) => m.id === assistantId)
   if (idx < 0 || messages[idx]?.role !== "assistant") return
   if (messages[idx]?.satisfaction) return

   let userMessage = ""
   for (let i = idx - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
     userMessage = messages[i]!.content
     break
    }
   }

   setMessages((prev) =>
    prev.map((m) =>
     m.id === assistantId ? { ...m, satisfaction: satisfied ? "solved" : "unsolved" } : m
    )
   )

   void submitApoChatSatisfaction({
    satisfied,
    userRole: role,
    userMessage,
    assistantMessage: messages[idx]!.content,
   })
  },
  [messages, role]
 )

 const setFeedback = useCallback(
  (assistantId: string, helpful: boolean) => {
   const idx = messages.findIndex((m) => m.id === assistantId)
   if (idx < 0 || messages[idx]?.role !== "assistant") return
   if (messages[idx]?.feedback) return

   let userMessage = ""
   for (let i = idx - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") {
     userMessage = messages[i]!.content
     break
    }
   }

   setMessages((prev) =>
    prev.map((m) => (m.id === assistantId ? { ...m, feedback: helpful ? "up" : "down" } : m))
   )

   void submitApoChatFeedback({
    helpful,
    userRole: role,
    userMessage,
    assistantMessage: messages[idx]!.content,
   })
  },
  [messages, role]
 )

 const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.id !== "welcome")
 const showStarterSuggestions =
  messages.length === 1 && messages[0]?.id === "welcome" && !sending

 return (
  <>
   {!open ? (
    <Button
     type="button"
     onClick={() => setOpen(true)}
     className={cn(
      "fixed z-[90] h-14 gap-2.5 rounded-full border border-black/10 bg-neutral-950 px-2.5 shadow-lg md:px-3 md:pr-5",
      floatingAnchorClass,
      "text-white hover:bg-neutral-900"
     )}
     aria-label={`開啟${APO_ASSISTANT_NAME}`}
    >
     <ItDogAvatar className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/20" />
     <span className="hidden font-medium md:inline">{APO_ASSISTANT_NAME}</span>
    </Button>
   ) : null}

   {open ? (
    <div
     className={cn(
      "fixed z-[90] flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
      floatingAnchorClass
     )}
     role="dialog"
     aria-label={`${APO_ASSISTANT_NAME}對話`}
    >
     <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-neutral-950 px-4 py-3 text-white">
      <div className="flex min-w-0 items-center gap-2.5">
       <ItDogAvatar className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/15" />
       <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{APO_ASSISTANT_NAME}</div>
        <div className="truncate text-xs text-white/75">系統教學與操作指引</div>
       </div>
      </div>
      <Button
       type="button"
       variant="ghost"
       size="icon"
       className="h-8 w-8 shrink-0 text-white hover:bg-white/15 hover:text-white"
       onClick={() => setOpen(false)}
       aria-label={`關閉${APO_ASSISTANT_NAME}`}
      >
       <X className="h-4 w-4" />
      </Button>
     </header>

     <div
      ref={listRef}
      className="flex max-h-[min(52vh,28rem)] min-h-[12rem] flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4"
     >
      {messages.map((m) => {
       const isUser = m.role === "user"
       const isAssistant = m.role === "assistant"
       const displayContent = isAssistant ? cleanReplyPathNoise(m.content) : m.content
       const displayPaths = isAssistant ? mergePathHints(m.paths, m.content) : []
       return (
        <div key={m.id} className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
         <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
          {!isUser ? <ItDogAvatar className="mt-0.5 h-7 w-7 shrink-0 rounded-full" /> : null}
          <div className="flex max-w-[88%] flex-col gap-1.5">
           <div
            className={cn(
             "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
             isUser
              ? "rounded-br-md bg-[#2A4E8A] text-white"
              : "rounded-bl-md bg-muted text-foreground"
            )}
           >
            {displayContent}
           </div>

           {isAssistant && displayPaths.length > 0 ? (
            <div className="flex flex-col gap-1.5 pl-0.5">
             {displayPaths.map((p) => (
              <Button
               key={`${m.id}-${p.path}`}
               type="button"
               variant="outline"
               size="sm"
               className="h-auto justify-between gap-2 px-2.5 py-1.5 text-left text-xs font-normal"
               onClick={() => goToPage(p.path)}
              >
               <span className="min-w-0 truncate">
                前往{p.label}
                <span className="ml-1 font-mono text-[10px] text-muted-foreground">{p.path}</span>
               </span>
               <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </Button>
             ))}
            </div>
           ) : null}

           {isAssistant && m.id !== "welcome" ? (
            <div className="flex flex-col gap-1.5 pl-0.5">
             {m.satisfaction ? (
              <p className="text-[10px] text-muted-foreground">
               {m.satisfaction === "solved"
                ? "多謝回饋，祝你使用愉快。"
                : "已記錄你的不滿意，技術團隊會跟進；你亦可到「報錯與問題」查看。"}
              </p>
             ) : (
              <div className="flex flex-col gap-1">
               <span className="text-[10px] text-muted-foreground">可否解決你的問題？</span>
               <div className="flex flex-wrap gap-1.5">
                <button
                 type="button"
                 className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-foreground transition-colors hover:bg-muted"
                 onClick={() => setSatisfaction(m.id, true)}
                >
                 已解決
                </button>
                <button
                 type="button"
                 className="rounded-full border border-destructive/40 bg-destructive/5 px-2.5 py-0.5 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
                 onClick={() => setSatisfaction(m.id, false)}
                >
                 不滿意
                </button>
               </div>
              </div>
             )}

             <div className="flex items-center gap-1">
              <button
               type="button"
               className={cn(
                "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                m.feedback === "up" && "bg-success/15 text-success"
               )}
               aria-label="有用"
               disabled={Boolean(m.feedback)}
               onClick={() => setFeedback(m.id, true)}
              >
               <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
               type="button"
               className={cn(
                "rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                m.feedback === "down" && "bg-destructive/15 text-destructive"
               )}
               aria-label="冇用"
               disabled={Boolean(m.feedback)}
               onClick={() => setFeedback(m.id, false)}
              >
               <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              {m.feedback === "down" ? (
               <span className="ml-1 text-[10px] text-muted-foreground">
                {APO_MS_FAN_WHATSAPP_URL ? (
                 <a
                  href={APO_MS_FAN_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                 >
                  WhatsApp 聯絡技術支援
                 </a>
                ) : (
                 "可透過 WhatsApp 聯絡技術支援"
                )}
               </span>
              ) : null}
             </div>
            </div>
           ) : null}
          </div>
         </div>
        </div>
       )
      })}

      {sending ? (
       <div className="flex justify-start gap-2">
        <ItDogAvatar className="mt-0.5 h-7 w-7 shrink-0 rounded-full" />
        <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
         <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
         處理中…
        </div>
       </div>
      ) : null}
     </div>

     {showStarterSuggestions ? (
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-muted/30 px-3 py-2.5">
       {APO_STARTER_SUGGESTIONS.map((q) => (
        <button
         key={q}
         type="button"
         className="rounded-full border border-border bg-background px-3 py-1 text-left text-xs text-foreground transition-colors hover:bg-muted"
         onClick={() => void submit(q)}
        >
         {q}
        </button>
       ))}
      </div>
     ) : null}

     {!showStarterSuggestions && lastAssistant?.suggestions && lastAssistant.suggestions.length > 0 && !sending ? (
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-muted/30 px-3 py-2.5">
       {lastAssistant.suggestions.map((q) => (
        <button
         key={q}
         type="button"
         className="rounded-full border border-border bg-background px-3 py-1 text-left text-xs text-foreground transition-colors hover:bg-muted"
         onClick={() => void submit(q)}
        >
         {q}
        </button>
       ))}
      </div>
     ) : null}

     {error ? (
      <div
       role="alert"
       className="shrink-0 border-t border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      >
       {error}
      </div>
     ) : null}

     <form
      className="flex shrink-0 items-end gap-2 border-t border-border p-3"
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
       placeholder={`向${APO_ASSISTANT_NAME}提問…`}
       rows={2}
       disabled={sending}
       className="min-h-[2.75rem] resize-none py-2"
       aria-label="輸入問題"
      />
      <Button
       type="submit"
       size="icon"
       disabled={sending || !draft.trim()}
       className="h-10 w-10 shrink-0 bg-neutral-950 hover:bg-neutral-800"
       aria-label="傳送"
      >
       {sending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
       ) : (
        <Send className="h-4 w-4" aria-hidden />
       )}
      </Button>
     </form>
    </div>
   ) : null}
  </>
 )
}
