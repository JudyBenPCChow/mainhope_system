import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:stroke-[1.9]",
 {
  variants: {
   variant: {
    default:
     "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    destructive:
     "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    success:
     "bg-success text-success-foreground shadow-sm hover:bg-success/90",
    info:
     "bg-info text-info-foreground shadow-sm hover:bg-info/90",
    warning:
     "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
    outline:
     "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    secondary:
     "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
   },
   size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-10 w-10",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "default",
  },
 }
)

function defaultLoadingText(children: React.ReactNode): string {
 if (typeof children === "string") {
  if (children.endsWith("…")) return children
  if (children.endsWith("登入")) return "登入中…"
  if (children.endsWith("儲存")) return "儲存中…"
  if (children.endsWith("提交")) return "提交中…"
  if (children.endsWith("建立")) return "建立中…"
  if (children.endsWith("下載")) return "下載中…"
  if (children.endsWith("重試")) return "重試中…"
  return "處理中…"
 }
 return "處理中…"
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
 VariantProps<typeof buttonVariants> & {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  loadingIcon?: React.ReactNode
 }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 (
  {
   className,
   variant,
   size,
   asChild = false,
   loading = false,
   loadingText,
   loadingIcon,
   disabled,
   children,
   ...props
  },
  ref
 ) => {
  const Comp = asChild ? Slot : "button"
  const isDisabled = disabled || loading
  const resolvedLoadingText = loadingText ?? defaultLoadingText(children)
  const showSpinner = loading
  const isIconOnly = size === "icon"

  const content = (
   <>
    {showSpinner ? (
     <span className="inline-flex shrink-0 items-center justify-center transition-opacity duration-150">
      {loadingIcon ?? <Loader2 className="animate-spin" aria-hidden />}
     </span>
    ) : null}
    {!isIconOnly ? (
     <span
      className={cn(
       "inline-flex min-w-[2.5rem] items-center justify-center transition-opacity duration-150",
       showSpinner && "opacity-90"
      )}
     >
      {loading ? resolvedLoadingText : children}
     </span>
    ) : null}
   </>
  )

  return (
   <Comp
    className={cn(buttonVariants({ variant, size }), className)}
    ref={ref}
    disabled={isDisabled}
    aria-busy={loading || undefined}
    {...props}
   >
    {asChild ? children : content}
   </Comp>
  )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
