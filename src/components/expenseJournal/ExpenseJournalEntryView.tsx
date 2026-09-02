import { useCallback, useEffect, useState } from "react"
import { NotebookPen } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 ADMIN_WORKSPACE_DESCRIPTION,
 adminWorkspacePageClass,
} from "@/lib/adminNavigation"
import { ExpenseJournalForm } from "@/components/expenseJournal/ExpenseJournalForm"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  fetchExpenseAccounts,
  fetchExpenseCategoryRules,
  type ExpenseCategoryRule,
  type ExpenseLedgerAccount,
} from "@/services/expenseQueries"

export function ExpenseJournalEntryView() {
  const { profile, role } = useAuth()
  const caps = profile?.activeCapabilities
  const canReadFullLedger = can(caps, "expenses.read")
  const [accounts, setAccounts] = useState<ExpenseLedgerAccount[]>([])
  const [rules, setRules] = useState<ExpenseCategoryRule[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const [acc, ruleRows] = await Promise.all([
        fetchExpenseAccounts(),
        fetchExpenseCategoryRules(),
      ])
      setAccounts(acc)
      setRules(ruleRows)
    } catch (e) {
      reportUserFacingError(e, { source: "ExpenseJournalEntryView.load", setErr })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className={adminWorkspacePageClass}>
      {role === "admin" ? (
        <AdminPageHeader
          eyebrow="工作域"
          title="入帳"
          description={ADMIN_WORKSPACE_DESCRIPTION.journal}
        />
      ) : (
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">日記帳入帳</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {canReadFullLedger
              ? "登記日常開支或租金等結構成本。導師薪酬由計糧結算過帳，唔好手抄。"
              : "登記日常小支出（文具、教材、團建、印刷）。租金、人工、水電請管理層入帳。"}
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
      {okMsg ? (
        <p className="text-sm text-muted-foreground" role="status">
          {okMsg}
        </p>
      ) : null}
      <ExpenseJournalForm
        accounts={accounts}
        rules={rules}
        canReadFullLedger={canReadFullLedger}
        saving={saving}
        onSaving={setSaving}
        onCreated={() => setOkMsg("已入帳。")}
      />
    </div>
  )
}
