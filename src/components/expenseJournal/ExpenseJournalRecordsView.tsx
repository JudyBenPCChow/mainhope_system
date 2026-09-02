import { useCallback, useEffect, useMemo, useState } from "react"
import { ScrollText } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 ADMIN_WORKSPACE_DESCRIPTION,
 adminWorkspacePageClass,
} from "@/lib/adminNavigation"
import { ExpenseJournalList } from "@/components/expenseJournal/ExpenseJournalList"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  currentExpenseMonthKey,
  fetchExpenseAccounts,
  type ExpenseLedgerAccount,
} from "@/services/expenseQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

export function ExpenseJournalRecordsView() {
  const { profile, role } = useAuth()
  const caps = profile?.activeCapabilities
  const canReadFullLedger = can(caps, "expenses.read")
  const [monthKey, setMonthKey] = useState(currentExpenseMonthKey)
  const [accounts, setAccounts] = useState<ExpenseLedgerAccount[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const monthInputValue = useMemo(() => monthKey, [monthKey])

  const loadAccounts = useCallback(async () => {
    try {
      const rows = await fetchExpenseAccounts()
      setAccounts(rows)
    } catch (e) {
      reportUserFacingError(e, { source: "ExpenseJournalRecordsView.loadAccounts", setErr })
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  return (
    <div className={adminWorkspacePageClass}>
      {usesSharedAppShell(role) ? (
        <AdminPageHeader
          eyebrow="工作域"
          title="日記帳紀錄"
          description={ADMIN_WORKSPACE_DESCRIPTION.journal}
          actions={
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>月份</span>
              <Input
                type="month"
                className="w-[10.5rem]"
                value={monthInputValue}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^\d{4}-\d{2}$/.test(v)) setMonthKey(v)
                }}
              />
            </label>
          }
        />
      ) : (
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">查詢紀錄</h1>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>月份</span>
            <Input
              type="month"
              className="w-[10.5rem]"
              value={monthInputValue}
              onChange={(e) => {
                const v = e.target.value
                if (/^\d{4}-\d{2}$/.test(v)) setMonthKey(v)
              }}
            />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          {canReadFullLedger
            ? "人手日記帳、計糧過帳與歷史匯入。待覆核列（按金／退款等）可在此確認或作廢。"
            : "只顯示日常小支出日記帳。租金、人工等結構成本由管理層查閱。"}
        </p>
      </header>
      )}
      <AdminWorkspaceNav workspace="journal" />
      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}
      <ExpenseJournalList
        monthKey={monthKey}
        accounts={accounts}
        refreshToken={tick}
        capabilities={caps}
        canReadFullLedger={canReadFullLedger}
        onChanged={() => setTick((n) => n + 1)}
      />
    </div>
  )
}
