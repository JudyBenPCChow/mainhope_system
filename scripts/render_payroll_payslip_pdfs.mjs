/**
 * 用計糧頁同一套工資單 HTML／分頁，在瀏覽器裡出 PDF。
 * 用法：node scripts/render_payroll_payslip_pdfs.mjs docs/generated/payroll/2026-10/2026-10_工資單.json
 */
import { readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import { chromium } from "playwright"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const jsonPath = process.argv[2]
if (!jsonPath) {
  console.error("請提供工資單 JSON")
  process.exit(1)
}

const outDir = join(tmpdir(), "mainhope-payslip-pdf")
console.log("組裝計糧頁工資單產生器…")
await build({
  configFile: false,
  root,
  resolve: { alias: { "@": join(root, "src") } },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(""),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(""),
  },
  build: {
    lib: {
      entry: join(root, "scripts/payslip_pdf_browser_entry.ts"),
      formats: ["iife"],
      name: "PayslipPdf",
      fileName: () => "payslip-pdf.js",
    },
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  logLevel: "error",
})

const combinedOnly = process.argv.includes("--combined-only")
const onlyAt = process.argv.indexOf("--only")
const onlyName = onlyAt >= 0 ? process.argv[onlyAt + 1] : ""
const pack = JSON.parse(await readFile(jsonPath, "utf8"))
const month = { ...pack.pdfMonth, teachers: pack.pdfTeachers }
const teachers = pack.pdfTeachers
const selected = onlyName ? teachers.filter((teacher) => teacher.name === onlyName) : teachers
if (onlyName && selected.length === 0) {
  console.error(`找不到 ${onlyName}`)
  process.exit(1)
}
const destDir = dirname(jsonPath)
if (!onlyName) {
  await rm(join(destDir, "個人"), { recursive: true, force: true })
  await rm(join(destDir, `${pack.monthKey}_工資單總表.pdf`), { force: true })
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } })
await page.goto("about:blank")
await page.addScriptTag({ path: join(outDir, "payslip-pdf.js") })

async function render(list, label) {
  console.log(`產生 ${label}…`)
  const payload = await page.evaluate(async ({ month, teachers }) => {
    return globalThis.PayslipPdf.renderPayslipPdf(month, teachers)
  }, { month, teachers: list })
  const file = join(destDir, payload.filename)
  await writeFile(file, Buffer.from(payload.base64, "base64"))
  console.log(payload.filename)
}

if (!combinedOnly) {
  for (const teacher of selected) {
    await render([teacher], teacher.name)
  }
}
if (!onlyName) await render(teachers, `合計 ${teachers.length} 人`)
await browser.close()
console.log(`已寫入 ${destDir}`)
