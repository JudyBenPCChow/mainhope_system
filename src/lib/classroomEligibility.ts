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
