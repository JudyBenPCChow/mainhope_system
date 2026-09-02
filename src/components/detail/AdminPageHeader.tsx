import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type AdminPageEyebrow = "管理中心" | "工作域" | "行政工作" | "網站地圖"

type AdminPageHeaderProps = {
 eyebrow: AdminPageEyebrow
 title: ReactNode
 description: ReactNode
 titleExtra?: ReactNode
 actions?: ReactNode
 className?: string
}

export const adminPageHeaderLayoutClass =
 "flex min-h-[7.25rem] flex-col justify-end gap-4 sm:flex-row sm:items-end sm:justify-between"

type AdminPageHeadingProps = Pick<
 AdminPageHeaderProps,
 "eyebrow" | "title" | "description" | "titleExtra"
>

export function AdminPageHeading({
 eyebrow,
 title,
 description,
 titleExtra,
}: AdminPageHeadingProps) {
 return (
  <div className="min-w-0">
   <p className="mb-1 text-xs font-bold tracking-[0.06em] text-primary">{eyebrow}</p>
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <h1 className="text-[clamp(1.7rem,3vw,2.35rem)] font-bold leading-[1.2] tracking-[-0.035em] text-foreground">
     {title}
    </h1>
    {titleExtra}
   </div>
   <div className="mt-1.5 min-h-5 text-sm leading-5 text-muted-foreground">{description}</div>
  </div>
 )
}

/**
 * 行政頁標題：固定三行層級與最低高度，讓跨頁切換時內容起點保持穩定。
 * 操作按鈕沿標題底部對齊；手機可自然換行。
 */
export function AdminPageHeader({
 eyebrow,
 title,
 description,
 titleExtra,
 actions,
 className,
}: AdminPageHeaderProps) {
 return (
  <header
   className={cn(
    adminPageHeaderLayoutClass,
    className
   )}
   data-admin-page-header
  >
   <AdminPageHeading
    eyebrow={eyebrow}
    title={title}
    description={description}
    titleExtra={titleExtra}
   />
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
 )
}
