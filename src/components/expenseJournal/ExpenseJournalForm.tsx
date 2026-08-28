import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  EXPENSE_ATTACHMENT_ACCEPT,
  expenseAttachmentValidationError,
} from "@/lib/expenseJournalAttachment"
import {
  EXPENSE_PAY_METHODS,
  EXPENSE_PAY_METHOD_LABEL,
  type ExpensePayMethod,
} from "@/lib/expensePayMethods"
import {
  frontDeskBlockedMessage,
  isManualSelectableAccount,
} from "@/lib/expenseJournalPolicy"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  attachExpenseJournalFile,
  createExpenseEntry,
  suggestExpenseAccount,
  type ExpenseCategoryRule,
  type ExpenseLedgerAccount,
} from "@/services/expenseQueries"

type Props = {
  accounts: ExpenseLedgerAccount[]
  rules: ExpenseCategoryRule[]
  canReadFullLedger: boolean
  saving: boolean
  onSaving: (v: boolean) => void
  onCreated: () => void
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function ExpenseJournalForm({
  accounts,
  rules,
  canReadFullLedger,
  saving,
  onSaving,
  onCreated,
}: Props) {
  const [spentOn, setSpentOn] = useState(todayIso)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [payMethod, setPayMethod] = useState<ExpensePayMethod>("cashbox")
  const [accountId, setAccountId] = useState("")
  const [ownerLabel, setOwnerLabel] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [suggestHint, setSuggestHint] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((a) =>
          isManualSelectableAccount({
            code: a.code,
            visibility: a.visibility,
            canReadFullLedger,
          })
        )
        .map((a) => ({
          id: a.id,
          label: `${a.accountGroup === "direct" ? "直接" : "間接"}｜${a.label}`,
        })),
    [accounts, canReadFullLedger]
  )

  useEffect(() => {
    if (accountId && !accountOptions.some((a) => a.id === accountId)) {
      setAccountId("")
    }
  }, [accountId, accountOptions])

  const applyTitleSuggest = () => {
    if (!title.trim() || rules.length === 0) return
    const sug = suggestExpenseAccount(title, rules)
    if (sug.forcePending && !canReadFullLedger) {
      setSuggestHint(frontDeskBlockedMessage(sug.hint))
      return
    }
    const selectable =
      sug.ledgerAccountId != null && accountOptions.some((a) => a.id === sug.ledgerAccountId)
    if (sug.ledgerAccountId && !selectable && !canReadFullLedger) {
      setSuggestHint(frontDeskBlockedMessage(sug.hint))
      return
    }
    setSuggestHint(sug.hint)
    if (selectable && sug.ledgerAccountId && !accountId) setAccountId(sug.ledgerAccountId)
  }

  const onCreate = async () => {
    onSaving(true)
    setErr(null)
    try {
      if (!title.trim()) {
        setErr("請填寫費用名稱")
        return
      }
      const amountHkd = Number(amount)
      if (!Number.isFinite(amountHkd) || amountHkd <= 0) {
        setErr("金額須為正數")
        return
      }
      if (!accountId) {
        setErr("請選擇費用類別")
        return
      }
      if (file) {
        const fileErr = expenseAttachmentValidationError(file)
        if (fileErr) {
          setErr(fileErr)
          return
        }
      }
      const entry = await createExpenseEntry({
        spentOn,
        title,
        amountHkd,
        payMethod,
        ownerLabel: payMethod === "staff_advance" ? ownerLabel || null : null,
        ledgerAccountId: accountId,
        notes: notes || null,
        canReadFullLedger,
      })
      let attachFailed = false
      if (file) {
        try {
          await attachExpenseJournalFile(entry.id, file)
        } catch (e) {
          attachFailed = true
          reportUserFacingError(e, {
            source: "ExpenseJournalForm.attach",
            setErr,
            userMessage: `已入帳，但附件上載失敗：${formatUnknownError(e)}。請到「查詢紀錄」入詳細再上載。`,
          })
        }
      }
      setTitle("")
      setAmount("")
      setNotes("")
      setOwnerLabel("")
      setFile(null)
      setFileKey((k) => k + 1)
      setSuggestHint(null)
      if (!attachFailed) onCreated()
    } catch (e) {
      reportUserFacingError(e, { source: "ExpenseJournalForm.onCreate", setErr })
    } finally {
      onSaving(false)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold tracking-tight">新增開支</h2>
      <div className="flex max-w-xl flex-col gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">付款日</span>
          <Input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">費用名稱</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={applyTitleSuggest}
            placeholder="例如：買垃圾袋"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">金額（HKD）</span>
          <Input
            type="number"
            step="0.01"
            min="0.01"
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
          <span className="text-muted-foreground">費用類別</span>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">請選擇</option>
            {accountOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </label>
        {payMethod === "staff_advance" ? (
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">邊個墊支</span>
            <Input
              value={ownerLabel}
              onChange={(e) => setOwnerLabel(e.target.value)}
              placeholder="職員姓名"
            />
          </label>
        ) : null}
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">備註</span>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="選填" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">附件（選填）</span>
          <Input
            key={fileKey}
            type="file"
            accept={EXPENSE_ATTACHMENT_ACCEPT}
            className="h-auto cursor-pointer py-1.5"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-xs text-muted-foreground">
            收據或發票：JPG／PNG／PDF，上限 10MB。
          </span>
        </label>
      </div>
      {payMethod === "staff_advance" ? (
        <p className="text-xs text-muted-foreground">
          墊支只記支付渠道；公司還款時唔好再當成本入多一筆。
        </p>
      ) : null}
      {suggestHint ? (
        <p className="text-xs text-warning" role="status">
          {suggestHint}
        </p>
      ) : null}
      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}
      <div className="flex max-w-xl justify-end">
        <Button type="button" disabled={saving} onClick={() => void onCreate()}>
          {saving ? "儲存中…" : "入帳"}
        </Button>
      </div>
    </section>
  )
}
