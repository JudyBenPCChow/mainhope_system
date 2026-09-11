import { describe, expect, it } from "vitest"
import {
  buildMonthTeacherLaborCosts,
  describeSettledLaborSource,
  emptySettledLaborIndex,
  laborForSettledMonth,
  laborForSettledPeriod,
} from "@/lib/staffPerformanceLabor"

describe("buildMonthTeacherLaborCosts", () => {
  it("sums gross and employer MPF by teacher id", () => {
    const { costs, names } = buildMonthTeacherLaborCosts({
      teachers: [
        { id: "a", name: "Amy", gross: 10000, employerMpf: 500 },
        { id: "b", name: "Bob", gross: 0, employerMpf: 100 },
      ],
      excludedTeacherIds: new Set(),
    })
    expect(costs.get("a")).toBe(10500)
    expect(costs.get("b")).toBe(0)
    expect(names.get("a")).toBe("Amy")
  })

  it("records excluded teachers as zero cost", () => {
    const { costs } = buildMonthTeacherLaborCosts({
      teachers: [{ id: "x", name: "X", gross: 8000, employerMpf: 400 }],
      excludedTeacherIds: new Set(["x"]),
    })
    expect(costs.get("x")).toBe(0)
  })
})

describe("laborForSettledMonth / period", () => {
  it("marks unsettled months as missing", () => {
    const index = emptySettledLaborIndex()
    expect(laborForSettledMonth(index, "2026-08", "t1")).toEqual({ cost: 0, missing: true })
  })

  it("reads settled teacher cost and sums period", () => {
    const index = emptySettledLaborIndex()
    index.settledMonths.add("2026-07")
    index.settledMonths.add("2026-08")
    index.costByMonthTeacher.set("2026-07", new Map([["t1", 1000]]))
    index.costByMonthTeacher.set("2026-08", new Map([["t1", 2500]]))

    expect(laborForSettledMonth(index, "2026-08", "t1")).toEqual({ cost: 2500, missing: false })
    expect(laborForSettledPeriod(index, ["2026-07", "2026-08"], "t1")).toEqual({
      cost: 3500,
      missing: false,
    })
    expect(laborForSettledPeriod(index, ["2026-09"], "t1").missing).toBe(true)
  })
})

describe("describeSettledLaborSource", () => {
  it("explains mixed settled and unsettled months", () => {
    expect(describeSettledLaborSource(["2026-08", "2026-09"], new Set(["2026-08"]))).toBe(
      "人工＝已結算計糧（2026-08）；未結算：2026-09"
    )
    expect(describeSettledLaborSource(["2026-09"], new Set())).toContain("尚未有已結算計糧")
  })
})
