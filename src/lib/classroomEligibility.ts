import type { RoomRecord } from "@/services/classroomQueries"

/** 26SM 暑假前段僅開放三間星座課室 */
const SUMMER_26SM_CONSTELLATION_ROOMS = ["矩尺座", "英仙座", "山案座"] as const

/** 25–26 學年結束後停用 17K（26SM 起） */
const ROOM_17K_LAST_DATE = "2026-06-30"

/** 17D、17E 自 2026-08-15 起開放 */
const ROOM_17DE_START_DATE = "2026-08-15"

/** 26SM 學年區間（與 academic_years 一致） */
const SUMMER_26SM_FROM = "2026-07-01"
const SUMMER_26SM_TO = "2026-08-31"

export function isPhysicalRoomActiveOnDate(roomName: string, ymd: string): boolean {
 if (roomName === "17K" && ymd > ROOM_17K_LAST_DATE) return false
 if ((roomName === "17D" || roomName === "17E") && ymd < ROOM_17DE_START_DATE) return false
 if (ymd >= SUMMER_26SM_FROM && ymd <= SUMMER_26SM_TO && ymd < ROOM_17DE_START_DATE) {
  return (SUMMER_26SM_CONSTELLATION_ROOMS as readonly string[]).includes(roomName)
 }
 return true
}

export function classroomsActiveOnDate(rooms: RoomRecord[], ymd: string): RoomRecord[] {
 return rooms
  .filter((r) => !r.is_online && isPhysicalRoomActiveOnDate(r.name, ymd))
  .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
}

/** 日期課室視圖：未安排課室之排程 */
export const UNASSIGNED_ROOM_ID = "__unassigned__"
export const UNASSIGNED_ROOM_LABEL = "未編課室"

/** 課室欄底色（山案座綠、英仙座橙、矩尺座藍） */
export function roomColumnBgClass(roomName: string): string {
 switch (roomName) {
  case "山案座":
   return "bg-success/10"
  case "英仙座":
   return "bg-warning/12"
  case "矩尺座":
   return "bg-info/10"
  case UNASSIGNED_ROOM_LABEL:
   return "bg-muted/35"
  case "17K":
   return "bg-neutral-100/80"
  case "17D":
   return "bg-success/8"
  case "17E":
   return "bg-info/8"
  default:
   return "bg-background"
 }
}

export function roomColumnHeaderBgClass(roomName: string): string {
 switch (roomName) {
  case "山案座":
   return "bg-success/20 text-success"
  case "英仙座":
   return "bg-warning/20 text-amber-900"
  case "矩尺座":
   return "bg-info/20 text-info"
  case UNASSIGNED_ROOM_LABEL:
   return "bg-muted/50 text-muted-foreground"
  default:
   return "bg-muted/40 text-muted-foreground"
 }
}
