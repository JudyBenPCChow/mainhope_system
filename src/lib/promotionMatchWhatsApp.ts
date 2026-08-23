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
    if (cls.teacherName?.trim()) lines.push(`   導師：${cls.teacherName.trim()}`)
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
  const who = studentName.trim() || "同學"
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
