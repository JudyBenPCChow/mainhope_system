import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { usesSharedAppShell, type MgmtRole } from "@/lib/mgmtRole"

export type AdminPageEyebrow = "主頁" | "今日" | "管理中心" | "工作域" | "行政工作" | "網站地圖"

type AdminPageHeaderProps = {
 eyebrow: AdminPageEyebrow
 title: ReactNode
 description: ReactNode
 titleExtra?: ReactNode
 /** 副標正下方（例如首頁儀表板捷徑），不影響右側操作列。 */
 afterDescription?: ReactNode
 actions?: ReactNode
 className?: string
}

export const adminPageHeaderLayoutClass =
 "flex flex-col justify-end gap-[1.125rem] sm:flex-row sm:items-end sm:justify-between"

/** 行政主欄／清單殼表面色（與沙盒 `--background` 對齊）。 */
export const adminPageSurfaceClass = "bg-[#f4f7fb]"

/**
 * 行政主欄內容區：對齊沙盒 `.content`
 * （寬度上限 1320、padding 28/30/48；窄屏左右 20）。
 * 寬屏不置中：左側自動留白為舊 `mx-auto` 的一半（(100%-1320px)/4），
 * 其餘空白留在右側，避免側欄收合後標題離側欄過遠。
 */
export const adminContentShellClass =
 "ml-[max(0px,calc((100%-1320px)/4))] mr-auto flex min-h-full w-full max-w-[1320px] flex-col px-5 pb-12 pt-7 sm:px-[1.875rem] has-[[data-sticky-list-shell]]:h-full has-[[data-sticky-list-shell]]:min-h-0 has-[[data-sticky-list-shell]]:overflow-hidden [&>*]:!px-0 [&>*]:!pt-0"

/**
 * 共用殼頁留白交由 Layout；未跟殼的角色保留既有頁級 padding。
 * `shellExtra` 可保留殼頁額外底部安全距（例如手機底欄）。
 */
export function pagePadClass(
 role: MgmtRole | null | undefined,
 nonShellPadClass: string,
 shellExtra = ""
): string {
 return usesSharedAppShell(role) ? shellExtra : nonShellPadClass
}

type AdminPageHeadingProps = Pick<
 AdminPageHeaderProps,
 "eyebrow" | "title" | "description" | "titleExtra" | "afterDescription"
>

export function AdminPageHeading({
 eyebrow,
 title,
 description,
 titleExtra,
 afterDescription,
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
   {afterDescription}
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
 afterDescription,
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
    afterDescription={afterDescription}
   />
   {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
 )
}
