/**
 * 以 WhatsApp Web／App 開啟對話並預填文字（使用者仍須手動按發送）。
 * 使用官方連結格式：https://wa.me/<國碼+號碼>?text=<urlencoded>
 *
 * 聯絡優先：依「第一聯絡人」取其電話／偏好通訊方式；
 * 第一聯絡人偏好 WeChat 時改以 WeChat ID（複製），唔再用獨立 whatsapp 欄。
 */

export type StudentPhoneFields = {
 /** @deprecated 已改用第一聯絡人電話；保留僅供舊資料過渡 */
 whatsapp?: string | null
 student_phone?: string | null
 parent_phone?: string | null
 phone?: string | null
 student_phone_country_code?: string | null
 parent_phone_country_code?: string | null
 primary_contact_person?: string | null
 student_preferred_contact_method?: string | null
 parent_preferred_contact_method?: string | null
 student_wechat_id?: string | null
 parent_wechat_id?: string | null
}

export type PrimaryMessagingTarget = {
 person: "學生" | "家長"
 channel: "WhatsApp" | "WeChat"
 phone: string | null
 phoneCountryCode: "+852" | "+86"
 wechatId: string | null
}

function normalizeCc(value: string | null | undefined): "+852" | "+86" {
 return value === "+86" ? "+86" : "+852"
}

function asPerson(value: string | null | undefined): "學生" | "家長" {
 return value === "學生" ? "學生" : "家長"
}

function asChannel(value: string | null | undefined): "WhatsApp" | "WeChat" {
 return value === "WeChat" ? "WeChat" : "WhatsApp"
}

/** 依第一聯絡人解析通知按鈕目標（WhatsApp 電話或 WeChat ID） */
export function resolvePrimaryMessagingTarget(
 st: StudentPhoneFields
): PrimaryMessagingTarget | null {
 const person = asPerson(st.primary_contact_person)
 const channel = asChannel(
  person === "學生" ? st.student_preferred_contact_method : st.parent_preferred_contact_method
 )
 const phone =
  (person === "學生" ? st.student_phone : st.parent_phone)?.trim() ||
  (person === "學生" ? st.parent_phone : st.student_phone)?.trim() ||
  st.phone?.trim() ||
  null
 const phoneCountryCode = normalizeCc(
  person === "學生" ? st.student_phone_country_code : st.parent_phone_country_code
 )
 const wechatId =
  (person === "學生" ? st.student_wechat_id : st.parent_wechat_id)?.trim() || null

 if (channel === "WeChat") {
  if (!wechatId && !phone) return null
  return { person, channel, phone, phoneCountryCode, wechatId }
 }
 if (!phone) return null
 return { person, channel: "WhatsApp", phone, phoneCountryCode, wechatId }
}

/** 第一聯絡人 WhatsApp 電話（偏好 WeChat 時回 null） */
export function pickStudentContactRaw(st: StudentPhoneFields): string | null {
 const t = resolvePrimaryMessagingTarget(st)
 if (!t || t.channel !== "WhatsApp") return null
 return t.phone
}

export function studentContactFieldsFromDbRow(
 st: Record<string, unknown> | null
): StudentPhoneFields | null {
 if (!st) return null
 return {
  whatsapp: st.whatsapp != null ? String(st.whatsapp) : null,
  student_phone: st.student_phone != null ? String(st.student_phone) : null,
  parent_phone: st.parent_phone != null ? String(st.parent_phone) : null,
  student_phone_country_code:
   st.student_phone_country_code != null ? String(st.student_phone_country_code) : null,
  parent_phone_country_code:
   st.parent_phone_country_code != null ? String(st.parent_phone_country_code) : null,
  primary_contact_person:
   st.primary_contact_person != null ? String(st.primary_contact_person) : null,
  student_preferred_contact_method:
   st.student_preferred_contact_method != null
    ? String(st.student_preferred_contact_method)
    : st.preferred_contact_method != null
      ? String(st.preferred_contact_method)
      : null,
  parent_preferred_contact_method:
   st.parent_preferred_contact_method != null
    ? String(st.parent_preferred_contact_method)
    : st.preferred_contact_method != null
      ? String(st.preferred_contact_method)
      : null,
  student_wechat_id: st.student_wechat_id != null ? String(st.student_wechat_id) : null,
  parent_wechat_id: st.parent_wechat_id != null ? String(st.parent_wechat_id) : null,
 }
}

/** 從 Supabase students 關聯列取出第一聯絡人 WhatsApp 電話 */
export function pickStudentContactFromDbRow(st: Record<string, unknown> | null): string | null {
 return pickStudentContactRaw(studentContactFieldsFromDbRow(st) ?? {})
}

export function resolvePrimaryMessagingTargetFromDbRow(
 st: Record<string, unknown> | null
): PrimaryMessagingTarget | null {
 return resolvePrimaryMessagingTarget(studentContactFieldsFromDbRow(st) ?? {})
}

/** students 關聯 select 共用欄位（供通知按鈕） */
export const STUDENT_MESSAGING_SELECT_FIELDS =
 "whatsapp, student_phone, parent_phone, student_phone_country_code, parent_phone_country_code, primary_contact_person, student_preferred_contact_method, parent_preferred_contact_method, preferred_contact_method, student_wechat_id, parent_wechat_id"

/**
 * 轉成 wa.me 用的數字（僅數字，含國碼，無 +）。
 * 香港：8 位手機常省略 852，會自動補上。
 */
export function digitsForWhatsAppMe(input: string, defaultCountryCode = "852"): string | null {
 const d = input.replace(/\D/g, "")
 if (!d) return null
 if (d.startsWith(defaultCountryCode)) return d
 if (defaultCountryCode === "852" && d.length === 8 && /^[569]/.test(d)) {
  return `${defaultCountryCode}${d}`
 }
 if (d.length >= 10) return d
 if (defaultCountryCode === "852" && d.length === 8) {
  return `${defaultCountryCode}${d}`
 }
 return d
}

export type LessonReminderPayload = {
 studentName: string
 subject: string
 courseCode?: string | null
 courseName?: string | null
 dateYmd: string
 startTime?: string | null
 endTime?: string | null
 /** 連堂時顯示為「HH:MM-HH:MM (兩堂連堂)」 */
 isConsecutive?: boolean
 classroomName?: string | null
 /** 點名／出席狀態（可選，例如「出席」「請假」） */
 attendanceStatus?: string | null
 isTrial?: boolean
}

export function formatLessonReminderTimeLine(
 startTime: string | null | undefined,
 endTime: string | null | undefined,
 isConsecutive?: boolean
): string | null {
 const start = startTime?.trim() || null
 const end = endTime?.trim() || null
 if (start && end) {
  const range = `${start}-${end}`
  return isConsecutive ? `${range} (兩堂連堂)` : range
 }
 return start ?? end
}

/** 產生給家長／學生的溫馨提醒正文（可自行再改文案） */
export function buildLessonReminderMessage(p: LessonReminderPayload): string {
 const lines: string[] = []
 const who = p.studentName.trim() || "同學"
 lines.push(`您好，這裡是明學教育通知。`)
 lines.push("")
 lines.push(`${who} 課堂提醒：`)
 const head = p.courseName?.trim() ? p.courseName.trim() : p.subject
 const title = p.courseCode ? `${head}（${p.courseCode}）` : head
 lines.push(`班別：${title}`)
 lines.push(`日期：${p.dateYmd}`)
 const time = formatLessonReminderTimeLine(p.startTime, p.endTime, p.isConsecutive)
 if (time) lines.push(`時間：${time}`)
 if (p.classroomName) lines.push(`課室：${p.classroomName}`)
 if (p.isTrial) lines.push(`備註：試堂`)
 if (p.attendanceStatus && p.attendanceStatus.trim()) {
  lines.push(`點名狀態：${p.attendanceStatus.trim()}`)
 }
 lines.push("")
 lines.push(`請準時出席。如有疑問請回覆此訊息，謝謝！`)
 return lines.join("\n")
}

/** 同一日多堂合併成一則提醒（前台批次「明日課堂提醒」用） */
export type DayLessonReminderItem = {
 subject: string
 courseCode?: string | null
 courseName?: string | null
 startTime?: string | null
 endTime?: string | null
 isConsecutive?: boolean
 classroomName?: string | null
 /** enrolled｜makeup｜trial */
 kind?: "enrolled" | "makeup" | "trial"
 /** 補堂／調堂說明，例如「原請假 7/14 MA101」 */
 makeupNote?: string | null
 isTrial?: boolean
}

export type StudentDayReminderPayload = {
 studentName: string
 dateYmd: string
 lessons: DayLessonReminderItem[]
}

function formatDayLessonTitle(item: DayLessonReminderItem): string {
 const head = item.courseName?.trim() ? item.courseName.trim() : item.subject
 const base = item.courseCode ? `${head}（${item.courseCode}）` : head
 if (item.kind === "makeup") return `${base} · 補堂`
 if (item.kind === "trial" || item.isTrial) return `${base} · 試堂`
 return base
}

/** 產生「學生 × 某日」多堂合併 WhatsApp 正文 */
export function buildStudentDayReminderMessage(p: StudentDayReminderPayload): string {
 const lines: string[] = []
 const who = p.studentName.trim() || "同學"
 const lessons = p.lessons.filter(Boolean)
 lines.push(`您好，這裡是明學教育通知。`)
 lines.push("")
 if (lessons.length <= 1) {
  const only = lessons[0]
  if (!only) {
   lines.push(`${who} 課堂提醒：`)
   lines.push(`日期：${p.dateYmd}`)
  } else {
   lines.push(`${who} 課堂提醒：`)
   lines.push(`班別：${formatDayLessonTitle(only)}`)
   lines.push(`日期：${p.dateYmd}`)
   const time = formatLessonReminderTimeLine(only.startTime, only.endTime, only.isConsecutive)
   if (time) lines.push(`時間：${time}`)
   if (only.classroomName) lines.push(`課室：${only.classroomName}`)
   if (only.kind === "makeup" && only.makeupNote?.trim()) {
    lines.push(`備註：${only.makeupNote.trim()}`)
   } else if (only.isTrial || only.kind === "trial") {
    lines.push(`備註：試堂`)
   }
  }
 } else {
  lines.push(`${who} 課堂提醒（共 ${lessons.length} 堂）：`)
  lines.push(`日期：${p.dateYmd}`)
  lines.push("")
  lessons.forEach((item, i) => {
   lines.push(`${i + 1}. ${formatDayLessonTitle(item)}`)
   const time = formatLessonReminderTimeLine(item.startTime, item.endTime, item.isConsecutive)
   if (time) lines.push(`   時間：${time}`)
   if (item.classroomName) lines.push(`   課室：${item.classroomName}`)
   if (item.kind === "makeup" && item.makeupNote?.trim()) {
    lines.push(`   備註：${item.makeupNote.trim()}`)
   } else if (item.isTrial || item.kind === "trial") {
    lines.push(`   備註：試堂`)
   }
   if (i < lessons.length - 1) lines.push("")
  })
 }
 lines.push("")
 lines.push(`請準時出席。如有疑問請回覆此訊息，謝謝！`)
 return lines.join("\n")
}

export function buildWhatsAppMeUrl(phoneDigits: string, message: string, defaultCc = "852"): string | null {
 const digits = digitsForWhatsAppMe(phoneDigits, defaultCc)
 if (!digits) return null
 return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** 新分頁開啟 WhatsApp（若無法組出連結則回 false） */
export function openWhatsAppWithPrefilledText(
 phoneRaw: string,
 message: string,
 countryCode: "+852" | "+86" | string = "+852"
): boolean {
 const cc = countryCode === "+86" || countryCode === "86" ? "86" : "852"
 const url = buildWhatsAppMeUrl(phoneRaw, message, cc)
 if (!url) return false
 window.open(url, "_blank", "noopener,noreferrer")
 return true
}

/** 新分頁開啟 WhatsApp 對話（不預填文字）；若無法組出號碼則回 false */
export function openWhatsAppChat(
 phoneRaw: string,
 countryCode: "+852" | "+86" | string = "+852"
): boolean {
 const cc = countryCode === "+86" || countryCode === "86" ? "86" : "852"
 const digits = digitsForWhatsAppMe(phoneRaw, cc)
 if (!digits) return false
 window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer")
 return true
}

/** 複製 WeChat ID（桌面／網頁無穩定深連結） */
export async function copyWeChatId(wechatId: string): Promise<boolean> {
 const id = wechatId.trim()
 if (!id) return false
 try {
  await navigator.clipboard.writeText(id)
  return true
 } catch {
  return false
 }
}

/** 依第一聯絡人目標開啟 WhatsApp 或複製 WeChat ID */
export async function openPrimaryMessagingTarget(
 target: PrimaryMessagingTarget,
 message?: string
): Promise<"whatsapp" | "wechat" | false> {
 if (target.channel === "WeChat") {
  if (!target.wechatId) return false
  const ok = await copyWeChatId(target.wechatId)
  return ok ? "wechat" : false
 }
 if (!target.phone) return false
 const ok = message
  ? openWhatsAppWithPrefilledText(target.phone, message, target.phoneCountryCode)
  : openWhatsAppChat(target.phone, target.phoneCountryCode)
 return ok ? "whatsapp" : false
}
