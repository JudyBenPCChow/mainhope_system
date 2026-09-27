import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  ADMIN_DOCUMENT_TITLE,
  AD_PUBLIC_DOCUMENT_TITLE,
  documentTitleForLocation,
} from "./adPublicDocument"

describe("ad public document title", () => {
  it("keeps the management title on the system host", () => {
    expect(documentTitleForLocation("/Home", "system.mainhope.edu.hk")).toBe(ADMIN_DOCUMENT_TITLE)
    expect(documentTitleForLocation("/Students", "localhost")).toBe(ADMIN_DOCUMENT_TITLE)
  })

  it("uses the public brand on the ad host even outside form routes", () => {
    expect(documentTitleForLocation("/", "ad.mainhope.edu.hk")).toBe(AD_PUBLIC_DOCUMENT_TITLE)
    expect(documentTitleForLocation("/Home", "ad.mainhope.edu.hk")).toBe(AD_PUBLIC_DOCUMENT_TITLE)
  })

  it("names each public form for sharing and the browser tab", () => {
    expect(documentTitleForLocation("/AdTrial", "system.mainhope.edu.hk")).toBe(
      "新生試堂登記 — 明學教育",
    )
    expect(documentTitleForLocation("/AdTrial/thanks", "ad.mainhope.edu.hk")).toBe(
      "已收到試堂登記 — 明學教育",
    )
    expect(documentTitleForLocation("/AdInterest/", "ad.mainhope.edu.hk")).toBe(
      "查詢登記 — 明學教育",
    )
    expect(documentTitleForLocation("/AdInterest/thanks", "ad.mainhope.edu.hk")).toBe(
      "已收到查詢 — 明學教育",
    )
    expect(documentTitleForLocation("/AdHomework", "ad.mainhope.edu.hk")).toBe(
      "功課輔導班查詢 — 明學教育",
    )
    expect(documentTitleForLocation("/Privacy", "ad.mainhope.edu.hk")).toBe(
      "私隱政策 — 明學教育",
    )
  })

  it("keeps the first-paint titles in both html shells", () => {
    const root = path.resolve(import.meta.dirname, "../..")
    const indexHtml = readFileSync(path.join(root, "index.html"), "utf8")
    const adHtml = readFileSync(path.join(root, "ad.html"), "utf8")
    for (const title of [
      "新生試堂登記 — 明學教育",
      "已收到試堂登記 — 明學教育",
      "查詢登記 — 明學教育",
      "已收到查詢 — 明學教育",
      "功課輔導班查詢 — 明學教育",
      "私隱政策 — 明學教育",
    ]) {
      expect(indexHtml).toContain(title)
      expect(adHtml).toContain(title)
    }
    expect(indexHtml).toContain(ADMIN_DOCUMENT_TITLE)
    expect(adHtml).toContain(`<title>${AD_PUBLIC_DOCUMENT_TITLE}</title>`)
    expect(adHtml).toContain("og-image.png")
    expect(indexHtml).toContain("/favicon.png")
  })
})
