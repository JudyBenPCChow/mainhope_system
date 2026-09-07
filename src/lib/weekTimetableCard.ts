import { formatStudentNameList } from "@/lib/scheduleDisplay"
import { cn } from "@/lib/utils"

export type WeekTimetableCardKind = "cancelled" | "extra" | "empty" | "enrolled" | "pending"

/** 取消優先於加堂；名單未載入時不標灰，避免誤判空班。 */
export function weekTimetableCardKind(item: {
 status: string
 isExtraLesson: boolean
 enrollCount: number | null
}): WeekTimetableCardKind {
 if (item.status.includes("取消")) return "cancelled"
 if (item.isExtraLesson) return "extra"
 if (item.enrollCount == null) return "pending"
 if (item.enrollCount <= 0) return "empty"
 return "enrolled"
}

const KIND_SURFACE: Record<WeekTimetableCardKind, string> = {
 cancelled: "border-dashed border-destructive/40 bg-destructive/10 text-destructive line-through",
 extra: "border-warning/40 bg-warning/15 text-foreground",
 empty: "border-border bg-muted/70 text-muted-foreground",
 enrolled: "border-success/40 bg-success/15 text-foreground",
 pending: "border-info/30 bg-info/10 text-foreground",
}

/** 緊湊格超過 3 人時縮寫；名單未載入回 null。 */
export function formatWeekTimetableStudentLine(
 names: string[] | null,
 compact: boolean
): string | null {
 if (names == null) return null
 if (names.length === 0) return "尚無學生"
 if (compact && names.length > 3) {
  return `${names.slice(0, 2).join("、")} 等 ${names.length} 人`
 }
 return formatStudentNameList(names)
}

export function weekTimetableCardClassName(
 kind: WeekTimetableCardKind,
 compact: boolean
): string {
 return cn(
  compact
   ? "block rounded-md border px-1 py-0.5 text-[0.65rem] leading-snug shadow-sm transition-colors hover:border-primary md:text-xs"
   : "block rounded-xl border px-4 py-3 transition-colors hover:border-primary/40",
  KIND_SURFACE[kind]
 )
}
