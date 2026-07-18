import type { ReactNode } from "react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import { statusToTagTone } from "@/lib/statusTag"
import { PAYMENT_STATUS } from "@/services/paymentQueries"
import type { PaymentDiscountRow } from "@/services/paymentDiscountQueries"
import type { EnrollmentWithClass } from "@/services/studentQueries"

export const DEFAULT_LESSON_COUNT = "4"

export const PENDING_PAYMENT_STATUSES = [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive] as const

export type LineRow = {
 key: string
 classId: string
 lessons: string
 amount: string
}

export function newLine(): LineRow {
 return {
  key: crypto.randomUUID(),
  classId: "",
  lessons: DEFAULT_LESSON_COUNT,
  amount: "",
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

export function lineAmountFor(
 classId: string,
 lessons: string,
 byClass: Map<string, EnrollmentWithClass>
): string {
 const n = Number(lessons)
 const e = byClass.get(classId)
 if (!e?.pricePerLesson || !Number.isFinite(n) || n <= 0) return ""
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
