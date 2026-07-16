import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
 React.ElementRef<typeof TabsPrimitive.List>,
 React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
 <TabsPrimitive.List
  ref={ref}
  className={cn(
   "inline-flex h-10 max-w-full items-center justify-start gap-0.5 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 text-muted-foreground",
   "scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:thin]",
   className
  )}
  {...props}
 />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
 React.ElementRef<typeof TabsPrimitive.Trigger>,
 React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, title, ...props }, ref) => {
 const labelTitle =
  title ?? (typeof children === "string" || typeof children === "number" ? String(children) : undefined)

 return (
  <TabsPrimitive.Trigger
   ref={ref}
   title={labelTitle}
   className={cn(
    "inline-flex h-8 max-w-[14rem] shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium",
    "whitespace-nowrap transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "hover:bg-background/70 hover:text-foreground",
    "disabled:pointer-events-none disabled:opacity-50",
    "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
   )}
   {...props}
  >
   <span className="min-w-0 truncate">{children}</span>
  </TabsPrimitive.Trigger>
 )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
 React.ElementRef<typeof TabsPrimitive.Content>,
 React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
 <TabsPrimitive.Content
  ref={ref}
  className={cn(
   "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
   className
  )}
  {...props}
 />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
