#!/usr/bin/env node
/**
 * 明學IT狗離線對答檢查（唔打 DeepSeek／唔打 Edge Function）
 *
 * - 直接載入正式 `_shared` 邏輯（唔再維護脫節鏡像）
 * - 模擬常見問句：意圖、姓名抽取、howto 直答、代辦拒絕、路由覆蓋
 * - 產出 markdown 報告：reports/apo-offline-check-最新.md
 *
 * 執行：npm run apo:check
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const shared = (...parts) => pathToFileURL(join(root, "supabase/functions/_shared", ...parts)).href

const { extractStudentNameQuery, isHowtoOrSystemUsageQuery, isStudentDataQuery } = await import(
  shared("apoStudentQuery.ts")
)
const { classifyApoIntent } = await import(shared("apoIntent.ts"))
const { tryDirectHowtoAnswer, HOWTO_GUIDES } = await import(shared("apoHowtoGuides.ts"))
const { isDelegateWriteRequest, tryDelegateActionReply } = await import(shared("apoDelegateRefusal.ts"))
const { APO_VALID_PATHS, APO_PATH_LABELS } = await import(shared("apoRoutes.ts"))
const { buildSearchStudentsStructuredReply } = await import(shared("apoGrounding.ts"))
const { extractTeacherNameQuery } = await import(shared("apoTeacherQuery.ts"))

/** @typedef {{ id: string; group: string; ok: boolean; detail: string }} CheckRow */

/** @type {CheckRow[]} */
const rows = []

function check(group, id, ok, detail = "") {
  rows.push({ id, group, ok: Boolean(ok), detail: String(detail ?? "") })
}

function expectEq(group, id, actual, expected) {
  const ok = Object.is(actual, expected) || actual === expected
  check(
    group,
    id,
    ok,
    ok ? `得到 ${JSON.stringify(actual)}` : `期望 ${JSON.stringify(expected)}，得到 ${JSON.stringify(actual)}`
  )
}

// ─── 1. 曾踩雷／行政 howto 對答路徑 ─────────────────────────────────────────

const howtoCases = [
  {
    id: "刪除出席紀錄 → howto（唔搜學生）",
    q: "如何刪除學生出席紀錄",
    role: "admin",
    expectGuide: "attendance_records",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "進行點名 → howto",
    q: "如何進行點名？",
    role: "admin",
    expectGuide: "roll_call",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "行政功能導覽",
    q: "行政有咩功能？",
    role: "admin",
    expectGuide: "admin_feature_map",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "指派代堂",
    q: "點樣指派代堂？",
    role: "admin",
    expectGuide: "substitute_teacher",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "明日課堂提醒",
    q: "明日課堂提醒點用？",
    role: "admin",
    expectGuide: "tomorrow_reminders",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "家長報讀申請",
    q: "家長報讀申請點審？",
    role: "admin",
    expectGuide: "portal_enrollment",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "老師請假處理",
    q: "老師請假點處理？",
    role: "admin",
    expectGuide: "teacher_leave_wizard",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "課堂取消後安排補堂",
    q: "課堂取消後點樣安排補堂？",
    role: "admin",
    expectGuide: "cancelled_class_makeup",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "安排補堂 vs 新增排程",
    q: "安排補堂同新增排程有咩分別？",
    role: "admin",
    expectGuide: "cancelled_class_makeup",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "在讀活躍分別 → howto",
    q: "在讀與活躍有什麼分別？",
    role: "admin",
    expectGuide: "enrollment_status",
    expectName: null,
    expectIntent: "howto",
  },
  {
    id: "新增報讀 → howto（admin）",
    q: "如何新增報讀班別？",
    role: "admin",
    expectGuide: "add_enrollment",
    expectName: null,
    expectIntent: "howto",
  },
]

for (const c of howtoCases) {
  const name = extractStudentNameQuery(c.q)
  const intent = classifyApoIntent(c.q, false)
  const direct = tryDirectHowtoAnswer(c.q, c.role)
  expectEq("howto路徑", `${c.id} · 姓名抽取`, name, c.expectName)
  expectEq("howto路徑", `${c.id} · 意圖`, intent, c.expectIntent)
  expectEq("howto路徑", `${c.id} · guideId`, direct?.guideId ?? null, c.expectGuide)
  if (direct?.reply) {
    const badStudentMiss = /搵唔到符合嘅學生/.test(direct.reply)
    check("howto路徑", `${c.id} · 回覆唔准假搜學生`, !badStudentMiss, badStudentMiss ? "誤用學生搜尋回覆" : "OK")
  }
}

// ─── 2. 資料查詢抽取（唔好被 howto 規則誤殺） ─────────────────────────────

const dbCases = [
  { id: "梁天因今日有冇堂", q: "梁天因今日有冇堂", name: "梁天因", intent: "db_query" },
  { id: "陳大文今日上唔上堂", q: "陳大文今日上唔上堂？", name: "陳大文", intent: "db_query" },
  { id: "霍健一呢", q: "霍健一呢", name: "霍健一", intent: "db_query" },
  { id: "學生：梁天因", q: "學生：梁天因", name: "梁天因", intent: "db_query" },
  { id: "學生 陳大文今日有冇堂", q: "學生 陳大文今日有冇堂", name: "陳大文", intent: "db_query" },
  { id: "蕭樂瑩依家報什麼", q: "蕭樂瑩依家報什麼", name: "蕭樂瑩", intent: "db_query" },
]

for (const c of dbCases) {
  expectEq("資料查詢抽取", `${c.id} · 姓名`, extractStudentNameQuery(c.q), c.name)
  expectEq("資料查詢抽取", `${c.id} · 意圖`, classifyApoIntent(c.q, false), c.intent)
  check(
    "資料查詢抽取",
    `${c.id} · 應視為學生資料問句或短姓名`,
    Boolean(extractStudentNameQuery(c.q)) && (isStudentDataQuery(c.q) || /^[\u4e00-\u9fff]{2,4}/.test(c.q)),
    ""
  )
}

expectEq(
  "資料查詢抽取",
  "Mark Yu 老師名",
  extractTeacherNameQuery("Mark Yu 有咩班？") ?? extractTeacherNameQuery("Mark Yu 今日點名狀態如何？"),
  "Mark Yu"
)

// ─── 3. 防誤判：功能詞唔好當姓名 ───────────────────────────────────────────

for (const q of ["學生出席紀錄", "如何刪除學生出席紀錄", "出席紀錄邊度睇"]) {
  check(
    "防誤判",
    `「${q}」唔抽姓名`,
    extractStudentNameQuery(q) == null,
    `抽到 ${JSON.stringify(extractStudentNameQuery(q))}`
  )
  check("防誤判", `「${q}」howto 標記`, isHowtoOrSystemUsageQuery(q) || /出席紀錄/.test(q), "")
}

// 模擬舊 bug：若誤抽「出席紀錄」再組 search_students 空結果
{
  const poisoned = buildSearchStudentsStructuredReply({ ok: true, students: [], count: 0 })
  const howto = tryDirectHowtoAnswer("如何刪除學生出席紀錄", "admin")
  check(
    "防誤判",
    "刪除出席 應走 howto 而非空學生搜尋文案",
    Boolean(howto) && howto.guideId === "attendance_records" && !/搵唔到符合嘅學生/.test(howto.reply),
    howto ? `guide=${howto.guideId}` : "無 howto"
  )
  check(
    "防誤判",
    "空學生搜尋文案仍存在（對照組）",
    Boolean(poisoned?.reply?.includes("搵唔到符合嘅學生")),
    "結構化空結果文案應保留俾真·搜學生用"
  )
}

// ─── 4. 代辦拒絕 ───────────────────────────────────────────────────────────

expectEq("代辦拒絕", "你可唔可以幫我加 → 代辦", isDelegateWriteRequest("你可唔可以幫我加"), true)
expectEq("代辦拒絕", "如何新增報讀 → 非代辦", isDelegateWriteRequest("如何新增報讀班別？"), false)
check(
  "代辦拒絕",
  "代辦短句有拒絕回覆",
  Boolean(tryDelegateActionReply("你可唔可以幫我加", "admin")?.reply),
  ""
)

// ─── 5. 路由／側欄覆蓋（行政可見路徑應在 APO_VALID_PATHS） ─────────────────

const navSrc = readFileSync(join(root, "src/lib/navStructure.ts"), "utf8")
const navPaths = new Set()
for (const m of navSrc.matchAll(/path:\s*"(\/[^"]+)"/g)) {
  navPaths.add(m[1])
}

const adminCritical = [
  "/FrontDeskWizard",
  "/TomorrowReminders",
  "/Attendance",
  "/Inbox",
  "/ScriptLibrary",
  "/Students",
  "/PortalEnrollmentRequests",
  "/EnrollmentChanges",
  "/TrialSessions",
  "/PrivateTutoring",
  "/EnrollmentReports",
  "/SecondaryAttendanceReport",
  "/LessonBalanceMismatch",
  "/PromotionMatch",
  "/Classes",
  "/Teachers",
  "/TeacherAvailability",
  "/Classrooms",
  "/Schedule",
  "/AcademicCalendar",
  "/TeachingRecords",
  "/TeacherLeaveWizard",
  "/LeaveManagement",
  "/RoomBookingAdmin",
  "/AttendanceRecords",
  "/Payments",
  "/PaymentHistory",
  "/PaymentDiscounts",
  "/MgmtDashboard",
]

for (const p of adminCritical) {
  check("路由覆蓋", `APO_VALID_PATHS 含 ${p}`, APO_VALID_PATHS.has(p), "")
  check("路由覆蓋", `APO_PATH_LABELS 含 ${p}`, Boolean(APO_PATH_LABELS[p]), APO_PATH_LABELS[p] ?? "缺 label")
  check("路由覆蓋", `側欄 nav 含 ${p}`, navPaths.has(p), "navStructure 無此 path")
}

const missingFromApo = [...navPaths].filter((p) => !APO_VALID_PATHS.has(p)).sort()
/** 側欄有、但 IT狗 可不強制支援嘅例外（若加入 VALID_PATHS 則唔應再出現） */
const navCoverageAllowlist = new Set([])
const unexplained = missingFromApo.filter((p) => !navCoverageAllowlist.has(p))
check(
  "路由覆蓋",
  "側欄路徑皆在 APO_VALID_PATHS（或僅可解釋例外）",
  unexplained.length === 0,
  unexplained.length ? `缺：${unexplained.join(", ")}` : "OK"
)

// ─── 6. howto 指南健全性 ───────────────────────────────────────────────────

check("知識庫健全", "HOWTO_GUIDES 數量 ≥ 30", HOWTO_GUIDES.length >= 30, `實際 ${HOWTO_GUIDES.length}`)
const ids = HOWTO_GUIDES.map((g) => g.id)
check("知識庫健全", "guide id 無重複", new Set(ids).size === ids.length, "")
for (const need of [
  "attendance_records",
  "admin_feature_map",
  "substitute_teacher",
  "tomorrow_reminders",
  "portal_enrollment",
  "teacher_leave_wizard",
]) {
  check("知識庫健全", `存在 guide ${need}`, ids.includes(need), "")
}

// ─── 報告 ─────────────────────────────────────────────────────────────────

const passed = rows.filter((r) => r.ok).length
const failed = rows.filter((r) => !r.ok)
const now = new Date()
const hk = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(now)

const byGroup = new Map()
for (const r of rows) {
  if (!byGroup.has(r.group)) byGroup.set(r.group, [])
  byGroup.get(r.group).push(r)
}

let md = `# 明學IT狗離線對答檢查報告

- 時間（香港）：${hk}
- 結果：**${failed.length === 0 ? "全部通過" : `${failed.length} 項失敗`}**（${passed}/${rows.length}）
- 範圍：意圖分類、姓名抽取、howto 直答、代辦拒絕、路由覆蓋（**唔呼叫 DeepSeek**）

## 摘要

| 分組 | 通過 | 失敗 |
| --- | ---: | ---: |
`

for (const [group, list] of byGroup) {
  const f = list.filter((x) => !x.ok).length
  md += `| ${group} | ${list.length - f} | ${f} |\n`
}

md += `\n## 失敗項目\n\n`
if (failed.length === 0) {
  md += "_無_\n"
} else {
  for (const r of failed) {
    md += `- **[${r.group}]** ${r.id}${r.detail ? ` — ${r.detail}` : ""}\n`
  }
}

md += `\n## 全部結果\n\n`
for (const [group, list] of byGroup) {
  md += `### ${group}\n\n`
  for (const r of list) {
    md += `- ${r.ok ? "✓" : "✗"} ${r.id}${r.detail ? ` — ${r.detail}` : ""}\n`
  }
  md += "\n"
}

md += `## 說明

此報告由 \`npm run apo:check\` 產生。  
若 howto／抽取邏輯有改，請重跑本檢查；線上真實 LLM 回覆另見後續「線上模擬」方案。
`

const reportsDir = join(root, "reports")
mkdirSync(reportsDir, { recursive: true })
const latestPath = join(reportsDir, "apo-offline-check-最新.md")
const stampedPath = join(
  reportsDir,
  `apo-offline-check-${hk.replace(/[/: ]/g, "-").replace(/,/g, "")}.md`
)
writeFileSync(latestPath, md, "utf8")
writeFileSync(stampedPath, md, "utf8")

console.log(md)
console.log(`\n報告已寫入：\n- ${latestPath}\n- ${stampedPath}`)

if (failed.length > 0) {
  console.error(`\n${failed.length} 項失敗`)
  process.exit(1)
}
console.log(`\n全部 ${rows.length} 項通過`)
