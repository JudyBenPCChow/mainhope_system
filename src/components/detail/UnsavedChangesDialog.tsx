import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"

type UnsavedChangesDialogProps = {
 open: boolean
 onContinueEditing: () => void
 onDiscard: () => void
 onSave: () => void
 description?: string
 saveLabel?: string
}

export function UnsavedChangesDialog({
 open,
 onContinueEditing,
 onDiscard,
 onSave,
 description = "基本資料已修改但尚未儲存。要儲存、放棄變更，還是繼續編輯？",
 saveLabel = "儲存",
}: UnsavedChangesDialogProps) {
 return (
  <Dialog
   open={open}
   onOpenChange={(next) => {
    if (!next) onContinueEditing()
   }}
  >
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>有未儲存的變更</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">{description}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-2">
     <Button type="button" variant="outline" onClick={onContinueEditing}>
      繼續編輯
     </Button>
     <Button type="button" variant="outline" onClick={onDiscard}>
      放棄變更
     </Button>
     <Button type="button" onClick={onSave}>
      {saveLabel}
     </Button>
    </div>
   </DialogContent>
  </Dialog>
 )
}
