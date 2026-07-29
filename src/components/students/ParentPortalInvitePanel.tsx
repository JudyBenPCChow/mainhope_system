import { useCallback, useEffect, useState } from "react"
import { Check, Copy, Link2, MessageCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { isMgmtStaff } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isPortalBaseUrlConfigured } from "@/lib/portalConfig"
import { cn } from "@/lib/utils"
import {
 openPrimaryMessagingTarget,
 resolvePrimaryMessagingTarget,
} from "@/lib/whatsappReminder"
import {
 buildPortalInviteWhatsAppMessage,
 createPortalInviteForStudent,
 fetchPortalBindingForStudent,
 fetchPortalInvitesForStudent,
 inferBoundEmailFromInvites,
 type PortalInviteRow,
} from "@/services/portalInviteQueries"

type Props = {
 studentId: string
 studentName: string
 parentPhone?: string | null
 studentPhone?: string | null
 primaryContactPerson?: string | null
 studentPreferredContactMethod?: string | null
 parentPreferredContactMethod?: string | null
 studentWechatId?: string | null
 parentWechatId?: string | null
 studentPhoneCountryCode?: string | null
 parentPhoneCountryCode?: string | null
}

function formatWhen(iso: string): string {
 try {
  return new Date(iso).toLocaleString("zh-Hant", {
   year: "numeric",
   month: "2-digit",
   day: "2-digit",
   hour: "2-digit",
   minute: "2-digit",
   hour12: false,
  })
 } catch {
  return iso
 }
}

export function ParentPortalInvitePanel({
 studentId,
 studentName,
 parentPhone,
 studentPhone,
 primaryContactPerson,
 studentPreferredContactMethod,
 parentPreferredContactMethod,
 studentWechatId,
 parentWechatId,
 studentPhoneCountryCode,
 parentPhoneCountryCode,
}: Props) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const canManage = isMgmtStaff()

 const [loading, setLoading] = useState(true)
 const [creating, setCreating] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [invites, setInvites] = useState<PortalInviteRow[]>([])
 const [boundEmail, setBoundEmail] = useState<string | null>(null)
 const [copiedId, setCopiedId] = useState<string | null>(null)

 const messaging = resolvePrimaryMessagingTarget({
  parent_phone: parentPhone,
  student_phone: studentPhone,
  primary_contact_person: primaryContactPerson,
  student_preferred_contact_method: studentPreferredContactMethod,
  parent_preferred_contact_method: parentPreferredContactMethod,
  student_wechat_id: studentWechatId,
  parent_wechat_id: parentWechatId,
  student_phone_country_code: studentPhoneCountryCode,
  parent_phone_country_code: parentPhoneCountryCode,
 })
 const canMessage =
  messaging?.channel === "WeChat"
   ? Boolean(messaging.wechatId?.trim())
   : Boolean(messaging?.phone?.trim())

 const load = useCallback(async () => {
  if (!canManage) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [list, binding] = await Promise.all([
    fetchPortalInvitesForStudent(studentId),
    fetchPortalBindingForStudent(studentId),
   ])
   setInvites(list)
   setBoundEmail(binding?.email ?? inferBoundEmailFromInvites(list))
  } catch (e) {
   reportUserFacingError(e, {
    source: "ParentPortalInvitePanel.load",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setLoading(false)
  }
 }, [canManage, studentId])

 useEffect(() => {
  void load()
 }, [load])

 const activeInvite = invites.find((i) => i.isActive) ?? null

 const onCreate = async () => {
  if (!canManage || creating) return

  if (activeInvite) {
   const ok = await confirmDialog({
    title: "重新產生邀請連結？",
    description:
     "舊的未使用連結將立即失效。請確認家長尚未開啟舊連結，或以新連結為準。",
    confirmText: "產生新連結",
    cancelText: "取消",
    tone: "warning",
   })
   if (!ok) return
  } else if (boundEmail) {
   const ok = await confirmDialog({
    title: "此學生已開通 Portal",
    description: `目前綁定電郵為 ${boundEmail}。產生新連結後，家長若以其他電郵啟用，可能覆蓋現有綁定。確定繼續？`,
    confirmText: "仍要產生",
    cancelText: "取消",
    tone: "warning",
   })
   if (!ok) return
  }

  setCreating(true)
  setErr(null)
  try {
   const created = await createPortalInviteForStudent(studentId)
   setInvites((prev) => [
    created,
    ...prev.map((i) =>
     i.isActive ? { ...i, isActive: false, expiresAt: new Date().toISOString() } : i
    ),
   ])
   pushBanner({
    tone: "success",
    title: "已產生家長邀請連結",
    message: "可複製連結或以 WhatsApp 傳送給家長。",
   })
  } catch (e) {
   reportUserFacingError(e, {
    source: "ParentPortalInvitePanel.onCreate",
    setErr,
    userMessage: formatUnknownError(e),
   })
  } finally {
   setCreating(false)
  }
 }

 const onCopy = async (invite: PortalInviteRow) => {
  if (!invite.activateUrl) {
   pushBanner({
    tone: "warning",
    title: "尚未設定家長 Portal 網域",
    message: "請在 .env 設定 VITE_PORTAL_BASE_URL 後重新整理。",
   })
   return
  }
  try {
   await navigator.clipboard.writeText(invite.activateUrl)
   setCopiedId(invite.id)
   pushBanner({ tone: "success", title: "已複製連結" })
   window.setTimeout(() => setCopiedId((id) => (id === invite.id ? null : id)), 2000)
  } catch (e) {
   reportUserFacingError(e, {
    source: "ParentPortalInvitePanel.onCopy",
    setErr,
    userMessage: "無法複製到剪貼簿，請手動選取連結。",
   })
  }
 }

 const onWhatsApp = (invite: PortalInviteRow) => {
  if (!invite.activateUrl) {
   pushBanner({
    tone: "warning",
    title: "尚未設定家長 Portal 網域",
    message: "請在 .env 設定 VITE_PORTAL_BASE_URL 後重新整理。",
   })
   return
  }
  if (!canMessage || !messaging) {
   pushBanner({
    tone: "warning",
    title: "沒有可用的第一聯絡人通訊",
    message: "請先設定第一聯絡人電話，或 WeChat ID（若偏好 WeChat）。",
   })
   return
  }
  const msg = buildPortalInviteWhatsAppMessage({
   studentName,
   activateUrl: invite.activateUrl,
   expiresAt: invite.expiresAt,
  })
  void openPrimaryMessagingTarget(messaging, msg).then((result) => {
   if (result === "wechat") {
    pushBanner({
     tone: "success",
     title: "已複製 WeChat ID",
     message: messaging.wechatId ?? "",
    })
    void navigator.clipboard.writeText(msg).catch(() => undefined)
   } else if (!result) {
    pushBanner({
     tone: "warning",
     title: "無法開啟通訊",
     message: "請檢查第一聯絡人電話／WeChat ID 後再試。",
    })
   }
  })
 }

 if (!canManage) return null

 return (
  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4 sm:col-span-2">
   <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Link2 className="h-4 w-4 shrink-0" aria-hidden />
      家長 Portal 邀請
     </h3>
     <p className="mt-1 text-sm text-muted-foreground">
      產生連結後，可複製或以 WhatsApp 傳給家長開通查閱系統。
     </p>
    </div>
    <Button
     type="button"
     size="sm"
     className="shrink-0"
     disabled={creating || loading}
     onClick={() => void onCreate()}
    >
     <RefreshCw className={cn("h-4 w-4", creating && "animate-spin")} aria-hidden />
     {creating ? "產生中…" : activeInvite ? "重新產生連結" : "產生邀請連結"}
    </Button>
   </div>

   {!isPortalBaseUrlConfigured() ? (
    <p
     role="status"
     className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
     尚未設定 <code className="rounded bg-muted px-1 font-mono text-xs">VITE_PORTAL_BASE_URL</code>
     ，無法組成完整連結。請於行政系統 <code className="rounded bg-muted px-1 font-mono text-xs">.env</code>{" "}
     填入家長 Portal 網域後重開開發伺服器。
    </p>
   ) : null}

   {boundEmail ? (
    <p className="text-sm text-foreground">
     狀態：
     <Tag tone="success" className="ml-2 align-middle">
      已開通
     </Tag>
     <span className="ml-2 text-muted-foreground">{boundEmail}</span>
    </p>
   ) : (
    <p className="text-sm text-muted-foreground">
     狀態：
     <Tag tone="default" className="ml-2 align-middle">
      未開通
     </Tag>
    </p>
   )}

   {err ? (
    <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </p>
   ) : null}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入邀請紀錄…</p>
   ) : activeInvite ? (
    <div className="space-y-2 rounded-md border border-border bg-card px-3 py-3">
     <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Tag tone="info">有效連結</Tag>
      <span>有效至 {formatWhen(activeInvite.expiresAt)}</span>
     </div>
     <p className="break-all font-mono text-xs text-foreground">
      {activeInvite.activateUrl ?? `（缺網域）token=${activeInvite.token}`}
     </p>
     <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => void onCopy(activeInvite)}>
       {copiedId === activeInvite.id ? (
        <Check className="h-4 w-4 text-success" aria-hidden />
       ) : (
        <Copy className="h-4 w-4" aria-hidden />
       )}
       {copiedId === activeInvite.id ? "已複製" : "複製連結"}
      </Button>
      <Button
       type="button"
       size="sm"
       variant="outline"
       className={
        messaging?.channel === "WeChat"
         ? "border-sky-500/40 text-sky-700 hover:bg-sky-600 hover:text-white"
         : "border-success/40 text-success hover:bg-success"
       }
       disabled={!canMessage}
       title={
        canMessage
         ? messaging?.channel === "WeChat"
           ? "複製第一聯絡人 WeChat ID（並嘗試複製邀請文案）"
           : "開啟 WhatsApp（已預填邀請文字，請自行確認後發送）"
         : "請先設定第一聯絡人電話或 WeChat ID"
       }
       onClick={() => onWhatsApp(activeInvite)}
      >
       <MessageCircle className="h-4 w-4" aria-hidden />
       {messaging?.channel === "WeChat" ? "WeChat 傳送" : "WhatsApp 傳送"}
      </Button>
     </div>
    </div>
   ) : (
    <p className="text-sm text-muted-foreground">尚無有效邀請連結，請按上方按鈕產生。</p>
   )}

   {invites.some((i) => !i.isActive) ? (
    <details className="text-sm">
     <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
      歷史邀請（{invites.filter((i) => !i.isActive).length}）
     </summary>
     <ul className="mt-2 space-y-2">
      {invites
       .filter((i) => !i.isActive)
       .slice(0, 5)
       .map((i) => (
        <li
         key={i.id}
         className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
        >
         <div className="flex flex-wrap items-center gap-2">
          {i.usedAt ? (
           <Tag tone="success">已使用</Tag>
          ) : (
           <Tag tone="default">已失效</Tag>
          )}
          <span>建立於 {formatWhen(i.createdAt)}</span>
         </div>
         {i.usedByEmail ? (
          <p className="mt-1">啟用電郵：{i.usedByEmail}</p>
         ) : null}
        </li>
       ))}
     </ul>
    </details>
   ) : null}
  </div>
 )
}
