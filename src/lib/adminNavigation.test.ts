import { describe, expect, it } from "vitest"
import { BellRing, FileText, GraduationCap, HandCoins, Users, Wallet } from "lucide-react"

import {
 ADMIN_ALL_FEATURES_NAV,
 ADMIN_MAIN_NAV,
 ADMIN_WORKSPACE_DESCRIPTION,
 ADMIN_WORKSPACE_TABS,
 adminNavEntryIsActive,
 adminNavPathIsActive,
 filterAdminFeatureSections,
 resolveAdminPageTitle,
 resolveAdminWorkspacePath,
 workspaceTabsForRole,
} from "@/lib/adminNavigation"
import { buildFeatureSections, flattenNav } from "@/lib/navStructure"
import { resolveRoleMainNav } from "@/lib/roleMainNav"
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

 it("學生、課程、收款與跟進群組內容按已確認次序排列", () => {
  const students = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-students"
  )
  const payments = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-payments"
  )
  const courses = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-courses"
  )
  const followup = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-followup"
  )

  expect(students?.kind === "group" ? students.children.map((child) => child.path) : []).toEqual([
   "/Students",
   "/EnrollmentChanges",
   "/PromotionMatch",
   "/ContactUpdateCampaign",
  ])
  expect(students?.kind === "group" ? students.children.map((child) => child.label) : []).toEqual([
   "學生",
   "增退紀錄",
   "宣傳配對",
   "聯絡資料更新",
  ])
  expect(payments?.kind === "group" ? payments.children.map((child) => child.path) : []).toEqual([
   "/Payments",
   "/PaymentHistory",
  ])
  expect(payments?.kind === "group" ? payments.children.map((child) => child.label) : []).toEqual([
   "收款登記",
   "繳費紀錄",
  ])
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
   (entry) => entry.kind === "group" && entry.id === "admin-students"
  )
  const payments = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-payments"
  )
  const followup = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-followup"
  )

  expect(students?.icon).toBe(Users)
  expect(
   students?.kind === "group"
    ? students.children.find((child) => child.path === "/Students")?.icon
    : null
  ).toBe(GraduationCap)
  expect(payments?.icon).toBe(Wallet)
  expect(
   payments?.kind === "group"
    ? payments.children.find((child) => child.path === "/Payments")?.icon
    : null
  ).toBe(HandCoins)
  expect(
   payments?.kind === "group"
    ? payments.children.find((child) => child.path === "/PaymentHistory")?.icon
    : null
  ).toBe(Wallet)
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
  expect(adminNavPathIsActive("/Payments", "/Payments")).toBe(true)
  expect(adminNavPathIsActive("/PaymentHistory", "/Payments")).toBe(false)
  expect(adminNavPathIsActive("/PaymentHistory", "/PaymentHistory")).toBe(true)
  expect(adminNavPathIsActive("/PaymentDiscounts", "/Payments")).toBe(true)
  expect(adminNavPathIsActive("/AcademicCalendar", "/Classes")).toBe(true)
  expect(adminNavPathIsActive("/TeachingRecords", "/Classes")).toBe(true)
  expect(adminNavPathIsActive("/HomeworkTutoring/Fees", "/HomeworkTutoring/Overview")).toBe(true)

  const payments = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-payments"
  )
  const courses = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-courses"
  )
  expect(payments && adminNavEntryIsActive("/Payments", payments)).toBe(true)
  expect(payments && adminNavEntryIsActive("/PaymentHistory", payments)).toBe(true)
  expect(payments && adminNavEntryIsActive("/PaymentDiscounts", payments)).toBe(true)
  expect(courses && adminNavEntryIsActive("/TeachingRecords", courses)).toBe(true)

  const students = ADMIN_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "admin-students"
  )
  expect(students && adminNavEntryIsActive("/Students", students)).toBe(true)
  expect(students && adminNavEntryIsActive("/PortalEnrollmentRequests", students)).toBe(false)
  expect(students && adminNavEntryIsActive("/EnrollmentChanges", students)).toBe(true)
  expect(adminNavPathIsActive("/Students/abc", "/Students")).toBe(true)
  expect(adminNavPathIsActive("/TrialSessions", "/Students")).toBe(false)
 })

 it("行政手機標題跟新 IA 用語", () => {
  expect(resolveAdminPageTitle("/AcademicCalendar")).toBe("專科校曆")
  expect(resolveMobilePageTitle("/HomeworkTutoring/Overview", "admin")).toBe("今日情況")
  expect(resolveMobilePageTitle("/ExpenseJournalRecords", "admin")).toBe("日記帳紀錄")
 })

 it("行政側欄繳費紀錄只出現在收款群組，不另開頂層列", () => {
  const topLevel = resolveRoleMainNav("admin")
  expect(topLevel.filter((entry) => entry.label === "繳費紀錄")).toHaveLength(0)
  const payments = topLevel.find((entry) => entry.kind === "group" && entry.id === "admin-payments")
  expect(payments?.kind === "group" ? payments.children.map((child) => child.label) : []).toEqual([
   "收款登記",
   "繳費紀錄",
  ])
 })

 it("行政側欄學生相關頁只出現在學生群組，不另開頂層列", () => {
  const topLevel = resolveRoleMainNav("admin")
  expect(topLevel.filter((entry) => entry.kind === "leaf" && entry.path === "/Students")).toHaveLength(0)
  const students = topLevel.find((entry) => entry.kind === "group" && entry.id === "admin-students")
  expect(students?.kind === "group" ? students.children.map((child) => child.path) : []).toEqual([
   "/Students",
   "/EnrollmentChanges",
   "/PromotionMatch",
   "/ContactUpdateCampaign",
  ])
  expect(flattenNav(topLevel).some((leaf) => leaf.path === "/PortalEnrollmentRequests")).toBe(false)
  expect(topLevel.some((entry) => entry.label === "家長報讀申請")).toBe(false)
  expect(flattenNav(topLevel).filter((leaf) => leaf.path === "/TrialSessions")).toHaveLength(1)
 })

 it("管理層／財務／外星人仍能從側欄進入繳費紀錄", () => {
  const manager = flattenNav(resolveRoleMainNav("manager"))
  const finance = flattenNav(resolveRoleMainNav("finance"))
  const alien = flattenNav(resolveRoleMainNav("alien"))
  expect(manager.filter((leaf) => leaf.path === "/PaymentHistory").map((leaf) => leaf.label)).toEqual([
   "繳費紀錄",
  ])
  expect(finance.filter((leaf) => leaf.path === "/PaymentHistory").map((leaf) => leaf.label)).toEqual([
   "繳費紀錄",
  ])
  expect(alien.filter((leaf) => leaf.path === "/PaymentHistory").map((leaf) => leaf.label)).toEqual([
   "繳費紀錄",
  ])
  expect(manager.some((leaf) => leaf.path === "/Payments")).toBe(false)
  expect(finance.some((leaf) => leaf.path === "/Payments")).toBe(false)
  expect(alien.some((leaf) => leaf.path === "/Payments")).toBe(true)
 })
})

describe("行政頁內導航", () => {
 it("頁內收款工作區仍保留三個分頁", () => {
  expect(ADMIN_WORKSPACE_TABS.payments.map((tab) => tab.path)).toEqual([
   "/Payments",
   "/PaymentHistory",
   "/PaymentDiscounts",
  ])
  expect(ADMIN_WORKSPACE_TABS.payments.map((tab) => tab.label)).toEqual([
   "收款登記",
   "繳費紀錄",
   "優惠折扣",
  ])
  expect(workspaceTabsForRole("payments", "admin").map((t) => t.path)).toEqual([
   "/Payments",
   "/PaymentHistory",
   "/PaymentDiscounts",
  ])
 })

 it("只在相應工作域解析目前路徑", () => {
  expect(resolveAdminWorkspacePath("payments", "/PaymentHistory")).toBe("/PaymentHistory")
  expect(resolveAdminWorkspacePath("specialty", "/Classes")).toBe("/Classes")
  expect(resolveAdminWorkspacePath("specialty", "/Classes/abc")).toBe("/Classes")
  expect(resolveAdminWorkspacePath("journal", "/ExpenseJournal")).toBe("/ExpenseJournal")
  expect(resolveAdminWorkspacePath("payments", "/Home")).toBeNull()
 })

 it("同一工作域共用簡介文案", () => {
  expect(ADMIN_WORKSPACE_DESCRIPTION.payments).toBe("登記學費、檢視繳費紀錄及管理優惠折扣。")
  expect(ADMIN_WORKSPACE_DESCRIPTION.specialty).toBe("管理專科班、專科校曆及教學紀錄。")
  expect(ADMIN_WORKSPACE_DESCRIPTION.homework).toBe("管理功課輔導的今日情況、報讀、月費、當值與校曆。")
  expect(ADMIN_WORKSPACE_DESCRIPTION.journal).toBe("查閱日記帳紀錄及新增入帳。")
 })

 it("管理層專科工作域只見其可見分頁", () => {
  expect(workspaceTabsForRole("specialty", "manager").map((t) => t.path)).toEqual([
   "/Classes",
   "/AcademicCalendar",
   "/TeachingRecords",
  ])
  expect(workspaceTabsForRole("payments", "manager").map((t) => t.path)).toEqual([
   "/PaymentHistory",
  ])
  expect(workspaceTabsForRole("homework", "manager")).toEqual([])
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
