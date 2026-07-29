/** 收件匣「營運／系統」分頁 UI 沙盒假資料。不接 DB。 */

export type PrototypeInboxCategory = "ops" | "system"

export type PrototypeInboxRole = "admin" | "alien" | "teacher"

/** 全部人，或指定角色清單 */
export type PrototypeAudience = "all" | PrototypeInboxRole[]

export type PrototypeInboxItem = {
 id: string
 category: PrototypeInboxCategory
 type: string
 statusLabel: string
 title: string
 body: string | null
 createdAt: string
 read: boolean
 /** 沙盒僅作顯示；不導向正式頁 */
 actionPathHint: string | null
 /** 系統通知可見對象；營運列固定 all */
 audience: PrototypeAudience
}

export const ROLE_OPTIONS: { value: PrototypeInboxRole; label: string }[] = [
 { value: "admin", label: "行政 (admin)" },
 { value: "alien", label: "外星人 (alien)" },
 { value: "teacher", label: "老師 (teacher)" },
]

export const AUDIENCE_ROLE_OPTIONS: { value: PrototypeInboxRole; label: string }[] = [
 { value: "admin", label: "行政" },
 { value: "alien", label: "外星人" },
 { value: "teacher", label: "老師" },
]

export const OPS_TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
 { value: "", label: "全部類型" },
 { value: "schedule_created", label: "排程新增" },
 { value: "schedule_updated", label: "排程變動" },
 { value: "schedule_cancelled", label: "排程取消" },
 { value: "schedule_substitute", label: "代堂" },
 { value: "class_updated", label: "班別變動" },
 { value: "enrollment_enroll", label: "新增報讀" },
 { value: "enrollment_withdraw", label: "學生退讀" },
 { value: "leave_created", label: "學生請假" },
 { value: "attendance_reminder", label: "提醒點名" },
]

export function audienceVisibleTo(audience: PrototypeAudience, role: PrototypeInboxRole): boolean {
 if (audience === "all") return true
 return audience.includes(role)
}

export function formatAudienceLabel(audience: PrototypeAudience): string {
 if (audience === "all") return "全部人"
 const labels = AUDIENCE_ROLE_OPTIONS.filter((o) => audience.includes(o.value)).map((o) => o.label)
 return labels.length ? labels.join("、") : "—"
}

const INITIAL_ITEMS: PrototypeInboxItem[] = [
 {
  id: "sys-payment-methods",
  category: "system",
  type: "system_update",
  statusLabel: "系統更新",
  title: "繳費方式選項已更新",
  body:
   "收款登記與「標記已收款」的繳費方式選項已更新，請依實際收款方式選擇，以便單據準確反映。\n\n新增：PayMe、八達通、易辦事、銀聯、銀行轉帳。\n支付寶改為兩項：內地支付寶、香港支付寶。\n其餘維持：現金、轉數快、信用卡、支票、微信支付、其他。",
  createdAt: "2026-07-29T22:30:00+08:00",
  read: false,
  actionPathHint: "/Payments",
  audience: ["admin", "alien"],
 },
 {
  id: "sys-inbox-split",
  category: "system",
  type: "system_update",
  statusLabel: "系統更新",
  title: "收件匣將分為營運通知與系統通知",
  body:
   "收件匣會分成兩個分頁：\n\n・營運通知：排程、代堂、增退讀、請假、點名提醒等日常營運訊息。\n・系統通知：功能更新與選項變更等（例如繳費方式調整）。\n\n可指定可見對象為全部人或特定角色。",
  createdAt: "2026-07-28T11:00:00+08:00",
  read: true,
  actionPathHint: "/Inbox",
  audience: "all",
 },
 {
  id: "ops-leave-1",
  category: "ops",
  type: "leave_created",
  statusLabel: "學生請假",
  title: "陳小明 · 中文專班 請假",
  body: "請假日期：2026-07-30\n原因：事假\n班別：中文專班（CHI-S3-A）\n主責老師：王老師\n\n請留意是否需安排補堂。",
  createdAt: "2026-07-29T18:12:00+08:00",
  read: false,
  actionPathHint: "/LeaveManagement",
  audience: "all",
 },
 {
  id: "ops-sub-1",
  category: "ops",
  type: "schedule_substitute",
  statusLabel: "代堂",
  title: "英文小組 · 指派代堂",
  body: "堂次：2026-07-30 16:00–17:30\n班別：英文小組（ENG-S3-B）\n原任：王老師\n代堂：李老師\n\n此為當日排程老師變更，不改班別主責。",
  createdAt: "2026-07-29T16:40:00+08:00",
  read: false,
  actionPathHint: "/Schedule",
  audience: "all",
 },
 {
  id: "ops-enroll-1",
  category: "ops",
  type: "enrollment_enroll",
  statusLabel: "新增報讀",
  title: "黃小華 報讀 數學專班",
  body: "學生：黃小華（STU-2024-0201）\n班別：數學專班\n報讀形式：全期\n登記來源：前台\n\n請確認首堂日期與學費單據。",
  createdAt: "2026-07-29T14:05:00+08:00",
  read: true,
  actionPathHint: "/EnrollmentChanges",
  audience: "all",
 },
 {
  id: "ops-roll-1",
  category: "ops",
  type: "attendance_reminder",
  statusLabel: "提醒點名",
  title: "今日尚未點名：中文專班",
  body: "日期：2026-07-29\n時間：15:00–16:30\n班別：中文專班\n老師：王老師\n\n請盡快完成點名，以免堂數統計延遲。",
  createdAt: "2026-07-29T15:30:00+08:00",
  read: false,
  actionPathHint: "/Attendance",
  audience: "all",
 },
 {
  id: "ops-sched-1",
  category: "ops",
  type: "schedule_created",
  statusLabel: "排程新增",
  title: "一對一 · 新增 4 堂排程",
  body: "已批次新增 4 堂一對一排程（摘要一則，避免洗版）。\n時段：8 月起每週三 17:00\n主責：李老師",
  createdAt: "2026-07-28T09:20:00+08:00",
  read: true,
  actionPathHint: "/Schedule",
  audience: "all",
 },
 {
  id: "ops-cancel-1",
  category: "ops",
  type: "schedule_cancelled",
  statusLabel: "排程取消",
  title: "小組課 · 取消 7/31 堂次",
  body: "取消日期：2026-07-31\n原因：課室維修\n已通知相關老師。\n\n如需補堂，請另行安排。",
  createdAt: "2026-07-27T20:00:00+08:00",
  read: true,
  actionPathHint: "/Schedule",
  audience: "all",
 },
]

export function cloneInitialInboxItems(): PrototypeInboxItem[] {
 return INITIAL_ITEMS.map((item) => ({
  ...item,
  audience: item.audience === "all" ? "all" : [...item.audience],
 }))
}
