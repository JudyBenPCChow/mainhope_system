import { describe, expect, it } from "vitest"

import { parsePaymentReceivePref, paymentsReceiveHref } from "./paymentsReceiveHref"

describe("paymentsReceiveHref", () => {
  it("單筆試堂的參數順序與既有收款連結相同", () => {
    expect(
      paymentsReceiveHref({
        studentId: "s1",
        trials: [{ classId: "c1", trialType: "半價試堂" }],
      }),
    ).toBe("/Payments?studentId=s1&mode=receive&trialPay=half&classId=c1")
  })

  it("多筆試堂各帶自己的類型，同一班只留第一次", () => {
    expect(
      paymentsReceiveHref({
        studentId: "s1",
        trials: [
          { classId: "c1", trialType: "半價試堂" },
          { classId: "c1", trialType: "原價試堂" },
          { classId: "c2", trialType: "免費試堂" },
        ],
      }),
    ).toBe("/Payments?studentId=s1&mode=receive&trialPay=half&classId=c1&trialPay=free&classId=c2")
  })

  it("沒有試堂時帶報讀班別，不含試堂類型", () => {
    expect(
      paymentsReceiveHref({
        studentId: "s1",
        enrollmentClassIds: ["c1", "c1", "c2"],
      }),
    ).toBe("/Payments?studentId=s1&mode=receive&classId=c1&classId=c2")
  })

  it("體驗課沿用免費試堂的收款類型", () => {
    expect(
      paymentsReceiveHref({
        studentId: "s1",
        trials: [{ classId: "c1", trialType: "體驗課" }],
      }),
    ).toBe("/Payments?studentId=s1&mode=receive&trialPay=free&classId=c1")
  })
})

describe("parsePaymentReceivePref", () => {
  it("一個試堂類型套到多個班別", () => {
    const params = new URLSearchParams("studentId=s1&mode=receive&trialPay=half&classId=c1&classId=c2")
    expect(parsePaymentReceivePref(params)).toEqual({
      kind: "trial",
      lines: [
        { classId: "c1", trialPay: "half" },
        { classId: "c2", trialPay: "half" },
      ],
    })
  })

  it("只有班別時當作報讀", () => {
    const params = new URLSearchParams("studentId=s1&mode=receive&classId=c1")
    expect(parsePaymentReceivePref(params)).toEqual({
      kind: "enrollment",
      classIds: ["c1"],
    })
  })

  it("沒有班別也沒有試堂類型時不預填", () => {
    expect(parsePaymentReceivePref(new URLSearchParams("studentId=s1&mode=receive"))).toBeNull()
  })
})
