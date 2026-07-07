import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const tagVariants = cva(
 "inline-flex items-center rounded-xl px-3 py-1 text-sm font-medium",
 {
  variants: {
   tone: {
    default: "bg-neutral-200 text-neutral-700",
    info: "bg-info/20 text-info",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    error: "bg-destructive/20 text-destructive",
   },
   size: {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
   },
   /** 主色／深色底上的標籤：使用不透明淺底，避免半透明色塊與底色混色 */
   surface: {
    default: "",
    onPrimary: "",
   },
  },
  compoundVariants: [
   {
    surface: "onPrimary",
    tone: "default",
    class: "bg-neutral-200 text-neutral-700",
   },
   {
    surface: "onPrimary",
    tone: "success",
    class: "bg-neutral-200 text-success",
   },
   {
    surface: "onPrimary",
    tone: "info",
    class: "bg-neutral-200 text-info",
   },
   {
    surface: "onPrimary",
    tone: "warning",
    class: "bg-neutral-200 text-warning",
   },
   {
    surface: "onPrimary",
    tone: "error",
    class: "bg-neutral-200 text-destructive",
   },
  ],
  defaultVariants: {
   tone: "default",
   size: "md",
   surface: "default",
  },
 }
)

export type TagTone = NonNullable<VariantProps<typeof tagVariants>["tone"]>

type TagProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>

export function Tag({ className, tone, size, surface, ...props }: TagProps) {
 return <span className={cn(tagVariants({ tone, size, surface }), className)} {...props} />
}
