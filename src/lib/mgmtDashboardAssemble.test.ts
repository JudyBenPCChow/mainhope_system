import { describe, expect, it } from "vitest"

import type { MgmtDashboardFilters, MgmtDashboardPayload } from "@/lib/mgmtDashboardTypes"
import { isLoadOk } from "@/lib/mgmtDashboardTypes"
import {
 asError,
 asOk,
 assembleDashboardPayload,
 assembleFunnel,
 assembleKpis,
 assembleOpsAlerts,
 CSV_LOAD_FAILED,
 EMPTY_ATTENDANCE,
 EMPTY_WITHDRAWAL_ANALYSIS,
 exportMgmtDashboardCsv,
 mergeMgmtDashboardPayload,
 type SettledDashboardInput,
} from "@/lib/mgmtDashboardAssemble"
import { assembleScheduleStatsSnapshot } from "@/lib/scheduleStatsSnapshot"

const filters: MgmtDashboardFilters = {
 dateFrom: "2026-08-01",
 dateTo: "2026-08-16",
 classKind: "all",
 subjectIds: [],
 teacherIds: [],
 classIds: [],
}

const emptyDistribution: MgmtDashboardPayload["distribution"] = {
 bySubject: [],
 byClassKind: [],
 statusBuckets: { registration: [], enrollment: [], activity: [], academicStage: [] },
 classFill: [],
 byTeacher: [],
}

function baseInput(over: Partial<SettledDashboardInput> = {}): SettledDashboardInput {
 return {
  asOf: "2026-08-16 12:00",
  revenue: asOk(1000),
  prevRevenue: asOk(800),
  revenueSeries: asOk([{ label: "8月", amount: 1000, target: null }]),
  unpaid: asOk({ amount: 0, count: 0 }),
  enroll: asOk(3),
  prevEnroll: asOk(2),
  withdraw: asOk(0),
  prevWithdraw: asOk(0),
  trials: asOk(10),
  prevTrials: asOk(8),
  convertedTrials: asOk(4),
  prevConvertedTrials: asOk(4),
  enrolledStudents: asOk(50),
  enrollmentSeats: asOk(70),
  attendanceVisits: asOk({ ...EMPTY_ATTENDANCE, total: 12, juniorGroup: 12 }),
  prevAttendanceTotal: asOk(10),
  teacherLoadAvg: asOk(null),
  withdrawalAnalysis: asOk(EMPTY_WITHDRAWAL_ANALYSIS),
  recentWithdrawals: asOk([]),
  unpaidAlerts: asOk([]),
  unpaidOverdue: asOk([]),
  lessonGaps: asOk([]),
  nearFullClasses: asOk([]),
  distribution: emptyDistribution,
  includeLowAttendancePlaceholder: false,
  ...over,
 }
}

describe("assembleKpis / funnel — 失敗唔扮 0", () => {
 it("試堂 count 失敗 → 轉化率不是 0%＋正常；漏斗同組 error", () => {
  const input = baseInput({ trials: asError("timeout") })
  const kpis = assembleKpis(input)
  const conversion = kpis.find((k) => k.id === "conversion")
  expect(conversion?.loadState).toBe("error")
  expect(conversion?.status).not.toBe("正常")
  expect(conversion?.hint).toBe("資料未能載入")
  expect(assembleFunnel(input.trials, input.convertedTrials, input.enrolledStudents)).toEqual({
   error: "資料未能載入",
  })
  const payload = assembleDashboardPayload(input)
  expect(payload.partialLoadFailed).toBe(true)
  expect("error" in payload.funnel).toBe(true)
 })

 it("本期真 0：顯示 0，不能誤判 error", () => {
  const kpis = assembleKpis(baseInput({ revenue: asOk(0), enroll: asOk(0), trials: asOk(0), convertedTrials: asOk(0) }))
  const revenue = kpis.find((k) => k.id === "revenue")
  const enroll = kpis.find((k) => k.id === "enroll")
  const conversion = kpis.find((k) => k.id === "conversion")
  expect(revenue?.loadState).toBe("ready")
  expect(revenue?.value).toBe(0)
  expect(enroll?.value).toBe(0)
  expect(enroll?.loadState).toBe("ready")
  expect(conversion?.loadState).toBe("ready")
  expect(conversion?.hint).toContain("無法計算")
  expect(assembleFunnel(asOk(0), asOk(0), asOk(0))).toEqual({
   ok: [
    { stage: "試堂", count: 0, conversionPct: null },
    { stage: "已轉化", count: 0, conversionPct: 0 },
    { stage: "在讀", count: 0, conversionPct: null },
   ],
  })
 })

 it("上期失敗、本期成功：主值保留；delta 不顯示", () => {
  const kpis = assembleKpis(baseInput({ prevRevenue: asError("prev timeout"), revenue: asOk(5000) }))
  const revenue = kpis.find((k) => k.id === "revenue")
  expect(revenue?.loadState).toBe("ready")
  expect(revenue?.value).toBe(5000)
  expect(revenue?.deltaPct).toBeNull()
 })

 it("有試堂而 0%＝真 0%，不是失敗", () => {
  const conversion = assembleKpis(baseInput({ trials: asOk(5), convertedTrials: asOk(0) })).find(
   (k) => k.id === "conversion"
  )
  expect(conversion?.loadState).toBe("ready")
  expect(conversion?.value).toBe(0)
  expect(conversion?.format).toBe("percent")
 })
})

describe("assembleOpsAlerts — 欠費失敗唔假綠", () => {
 it("欠費 count 失敗唔當 0 筆無警示", () => {
  const ops = assembleOpsAlerts({
   unpaid: asError("rls"),
   recentWithdrawals: asOk([]),
   nearFullClasses: asOk([]),
   highLoadTeachers: asOk([]),
   conversionDelta: asOk(null),
   includeLowAttendancePlaceholder: false,
  })
  expect(ops.items).toEqual([])
  expect(ops.error).toBe("部分警示未能載入")
 })
})

describe("exportMgmtDashboardCsv", () => {
 it("error 欄不得輸出 0；真 0 必須輸出 0", () => {
  const failed = assembleDashboardPayload(baseInput({ trials: asError("x"), revenue: asOk(0) }))
  const csv = exportMgmtDashboardCsv(failed, filters)
  expect(csv).toContain(`已收款,0,`)
  expect(csv).toContain(`報讀轉化率,${CSV_LOAD_FAILED},`)
  expect(csv).toContain("消堂價值")
  expect(csv).toContain(CSV_LOAD_FAILED)
  const funnelLine = csv.split("\n").find((l) => l.startsWith(CSV_LOAD_FAILED))
  expect(funnelLine).toBeTruthy()
  expect(funnelLine).not.toMatch(/,0(,|$)/)
 })
})

describe("assembleKpis — 毛利／純利", () => {
 it("導師人工已過帳：毛利＝消堂價值 − 人工", () => {
  const kpis = assembleKpis(
   baseInput({
    consumedValue: asOk(10000),
    tutorLabor: asOk({ amount: 4000, posted: true }),
    totalExpenses: asOk(7000),
   })
  )
  expect(kpis.find((k) => k.id === "consumedValue")?.value).toBe(10000)
  expect(kpis.find((k) => k.id === "grossProfit")?.value).toBe(6000)
  expect(kpis.find((k) => k.id === "grossMargin")?.value).toBe(60)
  expect(kpis.find((k) => k.id === "grossProfit")?.loadState).toBe("ready")
  expect(kpis.find((k) => k.id === "netProfit")?.value).toBe(3000)
  expect(kpis.find((k) => k.id === "netMargin")?.value).toBe(30)
 })

 it("導師人工未過帳：毛利卡顯示 pending，唔扮 0", () => {
  const kpis = assembleKpis(
   baseInput({
    consumedValue: asOk(10000),
    tutorLabor: asOk({ amount: 0, posted: false }),
    totalExpenses: asOk(3000),
   })
  )
  const gross = kpis.find((k) => k.id === "grossProfit")
  expect(gross?.loadState).toBe("pending")
  expect(gross?.hint).toContain("尚未結算過帳")
  expect(kpis.find((k) => k.id === "netProfit")?.value).toBe(7000)
  expect(kpis.find((k) => k.id === "netProfit")?.loadState).toBe("ready")
 })
})

describe("mergeMgmtDashboardPayload", () => {
 it("full 用空成功值覆蓋唔得；core 成功保留", () => {
  const summary = assembleDashboardPayload(baseInput({ revenue: asOk(9000) }))
  const full = assembleDashboardPayload(baseInput({ revenue: asError("full timeout") }))
  const merged = mergeMgmtDashboardPayload(summary, full)
  const revenue = merged.kpis.find((k) => k.id === "revenue")
  expect(revenue?.loadState).toBe("ready")
  expect(revenue?.value).toBe(9000)
 })

 it("summary 有利潤卡、full 冇 → merge 保留 summary", () => {
  const summary = assembleDashboardPayload(
   baseInput({
    consumedValue: asOk(20000),
    tutorLabor: asOk({ amount: 8000, posted: true }),
    totalExpenses: asOk(12000),
    profitSeries: asOk([
     {
      monthKey: "2026-07",
      label: "7月",
      consumedValue: 20000,
      tutorLabor: 8000,
      tutorLaborPosted: true,
      totalExpenses: 12000,
      grossProfit: 12000,
      grossMarginPct: 60,
      netProfit: 8000,
      netMarginPct: 40,
     },
    ]),
   })
  )
  const full = assembleDashboardPayload(
  baseInput({ revenue: asError("deferred"), profitSeries: asError("deferred") })
 )
  const merged = mergeMgmtDashboardPayload(summary, full)
  expect(merged.kpis.find((k) => k.id === "grossProfit")?.value).toBe(12000)
  expect(isLoadOk(merged.profitSeries) ? merged.profitSeries.ok[0]?.grossMarginPct : null).toBe(60)
 })
})

describe("assembleScheduleStatsSnapshot", () => {
 it("任一必要 query error → 三張統計未知，不是 0", () => {
  const failed = assembleScheduleStatsSnapshot({
   todayLessonsError: { message: "timeout" },
   todayLessonsCount: 4,
   pendingCancelError: null,
   pendingCancelCount: 0,
   todaySchedError: null,
   todayStudentHeadcount: 12,
  })
  expect("error" in failed).toBe(true)
  if ("ok" in failed) throw new Error("expected error")
  expect(failed.error).toContain("timeout")
 })

 it("成功而 0 仍係真 0", () => {
  expect(
   assembleScheduleStatsSnapshot({
    todayLessonsError: null,
    todayLessonsCount: 0,
    pendingCancelError: null,
    pendingCancelCount: 0,
    todaySchedError: null,
    todayStudentHeadcount: 0,
   })
  ).toEqual({
   ok: { todayLessonCount: 0, pendingCancelledCount: 0, todayStudentHeadcount: 0 },
  })
 })
})
