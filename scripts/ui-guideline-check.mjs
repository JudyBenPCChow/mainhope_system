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

function extractSelectInners(content) {
  const inners = []
  const openRe = /<Select\b/g
  let m
  while ((m = openRe.exec(content)) !== null) {
    const start = m.index
    const openEnd = content.indexOf(">", start)
    if (openEnd === -1) continue
    let depth = 1
    let i = openEnd + 1
    while (i < content.length) {
      const nextOpen = content.indexOf("<Select", i)
      const nextClose = content.indexOf("</Select>", i)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        const nestedEnd = content.indexOf(">", nextOpen)
        i = nestedEnd === -1 ? nextOpen + 7 : nestedEnd + 1
        continue
      }
      depth -= 1
      if (depth === 0) {
        inners.push(content.slice(openEnd + 1, nextClose))
        break
      }
      i = nextClose + "</Select>".length
    }
  }
  return inners
}

function findSelectOptionChildViolations(content) {
  const violations = []
  for (const inner of extractSelectInners(content)) {
    const hasOption = /<option\b/.test(inner)
    if (!hasOption) continue

    if (
      /<>\s*[\s\S]*?<option\b/.test(inner) ||
      /\{\s*<>[\s\S]*?<option\b/.test(inner) ||
      /\?\s*\(\s*<>[\s\S]*?<option\b/.test(inner) ||
      /<React\.Fragment\b[\s\S]*?<option\b/.test(inner)
    ) {
      violations.push({
        message:
          "Select 子元素勿用 Fragment 包裹 <option>；請改為直接子節點、陣列展開或三元回傳 <option>（見 docs/UI_DESIGN_INSTRUCTIONS.md §12）",
      })
      continue
    }

    const customWrapper = [...inner.matchAll(/^\s*<([A-Z][A-Za-z0-9]*)\b/gm)]
      .map((match) => match[1])
      .filter((name) => name !== "Select")
    if (customWrapper.length > 0) {
      violations.push({
        message: `Select 子元素勿用自訂元件（${customWrapper.join(", ")}）包裹 <option>；選項須為直接子節點`,
      })
    }
  }
  return violations
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

  for (const v of findSelectOptionChildViolations(content)) {
    violations.push({
      file,
      rule: "select-option-children",
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
