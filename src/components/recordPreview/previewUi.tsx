import type { LucideIcon } from "lucide-react"
import { Loader2, MessageCircle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { useAppBanner } from "@/lib/appBanner"
import { cn } from "@/lib/utils"
import {
 openPrimaryMessagingTarget,
 type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"

export function PreviewLoading() {
 return (
  <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
   <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
   載入預覽…
  </p>
 )
}

export function PreviewError({ message }: { message: string }) {
 return (
  <p className="text-sm text-destructive" role="alert">
   {message}
  </p>
 )
}

export function PreviewStudentSkeleton() {
 return (
  <div aria-busy="true" aria-label="載入預覽">
   <div className="h-20 bg-gradient-to-b from-primary/20 to-primary/5" />
   <div className="-mt-12 flex flex-col items-center px-4 pb-4">
    <Skeleton className="h-24 w-24 rounded-full" />
    <Skeleton className="mt-3 h-5 w-24 rounded-xl" />
    <Skeleton className="mt-2 h-7 w-36" />
    <Skeleton className="mt-2 h-3 w-28" />
    <div className="mt-2 flex gap-1.5">
     <Skeleton className="h-5 w-12 rounded-xl" />
     <Skeleton className="h-5 w-12 rounded-xl" />
     <Skeleton className="h-5 w-14 rounded-xl" />
    </div>
   </div>
   <div className="space-y-3 px-3 pb-3">
    <div className="grid grid-cols-3 gap-2">
     <Skeleton className="h-14 rounded-xl" />
     <Skeleton className="h-14 rounded-xl" />
     <Skeleton className="h-14 rounded-xl" />
    </div>
    <Skeleton className="h-28 rounded-xl" />
    <Skeleton className="h-24 rounded-xl" />
    <Skeleton className="h-32 rounded-xl" />
   </div>
  </div>
 )
}

export function PreviewClassSkeleton() {
 return (
  <div aria-busy="true" aria-label="載入預覽">
   <div className="h-20 bg-gradient-to-b from-primary/20 to-primary/5" />
   <div className="-mt-10 flex flex-col items-center px-4 pb-4">
    <Skeleton className="h-20 w-20 rounded-2xl" />
    <Skeleton className="mt-3 h-5 w-28 rounded-xl" />
    <Skeleton className="mt-2 h-7 w-40" />
    <div className="mt-2 flex gap-1.5">
     <Skeleton className="h-5 w-14 rounded-xl" />
     <Skeleton className="h-5 w-12 rounded-xl" />
    </div>
   </div>
   <div className="space-y-3 px-3 pb-3">
    <div className="grid grid-cols-2 gap-2">
     <Skeleton className="h-14 rounded-xl" />
     <Skeleton className="h-14 rounded-xl" />
    </div>
    <Skeleton className="h-36 rounded-xl" />
    <Skeleton className="h-28 rounded-xl" />
   </div>
  </div>
 )
}

export function PreviewCell({ label, children }: { label: string; children: React.ReactNode }) {
 return (
  <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-2">
   <span className="block text-[11px] text-muted-foreground">{label}</span>
   <span className="block truncate">{children}</span>
  </div>
 )
}

export function PreviewSection({
 title,
 icon: Icon,
 children,
}: {
 title: string
 icon?: LucideIcon
 children: React.ReactNode
}) {
 return (
  <section className="rounded-xl border border-border bg-card p-3">
   <h3 className="flex items-center gap-1.5 text-xs font-semibold">
    {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
    {title}
   </h3>
   <div className="mt-2">{children}</div>
  </section>
 )
}

export function PreviewPropertyRow({
 icon: Icon,
 label,
 children,
 action,
}: {
 icon?: LucideIcon
 label: string
 children: React.ReactNode
 action?: React.ReactNode
}) {
 return (
  <div className="flex items-center gap-2 border-b border-border/70 py-2 last:border-b-0 last:pb-0 first:pt-0">
   {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden /> : null}
   <span className="w-[4.75rem] shrink-0 text-[11px] text-muted-foreground">{label}</span>
   <span className="min-w-0 flex-1 truncate text-sm">{children}</span>
   {action}
  </div>
 )
}

export function PreviewStat({
 label,
 value,
 tone = "default",
}: {
 label: string
 value: React.ReactNode
 tone?: "default" | "info" | "warning"
}) {
 return (
  <div
   className={cn(
    "rounded-xl border px-2 py-2 text-center",
    tone === "warning" && "border-warning/40 bg-warning/10",
    tone === "info" && "border-info/30 bg-info/10",
    tone === "default" && "border-border bg-muted/30"
   )}
  >
   <p
    className={cn(
     "text-lg font-semibold tabular-nums leading-tight",
     tone === "warning" && "text-warning",
     tone === "info" && "text-info"
    )}
   >
    {value}
   </p>
   <p className={cn("mt-0.5 text-[11px]", tone === "warning" ? "text-warning" : "text-muted-foreground")}>
    {label}
   </p>
  </div>
 )
}

export function PhoneRow({
 label,
 value,
 action,
}: {
 label: string
 value: string | null
 action?: React.ReactNode
}) {
 return (
  <div className="flex items-center gap-1.5 text-xs">
   <span className="text-muted-foreground">{label}</span>
   <span className="font-mono tabular-nums">{value ?? "—"}</span>
   {action}
  </div>
 )
}

export function PreviewMessageButton({
 messaging,
}: {
 messaging: PrimaryMessagingTarget
}) {
 const { pushBanner } = useAppBanner()
 const isWeChat = messaging.channel === "WeChat"
 return (
  <button
   type="button"
   className={cn(
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
    isWeChat
     ? "text-sky-700 hover:bg-sky-600 hover:text-white"
     : "text-success hover:bg-success hover:text-success-foreground"
   )}
   title={isWeChat ? "複製 WeChat ID" : "開啟 WhatsApp"}
   aria-label={isWeChat ? "複製 WeChat ID" : "開啟 WhatsApp"}
   onClick={() => {
    void openPrimaryMessagingTarget(messaging).then((result) => {
     if (result === "wechat") {
      pushBanner({ tone: "success", title: "已複製 WeChat ID", message: messaging.wechatId ?? "" })
     }
    })
   }}
  >
   <MessageCircle className="h-4 w-4" aria-hidden />
  </button>
 )
}
