import type { ReactNode } from "react"
import { CalendarDays, ChevronDown, ChevronUp, DoorOpen, User, Users } from "lucide-react"

import { ScheduleAlertIcons } from "@/components/schedule/ScheduleAlertIcons"
import { Button } from "@/components/ui/button"
import { SkeletonInlineBadge } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { isHomeworkOccupancySchedule } from "@/lib/homeworkTutoringSchedules"
import { isUnassignedTeachingTeacherIssue, scheduleTeacherDisplayName } from "@/lib/privateClassKind"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"

type Props = {
 groups: [string, ScheduleManageRow[]][]
 todayYmd: string
 displayStart: string
 alerts: Map<string, ScheduleAlerts>
 expandedScheduleId: string | null
 onToggleExpand: (id: string) => void
 onOpenRecord: (id: string) => void
 rosterLoading: boolean
 updating: boolean
 canManageSchedules: boolean
 teacherScopeId: string | null
 rollCallEligibleIds: Set<string> | null
 highlightScheduleId: string | null
 loading: boolean
 renderActions: (schedule: ScheduleManageRow, open: boolean) => ReactNode
 renderExpanded: (schedule: ScheduleManageRow) => ReactNode
}

export function ScheduleByDateList({
 groups,
 todayYmd,
 displayStart,
 alerts,
 expandedScheduleId,
 onToggleExpand,
 onOpenRecord,
 rosterLoading,
 updating,
 canManageSchedules,
 teacherScopeId,
 rollCallEligibleIds,
 highlightScheduleId,
 loading,
 renderActions,
 renderExpanded,
}: Props) {
 return (
  <div className="space-y-6">
   {updating ? (
    <p className="text-sm text-muted-foreground" role="status">
     正在更新
    </p>
   ) : null}
   {groups.map(([dateYmd, list]) => {
    const isToday = dateYmd === todayYmd
    const isRangeStart = dateYmd === displayStart
    const isHighlightDay = isToday || isRangeStart
    return (
     <section
      key={dateYmd}
      className={cn(
       "space-y-3 rounded-xl p-3 shadow-sm",
       isHighlightDay ? "border-2 border-amber-400 bg-amber-50/50" : "border border-border bg-card"
      )}
     >
      <div
       className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
        isHighlightDay ? "border-amber-300/90 bg-amber-100/60" : "border-border bg-muted/30"
       )}
      >
       <CalendarDays
        className={cn("h-4 w-4 shrink-0", isHighlightDay ? "text-amber-800" : "text-muted-foreground")}
        aria-hidden
       />
       <span className="text-lg font-semibold tabular-nums text-foreground md:text-xl">{dateYmd}</span>
       {isToday ? (
        <Tag tone="warning" size="sm">
         今天
        </Tag>
       ) : isRangeStart ? (
        <Tag tone="warning" size="sm">
         起始日
        </Tag>
       ) : null}
       <span className="text-base text-muted-foreground">{list.length} 堂</span>
      </div>
      <StaggerList as="ul" className="space-y-2" animate={!loading}>
       {list.map((s) => {
        const a = alerts.get(s.id) ?? { trial: false, makeup: false, leave: false, record: false }
        const open = expandedScheduleId === s.id
        const occupancy = isHomeworkOccupancySchedule(s)
        const enrollKnown = s.enrollCount != null
        const hasAttendees =
         (s.enrollCount != null && s.enrollCount > 0) ||
         a.makeup ||
         a.trial ||
         (rollCallEligibleIds?.has(s.id) ?? false)
        const emptyEnrollOnly =
         !occupancy && enrollKnown && s.enrollCount === 0 && !a.makeup && !a.trial && !rosterLoading
        return (
         <StaggerItem
          key={s.id}
          as="li"
          data-schedule-anchor={s.id}
          className={cn(
           "overflow-hidden rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md",
           enrollKnown && !hasAttendees && !occupancy ? "border-border/80 bg-muted/70" : "bg-card",
           highlightScheduleId === s.id && "ring-2 ring-info"
          )}
         >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
           <button
            type="button"
            className="min-w-0 flex-1 rounded-lg text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50"
            aria-expanded={open}
            onClick={() => onToggleExpand(s.id)}
           >
            <div className="flex flex-wrap items-center gap-2">
             <span className="text-lg font-semibold text-foreground md:text-xl">
              {s.classLabel}
              {s.course_code_full ? (
               <span className="font-mono text-sm text-muted-foreground"> ({s.course_code_full})</span>
              ) : null}
             </span>
             <Tag tone={statusToTagTone(s.status)} size="sm">
              {s.status}
             </Tag>
             {occupancy ? (
              <Tag tone={statusToTagTone("佔室")} size="sm">
               佔室
              </Tag>
             ) : null}
             {emptyEnrollOnly ? (
              <Tag tone={statusToTagTone("暫未有學生報讀")} size="sm">
               暫未有學生報讀
              </Tag>
             ) : null}
             {enrollKnown && s.enrollCount === 0 && (a.makeup || a.trial) ? (
              <Tag tone={statusToTagTone(a.makeup ? "補堂" : "試堂")} size="sm">
               {a.makeup && a.trial ? "補堂／試堂" : a.makeup ? "有補堂生" : "有試堂生"}
              </Tag>
             ) : null}
             {s.is_extra_lesson ? (
              <Tag tone={statusToTagTone("加堂")} size="sm">
               加堂
              </Tag>
             ) : null}
             {(() => {
              const subTag = formatScheduleSubstituteTag(s, teacherScopeId)
              return subTag ? (
               <Tag tone={statusToTagTone(subTag)} size="sm">
                {subTag}
               </Tag>
              ) : null
             })()}
             {rosterLoading ? (
              <SkeletonInlineBadge className="h-5 w-16" aria-label="標記載入中" />
             ) : (
              <ScheduleAlertIcons alerts={a} />
             )}
            </div>
            {s.status.includes("取消") && s.cancel_reason ? (
             <p className="mt-1 text-sm text-muted-foreground">取消原因：{s.cancel_reason}</p>
            ) : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
             <span className="tabular-nums">
              {s.start_time ?? "—"}–{s.end_time ?? "—"}
             </span>
             <span
              className={cn(
               "inline-flex items-center gap-1",
               canManageSchedules && isUnassignedTeachingTeacherIssue(s) && "font-medium text-warning"
              )}
             >
              <User className="h-4 w-4 shrink-0" aria-hidden />
              {scheduleTeacherDisplayName(s, { warnIfUnassigned: canManageSchedules })}
             </span>
             <span className="inline-flex items-center gap-1">
              <DoorOpen className="h-4 w-4 shrink-0" aria-hidden />
              位置：{s.classroom_name?.trim() ? s.classroom_name : "未定"}
             </span>
             {occupancy ? null : (
              <span
               className={cn(
                "inline-flex items-center gap-1",
                enrollKnown && !hasAttendees ? "text-muted-foreground" : "text-info"
               )}
              >
               <Users className="h-4 w-4 opacity-70" aria-hidden />
               {rosterLoading || s.enrollCount == null ? (
                <SkeletonInlineBadge className="h-4 w-14" aria-label="點名冊人數載入中" />
               ) : (
                `${s.enrollCount} 人`
               )}
              </span>
             )}
            </div>
           </button>
           <div
            className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
           >
            {renderActions(s, open)}
            <Button
             type="button"
             variant="outline"
             size="default"
             className="h-11 text-base"
             onClick={() => onOpenRecord(s.id)}
            >
             排程詳情
            </Button>
            <Button
             type="button"
             variant="ghost"
             size="icon"
             className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-muted"
             aria-expanded={open}
             aria-label={open ? "收合名單" : "展開名單"}
             onClick={() => onToggleExpand(s.id)}
            >
             {open ? <ChevronUp className="h-5 w-5" aria-hidden /> : <ChevronDown className="h-5 w-5" aria-hidden />}
            </Button>
           </div>
          </div>
          {open ? (
           <div className="border-t border-border bg-success/25 px-4 py-4 md:px-5">{renderExpanded(s)}</div>
          ) : null}
         </StaggerItem>
        )
       })}
      </StaggerList>
     </section>
    )
   })}
   {groups.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有排程</p>
   ) : null}
  </div>
 )
}
