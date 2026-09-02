import { User } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import {
 ISSUE_FILTER_OPTIONS,
 type ScheduleIssueFilter,
} from "@/components/schedule/scheduleManageUi"

type TeacherOption = { id: string; label: string }

type SharedFilterProps = {
 statusFilter: string
 onStatusChange: (value: string) => void
 issueFilterOptions: typeof ISSUE_FILTER_OPTIONS
 effectiveIssueFilters: ScheduleIssueFilter[]
 onToggleIssue: (id: ScheduleIssueFilter) => void
 noEnrollDisabled: boolean
 paused: boolean
 teacherScopeId: string | null
 teacherOptions: TeacherOption[]
 effectiveTeacherFilterIds: string[]
 onToggleTeacher: (id: string) => void
}

function FilterFields({
 statusFilter,
 onStatusChange,
 issueFilterOptions,
 effectiveIssueFilters,
 onToggleIssue,
 noEnrollDisabled,
 paused,
 teacherScopeId,
 teacherOptions,
 effectiveTeacherFilterIds,
 onToggleTeacher,
 compactTeachers,
}: SharedFilterProps & { compactTeachers: boolean }) {
 return (
  <>
   <div className="space-y-1.5">
    <p className="text-xs font-medium text-muted-foreground">狀態</p>
    <Select
     className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
     value={statusFilter}
     disabled={paused}
     title={paused ? "未來取消堂模式暫不套用狀態篩選" : undefined}
     onChange={(e) => onStatusChange(e.target.value)}
    >
     <option value="all">全部狀態</option>
     <option value="正常">正常</option>
     <option value="完成">完成</option>
     <option value="取消">取消</option>
    </Select>
   </div>
   {issueFilterOptions.length > 0 ? (
    <div className="space-y-1.5">
     <p className="text-xs font-medium text-muted-foreground">進階篩選</p>
     <div className="flex flex-wrap gap-1.5" role="group" aria-label="進階篩選">
      {issueFilterOptions.map(({ id, label, icon: Icon }) => {
       const active = effectiveIssueFilters.includes(id)
       const disabled = paused || (id === "noEnroll" && noEnrollDisabled)
       const title = paused
        ? "未來取消堂模式暫不套用進階篩選"
        : id === "noEnroll" && noEnrollDisabled
          ? "點名冊人數載入中，請稍候再篩選"
          : undefined
       return (
        <button
         key={id}
         type="button"
         aria-pressed={active}
         disabled={disabled}
         title={title}
         onClick={() => onToggleIssue(id)}
         className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all",
          disabled && "cursor-not-allowed opacity-50",
          active
           ? "border-info bg-info/10 text-info ring-1 ring-info/40"
           : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
         )}
        >
         <Icon className="h-4 w-4 shrink-0" aria-hidden />
         {label}
        </button>
       )
      })}
     </div>
    </div>
   ) : null}
   {!teacherScopeId && teacherOptions.length > 0 ? (
    <div className={cn("space-y-1.5", compactTeachers && "pt-0")}>
     <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <User className="h-4 w-4 shrink-0" aria-hidden />
      老師
     </p>
     <div className="flex flex-wrap gap-1.5" role="group" aria-label="老師篩選">
      {teacherOptions.map(({ id, label }) => {
       const active = effectiveTeacherFilterIds.includes(id)
       return (
        <button
         key={id}
         type="button"
         aria-pressed={active}
         disabled={paused}
         title={paused ? "未來取消堂模式暫不套用老師篩選" : undefined}
         onClick={() => onToggleTeacher(id)}
         className={cn(
          "inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium transition-all",
          paused && "cursor-not-allowed opacity-50",
          active
           ? "border-info bg-info/10 text-info ring-1 ring-info/40"
           : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
         )}
        >
         {label}
        </button>
       )
      })}
     </div>
    </div>
   ) : null}
  </>
 )
}

type Props = SharedFilterProps & {
 isMobile: boolean
 filtersOpen: boolean
 onFiltersOpenChange: (open: boolean) => void
 activeFilterCount: number
 onReset: () => void
 unassignedRoomCount: number
 unassignedTeacherCount: number
}

export function ScheduleFilters({
 isMobile,
 filtersOpen,
 onFiltersOpenChange,
 activeFilterCount,
 onReset,
 unassignedRoomCount,
 unassignedTeacherCount,
 ...fields
}: Props) {
 const chips = (
  <div className="flex flex-wrap items-center gap-1.5">
   {unassignedRoomCount > 0 ? (
    <Tag tone="warning" size="sm">
     未編課室 {unassignedRoomCount}
    </Tag>
   ) : null}
   {unassignedTeacherCount > 0 ? (
    <Tag tone="warning" size="sm">
     未指派老師 {unassignedTeacherCount}
    </Tag>
   ) : null}
   {activeFilterCount > 0 && !fields.paused ? (
    <Tag tone="info" size="sm">
     已套用 {activeFilterCount} 項篩選
    </Tag>
   ) : null}
   {fields.paused ? (
    <Tag tone="info" size="sm">
     專用模式：篩選已暫停
    </Tag>
   ) : null}
  </div>
 )

 if (isMobile) {
  return (
   <>
    <Button
     type="button"
     variant="outline"
     className="w-full min-h-10 gap-2 sm:w-auto"
     onClick={() => onFiltersOpenChange(true)}
     disabled={fields.paused}
    >
     篩選
     {activeFilterCount > 0 ? (
      <Tag tone="info" size="sm">
       {activeFilterCount}
      </Tag>
     ) : null}
    </Button>
    {chips}
    <MobileFilterSheet
     open={filtersOpen}
     onClose={() => onFiltersOpenChange(false)}
     title="篩選排程"
     activeCount={activeFilterCount}
     onReset={onReset}
    >
     <div className="space-y-4">
      <FilterFields {...fields} compactTeachers={false} />
     </div>
    </MobileFilterSheet>
   </>
  )
 }

 return (
  <div className="flex min-w-0 flex-1 flex-col gap-2">
   <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
    <Select
     className="h-10 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-info/60 disabled:cursor-not-allowed disabled:opacity-50"
     value={fields.statusFilter}
     disabled={fields.paused}
     title={fields.paused ? "未來取消堂模式暫不套用狀態篩選" : undefined}
     onChange={(e) => fields.onStatusChange(e.target.value)}
    >
     <option value="all">全部狀態</option>
     <option value="正常">正常</option>
     <option value="完成">完成</option>
     <option value="取消">取消</option>
    </Select>
    {fields.issueFilterOptions.length > 0 ? (
     <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="進階篩選">
      {fields.issueFilterOptions.map(({ id, label, icon: Icon }) => {
       const active = fields.effectiveIssueFilters.includes(id)
       const disabled = fields.paused || (id === "noEnroll" && fields.noEnrollDisabled)
       const title = fields.paused
        ? "未來取消堂模式暫不套用進階篩選"
        : id === "noEnroll" && fields.noEnrollDisabled
          ? "點名冊人數載入中，請稍候再篩選"
          : undefined
       return (
        <button
         key={id}
         type="button"
         aria-pressed={active}
         disabled={disabled}
         title={title}
         onClick={() => fields.onToggleIssue(id)}
         className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all",
          disabled && "cursor-not-allowed opacity-50",
          active
           ? "border-info bg-info/10 text-info ring-1 ring-info/40"
           : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
         )}
        >
         <Icon className="h-4 w-4 shrink-0" aria-hidden />
         {label}
        </button>
       )
      })}
     </div>
    ) : null}
    {chips}
   </div>
   {!fields.teacherScopeId && fields.teacherOptions.length > 0 ? (
    <div
     className="flex max-h-28 min-w-0 flex-wrap items-center gap-1.5 overflow-y-auto border-t border-border/70 pt-3"
     role="group"
     aria-label="老師篩選"
    >
     <span className="mr-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <User className="h-4 w-4 shrink-0" aria-hidden />
      老師
     </span>
     {fields.teacherOptions.map(({ id, label }) => {
      const active = fields.effectiveTeacherFilterIds.includes(id)
      return (
       <button
        key={id}
        type="button"
        aria-pressed={active}
        disabled={fields.paused}
        title={fields.paused ? "未來取消堂模式暫不套用老師篩選" : undefined}
        onClick={() => fields.onToggleTeacher(id)}
        className={cn(
         "inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium transition-all",
         fields.paused && "cursor-not-allowed opacity-50",
         active
          ? "border-info bg-info/10 text-info ring-1 ring-info/40"
          : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
        )}
       >
        {label}
       </button>
      )
     })}
    </div>
   ) : null}
  </div>
 )
}
