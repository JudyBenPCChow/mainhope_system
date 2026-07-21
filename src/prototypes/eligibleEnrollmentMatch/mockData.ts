/**
 * 可報讀學生配對沙盒：純假資料，不連業務 DB。
 *
 * 規則（mock 版簡化）：
 * 1. 目標班別 = 全期報讀人數 > 1 的小組班
 * 2. 候選學生 = 已註冊，且尚未報讀該班
 * 3. 年級合適 = 學生年級標籤落在班別適用年級內
 * 4. 時間合適 = 與學生現有就讀班別的「星期 × 時段」不重疊
 */

export type MockWeekday = "一" | "二" | "三" | "四" | "五" | "六" | "日"

export type MockEnrollmentPeriod = "報足全期" | "第一期" | "第二期" | "兩期全報" | "單堂"

export type MockClass = {
  id: string
  label: string
  subject: string
  grades: string[]
  dayOfWeek: MockWeekday[]
  /** 例如 "16:00–17:30" */
  timeSlot: string
  teacherName: string
  capacity: number
  courseMode: "regular" | "summer_two_period"
}

export type MockStudent = {
  id: string
  studentCode: string
  fullName: string
  englishName: string
  /** 中文年級標籤，如「中三」 */
  grade: string
  registrationStatus: "已註冊" | "非注冊"
  parentPhone: string
}

export type MockEnrollment = {
  id: string
  studentId: string
  classId: string
  period: MockEnrollmentPeriod
  status: "就讀中" | "已退讀"
}

export type ExclusionReason =
  | "非注冊"
  | "年級不合"
  | "時間衝突"
  | "已報讀本班"
  | "已退讀本班"

export type EligibleCandidate = {
  student: MockStudent
  currentClasses: Array<{
    classId: string
    label: string
    dayOfWeek: MockWeekday[]
    timeSlot: string
    period: MockEnrollmentPeriod
  }>
}

export type ExcludedCandidate = {
  student: MockStudent
  reasons: ExclusionReason[]
  conflictWith?: string
}

export type ClassMatchBundle = {
  cls: MockClass
  /** 全期就讀中人數 */
  fullTermCount: number
  fullTermStudents: MockStudent[]
  eligible: EligibleCandidate[]
  excluded: ExcludedCandidate[]
}

export type EligibleClassForStudent = {
  cls: MockClass
  fullTermCount: number
  /** 是否達「全期 > 1」熱門門檻 */
  isHotFullTerm: boolean
}

export type BlockedClassForStudent = {
  cls: MockClass
  fullTermCount: number
  isHotFullTerm: boolean
  reasons: ExclusionReason[]
  conflictWith?: string
}

export type StudentMatchBundle = {
  student: MockStudent
  currentClasses: EligibleCandidate["currentClasses"]
  /** 年級合適且可報（未報讀、無衝突） */
  eligible: EligibleClassForStudent[]
  /** 同年級但因已報讀／時間衝突而不能報 */
  blocked: BlockedClassForStudent[]
}
const FULL_TERM_PERIODS = new Set<MockEnrollmentPeriod>(["報足全期", "兩期全報"])

export function isFullTermPeriod(period: MockEnrollmentPeriod): boolean {
  return FULL_TERM_PERIODS.has(period)
}

/** "16:00–17:30" → 分鐘區間；解析失敗回傳 null */
export function parseTimeSlotMinutes(slot: string): { start: number; end: number } | null {
  const m = slot.trim().match(/^(\d{1,2}):(\d{2})\s*[–\-~至]\s*(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const start = Number(m[1]) * 60 + Number(m[2])
  const end = Number(m[3]) * 60 + Number(m[4])
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return { start, end }
}

function intervalsOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end
}

export function weekdaysOverlap(a: MockWeekday[], b: MockWeekday[]): boolean {
  const set = new Set(a)
  return b.some((d) => set.has(d))
}

export function timeSlotsConflict(
  dayA: MockWeekday[],
  slotA: string,
  dayB: MockWeekday[],
  slotB: string
): boolean {
  if (!weekdaysOverlap(dayA, dayB)) return false
  const ia = parseTimeSlotMinutes(slotA)
  const ib = parseTimeSlotMinutes(slotB)
  if (!ia || !ib) return weekdaysOverlap(dayA, dayB)
  return intervalsOverlap(ia, ib)
}

export function formatWeekdays(days: MockWeekday[]): string {
  if (days.length === 0) return "—"
  if (days.length === 1) return `逢${days[0]}`
  return `逢${days.join("、")}`
}

export const MOCK_CLASSES: MockClass[] = [
  {
    id: "c-eng-s3-sat",
    label: "英文 · 中三小組（六）",
    subject: "英文",
    grades: ["中三"],
    dayOfWeek: ["六"],
    timeSlot: "10:00–11:30",
    teacherName: "陳老師",
    capacity: 8,
    courseMode: "regular",
  },
  {
    id: "c-math-s3-wed",
    label: "數學 · 中三小組（三）",
    subject: "數學",
    grades: ["中三"],
    dayOfWeek: ["三"],
    timeSlot: "16:00–17:30",
    teacherName: "李老師",
    capacity: 8,
    courseMode: "regular",
  },
  {
    id: "c-chi-s4-fri",
    label: "中文 · 中四小組（五）",
    subject: "中文",
    grades: ["中四"],
    dayOfWeek: ["五"],
    timeSlot: "17:45–19:15",
    teacherName: "黃老師",
    capacity: 6,
    courseMode: "regular",
  },
  {
    id: "c-chem-s5-sun",
    label: "化學 · 中五小組（日）",
    subject: "化學",
    grades: ["中五"],
    dayOfWeek: ["日"],
    timeSlot: "14:00–15:30",
    teacherName: "張老師",
    capacity: 6,
    courseMode: "regular",
  },
  {
    id: "c-eng-s4-sat-pm",
    label: "英文 · 中四小組（六下午）",
    subject: "英文",
    grades: ["中四"],
    dayOfWeek: ["六"],
    timeSlot: "14:00–15:30",
    teacherName: "陳老師",
    capacity: 8,
    courseMode: "regular",
  },
  {
    id: "c-math-s1-tue",
    label: "數學 · 中一小組（二）",
    subject: "數學",
    grades: ["中一"],
    dayOfWeek: ["二"],
    timeSlot: "16:00–17:30",
    teacherName: "王老師",
    capacity: 10,
    courseMode: "regular",
  },
  {
    id: "c-phy-s5-thu",
    label: "物理 · 中五小組（四）",
    subject: "物理",
    grades: ["中五"],
    dayOfWeek: ["四"],
    timeSlot: "16:00–17:30",
    teacherName: "周老師",
    capacity: 6,
    courseMode: "regular",
  },
  {
    id: "c-eng-s3-only1",
    label: "英文 · 中三進階（日）",
    subject: "英文",
    grades: ["中三"],
    dayOfWeek: ["日"],
    timeSlot: "10:00–11:30",
    teacherName: "陳老師",
    capacity: 6,
    courseMode: "regular",
  },
]

export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: "s-01",
    studentCode: "MH24001",
    fullName: "陳浩然",
    englishName: "Chris Chan",
    grade: "中三",
    registrationStatus: "已註冊",
    parentPhone: "9123 0001",
  },
  {
    id: "s-02",
    studentCode: "MH24002",
    fullName: "李思澄",
    englishName: "Sze Ching Lee",
    grade: "中三",
    registrationStatus: "已註冊",
    parentPhone: "9123 0002",
  },
  {
    id: "s-03",
    studentCode: "MH24003",
    fullName: "黃嘉欣",
    englishName: "Karen Wong",
    grade: "中三",
    registrationStatus: "已註冊",
    parentPhone: "9123 0003",
  },
  {
    id: "s-04",
    studentCode: "MH24004",
    fullName: "張宇軒",
    englishName: "Hugo Cheung",
    grade: "中三",
    registrationStatus: "已註冊",
    parentPhone: "9123 0004",
  },
  {
    id: "s-05",
    studentCode: "MH24005",
    fullName: "林婉婷",
    englishName: "Winnie Lam",
    grade: "中四",
    registrationStatus: "已註冊",
    parentPhone: "9123 0005",
  },
  {
    id: "s-06",
    studentCode: "MH24006",
    fullName: "吳俊傑",
    englishName: "Ken Ng",
    grade: "中四",
    registrationStatus: "已註冊",
    parentPhone: "9123 0006",
  },
  {
    id: "s-07",
    studentCode: "MH24007",
    fullName: "鄭詩詠",
    englishName: "Sylvia Cheng",
    grade: "中四",
    registrationStatus: "已註冊",
    parentPhone: "9123 0007",
  },
  {
    id: "s-08",
    studentCode: "MH24008",
    fullName: "何啟明",
    englishName: "Kevin Ho",
    grade: "中五",
    registrationStatus: "已註冊",
    parentPhone: "9123 0008",
  },
  {
    id: "s-09",
    studentCode: "MH24009",
    fullName: "梁雅文",
    englishName: "Ava Leung",
    grade: "中五",
    registrationStatus: "已註冊",
    parentPhone: "9123 0009",
  },
  {
    id: "s-10",
    studentCode: "MH24010",
    fullName: "謝卓衡",
    englishName: "Derek Tse",
    grade: "中一",
    registrationStatus: "已註冊",
    parentPhone: "9123 0010",
  },
  {
    id: "s-11",
    studentCode: "MH24011",
    fullName: "馮芷晴",
    englishName: "Cherry Fung",
    grade: "中三",
    registrationStatus: "非注冊",
    parentPhone: "9123 0011",
  },
  {
    id: "s-12",
    studentCode: "MH24012",
    fullName: "鄧曉彤",
    englishName: "Tiffany Tang",
    grade: "中五",
    registrationStatus: "已註冊",
    parentPhone: "9123 0012",
  },
  {
    id: "s-13",
    studentCode: "MH24013",
    fullName: "蔡子健",
    englishName: "Jason Choi",
    grade: "中四",
    registrationStatus: "已註冊",
    parentPhone: "9123 0013",
  },
  {
    id: "s-14",
    studentCode: "MH24014",
    fullName: "葉心怡",
    englishName: "Cindy Yip",
    grade: "中一",
    registrationStatus: "已註冊",
    parentPhone: "9123 0014",
  },
]

/**
 * 報讀關係設計重點：
 * - 英文中三（六）：3 人全期 → 目標班
 * - 數學中三（三）：2 人全期 → 目標班
 * - 中文中四（五）：2 人全期 → 目標班
 * - 化學中五（日）：2 人全期 → 目標班
 * - 英文中四（六下午）：2 人全期 → 目標班
 * - 數學中一（二）：僅 1 人全期 → 不列入
 * - 物理中五（四）：0 人 → 不列入
 * - 英文中三進階（日）：僅 1 人 → 不列入
 */
export const MOCK_ENROLLMENTS: MockEnrollment[] = [
  // 英文中三（六）— 3 人全期
  { id: "e-01", studentId: "s-01", classId: "c-eng-s3-sat", period: "報足全期", status: "就讀中" },
  { id: "e-02", studentId: "s-02", classId: "c-eng-s3-sat", period: "報足全期", status: "就讀中" },
  { id: "e-03", studentId: "s-03", classId: "c-eng-s3-sat", period: "報足全期", status: "就讀中" },
  // 數學中三（三）— 2 人全期；s-04 亦報讀此班（與英文中三可配對）
  { id: "e-04", studentId: "s-01", classId: "c-math-s3-wed", period: "報足全期", status: "就讀中" },
  { id: "e-05", studentId: "s-04", classId: "c-math-s3-wed", period: "報足全期", status: "就讀中" },
  // 中文中四（五）— 2 人全期
  { id: "e-06", studentId: "s-05", classId: "c-chi-s4-fri", period: "報足全期", status: "就讀中" },
  { id: "e-07", studentId: "s-06", classId: "c-chi-s4-fri", period: "報足全期", status: "就讀中" },
  // 化學中五（日）— 2 人全期
  { id: "e-08", studentId: "s-08", classId: "c-chem-s5-sun", period: "報足全期", status: "就讀中" },
  { id: "e-09", studentId: "s-09", classId: "c-chem-s5-sun", period: "報足全期", status: "就讀中" },
  // 英文中四（六下午）— 2 人全期；s-13 同時報讀中文中四，時段不衝突
  { id: "e-10", studentId: "s-07", classId: "c-eng-s4-sat-pm", period: "報足全期", status: "就讀中" },
  { id: "e-11", studentId: "s-13", classId: "c-eng-s4-sat-pm", period: "報足全期", status: "就讀中" },
  // 數學中一 — 僅 1 人（不達門檻）
  { id: "e-12", studentId: "s-10", classId: "c-math-s1-tue", period: "報足全期", status: "就讀中" },
  // 英文中三進階 — 僅 1 人
  { id: "e-13", studentId: "s-02", classId: "c-eng-s3-only1", period: "報足全期", status: "就讀中" },
  // s-12 報讀物理（四）— 讓化學中五可推薦她；另加一筆衝突示範：她若考慮英文中四不會衝突，但年級不合
  { id: "e-14", studentId: "s-12", classId: "c-phy-s5-thu", period: "報足全期", status: "就讀中" },
  // s-04 另有星期六英文衝突示範：與「英文中三」同日同時段（已在該班）
  // s-03 另報讀一班星期六下午，測試英文中四時段（年級不合所以不會出現在英文中四）
  { id: "e-15", studentId: "s-05", classId: "c-eng-s4-sat-pm", period: "第一期", status: "就讀中" },
  // 單堂不計入全期人數
  { id: "e-16", studentId: "s-06", classId: "c-eng-s4-sat-pm", period: "單堂", status: "就讀中" },
]

function studentById(id: string): MockStudent | undefined {
  return MOCK_STUDENTS.find((s) => s.id === id)
}

function classById(id: string): MockClass | undefined {
  return MOCK_CLASSES.find((c) => c.id === id)
}

function activeEnrollmentsForStudent(studentId: string): MockEnrollment[] {
  return MOCK_ENROLLMENTS.filter((e) => e.studentId === studentId && e.status === "就讀中")
}

function fullTermActiveForClass(classId: string): MockEnrollment[] {
  return MOCK_ENROLLMENTS.filter(
    (e) => e.classId === classId && e.status === "就讀中" && isFullTermPeriod(e.period)
  )
}

function currentClassesOf(studentId: string): EligibleCandidate["currentClasses"] {
  return activeEnrollmentsForStudent(studentId)
    .map((e) => {
      const c = classById(e.classId)
      if (!c) return null
      return {
        classId: c.id,
        label: c.label,
        dayOfWeek: c.dayOfWeek,
        timeSlot: c.timeSlot,
        period: e.period,
      }
    })
    .filter((x): x is EligibleCandidate["currentClasses"][number] => x != null)
}

/** 評估學生對某班是否可報；回傳空 reasons = 可報 */
function evaluateStudentForClass(
  student: MockStudent,
  cls: MockClass
): { reasons: ExclusionReason[]; conflictWith?: string } {
  const reasons: ExclusionReason[] = []
  let conflictWith: string | undefined

  if (student.registrationStatus !== "已註冊") {
    reasons.push("非注冊")
  }

  if (!cls.grades.includes(student.grade)) {
    reasons.push("年級不合")
  }

  const ens = activeEnrollmentsForStudent(student.id)
  const already = ens.find((e) => e.classId === cls.id)
  if (already) {
    reasons.push(already.status === "已退讀" ? "已退讀本班" : "已報讀本班")
  }

  for (const en of ens) {
    if (en.classId === cls.id) continue
    const other = classById(en.classId)
    if (!other) continue
    if (timeSlotsConflict(cls.dayOfWeek, cls.timeSlot, other.dayOfWeek, other.timeSlot)) {
      reasons.push("時間衝突")
      conflictWith = `${other.label}（${formatWeekdays(other.dayOfWeek)} ${other.timeSlot}）`
      break
    }
  }

  return { reasons: [...new Set(reasons)], conflictWith }
}

export function buildClassMatchBundles(minFullTerm = 2): ClassMatchBundle[] {
  const bundles: ClassMatchBundle[] = []

  for (const cls of MOCK_CLASSES) {
    const fullTermEns = fullTermActiveForClass(cls.id)
    if (fullTermEns.length < minFullTerm) continue

    const fullTermStudents = fullTermEns
      .map((e) => studentById(e.studentId))
      .filter((s): s is MockStudent => s != null)

    const eligible: EligibleCandidate[] = []
    const excluded: ExcludedCandidate[] = []

    for (const student of MOCK_STUDENTS) {
      const { reasons, conflictWith } = evaluateStudentForClass(student, cls)

      if (reasons.length === 0) {
        eligible.push({
          student,
          currentClasses: currentClassesOf(student.id),
        })
      } else {
        // 只保留「有機會相關」的排除：同年級或已報讀本班，避免整表噪音
        const gradeOk = cls.grades.includes(student.grade)
        const related = gradeOk || reasons.includes("已報讀本班")
        if (related) {
          excluded.push({ student, reasons, conflictWith })
        }
      }
    }

    eligible.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "zh-Hant"))
    excluded.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "zh-Hant"))

    bundles.push({
      cls,
      fullTermCount: fullTermEns.length,
      fullTermStudents,
      eligible,
      excluded,
    })
  }

  return bundles.sort((a, b) => b.fullTermCount - a.fullTermCount || a.cls.label.localeCompare(b.cls.label, "zh-Hant"))
}

/**
 * 以已註冊學生為單位：列出年級合適且可報的班別。
 * - eligible：年級合、未報讀、無時段衝突
 * - blocked：同年級但已報讀／時間衝突（方便對照）
 */
export function buildStudentMatchBundles(minFullTermHot = 2): StudentMatchBundle[] {
  const bundles: StudentMatchBundle[] = []

  for (const student of MOCK_STUDENTS) {
    if (student.registrationStatus !== "已註冊") continue

    const eligible: EligibleClassForStudent[] = []
    const blocked: BlockedClassForStudent[] = []

    for (const cls of MOCK_CLASSES) {
      if (!cls.grades.includes(student.grade)) continue

      const fullTermCount = fullTermActiveForClass(cls.id).length
      const isHotFullTerm = fullTermCount >= minFullTermHot
      const { reasons, conflictWith } = evaluateStudentForClass(student, cls)

      if (reasons.length === 0) {
        eligible.push({ cls, fullTermCount, isHotFullTerm })
      } else {
        // 同年級範圍內：略過「年級不合／非注冊」（此處不會出現）
        blocked.push({ cls, fullTermCount, isHotFullTerm, reasons, conflictWith })
      }
    }

    eligible.sort(
      (a, b) =>
        Number(b.isHotFullTerm) - Number(a.isHotFullTerm) ||
        b.fullTermCount - a.fullTermCount ||
        a.cls.label.localeCompare(b.cls.label, "zh-Hant")
    )
    blocked.sort((a, b) => a.cls.label.localeCompare(b.cls.label, "zh-Hant"))

    bundles.push({
      student,
      currentClasses: currentClassesOf(student.id),
      eligible,
      blocked,
    })
  }

  return bundles.sort(
    (a, b) =>
      b.eligible.length - a.eligible.length ||
      a.student.grade.localeCompare(b.student.grade, "zh-Hant") ||
      a.student.fullName.localeCompare(b.student.fullName, "zh-Hant")
  )
}
