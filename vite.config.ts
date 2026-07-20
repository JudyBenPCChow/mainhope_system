import path from "node:path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

/** 每次 build 唯一識別；優先用 Vercel commit SHA，本地則用時間戳。 */
const appBuildId =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
  process.env.CF_PAGES_COMMIT_SHA?.trim() ||
  `local-${Date.now()}`

function emitAppVersionPlugin(buildId: string): Plugin {
  return {
    name: "emit-app-version",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId }, null, 0),
      })
    },
  }
}

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(appBuildId),
  },
  plugins: [react(), emitAppVersionPlugin(appBuildId)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
