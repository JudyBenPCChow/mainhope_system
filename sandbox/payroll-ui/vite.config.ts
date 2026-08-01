import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const dir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dir, "../..")

/** 計糧 UI 沙盒：獨立建置，不帶正式 admin 入口／Supabase 環境變數 */
export default defineConfig({
  root: dir,
  // 與正式 app 分開；避免 define 依賴正式 build id
  define: {
    __APP_BUILD_ID__: JSON.stringify(`payroll-sandbox-${Date.now()}`),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(repoRoot, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5188,
  },
  build: {
    outDir: path.resolve(dir, "dist"),
    emptyOutDir: true,
  },
  // 明確唔讀正式 .env 的 Supabase（沙盒唔需要）
  envPrefix: ["VITE_PAYROLL_SANDBOX_"],
})
