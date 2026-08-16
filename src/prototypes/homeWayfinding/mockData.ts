/** 首頁 wayfinding UX 沙盒：全假資料，不接 DB／services。 */

export type SandboxRole = "admin" | "teacher"

export const MOCK_TODAY_LABEL = "8 月 5 日星期三"
export const MOCK_ADMIN_NAME = "陳小姐"
export const MOCK_TEACHER_NAME = "Judy Chu"

export type MockAlert = {
  id: string
  tone: "warning" | "info" | "error"
  title: string
  detail: string
  actionLabel: string
  /** 沙盒內顯示用，非真實 path */
  destinationHint: string
}

export type MockScenario = {
  id: string
  title: string
  situation: string
  goesTo: string
  /** 側欄大致位置（幫助對齊未來 IA） */
  sidebarHint: string
}

export type MockClassRow = {
  id: string
  time: string
  label: string
  room: string
  headcount: number
  rollCallDone: boolean
  tags?: string[]
}

export const MOCK_ADMIN_ALERTS: MockAlert[] = [
  {
    id: "a1",
    tone: "warning",
    title: "3 堂尚未點名",
    detail: "今日仍有課堂未完成點名；未點名不會扣堂。",
    actionLabel: "前往點名",
    destinationHint: "進行點名",
  },
  {
    id: "a2",
    tone: "error",
    title: "5 位學生欠費需跟進",
    detail: "其中 2 位已逾期；可先查閱繳費紀錄再決定是否收款。",
    actionLabel: "查看欠費",
    destinationHint: "繳費／欠費跟進",
  },
  {
    id: "a3",
    tone: "info",
    title: "收件匣有 2 則新通知",
    detail: "老師請假 ethan.b@example.com；家長報讀申請待審。",
    actionLabel: "開啟收件匣",
    destinationHint: "收件匣",
  },
]

export const MOCK_ADMIN_SCENARIOS: MockScenario[] = [
  {
    id: "s1",
    title: "家長／學生到前台",
    situation: "查詢、新生登記、報讀、收款一條龍",
    goesTo: "前台指引精靈",
    sidebarHint: "今日／前線",
  },
  {
    id: "s2",
    title: "收取學費／開立收據",
    situation: "學生資料已建檔，只需登記付款",
    goesTo: "收款登記",
    sidebarHint: "財務",
  },
  {
    id: "s3",
    title: "學生請假或補堂",
    situation: "請假、補堂、調堂之行政處理",
    goesTo: "請假管理",
    sidebarHint: "課堂節奏",
  },
  {
    id: "s4",
    title: "老師請假需安排代堂",
    situation: "整理受影響課堂，安排代課",
    goesTo: "老師請假處理",
    sidebarHint: "今日／前線",
  },
  {
    id: "s5",
    title: "查詢或修改學生資料",
    situation: "電話、家長、報讀班別",
    goesTo: "學生管理",
    sidebarHint: "學生營運",
  },
  {
    id: "s6",
    title: "調整課堂時間／課室",
    situation: "搬堂、取消、加開",
    goesTo: "排程管理",
    sidebarHint: "課堂節奏",
  },
  {
    id: "s7",
    title: "準備明日家長提醒",
    situation: "查看明日課堂並起草通知",
    goesTo: "明日課堂提醒",
    sidebarHint: "今日／前線",
  },
  {
    id: "s8",
    title: "開設新班／調整班務",
    situation: "班別名額、老師、上課日",
    goesTo: "班別管理",
    sidebarHint: "班務與人手",
  },
]

export const MOCK_ADMIN_TODAY_CLASSES: MockClassRow[] = [
  {
    id: "ac1",
    time: "10:00–11:30",
    label: "中三中文 A",
    room: "301",
    headcount: 8,
    rollCallDone: true,
  },
  {
    id: "ac2",
    time: "14:00–15:30",
    label: "中五英文 B",
    room: "202",
    headcount: 6,
    rollCallDone: false,
    tags: ["試堂"],
  },
  {
    id: "ac3",
    time: "16:00–17:30",
    label: "一對一 · 數學",
    room: "面談室",
    headcount: 1,
    rollCallDone: false,
  },
]

export const MOCK_TEACHER_PENDING_ROLL: MockClassRow[] = [
  {
    id: "tr1",
    time: "14:00–15:30",
    label: "中五英文 B",
    room: "202",
    headcount: 6,
    rollCallDone: false,
    tags: ["試堂 1 人"],
  },
  {
    id: "tr2",
    time: "16:00–17:30",
    label: "中四英文 A",
    room: "105",
    headcount: 7,
    rollCallDone: false,
  },
]

export const MOCK_TEACHER_TODAY: MockClassRow[] = [
  {
    id: "tt1",
    time: "10:00–11:30",
    label: "中三英文 C",
    room: "301",
    headcount: 9,
    rollCallDone: true,
  },
  ...MOCK_TEACHER_PENDING_ROLL,
]

export const MOCK_TEACHER_TOMORROW: MockClassRow[] = [
  {
    id: "tm1",
    time: "11:00–12:30",
    label: "中五英文 B",
    room: "202",
    headcount: 6,
    rollCallDone: false,
  },
  {
    id: "tm2",
    time: "15:00–16:30",
    label: "一對一 · 英文寫作",
    room: "面談室",
    headcount: 1,
    rollCallDone: false,
  },
]

export type MockTeacherShortcut = {
  id: string
  label: string
  detail: string
}

/** 老師次要入口：刻意少於現行首頁多個近似按鈕 */
export const MOCK_TEACHER_SHORTCUTS: MockTeacherShortcut[] = [
  { id: "ts1", label: "時間表", detail: "查看未來數日課堂" },
  { id: "ts2", label: "我的班別", detail: "學生名單與班務" },
  { id: "ts3", label: "我的一對一", detail: "私人班學生" },
  { id: "ts4", label: "預約空房", detail: "申請課室" },
  { id: "ts5", label: "收件匣", detail: "班別／排程通知" },
]
