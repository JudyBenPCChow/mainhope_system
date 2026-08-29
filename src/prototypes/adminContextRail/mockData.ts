/**
 * 三欄右欄 UX 沙盒假資料。
 * 結構對齊學生管理／班別管理列表欄，不呼叫 services／Supabase。
 * 移植時改讀 studentQueries／classQueries；此檔可刪。
 */

export type SandboxPageId = "students" | "classes"

export type SandboxStudent = {
  id: string
  studentCode: string
  fullName: string
  englishName: string
  grade: string
  school: string
  studentPhone: string
  parentPhone: string
  registrationStatus: "已註冊" | "非註冊"
  enrollmentStatus: "在讀" | "非在讀"
  activityStatus: "活躍生" | "非活躍生"
  academicStage: "中學階段" | "已畢業"
  classIds: string[]
  paidLessons: number
  attendedLessons: number
}

export type SandboxClass = {
  id: string
  courseCode: string
  grade: string
  courseName: string
  time: string
  room: string
  teacher: string
  status: "招生中" | "進行中" | "已結束" | "已滿班"
  studentIds: string[]
}

export const SANDBOX_CLASSES: SandboxClass[] = [
  {
    id: "c1",
    courseCode: "2627-ENG-S3A",
    grade: "中三",
    courseName: "中三英文",
    time: "逢星期三 16:30–18:00",
    room: "17D",
    teacher: "Judy Chu",
    status: "進行中",
    studentIds: ["s1", "s7"],
  },
  {
    id: "c2",
    courseCode: "2627-MATH-S3B",
    grade: "中三",
    courseName: "中三數學",
    time: "逢星期五 16:30–18:00",
    room: "17E",
    teacher: "Mark Yu",
    status: "進行中",
    studentIds: ["s1", "s7"],
  },
  {
    id: "c3",
    courseCode: "2627-ENG-S4A",
    grade: "中四",
    courseName: "中四英文",
    time: "逢星期二 17:00–18:30",
    room: "17D",
    teacher: "Judy Chu",
    status: "進行中",
    studentIds: ["s2"],
  },
  {
    id: "c4",
    courseCode: "2627-MATH-S4A",
    grade: "中四",
    courseName: "中四數學",
    time: "逢星期四 17:00–18:30",
    room: "山案座",
    teacher: "Mark Yu",
    status: "已滿班",
    studentIds: ["s2"],
  },
  {
    id: "c5",
    courseCode: "2627-CHI-S2A",
    grade: "中二",
    courseName: "中二中文",
    time: "逢星期一 16:30–18:00",
    room: "矩尺座",
    teacher: "Cody",
    status: "進行中",
    studentIds: ["s3", "s9"],
  },
  {
    id: "c6",
    courseCode: "2627-PHY-S5A",
    grade: "中五",
    courseName: "中五物理",
    time: "逢星期六 10:00–12:00",
    room: "17E",
    teacher: "Mark Yu",
    status: "招生中",
    studentIds: ["s4", "s10"],
  },
  {
    id: "c7",
    courseCode: "2627-CHEM-S6A",
    grade: "中六",
    courseName: "中六化學",
    time: "逢星期六 14:00–16:00",
    room: "17D",
    teacher: "Cody",
    status: "進行中",
    studentIds: ["s6"],
  },
  {
    id: "c8",
    courseCode: "2627-ENG-S1A",
    grade: "中一",
    courseName: "中一英文",
    time: "逢星期三 15:00–16:30",
    room: "英仙座",
    teacher: "Judy Chu",
    status: "進行中",
    studentIds: ["s5"],
  },
  {
    id: "c9",
    courseCode: "2627-BAFS-S4A",
    grade: "中四",
    courseName: "中四企會財",
    time: "逢星期五 19:00–20:30",
    room: "17D",
    teacher: "Cody",
    status: "進行中",
    studentIds: ["s2"],
  },
  {
    id: "c10",
    courseCode: "2627-IS-S3A",
    grade: "中三",
    courseName: "中三綜合科學",
    time: "逢星期二 16:30–18:00",
    room: "山案座",
    teacher: "Mark Yu",
    status: "已結束",
    studentIds: ["s1"],
  },
]

export const SANDBOX_STUDENTS: SandboxStudent[] = [
  {
    id: "s1",
    studentCode: "S2627-001",
    fullName: "陳樂瑤",
    englishName: "Chan Lok Yiu",
    grade: "中三",
    school: "英華書院",
    studentPhone: "5123 8801",
    parentPhone: "9123 8801",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c1", "c2", "c10"],
    paidLessons: 24,
    attendedLessons: 21,
  },
  {
    id: "s2",
    studentCode: "S2627-002",
    fullName: "李浩然",
    englishName: "Lee Ho Yin",
    grade: "中四",
    school: "喇沙書院",
    studentPhone: "5123 8802",
    parentPhone: "9123 8802",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c3", "c4", "c9"],
    paidLessons: 36,
    attendedLessons: 33,
  },
  {
    id: "s3",
    studentCode: "S2627-003",
    fullName: "黃詩婷",
    englishName: "Wong Sze Ting",
    grade: "中二",
    school: "協恩中學",
    studentPhone: "5123 8803",
    parentPhone: "9123 8803",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c5"],
    paidLessons: 12,
    attendedLessons: 11,
  },
  {
    id: "s4",
    studentCode: "S2627-004",
    fullName: "張子軒",
    englishName: "Cheung Tsz Hin",
    grade: "中五",
    school: "聖保羅男女中學",
    studentPhone: "5123 8804",
    parentPhone: "9123 8804",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c6"],
    paidLessons: 18,
    attendedLessons: 16,
  },
  {
    id: "s5",
    studentCode: "S2627-005",
    fullName: "林凱琳",
    englishName: "Lam Hoi Lam",
    grade: "中一",
    school: "拔萃女書院",
    studentPhone: "5123 8805",
    parentPhone: "9123 8805",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c8"],
    paidLessons: 10,
    attendedLessons: 9,
  },
  {
    id: "s6",
    studentCode: "S2627-006",
    fullName: "周俊傑",
    englishName: "Chow Chun Kit",
    grade: "中六",
    school: "華仁書院",
    studentPhone: "5123 8806",
    parentPhone: "9123 8806",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c7"],
    paidLessons: 20,
    attendedLessons: 19,
  },
  {
    id: "s7",
    studentCode: "S2627-007",
    fullName: "吳嘉欣",
    englishName: "Ng Ka Yan",
    grade: "中三",
    school: "伊利沙伯中學",
    studentPhone: "5123 8807",
    parentPhone: "9123 8807",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c1", "c2"],
    paidLessons: 16,
    attendedLessons: 14,
  },
  {
    id: "s8",
    studentCode: "S2627-008",
    fullName: "馬天朗",
    englishName: "Ma Tin Long",
    grade: "中四",
    school: "皇仁書院",
    studentPhone: "5123 8808",
    parentPhone: "9123 8808",
    registrationStatus: "非註冊",
    enrollmentStatus: "非在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: [],
    paidLessons: 1,
    attendedLessons: 1,
  },
  {
    id: "s9",
    studentCode: "S2627-009",
    fullName: "鄭詠心",
    englishName: "Cheng Wing Sum",
    grade: "中二",
    school: "聖若瑟書院",
    studentPhone: "5123 8809",
    parentPhone: "9123 8809",
    registrationStatus: "已註冊",
    enrollmentStatus: "非在讀",
    activityStatus: "非活躍生",
    academicStage: "中學階段",
    classIds: ["c5"],
    paidLessons: 8,
    attendedLessons: 8,
  },
  {
    id: "s10",
    studentCode: "S2627-010",
    fullName: "何梓謙",
    englishName: "Ho Tsz Him",
    grade: "中五",
    school: "拔萃男書院",
    studentPhone: "5123 8810",
    parentPhone: "9123 8810",
    registrationStatus: "已註冊",
    enrollmentStatus: "在讀",
    activityStatus: "活躍生",
    academicStage: "中學階段",
    classIds: ["c6"],
    paidLessons: 14,
    attendedLessons: 12,
  },
]

export function studentById(id: string): SandboxStudent | undefined {
  return SANDBOX_STUDENTS.find((s) => s.id === id)
}

export function classLabel(classId: string): string {
  const c = SANDBOX_CLASSES.find((row) => row.id === classId)
  return c ? c.courseName : classId
}

export function enrollmentLabels(student: SandboxStudent): string[] {
  return student.classIds.map(classLabel)
}
