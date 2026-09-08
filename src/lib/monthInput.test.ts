import { describe, expect, it } from "vitest"

import {
  currentMonthKey,
  formatMonthInputLabel,
  groupMonthInputOptions,
  listMonthInputOptions,
  parseMonthKey,
  shiftMonthKey,
} from "@/lib/monthInput"

const now = new Date(2026, 8, 8) // 2026-09-08

describe("monthInput", () => {
  it("parseMonthKey 接受 YYYY-MM 與 YYYY-MM-DD", () => {
    expect(parseMonthKey("2026-09")).toBe("2026-09")
    expect(parseMonthKey("2026-09-15")).toBe("2026-09")
    expect(parseMonthKey("2026-13")).toBeNull()
    expect(parseMonthKey("")).toBeNull()
  })

  it("formatMonthInputLabel 為年＋月", () => {
    expect(formatMonthInputLabel("2026-09")).toBe("2026年9月")
    expect(formatMonthInputLabel("2026-12")).toBe("2026年12月")
  })

  it("currentMonthKey 跟本機曆月", () => {
    expect(currentMonthKey(now)).toBe("2026-09")
  })

  it("shiftMonthKey 跨年", () => {
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12")
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01")
  })

  it("listMonthInputOptions 由近至遠，含本月與範圍兩端", () => {
    const options = listMonthInputOptions({ now, lookback: 2, lookahead: 1 })
    expect(options.map((o) => o.value)).toEqual(["2026-10", "2026-09", "2026-08", "2026-07"])
    expect(options[0]?.label).toBe("2026年10月")
  })

  it("min／max 裁切，現值即使越界仍保留以免下拉空白", () => {
    const options = listMonthInputOptions({
      now,
      lookback: 2,
      lookahead: 1,
      min: "2026-08",
      max: "2026-10",
      value: "2024-01",
    })
    expect(options.map((o) => o.value)).toEqual(["2026-10", "2026-09", "2026-08", "2024-01"])
  })

  it("groupMonthInputOptions 按年由新至舊", () => {
    const grouped = groupMonthInputOptions(
      listMonthInputOptions({ now: new Date(2026, 0, 1), lookback: 1, lookahead: 1 })
    )
    expect(grouped.map((g) => g.year)).toEqual([2026, 2025])
    expect(grouped[0]?.items.map((i) => i.value)).toEqual(["2026-02", "2026-01"])
    expect(grouped[1]?.items.map((i) => i.value)).toEqual(["2025-12"])
  })
})
