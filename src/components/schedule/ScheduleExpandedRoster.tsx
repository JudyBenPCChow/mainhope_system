import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { Tag } from "@/components/ui/tag"
import type { TagTone } from "@/components/ui/tag"
import { resolveLessonReminderTimes } from "@/lib/consecutiveLesson"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

export type ExpandedRosterStudent = {
 studentId: string
 fullName: string
 contactPhone: string | null
}

type Props = {
 schedule: ScheduleManageRow
 schedulePeers?: ScheduleManageRow[]
 loading: boolean
 enrolled: ExpandedRosterStudent[]
 leave: ExpandedRosterStudent[]
 trial: ExpandedRosterStudent[]
 makeup: ExpandedRosterStudent[]
 notEnrolled: ExpandedRosterStudent[]
 classMeta?: ReactNode
 footer?: ReactNode
}

export function ExpandedScheduleRoster({
 schedule,
 schedulePeers,
 loading,
 enrolled,
 leave,
 trial,
 makeup,
 notEnrolled,
 classMeta,
 footer,
}: Props) {
 const reminderTimes = resolveLessonReminderTimes(schedule, schedulePeers)
 const sections: {
  key: string
  label: string
  students: ExpandedRosterStudent[]
  tone: TagTone
  headerClass: string
  linkClass: string
  buttonBorderClass: string
  isTrial: boolean
  attendanceStatus: string | null
  alwaysShow: boolean
  nameSuffix?: string
 }[] = [
  {
   key: "enrolled",
   label: "班內學生",
   students: enrolled,
   tone: "success",
   headerClass: "text-success",
   linkClass: "text-success",
   buttonBorderClass: "border-success/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: true,
  },
  {
   key: "notEnrolled",
   label: "沒有報讀此堂（單堂生）",
   students: notEnrolled,
   tone: statusToTagTone("沒有報讀此堂"),
   headerClass: "text-info",
   linkClass: "text-info",
   buttonBorderClass: "border-info/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: false,
   nameSuffix: "沒有報讀此堂",
  },
  {
   key: "leave",
   label: "請假學生",
   students: leave,
   tone: "error",
   headerClass: "text-destructive",
   linkClass: "text-destructive",
   buttonBorderClass: "border-destructive/60",
   isTrial: false,
   attendanceStatus: "請假",
   alwaysShow: false,
  },
  {
   key: "trial",
   label: "試堂學生",
   students: trial,
   tone: statusToTagTone("試堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: false,
  },
  {
   key: "makeup",
   label: "來此補堂",
   students: makeup,
   tone: statusToTagTone("補堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: false,
   attendanceStatus: "現場",
   alwaysShow: false,
  },
 ]

 return (
  <>
   {classMeta}
   {loading ? (
    <p className="mt-3 text-sm text-muted-foreground">載入名單…</p>
   ) : (
    sections.map((section, index) => {
     if (!section.alwaysShow && section.students.length === 0) return null
     return (
      <div key={section.key} className={index === 0 && !classMeta ? undefined : "mt-3"}>
       <p className={cn("mb-2 text-sm font-medium", section.headerClass)}>
        {section.label}（{section.students.length}）
       </p>
       {section.students.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無就讀學生。</p>
       ) : (
        <div className="flex flex-wrap gap-2">
         {section.students.map((st) => (
          <Tag
           key={`${section.key}-${st.studentId}`}
           tone={section.tone}
           size="sm"
           className="gap-1 py-0.5 pl-2 pr-1"
          >
           <Link
            to={`/Students/${st.studentId}`}
            className={cn("text-sm font-medium hover:underline", section.linkClass)}
            onClick={(e) => e.stopPropagation()}
           >
            {section.nameSuffix ? `${st.fullName}${section.nameSuffix}` : st.fullName}
           </Link>
           <StudentWhatsAppReminderButton
            compact
            className={cn("h-7 w-7", section.buttonBorderClass)}
            contactPhone={st.contactPhone}
            payload={{
             studentName: st.fullName,
             subject: schedule.subject,
             courseName: schedule.course_name,
             courseCode: schedule.course_code_full,
             dateYmd: schedule.scheduled_date,
             startTime: reminderTimes.startTime,
             endTime: reminderTimes.endTime,
             isConsecutive: reminderTimes.isConsecutive,
             classroomName: schedule.classroom_name,
             attendanceStatus: section.attendanceStatus,
             isTrial: section.isTrial,
            }}
           />
          </Tag>
         ))}
        </div>
       )}
      </div>
     )
    })
   )}
   {footer}
  </>
 )
}
