import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

import { resolveCallerFromRequest } from "../_shared/mgmtUserAuth.ts"
import { jsonResponse, corsHeaders } from "../_shared/cors.ts"

const VOID_STATUS = "作廢"
const RECEIVED_STATUS = "已收款"
const PENDING_STATUSES = new Set(["待繳費", "待收款"])

const DEFAULT_NOTIFY_EMAILS = ["markyu@mainhope.edu.hk", "cfan@mainhope.edu.hk"]

type RequestBody = {
  paymentId?: unknown
  reason?: unknown
  password?: unknown
}

function academicYearLabelFromYmd(ymd: string): string {
  const y = Number(ymd.slice(0, 4))
  const m = Number(ymd.slice(5, 7))
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const d = new Date()
    return academicYearLabelFromYmd(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
    )
  }
  if (m === 7 || m === 8) return `${String(y).slice(-2)}SM`
  const startY = m >= 9 ? y : y - 1
  return `${String(startY).slice(-2)}${String(startY + 1).slice(-2)}`
}

function getNextAcademicYearLabel(label: string): string | null {
  const t = label.trim()
  if (/^\d{4}$/.test(t)) {
    const endYy = parseInt(t.slice(2, 4), 10)
    if (!Number.isFinite(endYy)) return null
    return `${String(endYy).padStart(2, "0")}SM`
  }
  if (/^\d{2}SM$/i.test(t)) {
    const yy = parseInt(t.slice(0, 2), 10)
    if (!Number.isFinite(yy)) return null
    return `${String(yy).padStart(2, "0")}${String(yy + 1).padStart(2, "0")}`
  }
  return null
}

function academicYearOrderKey(label: string): number {
  const t = label.trim()
  if (/^\d{2}SM$/i.test(t)) return parseInt(t.slice(0, 2), 10) * 1000 + 500
  if (/^\d{4}$/.test(t)) return parseInt(t.slice(0, 2), 10) * 1000 + 900
  return 0
}

function assertAcademicYearEditable(role: string, paymentDate: string): string | null {
  if (role === "alien") return null
  const label = academicYearLabelFromYmd(paymentDate.slice(0, 10))
  if (role === "admin") {
    const current = academicYearLabelFromYmd(new Date().toISOString().slice(0, 10))
    const next = getNextAcademicYearLabel(current)
    const allowed = new Set(
      [current, next].filter(Boolean).map((x) => String(x).trim().toUpperCase())
    )
    if (!allowed.has(label.trim().toUpperCase())) {
      return `僅 ${current}${next ? ` 及 ${next}` : ""} 學年可作廢單據；其他學年僅供查閱。`
    }
    return null
  }
  if (academicYearOrderKey(label) < 26 * 1000 + 500) {
    return "2526 及更早學年僅供查閱；不可作廢單據。"
  }
  return null
}

function notifyEmails(): string[] {
  const raw = Deno.env.get("PAYMENT_VOID_NOTIFY_EMAILS")?.trim()
  if (!raw) return [...DEFAULT_NOTIFY_EMAILS]
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
}

function moneyHkd(n: number): string {
  return `HK$${Math.round(n * 100) / 100}`
}

async function sendVoidEmail(input: {
  to: string[]
  receiptNumber: string | null
  studentName: string
  amount: number
  paymentDate: string
  actorEmail: string
  actorName: string
  reason: string
  voidedAt: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim()
  const from = Deno.env.get("RESEND_FROM")?.trim() || "明學教育 <noreply@mainhope.edu.hk>"
  if (!apiKey) {
    return { ok: false, message: "未設定 RESEND_API_KEY，無法寄出通知。" }
  }
  if (input.to.length === 0) {
    return { ok: false, message: "未設定通知收件人。" }
  }

  const ref = input.receiptNumber ?? "（無單號）"
  const subject = `【作廢通知】收款單據 ${ref} 已作廢`
  const html = `
    <p>以下已收款單據已於系統作廢，請知悉並抽查報讀／對帳。</p>
    <ul>
      <li>單號：${ref}</li>
      <li>學生：${input.studentName}</li>
      <li>金額：${moneyHkd(input.amount)}</li>
      <li>收款日期：${input.paymentDate}</li>
      <li>操作者：${input.actorName}（${input.actorEmail}）</li>
      <li>作廢原因：${input.reason}</li>
      <li>時間：${input.voidedAt}</li>
    </ul>
    <p>說明：作廢只撤銷「已收款」帳，不會自動退班；學生仍可能為正式報讀但未付款（對帳／追收學費會反映）。請另開正確新單或按需要結束報讀。</p>
  `

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("void-payment Resend failed", res.status, text)
    return { ok: false, message: `寄信失敗（${res.status}）` }
  }
  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }

  const authResult = await resolveCallerFromRequest(req)
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status)
  }
  const caller = authResult.caller
  if (caller.userRole !== "admin" && caller.userRole !== "alien") {
    return jsonResponse({ error: "只有管理員或外星人可作廢單據。" }, 403)
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "請求格式不正確" }, 400)
  }

  const paymentId = String(body.paymentId ?? "").trim()
  const reason = String(body.reason ?? "").trim()
  const password = String(body.password ?? "")
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) {
    return jsonResponse({ error: "單據編號無效。" }, 400)
  }
  if (reason.length < 2) {
    return jsonResponse({ error: "請填寫作廢原因（至少 2 字）。" }, 400)
  }
  if (!password) {
    return jsonResponse({ error: "請輸入登入密碼以確認作廢。" }, 400)
  }

  const url = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !anonKey || !serviceKey) {
    return jsonResponse({ error: "伺服器設定不完整。" }, 503)
  }

  const verifyClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: caller.email,
    password,
  })
  if (verifyError) {
    return jsonResponse({ error: "密碼不正確，無法作廢。" }, 401)
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: profile } = await admin
    .from("app_users")
    .select("display_name")
    .ilike("email", caller.email)
    .maybeSingle()
  const actorName =
    String((profile as { display_name?: string } | null)?.display_name ?? "").trim() ||
    caller.email

  const { data: pay, error: payErr } = await admin
    .from("payments")
    .select(
      "id, student_id, receipt_number, payment_date, total_amount, status, students ( full_name )"
    )
    .eq("id", paymentId)
    .maybeSingle()
  if (payErr) {
    console.error("void-payment load payment", payErr.message)
    return jsonResponse({ error: "無法讀取單據，請稍後再試。" }, 503)
  }
  if (!pay) {
    return jsonResponse({ error: "找不到繳費紀錄。" }, 404)
  }

  const row = pay as Record<string, unknown>
  const prevStatus = String(row.status ?? "")
  const paymentDate = String(row.payment_date ?? "").slice(0, 10)
  const receiptNumber = row.receipt_number != null ? String(row.receipt_number) : null
  const totalAmount = Number(row.total_amount ?? 0)
  const student = row.students as { full_name?: string } | null
  const studentName = student?.full_name != null ? String(student.full_name) : "—"

  if (prevStatus === VOID_STATUS) {
    return jsonResponse({
      ok: true,
      alreadyVoided: true,
      emailSent: false,
      emailError: null,
      receiptNumber,
      previousStatus: prevStatus,
    })
  }

  const yearBlocked = assertAcademicYearEditable(caller.userRole, paymentDate)
  if (yearBlocked) {
    return jsonResponse({ error: yearBlocked }, 403)
  }

  const now = new Date().toISOString()
  const { data: updated, error: updErr } = await admin
    .from("payments")
    .update({
      status: VOID_STATUS,
      voided_at: now,
      voided_by_email: caller.email,
      voided_by_name: actorName,
      void_reason: reason.slice(0, 500),
      updated_at: now,
    })
    .eq("id", paymentId)
    .neq("status", VOID_STATUS)
    .select("id")
    .maybeSingle()
  if (updErr) {
    console.error("void-payment update", updErr.message)
    return jsonResponse({ error: "作廢失敗，請稍後再試。" }, 502)
  }
  if (!updated) {
    return jsonResponse({
      ok: true,
      alreadyVoided: true,
      emailSent: false,
      emailError: null,
      receiptNumber,
      previousStatus: VOID_STATUS,
    })
  }

  // 取消轉介 pending rebate
  const { error: refErr } = await admin
    .from("referral_records")
    .update({ rebate_status: "cancelled" })
    .eq("payment_id", paymentId)
    .eq("rebate_status", "pending")
  if (refErr) console.error("void-payment referral cancel", refErr.message)

  // 試堂解掛：作廢後唔再喺試堂列表顯示收據號
  const { error: trialUnlinkErr } = await admin
    .from("trial_sessions")
    .update({ payment_id: null, updated_at: now })
    .eq("payment_id", paymentId)
  if (trialUnlinkErr) console.error("void-payment trial unlink", trialUnlinkErr.message)

  // 月費 charge／credit 回滾
  const { data: details, error: detErr } = await admin
    .from("payment_details")
    .select("monthly_tuition_charge_id")
    .eq("payment_id", paymentId)
  if (detErr) {
    console.error("void-payment details", detErr.message)
  } else {
    const chargeIds = [
      ...new Set(
        (details ?? [])
          .map((d) => (d as { monthly_tuition_charge_id?: string | null }).monthly_tuition_charge_id)
          .filter((id): id is string => Boolean(id))
      ),
    ]
    if (chargeIds.length > 0) {
      const { error: chargeErr } = await admin
        .from("monthly_tuition_charges")
        .update({ status: VOID_STATUS, updated_at: now })
        .in("id", chargeIds)
        .neq("status", VOID_STATUS)
      if (chargeErr) console.error("void-payment charge void", chargeErr.message)

      const { data: credits, error: creditErr } = await admin
        .from("tuition_credit_entries")
        .select("id, status, notes, amount")
        .in("applied_charge_id", chargeIds)
        .eq("status", "已抵扣")
      if (creditErr) {
        console.error("void-payment credit load", creditErr.message)
      } else {
        for (const c of credits ?? []) {
          const credit = c as { id: string; notes?: string | null }
          const notes = String(credit.notes ?? "")
          // 部分抵扣產生的「已抵扣」分錄：作廢即可；完整抵扣則還原為可用
          if (notes.includes("部分抵扣")) {
            await admin
              .from("tuition_credit_entries")
              .update({
                status: VOID_STATUS,
                applied_charge_id: null,
                applied_at: null,
              })
              .eq("id", credit.id)
          } else {
            await admin
              .from("tuition_credit_entries")
              .update({
                status: "可用",
                applied_charge_id: null,
                applied_at: null,
              })
              .eq("id", credit.id)
          }
        }
      }
    }
  }

  await admin.from("mgmt_audit_log").insert({
    actor_label: caller.email,
    role: caller.userRole,
    action: "void_payment",
    path: "/PaymentHistory",
    detail: JSON.stringify({
      payment_id: paymentId,
      receipt_number: receiptNumber,
      student_name: studentName,
      student_id: row.student_id,
      total_amount: totalAmount,
      payment_date: paymentDate,
      previous_status: prevStatus,
      reason,
      voided_by_name: actorName,
    }),
  })

  // 收件匣：前台行政 + 外星人（系統通知）
  const wasReceived = prevStatus === RECEIVED_STATUS || prevStatus.includes("已收")
  const refLabel = receiptNumber ?? paymentId.slice(0, 8)
  const amountLabel = moneyHkd(totalAmount)
  const inboxTitle = wasReceived
    ? `已收款單據已作廢（${refLabel}）`
    : `繳費單據已作廢（${refLabel}）`
  const inboxBody = [
    `學生：${studentName}`,
    `單號：${refLabel}`,
    `金額：${amountLabel}`,
    `原狀態：${prevStatus}`,
    `收款日期：${paymentDate}`,
    `作廢原因：${reason}`,
    `操作者：${actorName}（${caller.email}）`,
    "",
    "請注意：",
    "· 此收據已無效，勿再列印或交給家長當有效單據。",
    "· 作廢不會自動退班；學生可能仍是正式報讀但未付款（對帳／追收學費會反映）。",
    "· 若仍要收款，請另開正確新單（單號不會重用）。",
    "· 若不應繼續上課，請另行結束報讀。",
  ].join("\n")

  const { error: inboxErr } = await admin.from("inbox_events").insert({
    event_type: "system_update",
    category: "system",
    title: inboxTitle,
    body: inboxBody,
    action_path: "/PaymentHistory",
    student_id: row.student_id != null ? String(row.student_id) : null,
    audience_teacher_ids: [],
    audience_roles: ["admin", "manager", "alien"],
    payload: {
      kind: "payment_voided",
      payment_id: paymentId,
      receipt_number: receiptNumber,
      previous_status: prevStatus,
      total_amount: totalAmount,
      voided_by_email: caller.email,
    },
  })
  if (inboxErr) console.error("void-payment inbox insert", inboxErr.message)

  let emailSent = false
  let emailError: string | null = null
  const wasPending = PENDING_STATUSES.has(prevStatus)

  if (wasReceived) {
    const mail = await sendVoidEmail({
      to: notifyEmails(),
      receiptNumber,
      studentName,
      amount: totalAmount,
      paymentDate,
      actorEmail: caller.email,
      actorName,
      reason,
      voidedAt: now,
    })
    if (mail.ok) emailSent = true
    else emailError = mail.message
  } else if (!wasPending && prevStatus) {
    // 其他狀態：不寄信
  }

  return jsonResponse({
    ok: true,
    alreadyVoided: false,
    emailSent,
    emailError,
    receiptNumber,
    previousStatus: prevStatus,
    notifySkipped: !wasReceived,
  })
})
