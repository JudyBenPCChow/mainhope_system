import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Copy,
  Download,
  Link2,
  MessageCircle,
  Printer,
  Search,
} from "lucide-react"

import {
  ContactUpdatePrintSlips,
  type ContactUpdatePrintSlip,
} from "@/components/contactUpdate/ContactUpdatePrintSlips"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { useAppBanner } from "@/lib/appBanner"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
  openPrimaryMessagingTarget,
  resolvePrimaryMessagingTarget,
  type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"
import {
  approveContactUpdateToken,
  contactUpdatePublicUrl,
  createContactUpdateTokens,
  fetchContactUpdateTokensByStudentIds,
  voidContactUpdateToken,
  type ContactUpdateFormPayload,
  type ContactUpdateTokenRow,
} from "@/services/contactUpdateQueries"
import { fetchAllStudents, type StudentRecord } from "@/services/studentQueries"

type UiStatus = "未產生" | "未交" | "待審核" | "已核准" | "過期" | "已作廢"

const UI_STATUSES: UiStatus[] = ["未產生", "未交", "待審核", "已核准", "過期", "已作廢"]

type CampaignRow = {
  student: StudentRecord
  tokenRow: ContactUpdateTokenRow | null
  uiStatus: UiStatus
}

function mapUiStatus(token: ContactUpdateTokenRow | null): UiStatus {
  if (!token) return "未產生"
  if (token.status === "open") {
    if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) return "過期"
    return "未交"
  }
  if (token.status === "submitted") return "待審核"
  if (token.status === "approved") return "已核准"
  if (token.status === "expired") return "過期"
  if (token.status === "voided") return "已作廢"
  return "未產生"
}

function statusTone(status: UiStatus) {
  if (status === "已核准") return statusToTagTone("已批核")
  if (status === "待審核") return statusToTagTone("待審核")
  if (status === "未交") return statusToTagTone("待")
  if (status === "過期") return statusToTagTone("逾期")
  if (status === "已作廢") return statusToTagTone("取消")
  return statusToTagTone("非活躍生")
}

function formatExpires(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString("zh-HK", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function messagingTargetFromStudent(st: StudentRecord): PrimaryMessagingTarget | null {
  return resolvePrimaryMessagingTarget({
    student_phone: st.student_phone,
    parent_phone: st.parent_phone,
    student_phone_country_code: st.student_phone_country_code,
    parent_phone_country_code: st.parent_phone_country_code,
    primary_contact_person: st.primary_contact_person,
    student_preferred_contact_method: st.student_preferred_contact_method,
    parent_preferred_contact_method: st.parent_preferred_contact_method,
    student_wechat_id: st.student_wechat_id,
    parent_wechat_id: st.parent_wechat_id,
  })
}

function buildNotifyMessage(student: StudentRecord, token: string): string {
  const url = contactUpdatePublicUrl(token)
  return [
    `您好，明學教育請核對「${student.full_name}」（學號 ${student.student_code ?? "—"}）嘅聯絡資料。`,
    "",
    "請開啟以下專屬連結，核對／更新電話同通訊偏好：",
    url,
    "",
    "提交後由職員審核，核准後先寫入學生檔案。如有疑問請回覆此訊息，謝謝！",
  ].join("\n")
}

type DiffField = {
  key: keyof ContactUpdateFormPayload
  label: string
  before: string
  after: string
  changed: boolean
}

const DIFF_LABELS: { key: keyof ContactUpdateFormPayload; label: string }[] = [
  { key: "primary_contact_person", label: "第一聯絡人" },
  { key: "student_phone_country_code", label: "學生區號" },
  { key: "student_phone", label: "學生電話" },
  { key: "student_preferred_contact_method", label: "學生偏好通訊" },
  { key: "student_wechat_id", label: "學生 WeChat ID" },
  { key: "parent_phone_country_code", label: "家長區號" },
  { key: "parent_phone", label: "家長電話" },
  { key: "parent_preferred_contact_method", label: "家長偏好通訊" },
  { key: "parent_wechat_id", label: "家長 WeChat ID" },
]

function buildDiff(
  baseline: ContactUpdateFormPayload,
  payload: ContactUpdateFormPayload
): DiffField[] {
  return DIFF_LABELS.map(({ key, label }) => {
    const before = baseline[key] || "—"
    const after = payload[key] || "—"
    return { key, label, before, after, changed: before !== after }
  })
}

function SummaryTile({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left shadow-sm transition-colors",
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </button>
  )
}

function RowNotifyButton({
  student,
  token,
  onNotify,
}: {
  student: StudentRecord
  token: string | null
  onNotify: () => void
}) {
  const target = messagingTargetFromStudent(student)
  const channel = target?.channel ?? "WhatsApp"
  const canNotify =
    channel === "WeChat"
      ? Boolean(target?.wechatId?.trim())
      : Boolean(target?.phone?.trim())
  const label = channel === "WeChat" ? "WeChat" : "WhatsApp"
  const title = !canNotify
    ? "第一聯絡人未有電話／WeChat ID"
    : channel === "WeChat"
      ? `複製通知文案（含連結）；WeChat ID：${target?.wechatId}`
      : `開啟 WhatsApp 預填通知（第一聯絡人：${target?.person}）`

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!canNotify}
      title={title}
      aria-label={title}
      className={
        channel === "WeChat"
          ? "border-sky-500/40 text-sky-700 hover:bg-sky-600 hover:text-white"
          : "border-success/40 text-success hover:bg-success"
      }
      onClick={onNotify}
    >
      <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
      {label}
      {!token ? <span className="sr-only">（將自動產生連結）</span> : null}
    </Button>
  )
}

export function ContactUpdateCampaignView() {
  const { pushBanner } = useAppBanner()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [tokensByStudent, setTokensByStudent] = useState<Map<string, ContactUpdateTokenRow>>(
    () => new Map()
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [statusFilter, setStatusFilter] = useState<UiStatus | "全部">("全部")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [printRows, setPrintRows] = useState<ContactUpdatePrintSlip[] | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const all = await fetchAllStudents()
      // 活動對象：中學階段既有生（含活躍／非活躍）；排除已畢業為預設
      const list = all.filter((s) => s.academic_stage !== "已畢業")
      setStudents(list)
      const tokens = await fetchContactUpdateTokensByStudentIds(list.map((s) => s.id))
      const map = new Map<string, ContactUpdateTokenRow>()
      for (const t of tokens) map.set(t.student_id, t)
      setTokensByStudent(map)
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.load" })
      pushBanner({
        tone: "error",
        title: "載入失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [pushBanner])

  useEffect(() => {
    void reload()
  }, [reload])

  const rows: CampaignRow[] = useMemo(
    () =>
      students.map((student) => {
        const tokenRow = tokensByStudent.get(student.id) ?? null
        return { student, tokenRow, uiStatus: mapUiStatus(tokenRow) }
      }),
    [students, tokensByStudent]
  )

  const counts = useMemo(() => {
    const base: Record<UiStatus, number> = {
      未產生: 0,
      未交: 0,
      待審核: 0,
      已核准: 0,
      過期: 0,
      已作廢: 0,
    }
    for (const r of rows) base[r.uiStatus] += 1
    return base
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "全部" && r.uiStatus !== statusFilter) return false
      if (!q) return true
      const s = r.student
      return (
        s.full_name.toLowerCase().includes(q) ||
        (s.student_code ?? "").toLowerCase().includes(q) ||
        (s.school ?? "").toLowerCase().includes(q)
      )
    })
  }, [rows, statusFilter, query])

  const reviewRow = reviewId ? rows.find((r) => r.student.id === reviewId) ?? null : null
  const reviewDiff =
    reviewRow?.tokenRow?.status === "submitted"
      ? buildDiff(reviewRow.tokenRow.baseline, reviewRow.tokenRow.payload)
      : []

  const mergeTokens = (created: ContactUpdateTokenRow[]) => {
    setTokensByStudent((prev) => {
      const next = new Map(prev)
      for (const t of created) next.set(t.student_id, t)
      return next
    })
  }

  const ensureTokensFor = async (studentIds: string[]) => {
    // 已過期但仍係 open 狀態：先作廢再新建，避免 reuse 死連結
    for (const id of studentIds) {
      const existing = tokensByStudent.get(id)
      if (
        existing?.status === "open" &&
        existing.expires_at &&
        new Date(existing.expires_at).getTime() < Date.now()
      ) {
        try {
          await voidContactUpdateToken(existing.token)
        } catch {
          /* 繼續嘗試 create */
        }
      }
    }
    const created = await createContactUpdateTokens(studentIds)
    mergeTokens(created)
    return created
  }

  const generateFor = async (ids: string[]) => {
    if (ids.length === 0) return
    setBusy(true)
    try {
      const created = await ensureTokensFor(ids)
      pushBanner({
        tone: "success",
        title: "已產生連結",
        message: `共 ${created.length} 位學生`,
      })
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.generate" })
      pushBanner({
        tone: "error",
        title: "產生失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const openPrintSlips = async () => {
    const source =
      selected.size > 0
        ? filtered.filter((r) => selected.has(r.student.id))
        : filtered
    if (source.length === 0) {
      pushBanner({ tone: "warning", title: "沒有可打印嘅學生", message: "" })
      return
    }
    setBusy(true)
    try {
      const created = await ensureTokensFor(source.map((r) => r.student.id))
      const byId = new Map(created.map((t) => [t.student_id, t]))
      const slips: ContactUpdatePrintSlip[] = source
        .map((r) => {
          const t = byId.get(r.student.id) ?? tokensByStudent.get(r.student.id)
          if (!t?.token) return null
          return {
            id: r.student.id,
            full_name: r.student.full_name,
            student_code: r.student.student_code ?? "",
            grade_label: r.student.grade ?? "",
            school: r.student.school ?? "",
            token: t.token,
          }
        })
        .filter((x): x is ContactUpdatePrintSlip => Boolean(x))
      setPrintRows(slips)
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.print" })
      pushBanner({
        tone: "error",
        title: "無法準備打印頁",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const notifyRow = async (row: CampaignRow) => {
    const target = messagingTargetFromStudent(row.student)
    if (!target) {
      pushBanner({ tone: "warning", title: "第一聯絡人未有電話／WeChat ID", message: "" })
      return
    }
    setBusy(true)
    try {
      let token = row.tokenRow?.token
      if (!token || row.uiStatus === "過期" || row.uiStatus === "已作廢" || row.uiStatus === "已核准") {
        const created = await ensureTokensFor([row.student.id])
        token = created[0]?.token
      }
      if (!token) throw new Error("無法產生更新連結")
      const message = buildNotifyMessage(row.student, token)

      if (target.channel === "WeChat") {
        await navigator.clipboard.writeText(message)
        pushBanner({
          tone: "success",
          title: "已複製通知文案（含連結）",
          message: `WeChat ID：${target.wechatId ?? "—"}，請手動貼上發送`,
        })
        return
      }
      const result = await openPrimaryMessagingTarget(target, message)
      if (result === "whatsapp") {
        pushBanner({
          tone: "success",
          title: "已開啟 WhatsApp",
          message: `第一聯絡人：${target.person}；請確認後手動發送`,
        })
      } else {
        pushBanner({ tone: "error", title: "無法開啟 WhatsApp", message: "請檢查電話格式" })
      }
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.notify" })
      pushBanner({
        tone: "error",
        title: "通知失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async (token: string) => {
    const url = contactUpdatePublicUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      pushBanner({ tone: "success", title: "已複製連結", message: url })
    } catch {
      pushBanner({ tone: "warning", title: "請手動複製", message: url })
    }
  }

  const exportCsv = () => {
    const header = ["學號", "姓名", "年級", "狀態", "連結", "有效至", "提交時間"].join(",")
    const lines = filtered.map((r) => {
      const t = r.tokenRow
      return [
        r.student.student_code ?? "",
        r.student.full_name,
        r.student.grade ?? "",
        r.uiStatus,
        t?.token ? contactUpdatePublicUrl(t.token) : "",
        t?.expires_at ? formatExpires(t.expires_at) : "",
        t?.submitted_at ?? "",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    })
    const csv = [header, ...lines].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contact-update-campaign.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const approveReview = async () => {
    if (!reviewRow?.tokenRow) return
    setBusy(true)
    try {
      const updated = await approveContactUpdateToken(reviewRow.tokenRow.token)
      mergeTokens([updated])
      setReviewId(null)
      pushBanner({
        tone: "success",
        title: "已核准",
        message: `${reviewRow.student.full_name} 聯絡資料已寫入`,
      })
      // 重新載入學生電話，方便後續 WhatsApp
      void reload()
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.approve" })
      pushBanner({
        tone: "error",
        title: "核准失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const voidReview = async () => {
    if (!reviewRow?.tokenRow) return
    setBusy(true)
    try {
      const updated = await voidContactUpdateToken(reviewRow.tokenRow.token)
      mergeTokens([updated])
      setReviewId(null)
      pushBanner({
        tone: "success",
        title: "已作廢",
        message: `${reviewRow.student.full_name} 提交已作廢，可重新產生連結`,
      })
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdateCampaignView.void" })
      pushBanner({
        tone: "error",
        title: "作廢失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const selectedCount = selected.size
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.student.id))

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    const ids = filtered.map((r) => r.student.id)
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        載入學生與更新狀態…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">聯絡資料更新活動</h1>
          <p className="text-sm text-muted-foreground">
            篩選現有學生、批量產生專屬連結、打印一人一頁、WhatsApp 通知、審核 diff。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || selectedCount === 0}
            onClick={() => void generateFor([...selected])}
          >
            <Link2 className="mr-1.5 h-4 w-4" aria-hidden />
            為所選產生連結
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => void openPrintSlips()}
          >
            <Printer className="mr-1.5 h-4 w-4" aria-hidden />
            打印學生更新頁
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            匯出 CSV
          </Button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <SummaryTile
          label="全部"
          value={rows.length}
          active={statusFilter === "全部"}
          onClick={() => setStatusFilter("全部")}
        />
        {UI_STATUSES.map((s) => (
          <SummaryTile
            key={s}
            label={s}
            value={counts[s]}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="搜尋姓名／學號／學校"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="狀態篩選">
          {(["全部", ...UI_STATUSES] as const).map((s) => {
            const active = statusFilter === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {s}
              </button>
            )
          })}
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          顯示 {filtered.length} 位
          {selectedCount > 0 ? ` · 已選 ${selectedCount}` : ""}
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={toggleAllFiltered}
        >
          {allFilteredSelected ? "取消全選本頁" : "全選本頁"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={allFilteredSelected}
                  onChange={toggleAllFiltered}
                  aria-label="全選本頁"
                />
              </th>
              <th className="px-3 py-2.5 font-medium">學生</th>
              <th className="px-3 py-2.5 font-medium">狀態</th>
              <th className="px-3 py-2.5 font-medium">連結</th>
              <th className="px-3 py-2.5 font-medium">有效至</th>
              <th className="px-3 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          {filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  無符合條件嘅學生
                </td>
              </tr>
            </tbody>
          ) : (
            <StaggerList as="tbody">
              {filtered.map((r) => (
                <StaggerItem key={r.student.id} as="tr" className="border-b border-border last:border-0">
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selected.has(r.student.id)}
                      onChange={() => toggleOne(r.student.id)}
                      aria-label={`選擇 ${r.student.full_name}`}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <p className="font-medium text-foreground">{r.student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.student.student_code ?? "—"}
                      {r.student.grade ? ` · ${r.student.grade}` : ""}
                      {r.student.school ? ` · ${r.student.school}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <Tag tone={statusTone(r.uiStatus)} size="sm">
                      {r.uiStatus}
                    </Tag>
                    {r.tokenRow?.submitted_at ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        提交 {new Date(r.tokenRow.submitted_at).toLocaleString("zh-HK")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {r.tokenRow?.token ? (
                      <code className="break-all text-xs text-muted-foreground">
                        …/{r.tokenRow.token.slice(-10)}
                      </code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle tabular-nums text-muted-foreground">
                    {formatExpires(r.tokenRow?.expires_at)}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      <RowNotifyButton
                        student={r.student}
                        token={r.tokenRow?.token ?? null}
                        onNotify={() => void notifyRow(r)}
                      />
                      {r.tokenRow?.token ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void copyLink(r.tokenRow!.token)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                          複製
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void generateFor([r.student.id])}
                        >
                          <Link2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                          產生
                        </Button>
                      )}
                      {r.uiStatus === "待審核" ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => setReviewId(r.student.id)}
                        >
                          審核
                        </Button>
                      ) : null}
                      {r.uiStatus === "過期" || r.uiStatus === "已作廢" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => void generateFor([r.student.id])}
                        >
                          重發
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </table>
      </div>

      <Dialog open={reviewId != null} onOpenChange={(open) => !open && setReviewId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              審核聯絡更新
              {reviewRow ? ` · ${reviewRow.student.full_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {reviewRow?.tokenRow ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{reviewRow.student.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {reviewRow.student.student_code ?? "—"}
                  {reviewRow.student.grade ? ` · ${reviewRow.student.grade}` : ""}
                  {reviewRow.student.school ? ` · ${reviewRow.student.school}` : ""}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-0 border-b border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>欄位</span>
                  <span>舊值</span>
                  <span>新值</span>
                </div>
                {reviewDiff.map((d) => (
                  <div
                    key={d.key}
                    className={cn(
                      "grid grid-cols-[1fr_1fr_1fr] gap-0 border-b border-border px-3 py-2 text-sm last:border-0",
                      d.changed && "bg-amber-50/80"
                    )}
                  >
                    <span className="text-xs text-muted-foreground sm:text-sm">{d.label}</span>
                    <span className="break-all text-muted-foreground">{d.before}</span>
                    <span
                      className={cn(
                        "break-all",
                        d.changed ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {d.after}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={() => void voidReview()}>
                  作廢
                </Button>
                <Button type="button" disabled={busy} onClick={() => void approveReview()}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
                  核准寫入
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {printRows ? (
        <ContactUpdatePrintSlips rows={printRows} onClose={() => setPrintRows(null)} />
      ) : null}
    </div>
  )
}
