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
}

/** 產生可供行銷人員再編輯的學生班別推介 WhatsApp 文案。 */
export function buildPromotionMatchWhatsAppMessage({
  studentName,
  gradeLabel,
  classes,
}: PromotionMatchMessageInput): string {
  const who = studentName.trim() || "同學"
  const grade = gradeLabel?.trim()
  const gradePhrase = grade ? `（${grade}）` : ""

  const lines = [
    `${who}家長 ︰`,
    "",
    "暑期差不多已過一半，明學教育現時尚餘少量課程接受報讀，暑期課程第二期將於8月開始。",
    "",
    `我們根據 ${who}目前的年級${gradePhrase}，為您推介以下合適班別：`,
  ]

  if (classes.length === 0) {
    lines.push("［請先從上方選擇推薦班別］")
  } else {
    lines.push("")
    classes.forEach((cls, index) => {
      lines.push(`${index + 1}. ${cls.label.trim() || "未命名班別"}`)
      if (cls.subject?.trim()) lines.push(`   科目：${cls.subject.trim()}`)
      if (cls.schedule?.trim()) lines.push(`   時間：${cls.schedule.trim()}`)
      if (cls.teacherName?.trim()) lines.push(`   導師：${cls.teacherName.trim()}`)
      if (index < classes.length - 1) lines.push("")
    })
  }

  lines.push("")
  lines.push("凡經此訊息報名，更可享每科學費減 $200優惠 🎉")
  lines.push("名額有限，建議把握暑期最後時光，為成績打好基礎 📚")
  lines.push("")
  lines.push("如有興趣，歡迎回覆想了解的班別，我們可再為您介紹詳情，謝謝！🙏")
  lines.push("")
  lines.push("明學教育示")

  return lines.join("\n")
}
