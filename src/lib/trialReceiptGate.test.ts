import { describe, expect, it } from "vitest"

import { trialMatchesPersonQuery, trialReceiptGate, matchesReceiptTab, trialAddPrefill, nextScheduleSelection } from "./trialReceiptGate"

describe("trialReceiptGate", () => {
  it("treats missing payment as unissued", () => {
    expect(trialReceiptGate({ paymentId: null, paymentStatus: null })).toBe("unissued")
  })

  it("treats confirmed receipt as received", () => {
    expect(trialReceiptGate({ paymentId: "p1", paymentStatus: "已收款" })).toBe("received")
  })

  it("treats linked but unpaid receipts as pending", () => {
    expect(trialReceiptGate({ paymentId: "p1", paymentStatus: "待收款" })).toBe("pending")
    expect(trialReceiptGate({ paymentId: "p1", paymentStatus: "作廢" })).toBe("pending")
  })
})

describe("trialMatchesPersonQuery", () => {
  const row = {
    student_name: "陳大文",
    student_whatsapp: "91234567",
    student_phone: null,
    parent_phone: "85298887777",
  }

  it("matches name", () => {
    expect(trialMatchesPersonQuery(row, "大文")).toBe(true)
  })

  it("matches phone digits across whatsapp and parent phone", () => {
    expect(trialMatchesPersonQuery(row, "9123")).toBe(true)
    expect(trialMatchesPersonQuery(row, "98887777")).toBe(true)
  })

  it("ignores short digit fragments", () => {
    expect(trialMatchesPersonQuery(row, "91")).toBe(false)
  })
})

describe("matchesReceiptTab", () => {
  it("treats unpaid as anything not yet confirmed", () => {
    expect(matchesReceiptTab("unissued", "unpaid")).toBe(true)
    expect(matchesReceiptTab("pending", "unpaid")).toBe(true)
    expect(matchesReceiptTab("received", "unpaid")).toBe(false)
  })
})

describe("trial add prefill", () => {
  it("keeps a still-valid wanted session", () => {
    const params = new URLSearchParams({ studentId: "stu", classId: "cls", scheduleId: "sch" })
    expect(trialAddPrefill(params)).toMatchObject({
      studentId: "stu",
      classId: "cls",
      scheduleId: "sch",
      hint: "已帶入想試的班別與堂次，可再修改。",
    })
    expect(nextScheduleSelection("sch", ["sch", "other"]).replaced).toBe(false)
  })

  it("flags an expired intention and replaces a missing session", () => {
    const params = new URLSearchParams({ studentId: "stu", intentExpired: "1" })
    expect(trialAddPrefill(params).hint).toContain("已不能用")
    expect(nextScheduleSelection("gone", ["nearest"])).toEqual({ id: "nearest", replaced: true })
  })
})
