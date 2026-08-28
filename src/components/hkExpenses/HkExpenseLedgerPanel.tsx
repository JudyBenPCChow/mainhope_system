import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { HkExpenseEntryDetailDialog } from "@/components/hkExpenses/HkExpenseEntryDetailDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { statusToTagTone } from "@/lib/statusTag"
import {
  EXPENSE_PAY_METHODS,
  EXPENSE_PAY_METHOD_LABEL,
  type ExpensePayMethod,
} from "@/lib/expensePayMethods"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  confirmExpenseEntries,
  createExpenseEntry,
  fetchExpenseCategoryRules,
  fetchExpenseEntries,
  suggestExpenseAccount,
  type ExpenseCategoryRule,
  type ExpenseEntry,
  type ExpenseLedgerAccount,
  type ExpenseLedgerStatus,
  type ExpenseOrigin,
} from "@/services/expenseQueries"

type Props = {
  monthKey: string
  accounts: ExpenseLedgerAccount[]
  refreshToken: number
  onChanged: () => void
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function hkd(n: number): string {
  return `HK$ ${n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusLabel(status: ExpenseLedgerStatus, voided: boolean): string {
  if (voided) return "已作廢"
  return status === "confirmed" ? "已確認" : "待覆核"
}

export function HkExpenseLedgerPanel({
  monthKey,
  accounts,
  refreshToken,
  onChanged,
}: Props) {
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [rules, setRules] = useState<ExpenseCategoryRule[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ExpenseLedgerStatus | "all">("all")
  const [originFilter, setOriginFilter] = useState<ExpenseOrigin | "all">("all")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const [spentOn, setSpentOn] = useState(todayIso)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [payMethod, setPayMethod] = useState<ExpensePayMethod>("bank_card")
  const [accountId, setAccountId] = useState("")
  const [ownerLabel, setOwnerLabel] = useState("")
  const [notes, setNotes] = useState("")
  const [suggestHint, setSuggestHint] = useState<string | null>(null)

  const detailEntry = useMemo(
    () => (detailId ? entries.find((e) => e.id === detailId) ?? null : null),
    [detailId, entries]
  )

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        id: a.id,
        label: `${a.accountGroup === "direct" ? "直接" : "間接"}｜${a.label}`,
      })),
    [accounts]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const ruleRows = await fetchExpenseCategoryRules()
        if (!cancelled) setRules(ruleRows)
      } catch {
        /* 建議規則失敗不阻斷列表 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const rows = await fetchExpenseEntries({
        monthKey,
        ledgerStatus: statusFilter,
        origin: originFilter,
        q: q.trim() || undefined,
      })
      setEntries(rows)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseLedgerPanel.load", setErr })
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [monthKey, statusFilter, originFilter, q])

  useEffect(() => {
    void load()
  }, [load, refreshToken])

  const onTitleBlur = () => {
    if (!title.trim() || rules.length === 0) return
    const sug = suggestExpenseAccount(title, rules)
    setSuggestHint(sug.hint)
    if (sug.ledgerAccountId && !accountId) setAccountId(sug.ledgerAccountId)
  }

  const onCreate = async () => {
    setSaving(true)
    setErr(null)
    try {
      const amountHkd = Number(amount)
      if (!Number.isFinite(amountHkd) || amountHkd === 0) {
        setErr("金額不可為 0")
        return
      }
      await createExpenseEntry({
        spentOn,
        title,
        amountHkd,
        payMethod,
        ownerLabel: ownerLabel || null,
        ledgerAccountId: accountId || null,
        notes: notes || null,
      })
      setTitle("")
      setAmount("")
      setNotes("")
      setSuggestHint(null)
      setSelected(new Set())
      onChanged()
      await load()
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseLedgerPanel.onCreate", setErr })
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onConfirmSelected = async () => {
    const ids = [...selected].filter((id) => {
      const e = entries.find((x) => x.id === id)
      return e && !e.voidedAt && e.ledgerStatus === "pending_review" && e.ledgerAccountId
    })
    if (ids.length === 0) {
      setErr("請先選取已有科目的待覆核列")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await confirmExpenseEntries(ids)
      setSelected(new Set())
      onChanged()
      await load()
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseLedgerPanel.onConfirmSelected", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight">新增開支</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">日期</span>
            <Input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">標題</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={onTitleBlur}
              placeholder="例如：七月租金"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">金額（HKD）</span>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">支付方式</span>
            <Select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as ExpensePayMethod)}
            >
              {EXPENSE_PAY_METHODS.map((m) => (
                <option key={m} value={m}>
                  {EXPENSE_PAY_METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">科目</span>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">（稍後分類）</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">負責人</span>
            <Input
              value={ownerLabel}
              onChange={(e) => setOwnerLabel(e.target.value)}
              placeholder="選填"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">備註</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="選填" />
          </label>
        </div>
        {suggestHint ? (
          <p className="text-xs text-warning" role="status">
            {suggestHint}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" disabled={saving} onClick={() => void onCreate()}>
            {saving ? "儲存中…" : "新增（待覆核）"}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">狀態</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseLedgerStatus | "all")}
            >
              <option value="all">全部</option>
              <option value="pending_review">待覆核</option>
              <option value="confirmed">已確認</option>
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">來源</span>
            <Select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as ExpenseOrigin | "all")}
            >
              <option value="all">全部</option>
              <option value="manual">人手入帳</option>
              <option value="payroll_settle">計糧過帳</option>
              <option value="history_import">歷史匯入</option>
            </Select>
          </label>
          <label className="grow space-y-1 text-sm">
            <span className="text-muted-foreground">搜尋標題</span>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="關鍵字" />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={saving || selected.size === 0}
            onClick={() => void onConfirmSelected()}
          >
            批量確認
          </Button>
        </div>

        {err ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {err}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[16vh] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            載入明細…
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">本月尚無入帳</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2 font-medium">日期</th>
                  <th className="px-3 py-2 font-medium">標題</th>
                  <th className="px-3 py-2 text-right font-medium">金額</th>
                  <th className="px-3 py-2 font-medium">分類</th>
                  <th className="px-3 py-2 font-medium">負責人</th>
                  <th className="px-3 py-2 font-medium">狀態</th>
                  <th className="px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <StaggerList as="tbody">
                {entries.map((e) => {
                  const voided = Boolean(e.voidedAt)
                  const canSelect =
                    !voided && e.ledgerStatus === "pending_review" && Boolean(e.ledgerAccountId)
                  return (
                    <StaggerItem key={e.id} as="tr" className="border-t border-border/70 align-top">
                      <td className="px-3 py-2">
                        {canSelect ? (
                          <input
                            type="checkbox"
                            checked={selected.has(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            aria-label={`選取 ${e.title}`}
                          />
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.spentOn}</td>
                      <td className="px-3 py-2">
                        <div>{e.title}</div>
                        {e.teacherName ? (
                          <div className="text-xs text-muted-foreground">{e.teacherName}</div>
                        ) : null}
                        {e.suggestionHint ? (
                          <div className="text-xs text-warning">{e.suggestionHint}</div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                        {hkd(e.amountHkd)}
                      </td>
                      <td className="min-w-[10rem] px-3 py-2">
                        <span>{e.ledgerAccountLabel ?? "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {e.ownerLabel ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Tag size="sm" tone={statusToTagTone(statusLabel(e.ledgerStatus, voided))}>
                          {statusLabel(e.ledgerStatus, voided)}
                        </Tag>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => setDetailId(e.id)}
                        >
                          入詳細
                        </Button>
                      </td>
                    </StaggerItem>
                  )
                })}
              </StaggerList>
            </table>
          </div>
        )}
      </section>

      <HkExpenseEntryDetailDialog
        entry={detailEntry}
        open={detailEntry != null}
        accounts={accounts}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onChanged={() => {
          onChanged()
          void load()
        }}
      />
    </div>
  )
}
