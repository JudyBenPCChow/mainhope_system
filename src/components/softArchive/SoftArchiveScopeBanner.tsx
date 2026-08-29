import { Button } from "@/components/ui/button"

export function SoftArchiveScopeBanner(props: {
 hiddenCount: number
 description: string
 onShow: () => void
}) {
 if (props.hiddenCount <= 0) return null
 return (
  <div
   role="status"
   className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
  >
   <span>{props.description}</span>
   <Button type="button" variant="outline" size="sm" onClick={props.onShow}>
    顯示
   </Button>
  </div>
 )
}
