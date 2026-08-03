/**
 * 2026-07 離線計糧結果（來源：Desktop mainhope-07payroll / out/_raw-summary.json）
 * 人工成本 = gross + employerMpf（僱主總負擔估算）
 * 以姓名對應 teachers；開頁不重跑引擎。
 */
export const STAFF_LABOR_JULY_2026_MONTH = "2026-07"

export type StaffLaborSnapshotRow = {
  /** 顯示名（與糧單一致） */
  name: string
  /** 用來匹配 teachers.full_name 的別名 */
  matchNames: string[]
  gross: number
  employerMpf: number
  lessonCount: number
}

export const STAFF_LABOR_JULY_2026: StaffLaborSnapshotRow[] = [
  {
    name: "Christine Fan",
    matchNames: ["Christine Fan"],
    gross: 11592.5,
    employerMpf: 579.63,
    lessonCount: 22,
  },
  {
    name: "Katie Lee",
    matchNames: ["Katie Lee"],
    gross: 20000,
    employerMpf: 1000,
    lessonCount: 25,
  },
  {
    name: "Mark Yu",
    matchNames: ["Mark Yu"],
    gross: 14462.5,
    employerMpf: 723.13,
    lessonCount: 39,
  },
  {
    name: "Sophie Yu",
    matchNames: ["Sophie Yu"],
    gross: 16000,
    employerMpf: 800,
    lessonCount: 0,
  },
  {
    name: "Billy Shek",
    matchNames: ["Billy Shek"],
    gross: 600,
    employerMpf: 0,
    lessonCount: 6,
  },
  {
    name: "Cheryl Ng",
    matchNames: ["Cheryl Ng"],
    gross: 5870,
    employerMpf: 0,
    lessonCount: 33,
  },
  {
    name: "Cody Cheong",
    matchNames: ["Cody Cheong"],
    gross: 0,
    employerMpf: 0,
    lessonCount: 0,
  },
  {
    name: "Cyndi Ng",
    matchNames: ["Cyndi Ng"],
    gross: 6400,
    employerMpf: 0,
    lessonCount: 15,
  },
  {
    name: "Henry Wong",
    matchNames: ["Henry Wong"],
    gross: 0,
    employerMpf: 0,
    lessonCount: 6,
  },
  {
    name: "Jackson Lau（Sum）",
    matchNames: ["Jackson Lau（Sum）", "Jackson Lau", "Jackson Lau (Sum)"],
    gross: 6768,
    employerMpf: 0,
    lessonCount: 15,
  },
  {
    name: "Kenneth Li",
    matchNames: ["Kenneth Li"],
    gross: 7200,
    employerMpf: 0,
    lessonCount: 24,
  },
  {
    name: "Leo Chan",
    matchNames: ["Leo Chan"],
    gross: 1180,
    employerMpf: 0,
    lessonCount: 6,
  },
  {
    name: "Liam Lai",
    matchNames: ["Liam Lai"],
    gross: 3960,
    employerMpf: 0,
    lessonCount: 17,
  },
  {
    name: "Natalie Kwok",
    matchNames: ["Natalie Kwok"],
    gross: 0,
    employerMpf: 0,
    lessonCount: 0,
  },
  {
    name: "Phoebe Tam",
    matchNames: ["Phoebe Tam"],
    gross: 0,
    employerMpf: 0,
    lessonCount: 0,
  },
  {
    name: "Rafael Ling",
    matchNames: ["Rafael Ling"],
    gross: 0,
    employerMpf: 0,
    lessonCount: 3,
  },
]

export function laborEmployerCost(row: StaffLaborSnapshotRow): number {
  return Math.round((row.gross + row.employerMpf) * 100) / 100
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** 依老師姓名查找 2026-07 人工快照 */
export function findJuly2026LaborByTeacherName(
  fullName: string | null | undefined
): StaffLaborSnapshotRow | null {
  if (!fullName) return null
  const target = normalizeName(fullName)
  for (const row of STAFF_LABOR_JULY_2026) {
    for (const alias of row.matchNames) {
      if (normalizeName(alias) === target) return row
      if (target.includes(normalizeName(alias)) || normalizeName(alias).includes(target)) {
        return row
      }
    }
  }
  return null
}
