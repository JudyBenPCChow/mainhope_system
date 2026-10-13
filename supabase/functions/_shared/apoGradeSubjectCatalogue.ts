/** 明學IT狗：年級＋科目 → 目前學年專科班目錄（純解析／排版，不查庫） */

export type GradeSubjectRequest = {
  gradeLabel: string
  gradeCode: string
  subjectCode: string
  subjectShort: string
  subjectNames: string[]
  sections: string[]
}

export type CatalogueClassRow = {
  filter_index: number
  grade_code?: string
  subject_code?: string
  course_code_full?: string | null
  section_code?: string | null
  day_of_week?: string | null
  time_slot?: string | null
  teacher_name?: string | null
  enrolled_count?: number | null
}

type SubjectDef = {
  code: string
  short: string
  names: string[]
}

const SUBJECTS: SubjectDef[] = [
  { code: "CHI", short: "中文", names: ["中國語文", "中文"] },
  { code: "ENG", short: "英文", names: ["英國語文", "英文"] },
  { code: "M1", short: "M1", names: ["數學延伸部分（單元一 M1）", "數學延伸一", "單元一", "M1"] },
  { code: "M2", short: "M2", names: ["數學延伸部分（單元二 M2）", "數學延伸二", "單元二", "M2"] },
  { code: "MATH", short: "數學", names: ["數學（必修部份）", "數學（必修部分）", "數學"] },
  { code: "SCI", short: "科學", names: ["綜合科學", "科學"] },
  { code: "CHIS", short: "中史", names: ["中國歷史", "中史"] },
  { code: "HIST", short: "歷史", names: ["歷史"] },
  { code: "GEOG", short: "地理", names: ["地理"] },
  { code: "ECON", short: "經濟", names: ["經濟"] },
  { code: "CLIT", short: "文學", names: ["中國文學", "文學"] },
  { code: "THS", short: "旅款", names: ["旅遊與款待", "旅款"] },
  { code: "PHY", short: "物理", names: ["物理"] },
  { code: "CHEM", short: "化學", names: ["化學"] },
  { code: "BIO", short: "生物", names: ["生物"] },
  { code: "ICT", short: "ICT", names: ["資訊及通訊科技 (ICT)", "資訊及通訊科技", "ICT"] },
  { code: "DAT", short: "設計", names: ["設計與應用科技", "設計"] },
  { code: "BAFS", short: "企會財", names: ["企業、會計與財務概論", "企會財", "BAFS"] },
  { code: "VA", short: "視藝", names: ["視覺藝術", "視藝"] },
  { code: "MUS", short: "音樂", names: ["音樂"] },
  { code: "PE", short: "體育", names: ["體育"] },
  { code: "HMSC", short: "健管", names: ["健康管理與社會關懷", "健管"] },
]

const GRADE_NUM = "一二三四五六"

const GRADE_ORDER = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `小${GRADE_NUM[n - 1]}`, code: `P${n}` })),
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `中${GRADE_NUM[n - 1]}`, code: `S${n}` })),
]

const DAY_CANON: Record<string, string> = {
  星期一: "星期一",
  星期二: "星期二",
  星期三: "星期三",
  星期四: "星期四",
  星期五: "星期五",
  星期六: "星期六",
  星期日: "星期日",
  週一: "星期一",
  週二: "星期二",
  週三: "星期三",
  週四: "星期四",
  週五: "星期五",
  週六: "星期六",
  週日: "星期日",
  周一: "星期一",
  周二: "星期二",
  周三: "星期三",
  周四: "星期四",
  周五: "星期五",
  周六: "星期六",
  周日: "星期日",
}

const DAY_RANK = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]

type Alias = { code: string; short: string; names: string[]; text: string; latin: boolean }

const ALIASES: Alias[] = SUBJECTS.flatMap((subject) => {
  const seen = new Set<string>()
  const rows: Alias[] = []
  for (const text of subject.names) {
    const key = text.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      code: subject.code,
      short: subject.short,
      names: subject.names,
      text,
      latin: /^[A-Z0-9]+$/i.test(text),
    })
  }
  return rows
}).sort((a, b) => b.text.length - a.text.length)

const NOT_CATALOGUE =
  /點名|名單|出席|請假|學費|繳費|如何|點樣|怎樣|怎麼|步驟|學生|試堂|補堂|補課|退讀/

const FILLERS = [
  "可唔可以",
  "可不可以",
  "有哪些",
  "有什麼",
  "有幾多",
  "時間表",
  "幫我",
  "請你",
  "查詢",
  "查下",
  "睇下",
  "看下",
  "一下",
  "班別",
  "邊班",
  "有咩",
  "幾多",
  "人數",
  "現時",
  "目前",
  "最新",
  "情況",
  "上課",
  "而家",
  "依家",
  "現在",
  "列出",
  "顯示",
  "所有",
  "全部",
  "還有",
  "以及",
  "同埋",
  "知道",
  "請",
  "查",
  "睇",
  "看",
  "呀",
  "呢",
  "嗎",
  "嘛",
  "吧",
  "同",
  "和",
  "及",
  "跟",
  "與",
  "再",
  "要",
  "想",
  "有",
  "班",
].sort((a, b) => b.length - a.length)

type Token =
  | { kind: "grade"; label: string; code: string }
  | { kind: "subject"; code: string; short: string; names: string[] }
  | { kind: "section"; letter: string }

const MAX_REQUESTS = 12

function matchGrade(text: string, i: number): { end: number; label: string; code: string } | null {
  const prev = i > 0 ? text[i - 1] : ""
  if (prev && /[A-Za-z0-9]/.test(prev)) return null
  const slice = text.slice(i)
  const cn = /^(小|中)([一二三四五六])級?/.exec(slice)
  if (cn) {
    const n = GRADE_NUM.indexOf(cn[2]) + 1
    const label = `${cn[1]}${cn[2]}`
    const code = `${cn[1] === "小" ? "P" : "S"}${n}`
    return { end: i + cn[0].length, label, code }
  }
  const en = /^([PSF])([1-6])(?![0-9A-Za-z])/i.exec(slice)
  if (!en) return null
  const n = Number(en[2])
  const primary = en[1].toUpperCase() === "P"
  return {
    end: i + en[0].length,
    label: `${primary ? "小" : "中"}${GRADE_NUM[n - 1]}`,
    code: `${primary ? "P" : "S"}${n}`,
  }
}

function matchSubject(text: string, i: number): { end: number; alias: Alias } | null {
  const slice = text.slice(i)
  for (const alias of ALIASES) {
    if (slice.length < alias.text.length) continue
    const head = slice.slice(0, alias.text.length)
    if (alias.latin) {
      if (head.toUpperCase() !== alias.text.toUpperCase()) continue
      const next = slice[alias.text.length] ?? ""
      if (/[A-Za-z0-9]/.test(next)) continue
      return { end: i + alias.text.length, alias }
    }
    if (head === alias.text) return { end: i + alias.text.length, alias }
  }
  return null
}

function matchSection(text: string, i: number): { end: number; letter: string } | null {
  const prev = i > 0 ? text[i - 1] : ""
  if (prev && /[A-Za-z0-9]/.test(prev)) return null
  const slice = text.slice(i)
  const withClass = /^([A-Za-z])班/.exec(slice)
  if (withClass) return { end: i + withClass[0].length, letter: withClass[1].toUpperCase() }
  const listed = /^([A-Za-z])(?=、)/.exec(slice)
  if (listed) return { end: i + 1, letter: listed[1].toUpperCase() }
  return null
}

function leftoverIsEmpty(text: string, consumed: boolean[]): boolean {
  let rest = ""
  for (let i = 0; i < text.length; i++) {
    if (!consumed[i]) rest += text[i]
  }
  let prev = ""
  while (rest !== prev) {
    prev = rest
    for (const filler of FILLERS) {
      rest = rest.split(filler).join("")
    }
  }
  rest = rest.replace(/[\s，,、。．.！!？?：:;；~～/／+＋·・的]/g, "")
  return rest.length === 0
}

function unique(letters: string[]): string[] {
  return [...new Set(letters)]
}

/** 一句內可含多於一個年級、多於一個科目、以及 A班／B班。不是班別目錄則回傳 null。 */
export function parseGradeSubjectCatalogue(text: string): GradeSubjectRequest[] | null {
  const raw = text.trim()
  if (!raw || NOT_CATALOGUE.test(raw)) return null

  const consumed = Array.from({ length: raw.length }, () => false)
  const tokens: Token[] = []
  let i = 0
  while (i < raw.length) {
    if (/\s/.test(raw[i] ?? "")) {
      consumed[i] = true
      i += 1
      continue
    }
    const grade = matchGrade(raw, i)
    if (grade) {
      tokens.push({ kind: "grade", label: grade.label, code: grade.code })
      for (let p = i; p < grade.end; p++) consumed[p] = true
      i = grade.end
      continue
    }
    const subject = matchSubject(raw, i)
    if (subject) {
      tokens.push({
        kind: "subject",
        code: subject.alias.code,
        short: subject.alias.short,
        names: subject.alias.names,
      })
      for (let p = i; p < subject.end; p++) consumed[p] = true
      i = subject.end
      continue
    }
    const section = matchSection(raw, i)
    if (section) {
      tokens.push({ kind: "section", letter: section.letter })
      for (let p = i; p < section.end; p++) consumed[p] = true
      i = section.end
      continue
    }
    i += 1
  }

  if (!leftoverIsEmpty(raw, consumed)) return null
  if (!tokens.some((token) => token.kind === "grade") || !tokens.some((token) => token.kind === "subject")) {
    return null
  }

  type GradeTok = { label: string; code: string }
  type Draft = {
    grades: GradeTok[]
    code: string
    short: string
    names: string[]
    sections: string[]
  }
  let pendingGrades: GradeTok[] = []
  let pendingSections: string[] = []
  let current: Draft | null = null
  const expanded: GradeSubjectRequest[] = []

  const pushCurrent = () => {
    if (!current) return
    for (const grade of current.grades) {
      expanded.push({
        gradeLabel: grade.label,
        gradeCode: grade.code,
        subjectCode: current.code,
        subjectShort: current.short,
        subjectNames: current.names,
        sections: unique(current.sections),
      })
    }
    current = null
  }

  for (const token of tokens) {
    if (token.kind === "grade") {
      if (current) {
        pushCurrent()
        pendingSections = []
      }
      pendingGrades.push({ label: token.label, code: token.code })
      continue
    }
    if (token.kind === "section") {
      if (current) current.sections.push(token.letter)
      else pendingSections.push(token.letter)
      continue
    }
    const grades: GradeTok[] = pendingGrades.length > 0 ? pendingGrades : (current?.grades ?? [])
    if (grades.length === 0) return null
    pushCurrent()
    current = {
      grades: grades.map((grade) => ({ ...grade })),
      code: token.code,
      short: token.short,
      names: token.names,
      sections: [...pendingSections],
    }
    pendingGrades = []
    pendingSections = []
  }
  pushCurrent()
  if (pendingGrades.length > 0 || expanded.length === 0 || expanded.length > MAX_REQUESTS) return null

  const seen = new Set<string>()
  const deduped: GradeSubjectRequest[] = []
  for (const request of expanded) {
    const key = `${request.gradeCode}|${request.subjectCode}|${request.sections.join(",")}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(request)
  }
  return deduped
}

export function formatCatalogueTimeSlot(slot: string | null | undefined): string {
  const raw = slot?.trim() ?? ""
  if (!raw) return ""
  const matched = raw.match(/(\d{1,2}):(\d{2})\s*[–—\-至]\s*(\d{1,2}):(\d{2})/)
  if (!matched) return raw
  const startHour = Number(matched[1])
  const endHour = Number(matched[3])
  const period = startHour < 12 ? "上午" : "下午"
  const hour12 = (hour: number) => {
    const value = hour % 12
    return value === 0 ? 12 : value
  }
  return `${period}${hour12(startHour)}:${matched[2]}-${hour12(endHour)}:${matched[4]}`
}

function canonicalDay(token: string): string {
  const trimmed = token.trim()
  if (!trimmed) return ""
  if (DAY_CANON[trimmed]) return DAY_CANON[trimmed]
  if (DAY_CANON[`星期${trimmed}`]) return DAY_CANON[`星期${trimmed}`]
  return trimmed
}

export function formatCatalogueWeekday(raw: string | null | undefined): string {
  const text = raw?.trim() ?? ""
  if (!text) return ""
  const parts = text.split(/[,，、]/).map(canonicalDay).filter(Boolean)
  if (parts.length === 0) return text
  return parts.join("、")
}

function courseBase(code: string): string {
  const trimmed = code.trim()
  const matched = trimmed.match(/^(.*)-([A-Za-z][0-9]?)$/)
  return matched ? matched[1] : trimmed
}

function sectionLetter(row: CatalogueClassRow): string {
  const stored = row.section_code?.trim()
  if (stored) return stored.toUpperCase()
  const code = row.course_code_full?.trim() ?? ""
  const matched = code.match(/-([A-Za-z][0-9]?)$/)
  return matched ? matched[1].toUpperCase() : "—"
}

function dayRank(raw: string | null | undefined): number {
  const day = formatCatalogueWeekday(raw).split("、")[0] ?? ""
  const index = DAY_RANK.indexOf(day)
  return index === -1 ? 99 : index
}

function formatClassLine(row: CatalogueClassRow): string {
  const day = formatCatalogueWeekday(row.day_of_week)
  const time = formatCatalogueTimeSlot(row.time_slot)
  const teacher = row.teacher_name?.trim() || "未指派"
  const count = Number(row.enrolled_count ?? 0)
  const bits = [`${sectionLetter(row)}班`]
  if (day) bits.push(`逢${day}`)
  if (time) bits.push(time)
  bits.push(teacher)
  return `${bits.join(" ")}（${Number.isFinite(count) ? count : 0}人）`
}

function formatOneRequest(request: GradeSubjectRequest, rows: CatalogueClassRow[]): string {
  const title = `${request.gradeLabel}級${request.subjectShort}`
  if (rows.length === 0) return `${title}\n目前沒有進行中的班別。`
  const sorted = [...rows].sort((a, b) => {
    const base = courseBase(a.course_code_full ?? "").localeCompare(courseBase(b.course_code_full ?? ""), "en")
    if (base !== 0) return base
    const section = sectionLetter(a).localeCompare(sectionLetter(b), "en")
    if (section !== 0) return section
    const day = dayRank(a.day_of_week) - dayRank(b.day_of_week)
    if (day !== 0) return day
    return (a.time_slot ?? "").localeCompare(b.time_slot ?? "", "en")
  })
  const groups: { base: string; lines: string[] }[] = []
  for (const row of sorted) {
    const base = courseBase(row.course_code_full ?? "") || "—"
    const last = groups[groups.length - 1]
    if (!last || last.base !== base) groups.push({ base, lines: [formatClassLine(row)] })
    else last.lines.push(formatClassLine(row))
  }
  const body = groups.map((group) => `${group.base}\n${group.lines.join("\n")}`).join("\n\n")
  return `${title}\n${body}`
}

export function formatGradeSubjectCatalogue(
  requests: GradeSubjectRequest[],
  classes: CatalogueClassRow[]
): string {
  return requests
    .map((request, index) => {
      const rows = classes.filter((row) => Number(row.filter_index) === index + 1)
      return formatOneRequest(request, rows)
    })
    .join("\n\n")
}

export function catalogueFollowUpSuggestions(requests: GradeSubjectRequest[]): string[] {
  if (requests.length !== 1) return []
  const request = requests[0]
  const index = GRADE_ORDER.findIndex((grade) => grade.code === request.gradeCode)
  if (index < 0) return []
  const neighbors = [GRADE_ORDER[index - 1], GRADE_ORDER[index + 1]].filter(
    (grade): grade is { label: string; code: string } => grade != null
  )
  return neighbors.map((grade) => `${grade.label}級${request.subjectShort}`)
}
