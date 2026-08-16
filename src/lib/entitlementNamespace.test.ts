import { describe, expect, it } from "vitest"

import {
 classNamespaceKey,
 entitlementNamespaceLabel,
 namespacesEqual,
 resolveEntitlementNamespace,
 specialistGradeScopeKey,
} from "@/lib/entitlementNamespace"

const CHI = "c-chi"
const MATH = "c-math"

describe("specialistGradeScopeKey", () => {
 it("uses a single stored grade", () => {
  expect(specialistGradeScopeKey(["中一"], null)).toBe("S1")
  expect(specialistGradeScopeKey(["中四"], "S5")).toBe("S4")
 })

 it("falls back to course grade_code", () => {
  expect(specialistGradeScopeKey([], "S2")).toBe("S2")
  expect(specialistGradeScopeKey(null, "F3")).toBe("S3")
 })

 it("does not share mixed or unknown grade", () => {
  expect(specialistGradeScopeKey(["中一", "中二"], "S1")).toBe(null)
  expect(specialistGradeScopeKey([], null)).toBe(null)
 })
})

describe("resolveEntitlementNamespace", () => {
 it("shares same-grade group specialist classes", () => {
  const chi = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   subject: "中文",
   grade: ["中一"],
   gradeCode: "S1",
  })
  const math = resolveEntitlementNamespace({
   classId: MATH,
   classKind: "group",
   subject: "數學",
   grade: ["中一"],
   gradeCode: "S1",
  })
  expect(chi).toEqual({
   courseGroup: "group_specialist",
   namespaceKey: "S1",
   sharesAcrossClasses: true,
  })
  expect(namespacesEqual(chi, math)).toBe(true)
 })

 it("does not share different grades", () => {
  const s1 = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   subject: "中文",
   gradeCode: "S1",
  })
  const s2 = resolveEntitlementNamespace({
   classId: MATH,
   classKind: "group",
   subject: "數學",
   gradeCode: "S2",
  })
  expect(namespacesEqual(s1, s2)).toBe(false)
 })

 it("keeps private, trial, and homework per class", () => {
  const priv = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "private",
   subject: "中文 一對一",
   gradeCode: "S1",
  })
  const trial = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   subject: "中文",
   gradeCode: "S1",
   isTrial: true,
  })
  const hw = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   subject: "功課輔導",
   courseName: "功課輔導班",
   gradeCode: "S1",
  })
  expect(priv).toEqual({
   courseGroup: "private",
   namespaceKey: classNamespaceKey(CHI),
   sharesAcrossClasses: false,
  })
  expect(trial.courseGroup).toBe("trial")
  expect(hw.courseGroup).toBe("homework")
  expect(namespacesEqual(priv, trial)).toBe(false)
 })

 it("does not mix trial into specialist even on the same class", () => {
  const regular = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   gradeCode: "S1",
  })
  const trial = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   gradeCode: "S1",
   isTrial: true,
  })
  expect(namespacesEqual(regular, trial)).toBe(false)
 })

 it("falls back to per-class when grade is mixed", () => {
  const ns = resolveEntitlementNamespace({
   classId: CHI,
   classKind: "group",
   grade: ["中一", "中二"],
  })
  expect(ns.sharesAcrossClasses).toBe(false)
  expect(ns.namespaceKey).toBe(classNamespaceKey(CHI))
 })
})

describe("entitlementNamespaceLabel", () => {
 it("names a shared specialist pool by grade", () => {
  expect(
   entitlementNamespaceLabel(
    { courseGroup: "group_specialist", namespaceKey: "S1", sharesAcrossClasses: true },
    "中文 S1A"
   )
  ).toBe("專科小組（中一）")
 })
})
