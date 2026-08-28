import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import {
 ENTITLEMENT_ADJUSTMENT_REASON_CODES,
 ENTITLEMENT_ADJUSTMENT_REASON_LABELS,
 type EntitlementAdjustmentReasonCode,
} from "@/lib/entitlementAdjustment"
import {
 ENTITLEMENT_PACKAGE_TYPES,
 packageTypeLabel,
 type EntitlementPackageType,
} from "@/lib/entitlementPackage"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 adjustEntitlementPool,
 fetchPoolsForStudent,
 fetchRecentPoolAdjustments,
 transferEntitlementLessons,
 type EntitlementAdjustmentRow,
 type EntitlementPoolSummary,
} from "@/services/entitlementAdjustmentQueries"
import { fetchAllStudents, type StudentRecord } from "@/services/studentQueries"

type GuideKey = "g2a" | "g2b" | "g2d" | "g2c" | "g2e" | "g2f"

const GUIDES: Array<{ key: GuideKey; title: string; body: string; action: string }> = [
 {
  key: "g2a",
  title: "G2a 堂數填錯",
  body: "唔一定作廢整張單。用下方「已繳堂數調動」減少／增加未耗堂，並寫明原因。",
  action: "用單池調動",
 },
 {
  key: "g2b",
  title: "G2b 科目／班收錯",
  body: "唔作廢收據。用「搬堂」由錯的已繳堂數搬去正確紀錄，兩邊會寫入調動表。同一級專科班已共用餘額，搬堂只用於私人課程／試堂／跨級等唔同組別。",
  action: "用搬堂",
 },
 {
  key: "g2d",
  title: "G2d 金額／優惠錯（堂數啱）",
  body: "作廢舊單＋重開正確單。超過 30 分鐘要第二人確認。請到繳費紀錄作廢。",
  action: "去繳費紀錄",
 },
 {
  key: "g2c",
  title: "堂送親友／轉讓",
  body: "唔當開錯單。選來源學生已繳堂數 → 目標學生已繳堂數搬堂（原因選送親友）。",
  action: "用搬堂",
 },
 {
  key: "g2e",
  title: "G2e 支付方式／狀態錯",
  body: "只改支付欄、或誤觸已收要 clawback（跟作廢／收款流程）。唔經已繳堂數調動。",
  action: "去繳費紀錄",
 },
 {
  key: "g2f",
  title: "G2f 重複收款",
  body: "作廢多出嗰張（逾時要第二人）。已耗過多可能拒作廢——先查點名再處理。",
  action: "去繳費紀錄",
 },
]

function packageTypeDisplay(raw: string): string {
 return (ENTITLEMENT_PACKAGE_TYPES as readonly string[]).includes(raw)
  ? packageTypeLabel(raw as EntitlementPackageType)
  : raw
}

function poolOptionLabel(p: EntitlementPoolSummary): string {
 return `${p.classLabel} · ${packageTypeDisplay(p.packageType)} · 餘 ${p.remainingLessons} 堂`
}

export function PaymentCorrectionView() {
 const { pushBanner } = useAppBanner()
 const [students, setStudents] = useState<StudentRecord[]>([])
 const [studentQuery, setStudentQuery] = useState("")
 const [studentId, setStudentId] = useState("")
 const [toStudentId, setToStudentId] = useState("")
 const [pools, setPools] = useState<EntitlementPoolSummary[]>([])
 const [toPools, setToPools] = useState<EntitlementPoolSummary[]>([])
 const [ledger, setLedger] = useState<EntitlementAdjustmentRow[]>([])
 const [mode, setMode] = useState<"adjust" | "transfer">("adjust")
 const [poolId, setPoolId] = useState("")
 const [toPoolId, setToPoolId] = useState("")
 const [delta, setDelta] = useState("-1")
 const [transferLessons, setTransferLessons] = useState("1")
 const [reasonCode, setReasonCode] =
  useState<EntitlementAdjustmentReasonCode>("g2a_lesson_count_fix")
 const [notes, setNotes] = useState("")
 const [saving, setSaving] = useState(false)
 const [loadErr, setLoadErr] = useState<string | null>(null)

 const filteredStudents = useMemo(() => {
  const q = studentQuery.trim().toLowerCase()
  if (!q) return students.slice(0, 80)
  return students
   .filter((s) => {
    const name = String(s.full_name ?? "").toLowerCase()
    const code = String(s.student_code ?? "").toLowerCase()
    return name.includes(q) || code.includes(q)
   })
   .slice(0, 80)
 }, [students, studentQuery])

 const reloadLedger = useCallback(async () => {
  const rows = await fetchRecentPoolAdjustments({
   studentId: studentId || undefined,
   limit: 40,
  })
  setLedger(rows)
 }, [studentId])

 const reloadPools = useCallback(async () => {
  if (!studentId) {
   setPools([])
   setPoolId("")
   return
  }
  const rows = await fetchPoolsForStudent(studentId)
  setPools(rows)
  setPoolId((prev) => (rows.some((p) => p.id === prev) ? prev : rows[0]?.id ?? ""))
 }, [studentId])

 useEffect(() => {
  if (!isSupabaseConfigured) return
  void fetchAllStudents()
   .then(setStudents)
   .catch((e) => {
    setLoadErr(e instanceof Error ? e.message : String(e))
   })
 }, [])

 useEffect(() => {
  void reloadPools().catch((e) => setLoadErr(e instanceof Error ? e.message : String(e)))
  void reloadLedger().catch((e) => setLoadErr(e instanceof Error ? e.message : String(e)))
 }, [reloadPools, reloadLedger])

 useEffect(() => {
  if (!toStudentId) {
   setToPools([])
   setToPoolId("")
   return
  }
  void fetchPoolsForStudent(toStudentId)
   .then((rows) => {
    setToPools(rows)
    setToPoolId(rows[0]?.id ?? "")
   })
   .catch((e) => setLoadErr(e instanceof Error ? e.message : String(e)))
 }, [toStudentId])

 const onGuide = (key: GuideKey) => {
  if (key === "g2a") {
   setMode("adjust")
   setReasonCode("g2a_lesson_count_fix")
   return
  }
  if (key === "g2b") {
   setMode("transfer")
   setReasonCode("g2b_wrong_class_move")
   setToStudentId(studentId)
   return
  }
  if (key === "g2c") {
   setMode("transfer")
   setReasonCode("g2c_transfer_friend")
   return
  }
 }

 const submitAdjust = async () => {
  if (!poolId) {
   pushBanner({ tone: "warning", title: "請先選學生及科班" })
   return
  }
  setSaving(true)
  try {
   const updated = await adjustEntitlementPool({
    poolId,
    deltaLessons: Number(delta),
    reasonCode,
    notes,
   })
   pushBanner({
    tone: "success",
    title: "已調整已繳堂數",
    message: `${updated.classLabel} 餘額 → ${updated.remainingLessons} 堂`,
   })
   setNotes("")
   await reloadPools()
   await reloadLedger()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentCorrectionView.adjust" })
   pushBanner({
    tone: "error",
    title: "調動失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  } finally {
   setSaving(false)
  }
 }

 const submitTransfer = async () => {
  if (!poolId || !toPoolId) {
   pushBanner({ tone: "warning", title: "請選來源及目標科班" })
   return
  }
  setSaving(true)
  try {
   const result = await transferEntitlementLessons({
    fromPoolId: poolId,
    toPoolId,
    lessons: Number(transferLessons),
    reasonCode,
    notes,
   })
   pushBanner({
    tone: "success",
    title: "已搬堂",
    message: `${result.from.classLabel} → ${result.to.classLabel}（${transferLessons} 堂）`,
   })
   setNotes("")
   await reloadPools()
   if (toStudentId) {
    const rows = await fetchPoolsForStudent(toStudentId)
    setToPools(rows)
   }
   await reloadLedger()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentCorrectionView.transfer" })
   pushBanner({
    tone: "error",
    title: "搬堂失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  } finally {
   setSaving(false)
  }
 }

 if (!isSupabaseConfigured) {
  return <p className="text-sm text-muted-foreground">尚未設定 Supabase。</p>
 }

 return (
  <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
   <header className="space-y-1">
    <h1 className="text-xl font-semibold tracking-tight">單據／堂數更正</h1>
    <p className="text-sm text-muted-foreground">
     按錯類型分流：堂數／科班用已繳堂數調動；金額錯先作廢再重開。禁硬刪單據。
    </p>
   </header>

   {loadErr ? (
    <p role="alert" className="text-sm text-destructive">
     {loadErr}
    </p>
   ) : null}

   <section className="space-y-3">
    <h2 className="text-sm font-medium">1. 先揀錯咗咩</h2>
    <ul className="grid gap-2 sm:grid-cols-2">
     {GUIDES.map((g) => (
      <li key={g.key} className="rounded-lg border border-border bg-card p-3">
       <p className="text-sm font-medium">{g.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">{g.body}</p>
       <div className="mt-2">
        {g.key === "g2d" || g.key === "g2e" || g.key === "g2f" ? (
         <Button type="button" size="sm" variant="outline" asChild>
          <Link to="/PaymentHistory">{g.action}</Link>
         </Button>
        ) : (
         <Button type="button" size="sm" variant="outline" onClick={() => onGuide(g.key)}>
          {g.action}
         </Button>
        )}
       </div>
      </li>
     ))}
    </ul>
   </section>

   <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
    <h2 className="text-sm font-medium">2. 已繳堂數調動</h2>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      size="sm"
      variant={mode === "adjust" ? "default" : "outline"}
      onClick={() => setMode("adjust")}
     >
      同一科班增減
     </Button>
     <Button
      type="button"
      size="sm"
      variant={mode === "transfer" ? "default" : "outline"}
      onClick={() => setMode("transfer")}
     >
      轉移已繳堂數
     </Button>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1.5 text-sm">
      <span className="font-medium">搜尋學生</span>
      <Input
       value={studentQuery}
       onChange={(e) => setStudentQuery(e.target.value)}
       placeholder="姓名／學號"
      />
     </label>
     <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{mode === "transfer" ? "來源學生" : "學生"}</span>
      <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
       <option value="">請選擇</option>
       {filteredStudents.map((s) => (
        <option key={s.id} value={s.id}>
         {s.full_name}
         {s.student_code ? `（${s.student_code}）` : ""}
        </option>
       ))}
      </Select>
     </label>
    </div>

    <label className="grid gap-1.5 text-sm">
     <span className="font-medium">{mode === "transfer" ? "來源科班" : "科班"}</span>
     <Select value={poolId} onChange={(e) => setPoolId(e.target.value)} disabled={!pools.length}>
      <option value="">{pools.length ? "請選擇" : "此生暫無已繳堂數"}</option>
      {pools.map((p) => (
       <option key={p.id} value={p.id}>
        {poolOptionLabel(p)}
       </option>
      ))}
     </Select>
    </label>

    {mode === "adjust" ? (
     <label className="grid gap-1.5 text-sm sm:max-w-xs">
      <span className="font-medium">調動堂數（負＝減少）</span>
      <Input type="number" step="0.5" value={delta} onChange={(e) => setDelta(e.target.value)} />
     </label>
    ) : (
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm">
       <span className="font-medium">目標學生</span>
       <Select
        value={toStudentId}
        onChange={(e) => setToStudentId(e.target.value)}
       >
        <option value="">請選擇</option>
        {filteredStudents.map((s) => (
         <option key={s.id} value={s.id}>
          {s.full_name}
          {s.student_code ? `（${s.student_code}）` : ""}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1.5 text-sm">
       <span className="font-medium">目標科班</span>
       <Select
        value={toPoolId}
        onChange={(e) => setToPoolId(e.target.value)}
        disabled={!toPools.length}
       >
        <option value="">{toPools.length ? "請選擇" : "目標學生暫無已繳堂數"}</option>
        {toPools.map((p) => (
         <option key={p.id} value={p.id}>
          {poolOptionLabel(p)}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1.5 text-sm sm:max-w-xs">
       <span className="font-medium">搬堂數</span>
       <Input
        type="number"
        min={0.5}
        step="0.5"
        value={transferLessons}
        onChange={(e) => setTransferLessons(e.target.value)}
       />
      </label>
     </div>
    )}

    <label className="grid gap-1.5 text-sm">
     <span className="font-medium">原因碼</span>
     <Select
      value={reasonCode}
      onChange={(e) => setReasonCode(e.target.value as EntitlementAdjustmentReasonCode)}
     >
      {ENTITLEMENT_ADJUSTMENT_REASON_CODES.map((code) => (
       <option key={code} value={code}>
        {ENTITLEMENT_ADJUSTMENT_REASON_LABELS[code]}
       </option>
      ))}
     </Select>
    </label>

    <label className="grid gap-1.5 text-sm">
     <span className="font-medium">備註（必填）</span>
     <Textarea
      rows={3}
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="例如：收據堂數多填 2；由英文池搬去數學池…"
      className="resize-none"
     />
    </label>

    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      disabled={saving}
      onClick={() => void (mode === "adjust" ? submitAdjust() : submitTransfer())}
     >
      {saving ? "處理中…" : mode === "adjust" ? "確認調動" : "確認搬堂"}
     </Button>
     <Button type="button" variant="outline" asChild>
      <Link to="/PaymentHistory">作廢單據（金額錯）</Link>
     </Button>
     <Button type="button" variant="outline" asChild>
      <Link to="/Payments">收款登記（重開）</Link>
     </Button>
    </div>
   </section>

   <section className="space-y-3">
    <div className="flex items-center justify-between gap-2">
     <h2 className="text-sm font-medium">3. 近期調動紀錄</h2>
     <Button type="button" size="sm" variant="ghost" onClick={() => void reloadLedger()}>
      重新整理
     </Button>
    </div>
    {ledger.length === 0 ? (
     <p className="text-sm text-muted-foreground">暫無調動紀錄。</p>
    ) : (
     <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
       <thead className="bg-muted/40 text-xs text-muted-foreground">
        <tr>
         <th className="px-3 py-2 font-medium">時間</th>
         <th className="px-3 py-2 font-medium">班／池</th>
         <th className="px-3 py-2 font-medium">Δ</th>
         <th className="px-3 py-2 font-medium">餘額</th>
         <th className="px-3 py-2 font-medium">原因</th>
         <th className="px-3 py-2 font-medium">操作者</th>
        </tr>
       </thead>
       <StaggerList as="tbody">
        {ledger.map((row) => (
         <StaggerItem key={row.id} as="tr" className="border-t border-border">
          <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">
           {row.createdAt.slice(0, 19).replace("T", " ")}
          </td>
          <td className="px-3 py-2">{row.classLabel || "—"}</td>
          <td className="px-3 py-2 tabular-nums font-medium">
           {row.deltaLessons > 0 ? `+${row.deltaLessons}` : row.deltaLessons}
          </td>
          <td className="px-3 py-2 tabular-nums text-xs">
           {row.beforeRemaining} → {row.afterRemaining}
          </td>
          <td className="px-3 py-2">
           <p className="text-xs">{row.reasonLabel}</p>
           <p className="text-xs text-muted-foreground">{row.notes}</p>
          </td>
          <td className="px-3 py-2 text-xs text-muted-foreground">
           {row.createdByName ?? row.createdByEmail ?? "—"}
          </td>
         </StaggerItem>
        ))}
       </StaggerList>
      </table>
     </div>
    )}
   </section>
  </div>
 )
}
