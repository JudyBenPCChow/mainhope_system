/**
 * 計糧 UI 長截圖（免登入 /PayrollUiPreview）
 *
 * 用法（先開 dev server，建議 --host 127.0.0.1）：
 *   npm run dev -- --host 127.0.0.1 --port 5174
 *   PAYROLL_PREVIEW_URL=http://127.0.0.1:5174/PayrollUiPreview node scripts/payroll-ui-screenshots.mjs
 *
 * 輸出：docs/payroll-ui-preview/*.png
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const outDir = path.join(root, "docs", "payroll-ui-preview")
const base = process.env.PAYROLL_PREVIEW_URL ?? "http://127.0.0.1:5174/PayrollUiPreview"

async function setPreviewRole(page, role) {
  const label = role === "finance" ? "財務 — 計糧工作台" : "管理層 — 計糧核實"
  const trigger = page.getByRole("combobox").first()
  await trigger.click()
  await page.getByRole("option", { name: label }).click()
  await page.waitForTimeout(350)
}

async function shot(page, name) {
  const file = path.join(outDir, name)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(250)
  await page.screenshot({
    path: file,
    fullPage: true,
    animations: "disabled",
  })
  console.log("wrote", file)
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  })

  try {
    await page.goto(base, { waitUntil: "networkidle", timeout: 60_000 })
    await page.getByText("計糧 UI 預覽").first().waitFor({ timeout: 30_000 })

    await setPreviewRole(page, "finance")
    await shot(page, "01-finance-workbench.png")

    const ack = page.locator('input[type="checkbox"]')
    if (await ack.count()) {
      await ack.first().check({ force: true }).catch(() => {})
    }
    await page.getByRole("button", { name: "提交管理層核實" }).click()
    await page.waitForTimeout(600)
    await shot(page, "02-finance-submitted.png")

    await setPreviewRole(page, "manager")
    await shot(page, "03-manager-verify.png")

    await page.getByText("Billy Shek").first().click()
    await page.waitForTimeout(250)
    const drill = page.getByRole("button", { name: /展開堂數明細/ })
    if (await drill.count()) {
      await drill.first().click()
      await page.waitForTimeout(500)
    }
    await shot(page, "04-manager-drilldown.png")

    await page.setViewportSize({ width: 390, height: 844 })
    await setPreviewRole(page, "finance")
    await shot(page, "05-finance-mobile.png")

    await setPreviewRole(page, "manager")
    await shot(page, "06-manager-mobile.png")

    const readme = `# 計糧 UI 預覽截圖（給 Mark Yu）

產生時間：${new Date().toISOString()}
來源：本地 mock \`/PayrollUiPreview\`（**不接真實薪酬資料**）

## 檔案

| 檔案 | 內容 |
| --- | --- |
| 01-finance-workbench.png | 財務工作台：異常待辦、堂數總覽、逐堂明細 |
| 02-finance-submitted.png | 財務提交核實後（唯讀等待） |
| 03-manager-verify.png | 管理層核實台：待核實摘要、同事薪酬表 |
| 04-manager-drilldown.png | 管理層抽查展開堂數明細 |
| 05-finance-mobile.png | 財務 · 手機寬度 |
| 06-manager-mobile.png | 管理層 · 手機寬度 |

## 流程說明（與截圖對應）

1. 財務審閱異常與堂數 → 提交管理層核實  
2. 管理層睇摘要 → 可退回或「核實並結算」  
3. 財務**不能**直接結算；管理層**原則上不改金額**

## 互動版（可選）

若要親自撳頁面：請開臨時預覽連結（本地 tunnel 或帶 \`VITE_PAYROLL_UI_PREVIEW=1\` 的暫存部署），**無需 git commit／push 到主線**。
`
    await writeFile(path.join(outDir, "README.md"), readme, "utf8")
    console.log("done →", outDir)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
