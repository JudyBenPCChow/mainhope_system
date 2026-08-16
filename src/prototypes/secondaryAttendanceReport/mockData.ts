/** 中學出席分層報表 — 原型假資料（以老師為單位；不接 DB） */

export type MockLessonRow = {
  id: string
  date: string
  startTime: string
  endTime: string
  /** 實際出席學生姓名（含補堂／試堂）；同一人上 4 堂則在 4 堂各出現一次＝4 人次 */
  presentStudents: string[]
  /** 缺席學生姓名（no show 等） */
  absentStudents: string[]
  notRolled: boolean
  makeupOrTrialNote?: string
}

export type MockClassBlock = {
  id: string
  name: string
  /** 專科班／私人課程 */
  classKind: "group" | "private"
  lessons: MockLessonRow[]
}

export type MockGradeUnderTeacher = {
  gradeLabel: string
  classes: MockClassBlock[]
}

export type MockTeacherBlock = {
  id: string
  name: string
  grades: MockGradeUnderTeacher[]
}

export const MOCK_MONTH_LABEL = "2026-07"

function lesson(
  partial: Omit<MockLessonRow, "presentStudents" | "absentStudents"> & {
    presentStudents?: string[]
    absentStudents?: string[]
  }
): MockLessonRow {
  if (partial.notRolled) {
    return { ...partial, presentStudents: [], absentStudents: [] }
  }
  return {
    ...partial,
    presentStudents: partial.presentStudents ?? [],
    absentStudents: partial.absentStudents ?? [],
  }
}

export const MOCK_TEACHER_BLOCKS: MockTeacherBlock[] = [
  {
    id: "t-chen",
    name: "陳老師",
    grades: [
      {
        gradeLabel: "中一",
        classes: [
          {
            id: "c-chen-s1-math",
            name: "中一數學必修 A",
            classKind: "group",
            lessons: [
              lesson({
                id: "l1",
                date: "2026-07-03",
                startTime: "16:00",
                endTime: "17:30",
                notRolled: false,
                makeupOrTrialNote: "含試堂：林詩晴",
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "林詩晴",
                  "周啟明",
                  "吳嘉欣",
                  "鄭志偉",
                  "何佩珊",
                  "梁卓希",
                  "楊曉彤",
                ],
                absentStudents: ["劉俊宇"],
              }),
              lesson({
                id: "l2",
                date: "2026-07-10",
                startTime: "16:00",
                endTime: "17:30",
                notRolled: false,
                makeupOrTrialNote: "含補堂：馬天朗",
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "周啟明",
                  "吳嘉欣",
                  "鄭志偉",
                  "何佩珊",
                  "梁卓希",
                  "馬天朗",
                ],
                absentStudents: ["楊曉彤", "劉俊宇"],
              }),
              lesson({
                id: "l3",
                date: "2026-07-17",
                startTime: "16:00",
                endTime: "17:30",
                notRolled: true,
              }),
              lesson({
                id: "l4",
                date: "2026-07-24",
                startTime: "16:00",
                endTime: "17:30",
                notRolled: false,
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "周啟明",
                  "吳嘉欣",
                  "鄭志偉",
                  "何佩珊",
                  "梁卓希",
                  "楊曉彤",
                  "劉俊宇",
                  "馬天朗",
                ],
                absentStudents: [],
              }),
            ],
          },
        ],
      },
      {
        gradeLabel: "中二",
        classes: [
          {
            id: "c-chen-s2-math",
            name: "中二數學進階",
            classKind: "group",
            lessons: [
              lesson({
                id: "l5",
                date: "2026-07-04",
                startTime: "14:00",
                endTime: "16:30",
                notRolled: false,
                presentStudents: [
                  "蔡明慧",
                  "馮子軒",
                  "謝嘉怡",
                  "羅偉強",
                  "鄧詠詩",
                  "鍾浩銘",
                  "葉欣怡",
                  "潘俊希",
                  "盧詠琳",
                  "江子傑",
                ],
                absentStudents: ["溫卓妍"],
              }),
              lesson({
                id: "l6",
                date: "2026-07-11",
                startTime: "14:00",
                endTime: "16:30",
                notRolled: false,
                makeupOrTrialNote: "含補堂：溫卓妍",
                presentStudents: [
                  "蔡明慧",
                  "馮子軒",
                  "謝嘉怡",
                  "羅偉強",
                  "鄧詠詩",
                  "鍾浩銘",
                  "葉欣怡",
                  "潘俊希",
                  "盧詠琳",
                ],
                absentStudents: ["江子傑", "溫卓妍"],
              }),
              lesson({
                id: "l7",
                date: "2026-07-18",
                startTime: "14:00",
                endTime: "16:30",
                notRolled: false,
                presentStudents: [
                  "蔡明慧",
                  "馮子軒",
                  "謝嘉怡",
                  "羅偉強",
                  "鄧詠詩",
                  "鍾浩銘",
                  "葉欣怡",
                  "潘俊希",
                  "盧詠琳",
                  "江子傑",
                  "溫卓妍",
                ],
                absentStudents: [],
              }),
            ],
          },
          {
            id: "c-chen-s2-private",
            name: "中二數學一對一 · 溫卓妍",
            classKind: "private",
            lessons: [
              lesson({
                id: "l7b",
                date: "2026-07-05",
                startTime: "11:00",
                endTime: "12:30",
                notRolled: false,
                presentStudents: ["溫卓妍"],
                absentStudents: [],
              }),
              lesson({
                id: "l7c",
                date: "2026-07-12",
                startTime: "11:00",
                endTime: "12:30",
                notRolled: false,
                presentStudents: ["溫卓妍"],
                absentStudents: [],
              }),
              lesson({
                id: "l7d",
                date: "2026-07-19",
                startTime: "11:00",
                endTime: "12:30",
                notRolled: true,
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t-li",
    name: "李老師",
    grades: [
      {
        gradeLabel: "中一",
        classes: [
          {
            id: "c-li-s1-eng",
            name: "中一英文寫作",
            classKind: "group",
            lessons: [
              lesson({
                id: "l8",
                date: "2026-07-05",
                startTime: "10:00",
                endTime: "11:30",
                notRolled: false,
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "周啟明",
                  "吳嘉欣",
                  "鄭志偉",
                ],
                absentStudents: ["何佩珊"],
              }),
              lesson({
                id: "l9",
                date: "2026-07-12",
                startTime: "10:00",
                endTime: "11:30",
                notRolled: false,
                makeupOrTrialNote: "含試堂：蘇芷晴、方子軒",
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "周啟明",
                  "吳嘉欣",
                  "蘇芷晴",
                  "方子軒",
                ],
                absentStudents: [],
              }),
              lesson({
                id: "l10",
                date: "2026-07-19",
                startTime: "10:00",
                endTime: "11:30",
                notRolled: false,
                presentStudents: [
                  "陳浩然",
                  "王美玲",
                  "李俊傑",
                  "黃子晴",
                  "張家豪",
                  "周啟明",
                  "吳嘉欣",
                ],
                absentStudents: ["鄭志偉", "何佩珊"],
              }),
            ],
          },
          {
            id: "c-li-s1-private",
            name: "中一英文一對一 · 何佩珊",
            classKind: "private",
            lessons: [
              lesson({
                id: "l10b",
                date: "2026-07-06",
                startTime: "09:00",
                endTime: "10:00",
                notRolled: false,
                presentStudents: ["何佩珊"],
                absentStudents: [],
              }),
              lesson({
                id: "l10c",
                date: "2026-07-13",
                startTime: "09:00",
                endTime: "10:00",
                notRolled: false,
                presentStudents: ["何佩珊"],
                absentStudents: [],
              }),
            ],
          },
        ],
      },
      {
        gradeLabel: "中四",
        classes: [
          {
            id: "c-li-s4-chi",
            name: "中四中文精讀（一對一）",
            classKind: "private",
            lessons: [
              lesson({
                id: "l11",
                date: "2026-07-06",
                startTime: "15:00",
                endTime: "16:30",
                notRolled: false,
                presentStudents: ["郭子晴"],
                absentStudents: [],
              }),
              lesson({
                id: "l12",
                date: "2026-07-20",
                startTime: "15:00",
                endTime: "16:30",
                notRolled: false,
                presentStudents: ["郭子晴"],
                absentStudents: [],
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t-wong",
    name: "黃老師",
    grades: [
      {
        gradeLabel: "中三",
        classes: [
          {
            id: "c-wong-s3-chem",
            name: "中三化學",
            classKind: "group",
            lessons: [
              lesson({
                id: "l13",
                date: "2026-07-02",
                startTime: "17:45",
                endTime: "19:15",
                notRolled: false,
                presentStudents: [
                  "丁浩然",
                  "白美玲",
                  "石俊傑",
                  "金子晴",
                  "錢家豪",
                  "湯詩晴",
                  "尹啟明",
                  "常嘉欣",
                  "歐志偉",
                  "伍佩珊",
                  "岑卓希",
                  "容曉彤",
                  "韋俊宇",
                  "喬天朗",
                ],
                absentStudents: ["安詠詩"],
              }),
              lesson({
                id: "l14",
                date: "2026-07-09",
                startTime: "17:45",
                endTime: "19:15",
                notRolled: true,
              }),
              lesson({
                id: "l15",
                date: "2026-07-16",
                startTime: "17:45",
                endTime: "19:15",
                notRolled: false,
                makeupOrTrialNote: "含試堂：安詠詩",
                presentStudents: [
                  "丁浩然",
                  "白美玲",
                  "石俊傑",
                  "金子晴",
                  "錢家豪",
                  "湯詩晴",
                  "尹啟明",
                  "常嘉欣",
                  "歐志偉",
                  "伍佩珊",
                  "岑卓希",
                  "容曉彤",
                  "安詠詩",
                ],
                absentStudents: ["韋俊宇", "喬天朗"],
              }),
            ],
          },
        ],
      },
      {
        gradeLabel: "中五",
        classes: [
          {
            id: "c-wong-s5-econ",
            name: "中五經濟",
            classKind: "group",
            lessons: [
              lesson({
                id: "l16",
                date: "2026-07-07",
                startTime: "18:00",
                endTime: "19:30",
                notRolled: false,
                presentStudents: [
                  "夏子軒",
                  "韓嘉怡",
                  "唐偉強",
                  "范文慧",
                  "彭浩銘",
                  "郎欣怡",
                  "鄒俊希",
                  "鮑詠琳",
                  "史子傑",
                  "陶卓妍",
                  "賀明慧",
                ],
                absentStudents: ["藍子晴"],
              }),
              lesson({
                id: "l17",
                date: "2026-07-14",
                startTime: "18:00",
                endTime: "19:30",
                notRolled: false,
                makeupOrTrialNote: "含試堂：藍子晴",
                presentStudents: [
                  "夏子軒",
                  "韓嘉怡",
                  "唐偉強",
                  "范文慧",
                  "彭浩銘",
                  "郎欣怡",
                  "鄒俊希",
                  "鮑詠琳",
                  "史子傑",
                  "藍子晴",
                ],
                absentStudents: ["陶卓妍", "賀明慧"],
              }),
              lesson({
                id: "l18",
                date: "2026-07-21",
                startTime: "18:00",
                endTime: "19:30",
                notRolled: false,
                presentStudents: [
                  "夏子軒",
                  "韓嘉怡",
                  "唐偉強",
                  "范文慧",
                  "彭浩銘",
                  "郎欣怡",
                  "鄒俊希",
                  "鮑詠琳",
                  "史子傑",
                  "陶卓妍",
                  "賀明慧",
                  "藍子晴",
                ],
                absentStudents: [],
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t-cheung",
    name: "張老師",
    grades: [
      {
        gradeLabel: "中四",
        classes: [
          {
            id: "c-cheung-s4-phy",
            name: "中四物理 DSE",
            classKind: "group",
            lessons: [
              lesson({
                id: "l19",
                date: "2026-07-01",
                startTime: "19:30",
                endTime: "21:00",
                notRolled: false,
                presentStudents: ["祁浩然", "易美玲", "甘俊傑", "辛子晴", "阮家豪", "龔詩晴"],
                absentStudents: ["梅啟明"],
              }),
              lesson({
                id: "l20",
                date: "2026-07-08",
                startTime: "19:30",
                endTime: "21:00",
                notRolled: false,
                presentStudents: [
                  "祁浩然",
                  "易美玲",
                  "甘俊傑",
                  "辛子晴",
                  "阮家豪",
                  "龔詩晴",
                  "梅啟明",
                ],
                absentStudents: [],
              }),
              lesson({
                id: "l21",
                date: "2026-07-15",
                startTime: "19:30",
                endTime: "21:00",
                notRolled: false,
                makeupOrTrialNote: "含補堂：梅啟明",
                presentStudents: ["祁浩然", "易美玲", "甘俊傑", "辛子晴", "阮家豪"],
                absentStudents: ["龔詩晴", "梅啟明"],
              }),
              lesson({
                id: "l22",
                date: "2026-07-22",
                startTime: "19:30",
                endTime: "21:00",
                notRolled: false,
                presentStudents: [
                  "祁浩然",
                  "易美玲",
                  "甘俊傑",
                  "辛子晴",
                  "阮家豪",
                  "龔詩晴",
                  "梅啟明",
                  "藍子軒",
                ],
                absentStudents: [],
              }),
            ],
          },
        ],
      },
      {
        gradeLabel: "中六",
        classes: [
          {
            id: "c-cheung-s6-math",
            name: "中六數學衝刺（一對一）",
            classKind: "private",
            lessons: [
              lesson({
                id: "l23",
                date: "2026-07-03",
                startTime: "13:00",
                endTime: "15:30",
                notRolled: false,
                presentStudents: ["陸浩然"],
                absentStudents: [],
              }),
              lesson({
                id: "l24",
                date: "2026-07-10",
                startTime: "13:00",
                endTime: "15:30",
                notRolled: false,
                makeupOrTrialNote: "含補堂：陸浩然（調堂）",
                presentStudents: ["陸浩然"],
                absentStudents: [],
              }),
              lesson({
                id: "l25",
                date: "2026-07-17",
                startTime: "13:00",
                endTime: "15:30",
                notRolled: true,
              }),
            ],
          },
        ],
      },
    ],
  },
]

export function lessonPresentCount(l: MockLessonRow): number {
  return l.notRolled ? 0 : l.presentStudents.length
}

export function lessonAbsentCount(l: MockLessonRow): number {
  return l.notRolled ? 0 : l.absentStudents.length
}

export function classPresentTotal(c: MockClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonPresentCount(l), 0)
}

export function classAbsentTotal(c: MockClassBlock): number {
  return c.lessons.reduce((s, l) => s + lessonAbsentCount(l), 0)
}

export function gradePresentTotal(g: MockGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + classPresentTotal(c), 0)
}

export function gradeAbsentTotal(g: MockGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + classAbsentTotal(c), 0)
}

export function gradeLessonCount(g: MockGradeUnderTeacher): number {
  return g.classes.reduce((s, c) => s + c.lessons.length, 0)
}

export function teacherPresentTotal(t: MockTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradePresentTotal(g), 0)
}

export function teacherAbsentTotal(t: MockTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradeAbsentTotal(g), 0)
}

export function teacherLessonCount(t: MockTeacherBlock): number {
  return t.grades.reduce((s, g) => s + gradeLessonCount(g), 0)
}

export function teacherClassCount(t: MockTeacherBlock): number {
  return t.grades.reduce((s, g) => s + g.classes.length, 0)
}

/** 初中：中一～中三；高中：中四～中六 */
export type SecondaryBand = "junior" | "senior"
export type ClassKind = "group" | "private"

export const JUNIOR_GRADE_LABELS = new Set(["中一", "中二", "中三"])
export const SENIOR_GRADE_LABELS = new Set(["中四", "中五", "中六"])

export function secondaryBandOfGrade(gradeLabel: string): SecondaryBand | null {
  if (JUNIOR_GRADE_LABELS.has(gradeLabel)) return "junior"
  if (SENIOR_GRADE_LABELS.has(gradeLabel)) return "senior"
  return null
}

export function classKindLabel(kind: ClassKind): string {
  return kind === "private" ? "私人課程" : "專科班"
}

/** 四類：初中專科班／高中專科班／初中私人課程／高中私人課程 */
export type CategoryKey =
  | "juniorGroup"
  | "seniorGroup"
  | "juniorPrivate"
  | "seniorPrivate"

export type CategoryTotals = {
  key: CategoryKey
  label: string
  band: SecondaryBand
  classKind: ClassKind
  classCount: number
  lessonCount: number
  presentVisits: number
  absentVisits: number
  gradeIds: Set<string>
}

const CATEGORY_META: {
  key: CategoryKey
  label: string
  band: SecondaryBand
  classKind: ClassKind
}[] = [
  { key: "juniorGroup", label: "初中專科班", band: "junior", classKind: "group" },
  { key: "seniorGroup", label: "高中專科班", band: "senior", classKind: "group" },
  { key: "juniorPrivate", label: "初中私人課程", band: "junior", classKind: "private" },
  { key: "seniorPrivate", label: "高中私人課程", band: "senior", classKind: "private" },
]

export function emptyCategoryTotals(meta: (typeof CATEGORY_META)[number]): CategoryTotals {
  return {
    key: meta.key,
    label: meta.label,
    band: meta.band,
    classKind: meta.classKind,
    classCount: 0,
    lessonCount: 0,
    presentVisits: 0,
    absentVisits: 0,
    gradeIds: new Set(),
  }
}

export function categoryKeyOf(
  band: SecondaryBand,
  classKind: ClassKind
): CategoryKey {
  if (band === "junior") return classKind === "group" ? "juniorGroup" : "juniorPrivate"
  return classKind === "group" ? "seniorGroup" : "seniorPrivate"
}

export function teacherCategoryTotals(t: MockTeacherBlock): CategoryTotals[] {
  const map = new Map<CategoryKey, CategoryTotals>()
  for (const meta of CATEGORY_META) map.set(meta.key, emptyCategoryTotals(meta))

  for (const g of t.grades) {
    const band = secondaryBandOfGrade(g.gradeLabel)
    if (!band) continue
    for (const c of g.classes) {
      const key = categoryKeyOf(band, c.classKind)
      const target = map.get(key)!
      target.gradeIds.add(g.gradeLabel)
      target.classCount += 1
      target.lessonCount += c.lessons.length
      target.presentVisits += classPresentTotal(c)
      target.absentVisits += classAbsentTotal(c)
    }
  }

  return CATEGORY_META.map((m) => map.get(m.key)!)
}

/** @deprecated 請用 teacherCategoryTotals；保留給過渡 */
export type BandTotals = {
  band: SecondaryBand
  label: string
  classCount: number
  lessonCount: number
  presentVisits: number
  absentVisits: number
  gradeCount: number
}

export function teacherBandTotals(t: MockTeacherBlock): {
  junior: BandTotals
  senior: BandTotals
} {
  const cats = teacherCategoryTotals(t)
  const fold = (band: SecondaryBand, label: string): BandTotals => {
    const rows = cats.filter((c) => c.band === band)
    return {
      band,
      label,
      classCount: rows.reduce((s, r) => s + r.classCount, 0),
      lessonCount: rows.reduce((s, r) => s + r.lessonCount, 0),
      presentVisits: rows.reduce((s, r) => s + r.presentVisits, 0),
      absentVisits: rows.reduce((s, r) => s + r.absentVisits, 0),
      gradeCount: new Set(rows.flatMap((r) => [...r.gradeIds])).size,
    }
  }
  return {
    junior: fold("junior", "初中（中一至中三）"),
    senior: fold("senior", "高中（中四至中六）"),
  }
}

export type GradeKindSummaryRow = {
  gradeLabel: string
  classKind: ClassKind
  classCount: number
  lessonCount: number
  presentVisits: number
  absentVisits: number
}

export function teacherGradeKindRows(t: MockTeacherBlock): GradeKindSummaryRow[] {
  const rows: GradeKindSummaryRow[] = []
  for (const g of t.grades) {
    for (const kind of ["group", "private"] as const) {
      const classes = g.classes.filter((c) => c.classKind === kind)
      if (classes.length === 0) continue
      rows.push({
        gradeLabel: g.gradeLabel,
        classKind: kind,
        classCount: classes.length,
        lessonCount: classes.reduce((s, c) => s + c.lessons.length, 0),
        presentVisits: classes.reduce((s, c) => s + classPresentTotal(c), 0),
        absentVisits: classes.reduce((s, c) => s + classAbsentTotal(c), 0),
      })
    }
  }
  return rows
}
