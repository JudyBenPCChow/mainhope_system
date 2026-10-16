#!/usr/bin/env node
/**
 * Agent 非畫面改庫：寫入 mgmt_audit_log，並寄通知到 cfan@mainhope.edu.hk。
 *
 *   node scripts/agent-db-change-notify.mjs --summary "短標題" --detail "明細…"
 *   node scripts/agent-db-change-notify.mjs --summary "…" --detail-file /tmp/detail.txt
 *   node scripts/agent-db-change-notify.mjs --dry-run --summary "…" --detail "…"
 *
 * 環境：.env（VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY）、.env.mail（RESEND_API_KEY）
 * 金鑰勿印出。--skip-mail / --skip-audit 僅供除錯。
 */
import { createClient } from "@supabase/supabase-js"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TO = "cfan@mainhope.edu.hk"
const ACTOR = "agent"
const ROLE = "alien"
const ACTION = "agent_db_change"
const PATH_LABEL = "/agent/db-change"

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function parseArgs(argv) {
  const out = { _: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith("--")) {
      out._.push(token)
      continue
    }
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next == null || next.startsWith("--")) {
      out[key] = true
      continue
    }
    out[key] = next
    i += 1
  }
  return out
}

function hkNowLabel() {
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(/\//g, "-")
}

function loadSupabase() {
  const env = { ...parseEnvFile(path.join(ROOT, ".env")), ...process.env }
  const url = (env.VITE_SUPABASE_URL || env.SUPABASE_URL || "").trim()
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  return { url, key }
}

function buildSubject(summary) {
  const s = String(summary || "").trim().replace(/\s+/g, " ")
  if (!s) throw new Error("必須提供 --summary（短標題，用於主旨）")
  return `【AGENT】修改${s}`
}

function buildBody({ summary, detail, conversation, whenLabel }) {
  const lines = [
    "【以下為 Agent 非畫面改庫通知，請勿回覆本電郵。】",
    "",
    `時間：${whenLabel}（香港）`,
    `摘要：${summary.trim()}`,
    "",
    "明細：",
    String(detail || "").trim() || "（無）",
  ]
  if (conversation?.trim()) {
    lines.push("", `對話／來源：${conversation.trim()}`)
  }
  lines.push("", "明學教育")
  return lines.join("\n")
}

function buildAuditRow({ summary, detail, conversation }) {
  const detailParts = [String(detail || "").trim()]
  if (conversation?.trim()) detailParts.push(`conversation=${conversation.trim()}`)
  return {
    actor_label: ACTOR,
    role: ROLE,
    action: ACTION,
    path: PATH_LABEL,
    detail: `${summary.trim()}\n\n${detailParts.filter(Boolean).join("\n")}`.slice(0, 8000),
  }
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function insertAuditViaLinked(row) {
  const sql = [
    "insert into public.mgmt_audit_log (actor_label, role, action, path, detail)",
    "values (",
    `  ${sqlLiteral(row.actor_label)},`,
    `  ${sqlLiteral(row.role)},`,
    `  ${sqlLiteral(row.action)},`,
    `  ${sqlLiteral(row.path)},`,
    `  ${sqlLiteral(row.detail)}`,
    ")",
    "returning id, created_at;",
  ].join("\n")
  const r = spawnSync("supabase", ["db", "query", "--linked", sql], {
    cwd: ROOT,
    encoding: "utf8",
  })
  if (r.status !== 0) {
    return { ok: false, error: (r.stderr || r.stdout || `exit ${r.status}`).trim(), via: "supabase-linked" }
  }
  const out = `${r.stdout || ""}\n${r.stderr || ""}`
  const idMatch = out.match(/"id"\s*:\s*"([^"]+)"/)
  const atMatch = out.match(/"created_at"\s*:\s*"([^"]+)"/)
  return {
    ok: true,
    id: idMatch?.[1] ?? null,
    created_at: atMatch?.[1] ?? null,
    via: "supabase-linked",
  }
}

async function insertAudit({ summary, detail, conversation, dryRun }) {
  const row = buildAuditRow({ summary, detail, conversation })
  if (dryRun) {
    return { ok: true, dryRun: true, row }
  }
  const { url, key } = loadSupabase()
  if (url && key) {
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const { data, error } = await supabase.from("mgmt_audit_log").insert(row).select("id, created_at").single()
    if (error) return { ok: false, error: error.message, via: "service-role" }
    return { ok: true, id: data.id, created_at: data.created_at, via: "service-role" }
  }
  const linked = insertAuditViaLinked(row)
  if (linked.ok) return linked
  return {
    ok: false,
    error:
      (linked.error || "未能寫入 mgmt_audit_log") +
      "；無 SUPABASE_SERVICE_ROLE_KEY 且 supabase db query --linked 失敗。請用 skill 後備 SQL（MCP execute_sql）補寫",
    via: "none",
  }
}

function sendMail({ subject, text, dryRun }) {
  if (dryRun) {
    return { ok: true, dryRun: true, subject, to: TO }
  }
  const r = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "scripts/mcp/resend-mail-server.mjs"),
      "--send",
      "--to",
      TO,
      "--subject",
      subject,
      "--text",
      text,
    ],
    { cwd: ROOT, encoding: "utf8" },
  )
  if (r.status !== 0) {
    return {
      ok: false,
      error: (r.stderr || r.stdout || `exit ${r.status}`).trim(),
    }
  }
  return { ok: true, stdout: (r.stdout || "").trim() }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(
      [
        "用法：node scripts/agent-db-change-notify.mjs --summary <短標題> --detail <明細>",
        "      node scripts/agent-db-change-notify.mjs --summary <短標題> --detail-file <檔>",
        "選項：--conversation <id或說明> --dry-run --skip-mail --skip-audit",
        "",
      ].join("\n"),
    )
    process.exit(0)
  }

  const summary = String(args.summary || "").trim()
  let detail = String(args.detail || "").trim()
  if (args["detail-file"]) {
    detail = fs.readFileSync(String(args["detail-file"]), "utf8").trim()
  }
  if (!summary) {
    process.stderr.write("錯誤：必須 --summary\n")
    process.exit(1)
  }
  if (!detail) {
    process.stderr.write("錯誤：必須 --detail 或 --detail-file\n")
    process.exit(1)
  }

  const dryRun = Boolean(args["dry-run"])
  const skipMail = Boolean(args["skip-mail"])
  const skipAudit = Boolean(args["skip-audit"])
  const conversation = args.conversation ? String(args.conversation) : ""
  const whenLabel = hkNowLabel()
  const subject = buildSubject(summary)
  const text = buildBody({ summary, detail, conversation, whenLabel })

  const result = { subject, to: TO, dryRun, audit: null, mail: null }

  if (!skipAudit) {
    result.audit = await insertAudit({ summary, detail, conversation, dryRun })
  } else {
    result.audit = { ok: true, skipped: true }
  }

  if (!skipMail) {
    result.mail = sendMail({ subject, text, dryRun })
  } else {
    result.mail = { ok: true, skipped: true }
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

  const auditFail = result.audit && !result.audit.ok
  const mailFail = result.mail && !result.mail.ok
  if (auditFail || mailFail) process.exit(2)
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(1)
})
