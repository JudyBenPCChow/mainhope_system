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
  },
  defaultVariants: {
   tone: "default",
   size: "md",
  },
 }
)

export type TagTone = NonNullable<VariantProps<typeof tagVariants>["tone"]>

type TagProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagVariants>

export function Tag({ className, tone, size, ...props }: TagProps) {
 return <span className={cn(tagVariants({ tone, size }), className)} {...props} />
}
