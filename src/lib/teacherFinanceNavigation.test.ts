import { describe, expect, it } from "vitest"
import { BookOpen, ClipboardList, NotebookPen, Wallet } from "lucide-react"

import { FINANCE_ALL_FEATURES_NAV, FINANCE_MAIN_NAV } from "@/lib/financeNavigation"
import { HW_PATH } from "@/lib/homeworkTutoringNav"
import { filterAdminFeatureSections } from "@/lib/adminNavigation"
import { buildFeatureSections } from "@/lib/navStructure"
import { resolveRoleMainNav } from "@/lib/roleMainNav"
import {
 TEACHER_MAIN_NAV,
 resolveTeacherAllFeaturesNav,
 resolveTeacherMainNav,
 resolveTeacherPageTitle,
} from "@/lib/teacherNavigation"
import { resolveMobilePageTitle } from "@/lib/mobileNav"

describe("老師側欄 IA", () => {
 it("有功輔入口時固定 8 個頂層列", () => {
  expect(
   resolveTeacherMainNav({
    homeworkTutoringNavVisible: true,
    homeworkTutorOnly: false,
   }).map((entry) => entry.label)
  ).toEqual([
   "首頁",
   "點名",
   "時間表",
   "我的班別",
   "排程",
   "教學與資源",
   "功課輔導",
   "所有功能",
  ])
 })

 it("無功輔入口時去掉功課輔導群組", () => {
  expect(
   resolveTeacherMainNav({
    homeworkTutoringNavVisible: false,
    homeworkTutorOnly: false,
   }).map((entry) => entry.label)
  ).toEqual(["首頁", "點名", "時間表", "我的班別", "排程", "教學與資源", "所有功能"])
 })

 it("純功輔導師只保留 4 列", () => {
  expect(
   resolveTeacherMainNav({
    homeworkTutoringNavVisible: true,
    homeworkTutorOnly: true,
   }).map((entry) => entry.label)
  ).toEqual(["首頁", "功輔報更", "我的當值", "所有功能"])
 })

 it("教學與資源／功輔群組次序正確", () => {
  const teaching = TEACHER_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "teacher-teaching"
  )
  const homework = TEACHER_MAIN_NAV.find(
   (entry) => entry.kind === "group" && entry.id === "teacher-homework"
  )
  expect(teaching?.kind === "group" ? teaching.children.map((c) => c.label) : []).toEqual([
   "教學紀錄",
   "我的私人課程",
   "預約空房",
   "出席紀錄",
  ])
  expect(homework?.kind === "group" ? homework.children.map((c) => c.path) : []).toEqual([
   HW_PATH.submit,
   HW_PATH.myDuty,
  ])
  expect(teaching?.icon).toBe(NotebookPen)
  expect(homework?.icon).toBe(ClipboardList)
  expect(
   teaching?.kind === "group"
    ? teaching.children.find((c) => c.path === "/Classes")
    : undefined
  ).toBeUndefined()
  expect(TEACHER_MAIN_NAV.find((e) => e.kind === "leaf" && e.path === "/Classes")?.icon).toBe(
   BookOpen
  )
 })

 it("角色主選單解析走老師真源", () => {
  const labels = resolveRoleMainNav("teacher", {
   homeworkTutoringNavVisible: true,
   homeworkTutorOnly: false,
  }).map((e) => e.label)
  expect(labels[0]).toBe("首頁")
  expect(labels).toContain("教學與資源")
  expect(labels.at(-1)).toBe("所有功能")
 })

 it("手機標題跟新 IA 用語", () => {
  expect(
   resolveTeacherPageTitle("/PrivateTutoring", {
    homeworkTutoringNavVisible: true,
    homeworkTutorOnly: false,
   })
  ).toBe("我的私人課程")
  expect(resolveMobilePageTitle(HW_PATH.submit, "teacher")).toBe("功輔報更")
 })
})

describe("老師所有功能", () => {
 it("一般老師網站地圖含功輔分類", () => {
  const sections = buildFeatureSections(
   "teacher",
   resolveTeacherAllFeaturesNav({
    homeworkTutoringNavVisible: true,
    homeworkTutorOnly: false,
   })
  )
  expect(sections.map((s) => s.label)).toEqual([
   "首頁與通知",
   "課堂與點名",
   "班別與教學",
   "課室",
   "功課輔導",
   "帳戶",
  ])
 })

 it("無功輔入口時地圖不含功輔分類", () => {
  const sections = buildFeatureSections(
   "teacher",
   resolveTeacherAllFeaturesNav({
    homeworkTutoringNavVisible: false,
    homeworkTutorOnly: false,
   })
  )
  expect(sections.map((s) => s.label)).not.toContain("功課輔導")
 })

 it("可搜尋功能名", () => {
  const sections = buildFeatureSections(
   "teacher",
   resolveTeacherAllFeaturesNav({
    homeworkTutoringNavVisible: true,
    homeworkTutorOnly: false,
   })
  )
  expect(
   filterAdminFeatureSections(sections, "預約").flatMap((s) => s.items.map((i) => i.path))
  ).toEqual(["/RoomBooking"])
 })
})

describe("財務側欄 IA", () => {
 it("固定為 6 個頂層列", () => {
  expect(FINANCE_MAIN_NAV.map((entry) => entry.label)).toEqual([
   "首頁",
   "計糧",
   "出席紀錄",
   "繳費紀錄",
   "排程",
   "所有功能",
  ])
  expect(FINANCE_MAIN_NAV.filter((entry) => entry.kind === "leaf")).toHaveLength(5)
  expect(FINANCE_MAIN_NAV.find((e) => e.kind === "leaf" && e.path === "/Payroll")?.icon).toBe(
   Wallet
  )
 })

 it("角色主選單解析走財務真源", () => {
  expect(resolveRoleMainNav("finance").map((e) => e.label)).toEqual([
   "首頁",
   "計糧",
   "出席紀錄",
   "繳費紀錄",
   "排程",
   "所有功能",
  ])
 })

 it("財務所有功能分類與搜尋", () => {
  const sections = buildFeatureSections("finance", FINANCE_ALL_FEATURES_NAV)
  expect(sections.map((s) => s.label)).toEqual([
   "首頁與通知",
   "計糧與核對",
   "繳費",
   "設定",
  ])
  expect(
   filterAdminFeatureSections(sections, "Payroll").flatMap((s) => s.items.map((i) => i.label))
  ).toEqual(["計糧"])
 })

 it("手機標題跟財務 IA", () => {
  expect(resolveMobilePageTitle("/PaymentHistory", "finance")).toBe("繳費紀錄")
  expect(resolveMobilePageTitle("/AttendanceRecords", "finance")).toBe("出席紀錄")
 })
})
