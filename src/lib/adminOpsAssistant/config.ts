export const ADMIN_OPS_SESSION_STORAGE_KEY = "mingxue_admin_ops_assistant_v1"

export const ADMIN_OPS_NAME = "班務助手"

export const ADMIN_OPS_PATH = "/AdminOps"

export const ADMIN_OPS_WELCOME_TEXT =
  "這是行政班務助手。用書面語說明要改的班、時段或開班，預覽後確認才會寫入。\n\n" +
  "第一波可處理：取消沒有學生的班（硬刪排程，不標取消）、改固定時段、兩個班對調時間、開新班並排堂（可少於 40 堂）、取消空班後同一格開另一科。\n\n" +
  "明學IT狗仍只負責查詢與教學，不會代改資料。學生轉時間、請假補堂請用既有頁面。"

export const ADMIN_OPS_STARTER_SUGGESTIONS = [
  "取消沒有學生的班",
  "改固定時段",
  "兩個班對調時間",
  "開新班並排堂",
  "取消空班後同一格開另一科",
] as const

/** 2627 專科最後上課日；不可用 academic_years.end_date（6/30） */
export const SPECIALIST_LAST_LESSON_YMD_2627 = "2027-06-28"

/** 該星期幾從學年首堂日起讀全年的校曆目標；中途開班可少於此數 */
export const SPECIALIST_CALENDAR_TARGET_LESSONS = 40
