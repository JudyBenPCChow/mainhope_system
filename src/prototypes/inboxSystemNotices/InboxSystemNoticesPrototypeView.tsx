import { useMemo, useState } from "react"
import { ArrowLeft, CheckCheck, Inbox, RefreshCw, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
 AUDIENCE_ROLE_OPTIONS,
 OPS_TYPE_FILTER_OPTIONS,
 ROLE_OPTIONS,
 audienceVisibleTo,
 cloneInitialInboxItems,
 formatAudienceLabel,
 type PrototypeAudience,
 type PrototypeInboxCategory,
 type PrototypeInboxItem,
 type PrototypeInboxRole,
} from "./mockData"

function formatWhen(iso: string): string {
 const s = iso.trim()
 if (!s) return "—"
 const d = s.slice(0, 10)
 const t = s.length >= 16 ? s.slice(11, 16) : ""
 return t ? `${d} ${t}` : d
}

function matchesOpsType(item: PrototypeInboxItem, filter: string): boolean {
 if (!filter) return true
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

export function InboxSystemNoticesPrototypeView() {
 const { pushBanner } = useAppBanner()
 const [role, setRole] = useState<PrototypeInboxRole>("alien")
 const [category, setCategory] = useState<PrototypeInboxCategory>("ops")
 const [items, setItems] = useState<PrototypeInboxItem[]>(() => cloneInitialInboxItems())
 const [typeFilter, setTypeFilter] = useState("")
 const [unreadOnly, setUnreadOnly] = useState(false)
 const [detailId, setDetailId] = useState<string | null>(null)

 const [publishTitle, setPublishTitle] = useState("")
 const [publishBody, setPublishBody] = useState("")
 const [publishPathHint, setPublishPathHint] = useState("")
 const [audienceMode, setAudienceMode] = useState<"all" | "roles">("all")
 const [audienceRoles, setAudienceRoles] = useState<PrototypeInboxRole[]>(["admin", "alien"])

 const canPublish = role === "alien"

 const categoryItems = useMemo(() => {
  return items.filter((i) => {
   if (i.category !== category) return false
   if (i.category === "system" && !audienceVisibleTo(i.audience, role)) return false
   return true
  })
 }, [items, category, role])

 const visible = useMemo(() => {
  return categoryItems.filter((i) => {
   if (unreadOnly && i.read) return false
   if (category === "ops" && !matchesOpsType(i, typeFilter)) return false
   return true
  })
 }, [categoryItems, unreadOnly, category, typeFilter])

 const unreadInCategory = useMemo(
  () => categoryItems.filter((i) => !i.read).length,
  [categoryItems]
 )

 const detailItem = useMemo(
  () => (detailId ? items.find((i) => i.id === detailId) ?? null : null),
  [detailId, items]
 )

 const resetMock = () => {
  setItems(cloneInitialInboxItems())
  setTypeFilter("")
  setUnreadOnly(false)
  setPublishTitle("")
  setPublishBody("")
  setPublishPathHint("")
  setAudienceMode("all")
  setAudienceRoles(["admin", "alien"])
  setDetailId(null)
  pushBanner({ tone: "info", title: "已重設為沙盒假資料" })
 }

 /** 開啟詳情並自動標記已讀（不導向正式頁） */
 const openDetail = (id: string) => {
  setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)))
  setDetailId(id)
 }

 const markAllVisible = () => {
  const ids = new Set(visible.map((v) => v.id))
  setItems((prev) => prev.map((x) => (ids.has(x.id) ? { ...x, read: true } : x)))
  pushBanner({ tone: "success", title: "沙盒：可見項目已全部標記為已讀" })
 }

 const toggleAudienceRole = (r: PrototypeInboxRole) => {
  setAudienceRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
 }

 const publish = () => {
  const title = publishTitle.trim()
  if (!title) {
   pushBanner({ tone: "error", title: "請填寫標題" })
   return
  }
  if (!canPublish) {
   pushBanner({ tone: "error", title: "僅外星人可發佈系統通知" })
   return
  }
  let audience: PrototypeAudience = "all"
  if (audienceMode === "roles") {
   if (audienceRoles.length === 0) {
    pushBanner({ tone: "error", title: "請至少指定一個可見角色，或改選全部人" })
    return
   }
   audience = [...audienceRoles]
  }
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00+08:00`
  const next: PrototypeInboxItem = {
   id: `sys-local-${now.getTime()}`,
   category: "system",
   type: "system_update",
   statusLabel: "系統更新",
   title,
   body: publishBody.trim() || null,
   createdAt,
   read: false,
   actionPathHint: publishPathHint.trim() || null,
   audience,
  }
  setItems((prev) => [next, ...prev])
  setPublishTitle("")
  setPublishBody("")
  setPublishPathHint("")
  setAudienceMode("all")
  setAudienceRoles(["admin", "alien"])
  setCategory("system")
  setDetailId(null)
  pushBanner({ tone: "success", title: "沙盒：已加入系統通知（僅本地）" })
 }

 if (detailItem) {
  return (
   <div className="space-y-6 md:p-6">
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
     沙盒詳情頁：開啟時已自動標記已讀；不連正式頁／資料庫。
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" size="sm" onClick={() => setDetailId(null)}>
      <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
      返回列表
     </Button>
    </div>

    <article className="space-y-4 rounded-lg border border-border p-4 sm:p-6">
     <div className="flex flex-wrap items-center gap-2">
      <Tag tone={statusToTagTone(detailItem.statusLabel)}>{detailItem.statusLabel}</Tag>
      <Tag tone="info">{detailItem.category === "system" ? "系統通知" : "營運通知"}</Tag>
      <Tag tone="success">已讀</Tag>
     </div>
     <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{detailItem.title}</h1>
     <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
      <div>
       <dt className="inline text-muted-foreground">時間：</dt>
       <dd className="inline">{formatWhen(detailItem.createdAt)}</dd>
      </div>
      {detailItem.category === "system" ? (
       <div>
        <dt className="inline text-muted-foreground">可見對象：</dt>
        <dd className="inline">{formatAudienceLabel(detailItem.audience)}</dd>
       </div>
      ) : null}
     </dl>
     <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {detailItem.body?.trim() || "（無詳細內容）"}
     </div>
     {detailItem.actionPathHint ? (
      <div className="space-y-2 border-t border-border pt-4">
       <p className="text-xs text-muted-foreground">
        正式版可前往相關頁面；沙盒僅顯示路徑，不導航。
       </p>
       <Button type="button" variant="outline" size="sm" disabled>
        前往 {detailItem.actionPathHint}
       </Button>
      </div>
     ) : null}
    </article>
   </div>
  )
 }

 return (
  <div className="space-y-6 md:p-6">
   <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
    沙盒／假資料：不連正式收件匣、不寫資料庫、不導向正式頁面。點列或「查看」開詳情並自動已讀。
   </div>

   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Inbox className="h-8 w-8 text-teal-600" aria-hidden />
      收件匣（沙盒）
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      演示「營運通知」與「系統通知」分頁；角色預覽不寫入本機登入角色。
      {unreadInCategory > 0 ? ` 本分頁未讀 ${unreadInCategory} 則。` : ""}
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={markAllVisible}
      disabled={visible.length === 0 || visible.every((i) => i.read)}
     >
      <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden />
      全部已讀
     </Button>
     <Button type="button" variant="outline" size="sm" onClick={resetMock}>
      <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
      重設假資料
     </Button>
    </div>
   </header>

   <div className="flex flex-wrap items-end gap-3">
    <label className="space-y-1 text-sm">
     <span className="text-muted-foreground">角色預覽</span>
     <Select
      value={role}
      onChange={(e) => setRole(e.target.value as PrototypeInboxRole)}
      className="min-w-[12rem]"
     >
      {ROLE_OPTIONS.map((o) => (
       <option key={o.value} value={o.value}>
        {o.label}
       </option>
      ))}
     </Select>
    </label>
   </div>

   <div className="flex flex-wrap gap-2" role="tablist" aria-label="通知分類">
    <button
     type="button"
     role="tab"
     aria-selected={category === "ops"}
     className={tabClass(category === "ops")}
     onClick={() => setCategory("ops")}
    >
     營運通知
    </button>
    <button
     type="button"
     role="tab"
     aria-selected={category === "system"}
     className={tabClass(category === "system")}
     onClick={() => setCategory("system")}
    >
     系統通知
    </button>
   </div>

   <div className="flex flex-wrap items-end gap-3">
    {category === "ops" ? (
     <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">類型</span>
      <Select
       value={typeFilter}
       onChange={(e) => setTypeFilter(e.target.value)}
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
     <h2 className="text-sm font-semibold">發佈系統通知（僅外星人 · 沙盒本地）</h2>
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
       <span className="text-muted-foreground">建議前往路徑（僅顯示，不導航）</span>
       <Input
        value={publishPathHint}
        onChange={(e) => setPublishPathHint(e.target.value)}
        placeholder="/Payments"
       />
      </label>
     </div>
     <Button type="button" size="sm" onClick={publish}>
      <Send className="mr-1.5 h-4 w-4" aria-hidden />
      發佈（本地）
     </Button>
    </section>
   ) : null}

   {category === "system" && role === "admin" ? (
    <p className="text-xs text-muted-foreground">
     行政可閱讀系統通知；發佈僅限外星人與工程發版（沙盒不提供 admin 發佈鈕）。切換角色預覽可驗證可見對象。
    </p>
   ) : null}

   {category === "system" && role === "teacher" ? (
    <p className="text-xs text-muted-foreground">
     老師僅看到「全部人」或有勾選老師的系統通知。切換角色預覽可對照。
    </p>
   ) : null}

   {visible.length === 0 ? (
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
         key={item.id}
         className={cn(
          "cursor-pointer border-b border-border/80 last:border-0 hover:bg-muted/30",
          !item.read && "bg-info/5"
         )}
         onClick={() => openDetail(item.id)}
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
           {formatAudienceLabel(item.audience)}
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
           onClick={(e) => {
            e.stopPropagation()
            openDetail(item.id)
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
