import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem } from "@/components/ui/stagger-list"
import { formatClassLabel } from "@/lib/courseLabel"
import { isHomeworkClassKind } from "@/lib/privateClassKind"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { LessonBalanceRow } from "@/services/pendingLessonQueries"
import type { EnrollmentWithClass } from "@/services/studentQueries"

function money(n: number) {
 return `HKD $${n.toLocaleString("zh-Hant-TW")}`
}

type Props = {
 enrollment: EnrollmentWithClass
 canViewMoney: boolean
 canMutateStudentOps: boolean
 canOpenLeaveManagement: boolean
 lessonBalancesState: "loading" | "ready" | "error"
 balance: LessonBalanceRow | undefined
 studentId: string | undefined
 onEditForm: (enrollment: EnrollmentWithClass) => void
 onUpdateStatus: (enrollment: EnrollmentWithClass, next: string) => Promise<void>
 onWithdraw: (enrollment: EnrollmentWithClass) => void
 onPurge: (enrollment: EnrollmentWithClass) => void
 onMarkPendingArranged: (pendingId: string) => Promise<void>
 onGoLeaveTab: () => void
}

export function StudentEnrollmentCard({
 enrollment: e,
 canViewMoney,
 canMutateStudentOps,
 canOpenLeaveManagement,
 lessonBalancesState,
 balance: bal,
 studentId,
 onEditForm,
 onUpdateStatus,
 onWithdraw,
 onPurge,
 onMarkPendingArranged,
 onGoLeaveTab,
}: Props) {
 const isHomework = isHomeworkClassKind(e.classKind)
 return (
  <StaggerItem
   as="div"
   className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
  >
   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <div className="font-semibold">
      <Link to={`/Classes/${e.classId}`} className="text-primary hover:underline">
       {formatClassLabel({ subject: e.subject, courseCode: e.courseCode, courseName: e.courseName })}
      </Link>
     </div>
     <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {e.academicYearLabel ? (
       <Tag tone="default" size="sm">
        {e.academicYearLabel} 學年
       </Tag>
      ) : null}
      <span>{[e.dayOfWeek, e.timeSlot].filter(Boolean).join(" ")}</span>
      {e.enrollmentFormLabel ? (
       <Tag tone={statusToTagTone(e.enrollmentFormLabel)} size="sm">
        {e.enrollmentFormLabel}
       </Tag>
      ) : null}
      {canViewMoney && !isHomework && e.pricePerLesson != null ? (
       <span>· 每節 {money(e.pricePerLesson)}</span>
      ) : null}
      {isHomework ? <span>{e.homeworkDayPlan ? `每週${e.homeworkDayPlan}` : "未設定"}</span> : null}
     </div>
     <div className="mt-1 text-xs text-muted-foreground">報讀日期：{e.enroll_date ?? "—"}</div>
    </div>
    {canMutateStudentOps ? (
     <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => onEditForm(e)}>
       更改報讀形式
      </Button>
      <Select
       className="h-9 rounded-md border border-input bg-background px-2 text-sm"
       value={e.status}
       onChange={(ev) => void onUpdateStatus(e, ev.target.value)}
      >
       <option value="就讀中">就讀中</option>
       <option value="休學">休學</option>
       <option value="退選">退選</option>
      </Select>
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="border-amber-700/45 text-amber-950 hover:bg-amber-50"
       onClick={() => onWithdraw(e)}
      >
       退讀
      </Button>
      <details className="relative">
       <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
        其他操作
       </summary>
       <div className="absolute right-0 z-10 mt-1 min-w-[8.5rem] rounded-md border border-border bg-background p-1 shadow-sm">
        <Button
         type="button"
         variant="ghost"
         size="sm"
         className="h-8 w-full justify-start text-xs text-muted-foreground"
         onClick={() => void onPurge(e)}
        >
         手誤清除
        </Button>
       </div>
      </details>
     </div>
    ) : (
     <Tag tone={statusToTagTone(e.status)} size="sm">
      {e.status}
     </Tag>
    )}
   </div>
   {isHomework ? (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
     功課輔導班按月繳費，不按堂對帳、不補堂。已繳月份見功課輔導 → 月費，或繳費紀錄。
    </div>
   ) : lessonBalancesState === "ready" && bal ? (
    <div
     className={cn(
      "rounded-md border px-3 py-2 text-xs",
      canViewMoney
       ? bal.isAligned && bal.pendingLessons === 0 && bal.leaveAwaitingMakeupCount === 0
         ? "border-border bg-muted/40 text-muted-foreground"
         : "border-amber-700/35 bg-amber-50 text-amber-950"
       : bal.pendingLessons === 0 && bal.leaveAwaitingMakeupCount === 0
         ? "border-border bg-muted/40 text-muted-foreground"
         : "border-amber-700/35 bg-amber-50 text-amber-950"
     )}
    >
     <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {canViewMoney ? (
       <>
        <span>
         已繳 <strong className="tabular-nums text-foreground">{bal.paidLessons}</strong> 堂
        </span>
        <span>
         已綁排程 <strong className="tabular-nums text-foreground">{bal.boundLessons}</strong> 堂
        </span>
       </>
      ) : null}
      <span>
       待補 <strong className="tabular-nums text-foreground">{bal.pendingLessons}</strong> 堂
      </span>
      <span>
       請假待安排{" "}
       <strong className="tabular-nums text-foreground">{bal.leaveAwaitingMakeupCount}</strong> 堂
      </span>
      {canViewMoney ? (
       bal.paidLessons > 0 ? (
        <Tag
         tone={bal.isAligned && bal.leaveAwaitingMakeupCount === 0 ? "success" : "warning"}
         size="sm"
        >
         {!bal.isAligned
          ? `尚差 ${bal.gap} 堂（請經收款／出單增加已繳堂數）`
          : bal.leaveAwaitingMakeupCount > 0
            ? `請假待安排 ${bal.leaveAwaitingMakeupCount} 堂`
            : "堂數一致"}
        </Tag>
       ) : bal.leaveAwaitingMakeupCount > 0 ? (
        <Tag tone="warning" size="sm">
         請假待安排 {bal.leaveAwaitingMakeupCount} 堂
        </Tag>
       ) : (
        <span className="text-muted-foreground">尚未有該班已收款堂數</span>
       )
      ) : bal.leaveAwaitingMakeupCount > 0 ? (
       <Tag tone="warning" size="sm">
        請假待安排 {bal.leaveAwaitingMakeupCount} 堂
       </Tag>
      ) : null}
     </div>
     {bal.leaveAwaitingMakeupRows.length > 0 ? (
      <ul className="mt-2 space-y-1">
       {bal.leaveAwaitingMakeupRows.map((row) => (
        <li
         key={row.id}
         className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-700/20 pt-1"
        >
         <span>
          請假 {row.leaveDate}
          {row.leaveReason ? ` · ${row.leaveReason}` : ""}
          {" · "}
          {row.makeupType?.trim() || "待安排"}
         </span>
         {canOpenLeaveManagement ? (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
           <Link to={`/LeaveManagement?studentId=${encodeURIComponent(studentId ?? "")}`}>
            前往請假管理
           </Link>
          </Button>
         ) : (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={onGoLeaveTab}>
           查看請假紀錄
          </Button>
         )}
        </li>
       ))}
      </ul>
     ) : null}
     {bal.pendingRows.some((p) => p.status === "待補") ? (
      <ul className="mt-2 space-y-1">
       {bal.pendingRows
        .filter((p) => p.status === "待補")
        .map((p) => (
         <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-700/20 pt-1"
         >
          <span>
           {p.reason} · 待補 <strong className="tabular-nums">{p.owedCount}</strong> 堂
           {p.remarks ? `（${p.remarks}）` : ""}
          </span>
          {canMutateStudentOps ? (
           <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => void onMarkPendingArranged(p.id)}
           >
            標為已安排
           </Button>
          ) : null}
         </li>
        ))}
      </ul>
     ) : null}
    </div>
   ) : null}
  </StaggerItem>
 )
}
