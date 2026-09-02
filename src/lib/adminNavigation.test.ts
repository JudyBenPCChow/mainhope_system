import { describe, expect, it } from "vitest"
import { BellRing, FileText, GraduationCap, Users, Wallet } from "lucide-react"

import {
 ADMIN_ALL_FEATURES_NAV,
 ADMIN_MAIN_NAV,
 ADMIN_WORKSPACE_DESCRIPTION,
 adminNavEntryIsActive,
 adminNavPathIsActive,
 filterAdminFeatureSections,
 resolveAdminPageTitle,
 resolveAdminWorkspacePath,
} from "@/lib/adminNavigation"
import { buildFeatureSections } from "@/lib/navStructure"
import { resolveMobilePageTitle } from "@/lib/mobileNav"

describe("行政側欄 IA", () => {
 it("固定為 8 個頂層列", () => {
  expect(ADMIN_MAIN_NAV.map((entry) => entry.label)).toEqual([
   "首頁",
   "學生",
   "排程",
   "點名",
   "收款登記",
   "課程",
   "跟進與紀錄",
   "所有功能",
  ])
 })

 it("課程與跟進群組內容按已確認次序排列", () => {
  const courses = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-courses"
  )
  const followup = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-followup"
  )

  expect(courses?.kind === "group" ? courses.children.map((child) => child.label) : []).toEqual([
   "專科班",
   "私人課程",
   "功課輔導",
  ])
  expect(followup?.kind === "group" ? followup.children.map((child) => child.label) : []).toEqual([
   "課堂提醒",
   "請假管理",
   "試堂紀錄",
   "出席紀錄",
  ])
 })

 it("行政側欄使用已確認的圖示語意", () => {
  const students = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "leaf" && entry.path === "/Students"
  )
  const payments = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "leaf" && entry.path === "/Payments"
  )
  const followup = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-followup"
  )

  expect(students?.icon).toBe(Users)
  expect(payments?.icon).toBe(Wallet)
  expect(followup?.icon).toBe(BellRing)
  expect(
   followup?.kind === "group"
    ? followup.children.find((child) => child.path === "/TrialSessions")?.icon
    : null
  ).toBe(GraduationCap)
  expect(
   followup?.kind === "group"
    ? followup.children.find((child) => child.path === "/AttendanceRecords")?.icon
    : null
  ).toBe(FileText)
 })

 it("工作域兄弟頁會高亮同一側欄入口", () => {
  expect(adminNavPathIsActive("/PaymentHistory", "/Payments")).toBe(true)
  expect(adminNavPathIsActive("/PaymentDiscounts", "/Payments")).toBe(true)
  expect(adminNavPathIsActive("/AcademicCalendar", "/Classes")).toBe(true)
  expect(adminNavPathIsActive("/TeachingRecords", "/Classes")).toBe(true)
  expect(adminNavPathIsActive("/HomeworkTutoring/Fees", "/HomeworkTutoring/Overview")).toBe(true)

  const courses = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-courses"
  )
  expect(courses && adminNavEntryIsActive("/TeachingRecords", courses)).toBe(true)
 })

 it("行政手機標題跟新 IA 用語", () => {
  expect(resolveAdminPageTitle("/AcademicCalendar")).toBe("專科校曆")
  expect(resolveMobilePageTitle("/HomeworkTutoring/Overview", "admin")).toBe("今日情況")
  expect(resolveMobilePageTitle("/ExpenseJournalRecords", "admin")).toBe("日記帳紀錄")
 })
})

describe("行政頁內導航", () => {
 it("只在相應工作域解析目前路徑", () => {
  expect(resolveAdminWorkspacePath("payments", "/PaymentHistory")).toBe("/PaymentHistory")
  expect(resolveAdminWorkspacePath("specialty", "/Classes")).toBe("/Classes")
  expect(resolveAdminWorkspacePath("specialty", "/Classes/abc")).toBe("/Classes")
  expect(resolveAdminWorkspacePath("journal", "/ExpenseJournal")).toBe("/ExpenseJournal")
  expect(resolveAdminWorkspacePath("payments", "/Home")).toBeNull()
 })

 it("同一工作域共用簡介文案", () => {
  expect(ADMIN_WORKSPACE_DESCRIPTION.payments).toContain("收款")
  expect(ADMIN_WORKSPACE_DESCRIPTION.specialty).toContain("專科")
  expect(ADMIN_WORKSPACE_DESCRIPTION.homework).toContain("功輔")
  expect(ADMIN_WORKSPACE_DESCRIPTION.journal).toContain("日記帳")
 })
})

describe("行政所有功能", () => {
 const sections = buildFeatureSections("admin", ADMIN_ALL_FEATURES_NAV)

 it("使用 8 個網站地圖分類", () => {
  expect(sections.map((section) => section.label)).toEqual([
   "首頁與收件匣",
   "學生與報讀",
   "課程與教學",
   "排程、出席與跟進",
   "收款與帳務",
   "教務與資源",
   "報表與分析",
   "工具與系統",
  ])
 })

 it("可按功能名、分類名或路徑搜尋", () => {
  expect(filterAdminFeatureSections(sections, "優惠").flatMap((s) => s.items.map((i) => i.path))).toEqual([
   "/PaymentDiscounts",
  ])
  expect(filterAdminFeatureSections(sections, "教務").map((section) => section.label)).toEqual([
   "教務與資源",
  ])
  expect(
   filterAdminFeatureSections(sections, "PaymentHistory").flatMap((s) =>
    s.items.map((item) => item.label)
   )
  ).toEqual(["繳費紀錄"])
 })
})
