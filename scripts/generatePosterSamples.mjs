#!/usr/bin/env node
/**
 * 產生宣傳配對海報測試圖（1／2／4／7 班）
 * 執行：node scripts/generatePosterSamples.mjs
 * 需本機已安裝 Playwright Chromium（首次可 npx playwright install chromium）
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { createServer } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "tmp", "poster-samples")

fs.mkdirSync(outDir, { recursive: true })

const server = await createServer({
  configFile: false,
  root,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(root, "src"),
    },
  },
  server: { port: 5188, strictPort: true },
})

await server.listen()

const runnerUrl = "http://localhost:5188/scripts/poster-sample-runner.html"

let chromium
try {
  ;({ chromium } = await import("playwright"))
} catch {
  await server.close()
  console.error(
    "缺少 playwright 套件。請執行：npm install -D playwright && npx playwright install chromium"
  )
  process.exit(1)
}

const browser = await chromium.launch()
const page = await browser.newPage()

try {
  await page.goto(runnerUrl, { waitUntil: "networkidle", timeout: 60_000 })
  await page.waitForFunction(() => window.done === true, { timeout: 60_000 })
  const samples = await page.evaluate(() => window.samples)

  for (const count of [1, 2, 4, 7]) {
    const dataUrl = samples[String(count)]
    if (!dataUrl?.startsWith("data:image/png;base64,")) {
      throw new Error(`班別 ${count} 未產生有效 PNG data URL`)
    }
    const b64 = dataUrl.replace(/^data:image\/png;base64,/, "")
    const filePath = path.join(outDir, `poster-${count}-classes.png`)
    fs.writeFileSync(filePath, Buffer.from(b64, "base64"))
    console.log("寫入", filePath)
  }

  const bafsUrl = samples.bafs
  if (!bafsUrl?.startsWith("data:image/png;base64,")) {
    throw new Error("BAFS 單班未產生有效 PNG data URL")
  }
  fs.writeFileSync(
    path.join(outDir, "poster-bafs-screenshot-case.png"),
    Buffer.from(bafsUrl.replace(/^data:image\/png;base64,/, ""), "base64")
  )
  console.log("寫入", path.join(outDir, "poster-bafs-screenshot-case.png"))
} finally {
  await browser.close()
  await server.close()
}

console.log(`完成：${outDir}`)
