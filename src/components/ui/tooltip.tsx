import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/** 須高於 Select／DateInput（z-320），否則表格／對話框內提示會被下拉蓋住 */
const TOOLTIP_Z = "z-[330]"

type TooltipPlacement =
 | "top"
 | "top-start"
 | "top-end"
 | "bottom"
 | "bottom-start"
 | "bottom-end"
 | "left"
 | "left-start"
 | "left-end"
 | "right"
 | "right-start"
 | "right-end"

type TooltipSide = "top" | "bottom" | "left" | "right"
type TooltipAlign = "start" | "center" | "end"

function parseTooltipPlacement(placement: TooltipPlacement): {
 side: TooltipSide
 align: TooltipAlign
} {
 const [sideRaw, alignRaw] = placement.split("-")
 const side = (sideRaw as TooltipSide) ?? "top"
 const align = (alignRaw as TooltipAlign | undefined) ?? "center"
 return { side, align }
}

type TooltipTriggerMode = "hover" | "focus"

type TooltipOptions = {
 trigger: TooltipTriggerMode
 shouldSkipAnimation: boolean
}

const TooltipOptionsContext = React.createContext<TooltipOptions>({
 trigger: "hover",
 shouldSkipAnimation: false,
})

const TooltipProvider = TooltipPrimitive.Provider

type TooltipRootProps = {
 children: React.ReactNode
 delay?: number
 closeDelay?: number
 trigger?: TooltipTriggerMode
 isDisabled?: boolean
 shouldSkipAnimation?: boolean
 open?: boolean
 defaultOpen?: boolean
 onOpenChange?: (open: boolean) => void
}

function isElementOfType(
 child: React.ReactNode,
 type: React.ElementType
): child is React.ReactElement {
 return React.isValidElement(child) && child.type === type
}

const TooltipTrigger = React.forwardRef<
 HTMLButtonElement,
 React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, asChild, children, onPointerMove, onPointerLeave, ...props }, ref) => {
 const { trigger } = React.useContext(TooltipOptionsContext)
 const focusOnly = trigger === "focus"
 const child = React.Children.count(children) === 1 ? React.Children.only(children) : children
 const resolvedAsChild =
  asChild ?? (React.isValidElement(child) && child.type !== React.Fragment)
 const triggerChild = resolvedAsChild && React.isValidElement(child) ? child : children

 return (
  <TooltipPrimitive.Trigger
   ref={ref}
   asChild={resolvedAsChild}
   className={cn("inline-flex", className)}
   onPointerMove={(event) => {
    if (focusOnly) event.preventDefault()
    onPointerMove?.(event)
   }}
   onPointerLeave={(event) => {
    if (focusOnly) event.preventDefault()
    onPointerLeave?.(event)
   }}
   {...props}
  >
   {triggerChild}
  </TooltipPrimitive.Trigger>
 )
})
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

const TooltipArrow = React.forwardRef<
 SVGSVGElement,
 React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
 <TooltipPrimitive.Arrow
  ref={ref}
  width={10}
  height={5}
  className={cn("fill-foreground", className)}
  {...props}
 />
))
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName

type TooltipContentProps = Omit<
 React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
 "side" | "align" | "sideOffset"
> & {
 showArrow?: boolean
 offset?: number
 placement?: TooltipPlacement
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
 (
  {
   className,
   children,
   showArrow = false,
   offset,
   placement = "top",
   ...props
  },
  ref
 ) => {
  const { shouldSkipAnimation } = React.useContext(TooltipOptionsContext)
  const { side, align } = parseTooltipPlacement(placement)
  const sideOffset = offset ?? (showArrow ? 7 : 3)
  const hasCustomArrow = React.Children.toArray(children).some((child) =>
   isElementOfType(child, TooltipArrow)
  )

  return (
   <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
     ref={ref}
     side={side}
     align={align}
     sideOffset={sideOffset}
     collisionPadding={8}
     className={cn(
      TOOLTIP_Z,
      "max-w-xs overflow-hidden rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md",
      !shouldSkipAnimation &&
       "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 motion-reduce:animate-none motion-reduce:data-[state=closed]:animate-none",
      className
     )}
     {...props}
    >
     {children}
     {showArrow && !hasCustomArrow ? <TooltipArrow /> : null}
    </TooltipPrimitive.Content>
   </TooltipPrimitive.Portal>
  )
 }
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

function TooltipRoot({
 children,
 delay = 700,
 closeDelay = 0,
 trigger = "hover",
 isDisabled = false,
 shouldSkipAnimation = false,
 open: openProp,
 defaultOpen,
 onOpenChange,
}: TooltipRootProps) {
 const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false)
 const closeTimerRef = React.useRef<number | null>(null)
 const isOpenControlled = openProp !== undefined
 const needsCloseDelay = closeDelay > 0 && !isOpenControlled
 const open = isDisabled ? false : isOpenControlled ? openProp : uncontrolledOpen

 React.useEffect(() => {
  return () => {
   if (closeTimerRef.current != null) window.clearTimeout(closeTimerRef.current)
  }
 }, [])

 const handleOpenChange = React.useCallback(
  (next: boolean) => {
   if (isDisabled) return
   if (closeTimerRef.current != null) {
    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
   }
   if (!next && needsCloseDelay) {
    closeTimerRef.current = window.setTimeout(() => {
     closeTimerRef.current = null
     setUncontrolledOpen(false)
     onOpenChange?.(false)
    }, closeDelay)
    return
   }
   if (!isOpenControlled) setUncontrolledOpen(next)
   onOpenChange?.(next)
  },
  [closeDelay, isDisabled, isOpenControlled, needsCloseDelay, onOpenChange]
 )

 const triggerNodes: React.ReactNode[] = []
 const contentNodes: React.ReactNode[] = []
 React.Children.forEach(children, (child) => {
  if (isElementOfType(child, TooltipContent)) {
   contentNodes.push(child)
   return
  }
  triggerNodes.push(child)
 })

 const triggerChild = (() => {
  if (triggerNodes.length === 1 && isElementOfType(triggerNodes[0], TooltipTrigger)) {
   return triggerNodes[0]
  }
  if (triggerNodes.length === 1 && React.isValidElement(triggerNodes[0])) {
   return <TooltipTrigger>{triggerNodes[0]}</TooltipTrigger>
  }
  return <TooltipTrigger>{triggerNodes}</TooltipTrigger>
 })()

 const options = React.useMemo<TooltipOptions>(
  () => ({ trigger, shouldSkipAnimation }),
  [trigger, shouldSkipAnimation]
 )

 const delayDuration = shouldSkipAnimation ? 0 : delay
 const rootProps =
  isDisabled || needsCloseDelay || isOpenControlled
   ? { open, onOpenChange: handleOpenChange, delayDuration }
   : { defaultOpen, onOpenChange, delayDuration }

 return (
  <TooltipOptionsContext.Provider value={options}>
   <TooltipPrimitive.Root {...rootProps}>{triggerChild}{contentNodes}</TooltipPrimitive.Root>
  </TooltipOptionsContext.Provider>
 )
}
TooltipRoot.displayName = "Tooltip"

type TooltipComponent = typeof TooltipRoot & {
 Trigger: typeof TooltipTrigger
 Content: typeof TooltipContent
 Arrow: typeof TooltipArrow
}

const Tooltip = TooltipRoot as TooltipComponent
Tooltip.Trigger = TooltipTrigger
Tooltip.Content = TooltipContent
Tooltip.Arrow = TooltipArrow

/** 有 hint 才包一層；用於停用按鈕（原生 title 在 disabled 上通常出不來）。 */
export function HintTooltip({
 hint,
 children,
 delay = 200,
 className,
}: {
 hint?: string | null
 children: React.ReactNode
 delay?: number
 className?: string
}) {
 if (!hint) return <>{children}</>
 return (
  <Tooltip delay={delay}>
   <span className={cn("inline-flex", className)}>{children}</span>
   <Tooltip.Content>{hint}</Tooltip.Content>
  </Tooltip>
 )
}

export {
 Tooltip,
 TooltipArrow,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
}
export type { TooltipContentProps, TooltipPlacement, TooltipRootProps }
