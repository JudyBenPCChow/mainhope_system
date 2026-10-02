import { describe, expect, it } from "vitest"

import {
  AD_HOMEWORK_FAQS,
  AD_HOMEWORK_HERO,
  AD_HOMEWORK_HIGHLIGHTS,
  AD_HOMEWORK_SCHOOLS,
  takeGroupClassPreview,
} from "./adPublicLandingCopy"

describe("takeGroupClassPreview", () => {
  it("keeps specialty classes only and caps the list at six", () => {
    const classes = [
      ...Array.from({ length: 8 }, (_, index) => ({ id: `g${index}`, class_kind: "group" })),
      { id: "h1", class_kind: "homework" },
    ]
    expect(takeGroupClassPreview(classes).map((row) => row.id)).toEqual(["g0", "g1", "g2", "g3", "g4", "g5"])
  })

  it("returns nothing when the grade has no specialty class", () => {
    expect(takeGroupClassPreview([{ id: "h1", class_kind: "homework" }])).toEqual([])
  })
})

describe("homework landing copy", () => {
  it("names both primary and secondary students", () => {
    expect(AD_HOMEWORK_HERO.prices[0]).toContain("小學")
    expect(AD_HOMEWORK_HERO.prices[0]).toContain("2,500")
    expect(AD_HOMEWORK_HERO.prices[1]).toContain("中學")
    expect(AD_HOMEWORK_HERO.prices[1]).toContain("2,800")

    const support = AD_HOMEWORK_HIGHLIGHTS.find((item) => item.title.includes("跨科"))
    expect(support?.body).toContain("小學")
    expect(support?.body).toContain("中學")
    expect(support?.body).not.toContain("中學各科")

    const fit = AD_HOMEWORK_FAQS.find((item) => item.q.includes("適合"))
    expect(fit?.a).toContain("小一")
    expect(fit?.a).toContain("中一")
    expect(fit?.a.startsWith("主要適合中一")).toBe(false)

    expect(AD_HOMEWORK_SCHOOLS).toContain("中學")
    expect(AD_HOMEWORK_SCHOOLS).toContain("小學")
  })
})
