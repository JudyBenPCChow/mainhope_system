import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Copy,
  Download,
  FlaskConical,
  Link2,
  MessageCircle,
  Printer,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
  openPrimaryMessagingTarget,
  resolvePrimaryMessagingTarget,
  type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"

import {
  CAMPAIGN_STATUSES,
  buildCampaignCsv,
  buildContactDiff,
  createInitialCampaignRows,
  mockPublicLink,
  type CampaignRow,
  type CampaignStatus,
} from "./campaignMockData"
import { ContactUpdatePrintSlips } from "./ContactUpdatePrintSlips"

function messagingTargetFromRow(row: CampaignRow): PrimaryMessagingTarget | null {
  return resolvePrimaryMessagingTarget({
    student_phone: row.current.student_phone,
    parent_phone: row.current.parent_phone,
    student_phone_country_code: row.current.student_phone_country_code,
    parent_phone_country_code: row.current.parent_phone_country_code,
    primary_contact_person: row.current.primary_contact_person,
    student_preferred_contact_method: row.current.student_preferred_contact_method,
    parent_preferred_contact_method: row.current.parent_preferred_contact_method,
    student_wechat_id: row.current.student_wechat_id,
    parent_wechat_id: row.current.parent_wechat_id,
  })
}

function buildContactUpdateNotifyMessage(row: CampaignRow & { token: string }): string {
  const url = mockPublicLink(row.token)
  return [
    `您好，明學教育請核對「${row.full_name}」（學號 ${row.student_code}）嘅聯絡資料。`,
    "",
    "請開啟以下專屬連結，核對／更新電話同通訊偏好：",
    url,
    "",
    "提交後由職員審核，核准後先寫入學生檔案。如有疑問請回覆此訊息，謝謝！",
  ].join("\n")
}

function RowNotifyButton({
  row,
  onNotify,
}: {
  row: CampaignRow
  onNotify: (row: CampaignRow) => void
}) {
  const target = messagingTargetFromRow(row)
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
      onClick={() => onNotify(row)}
    >
      <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
      {label}
    </Button>
  )
}

function statusTone(status: CampaignStatus) {
  if (status === "已核准") return statusToTagTone("已批核")
  if (status === "待審核") return statusToTagTone("待審核")
  if (status === "未交") return statusToTagTone("待")
  if (status === "過期") return statusToTagTone("逾期")
  return statusToTagTone("非活躍生")
}

function StatusTag({ status }: { status: CampaignStatus }) {
  return (
    <Tag tone={statusTone(status)} size="sm">
      {status}
    </Tag>
  )
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
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/40"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </button>
  )
}

/**
 * 聯絡資料自助更新 — 批量活動頁 UI 沙盒。
 * 硬編碼假資料；不呼叫 services／Supabase；不掛正式側欄。
 */
export function ContactUpdateCampaignPrototypeView() {
  const [rows, setRows] = useState<CampaignRow[]>(() => createInitialCampaignRows())
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "全部">("全部")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [flash, setFlash] = useState<string | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [printRows, setPrintRows] = useState<
    (CampaignRow & { token: string })[] | null
  >(null)

  const counts = useMemo(() => {
    const base: Record<CampaignStatus, number> = {
      未產生: 0,
      未交: 0,
      待審核: 0,
      已核准: 0,
      過期: 0,
    }
    for (const r of rows) base[r.status] += 1
    return base
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "全部" && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.student_code.toLowerCase().includes(q) ||
        r.school.toLowerCase().includes(q)
      )
    })
  }, [rows, statusFilter, query])

  const reviewRow = reviewId ? rows.find((r) => r.id === reviewId) ?? null : null
  const reviewDiff =
    reviewRow?.submitted != null
      ? buildContactDiff(reviewRow.current, reviewRow.submitted)
      : []

  const showFlash = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 2400)
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    const ids = filtered.map((r) => r.id)
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  /** 為缺 token（或過期重發）嘅列補上假連結；回傳目標列最新狀態 */
  const ensureTokens = (ids: string[]): (CampaignRow & { token: string })[] => {
    const idSet = new Set(ids)
    const now = "2026-08-25 12:00"
    let changed = false
    const next = rows.map((r) => {
      if (!idSet.has(r.id)) return r
      if (r.token && r.status !== "過期" && r.status !== "未產生") {
        return r
      }
      changed = true
      const token =
        r.status === "過期" || !r.token
          ? `tok_sandbox_${r.student_code.toLowerCase()}_${Date.now().toString(36).slice(-4)}`
          : r.token
      return {
        ...r,
        status: "未交" as const,
        token,
        link_created_at: now,
        expires_at: "2026-09-30",
        submitted_at: null,
        submitted: null,
      }
    })
    if (changed) setRows(next)
    return next
      .filter((r) => idSet.has(r.id) && Boolean(r.token))
      .map((r) => ({ ...r, token: r.token as string }))
  }

  const generateFor = (ids: string[]) => {
    const targets = rows.filter(
      (r) => ids.includes(r.id) && (r.status === "未產生" || r.status === "過期")
    )
    if (targets.length === 0) {
      showFlash("所選沒有可產生連結嘅學生（僅未產生／過期）")
      return
    }
    ensureTokens(targets.map((t) => t.id))
    showFlash(`沙盒：已為 ${targets.length} 位學生產生連結（未寫入 DB）`)
  }

  /** 所選（無則用目前篩選結果）→ 確保有 token → 一人一頁打印預覽 */
  const openPrintSlips = () => {
    const source =
      selected.size > 0 ? rows.filter((r) => selected.has(r.id)) : filtered
    if (source.length === 0) {
      showFlash("沒有可打印嘅學生")
      return
    }
    const slips = ensureTokens(source.map((r) => r.id))
    if (slips.length === 0) {
      showFlash("無法產生打印頁")
      return
    }
    setPrintRows(slips)
  }

  const notifyContactUpdate = async (row: CampaignRow) => {
    const target = messagingTargetFromRow(row)
    if (!target) {
      showFlash("第一聯絡人未有電話／WeChat ID，無法通知")
      return
    }
    const [withToken] = ensureTokens([row.id])
    if (!withToken?.token) {
      showFlash("無法產生更新連結")
      return
    }
    const message = buildContactUpdateNotifyMessage(withToken)

    if (target.channel === "WeChat") {
      try {
        await navigator.clipboard.writeText(message)
        showFlash(
          `沙盒：已複製通知文案（含連結）。WeChat ID：${target.wechatId ?? "—"}，請手動貼上發送`
        )
      } catch {
        showFlash("沙盒：無法複製文案，請先複製連結再發 WeChat")
      }
      return
    }

    const result = await openPrimaryMessagingTarget(target, message)
    if (result === "whatsapp") {
      showFlash(`沙盒：已開啟 WhatsApp（${target.person}），請確認後手動發送`)
    } else {
      showFlash("無法開啟 WhatsApp，請檢查電話格式")
    }
  }

  const copyLink = async (token: string) => {
    const url = mockPublicLink(token)
    try {
      await navigator.clipboard.writeText(url)
      showFlash("沙盒：已複製連結")
    } catch {
      showFlash(`沙盒連結：${url}`)
    }
  }

  const exportCsv = () => {
    const csv = buildCampaignCsv(filtered)
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contact-update-campaign-sandbox.csv"
    a.click()
    URL.revokeObjectURL(url)
    showFlash(`沙盒：已匯出 ${filtered.length} 列 CSV`)
  }

  const approveReview = () => {
    if (!reviewRow?.submitted) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === reviewRow.id
          ? {
              ...r,
              status: "已核准" as const,
              current: r.submitted!,
              submitted: null,
            }
          : r
      )
    )
    setReviewId(null)
    showFlash(`沙盒：已核准 ${reviewRow.full_name}（未寫入學生檔）`)
  }

  const voidReview = () => {
    if (!reviewRow) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === reviewRow.id
          ? {
              ...r,
              status: "未交" as const,
              submitted: null,
              submitted_at: null,
            }
          : r
      )
    )
    setReviewId(null)
    showFlash(`沙盒：已退回 ${reviewRow.full_name}（狀態改回未交）`)
  }

  const selectedCount = selected.size
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-amber-800">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>UI 沙盒 · 假資料 · 不連資料庫／正式頁／側欄</span>
      </div>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">聯絡資料更新活動</h1>
          <p className="text-sm text-muted-foreground">
            篩選現有學生、批量產生專屬連結、打印一人一頁、匯出 CSV、審核 diff。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => generateFor([...selected])}
            disabled={selectedCount === 0}
          >
            <Link2 className="mr-1.5 h-4 w-4" aria-hidden />
            為所選產生連結
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={openPrintSlips}>
            <Printer className="mr-1.5 h-4 w-4" aria-hidden />
            打印學生更新頁
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            匯出 CSV
          </Button>
        </div>
      </header>

      {flash ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          {flash}
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryTile
          label="全部"
          value={rows.length}
          active={statusFilter === "全部"}
          onClick={() => setStatusFilter("全部")}
        />
        {CAMPAIGN_STATUSES.map((s) => (
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
          {(["全部", ...CAMPAIGN_STATUSES] as const).map((s) => {
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
        <table className="w-full min-w-[720px] text-left text-sm">
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
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  無符合條件嘅學生
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      aria-label={`選擇 ${r.full_name}`}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <p className="font-medium text-foreground">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.student_code} · {r.grade_label}
                      {r.school ? ` · ${r.school}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <StatusTag status={r.status} />
                    {r.submitted_at ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        提交 {r.submitted_at}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    {r.token ? (
                      <code className="break-all text-xs text-muted-foreground">
                        …/{r.token}
                      </code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle tabular-nums text-muted-foreground">
                    {r.expires_at ?? "—"}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex flex-wrap gap-1.5">
                      <RowNotifyButton
                        row={r}
                        onNotify={(row) => void notifyContactUpdate(row)}
                      />
                      {r.token ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void copyLink(r.token!)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                          複製
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateFor([r.id])}
                        >
                          <Link2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                          產生
                        </Button>
                      )}
                      {r.status === "待審核" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setReviewId(r.id)}
                        >
                          審核
                        </Button>
                      ) : null}
                      {r.status === "過期" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateFor([r.id])}
                        >
                          重發
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        正式版會寫入 <code className="rounded bg-muted px-1">contact_update_tokens</code>
        ，核准後先更新學生檔；此沙盒只改本地狀態。
      </p>

      <Dialog open={reviewId != null} onOpenChange={(open) => !open && setReviewId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              審核聯絡更新
              {reviewRow ? ` · ${reviewRow.full_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {reviewRow ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{reviewRow.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {reviewRow.student_code} · {reviewRow.grade_label}
                  {reviewRow.school ? ` · ${reviewRow.school}` : ""}
                </p>
                {reviewRow.submitted_at ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    提交於 {reviewRow.submitted_at}
                  </p>
                ) : null}
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

              <p className="text-xs text-muted-foreground">
                高亮＝有改動。核准後正式版會寫入學生檔；沙盒只更新列表狀態。
              </p>

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={voidReview}>
                  退回（改回未交）
                </Button>
                <Button type="button" onClick={approveReview}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
                  核准
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
