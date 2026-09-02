import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CalendarDays, DoorOpen, Loader2, UserRound } from "lucide-react"

import {
 PreviewError,
 PreviewPropertyRow,
 PreviewSection,
 PreviewStat,
} from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { isHomeworkOccupancySchedule } from "@/lib/homeworkTutoringSchedules"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isUnassignedTeachingTeacherIssue, scheduleTeacherDisplayName } from "@/lib/privateClassKind"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { statusToTagTone } from "@/lib/statusTag"
import { getScheduleById, type ScheduleDetailRecord } from "@/services/scheduleDetailQueries"
import { fetchScheduleManageRowSummaries } from "@/services/scheduleQueries"
import type { ScheduleManageRowSummary } from "@/lib/scheduleManageRowSummary"

type Props = {
 scheduleId: string
}

export function SchedulePreviewPanel({ scheduleId }: Props) {
 const navigate = useNavigate()
 const { profile } = useAuth()
 const canManage = can(profile?.activeCapabilities, "schedule.reschedule")
 const canRollCall = can(profile?.activeCapabilities, "attendance.take")
 const [row, setRow] = useState<ScheduleDetailRecord | null>(null)
 const [summary, setSummary] = useState<ScheduleManageRowSummary | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  setError(false)
  setRow(null)
  setSummary(null)
  void (async () => {
   try {
    const detail = await getScheduleById(scheduleId)
    if (cancelled) return
    setRow(detail)
    if (!detail) {
     setError(true)
     return
    }
    const summaries = await fetchScheduleManageRowSummaries([
     { id: detail.id, consecutive_group_id: detail.consecutive_group_id },
    ])
    if (cancelled) return
    setSummary(summaries.get(detail.id) ?? null)
   } catch (e) {
    reportUserFacingError(e, { source: "SchedulePreviewPanel.load" })
    if (!cancelled) {
     setRow(null)
     setError(true)
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [scheduleId])

 if (loading) {
  return (
   <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
    載入預覽…
   </div>
  )
 }
 if (error || !row) {
  return (
   <div className="px-3 py-3 pr-10">
    <PreviewError message="排程資料未能載入。" />
   </div>
  )
 }

 const occupancy = isHomeworkOccupancySchedule(row)
 const subTag = formatScheduleSubstituteTag(row)

 return (
  <div className="space-y-4 px-3 py-3 pr-10">
   <div>
    <p className="text-xs font-medium text-muted-foreground">排程預覽</p>
    <h2 className="mt-1 text-lg font-semibold">
     {row.class_subject}
     {row.course_code_full ? (
      <span className="ml-1 font-mono text-sm text-muted-foreground">({row.course_code_full})</span>
     ) : null}
    </h2>
    <div className="mt-2 flex flex-wrap gap-1.5">
     <Tag tone={statusToTagTone(row.status)} size="sm">
      {row.status}
     </Tag>
     {occupancy ? (
      <Tag tone={statusToTagTone("佔室")} size="sm">
       佔室
      </Tag>
     ) : null}
     {row.is_extra_lesson ? (
      <Tag tone={statusToTagTone("加堂")} size="sm">
       加堂
      </Tag>
     ) : null}
     {subTag ? (
      <Tag tone={statusToTagTone(subTag)} size="sm">
       {subTag}
      </Tag>
     ) : null}
    </div>
   </div>

   <div className="grid grid-cols-2 gap-2">
    <PreviewStat
     label="日期時間"
     value={`${row.scheduled_date} ${row.start_time ?? "—"}–${row.end_time ?? "—"}`}
    />
    <PreviewStat
     label="點名冊人數"
     value={summary == null ? "載入中" : String(summary.rosterCount)}
    />
   </div>

   <PreviewSection title="課堂資料" icon={CalendarDays}>
    <PreviewPropertyRow icon={UserRound} label="老師">
     {scheduleTeacherDisplayName(row, { warnIfUnassigned: canManage })}
    </PreviewPropertyRow>
    <PreviewPropertyRow icon={DoorOpen} label="課室">
     {`${row.classroom_name ?? "未分配"}${row.classroom_is_online ? "（線上）" : ""}`}
    </PreviewPropertyRow>
    {row.status.includes("取消") && row.cancel_reason ? (
     <PreviewPropertyRow icon={CalendarDays} label="取消原因">
      {row.cancel_reason}
     </PreviewPropertyRow>
    ) : null}
    {summary?.hasTrial || summary?.hasLeave || summary?.hasMakeup ? (
     <p className="text-sm text-muted-foreground">
      {[
       summary.hasTrial ? "有試堂" : null,
       summary.hasLeave ? "有請假" : null,
       summary.hasMakeup ? "有來此補堂" : null,
      ]
       .filter(Boolean)
       .join(" · ")}
     </p>
    ) : null}
    {canManage && isUnassignedTeachingTeacherIssue(row) ? (
     <p className="text-sm text-warning">未指定實際授課老師；老師時間表／點名紙可能看不到此堂。</p>
    ) : null}
   </PreviewSection>

   <div className="flex flex-wrap gap-2">
    <Button type="button" size="sm" asChild>
     <Link to={`/Schedule/${row.id}`}>完整詳情</Link>
    </Button>
    {row.class_id ? (
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to={`/Classes/${row.class_id}`}>班別</Link>
     </Button>
    ) : null}
    {row.teacher_id ? (
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to={`/Teachers/${row.teacher_id}`}>老師</Link>
     </Button>
    ) : null}
    {occupancy ? null : canRollCall ? (
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
       navigate(
        `/Schedule?schedule_id=${encodeURIComponent(row.id)}&rollcall=1&date=${encodeURIComponent(row.scheduled_date)}`
       )
      }
     >
      點名
     </Button>
    ) : null}
    {occupancy ? null : canManage ? (
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to={`/Schedule/${row.id}?tab=overview`}>代堂／取消</Link>
     </Button>
    ) : null}
   </div>
  </div>
 )
}
