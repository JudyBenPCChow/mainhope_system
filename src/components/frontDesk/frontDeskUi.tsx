import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Field({
 label,
 children,
 className,
}: {
 label: string
 children: ReactNode
 className?: string
}) {
 return (
  <label className={cn("block space-y-1.5", className)}>
   <span className="text-sm font-medium text-foreground">{label}</span>
   {children}
  </label>
 )
}

export function localTodayYmd(d = new Date()): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export const STEP_LABELS = ["新生登記", "報讀／試堂", "收款／出單", "登記請假"] as const

export type WizardStep = 1 | 2 | 3 | 4

export type WizardSummary = {
 enrolledCount: number
 trialCount: number
 paymentStatus: "done" | "skipped" | "none"
 leaveCount: number
}
