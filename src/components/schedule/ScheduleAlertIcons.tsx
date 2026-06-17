import {
 Bell,
 GraduationCap,
 RefreshCw,
 Video,
 XCircle,
} from "lucide-react"

import type { ScheduleAlerts } from "@/services/scheduleQueries"

function alertSummary(a: ScheduleAlerts): string {
 const p: string[] = []
 if (a.trial) p.push("試堂")
 if (a.makeup) p.push("補堂")
 if (a.record) p.push("需錄影")
 if (a.leave) p.push("病／事假")
 return p.join("、")
}

function hasAnyAlert(a: ScheduleAlerts): boolean {
 return a.trial || a.makeup || a.record || a.leave
}

const ALERT_TIP_BELL =
 "排程提醒：本堂有需要留意的事項。將滑鼠移到右側小圖示可查看類別。"
const ALERT_TIP_TRIAL = "試堂：已有試堂紀錄連結至此排程。"
const ALERT_TIP_MAKEUP = "補堂／請假相關：有請假或補堂紀錄與本堂相關（含待補課）。"
const ALERT_TIP_RECORD = "錄影：排程備註含「錄影」「錄像」「錄音」等需錄製相關字樣。"
const ALERT_TIP_LEAVE =
 "請假：有學生請假與本堂相關（已連結此排程，或同班且請假日為上課日）。"

export function ScheduleAlertIcons({ alerts }: { alerts: ScheduleAlerts }) {
 if (!hasAnyAlert(alerts)) return null
 return (
  <span
   className="inline-flex items-center gap-1 text-amber-600"
   role="group"
   aria-label={`排程提醒：${alertSummary(alerts)}`}
  >
   <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_BELL}>
    <Bell className="h-4 w-4 shrink-0 drop-shadow-sm" aria-hidden />
   </span>
   {alerts.trial ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_TRIAL}>
     <GraduationCap className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.makeup ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_MAKEUP}>
     <RefreshCw className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.record ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_RECORD}>
     <Video className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.leave ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_LEAVE}>
     <XCircle className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
  </span>
 )
}
