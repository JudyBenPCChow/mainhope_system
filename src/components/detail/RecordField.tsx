import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function ReadValue({ children }: { children: ReactNode }) {
 return (
  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
   {children == null || children === "" ? "—" : children}
  </div>
 )
}

type RecordFieldProps = {
 label: string
 children: ReactNode
 className?: string
 /** 有值時顯示唯讀；`undefined` 時顯示 `children`（編輯控件） */
 read?: ReactNode
}

/** 紀錄頁欄位：先讀後編。傳 `read` 則只顯示文字，不顯示表單控件。 */
export function RecordField({ label, children, className, read }: RecordFieldProps) {
 return (
  <div className={cn("space-y-1", className)}>
   <label className="text-xs font-medium text-muted-foreground">{label}</label>
   {read !== undefined ? <ReadValue>{read}</ReadValue> : children}
  </div>
 )
}
