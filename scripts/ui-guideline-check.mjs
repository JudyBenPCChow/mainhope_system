#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const projectRoot = process.cwd()
const srcRoot = join(projectRoot, "src")

const ALLOW_NATIVE_SELECT_FILES = new Set([
  join(srcRoot, "components/ui/select.tsx"),
])

const checks = [
  {
    id: "no-alert",
    description: "禁止使用 alert()",
    test(content) {
      return /\balert\s*\(/g.test(content)
    },
    message: "請改用全域 Banner（useAppBanner）",
  },
  {
    id: "no-confirm",
    description: "禁止使用 confirm()",
    test(content) {
      return /\bconfirm\s*\(/g.test(content)
    },
    message: "請改用全域 Confirm Dialog（useAppConfirm）",
  },
]

function collectTsxFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue
      out.push(...collectTsxFiles(full))
      continue
    }
    if (entry.endsWith(".tsx")) out.push(full)
  }
  return out
}

function findHardcodedStatusTagViolations(content) {
  const violations = []
  const tagRegex = /<Tag\b([^>]*)>([\s\S]*?)<\/Tag>/g
  let m
  while ((m = tagRegex.exec(content)) !== null) {
    const attrs = m[1] ?? ""
    const body = m[2] ?? ""
    const bodyHasStatusExpr = /\{[^}]*\b[a-zA-Z0-9_]*status[a-zA-Z0-9_]*\b[^}]*\}/.test(body)
    const bodyHasStatusDotExpr = /\{[^}]*\.[a-zA-Z0-9_]*status[a-zA-Z0-9_]*[^}]*\}/.test(body)
    const bodyHasStatus = bodyHasStatusExpr || bodyHasStatusDotExpr
    if (!bodyHasStatus) continue

    const toneAttr = attrs.match(/\btone\s*=\s*(\{[^}]*\}|"[^"]*")/)
    if (!toneAttr) continue
    const toneExpr = toneAttr[1] ?? ""
    const usesDictionary = /statusToTagTone\s*\(/.test(toneExpr)
    if (!usesDictionary) {
      violations.push({
        index: m.index,
        message: "狀態型 Tag 必須使用 statusToTagTone(...) 映射",
      })
    }
  }
  return violations
}

const files = collectTsxFiles(srcRoot)
const violations = []

for (const file of files) {
  const content = readFileSync(file, "utf8")

  for (const check of checks) {
    if (check.test(content)) {
      violations.push({
        file,
        rule: check.id,
        detail: `${check.description}；${check.message}`,
      })
    }
  }

  if (!ALLOW_NATIVE_SELECT_FILES.has(file) && /<select\b/.test(content)) {
    violations.push({
      file,
      rule: "no-native-select",
      detail: "禁止直接使用原生 <select>；請改用共用 Select（@/components/ui/select）",
    })
  }

  for (const v of findHardcodedStatusTagViolations(content)) {
    violations.push({
      file,
      rule: "status-tag-mapping",
      detail: v.message,
    })
  }
}

if (violations.length === 0) {
  console.log("UI guideline check passed.")
  process.exit(0)
}

console.error(`UI guideline check failed with ${violations.length} violation(s):`)
for (const v of violations) {
  console.error(`- [${v.rule}] ${relative(projectRoot, v.file)}: ${v.detail}`)
}
process.exit(1)
