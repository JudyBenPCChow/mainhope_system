import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { Calculator, GripVertical, Pencil, Percent, Plus, Trash2 } from "lucide-react"

import { AdminPageHeader, pagePadClass } from "@/components/detail/AdminPageHeader"
import { AdminWorkspaceNav } from "@/components/detail/AdminWorkspaceNav"
import {
 ADMIN_WORKSPACE_DESCRIPTION,
 adminWorkspacePageClass,
} from "@/lib/adminNavigation"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { joinMultiValueField, parseMultiValueField } from "@/lib/multiValueField"
import { summarizeEligibilityRules } from "@/lib/paymentDiscountEligibility"
import {
 DISCOUNT_KIND_LABELS,
 DISCOUNT_KINDS,
 isLessonTierKind,
 type DiscountKind,
 type LessonTierRow,
} from "@/lib/paymentDiscountKinds"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 applyDiscountsToSubtotal,
 batchUpdateDiscountSortOrders,
 deletePaymentDiscount,
 fetchAllPaymentDiscounts,
 fetchDiscountApplicationCount,
 fetchDiscountUsageStats,
 insertPaymentDiscount,
 updatePaymentDiscount,
 type PaymentDiscountRow,
 type PaymentDiscountUsageStats,
 type PaymentDiscountWriteInput,
 stackGroupsFromDiscount,
} from "@/services/paymentDiscountQueries"
import { fetchAcademicYearOptions, fetchSubjectOptions, type SubjectOption } from "@/services/classQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

function formatErr(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
 return "操作失敗"
}

function money(n: number): string {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

function parseOptionalNumber(raw: string): number | null {
 const t = raw.trim()
 if (!t) return null
 const n = Number(t)
 if (!Number.isFinite(n)) return null
 return n
}

function formatUpdatedAt(iso: string): string {
 if (!iso) return "—"
 const d = iso.slice(0, 10)
 return d || "—"
}

function summarizeRule(r: PaymentDiscountRow): string {
 if (r.isLabelOnly) return "僅註記（不計算）"
 const parts: string[] = [DISCOUNT_KIND_LABELS[r.discountKind]]
 if (isLessonTierKind(r.discountKind) && r.lessonTiers?.tiers.length) {
  parts.push(
   r.lessonTiers.tiers.map((t) => `≥${t.minLessons}堂-$${t.amountOff}`).join(" / ")
  )
 } else {
  if (r.percentOff != null && r.percentOff > 0) parts.push(`減 ${r.percentOff}%`)
  if (r.amountOff != null && r.amountOff > 0) parts.push(`減 $${r.amountOff}`)
  if (r.groupEnrollmentRules?.amountOffPerStudent) {
   parts.push(`$${r.groupEnrollmentRules.amountOffPerStudent}/人`)
  }
 }
 if (parts.length === 1 && parts[0] === DISCOUNT_KIND_LABELS.fixed_amount) return "僅註記（不計算）"
 return parts.join("，")
}

function summarizeScope(r: PaymentDiscountRow): string {
 const parts: string[] = []
 if (r.validFrom || r.validTo) {
  parts.push(`${r.validFrom ?? "…"} ~ ${r.validTo ?? "…"}`)
 }
 const years = parseMultiValueField(r.academicYear)
 if (years.length > 0) parts.push(`學年 ${years.join("、")}`)
 const groups = stackGroupsFromDiscount(r)
 if (groups.length > 0) parts.push(`互斥：${groups.join("、")}`)
 if (r.maxStackCount != null) parts.push(`每單≤${r.maxStackCount}項`)
 const elig = summarizeEligibilityRules(r.eligibilityRules)
 if (elig) parts.push(`資格：${elig}`)
 return parts.length > 0 ? parts.join("；") : "—"
}

const DEFAULT_TIER_ROWS: LessonTierRow[] = [
 { minLessons: 24, amountOff: 200 },
 { minLessons: 36, amountOff: 600 },
]

const emptyForm = {
 name: "",
 description: "",
 discountKind: "fixed_amount" as DiscountKind,
 percentOff: "",
 amountOff: "",
 isActive: true,
 sortOrder: "0",
 validFrom: "",
 validTo: "",
 academicYears: [] as string[],
 stackGroups: [] as string[],
 maxStackCount: "",
 isLabelOnly: false,
 previewSubtotal: "1000",
 tierRows: DEFAULT_TIER_ROWS.map((t) => ({
  minLessons: String(t.minLessons),
  amountOff: String(t.amountOff),
 })),
 groupMinSize: "3",
 groupAmountPerStudent: "200",
 eligMinSubjectCount: "",
 eligMinTotalLessons: "",
 eligRequiredCodes: [] as string[],
 eligAnyCodes: [] as string[],
}

export function PaymentDiscountsView() {
 const { profile, role } = useAuth()
 const canEditDiscounts = can(profile?.activeCapabilities, "catalog.manage")
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<PaymentDiscountRow[]>([])
 const [usageById, setUsageById] = useState<Map<string, PaymentDiscountUsageStats>>(new Map())
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [dialogOpen, setDialogOpen] = useState(false)
 const [editing, setEditing] = useState<PaymentDiscountRow | null>(null)
 const [form, setForm] = useState(emptyForm)
 const [saving, setSaving] = useState(false)
 const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
 const [dragId, setDragId] = useState<string | null>(null)
 const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([])
 const [academicYearOptions, setAcademicYearOptions] = useState<
  Array<{ value: string; label: string }>
 >([])
 const [newStackGroup, setNewStackGroup] = useState("")
 const rowsRef = useRef(rows)
 useEffect(() => {
  rowsRef.current = rows
 }, [rows])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setUsageById(new Map())
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [discountRows, usageStats] = await Promise.all([
    fetchAllPaymentDiscounts(),
    fetchDiscountUsageStats(),
   ])
   setRows(discountRows)
   setUsageById(new Map(usageStats.map((s) => [s.discountId, s])))
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.load", setErr })
   setRows([])
   setUsageById(new Map())
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
  if (isSupabaseConfigured) {
   void fetchSubjectOptions().then(setSubjectOptions).catch(() => setSubjectOptions([]))
   void fetchAcademicYearOptions()
    .then((years) =>
     setAcademicYearOptions(
      years.map((y) => ({
       value: y.label,
       label: y.is_current ? `${y.label}（目前學年）` : `${y.label} 學年`,
      }))
     )
    )
    .catch(() => setAcademicYearOptions([]))
  }
 }, [load])

 const openCreate = () => {
  setEditing(null)
  setNewStackGroup("")
  setForm({
   ...emptyForm,
   sortOrder: String(rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0),
  })
  setDialogOpen(true)
 }

 const openEdit = (r: PaymentDiscountRow) => {
  setEditing(r)
  setNewStackGroup("")
  setForm({
   name: r.name,
   description: r.description ?? "",
   discountKind: r.discountKind,
   percentOff: r.percentOff != null ? String(r.percentOff) : "",
   amountOff: r.amountOff != null ? String(r.amountOff) : "",
   isActive: r.isActive,
   sortOrder: String(r.sortOrder),
   validFrom: r.validFrom ?? "",
   validTo: r.validTo ?? "",
   academicYears: parseMultiValueField(r.academicYear),
   stackGroups: stackGroupsFromDiscount(r),
   maxStackCount: r.maxStackCount != null ? String(r.maxStackCount) : "",
   isLabelOnly: r.isLabelOnly,
   previewSubtotal: "1000",
   tierRows:
    r.lessonTiers?.tiers.length
     ? r.lessonTiers.tiers.map((t) => ({
        minLessons: String(t.minLessons),
        amountOff: String(t.amountOff),
       }))
     : DEFAULT_TIER_ROWS.map((t) => ({
        minLessons: String(t.minLessons),
        amountOff: String(t.amountOff),
       })),
   groupMinSize:
    r.groupEnrollmentRules?.minGroupSize != null
     ? String(r.groupEnrollmentRules.minGroupSize)
     : "3",
   groupAmountPerStudent:
    r.groupEnrollmentRules?.amountOffPerStudent != null
     ? String(r.groupEnrollmentRules.amountOffPerStudent)
     : "200",
   eligMinSubjectCount:
    r.eligibilityRules?.minSubjectCount != null ? String(r.eligibilityRules.minSubjectCount) : "",
   eligMinTotalLessons:
    r.eligibilityRules?.minTotalLessons != null ? String(r.eligibilityRules.minTotalLessons) : "",
   eligRequiredCodes: [...(r.eligibilityRules?.requiredSubjectCodes ?? [])],
   eligAnyCodes: [...(r.eligibilityRules?.requireAnySubjectCodes ?? [])],
  })
  setDialogOpen(true)
 }

 const buildWriteInput = (): PaymentDiscountWriteInput | string => {
  if (!form.name.trim()) return "請填名稱"
  if (form.percentOff.trim()) {
   const p = parseOptionalNumber(form.percentOff)
   if (p == null) return "減免百分比須為有效數字"
   if (p < 0 || p > 100) return "折扣百分比須介於 0–100"
  }
  if (form.amountOff.trim()) {
   const a = parseOptionalNumber(form.amountOff)
   if (a == null) return "固定減免須為有效數字"
   if (a < 0) return "固定減免不可為負數"
  }
  if (form.maxStackCount.trim()) {
   const m = parseOptionalNumber(form.maxStackCount)
   if (m == null) return "疊加上限須為有效正整數"
   if (m < 1 || !Number.isInteger(m)) return "疊加上限須為 ≥ 1 的整數"
  }
  const sortN = parseOptionalNumber(form.sortOrder)
  if (form.sortOrder.trim() && sortN == null) return "排序須為有效數字"
  if (form.eligMinSubjectCount.trim()) {
   const n = parseOptionalNumber(form.eligMinSubjectCount)
   if (n == null || n < 1 || !Number.isInteger(n)) return "最少科目數須為 ≥ 1 的整數"
  }
  if (form.eligMinTotalLessons.trim()) {
   const n = parseOptionalNumber(form.eligMinTotalLessons)
   if (n == null || n < 1 || !Number.isInteger(n)) return "最少堂數須為 ≥ 1 的整數"
  }

  const percentOff = form.percentOff.trim() ? parseOptionalNumber(form.percentOff) : null
  const amountOff = form.amountOff.trim() ? parseOptionalNumber(form.amountOff) : null
  const maxStackCount = form.maxStackCount.trim() ? parseOptionalNumber(form.maxStackCount) : null

  let lessonTiers = null
  if (isLessonTierKind(form.discountKind)) {
   const tiers: LessonTierRow[] = []
   for (const row of form.tierRows) {
    const minLessons = parseOptionalNumber(row.minLessons)
    const tierAmount = parseOptionalNumber(row.amountOff)
    if (minLessons == null || tierAmount == null || minLessons < 1 || tierAmount < 0) {
     return "階梯表每列須為有效堂數與減免金額"
    }
    tiers.push({ minLessons: Math.trunc(minLessons), amountOff: tierAmount })
   }
   if (tiers.length === 0) return "請至少設定一級階梯"
   lessonTiers = { selection: "highest_only" as const, tiers }
  }

  let groupEnrollmentRules = null
  if (form.discountKind === "group_class") {
   const minGroupSize = parseOptionalNumber(form.groupMinSize)
   const amountOffPerStudent = parseOptionalNumber(form.groupAmountPerStudent)
   if (minGroupSize == null || minGroupSize < 2 || !Number.isInteger(minGroupSize)) {
    return "自組人數下限須為 ≥ 2 的整數"
   }
   if (amountOffPerStudent == null || amountOffPerStudent < 0) {
    return "每人減免須為有效金額"
   }
   groupEnrollmentRules = {
    minGroupSize: Math.trunc(minGroupSize),
    requireSameClassId: true,
    requireEnrollmentPeriod: "兩期全報",
    requireCourseMode: "summer_two_period",
    requireJointPayment: true,
    amountOffPerStudent,
   }
  }

  const minSubjectCount = form.eligMinSubjectCount.trim()
   ? Math.trunc(parseOptionalNumber(form.eligMinSubjectCount)!)
   : null
  const minTotalLessons = form.eligMinTotalLessons.trim()
   ? Math.trunc(parseOptionalNumber(form.eligMinTotalLessons)!)
   : null
  const eligibilityRules = (() => {
   const hasFormRules =
    minSubjectCount != null ||
    minTotalLessons != null ||
    form.eligRequiredCodes.length > 0 ||
    form.eligAnyCodes.length > 0
   if (!hasFormRules && !editing?.eligibilityRules) return null
   const merged = { ...(editing?.eligibilityRules ?? {}) }
   merged.minSubjectCount = minSubjectCount
   merged.minTotalLessons = minTotalLessons
   merged.requiredSubjectCodes =
    form.eligRequiredCodes.length > 0 ? form.eligRequiredCodes : null
   merged.requireAnySubjectCodes =
    form.eligAnyCodes.length > 0 ? form.eligAnyCodes : null
   const hasAny =
    merged.minSubjectCount != null ||
    merged.minTotalLessons != null ||
    (merged.requiredSubjectCodes?.length ?? 0) > 0 ||
    (merged.requireAnySubjectCodes?.length ?? 0) > 0 ||
    (merged.requireOneFromEachGroup?.length ?? 0) > 0 ||
    merged.minEnrollmentPeriodPerLine != null ||
    merged.requireNewStudent ||
    merged.familyLessonPool?.aggregateSiblingLessons
   return hasAny ? merged : null
  })()

  return {
   name: form.name.trim(),
   description: form.description.trim() || null,
   discountKind: form.discountKind,
   percentOff,
   amountOff,
   isActive: form.isActive,
   sortOrder: sortN ?? 0,
   validFrom: form.validFrom.trim() || null,
   validTo: form.validTo.trim() || null,
   academicYear: joinMultiValueField(form.academicYears),
   stackGroup: joinMultiValueField(form.stackGroups),
   maxStackCount: maxStackCount != null ? Math.trunc(maxStackCount) : null,
   isLabelOnly: form.isLabelOnly,
   lessonTiers,
   groupEnrollmentRules,
   eligibilityRules,
  }
 }

 const submit = async () => {
  const input = buildWriteInput()
  if (typeof input === "string") {
   pushBanner({ tone: "warning", title: input })
   return
  }
  setSaving(true)
  try {
   if (editing) {
    await updatePaymentDiscount(editing.id, input)
   } else {
    await insertPaymentDiscount(input)
   }
   setDialogOpen(false)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.submit" })
   pushBanner({ tone: "error", title: "儲存優惠失敗", message: formatErr(e) })
  } finally {
   setSaving(false)
  }
 }

 const onToggleActive = async (r: PaymentDiscountRow) => {
  try {
   await updatePaymentDiscount(r.id, { isActive: !r.isActive })
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.onToggleActive" })
   pushBanner({ tone: "error", title: "更新狀態失敗", message: formatErr(e) })
  }
 }

 const onDelete = async (r: PaymentDiscountRow) => {
  const refCount = usageById.get(r.id)?.applicationCount ?? (await fetchDiscountApplicationCount(r.id))
  if (refCount > 0) {
   pushBanner({
    tone: "warning",
    title: "無法刪除",
    message: `優惠「${r.name}」已被 ${refCount} 筆繳費紀錄引用。請改為「停用」，以保留歷史資料。`,
   })
   return
  }
  if (
   !(await confirmDialog({
    title: "刪除優惠",
    description: `確定刪除優惠「${r.name}」？此操作無法復原；未被引用的項目才可刪除。`,
    confirmText: "確認刪除",
    tone: "destructive",
   }))
  )
   return
  try {
   await deletePaymentDiscount(r.id)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.onDelete" })
   pushBanner({
    tone: "error",
    title: "刪除優惠失敗",
    message: formatErr(e),
   })
  }
 }

 const onBulkSetActive = async (active: boolean) => {
  if (selectedIds.size === 0) return
  try {
   for (const id of selectedIds) {
    await updatePaymentDiscount(id, { isActive: active })
   }
   setSelectedIds(new Set())
   await load()
   pushBanner({ tone: "success", title: active ? "已批量啟用" : "已批量停用" })
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.onBulkSetActive" })
   pushBanner({ tone: "error", title: "批量更新失敗", message: formatErr(e) })
  }
 }

 const toggleSelect = (id: string) => {
  setSelectedIds((prev) => {
   const next = new Set(prev)
   if (next.has(id)) next.delete(id)
   else next.add(id)
   return next
  })
 }

 const toggleSelectAll = () => {
  if (selectedIds.size === rows.length) setSelectedIds(new Set())
  else setSelectedIds(new Set(rows.map((r) => r.id)))
 }

 const onDragStart = (id: string) => setDragId(id)

 const onDragOver = (e: DragEvent, overId: string) => {
  e.preventDefault()
  if (!dragId || dragId === overId) return
  setRows((prev) => {
   const fromIdx = prev.findIndex((r) => r.id === dragId)
   const toIdx = prev.findIndex((r) => r.id === overId)
   if (fromIdx < 0 || toIdx < 0) return prev
   const next = [...prev]
   const [moved] = next.splice(fromIdx, 1)
   next.splice(toIdx, 0, moved)
   rowsRef.current = next
   return next
  })
 }

 const onDragEnd = async () => {
  if (!dragId) return
  setDragId(null)
  const finalRows = rowsRef.current
  const updates = finalRows.map((r, idx) => ({ id: r.id, sortOrder: idx }))
  try {
   await batchUpdateDiscountSortOrders(updates)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentDiscountsView.onDragEnd" })
   pushBanner({ tone: "error", title: "更新排序失敗", message: formatErr(e) })
   await load()
  }
 }

 const previewDiscount = useMemo((): PaymentDiscountRow | null => {
  const input = buildWriteInput()
  if (typeof input === "string") return null
  return {
   id: "preview",
   name: input.name || "（試算）",
   description: input.description ?? null,
   discountKind: input.discountKind ?? "fixed_amount",
   percentOff: input.percentOff,
   amountOff: input.amountOff,
   isActive: input.isActive,
   sortOrder: input.sortOrder,
   validFrom: input.validFrom ?? null,
   validTo: input.validTo ?? null,
   academicYear: input.academicYear ?? null,
   stackGroup: input.stackGroup ?? null,
   maxStackCount: input.maxStackCount ?? null,
   isLabelOnly: input.isLabelOnly ?? false,
   lessonTiers: input.lessonTiers ?? null,
   groupEnrollmentRules: input.groupEnrollmentRules ?? null,
   eligibilityRules: input.eligibilityRules ?? null,
   createdAt: "",
   updatedAt: "",
  }
 }, [form])

 const academicYearSelectOptions = useMemo(() => {
  const byValue = new Map(academicYearOptions.map((o) => [o.value, o]))
  for (const y of form.academicYears) {
   if (!byValue.has(y)) byValue.set(y, { value: y, label: `${y} 學年` })
  }
  return [...byValue.values()]
 }, [academicYearOptions, form.academicYears])

 const stackGroupCheckboxOptions = useMemo(() => {
  const values = new Set<string>()
  for (const r of rows) {
   for (const g of stackGroupsFromDiscount(r)) values.add(g)
  }
  for (const g of form.stackGroups) values.add(g)
  return [...values].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows, form.stackGroups])

 const addStackGroup = () => {
  const code = newStackGroup.trim()
  if (!code) return
  setForm((f) => ({
   ...f,
   stackGroups: f.stackGroups.includes(code) ? f.stackGroups : [...f.stackGroups, code],
  }))
  setNewStackGroup("")
 }

 const previewSubtotalN = parseOptionalNumber(form.previewSubtotal) ?? 0
 const previewTotal =
  previewDiscount && previewSubtotalN > 0
   ? applyDiscountsToSubtotal(previewSubtotalN, [previewDiscount])
   : previewSubtotalN

 return (
  <div className={cn(adminWorkspacePageClass, pagePadClass(role, "md:p-6"))}>
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="工作域"
     title="優惠折扣"
     description={ADMIN_WORKSPACE_DESCRIPTION.payments}
     actions={
      canEditDiscounts ? (
       <Button type="button" onClick={openCreate} disabled={!isSupabaseConfigured}>
        <Plus className="h-4 w-4" />
        新增優惠
       </Button>
      ) : null
     }
    />
   ) : (
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Percent className="h-8 w-8 text-primary" aria-hidden />
      優惠折扣
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      {canEditDiscounts
       ? "維護繳費表單可選的優惠項目；套用順序依「排序」欄（非勾選順序）。"
       : "此頁面為優惠規則查閱，修改僅限管理員。"}
     </p>
    </div>
    {canEditDiscounts ? (
     <Button type="button" onClick={openCreate} disabled={!isSupabaseConfigured}>
      <Plus className="h-4 w-4" />
      新增優惠
     </Button>
    ) : null}
   </header>
   )}

   <AdminWorkspaceNav workspace="payments" />

   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {canEditDiscounts && rows.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
      {selectedIds.size === rows.length ? "取消全選" : "全選"}
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={selectedIds.size === 0}
      onClick={() => void onBulkSetActive(true)}
     >
      批量啟用
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={selectedIds.size === 0}
      onClick={() => void onBulkSetActive(false)}
     >
      批量停用
     </Button>
     {selectedIds.size > 0 ? (
      <span className="text-xs text-muted-foreground">已選 {selectedIds.size} 項</span>
     ) : null}
    </div>
   ) : null}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
     {canEditDiscounts ? "尚無優惠項目，請按「新增優惠」。" : "尚無優惠項目。"}
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[960px] border-collapse text-left text-sm">
      <thead className="border-b bg-muted/40">
       <tr>
        <th className="w-8 px-2 py-2" aria-label="拖曳" />
        <th className="w-8 px-2 py-2">
         <input
          type="checkbox"
          checked={selectedIds.size === rows.length && rows.length > 0}
          onChange={toggleSelectAll}
          aria-label="全選"
         />
        </th>
        <th className="w-[5%] px-2 py-2 font-medium">序</th>
        <th className="w-[14%] px-2 py-2 font-medium">名稱</th>
        <th className="w-[16%] px-2 py-2 font-medium">規則</th>
        <th className="w-[16%] px-2 py-2 font-medium">條件</th>
        <th className="w-[8%] px-2 py-2 font-medium">引用</th>
        <th className="w-[8%] px-2 py-2 font-medium">狀態</th>
        <th className="w-[8%] px-2 py-2 font-medium">更新</th>
        <th className="w-[17%] px-2 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {rows.map((r) => {
        const usage = usageById.get(r.id)
        return (
         <StaggerItem
          key={r.id}
          as="tr"
          draggable
          onDragStart={() => onDragStart(r.id)}
          onDragOver={(e: React.DragEvent) => onDragOver(e, r.id)}
          onDragEnd={() => void onDragEnd()}
          className={cn(
           "border-b border-border/80 last:border-0",
           dragId === r.id && "bg-muted/30"
          )}
         >
          <td className="cursor-grab px-2 py-2 text-muted-foreground active:cursor-grabbing">
           <GripVertical className="h-4 w-4" aria-hidden />
          </td>
          <td className="px-2 py-2">
           <input
            type="checkbox"
            checked={selectedIds.has(r.id)}
            onChange={() => toggleSelect(r.id)}
            aria-label={`選取 ${r.name}`}
           />
          </td>
          <td className="px-2 py-2 tabular-nums">{r.sortOrder}</td>
          <td className="px-2 py-2 font-medium">{r.name}</td>
          <td className="px-2 py-2 text-muted-foreground">{summarizeRule(r)}</td>
          <td className="px-2 py-2 text-xs text-muted-foreground">{summarizeScope(r)}</td>
          <td className="px-2 py-2 tabular-nums text-muted-foreground">
           {usage ? (
            <span title={usage.totalDeducted > 0 ? `累計減免 ${money(usage.totalDeducted)}` : undefined}>
             {usage.applicationCount}
             {usage.totalDeducted > 0 ? (
              <span className="block text-xs">-{money(usage.totalDeducted)}</span>
             ) : null}
            </span>
           ) : (
            "0"
           )}
          </td>
          <td className="px-2 py-2">
           <button
            type="button"
            className={cn(
             "rounded px-1.5 py-0.5 text-xs font-medium",
             r.isActive
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground"
            )}
            onClick={() => {
             if (!canEditDiscounts) return
             void onToggleActive(r)
            }}
            disabled={!canEditDiscounts}
            title={canEditDiscounts ? undefined : "此規則僅限管理員修改"}
           >
            {r.isActive ? "啟用" : "停用"}
           </button>
          </td>
          <td className="px-2 py-2 text-xs tabular-nums text-muted-foreground">
           {formatUpdatedAt(r.updatedAt)}
          </td>
          <td className="px-2 py-2">
           {canEditDiscounts ? (
            <div className="flex flex-wrap gap-1">
             <Button type="button" variant="outline" size="sm" onClick={() => openEdit(r)}>
              <Pencil className="h-3.5 w-3.5" />
              編輯
             </Button>
             <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => void onDelete(r)}
             >
              <Trash2 className="h-3.5 w-3.5" />
              刪除
             </Button>
            </div>
           ) : (
            <span className="text-xs text-muted-foreground">僅限管理員修改</span>
           )}
          </td>
         </StaggerItem>
        )
       })}
      </StaggerList>
     </table>
    </div>
   )}

   <Dialog
    open={dialogOpen}
    onOpenChange={(open) => {
     setDialogOpen(open)
     if (!open) setNewStackGroup("")
    }}
   >
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>{editing ? "編輯優惠" : "新增優惠"}</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <div className="grid gap-1.5">
       <label className="font-medium">名稱 *</label>
       <Input
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="例如：舊生 95 折"
       />
      </div>
      <div className="grid gap-1.5">
       <label className="font-medium">優惠簡介（選填）</label>
       <Textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="以文字備註說明此優惠內容、適用對象或注意事項"
        rows={3}
       />
      </div>
      <div className="grid gap-1.5">
       <label className="font-medium">優惠類型</label>
       <Select
        className="flex h-10 w-full min-h-10"
        value={form.discountKind}
        onChange={(e) =>
         setForm((f) => ({ ...f, discountKind: e.target.value as DiscountKind }))
        }
       >
        {DISCOUNT_KINDS.map((k) => (
         <option key={k} value={k}>
          {DISCOUNT_KIND_LABELS[k]}
         </option>
        ))}
       </Select>
      </div>
      {isLessonTierKind(form.discountKind) ? (
       <div className="rounded-lg border border-border bg-muted/10 p-3">
        <p className="mb-2 font-medium">堂數階梯（只取最高符合級）</p>
        <div className="space-y-2">
         {form.tierRows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-2">
           <Input
            type="number"
            min={1}
            value={row.minLessons}
            onChange={(e) =>
             setForm((f) => ({
              ...f,
              tierRows: f.tierRows.map((r, i) =>
               i === idx ? { ...r, minLessons: e.target.value } : r
              ),
             }))
            }
            placeholder="最少堂數"
           />
           <Input
            type="number"
            min={0}
            value={row.amountOff}
            onChange={(e) =>
             setForm((f) => ({
              ...f,
              tierRows: f.tierRows.map((r, i) =>
               i === idx ? { ...r, amountOff: e.target.value } : r
              ),
             }))
            }
            placeholder="減免 HKD"
           />
          </div>
         ))}
        </div>
        <Button
         type="button"
         variant="outline"
         size="sm"
         className="mt-2"
         onClick={() =>
          setForm((f) => ({
           ...f,
           tierRows: [...f.tierRows, { minLessons: "", amountOff: "" }],
          }))
         }
        >
         新增階梯
        </Button>
       </div>
      ) : null}
      {form.discountKind === "group_class" ? (
       <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
         <label className="font-medium">最少人數</label>
         <Input
          type="number"
          min={2}
          value={form.groupMinSize}
          onChange={(e) => setForm((f) => ({ ...f, groupMinSize: e.target.value }))}
         />
        </div>
        <div className="grid gap-1.5">
         <label className="font-medium">每人減免 HKD</label>
         <Input
          type="number"
          min={0}
          value={form.groupAmountPerStudent}
          onChange={(e) => setForm((f) => ({ ...f, groupAmountPerStudent: e.target.value }))}
         />
        </div>
       </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
       <div className="grid gap-1.5">
        <label className="font-medium">減免百分比（0–100）</label>
        <Input
         type="number"
         min={0}
         max={100}
         step="0.01"
         value={form.percentOff}
         onChange={(e) => setForm((f) => ({ ...f, percentOff: e.target.value }))}
         placeholder="5 = 95 折"
         disabled={form.isLabelOnly}
        />
       </div>
       <div className="grid gap-1.5">
        <label className="font-medium">固定減免 HKD</label>
        <Input
         type="number"
         min={0}
         step="0.01"
         value={form.amountOff}
         onChange={(e) => setForm((f) => ({ ...f, amountOff: e.target.value }))}
         placeholder="100"
         disabled={form.isLabelOnly}
        />
       </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2">
       <input
        type="checkbox"
        checked={form.isLabelOnly}
        onChange={(e) =>
         setForm((f) => ({
          ...f,
          isLabelOnly: e.target.checked,
          ...(e.target.checked ? { percentOff: "", amountOff: "" } : {}),
         }))
        }
       />
       僅註記（不計算金額）
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
       <div className="grid gap-1.5">
        <label className="font-medium">有效開始日</label>
        <Input
         type="date"
         value={form.validFrom}
         onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
        />
       </div>
       <div className="grid gap-1.5">
        <label className="font-medium">有效結束日</label>
        <Input
         type="date"
         value={form.validTo}
         onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
        />
       </div>
      </div>
      <div className="space-y-3">
       <div className="grid gap-1.5">
        <label className="font-medium">限定學年（選填，可多選）</label>
        {academicYearSelectOptions.length > 0 ? (
         <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-3">
          {academicYearSelectOptions.map((opt) => (
           <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 text-sm"
           >
            <input
             type="checkbox"
             className="h-4 w-4 rounded border-input"
             checked={form.academicYears.includes(opt.value)}
             onChange={() =>
              setForm((f) => ({
               ...f,
               academicYears: f.academicYears.includes(opt.value)
                ? f.academicYears.filter((y) => y !== opt.value)
                : [...f.academicYears, opt.value],
              }))
             }
            />
            <span>{opt.label}</span>
           </label>
          ))}
         </div>
        ) : (
         <p className="text-xs text-muted-foreground">尚無學年資料</p>
        )}
        <p className="text-xs text-muted-foreground">不勾選表示所有學年皆適用。</p>
       </div>
       <div className="grid gap-1.5">
        <label className="font-medium">互斥群組（選填，可多選）</label>
        {stackGroupCheckboxOptions.length > 0 ? (
         <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-3">
          {stackGroupCheckboxOptions.map((code) => (
           <label key={code} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
             type="checkbox"
             className="h-4 w-4 rounded border-input"
             checked={form.stackGroups.includes(code)}
             onChange={() =>
              setForm((f) => ({
               ...f,
               stackGroups: f.stackGroups.includes(code)
                ? f.stackGroups.filter((g) => g !== code)
                : [...f.stackGroups, code],
              }))
             }
            />
            <span>{code}</span>
           </label>
          ))}
         </div>
        ) : (
         <p className="text-xs text-muted-foreground">尚無既有群組，請於下方新增。</p>
        )}
        <div className="flex flex-wrap gap-2">
         <Input
          className="h-9 min-w-[10rem] flex-1 text-sm"
          value={newStackGroup}
          placeholder="新群組代碼"
          onChange={(e) => setNewStackGroup(e.target.value)}
          onKeyDown={(e) => {
           if (e.key === "Enter") {
            e.preventDefault()
            addStackGroup()
           }
          }}
         />
         <Button type="button" variant="outline" size="sm" onClick={addStackGroup}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          加入群組
         </Button>
        </div>
        {form.stackGroups.length > 0 ? (
         <p className="text-xs text-muted-foreground">
          已選：{form.stackGroups.join("、")}
         </p>
        ) : null}
        <p className="text-xs text-muted-foreground">同群組在繳費單只能選一項優惠。</p>
       </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
       <div className="grid gap-1.5">
        <label className="font-medium">每單疊加上限（選填）</label>
        <Input
         type="number"
         min={1}
         step={1}
         value={form.maxStackCount}
         onChange={(e) => setForm((f) => ({ ...f, maxStackCount: e.target.value }))}
         placeholder="留空 = 不限制"
        />
       </div>
       <div className="grid gap-1.5">
        <label className="font-medium">排序（數字小先套用）</label>
        <Input
         type="number"
         value={form.sortOrder}
         onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
        />
       </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/10 p-3">
       <p className="mb-2 font-medium">繳費資格（選填）</p>
       <p className="mb-3 text-xs text-muted-foreground">
        依本次繳費明細的科目代碼（subjects.code）判斷；不符合時繳費頁仍顯示但不可選。
       </p>
       <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
         <label className="font-medium">最少科目數</label>
         <Input
          type="number"
          min={1}
          step={1}
          value={form.eligMinSubjectCount}
          onChange={(e) => setForm((f) => ({ ...f, eligMinSubjectCount: e.target.value }))}
          placeholder="例如 2"
         />
        </div>
        <div className="grid gap-1.5">
         <label className="font-medium">最少總堂數</label>
         <Input
          type="number"
          min={1}
          step={1}
          value={form.eligMinTotalLessons}
          onChange={(e) => setForm((f) => ({ ...f, eligMinTotalLessons: e.target.value }))}
          placeholder="例如 8"
         />
        </div>
       </div>
       {subjectOptions.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
         <div>
          <p className="mb-1.5 text-xs font-medium">必須包含科目（全選才符合）</p>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-input p-2">
           {subjectOptions.map((s) => (
            <label key={`req-${s.code}`} className="flex cursor-pointer items-center gap-2 text-xs">
             <input
              type="checkbox"
              checked={form.eligRequiredCodes.includes(s.code)}
              onChange={() =>
               setForm((f) => ({
                ...f,
                eligRequiredCodes: f.eligRequiredCodes.includes(s.code)
                 ? f.eligRequiredCodes.filter((c) => c !== s.code)
                 : [...f.eligRequiredCodes, s.code],
               }))
              }
             />
             <span>
              {s.code} · {s.name_zh}
             </span>
            </label>
           ))}
          </div>
         </div>
         <div>
          <p className="mb-1.5 text-xs font-medium">另外需包含其中一科</p>
          <div className="max-h-32 space-y-1 overflow-y-auto rounded border border-input p-2">
           {subjectOptions.map((s) => (
            <label key={`any-${s.code}`} className="flex cursor-pointer items-center gap-2 text-xs">
             <input
              type="checkbox"
              checked={form.eligAnyCodes.includes(s.code)}
              onChange={() =>
               setForm((f) => ({
                ...f,
                eligAnyCodes: f.eligAnyCodes.includes(s.code)
                 ? f.eligAnyCodes.filter((c) => c !== s.code)
                 : [...f.eligAnyCodes, s.code],
               }))
              }
             />
             <span>
              {s.code} · {s.name_zh}
             </span>
            </label>
           ))}
          </div>
         </div>
        </div>
       ) : (
        <p className="mt-2 text-xs text-muted-foreground">載入科目清單中…</p>
       )}
      </div>
      <label className="flex cursor-pointer items-center gap-2">
       <input
        type="checkbox"
        checked={form.isActive}
        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
       />
       啟用（停用後不會出現在繳費表單）
      </label>

      <div className="rounded-lg border border-dashed border-border bg-muted/15 p-3">
       <div className="mb-2 flex items-center gap-1.5 font-medium">
        <Calculator className="h-4 w-4" aria-hidden />
        試算
       </div>
       <div className="grid gap-2 sm:grid-cols-2">
        <Input
         type="number"
         min={0}
         step="0.01"
         value={form.previewSubtotal}
         onChange={(e) => setForm((f) => ({ ...f, previewSubtotal: e.target.value }))}
         placeholder="假設小計"
        />
        <div className="flex items-center justify-between rounded-md bg-background px-3 py-2">
         <span className="text-muted-foreground">試算結果</span>
         <span className="font-semibold tabular-nums text-warning">
          {previewSubtotalN > 0 ? money(previewTotal) : "—"}
         </span>
        </div>
       </div>
      </div>

      <Button type="button" disabled={saving} onClick={() => void submit()}>
       儲存
      </Button>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
