/**
 * 以 WhatsApp Web／App 開啟對話並預填文字（使用者仍須手動按發送）。
 * 使用官方連結格式：https://wa.me/<國碼+號碼>?text=<urlencoded>
 */

export type StudentPhoneFields = {
 whatsapp?: string | null
 student_phone?: string | null
 parent_phone?: string | null
 phone?: string | null
}

/** 優先使用 WhatsApp，其次學生電話，再其次家長電話 */
export function pickStudentContactRaw(st: StudentPhoneFields): string | null {
 const w = st.whatsapp?.trim()
 if (w) return w
 const sp = st.student_phone?.trim()
 if (sp) return sp
 const p = st.parent_phone?.trim()
 if (p) return p
 const ph = st.phone?.trim()
 if (ph) return ph
 return null
}

/** 從 Supabase students 關聯列取出聯絡電話（與 pickStudentContactRaw 優先順序一致） */
export function pickStudentContactFromDbRow(st: Record<string, unknown> | null): string | null {
 if (!st) return null
 return pickStudentContactRaw({
  whatsapp: st.whatsapp != null ? String(st.whatsapp) : null,
  student_phone: st.student_phone != null ? String(st.student_phone) : null,
  parent_phone: st.parent_phone != null ? String(st.parent_phone) : null,
 })
}

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
 lines.push(`您好，這裡是明學補習社通知。`)
 lines.push("")
 lines.push(`${who} 今日課堂提醒：`)
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

export function buildWhatsAppMeUrl(phoneDigits: string, message: string, defaultCc = "852"): string | null {
 const digits = digitsForWhatsAppMe(phoneDigits, defaultCc)
 if (!digits) return null
 return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** 新分頁開啟 WhatsApp（若無法組出連結則回 false） */
export function openWhatsAppWithPrefilledText(phoneRaw: string, message: string): boolean {
 const url = buildWhatsAppMeUrl(phoneRaw, message)
 if (!url) return false
 window.open(url, "_blank", "noopener,noreferrer")
 return true
}

/** 新分頁開啟 WhatsApp 對話（不預填文字）；若無法組出號碼則回 false */
export function openWhatsAppChat(phoneRaw: string): boolean {
 const digits = digitsForWhatsAppMe(phoneRaw, "852")
 if (!digits) return false
 window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer")
 return true
}
