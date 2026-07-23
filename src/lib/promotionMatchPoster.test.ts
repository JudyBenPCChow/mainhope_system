import { describe, expect, it } from "vitest"

import {
  buildBafsPosterSample,
  buildPosterCanvasSpec,
  buildSamplePosterClasses,
  chunkPosterClasses,
  computeCardLayout,
  displayClassTitle,
  extractClassCode,
  getPosterLayoutMode,
  getSubjectTagStyle,
  POSTER_BACKGROUND_SIZE,
  POSTER_CLASSES_PER_IMAGE,
  wrapCanvasText,
} from "./promotionMatchPoster"

const POSTER_SPEC = buildPosterCanvasSpec(
  POSTER_BACKGROUND_SIZE.width,
  POSTER_BACKGROUND_SIZE.height
)

describe("wrapCanvasText", () => {
  const ctx = {
    measureText: (text: string) => ({ width: text.length * 10 }),
  } as Pick<CanvasRenderingContext2D, "measureText">

  it("keeps short text on one line", () => {
    expect(wrapCanvasText(ctx, "中文班", 100)).toEqual(["中文班"])
  })

  it("wraps long text by character width", () => {
    expect(wrapCanvasText(ctx, "abcdefghij", 50)).toEqual(["abcde", "fghij"])
  })
})

describe("getPosterLayoutMode", () => {
  it("uses large layout for 1–2 classes", () => {
    expect(getPosterLayoutMode(1)).toBe("large")
    expect(getPosterLayoutMode(2)).toBe("large")
  })

  it("uses standard layout for 3–4 classes", () => {
    expect(getPosterLayoutMode(3)).toBe("standard")
    expect(getPosterLayoutMode(4)).toBe("standard")
  })

  it("uses grid layout only if a page somehow exceeds the per-image cap", () => {
    expect(getPosterLayoutMode(5)).toBe("grid")
    expect(getPosterLayoutMode(7)).toBe("grid")
  })
})

describe("chunkPosterClasses", () => {
  it("keeps up to 4 classes on a single page", () => {
    expect(chunkPosterClasses([1, 2, 3, 4])).toEqual([[1, 2, 3, 4]])
    expect(POSTER_CLASSES_PER_IMAGE).toBe(4)
  })

  it("splits 5–8 classes into 2 pages of at most 4", () => {
    expect(chunkPosterClasses([1, 2, 3, 4, 5])).toEqual([[1, 2, 3, 4], [5]])
    expect(chunkPosterClasses([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ])
  })

  it("splits 9–12 classes into 3 pages", () => {
    const ids = Array.from({ length: 12 }, (_, i) => i + 1)
    expect(chunkPosterClasses(ids)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ])
  })
})

describe("extractClassCode / displayClassTitle", () => {
  it("extracts trailing parenthetical code", () => {
    expect(extractClassCode("Summer S5 Chinese Class (26SM-CHIS5008-A)")).toBe(
      "26SM-CHIS5008-A"
    )
  })

  it("returns null when no code present", () => {
    expect(extractClassCode("中文精讀班")).toBeNull()
  })

  it("strips code from display title", () => {
    expect(displayClassTitle("Summer S5 Chinese Class (26SM-CHIS5008-A)")).toBe(
      "Summer S5 Chinese Class"
    )
  })

  it("supports full-width parentheses in class labels", () => {
    expect(extractClassCode("暑期升中五級企會財班（26SM-BAFSS5 008-A）")).toBe(
      "26SM-BAFSS5 008-A"
    )
    expect(displayClassTitle("暑期升中五級企會財班（26SM-BAFSS5 008-A）")).toBe(
      "暑期升中五級企會財班"
    )
  })
})

describe("getSubjectTagStyle", () => {
  it("maps math and physics to distinct colors", () => {
    expect(getSubjectTagStyle("數學延伸部分（單）")).toEqual({
      bg: "#e6f0ff",
      text: "#1d4ed8",
    })
    expect(getSubjectTagStyle("物理")).toEqual({
      bg: "#fdeee6",
      text: "#c2410c",
    })
    expect(getSubjectTagStyle("數學延伸部分（單）").bg).not.toBe(
      getSubjectTagStyle("物理").bg
    )
  })

  it("maps BAFS full subject name to amber palette", () => {
    expect(getSubjectTagStyle("企業、會計與財務概論")).toEqual({
      bg: "#fef3c7",
      text: "#92400e",
    })
  })

  it("falls back to neutral gray for unknown subjects", () => {
    expect(getSubjectTagStyle("其他")).toEqual({
      bg: "#f1f0ec",
      text: "#57534e",
    })
  })
})

describe("computeCardLayout", () => {
  it("keeps single column for up to 4 classes", () => {
    expect(computeCardLayout(2, POSTER_SPEC).cols).toBe(1)
    expect(computeCardLayout(4, POSTER_SPEC).cols).toBe(1)
  })

  it("switches to two-column grid for 5+ classes", () => {
    const layout = computeCardLayout(7, POSTER_SPEC)
    expect(layout.mode).toBe("grid")
    expect(layout.cols).toBe(2)
    expect(layout.compact).toBe(true)
  })

  it("vertically centers cards when there is spare height", () => {
    for (const count of [1, 2]) {
      const layout = computeCardLayout(count, POSTER_SPEC)
      const blockH = layout.rows * layout.cardH + (layout.rows - 1) * layout.gapY
      expect(layout.centered).toBe(true)
      expect(layout.startY).toBeGreaterThan(layout.contentAreaTop)
      expect(layout.startY).toBeCloseTo(
        layout.contentAreaTop + (layout.contentAreaHeight - blockH) / 2,
        0
      )
    }
  })

  it("keeps cards within the template middle safe zone", () => {
    const layout = computeCardLayout(2, POSTER_SPEC)
    expect(layout.contentAreaTop).toBeGreaterThanOrEqual(
      POSTER_SPEC.contentAreaTop + POSTER_SPEC.contentTopPad
    )
    expect(layout.contentAreaTop + layout.contentAreaHeight).toBeLessThanOrEqual(
      POSTER_SPEC.contentAreaBottom
    )
  })

  it("fits cards within the middle content band", () => {
    for (const count of [1, 2, 4, 7]) {
      const layout = computeCardLayout(count, POSTER_SPEC)
      const blockH = layout.rows * layout.cardH + (layout.rows - 1) * layout.gapY
      expect(blockH).toBeLessThanOrEqual(layout.contentAreaHeight + 1)
      expect(layout.startY + blockH).toBeLessThanOrEqual(
        layout.contentAreaTop + layout.contentAreaHeight + 1
      )
    }
  })

  it("uses the background native dimensions for layout scaling", () => {
    expect(POSTER_SPEC.width).toBe(819)
    expect(POSTER_SPEC.height).toBe(1024)
  })
})

describe("buildSamplePosterClasses", () => {
  it("returns requested count with required fields", () => {
    const classes = buildSamplePosterClasses(4)
    expect(classes).toHaveLength(4)
    for (const cls of classes) {
      expect(cls.label.trim().length).toBeGreaterThan(0)
      expect(cls.schedule).toBeTruthy()
      expect(cls.teacherName).toBeTruthy()
    }
  })

  it("uses math and physics subjects for the 2-class sample", () => {
    const classes = buildSamplePosterClasses(2)
    expect(classes[0]?.subject).toContain("數學")
    expect(classes[1]?.subject).toBe("物理")
  })

  it("includes the BAFS screenshot sample", () => {
    const classes = buildBafsPosterSample()
    expect(classes).toHaveLength(1)
    expect(displayClassTitle(classes[0]?.label ?? "")).toBe("暑期升中五級企會財班")
    expect(classes[0]?.subject).toBe("企業、會計與財務概論")
  })
})
