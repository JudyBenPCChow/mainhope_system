type Props = { title: string; description?: string }

export function PagePlaceholder({ title, description }: Props) {
 return (
  <div className="p-6">
   <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
   <p className="mt-2 max-w-prose text-sm text-muted-foreground">
    {description ??
     "此頁仍為占位（詳情或首頁區塊）。列表類頁面已自 Supabase 載入；若要完整 UI，請將 Base44 對應頁面貼入 `src/pages` 或 `src/components`。"}
   </p>
  </div>
 )
}
