import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { assertAiReportAccess } from "../_shared/aiPermissions.ts"
import {
  buildTemplateSummary,
  createReportServiceClient,
  fetchOverdueTuitionReport,
} from "../_shared/aiReportData.ts"
import { summarizeOverdueTuitionWithLlm } from "../_shared/aiReportSummary.ts"
import { resolveCallerFromRequest } from "../_shared/apoAuth.ts"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

type ReportType = "overdue_tuition"

type RequestBody = {
  reportType?: string
  includeSummary?: boolean
}

function normalizeReportType(raw: unknown): ReportType | null {
  const t = String(raw ?? "").trim()
  if (t === "overdue_tuition") return t
  return null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "請求格式不正確" }, 400)
  }

  const authResult = await resolveCallerFromRequest(req)
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status)
  }
  const caller = authResult.caller

  const access = assertAiReportAccess(caller)
  if (!access.ok) {
    return jsonResponse({ error: access.error }, access.status)
  }

  const reportType = normalizeReportType(body.reportType)
  if (!reportType) {
    return jsonResponse({ error: "不支援的報表類型" }, 400)
  }

  const client = createReportServiceClient()
  if (!client) {
    return jsonResponse({ error: "報表伺服器資料庫連線未設定" }, 503)
  }

  if (reportType !== "overdue_tuition") {
    return jsonResponse({ error: "不支援的報表類型" }, 400)
  }

  const dataResult = await fetchOverdueTuitionReport(
    client,
    caller.userRole,
    caller.teacherId
  )
  if (!dataResult.ok) {
    return jsonResponse({ error: dataResult.error }, 502)
  }

  const report = dataResult.report
  let summary = buildTemplateSummary(report)
  let summarySource: "template" | "llm" = "template"

  const wantSummary = body.includeSummary !== false
  if (wantSummary) {
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY")
    if (apiKey) {
      const llmSummary = await summarizeOverdueTuitionWithLlm(apiKey, report)
      if (llmSummary) {
        summary = llmSummary
        summarySource = "llm"
      }
    }
  }

  return jsonResponse({
    ok: true,
    reportType,
    generatedAt: report.generated_at,
    hkDate: report.hk_date,
    totalCount: report.total_count,
    records: report.records,
    stats: report.stats,
    summary,
    summarySource,
  })
})
