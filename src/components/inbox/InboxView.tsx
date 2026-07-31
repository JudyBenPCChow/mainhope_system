import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCheck, Inbox, RefreshCw, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { getMgmtRole, type MgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchInboxFeed,
 formatInboxAudienceLabel,
 markAllInboxItemsRead,
 markInboxItemRead,
 publishSystemNotice,
 type InboxEventCategory,
 type InboxItem,
 type InboxTypeFilter,
} from "@/services/inboxQueries"

const OPS_TYPE_FILTER_OPTIONS: { value: InboxTypeFilter; label: string }[] = [
 { value: "", label: "全部類型" },
 { value: "schedule_created", label: "排程新增" },
 { value: "schedule_updated", label: "排程變動" },
 { value: "schedule_cancelled", label: "排程取消" },
 { value: "schedule_substitute", label: "代堂" },
 { value: "class_updated", label: "班別變動" },
 { value: "class_teacher_changed", label: "主責變更" },
 { value: "enrollment_enroll", label: "新增報讀" },
 { value: "enrollment_withdraw", label: "學生退讀" },
 { value: "enrollment_period_change", label: "報讀形式" },
 { value: "enrollment_session_change", label: "選堂變更" },
 { value: "leave_created", label: "學生請假" },
 { value: "attendance_reminder", label: "提醒點名" },
]

const AUDIENCE_ROLE_OPTIONS: { value: MgmtRole; label: string }[] = [
 { value: "admin", label: "行政" },
 { value: "manager", label: "管理層" },
 { value: "alien", label: "外星人" },
 { value: "teacher", label: "老師" },
]

function formatWhen(iso: string): string {
 const s = iso.trim()
 if (!s) return "—"
 const d = s.slice(0, 10)
 const t = s.length >= 16 ? s.slice(11, 16) : ""
 return t ? `${d} ${t}` : d
}

function matchesTypeFilter(item: InboxItem, filter: InboxTypeFilter): boolean {
 if (!filter) return true
 if (filter === "class_updated") {
  return item.type === "class_updated" || item.type === "class_teacher_changed"
 }
 return item.type === filter
}

function tabClass(on: boolean) {
 return cn(
  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
  on
   ? "border-teal-600/40 bg-teal-600/15 text-teal-800 dark:text-teal-200"
   : "border-border bg-background text-muted-foreground hover:bg-muted/60"
 )
}

export function InboxView() {
 const navigate = useNavigate()
 const { pushBanner } = useAppBanner()
 const role = getMgmtRole()
 const canPublish = role === "alien"
 /** 行政／管理層預設看系統更新；老師／外星人仍預設營運通知 */
 const preferSystemFirst = role === "admin" || role === "manager"

 const [category, setCategory] = useState<InboxEventCategory>(
  preferSystemFirst ? "system" : "ops"
 )
 const [items, setItems] = useState<InboxItem[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [typeFilter, setTypeFilter] = useState<InboxTypeFilter>("")
 const [unreadOnly, setUnreadOnly] = useState(false)
 const [busyKey, setBusyKey] = useState<string | null>(null)
 const [detailKey, setDetailKey] = useState<string | null>(null)

 const [publishTitle, setPublishTitle] = useState("")
 const [publishBody, setPublishBody] = useState("")
 const [publishPath, setPublishPath] = useState("")
 const [audienceMode, setAudienceMode] = useState<"all" | "roles">("all")
 const [audienceRoles, setAudienceRoles] = useState<MgmtRole[]>(["admin", "manager", "alien"])
 const [publishing, setPublishing] = useState(false)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setItems([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const data = await fetchInboxFeed({ category, unreadOnly })
   setItems(data)
  } catch (e) {
   reportUserFacingError(e, { source: "InboxView.load", setErr })
   setItems([])
  } finally {
   setLoading(false)
  }
 }, [category, unreadOnly])

 useEffect(() => {
  void load()
 }, [load])

 const visible = useMemo(
  () => (category === "ops" ? items.filter((i) => matchesTypeFilter(i, typeFilter)) : items),
  [items, category, typeFilter]
 )

 const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])

 const detailItem = useMemo(
  () => (detailKey ? items.find((i) => i.sourceKey === detailKey) ?? null : null),
  [detailKey, items]
 )

 const openDetail = async (item: InboxItem) => {
  setBusyKey(item.sourceKey)
  setErr(null)
  try {
   if (!item.read) {
    await markInboxItemRead(item.sourceKey, item.eventId)
    setItems((prev) =>
     prev.map((x) => (x.sourceKey === item.sourceKey ? { ...x, read: true } : x))
    )
   }
   setDetailKey(item.sourceKey)
  } catch (e) {
   reportUserFacingError(e, {
    source: "InboxView.openDetail",
    setErr,
    userMessage: "開啟詳情失敗",
   })
  } finally {
   setBusyKey(null)
  }
 }

 const markAll = async () => {
  setBusyKey("__all__")
  setErr(null)
  try {
   await markAllInboxItemsRead(visible)
   setItems((prev) =>
    prev.map((x) =>
     visible.some((v) => v.sourceKey === x.sourceKey) ? { ...x, read: true } : x
    )
   )
   pushBanner({ tone: "success", title: "已全部標記為已讀" })
  } catch (e) {
   reportUserFacingError(e, {
    source: "InboxView.markAll",
    setErr,
    userMessage: "標記已讀失敗",
   })
  } finally {
   setBusyKey(null)
  }
 }

 const toggleAudienceRole = (r: MgmtRole) => {
  setAudienceRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
 }

 const publish = async () => {
  setPublishing(true)
  setErr(null)
  try {
   await publishSystemNotice({
    title: publishTitle,
    body: publishBody,
    actionPath: publishPath,
    audience: audienceMode === "all" ? "all" : audienceRoles,
   })
   setPublishTitle("")
   setPublishBody("")
   setPublishPath("")
   setAudienceMode("all")
   setAudienceRoles(["admin", "manager", "alien"])
   setCategory("system")
   setDetailKey(null)
   pushBanner({ tone: "success", title: "已發佈系統通知" })
   const data = await fetchInboxFeed({ category: "system", unreadOnly })
   setItems(data)
  } catch (e) {
   reportUserFacingError(e, {
    source: "InboxView.publish",
    setErr,
    userMessage: e instanceof Error ? e.message : "發佈失敗",
   })
  } finally {
   setPublishing(false)
  }
 }

 if (detailItem) {
  return (
   <div className="space-y-6 md:p-6">
    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" size="sm" onClick={() => setDetailKey(null)}>
      <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
      返回列表
     </Button>
    </div>

    {err ? (
     <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
     >
      {err}
     </p>
    ) : null}

    <article className="space-y-4 rounded-lg border border-border p-4 sm:p-6">
     <div className="flex flex-wrap items-center gap-2">
      <Tag tone={statusToTagTone(detailItem.statusLabel)}>{detailItem.statusLabel}</Tag>
      <Tag tone="info">{detailItem.category === "system" ? "系統通知" : "營運通知"}</Tag>
      <Tag tone="success">已讀</Tag>
     </div>
     <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{detailItem.title}</h1>
     <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
      <div>
       <dt className="inline">時間：</dt>
       <dd className="inline">{formatWhen(detailItem.createdAt)}</dd>
      </div>
      {detailItem.category === "system" ? (
       <div>
        <dt className="inline">可見對象：</dt>
        <dd className="inline">{formatInboxAudienceLabel(detailItem.audienceRoles)}</dd>
       </div>
      ) : null}
     </dl>
     <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {detailItem.body?.trim() || "（無詳細內容）"}
     </div>
     {detailItem.actionPath ? (
      <div className="border-t border-border pt-4">
       <Button type="button" size="sm" onClick={() => navigate(detailItem.actionPath!)}>
        前往相關頁面
       </Button>
      </div>
     ) : null}
    </article>
   </div>
  )
 }

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Inbox className="h-8 w-8 text-teal-600" aria-hidden />
      收件匣
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      營運通知彙整排程／班別、增退讀、請假與點名；系統通知為功能更新。
      {unreadCount > 0 ? ` 本分頁未讀 ${unreadCount} 則。` : ""}
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void markAll()}
      disabled={loading || busyKey != null || visible.every((i) => i.read)}
     >
      <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
      全部已讀
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void load()}
      disabled={loading}
     >
      <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} aria-hidden />
      重新整理
     </Button>
    </div>
   </header>

   <div className="flex flex-wrap gap-2" role="tablist" aria-label="通知分類">
    {(preferSystemFirst
     ? (["system", "ops"] as const)
     : (["ops", "system"] as const)
    ).map((tab) => (
     <button
      key={tab}
      type="button"
      role="tab"
      aria-selected={category === tab}
      className={tabClass(category === tab)}
      onClick={() => {
       setCategory(tab)
       setDetailKey(null)
      }}
     >
      {tab === "system" ? "系統通知" : "營運通知"}
     </button>
    ))}
   </div>

   <div className="flex flex-wrap items-end gap-3">
    {category === "ops" ? (
     <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">類型</span>
      <Select
       value={typeFilter}
       onChange={(e) => setTypeFilter(e.target.value as InboxTypeFilter)}
       className="min-w-[10rem]"
      >
       {OPS_TYPE_FILTER_OPTIONS.map((o) => (
        <option key={o.value || "all"} value={o.value}>
         {o.label}
        </option>
       ))}
      </Select>
     </label>
    ) : null}
    <label className="flex items-center gap-2 pb-2 text-sm">
     <input
      type="checkbox"
      checked={unreadOnly}
      onChange={(e) => setUnreadOnly(e.target.checked)}
      className="h-4 w-4 rounded border-input"
     />
     只看未讀
    </label>
   </div>

   {category === "system" && canPublish ? (
    <section className="space-y-3 rounded-lg border border-border p-4">
     <h2 className="text-sm font-semibold">發佈系統通知</h2>
     <div className="grid gap-3">
      <label className="space-y-1 text-sm">
       <span className="text-muted-foreground">標題 *</span>
       <Input
        value={publishTitle}
        onChange={(e) => setPublishTitle(e.target.value)}
        placeholder="例如：繳費方式選項已更新"
       />
      </label>
      <label className="space-y-1 text-sm">
       <span className="text-muted-foreground">內容</span>
       <Textarea
        value={publishBody}
        onChange={(e) => setPublishBody(e.target.value)}
        placeholder="詳述變更重點、影響範圍與操作提示…"
        className="min-h-[10rem]"
        rows={8}
       />
      </label>
      <fieldset className="space-y-2">
       <legend className="text-sm text-muted-foreground">誰看得到 *</legend>
       <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
         <input
          type="radio"
          name="audience-mode"
          checked={audienceMode === "all"}
          onChange={() => setAudienceMode("all")}
          className="h-4 w-4 border-input"
         />
         全部人
        </label>
        <label className="flex items-center gap-2">
         <input
          type="radio"
          name="audience-mode"
          checked={audienceMode === "roles"}
          onChange={() => setAudienceMode("roles")}
          className="h-4 w-4 border-input"
         />
         指定角色
        </label>
       </div>
       {audienceMode === "roles" ? (
        <div className="flex flex-wrap gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
         {AUDIENCE_ROLE_OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2">
           <input
            type="checkbox"
            checked={audienceRoles.includes(o.value)}
            onChange={() => toggleAudienceRole(o.value)}
            className="h-4 w-4 rounded border-input"
           />
           {o.label}
          </label>
         ))}
        </div>
       ) : null}
      </fieldset>
      <label className="space-y-1 text-sm">
       <span className="text-muted-foreground">相關路徑（選填）</span>
       <Input
        value={publishPath}
        onChange={(e) => setPublishPath(e.target.value)}
        placeholder="/Payments"
       />
      </label>
     </div>
     <Button type="button" size="sm" onClick={() => void publish()} disabled={publishing}>
      <Send className="mr-1.5 h-4 w-4" aria-hidden />
      {publishing ? "發佈中…" : "發佈"}
     </Button>
    </section>
   ) : null}

   {category === "system" && role === "admin" ? (
    <p className="text-xs text-muted-foreground">系統通知由外星人發佈；行政可閱讀與標記已讀。</p>
   ) : null}

   {err ? (
    <p
     role="alert"
     className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
     {err}
    </p>
   ) : null}

   {!isSupabaseConfigured ? (
    <p className="text-sm text-muted-foreground">尚未設定 Supabase，無法載入收件匣。</p>
   ) : loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : visible.length === 0 ? (
    <p className="text-sm text-muted-foreground">目前沒有符合條件的項目。</p>
   ) : (
    <div className="overflow-x-auto rounded-lg border border-border">
     <table className="w-full min-w-[640px] table-fixed text-sm">
      <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
       <tr>
        <th className={cn("px-3 py-2.5 font-medium", category === "system" ? "w-[12%]" : "w-[14%]")}>
         類型
        </th>
        <th className={cn("px-3 py-2.5 font-medium", category === "system" ? "w-[36%]" : "w-[46%]")}>
         內容
        </th>
        {category === "system" ? (
         <th className="w-[14%] px-3 py-2.5 font-medium">可見對象</th>
        ) : null}
        <th className="w-[14%] px-3 py-2.5 font-medium">時間</th>
        <th className="w-[10%] px-3 py-2.5 font-medium">狀態</th>
        <th className="w-[10%] px-3 py-2.5 font-medium">動作</th>
       </tr>
      </thead>
      <tbody>
       {visible.map((item) => (
        <tr
         key={item.sourceKey}
         className={cn(
          "cursor-pointer border-b border-border/80 last:border-0 hover:bg-muted/30",
          !item.read && "bg-info/5"
         )}
         onClick={() => void openDetail(item)}
        >
         <td className="min-w-0 px-3 py-2.5 align-top">
          <Tag tone={statusToTagTone(item.statusLabel)}>{item.statusLabel}</Tag>
         </td>
         <td className="min-w-0 px-3 py-2.5 align-top">
          <p className={cn("truncate font-medium", !item.read && "text-foreground")}>{item.title}</p>
          {item.body ? (
           <p className="mt-0.5 truncate text-muted-foreground" title={item.body}>
            {item.body.replace(/\n/g, " ")}
           </p>
          ) : null}
         </td>
         {category === "system" ? (
          <td className="min-w-0 px-3 py-2.5 align-top text-muted-foreground">
           {formatInboxAudienceLabel(item.audienceRoles)}
          </td>
         ) : null}
         <td className="min-w-0 px-3 py-2.5 align-top text-muted-foreground">
          {formatWhen(item.createdAt)}
         </td>
         <td className="min-w-0 px-3 py-2.5 align-top">
          <Tag tone={item.read ? "success" : "warning"}>{item.read ? "已讀" : "未讀"}</Tag>
         </td>
         <td className="min-w-0 px-3 py-2.5 align-top">
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={busyKey === item.sourceKey}
           onClick={(e) => {
            e.stopPropagation()
            void openDetail(item)
           }}
          >
           查看
          </Button>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}
  </div>
 )
}
