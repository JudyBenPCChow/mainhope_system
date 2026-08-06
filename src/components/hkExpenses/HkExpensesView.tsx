import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, PieChart } from "lucide-react"

import { HkExpenseDashboardPanel } from "@/components/hkExpenses/HkExpenseDashboardPanel"
import { HkExpenseLedgerPanel } from "@/components/hkExpenses/HkExpenseLedgerPanel"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  defaultExpenseMonthKey,
  fetchExpenseAccounts,
  fetchExpenseMonthDashboard,
  type ExpenseLedgerAccount,
  type ExpenseMonthDashboard,
} from "@/services/expenseQueries"

function emptyDashboard(monthKey: string): ExpenseMonthDashboard {
  return {
    monthKey,
    totalConfirmed: 0,
    totalDirect: 0,
    totalOverhead: 0,
    laborTotal: 0,
    pendingCount: 0,
    pendingAmount: 0,
    byAccount: [],
    byTeacher: [],
    monthlyTrend: [],
  }
}

export function HkExpensesView() {
  const [monthKey, setMonthKey] = useState(defaultExpenseMonthKey)
  const [accounts, setAccounts] = useState<ExpenseLedgerAccount[]>([])
  const [dashboard, setDashboard] = useState<ExpenseMonthDashboard>(() =>
    emptyDashboard(defaultExpenseMonthKey())
  )
  const [loadingDash, setLoadingDash] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [ledgerTick, setLedgerTick] = useState(0)

  const monthInputValue = useMemo(() => monthKey, [monthKey])

  const loadAccounts = useCallback(async () => {
    try {
      const rows = await fetchExpenseAccounts()
      setAccounts(rows)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpensesView.loadAccounts", setErr })
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true)
    setErr(null)
    try {
      const d = await fetchExpenseMonthDashboard(monthKey)
      setDashboard(d)
    } catch (e) {
      reportUserFacingError(e, { source: "HkExpensesView.loadDashboard", setErr })
      setDashboard(emptyDashboard(monthKey))
    } finally {
      setLoadingDash(false)
    }
  }, [monthKey])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const onLedgerChanged = () => {
    setLedgerTick((n) => n + 1)
    void loadDashboard()
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">成本統計</h1>
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
          管理分析用 HK 成本帳：計糧已結算人工自動過帳，其他開支人手入帳確認後入彙總。
        </p>
      </header>

      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">分析</TabsTrigger>
          <TabsTrigger value="ledger">明細／入帳</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {loadingDash && dashboard.byAccount.length === 0 && dashboard.laborTotal === 0 ? (
            <div className="flex min-h-[24vh] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              載入成本分析…
            </div>
          ) : (
            <HkExpenseDashboardPanel dashboard={dashboard} loading={loadingDash} />
          )}
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <HkExpenseLedgerPanel
            monthKey={monthKey}
            accounts={accounts}
            refreshToken={ledgerTick}
            onChanged={onLedgerChanged}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
