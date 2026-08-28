import * as React from "react"

import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion"

/** 全站分佈入場預設：單項 600ms、項間 90ms、最多延遲 ~12 項 */
export const STAGGER_DEFAULT_MS = 90
export const STAGGER_MAX_DELAY_MS = 1080

type StaggerContextValue = {
 index: number
 animate: boolean
 staggerMs: number
 maxDelayMs: number
}

const StaggerContext = React.createContext<StaggerContextValue | null>(null)

type StaggerListProps = {
 as?: React.ElementType
 staggerMs?: number
 maxDelayMs?: number
 animate?: boolean
 className?: string
 children?: React.ReactNode
}

function StaggerIndexProvider({
 index,
 animate,
 staggerMs,
 maxDelayMs,
 children,
}: {
 index: number
 animate: boolean
 staggerMs: number
 maxDelayMs: number
 children: React.ReactNode
}) {
 const value = React.useMemo(
  () => ({ index, animate, staggerMs, maxDelayMs }),
  [index, animate, staggerMs, maxDelayMs]
 )
 return <StaggerContext.Provider value={value}>{children}</StaggerContext.Provider>
}

export function StaggerList({
 as: Comp = "div",
 staggerMs = STAGGER_DEFAULT_MS,
 maxDelayMs = STAGGER_MAX_DELAY_MS,
 animate = true,
 className,
 children,
 ...props
}: StaggerListProps) {
 const reduced = usePrefersReducedMotion()
 const shouldAnimate = animate && !reduced
 const items = React.Children.toArray(children)

 return (
  <Comp className={className} {...props}>
   {items.map((child, index) => {
    if (!React.isValidElement(child)) return child
    return (
     <StaggerIndexProvider
      key={child.key ?? `stagger-${index}`}
      index={index}
      animate={shouldAnimate}
      staggerMs={staggerMs}
      maxDelayMs={maxDelayMs}
     >
      {child}
     </StaggerIndexProvider>
    )
   })}
  </Comp>
 )
}

/** `<tbody>` 列表 shorthand */
export function StaggerTableBody({ children, ...props }: Omit<StaggerListProps, "as">) {
 return (
  <StaggerList as="tbody" {...props}>
   {children}
  </StaggerList>
 )
}

/** 垂直卡片／堆疊列表 shorthand */
export function StaggerStack({ children, ...props }: Omit<StaggerListProps, "as">) {
 return (
  <StaggerList as="div" {...props}>
   {children}
  </StaggerList>
 )
}

/** 無序列表 shorthand */
export function StaggerUl({ children, ...props }: Omit<StaggerListProps, "as">) {
 return (
  <StaggerList as="ul" {...props}>
   {children}
  </StaggerList>
 )
}

type StaggerItemProps = {
 as?: React.ElementType
 className?: string
 style?: React.CSSProperties
 children: React.ReactNode
} & Record<string, unknown>

export function StaggerItem({
 as: Comp = "div",
 className,
 style,
 children,
 ...props
}: StaggerItemProps) {
 const ctx = React.useContext(StaggerContext)
 const shouldAnimate = ctx?.animate ?? false
 const delay = ctx ? Math.min(ctx.index * ctx.staggerMs, ctx.maxDelayMs) : 0

 return (
  <Comp
   className={cn(
    className,
    shouldAnimate && "motion-safe:animate-stagger-in motion-reduce:animate-none"
   )}
   style={{
    ...style,
    ...(shouldAnimate ? { animationDelay: `${delay}ms` } : null),
   }}
   {...props}
  >
   {children}
  </Comp>
 )
}

type StaggerRowsProps<T> = {
 items: readonly T[]
 keyFn: (item: T, index: number) => string
 itemAs?: React.ElementType
 className?: string
 staggerMs?: number
 maxDelayMs?: number
 listAs?: React.ElementType
 itemClassName?: string | ((item: T, index: number) => string | undefined)
 itemProps?: (item: T, index: number) => Record<string, unknown>
 render: (item: T, index: number) => React.ReactNode
}

/** 以 data 陣列快速包裝分佈入場（表格列預設 `listAs=tbody` + `itemAs=tr`） */
export function StaggerRows<T>({
 items,
 keyFn,
 itemAs,
 className,
 staggerMs,
 maxDelayMs,
 listAs = "tbody",
 itemClassName,
 itemProps,
 render,
}: StaggerRowsProps<T>) {
 const resolvedItemAs =
  itemAs ?? (listAs === "tbody" ? "tr" : listAs === "ul" ? "li" : "div")

 return (
  <StaggerList
   as={listAs}
   className={className}
   staggerMs={staggerMs}
   maxDelayMs={maxDelayMs}
  >
   {items.map((item, index) => (
    <StaggerItem
     key={keyFn(item, index)}
     as={resolvedItemAs}
     className={
      typeof itemClassName === "function" ? itemClassName(item, index) : itemClassName
     }
     {...(itemProps?.(item, index) ?? {})}
    >
     {render(item, index)}
    </StaggerItem>
   ))}
  </StaggerList>
 )
}
