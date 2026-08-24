export type PromotionMessageClass = {
  label: string
  subject?: string | null
  schedule?: string | null
  teacherName?: string | null
}

export type PromotionMatchMessageInput = {
  studentName: string
  gradeLabel?: string | null
  classes: PromotionMessageClass[]
  studiedSummer: boolean
}

const BOOKLET_LINE = "隨本訊息附上 2026–27 常規學年小冊子，歡迎參閱。"

const CJK_CHAR = /[\u3400-\u9FFF\uF900-\uFAFF]/
const COMPOUND_SURNAMES = [
  "歐陽",
  "司馬",
  "上官",
  "諸葛",
  "司徒",
  "皇甫",
  "夏侯",
  "慕容",
  "令狐",
  "宇文",
  "長孫",
  "公孫",
  "軒轅",
  "東方",
  "南宮",
  "西門",
  "獨孤",
  "端木",
] as const
const ENGLISH_TITLE_RE = /^(?:Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+/i

function isAllCapsLatin(token: string): boolean {
  return token.length > 1 && token === token.toUpperCase() && /[A-Z]/.test(token)
}

/**
 * 宣傳文案只用名字、不帶姓氏。
 * 中文名去掉首字姓（複姓取兩字）；英文名取名字（Western given name）。
 */
export function givenNameForCopy(fullName: string): string {
  const raw = fullName.trim()
  if (!raw) return ""

  const withoutNote = raw.replace(/[（(][^）)]*[）)]/g, "").trim() || raw
  const chars = Array.from(withoutNote)
  const first = chars[0] ?? ""

  if (CJK_CHAR.test(first)) {
    const compound = COMPOUND_SURNAMES.find((s) => withoutNote.startsWith(s))
    const skip = compound ? Array.from(compound).length : 1
    const given = chars.slice(skip).join("").trim()
    return given || withoutNote
  }

  const withoutTitle = withoutNote.replace(ENGLISH_TITLE_RE, "").trim()
  const parts = withoutTitle.split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return withoutNote
  if (isAllCapsLatin(parts[0])) {
    const given = parts.slice(1).join(" ").trim()
    return given || withoutNote
  }
  return parts[0]
}

function appendClassList(
  lines: string[],
  classes: PromotionMessageClass[]
): void {
  if (classes.length === 0) {
    lines.push("［請先從上方選擇推薦班別］")
    return
  }
  lines.push("")
  classes.forEach((cls, index) => {
    lines.push(`${index + 1}. ${cls.label.trim() || "未命名班別"}`)
    if (cls.subject?.trim()) lines.push(`   科目：${cls.subject.trim()}`)
    if (cls.schedule?.trim()) lines.push(`   時間：${cls.schedule.trim()}`)
    const teacherGiven = givenNameForCopy(cls.teacherName ?? "")
    if (teacherGiven) lines.push(`   導師：${teacherGiven}`)
    if (index < classes.length - 1) lines.push("")
  })
}

/** 產生可供行銷人員再編輯的學生班別推介 WhatsApp 文案。 */
export function buildPromotionMatchWhatsAppMessage({
  studentName,
  gradeLabel,
  classes,
  studiedSummer,
}: PromotionMatchMessageInput): string {
  const who = givenNameForCopy(studentName) || "同學"
  const grade = gradeLabel?.trim()
  const gradePhrase = grade ? `（${grade}）` : ""

  const lines = [`${who}家長 ︰`, ""]

  if (studiedSummer) {
    lines.push(
      `感謝 ${who} 於今個暑期選擇在明學學習！2026–27 常規學年專科班現已接受報讀，將於九月開課。`,
      "",
      `我們根據 ${who}暑期修讀的科目及目前年級${gradePhrase}，為您推介以下合適班別，方便銜接常規學年：`
    )
  } else {
    lines.push(
      "明學教育 2026–27 常規學年專科班現已接受報讀，將於九月開課。",
      "",
      `我們根據 ${who}目前的年級${gradePhrase}，為您推介以下合適班別：`
    )
  }

  appendClassList(lines, classes)

  lines.push("")
  lines.push(BOOKLET_LINE)
  lines.push("")
  if (studiedSummer) {
    lines.push(
      "如有興趣延續學習，歡迎回覆想了解的班別，我們可再為您介紹詳情，謝謝！🙏"
    )
  } else {
    lines.push("如有興趣，歡迎回覆想了解的班別，我們可再為您介紹詳情，謝謝！🙏")
  }
  lines.push("")
  lines.push("明學教育示")

  return lines.join("\n")
}
