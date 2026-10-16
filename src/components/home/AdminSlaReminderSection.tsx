import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { homeActionsKeepOpenState } from "@/lib/homeActionsRail"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 ADMIN_SLA_REMINDER_KIND_LABEL,
 ADMIN_SLA_REMINDER_KIND_TONE,
 ADMIN_SLA_REMINDER_KINDS,
 formatAdminSlaReminderFailure,
} from "@/lib/adminSlaReminders"
import {
 fetchAdminSlaReminders,
 type AdminSlaReminderList,
} from "@/services/adminSlaReminderQueries"
import { cn } from "@/lib/utils"

const rowClass =
 "flex min-w-0 items-start justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm leading-5 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

/** 先露出約六筆；展開後仍在這區內捲，不把下面的捷徑推出畫面。 */
const VISIBLE_REMINDERS = 6

const emptyList = (): AdminSlaReminderList => ({
 items: [],
 failedKinds: [...ADMIN_SLA_REMINDER_KINDS],
})

/** 行政常用工作：已釘選下方的一筆一筆提醒。 */
export function AdminSlaReminderSection() {
 const [list, setList] = useState<AdminSlaReminderList | null>(null)
 const [loading, setLoading] = useState(true)
 const [expanded, setExpanded] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void fetchAdminSlaReminders()
   .then((next) => {
    if (cancelled) return
    setList(next)
    const failure = formatAdminSlaReminderFailure(next.failedKinds)
    if (failure) {
     reportUserFacingError(new Error(failure), {
      source: "AdminSlaReminderSection.load",
      userMessage: failure,
     })
    }
   })
   .catch((error: unknown) => {
    if (cancelled) return
    setList(emptyList())
    reportUserFacingError(error, {
     source: "AdminSlaReminderSection.load",
     userMessage: "提醒未能載入。",
    })
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [])

 const failureText = list ? formatAdminSlaReminderFailure(list.failedKinds) : null
 const items = list?.items ?? []
 const hiddenCount = Math.max(0, items.length - VISIBLE_REMINDERS)
 const shown = expanded ? items : items.slice(0, VISIBLE_REMINDERS)

 return (
  <section aria-label="提醒" className="mt-4">
   <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">提醒</h3>
   <p className="mt-1 text-sm text-muted-foreground">要跟進的請假、補回與試堂收款。</p>
   {loading ? <p className="mt-2 text-sm text-muted-foreground">載入提醒…</p> : null}
   {!loading && failureText ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
     {failureText}
    </p>
   ) : null}
   {!loading && items.length === 0 && !failureText ? (
    <p className="mt-2 text-sm text-muted-foreground">目前沒有要跟進的提醒。</p>
   ) : null}
   {!loading && shown.length > 0 ? (
    <ul
     className={cn(
      "mt-2 flex max-h-[26rem] flex-col gap-2 overflow-y-auto overscroll-y-contain"
     )}
    >
     {shown.map((item) => (
      <li key={item.id}>
       <Link
        to={item.href}
        state={homeActionsKeepOpenState()}
        className={cn(rowClass)}
       >
        <span className="flex min-w-0 items-start gap-2">
         <Tag tone={ADMIN_SLA_REMINDER_KIND_TONE[item.kind]} size="sm" className="mt-0.5 shrink-0">
          {ADMIN_SLA_REMINDER_KIND_LABEL[item.kind]}
         </Tag>
         <span className="min-w-0 text-foreground">{item.text}</span>
        </span>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
       </Link>
      </li>
     ))}
    </ul>
   ) : null}
   {!loading && hiddenCount > 0 && !expanded ? (
    <button
     type="button"
     className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
     onClick={() => setExpanded(true)}
    >
     還有 {hiddenCount} 筆，展開
    </button>
   ) : null}
   {!loading && expanded && items.length > VISIBLE_REMINDERS ? (
    <button
     type="button"
     className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
     onClick={() => setExpanded(false)}
    >
     收合
    </button>
   ) : null}
  </section>
 )
}
