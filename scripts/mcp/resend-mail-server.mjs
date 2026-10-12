#!/usr/bin/env node
/**
 * 明學本機寄信 MCP（stdio）。
 * 發件人固定。金鑰讀自環境變數或專案根目錄 .env.mail，不寫入回覆。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_FROM = "明學教育 <noreply@mainhope.edu.hk>";
const MAX_FILES = 5;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function mailConfig() {
  const file = parseEnvFile(path.join(ROOT, ".env.mail"));
  const apiKey = (process.env.RESEND_API_KEY || file.RESEND_API_KEY || "").trim();
  const from = (process.env.RESEND_FROM || file.RESEND_FROM || DEFAULT_FROM).trim() || DEFAULT_FROM;
  return { apiKey, from, keyFile: path.join(ROOT, ".env.mail") };
}

function statusText() {
  const { apiKey, from, keyFile } = mailConfig();
  if (!apiKey) {
    return [
      "尚未設定寄信金鑰，不能代寄。",
      `請把 Resend 的 RESEND_API_KEY 寫入 ${keyFile}（此檔已被 git 忽略）。`,
      "金鑰與 Supabase secret RESEND_API_KEY 相同，可在 Resend 後台複製。不要把金鑰貼進對話。",
      "寫入後若此工具仍顯示未設定，在 Cursor 重新載入 MCP。",
    ].join("\n");
  }
  return `寄信已就緒。發件人：${from}`;
}

function asAddressList(value, label) {
  if (value == null || value === "") return [];
  const raw = Array.isArray(value) ? value : String(value).split(/[,;]/);
  const list = raw.map((item) => String(item).trim()).filter(Boolean);
  for (const address of list) {
    if (!EMAIL_RE.test(address)) {
      throw new Error(`${label}不是有效電郵地址：${address}`);
    }
  }
  return list;
}

function isBlockedAttachment(resolved) {
  const base = path.basename(resolved);
  if (base === ".env" || base.startsWith(".env")) return true;
  if (base === "credentials.json" || base === "id_rsa" || base.endsWith(".pem")) return true;
  return resolved.split(path.sep).includes(".git");
}

function resolveAttachment(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("附件路徑是空的。");
  const abs = path.resolve(ROOT, raw);
  if (!fs.existsSync(abs)) throw new Error(`找不到附件：${raw}`);
  const rootReal = fs.realpathSync(ROOT);
  const real = fs.realpathSync(abs);
  if (real !== rootReal && !real.startsWith(rootReal + path.sep)) {
    throw new Error(`附件必須在工作區內：${raw}`);
  }
  if (isBlockedAttachment(real)) throw new Error(`此檔不可作為附件：${path.basename(real)}`);
  const stat = fs.statSync(real);
  if (!stat.isFile()) throw new Error(`附件不是檔案：${raw}`);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`附件超過 15MB：${raw}`);
  return { filename: path.basename(real), bytes: fs.readFileSync(real), size: stat.size };
}

async function sendEmail(args) {
  const { apiKey, from } = mailConfig();
  if (!apiKey) {
    throw new Error(statusText());
  }
  const to = asAddressList(args.to, "收件人");
  if (to.length === 0) throw new Error("未填收件人。");
  const cc = asAddressList(args.cc, "副本");
  const bcc = asAddressList(args.bcc, "密件副本");
  const subject = String(args.subject || "").trim();
  if (!subject) throw new Error("未填主旨。");
  if (subject.length > 300) throw new Error("主旨過長。");
  const text = args.text == null ? "" : String(args.text);
  const html = args.html == null ? "" : String(args.html);
  if (!text.trim() && !html.trim()) throw new Error("未填內文。");

  const paths = Array.isArray(args.attachments) ? args.attachments : [];
  if (paths.length > MAX_FILES) throw new Error(`附件不可多於 ${MAX_FILES} 個。`);
  const files = paths.map(resolveAttachment);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) throw new Error("附件合計超過 20MB。");

  const body = {
    from,
    to,
    subject,
    ...(text.trim() ? { text } : {}),
    ...(html.trim() ? { html } : {}),
    ...(cc.length ? { cc } : {}),
    ...(bcc.length ? { bcc } : {}),
    ...(files.length
      ? {
          attachments: files.map((file) => ({
            filename: file.filename,
            content: file.bytes.toString("base64"),
          })),
        }
      : {}),
  };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || payload?.error || `寄信失敗（${res.status}）`;
    throw new Error(String(message));
  }
  const names = files.map((file) => file.filename);
  const attached = names.length ? ` 附件：${names.join("、")}。` : "";
  return `已寄出。收件人：${to.join("、")}。Resend id：${payload.id || "（無）"}。${attached}`;
}

const TOOLS = [
  {
    name: "mail_status",
    description: "檢查明學代寄是否已設定 Resend 金鑰。不顯示金鑰。",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "send_email",
    description:
      "以明學教育 noreply@mainhope.edu.hk 直接寄出電郵。只在使用者於本則訊息明確要求寄出，且已給出收件地址時使用。發件人不可改。附件只限本工作區內的檔案。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["to", "subject"],
      properties: {
        to: {
          description: "收件地址。一個字串，或以逗號分隔，或字串陣列。",
          anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
        },
        cc: {
          description: "副本。",
          anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
        },
        bcc: {
          description: "密件副本。",
          anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
        },
        subject: { type: "string", description: "主旨。" },
        text: { type: "string", description: "純文字內文。與 html 至少填一項。" },
        html: { type: "string", description: "HTML 內文。" },
        attachments: {
          type: "array",
          items: { type: "string" },
          description: "工作區內檔案路徑，相對於專案根目錄或絕對路徑。",
        },
      },
    },
  },
];

function toolResult(text, isError) {
  return { content: [{ type: "text", text }], isError: Boolean(isError) };
}

async function callTool(name, args) {
  if (name === "mail_status") return toolResult(statusText(), !mailConfig().apiKey);
  if (name === "send_email") {
    try {
      return toolResult(await sendEmail(args || {}));
    } catch (err) {
      return toolResult(err instanceof Error ? err.message : String(err), true);
    }
  }
  return toolResult(`沒有這個工具：${name}`, true);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next == null || next.startsWith("--")) {
      out[key] = true;
      continue;
    }
    if (out[key] == null) out[key] = next;
    else if (Array.isArray(out[key])) out[key].push(next);
    else out[key] = [out[key], next];
    i += 1;
  }
  return out;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (args.status) {
    process.stdout.write(`${statusText()}\n`);
    process.exit(mailConfig().apiKey ? 0 : 2);
  }
  if (!args.send) {
    process.stderr.write("用法：node scripts/mcp/resend-mail-server.mjs --status\n");
    process.stderr.write("或加 --send --to --subject --text [--html] [--attach 路徑]\n");
    process.exit(args.help ? 0 : 1);
  }
  const attachments = args.attach == null ? [] : Array.isArray(args.attach) ? args.attach : [args.attach];
  try {
    const text = await sendEmail({
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      subject: args.subject,
      text: args.text,
      html: args.html,
      attachments,
    });
    process.stdout.write(`${text}\n`);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

let writeChain = Promise.resolve();

function sendMessage(msg) {
  const json = JSON.stringify(msg);
  const body = Buffer.from(json, "utf8");
  const packet = Buffer.concat([
    Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii"),
    body,
  ]);
  writeChain = writeChain.then(
    () =>
      new Promise((resolve, reject) => {
        process.stdout.write(packet, (err) => (err ? reject(err) : resolve()));
      }),
  );
  return writeChain;
}

async function handleMessage(msg) {
  if (!msg || typeof msg !== "object") return;
  const id = msg.id;
  const method = msg.method;
  const hasId = Object.prototype.hasOwnProperty.call(msg, "id") && id != null;
  try {
    if (method === "initialize") {
      const requested = msg.params?.protocolVersion;
      const protocolVersion = typeof requested === "string" && requested ? requested : "2024-11-05";
      await sendMessage({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "mainhope-mail", version: "1.0.0" },
        },
      });
      return;
    }
    if (method === "notifications/initialized" || method === "initialized") return;
    if (!hasId) return;
    if (method === "ping") {
      await sendMessage({ jsonrpc: "2.0", id, result: {} });
      return;
    }
    if (method === "tools/list") {
      await sendMessage({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      return;
    }
    if (method === "resources/list") {
      await sendMessage({ jsonrpc: "2.0", id, result: { resources: [] } });
      return;
    }
    if (method === "prompts/list") {
      await sendMessage({ jsonrpc: "2.0", id, result: { prompts: [] } });
      return;
    }
    if (method === "tools/call") {
      const result = await callTool(msg.params?.name, msg.params?.arguments || {});
      await sendMessage({ jsonrpc: "2.0", id, result });
      return;
    }
    await sendMessage({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (err) {
    if (!hasId) return;
    await sendMessage({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
    });
  }
}

function startMcp() {
  let buf = Buffer.alloc(0);
  const pending = [];
  let pumping = false;

  const pump = async () => {
    if (pumping) return;
    pumping = true;
    try {
      while (pending.length) {
        await handleMessage(pending.shift());
      }
    } finally {
      pumping = false;
      if (pending.length) void pump();
    }
  };

  const take = () => {
    while (buf.length) {
      let i = 0;
      while (i < buf.length && (buf[i] === 10 || buf[i] === 13 || buf[i] === 32 || buf[i] === 9)) i += 1;
      if (i) buf = buf.subarray(i);
      if (!buf.length) return;
      if (buf[0] === 0x7b) {
        const nl = buf.indexOf(0x0a);
        if (nl === -1) {
          try {
            pending.push(JSON.parse(buf.toString("utf8")));
            buf = Buffer.alloc(0);
          } catch {
            return;
          }
          continue;
        }
        try {
          pending.push(JSON.parse(buf.subarray(0, nl).toString("utf8")));
          buf = buf.subarray(nl + 1);
        } catch {
          return;
        }
        continue;
      }
      const sep = buf.indexOf("\r\n\r\n");
      if (sep === -1) return;
      const header = buf.subarray(0, sep).toString("ascii");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        buf = buf.subarray(sep + 4);
        continue;
      }
      const len = Number(match[1]);
      const start = sep + 4;
      if (buf.length < start + len) return;
      pending.push(JSON.parse(buf.subarray(start, start + len).toString("utf8")));
      buf = buf.subarray(start + len);
    }
  };

  process.stdin.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    try {
      take();
    } catch (err) {
      process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    }
    void pump();
  });
  process.stdin.on("end", () => {
    try {
      take();
    } catch {
      /* 連線結束時忽略半截訊息 */
    }
    void pump();
  });
}

const cli = process.argv.slice(2);
if (cli.includes("--status") || cli.includes("--send") || cli.includes("--help")) {
  await runCli();
} else {
  startMcp();
}
