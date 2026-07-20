import { useMemo, useState, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { formatClassLabel } from "@/lib/courseLabel"
import { cn } from "@/lib/utils"
import { statusToTagTone } from "@/lib/statusTag"
import { PAYMENT_STATUS } from "@/services/paymentQueries"
import type { PaymentDiscountRow } from "@/services/paymentDiscountQueries"
import type { ClassRecord } from "@/services/classQueries"
import type { EnrollmentWithClass } from "@/services/studentQueries"

export const DEFAULT_LESSON_COUNT = "4"
export const DEFAULT_TRIAL_LESSON_COUNT = "1"

/** 班別下拉中代表「試堂」模式的固定值（實際 classId 另選） */
export const TRIAL_SELECT_VALUE = "__trial__"

export const PENDING_PAYMENT_STATUSES = [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive] as const

export type PaymentLineKind = "enrollment" | "trial"
export type TrialPayType = "半價試堂" | "原價試堂"

export type LineRow = {
 key: string
 kind: PaymentLineKind
 classId: string
 lessons: string
 amount: string
 trialType: TrialPayType
}

export type ClassPriceInfo = {
 id: string
 label: string
 pricePerLesson: number | null
 subject: string
 courseCode: string | null
 courseName: string | null
 subjectCode: string | null
 teacherId: string | null
 dayOfWeek: string | null
 timeSlot: string | null
}

export function newLine(kind: PaymentLineKind = "enrollment"): LineRow {
 return {
  key: crypto.randomUUID(),
  kind,
  classId: "",
  lessons: kind === "trial" ? DEFAULT_TRIAL_LESSON_COUNT : DEFAULT_LESSON_COUNT,
  amount: "",
  trialType: "原價試堂",
 }
}

export function money(n: number) {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

export function discountOptionLabel(d: PaymentDiscountRow, resolvedAmountOff?: number) {
 const bits = [d.name]
 if (d.percentOff != null && d.percentOff > 0) bits.push(`-${d.percentOff}%`)
 const amt = resolvedAmountOff ?? d.amountOff
 if (amt != null && amt > 0) bits.push(`-$${amt}`)
 return bits.join(" ")
}

export function selectClassName() {
 return cn(
  "flex min-h-10 w-full min-w-0",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 )
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
 return (
  <div className="grid min-w-0 gap-1.5">
   <label className="text-sm font-medium text-foreground">{label}</label>
   {children}
  </div>
 )
}

export function SectionCard({
 title,
 description,
 children,
}: {
 title: string
 description?: string
 children: ReactNode
}) {
 return (
  <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
   <div>
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
   </div>
   {children}
  </section>
 )
}

export function statusBadge(status: string) {
 return (
  <Tag tone={statusToTagTone(status)} size="sm">
   {status}
  </Tag>
 )
}

export function enrollmentLabel(e: EnrollmentWithClass) {
 const bits = [e.subject, e.courseCode, e.dayOfWeek, e.timeSlot].filter(Boolean)
 return bits.join(" · ")
}

export function classRecordToPriceInfo(c: ClassRecord): ClassPriceInfo {
 const labelBits = [
  formatClassLabel({
   subject: c.subject,
   courseCode: c.course_code_full,
   courseName: c.course_name,
  }),
  c.day_of_week,
  c.time_slot,
 ].filter(Boolean)
 return {
  id: c.id,
  label: labelBits.join(" · "),
  pricePerLesson: c.price_per_lesson,
  subject: c.subject,
  courseCode: c.course_code_full,
  courseName: c.course_name ?? null,
  subjectCode: c.subject_code ?? null,
  teacherId: c.teacher_id,
  dayOfWeek: c.day_of_week,
  timeSlot: c.time_slot,
 }
}

export function lineAmountFor(
 classId: string,
 lessons: string,
 byClass: Map<string, EnrollmentWithClass>,
 options?: {
  kind?: PaymentLineKind
  trialType?: TrialPayType
  trialClasses?: Map<string, ClassPriceInfo>
 }
): string {
 const n = Number(lessons)
 if (!Number.isFinite(n) || n <= 0) return ""
 if (options?.kind === "trial") {
  const c = options.trialClasses?.get(classId)
  const base = c?.pricePerLesson
  if (!(base != null && base > 0)) return ""
  const unit = options.trialType === "半價試堂" ? base * 0.5 : base
  return String(Math.round(unit * n * 100) / 100)
 }
 const e = byClass.get(classId)
 if (!e?.pricePerLesson) return ""
 return String(Math.round(e.pricePerLesson * n * 100) / 100)
}

export function formatStudentPhone(s: {
 parent_phone?: string | null
 parent_phone_country_code?: string | null
 student_phone?: string | null
 student_phone_country_code?: string | null
}): string {
 const parent = s.parent_phone?.trim()
 const student = s.student_phone?.trim()
 const bits: string[] = []
 if (parent) {
  const cc = s.parent_phone_country_code?.trim()
  bits.push(`家長 ${cc ? `${cc} ` : ""}${parent}`)
 }
 if (student) {
  const cc = s.student_phone_country_code?.trim()
  bits.push(`學生 ${cc ? `${cc} ` : ""}${student}`)
 }
 return bits.length > 0 ? bits.join(" · ") : "—"
}

/** 試堂收費：搜尋選班別 */
export function TrialClassPicker({
 classes,
 value,
 onChange,
 disabled,
}: {
 classes: ClassPriceInfo[]
 value: string
 onChange: (classId: string) => void
 disabled?: boolean
}) {
 const [search, setSearch] = useState("")
 const [open, setOpen] = useState(false)
 const selected = classes.find((c) => c.id === value)

 const filtered = useMemo(() => {
  const q = search.trim().toLowerCase()
  if (!q) return classes.slice(0, 20)
  return classes.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 20)
 }, [classes, search])

 return (
  <div className="relative min-w-0">
   <Input
    disabled={disabled}
    placeholder="搜尋科目／課程代碼…"
    value={selected ? selected.label : search}
    onChange={(e) => {
     onChange("")
     setSearch(e.target.value)
     setOpen(true)
    }}
    onFocus={() => setOpen(true)}
    className="h-10"
   />
   {open && !selected && !disabled ? (
    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
     {filtered.length === 0 ? (
      <div className="px-3 py-2 text-sm text-muted-foreground">找不到班別</div>
     ) : (
      filtered.map((c) => (
       <button
        key={c.id}
        type="button"
        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
        onClick={() => {
         onChange(c.id)
         setSearch("")
         setOpen(false)
        }}
       >
        {c.label}
       </button>
      ))
     )}
    </div>
   ) : null}
   {selected ? (
    <button
     type="button"
     className="mt-1 text-left text-xs text-primary underline-offset-4 hover:underline"
     disabled={disabled}
     onClick={() => {
      onChange("")
      setSearch("")
      setOpen(true)
     }}
    >
     清除班別
    </button>
   ) : null}
  </div>
 )
}
