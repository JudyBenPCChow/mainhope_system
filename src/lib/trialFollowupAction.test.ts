import { describe, expect, it } from "vitest"

import {
  displayTrialTypeLabel,
  trialFollowupKind,
  trialIsAwaitingReschedule,
  trialIsCancelled,
  trialIsOverdueOpen,
  trialStatusAfterReschedule,
  type TrialFollowupRow,
} from "./trialFollowupAction"

const today = "2026-10-16"

function row(over: Partial<TrialFollowupRow>): TrialFollowupRow {
  return {
    outcome: "open",
    status: "已預約",
    payment_id: "p1",
    payment_status: "已收款",
    roll_call_done: false,
    trial_date: "2026-10-16",
    ...over,
  }
}

describe("trialFollowupKind", () => {
  it("已結束不再給主動作", () => {
    expect(trialFollowupKind(row({ outcome: "converted", status: "已完成" }), today)).toBe("closed")
    expect(trialFollowupKind(row({ outcome: "lost", status: "取消" }), today)).toBe("closed")
    expect(trialFollowupKind(row({ outcome: "other", status: "已完成" }), today)).toBe("closed")
  })

  it("待改期主動作是改期，即使未收款或試堂日已過", () => {
    expect(trialFollowupKind(row({ status: "待改期", payment_id: null, payment_status: null }), today)).toBe(
      "reschedule"
    )
    expect(
      trialFollowupKind(row({ status: "待改期", trial_date: "2026-10-10", roll_call_done: true }), today)
    ).toBe("reschedule")
  })

  it("已取消且待跟進只留標流失，不去收款", () => {
    expect(
      trialFollowupKind(
        row({ status: "取消", payment_id: null, payment_status: null }),
        today
      )
    ).toBe("mark_lost")
    expect(
      trialFollowupKind(row({ status: "取消", payment_status: "已收款" }), today)
    ).toBe("mark_lost")
  })

  it("待跟進未可上紙 → 前往收款", () => {
    expect(
      trialFollowupKind(row({ payment_id: null, payment_status: null }), today)
    ).toBe("collect")
    expect(
      trialFollowupKind(row({ payment_status: "待收款" }), today)
    ).toBe("collect")
  })

  it("已可上紙、未點名、試堂日未到或當天尚未點名 → 等上課", () => {
    expect(
      trialFollowupKind(row({ trial_date: "2026-10-20", roll_call_done: false }), today)
    ).toBe("wait_class")
    expect(
      trialFollowupKind(row({ trial_date: today, roll_call_done: false }), today)
    ).toBe("wait_class")
  })

  it("已可上紙且已點名，或試堂日已過 → 正式報讀", () => {
    expect(
      trialFollowupKind(row({ roll_call_done: true, trial_date: "2026-10-20" }), today)
    ).toBe("convert")
    expect(
      trialFollowupKind(row({ roll_call_done: false, trial_date: "2026-10-10" }), today)
    ).toBe("convert")
    expect(
      trialFollowupKind(row({ roll_call_done: true, trial_date: today }), today)
    ).toBe("convert")
  })
})

describe("trialIsOverdueOpen", () => {
  it("只計待跟進且未取消、試堂日已過", () => {
    expect(trialIsOverdueOpen(row({ trial_date: "2026-10-10" }), today)).toBe(true)
    expect(trialIsOverdueOpen(row({ trial_date: today }), today)).toBe(false)
    expect(trialIsOverdueOpen(row({ trial_date: "2026-10-10", status: "取消" }), today)).toBe(false)
    expect(trialIsOverdueOpen(row({ trial_date: "2026-10-10", status: "待改期" }), today)).toBe(false)
    expect(
      trialIsOverdueOpen(row({ trial_date: "2026-10-10", outcome: "converted" }), today)
    ).toBe(false)
  })
})

describe("displayTrialTypeLabel", () => {
  it("體驗課顯示為免費試堂", () => {
    expect(displayTrialTypeLabel("體驗課")).toBe("免費試堂")
    expect(displayTrialTypeLabel("半價試堂")).toBe("半價試堂")
  })
})

describe("trialIsCancelled", () => {
  it("認取消字，待改期不是取消", () => {
    expect(trialIsCancelled("取消")).toBe(true)
    expect(trialIsCancelled("已預約")).toBe(false)
    expect(trialIsCancelled("待改期")).toBe(false)
    expect(trialIsAwaitingReschedule("待改期")).toBe(true)
  })
})

describe("trialStatusAfterReschedule", () => {
  it("待改期回復已預約", () => {
    expect(trialStatusAfterReschedule("待改期")).toBe("已預約")
    expect(trialStatusAfterReschedule("已預約")).toBe("已預約")
  })
})
