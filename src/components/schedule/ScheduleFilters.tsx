import { User } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import {
 NO_ROOM_FILTER_OPTION,
 classKindFilterIcon,
 classKindFilterLabel,
 enrollmentFilterIcon,
 enrollmentFilterLabel,
 type ScheduleAdvancedFilterId,
 type ScheduleClassKindFilter,
 type ScheduleEnrollmentFilter,
} from "@/components/schedule/scheduleManageUi"

type TeacherOption = { id: string; label: string }

type SharedFilterProps = {
 statusFilter: string
 onStatusChange: (value: string) => void
 advancedFilterIds: ScheduleAdvancedFilterId[]
 enrollmentFilter: ScheduleEnrollmentFilter
 onCycleEnrollment: () => void
 classKindFilter: ScheduleClassKindFilter
 onCycleClassKind: () => void
 noRoomActive: boolean
 onToggleNoRoom: () => void
 enrollmentDisabled: boolean
 paused: boolean
 teacherScopeId: string | null
 teacherOptions: TeacherOption[]
 effectiveTeacherFilterIds: string[]
 onToggleTeacher: (id: string) => void
}

function AdvancedFilterButtons({
 advancedFilterIds,
 enrollmentFilter,
 onCycleEnrollment,
 classKindFilter,
 onCycleClassKind,
 noRoomActive,
 onToggleNoRoom,
 enrollmentDisabled,
 paused,
}: Pick<
 SharedFilterProps,
 | "advancedFilterIds"
 | "enrollmentFilter"
 | "onCycleEnrollment"
 | "classKindFilter"
 | "onCycleClassKind"
 | "noRoomActive"
 | "onToggleNoRoom"
 | "enrollmentDisabled"
 | "paused"
>) {
 return (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label="進階篩選">
   {advancedFilterIds.map((id) => {
    if (id === "enrollment") {
     const active = enrollmentFilter !== "all"
     const Icon = enrollmentFilterIcon(enrollmentFilter)
     const label = enrollmentFilterLabel(enrollmentFilter)
     const disabled = paused || enrollmentDisabled
     const title = paused
      ? "未來取消堂模式暫不套用進階篩選"
      : enrollmentDisabled
        ? "點名冊人數載入中，請稍候再篩選"
        : "按一下切換：全部 → 有學生 → 未有學生"
     return (
      <button
       key={id}
       type="button"
       aria-pressed={active}
       disabled={disabled}
       title={title}
       onClick={onCycleEnrollment}
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
    }
    if (id === "classKind") {
     const active = classKindFilter !== "all"
     const Icon = classKindFilterIcon(classKindFilter)
     const label = classKindFilterLabel(classKindFilter)
     const title = paused
      ? "未來取消堂模式暫不套用進階篩選"
      : "按一下切換：全部 → 專科班 → 非專科班"
     return (
      <button
       key={id}
       type="button"
       aria-pressed={active}
       disabled={paused}
       title={title}
       onClick={onCycleClassKind}
       className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all",
        paused && "cursor-not-allowed opacity-50",
        active
         ? "border-info bg-info/10 text-info ring-1 ring-info/40"
         : "border-input bg-background text-muted-foreground hover:border-info/60 hover:text-foreground"
       )}
      >
       <Icon className="h-4 w-4 shrink-0" aria-hidden />
       {label}
      </button>
     )
    }
    const { label, icon: Icon } = NO_ROOM_FILTER_OPTION
    const active = noRoomActive
    return (
     <button
      key={id}
      type="button"
      aria-pressed={active}
      disabled={paused}
      title={paused ? "未來取消堂模式暫不套用進階篩選" : undefined}
      onClick={onToggleNoRoom}
      className={cn(
       "inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all",
       paused && "cursor-not-allowed opacity-50",
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
 )
}

function FilterFields({
 statusFilter,
 onStatusChange,
 advancedFilterIds,
 enrollmentFilter,
 onCycleEnrollment,
 classKindFilter,
 onCycleClassKind,
 noRoomActive,
 onToggleNoRoom,
 enrollmentDisabled,
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
   {advancedFilterIds.length > 0 ? (
    <div className="space-y-1.5">
     <p className="text-xs font-medium text-muted-foreground">進階篩選</p>
     <AdvancedFilterButtons
      advancedFilterIds={advancedFilterIds}
      enrollmentFilter={enrollmentFilter}
      onCycleEnrollment={onCycleEnrollment}
      classKindFilter={classKindFilter}
      onCycleClassKind={onCycleClassKind}
      noRoomActive={noRoomActive}
      onToggleNoRoom={onToggleNoRoom}
      enrollmentDisabled={enrollmentDisabled}
      paused={paused}
     />
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
    {fields.advancedFilterIds.length > 0 ? (
     <AdvancedFilterButtons
      advancedFilterIds={fields.advancedFilterIds}
      enrollmentFilter={fields.enrollmentFilter}
      onCycleEnrollment={fields.onCycleEnrollment}
      classKindFilter={fields.classKindFilter}
      onCycleClassKind={fields.onCycleClassKind}
      noRoomActive={fields.noRoomActive}
      onToggleNoRoom={fields.onToggleNoRoom}
      enrollmentDisabled={fields.enrollmentDisabled}
      paused={fields.paused}
     />
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
