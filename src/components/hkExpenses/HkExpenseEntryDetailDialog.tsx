import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  confirmExpenseEntries,
  expenseOriginLabel,
  reclassifyExpenseEntry,
  reopenExpenseEntry,
  updateExpenseEntryTitle,
  voidExpenseEntry,
  type ExpenseEntry,
  type ExpenseLedgerAccount,
  type ExpenseLedgerStatus,
} from "@/services/expenseQueries"

type Props = {
  entry: ExpenseEntry | null
  open: boolean
  accounts: ExpenseLedgerAccount[]
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}

function hkd(n: number): string {
  return `HK$ ${n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusTone(
  status: ExpenseLedgerStatus,
  voided: boolean
): "default" | "success" | "warning" | "error" {
  if (voided) return "default"
  return status === "confirmed" ? "success" : "warning"
}

function statusLabel(status: ExpenseLedgerStatus, voided: boolean): string {
  if (voided) return "已作廢"
  return status === "confirmed" ? "已確認" : "待覆核"
}

export function HkExpenseEntryDetailDialog({
  entry,
  open,
  accounts,
  onOpenChange,
  onChanged,
}: Props) {
  const { confirmDialog } = useAppConfirm()
  const [title, setTitle] = useState("")
  const [accountId, setAccountId] = useState("")
  const [voidReason, setVoidReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!entry || !open) return
    setTitle(entry.title)
    setAccountId(entry.ledgerAccountId ?? "")
    setVoidReason("")
    setErr(null)
  }, [entry, open])

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        id: a.id,
        label: `${a.accountGroup === "direct" ? "直接" : "間接"}｜${a.label}`,
      })),
    [accounts]
  )

  if (!entry) return null

  const voided = Boolean(entry.voidedAt)
  const pending = !voided && entry.ledgerStatus === "pending_review"
  const confirmed = !voided && entry.ledgerStatus === "confirmed"
  const dirtyTitle = title.trim() !== entry.title
  const dirtyAccount = pending && accountId !== (entry.ledgerAccountId ?? "")
  const canSave = !voided && (dirtyTitle || dirtyAccount)
  const canConfirm = pending && Boolean(accountId || entry.ledgerAccountId)

  const persistEdits = async () => {
    const nextTitle = title.trim()
    if (!nextTitle) throw new Error("請填寫標題")
    if (dirtyTitle) {
      await updateExpenseEntryTitle(entry.id, nextTitle)
    }
    if (dirtyAccount) {
      if (!accountId) throw new Error("請選擇分類")
      await reclassifyExpenseEntry(entry.id, accountId)
    }
  }

  const onSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      await persistEdits()
      onChanged()
      onOpenChange(false)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseEntryDetailDialog.onSave", setErr })
    } finally {
      setSaving(false)
    }
  }

  const onConfirm = async () => {
    setSaving(true)
    setErr(null)
    try {
      await persistEdits()
      if (!(accountId || entry.ledgerAccountId)) {
        throw new Error("請先選擇分類")
      }
      await confirmExpenseEntries([entry.id])
      onChanged()
      onOpenChange(false)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseEntryDetailDialog.onConfirm", setErr })
    } finally {
      setSaving(false)
    }
  }

  const onReopen = async () => {
    const ok = await confirmDialog({
      title: "改為待覆核？",
      description: "之後可改分類，再重新確認。金額／日期／老師仍鎖定。",
      confirmText: "改為待覆核",
      cancelText: "取消",
      tone: "warning",
    })
    if (!ok) return
    setSaving(true)
    setErr(null)
    try {
      if (dirtyTitle) await updateExpenseEntryTitle(entry.id, title.trim())
      await reopenExpenseEntry(entry.id)
      onChanged()
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseEntryDetailDialog.onReopen", setErr })
    } finally {
      setSaving(false)
    }
  }

  const onVoid = async () => {
    const reason = voidReason.trim()
    if (!reason) {
      setErr("請填寫作廢原因")
      return
    }
    const ok = await confirmDialog({
      title: "確認作廢？",
      description: "作廢後不可救回；儀表板唔會計入。",
      confirmText: "確認作廢",
      cancelText: "取消",
      tone: "destructive",
    })
    if (!ok) return
    setSaving(true)
    setErr(null)
    try {
      await voidExpenseEntry(entry.id, reason)
      onChanged()
      onOpenChange(false)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpenseEntryDetailDialog.onVoid", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>成本明細詳情</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Tag size="sm" tone={statusTone(entry.ledgerStatus, voided)}>
              {statusLabel(entry.ledgerStatus, voided)}
            </Tag>
            <span className="text-xs text-muted-foreground">
              {expenseOriginLabel(entry.origin)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-muted-foreground">日期</span>
              <p className="tabular-nums">{entry.spentOn}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">金額</span>
              <p className="tabular-nums">{hkd(entry.amountHkd)}</p>
            </div>
          </div>

          <label className="space-y-1">
            <span className="text-muted-foreground">標題</span>
            <Input
              value={title}
              disabled={voided || saving}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="space-y-1">
            <span className="text-muted-foreground">分類</span>
            {pending ? (
              <Select
                value={accountId}
                disabled={saving}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">（未分類）</option>
                {accountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
            ) : (
              <p>{entry.ledgerAccountLabel ?? "—"}</p>
            )}
            {confirmed ? (
              <p className="text-xs text-muted-foreground">
                已確認列須先改為待覆核，先至可以改分類。
              </p>
            ) : null}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-muted-foreground">支付方式</span>
              <p>{entry.payMethodLabel}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">老師</span>
              <p>{entry.teacherName ?? "—"}</p>
            </div>
          </div>

          {entry.ownerLabel ? (
            <div className="space-y-1">
              <span className="text-muted-foreground">負責人</span>
              <p>{entry.ownerLabel}</p>
            </div>
          ) : null}

          {entry.suggestionHint ? (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              {entry.suggestionHint}
            </p>
          ) : null}

          {entry.notes ? (
            <div className="space-y-1">
              <span className="text-muted-foreground">備註</span>
              <p className="whitespace-pre-wrap text-muted-foreground">{entry.notes}</p>
            </div>
          ) : null}

          {voided ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              作廢原因：{entry.voidReason ?? "—"}
              {entry.voidedByLabel ? `（${entry.voidedByLabel}）` : ""}
            </div>
          ) : (
            <label className="space-y-1">
              <span className="text-muted-foreground">作廢原因（如需作廢）</span>
              <Input
                value={voidReason}
                disabled={saving}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="例如：與計糧過帳重複"
              />
            </label>
          )}

          {err ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {err}
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!voided ? (
              <Button
                type="button"
                variant="ghost"
                disabled={saving || !voidReason.trim()}
                onClick={() => void onVoid()}
              >
                作廢
              </Button>
            ) : null}
            {confirmed ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void onReopen()}
              >
                改為待覆核
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              關閉
            </Button>
            {canSave ? (
              <Button type="button" variant="outline" disabled={saving} onClick={() => void onSave()}>
                儲存
              </Button>
            ) : null}
            {canConfirm ? (
              <Button type="button" disabled={saving} onClick={() => void onConfirm()}>
                確認入帳
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
