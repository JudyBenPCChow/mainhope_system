import { APO_NO_HALLUCINATION_RULE } from "./apoNoHallucination.ts"
import { APO_NO_LEGACY_REPLY_RULE } from "./apoReplySanitize.ts"

/** 明學IT狗可引用的真實路由 */
export const APO_VALID_PATHS = new Set([
  "/Home",
  "/AllFeatures",
  "/SystemLogs",
  "/SystemIssues",
  "/Attendance",
  "/TeacherTimetable",
  "/TeacherProfile",
  "/Users",
  "/PaymentDiscounts",
  "/ReferralRebates",
  "/Courses",
  "/FrontDeskWizard",
  "/TomorrowReminders",
  "/Students",
  "/LessonBalanceMismatch",
  "/PrivateTutoring",
  "/Teachers",
  "/Classes",
  "/Classes/New",
  "/TeacherAvailability",
  "/Classrooms",
  "/PortalEnrollmentRequests",
  "/Schedule",
  "/AcademicCalendar",
  "/TeachingRecords",
  "/TeacherLeaveWizard",
  "/RoomBooking",
  "/RoomBookingAdmin",
  "/AttendanceRecords",
  "/Inbox",
  "/LeaveManagement",
  "/TrialSessions",
  "/Payments",
  "/PaymentHistory",
  "/PaymentCorrection",
  "/ScriptLibrary",
  "/EnrollmentChanges",
  "/EnrollmentReports",
  "/SecondaryAttendanceReport",
  "/PromotionMatch",
  "/MgmtDashboard",
  "/AiReports",
  "/Apo",
  "/Settings",
])

export const APO_PATH_LABELS: Record<string, string> = {
  "/Home": "首頁",
  "/AllFeatures": "所有功能",
  "/SystemLogs": "系統日志",
  "/SystemIssues": "報錯與問題",
  "/Attendance": "進行點名",
  "/TeacherTimetable": "時間表",
  "/TeacherProfile": "個人資料",
  "/Users": "用戶管理",
  "/PaymentDiscounts": "優惠折扣",
  "/ReferralRebates": "推薦回贈",
  "/Courses": "課程管理",
  "/FrontDeskWizard": "前台指引精靈",
  "/TomorrowReminders": "明日課堂提醒",
  "/Students": "學生管理",
  "/LessonBalanceMismatch": "堂數對帳",
  "/PrivateTutoring": "私人課程",
  "/Teachers": "老師管理",
  "/Classes": "班別管理",
  "/Classes/New": "新增班別",
  "/TeacherAvailability": "老師檔期規劃",
  "/Classrooms": "課室管理",
  "/PortalEnrollmentRequests": "家長報讀申請",
  "/Schedule": "排程管理",
  "/AcademicCalendar": "校曆",
  "/TeachingRecords": "教學紀錄",
  "/TeacherLeaveWizard": "老師請假處理",
  "/RoomBooking": "預約空房",
  "/RoomBookingAdmin": "約房審批",
  "/AttendanceRecords": "出席紀錄",
  "/Inbox": "收件匣",
  "/LeaveManagement": "請假管理",
  "/TrialSessions": "試堂紀錄",
  "/Payments": "收款登記",
  "/PaymentHistory": "繳費紀錄",
  "/PaymentCorrection": "單據／堂數更正",
  "/ScriptLibrary": "話術庫",
  "/EnrollmentChanges": "增退紀錄",
  "/EnrollmentReports": "人數報表",
  "/SecondaryAttendanceReport": "中學出席統計",
  "/PromotionMatch": "宣傳配對",
  "/MgmtDashboard": "營運總覽",
  "/AiReports": "AI 報表",
  "/Apo": "阿Po",
  "/Settings": "設定",
}

const SORTED_PATHS = Object.keys(APO_PATH_LABELS).sort((a, b) => b.length - a.length)

type PathHint = { label: string; path: string }

export function extractPathsFromReplyText(text: string): PathHint[] {
  const out: PathHint[] = []
  const seen = new Set<string>()
  for (const path of SORTED_PATHS) {
    if (!text.includes(path) || seen.has(path)) continue
    seen.add(path)
    out.push({ path, label: APO_PATH_LABELS[path] ?? path })
  }
  for (const [path, label] of Object.entries(APO_PATH_LABELS)) {
    if (seen.has(path)) continue
    if (!text.includes(label)) continue
    seen.add(path)
    out.push({ path, label })
  }
  return out
}

export function cleanReplyPathNoise(text: string): string {
  return text
    .replace(/^[ \t]*路徑[：:]\s*\/[^\n]+\s*$/gim, "")
    .replace(/[ \t]*[（(]?\s*路徑[：:]\s*\/[A-Za-z][\w/]*\s*[）)]?/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function mergeReplyPaths(reply: string, paths: PathHint[]): { reply: string; paths: PathHint[] } {
  const map = new Map<string, PathHint>()
  for (const p of paths) map.set(p.path, p)
  for (const p of extractPathsFromReplyText(reply)) {
    if (!map.has(p.path)) map.set(p.path, p)
  }
  return { reply: cleanReplyPathNoise(reply), paths: [...map.values()] }
}

export const APO_JSON_INSTRUCTIONS = `
## 輸出格式（必守）

你只可輸出一個 JSON 物件（不要 markdown、不要 code block），格式：
{
  "reply": "給使用者的完整回答",
  "suggestions": ["追問按鈕文字1", "追問按鈕文字2", "追問按鈕文字3"],
  "paths": [{ "label": "側欄功能名稱", "path": "/Students" }]
}

規則：
- reply：繁體中文；**禁止 Markdown**（唔好用 ** 加粗）。**業務問題**：先結論與用戶要求嘅答案，再步驟；幽默至多一句點綴。**非業務／閒聊**：可輕鬆自嘲，令用戶開心，但仍克制、友善。自稱「明學IT狗」或「我」；禁止自稱雞先生。不可假稱已代用戶修改資料。
- ${APO_NO_HALLUCINATION_RULE}
- **reply 內禁止寫「路徑：/XXX」或裸路由**；只用中文功能名。路由只放在 paths。
- suggestions：2～3 個相關追問短句（每句不超過 20 字），例如「詳細步驟是什麼？」「老師能否查看？」。
- **paths**：回答涉及系統頁面時必須填入 1～3 項 { label, path }。
- 介面會顯示「前往XX」按鈕供跳轉。
`.trim()
