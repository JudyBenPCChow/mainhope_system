import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export type ExtraLessonRosterPickerRow = {
 studentId: string
 fullName: string
}

type ExtraLessonRosterPickerProps = {
 candidates: ExtraLessonRosterPickerRow[]
 selectedIds: string[]
 lockedIds?: string[]
 onChange: (next: string[]) => void
 disabled?: boolean
}

export function ExtraLessonRosterPicker({
 candidates,
 selectedIds,
 lockedIds = [],
 onChange,
 disabled,
}: ExtraLessonRosterPickerProps) {
 const locked = new Set(lockedIds)
 const selected = new Set(selectedIds)

 const toggle = (studentId: string, nextChecked: boolean) => {
  if (disabled || locked.has(studentId)) return
  const next = nextChecked
   ? [...selectedIds, studentId]
   : selectedIds.filter((id) => id !== studentId)
  onChange([...new Set(next)])
 }

 const selectable = candidates.filter((row) => !locked.has(row.studentId))
 const allSelectableSelected =
  selectable.length > 0 && selectable.every((row) => selected.has(row.studentId))

 return (
  <div className="grid gap-2">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-muted-foreground">
     就讀生上紙（預設全選；未點名前可改）
    </p>
    <div className="flex gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || selectable.length === 0}
      onClick={() =>
       onChange([...new Set([...lockedIds, ...selectable.map((row) => row.studentId)])])
      }
     >
      {allSelectableSelected ? "已全選" : "全選"}
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || selectable.length === 0}
      onClick={() => onChange(candidates.filter((row) => locked.has(row.studentId)).map((r) => r.studentId))}
     >
      全不選
     </Button>
    </div>
   </div>
   {candidates.length === 0 ? (
    <p className="text-sm text-muted-foreground">此班目前沒有可挑選的就讀生。</p>
   ) : (
    <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-input p-2">
     {candidates.map((row) => {
      const isLocked = locked.has(row.studentId)
      const checked = selected.has(row.studentId)
      return (
       <li key={row.studentId} className="flex items-center gap-2 py-1 text-sm">
        <Checkbox
         checked={checked}
         disabled={disabled || isLocked}
         aria-label={row.fullName}
         onCheckedChange={(next) => toggle(row.studentId, next)}
        />
        <span className={isLocked ? "text-muted-foreground" : undefined}>
         {row.fullName}
         {isLocked ? "（已有點名紀錄）" : ""}
        </span>
       </li>
      )
     })}
    </ul>
   )}
   <p className="text-xs text-muted-foreground">
    已選 {selectedIds.length} / {candidates.length} 人。未選者不出現在點名紙，亦不扣其已繳堂數。請假調堂掛入者不受此名單影響。
   </p>
  </div>
 )
}
