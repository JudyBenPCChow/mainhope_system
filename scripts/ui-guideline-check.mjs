#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const projectRoot = process.cwd()
const srcRoot = join(projectRoot, "src")

const ALLOW_NATIVE_SELECT_FILES = new Set([
  join(srcRoot, "components/ui/select.tsx"),
  // 長名單推薦人：流動裝置保留原生 OS picker；勿盲換 Radix Select（見 UI_DESIGN_INSTRUCTIONS §12 例外）
  join(srcRoot, "components/payments/PaymentsPageView.tsx"),
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
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".") || entry === "prototypes") continue
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
          "Select 子元素勿用 Fragment 包裹 <option>；請改為直接子節點、陣列展開或三元回傳 <option>（見 docs/meta/UI_DESIGN_INSTRUCTIONS.md §12）",
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

const SEMANTIC_TONES = ["warning", "success", "info", "destructive", "primary"]
const TINT_OPACITY_MAX = 40

/** `hover:bg-warning/10` → { variantKey: "hover", core: "bg-warning/10" } */
function splitUtilityToken(token) {
  const variants = []
  let rest = token
  while (rest.length > 0) {
    if (rest.startsWith("[")) {
      const close = rest.indexOf("]:")
      if (close === -1) break
      variants.push(rest.slice(0, close + 1))
      rest = rest.slice(close + 2)
      continue
    }
    const colon = rest.indexOf(":")
    if (colon === -1) break
    variants.push(rest.slice(0, colon))
    rest = rest.slice(colon + 1)
  }
  return { variantKey: variants.join(":"), core: rest }
}

function findTintForegroundViolations(content) {
  const violations = []
  const strRe = /["']([^"']{0,800})["']/g
  let m
  while ((m = strRe.exec(content)) !== null) {
    const str = m[1] ?? ""
    if (!/\bbg-/.test(str) || !/\btext-/.test(str)) continue
    const byVariant = new Map()
    for (const tok of str.split(/\s+/)) {
      if (!tok) continue
      const { variantKey, core } = splitUtilityToken(tok)
      let group = byVariant.get(variantKey)
      if (!group) {
        group = { tints: new Map(), foregrounds: new Set() }
        byVariant.set(variantKey, group)
      }
      const bg = core.match(new RegExp(`^bg-(${SEMANTIC_TONES.join("|")})\\/(\\d+)$`))
      if (bg && Number(bg[2]) <= TINT_OPACITY_MAX) {
        group.tints.set(bg[1], bg[2])
      }
      const fg = core.match(new RegExp(`^text-(${SEMANTIC_TONES.join("|")})-foreground$`))
      if (fg) group.foregrounds.add(fg[1])
    }
    for (const group of byVariant.values()) {
      for (const [tone, opacity] of group.tints) {
        if (!group.foregrounds.has(tone)) continue
        violations.push({
          message: `淺底 bg-${tone}/${opacity} 唔好配 text-${tone}-foreground（白字會睇唔到）；請改 text-${tone} 或實心 bg-${tone}（見 UI_DESIGN_INSTRUCTIONS §9）`,
        })
      }
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
    const usesDictionary =
      /statusToTagTone\s*\(/.test(toneExpr) || /todoStatusTone\s*\(/.test(toneExpr)
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

  for (const v of findTintForegroundViolations(content)) {
    violations.push({
      file,
      rule: "tint-foreground-contrast",
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
