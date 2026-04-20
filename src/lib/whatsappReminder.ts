/**
 * 以 WhatsApp Web／App 開啟對話並預填文字（使用者仍須手動按發送）。
 * 使用官方連結格式：https://wa.me/<國碼+號碼>?text=<urlencoded>
 */

export type StudentPhoneFields = {
  whatsapp?: string | null
  parent_phone?: string | null
  phone?: string | null
}

/** 優先使用 WhatsApp 欄位，其次家長電話；若資料庫有學生直線 `phone` 可一併傳入 */
export function pickStudentContactRaw(st: StudentPhoneFields): string | null {
  const w = st.whatsapp?.trim()
  if (w) return w
  const p = st.parent_phone?.trim()
  if (p) return p
  const ph = st.phone?.trim()
  if (ph) return ph
  return null
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
  dateYmd: string
  startTime?: string | null
  endTime?: string | null
  classroomName?: string | null
  /** 點名／出席狀態（可選，例如「出席」「請假」） */
  attendanceStatus?: string | null
  isTrial?: boolean
}

/** 產生給家長／學生的溫馨提醒正文（可自行再改文案） */
export function buildLessonReminderMessage(p: LessonReminderPayload): string {
  const lines: string[] = []
  const who = p.studentName.trim() || "同學"
  lines.push(`您好，這裡是明學補習社通知。`)
  lines.push("")
  lines.push(`${who} 今日課堂提醒：`)
  const title = p.courseCode ? `${p.subject}（${p.courseCode}）` : p.subject
  lines.push(`班別：${title}`)
  lines.push(`日期：${p.dateYmd}`)
  const time =
    p.startTime && p.endTime
      ? `${p.startTime}–${p.endTime}`
      : p.startTime
        ? p.startTime
        : p.endTime
          ? p.endTime
          : null
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
