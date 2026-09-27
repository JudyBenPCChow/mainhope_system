import { HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH } from "@/lib/homeworkDutyCalendarExport"

/** 與收據、功輔月曆同一校舍地址。 */
export const AD_PUBLIC_CAMPUS_ADDRESS = HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH

/** 收據上的查詢電話。 */
export const AD_PUBLIC_ENQUIRY_PHONE = "3705-5140"

/**
 * 收集個人資料聲明。對齊私隱專員公署保障資料第 1(3) 原則在表格上的常見四項：
 * 目的、必須或可選及不提供的後果、資料承讓人類別、查閱及改正的權利與聯絡方法。
 * 不設直銷同意，亦不以繼續瀏覽視作同意。
 */
export const AD_PUBLIC_COLLECTION_NOTICE = [
  "本社收集你在此表格填寫的資料，只用於處理是次查詢或試堂登記，並由本社職員按你選擇的 WhatsApp 或 WeChat 聯絡，確認時間與收費。",
  "姓名、學校、年級，以及 WhatsApp 電話或 WeChat ID 必須填寫。如不提供，本社無法跟進。備註、選修，以及其後選擇的科目或堂次，可按需要填寫。",
  "資料只供本社負責跟進的職員查閱，以及代本社保存此登記的系統供應商處理。本社不會把資料售予他人，亦不用作其他推廣。",
  `你有權要求查閱及改正本社持有關於你的個人資料。請致電 ${AD_PUBLIC_ENQUIRY_PHONE}，或書面寄交明學教育（${AD_PUBLIC_CAMPUS_ADDRESS}）。本社會在接獲要求後 40 日內回覆。`,
] as const
