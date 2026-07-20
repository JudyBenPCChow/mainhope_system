import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
 Check,
 Clock,
 MapPin,
 MessageCircle,
 RefreshCw,
 UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 buildStudentDayReminderMessage,
 formatLessonReminderTimeLine,
 openWhatsAppWithPrefilledText,
} from "@/lib/whatsappReminder"
import type { AggregatedStudentDayLesson } from "@/lib/studentDayReminders"
import {
 defaultReminderDateYmd,
 fetchStudentDayReminderRows,
 markStudentDayReminded,
 unmarkStudentDayReminded,
 type StudentDayReminderRow,
} from "@/services/lessonReminderQueries"
import { localYmd } from "@/services/teacherQueries"

type FilterId = "all" | "pending" | "done" | "noPhone"

function weekdayZh(ymd: string): string {
 const d = new Date(`${ymd}T12:00:00`)
 const map = ["日", "一", "二", "三", "四", "五", "六"]
 return Number.isNaN(d.getTime()) ? "" : `星期${map[d.getDay()]}`
}

function formatShortYmd(ymd: string): string {
 const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
 if (!m) return ymd
 return `${Number(m[2])}/${Number(m[3])}`
}

function initials(name: string): string {
 const cleaned = name.replaceAll("試堂", "").replaceAll("·", "").replaceAll("・", "").trim()
 return cleaned.slice(0, 1) || "?"
}

function avatarTone(row: StudentDayReminderRow, done: boolean): string {
 if (!row.canMessage) return "bg-destructive/15 text-destructive ring-destructive/30"
 if (done) return "bg-success/15 text-success ring-success/30"
 return "bg-warning/15 text-warning ring-warning/30"
}

function railTone(row: StudentDayReminderRow, done: boolean): string {
 if (!row.canMessage) return "bg-destructive"
 if (done) return "bg-success"
 return "bg-warning"
}

function lessonChipClass(kind: AggregatedStudentDayLesson["kind"]): string {
 if (kind === "makeup") return "border-warning/50 bg-warning/10"
 if (kind === "trial") return "border-warning/40 bg-warning/5"
 return "border-info/40 bg-info/5"
}

export function TomorrowRemindersPage() {
 const { pushBanner } = useAppBanner()
 const today = localYmd()
 const [reminderDate, setReminderDate] = useState(() => defaultReminderDateYmd(today))
 const [filter, setFilter] = useState<FilterId>("pending")
 const [rows, setRows] = useState<StudentDayReminderRow[]>([])
 const [loading, setLoading] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [busyId, setBusyId] = useState<string | null>(null)
 const [previewId, setPreviewId] = useState<string | null>(null)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const data = await fetchStudentDayReminderRows(reminderDate)
   setRows(data)
  } catch (e) {
   reportUserFacingError(e, {
    source: "TomorrowRemindersPage.load",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setLoading(false)
  }
 }, [reminderDate])

 useEffect(() => {
  void load()
 }, [load])

 const stats = useMemo(() => {
  const total = rows.length
  const noPhone = rows.filter((r) => !r.canMessage).length
  const done = rows.filter((r) => r.remindedAt != null).length
  const pending = rows.filter((r) => r.canMessage && r.remindedAt == null).length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)
  return { total, noPhone, done, pending, progress }
 }, [rows])

 const visible = useMemo(() => {
  return rows.filter((r) => {
   const done = r.remindedAt != null
   if (filter === "pending") return r.canMessage && !done
   if (filter === "done") return done
   if (filter === "noPhone") return !r.canMessage
   return true
  })
 }, [rows, filter])

 const patchRow = (studentId: string, patch: Partial<StudentDayReminderRow>) => {
  setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, ...patch } : r)))
 }

 const sendReminder = async (studentId: string) => {
  const row = rows.find((r) => r.studentId === studentId)
  if (!row?.contactPhone) {
   pushBanner({
    tone: "warning",
    title: "無法開啟 WhatsApp",
    message: "此學生缺聯絡電話。",
   })
   return
  }
  const message = buildStudentDayReminderMessage({
   studentName: row.fullName,
   dateYmd: reminderDate,
   lessons: row.lessons,
  })
  const opened = openWhatsAppWithPrefilledText(row.contactPhone, message)
  if (!opened) {
   pushBanner({
    tone: "warning",
    title: "無法組出 WhatsApp 連結",
    message: "請檢查電話格式。",
   })
   return
  }
  setBusyId(studentId)
  try {
   await markStudentDayReminded({
    studentId,
    reminderDate,
    channel: "whatsapp",
    detail: `${row.lessonCount} 堂`,
   })
   const refreshed = await fetchStudentDayReminderRows(reminderDate)
   setRows(refreshed)
   pushBanner({
    tone: "success",
    title: "已開啟 WhatsApp",
    message: `已將「${row.fullName}」標記為已提醒。請在 WhatsApp 內確認後發送。`,
   })
  } catch (e) {
   reportUserFacingError(e, {
    source: "TomorrowRemindersPage.sendReminder",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setBusyId(null)
  }
 }

 const markManual = async (studentId: string) => {
  const row = rows.find((r) => r.studentId === studentId)
  if (!row) return
  setBusyId(studentId)
  try {
   await markStudentDayReminded({
    studentId,
    reminderDate,
    channel: "manual",
    detail: `${row.lessonCount} 堂`,
   })
   const refreshed = await fetchStudentDayReminderRows(reminderDate)
   setRows(refreshed)
   pushBanner({
    tone: "info",
    title: "已手動標記",
    message: `「${row.fullName}」標為已提醒。`,
   })
  } catch (e) {
   reportUserFacingError(e, {
    source: "TomorrowRemindersPage.markManual",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setBusyId(null)
  }
 }

 const unmark = async (studentId: string) => {
  const row = rows.find((r) => r.studentId === studentId)
  if (!row) return
  setBusyId(studentId)
  try {
   await unmarkStudentDayReminded({ studentId, reminderDate })
   patchRow(studentId, { remindedAt: null, remindedBy: null })
   pushBanner({
    tone: "info",
    title: "已取消標記",
    message: `「${row.fullName}」改回未提醒。`,
   })
  } catch (e) {
   reportUserFacingError(e, {
    source: "TomorrowRemindersPage.unmark",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setBusyId(null)
  }
 }

 const filterTabs: { id: FilterId; label: string; count: number; tone?: string }[] = [
  { id: "pending", label: "未提醒", count: stats.pending, tone: "text-warning" },
  { id: "done", label: "已提醒", count: stats.done, tone: "text-success" },
  { id: "noPhone", label: "缺電話", count: stats.noPhone, tone: "text-destructive" },
  { id: "all", label: "全部", count: stats.total },
 ]

 return (
  <div className="min-h-[70vh] bg-brand-bg">
   <div className="mx-auto max-w-4xl space-y-5 p-4 pb-16 md:p-6">
    {!isSupabaseConfigured ? (
     <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">
      尚未設定 Supabase，無法載入提醒名單。
     </div>
    ) : null}

    {err ? (
     <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
      {err}
     </div>
    ) : null}

    <header className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
     <div className="bg-brand-primary px-5 py-5 text-white md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
       <div>
        <p className="text-sm text-white/75">前台 · 上課提醒</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">明日課堂提醒</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">
         <Clock className="h-4 w-4 shrink-0" aria-hidden />
         <span>
          提醒日 {formatShortYmd(reminderDate)}（{weekdayZh(reminderDate)}）
         </span>
         <span className="text-white/50" aria-hidden>
          ·
         </span>
         <span>今日 {formatShortYmd(today)}</span>
        </p>
       </div>
       <div className="min-w-[140px] text-right">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">
         {stats.done}
         <span className="text-lg font-normal text-white/70"> / {stats.total}</span>
        </p>
        <p className="text-xs text-white/70">已提醒進度</p>
       </div>
      </div>
      <div
       className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"
       role="progressbar"
       aria-valuenow={stats.progress}
       aria-valuemin={0}
       aria-valuemax={100}
       aria-label="已提醒百分比"
      >
       <div
        className="h-full rounded-full bg-white transition-[width] duration-500 ease-out"
        style={{ width: `${stats.progress}%` }}
       />
      </div>
     </div>

     <div className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 md:px-5">
      <label className="space-y-1 text-sm">
       <span className="text-xs text-muted-foreground">上課日</span>
       <Input
        type="date"
        value={reminderDate}
        onChange={(e) => setReminderDate(e.target.value)}
        className="w-[160px]"
       />
      </label>
      <Button
       type="button"
       size="sm"
       variant="outline"
       onClick={() => setReminderDate(defaultReminderDateYmd(today))}
      >
       翌日
      </Button>
      <Button
       type="button"
       size="sm"
       variant="ghost"
       disabled={loading}
       onClick={() => void load()}
      >
       <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
       重新整理
      </Button>
     </div>

     <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-5">
      {filterTabs.map((tab) => {
       const active = filter === tab.id
       return (
        <button
         key={tab.id}
         type="button"
         onClick={() => setFilter(tab.id)}
         className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
          active
           ? "border-brand-primary bg-brand-primary text-white"
           : "border-border bg-background text-foreground hover:bg-neutral-100"
         )}
        >
         <span>{tab.label}</span>
         <span
          className={cn(
           "tabular-nums text-xs",
           active ? "text-white/85" : tab.tone ?? "text-muted-foreground"
          )}
         >
          {tab.count}
         </span>
        </button>
       )
      })}
     </div>
    </header>

    <p className="text-sm text-muted-foreground">
     以學生為單位：一人一則訊息，涵蓋當日所有堂（連堂合併；含補堂／調堂、試堂）。該堂已請假者不列入。
    </p>

    {loading && rows.length === 0 ? (
     <p className="py-12 text-center text-sm text-muted-foreground">載入中…</p>
    ) : (
     <ul className="space-y-4" aria-label="需提醒學生">
      {visible.length === 0 ? (
       <li className="rounded-2xl border border-dashed border-border bg-background px-4 py-12 text-center text-sm text-muted-foreground">
        {filter === "pending"
         ? "未提醒已清空，可切換「全部」或「已提醒」。"
         : "此篩選下沒有學生。"}
       </li>
      ) : (
       visible.map((row) => {
        const done = row.remindedAt != null
        const showPreview = previewId === row.studentId
        const message = buildStudentDayReminderMessage({
         studentName: row.fullName,
         dateYmd: reminderDate,
         lessons: row.lessons,
        })
        const profileTo = `/Students/${row.studentId}`
        const busy = busyId === row.studentId

        return (
         <li
          key={row.studentId}
          className={cn(
           "relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md",
           done && "border-success/35"
          )}
         >
          <div className={cn("absolute inset-y-0 left-0 w-1.5", railTone(row, done))} aria-hidden />

          <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-stretch sm:gap-5 md:p-5 md:pl-6">
           <div className="flex min-w-0 flex-1 gap-3">
            <div
             className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ring-1",
              avatarTone(row, done)
             )}
             aria-hidden
            >
             {initials(row.fullName)}
            </div>

            <div className="min-w-0 flex-1 space-y-3">
             <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
               <Link
                to={profileTo}
                className="truncate text-lg font-semibold text-foreground underline-offset-4 hover:text-info hover:underline"
                title="開啟學生檔案"
               >
                {row.fullName}
               </Link>
               {row.studentCode ? (
                <span className="text-xs tabular-nums text-muted-foreground">{row.studentCode}</span>
               ) : null}
               {done ? (
                <Tag tone="success" size="sm">
                 已提醒
                </Tag>
               ) : row.canMessage ? (
                <Tag tone={statusToTagTone("pending")} size="sm">
                 未提醒
                </Tag>
               ) : (
                <Tag tone="error" size="sm">
                 缺電話
                </Tag>
               )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
               <Link
                to={profileTo}
                className="inline-flex items-center gap-1 text-info underline-offset-2 hover:underline"
               >
                <UserRound className="h-3.5 w-3.5" aria-hidden />
                學生檔案
               </Link>
               {row.contactPhone ? (
                <span className="tabular-nums">電話 {row.contactPhone}</span>
               ) : (
                <span className="text-destructive">未有 WhatsApp／電話</span>
               )}
               <span aria-hidden>·</span>
               <span>共 {row.lessonCount} 堂</span>
               {done && row.remindedBy ? (
                <>
                 <span aria-hidden>·</span>
                 <span>由 {row.remindedBy}</span>
                </>
               ) : null}
              </div>
             </div>

             <div className="flex gap-2 overflow-x-auto pb-1">
              {row.lessons.map((lesson, i) => {
               const time = formatLessonReminderTimeLine(
                lesson.startTime,
                lesson.endTime,
                lesson.isConsecutive
               )
               return (
                <div
                 key={lesson.key}
                 className={cn(
                  "relative min-w-[148px] max-w-[200px] shrink-0 rounded-xl border p-3",
                  lessonChipClass(lesson.kind)
                 )}
                >
                 {i < row.lessons.length - 1 ? (
                  <span
                   className="absolute -right-2 top-1/2 z-10 hidden h-px w-2 -translate-y-1/2 bg-neutral-300 sm:block"
                   aria-hidden
                  />
                 ) : null}
                 <p className="text-xs font-medium tabular-nums text-foreground">{time ?? "—"}</p>
                 <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {lesson.courseCode || lesson.subject}
                 </p>
                 <p className="truncate text-xs text-muted-foreground">{lesson.courseName}</p>
                 <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {lesson.classroomName ?? "課室未定"}
                 </p>
                 <div className="mt-2 flex flex-wrap gap-1">
                  {lesson.isConsecutive ? (
                   <Tag tone="info" size="sm">
                    連堂
                   </Tag>
                  ) : null}
                  {lesson.kind === "makeup" ? (
                   <Tag tone={statusToTagTone("補堂")} size="sm">
                    補堂
                   </Tag>
                  ) : null}
                  {lesson.kind === "trial" ? (
                   <Tag tone={statusToTagTone("試堂")} size="sm">
                    試堂
                   </Tag>
                  ) : null}
                 </div>
                 {lesson.makeupNote ? (
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-warning">
                   {lesson.makeupNote}
                  </p>
                 ) : null}
                </div>
               )
              })}
             </div>

             {showPreview ? (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 text-xs leading-relaxed text-foreground">
               {message}
              </pre>
             ) : null}
            </div>
           </div>

           <div className="flex shrink-0 flex-row gap-2 sm:w-[148px] sm:flex-col sm:justify-center">
            <Button
             type="button"
             size="sm"
             variant="success"
             className="flex-1 sm:flex-none"
             disabled={!row.canMessage || busy}
             title={row.canMessage ? "開啟 WhatsApp（已預填合併提醒）" : "缺聯絡電話"}
             onClick={() => void sendReminder(row.studentId)}
            >
             <MessageCircle className="h-4 w-4" aria-hidden />
             WhatsApp
            </Button>
            <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
             <Link to={profileTo}>
              <UserRound className="h-4 w-4" aria-hidden />
              檔案
             </Link>
            </Button>
            {done ? (
             <Button
              type="button"
              size="sm"
              variant="ghost"
              className="flex-1 text-xs text-muted-foreground sm:flex-none"
              disabled={busy}
              onClick={() => void unmark(row.studentId)}
             >
              取消標記
             </Button>
            ) : row.canMessage ? (
             <Button
              type="button"
              size="sm"
              variant="ghost"
              className="flex-1 text-xs text-muted-foreground sm:flex-none"
              disabled={busy}
              onClick={() => void markManual(row.studentId)}
             >
              <Check className="h-3.5 w-3.5" aria-hidden />
              已提醒
             </Button>
            ) : null}
            <Button
             type="button"
             size="sm"
             variant="ghost"
             className="flex-1 text-xs sm:flex-none"
             onClick={() => setPreviewId(showPreview ? null : row.studentId)}
            >
             {showPreview ? "收起文案" : "預覽文案"}
            </Button>
           </div>
          </div>
         </li>
        )
       })
      )}
     </ul>
    )}
   </div>
  </div>
 )
}
