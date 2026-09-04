import { describe, expect, it } from "vitest"

import {
 buildPinnablePage,
 findPinnableNavLeaf,
 hideDefaultHomeActionPath,
 navLeafMatchScore,
 normalizePinnableHref,
 parsePinnedPagePaths,
 resolvePinnedPages,
 togglePinnedPagePaths,
 visibleDefaultHomeActionPaths,
} from "@/lib/pinnedPages"

describe("navLeafMatchScore", () => {
 it("日視圖 query 高於排程清單", () => {
  const list = navLeafMatchScore("/Schedule", "view=day", "/Schedule")
  const day = navLeafMatchScore("/Schedule", "view=day", "/Schedule?view=day")
  expect(day).toBeGreaterThan(list)
  expect(list).toBeGreaterThan(0)
 })

 it("清單頁不誤配日視圖項目", () => {
  expect(navLeafMatchScore("/Schedule", "", "/Schedule?view=day")).toBe(0)
  expect(navLeafMatchScore("/Schedule", "", "/Schedule")).toBeGreaterThan(0)
 })

 it("學生詳情可釘選學生列表頁", () => {
  expect(navLeafMatchScore("/Students/abc", "", "/Students")).toBeGreaterThan(0)
 })

 it("首頁只在精確路徑匹配", () => {
  expect(navLeafMatchScore("/Home", "", "/Home")).toBeGreaterThan(0)
  expect(navLeafMatchScore("/HomeworkTutoring/Overview", "", "/Home")).toBe(0)
 })
})

describe("findPinnableNavLeaf", () => {
 it("行政在日視圖釘選日視圖而非排程管理", () => {
  const leaf = findPinnableNavLeaf("/Schedule", "?view=day", "admin")
  expect(leaf?.path).toBe("/Schedule?view=day")
  expect(leaf?.label).toBe("日視圖")
 })

 it("行政在排程清單釘選排程管理", () => {
  const leaf = findPinnableNavLeaf("/Schedule", "", "admin")
  expect(leaf?.path).toBe("/Schedule")
  expect(leaf?.label).toBe("排程管理")
 })
})

describe("buildPinnablePage / 二級視圖", () => {
 it("學生活躍與名冊是兩個不同釘選", () => {
  const active = buildPinnablePage("/Students", "", "admin")
  const roster = buildPinnablePage("/Students", "scope=roster", "admin")
  expect(active?.href).toBe("/Students?scope=active")
  expect(active?.label).toBe("學生管理 · 活躍")
  expect(roster?.href).toBe("/Students?scope=roster")
  expect(roster?.label).toBe("學生管理 · 學生名冊")
 })

 it("排程清單／表格／日視圖分開記住", () => {
  const list = buildPinnablePage("/Schedule", "", "admin")
  expect(list?.href).toBe("/Schedule?view=byDate")
  expect(list?.label).toBe("排程管理 · 清單")
  expect(buildPinnablePage("/Schedule", "view=list", "admin")?.label).toBe("排程管理 · 表格")
  expect(buildPinnablePage("/Schedule", "?view=day", "admin")?.label).toBe("日視圖")
 })

 it("學生詳情不強制記住名冊範圍", () => {
  const page = buildPinnablePage("/Students/abc", "", "admin")
  expect(page?.href).toBe("/Students?scope=active")
  expect(page?.label).toBe("學生管理")
 })

 it("舊的／Students 正規成活躍", () => {
  expect(normalizePinnableHref("/Students")).toBe("/Students?scope=active")
 })
})

describe("parsePinnedPagePaths / togglePinnedPagePaths", () => {
 it("壞資料當空；陣列與 JSON 字串皆可", () => {
  expect(parsePinnedPagePaths("{nope")).toEqual([])
  expect(parsePinnedPagePaths(null)).toEqual([])
  expect(parsePinnedPagePaths(["/Payments", "Payments", "/Payments"])).toEqual(["/Payments"])
 })

 it("釘選放最前，再釘同一項則取消；舊學生路徑與活躍視為同一項", () => {
  const once = togglePinnedPagePaths(["/Payments"], "/Schedule?view=day")
  expect(once).toEqual(["/Schedule?view=day", "/Payments"])
  expect(togglePinnedPagePaths(once, "/Schedule?view=day")).toEqual(["/Payments"])
  const withOld = togglePinnedPagePaths(["/Students"], "/Students?scope=active")
  expect(withOld).toEqual([])
 })
})

describe("visibleDefaultHomeActionPaths", () => {
 it("已釘選與已移走的預設捷徑不再出現", () => {
  const tiles = ["/FrontDeskWizard", "/Payments", "/Schedule?view=day"]
  expect(
   visibleDefaultHomeActionPaths(tiles, ["/Payments"], ["/Schedule?view=day"])
  ).toEqual(["/FrontDeskWizard"])
 })

 it("移走同一捷徑不重複；舊路徑正規後可對上", () => {
  const once = hideDefaultHomeActionPath([], "/Students")
  expect(once).toEqual(["/Students?scope=active"])
  expect(hideDefaultHomeActionPath(once, "/Students?scope=active")).toEqual([
   "/Students?scope=active",
  ])
 })
})

describe("resolvePinnedPages", () => {
 it("略過未知路徑並帶出二級標籤", () => {
  const pages = resolvePinnedPages(["/nope", "/Students?scope=roster", "/Payments"], "admin")
  expect(pages.map((page) => page.href)).toEqual(["/Students?scope=roster", "/Payments"])
  expect(pages[0]?.label).toBe("學生管理 · 學生名冊")
 })
})
