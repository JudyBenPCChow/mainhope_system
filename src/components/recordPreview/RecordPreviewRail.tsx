import { X } from "lucide-react"

import { ClassPreviewPanel } from "@/components/recordPreview/ClassPreviewPanel"
import { StudentPreviewPanel } from "@/components/recordPreview/StudentPreviewPanel"
import { TeacherPreviewPanel } from "@/components/recordPreview/TeacherPreviewPanel"
import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { cn } from "@/lib/utils"

export function RecordPreviewRail() {
 const { preview, closePreview, enabled } = useRecordPreview()

 if (!enabled) return null

 const open = Boolean(preview)

 return (
  <aside
   className={cn(
    "relative z-10 flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-card transition-[width,box-shadow] duration-200 ease-out",
    open
     ? "w-[min(26rem,42vw)] border-l border-border shadow-[-6px_0_24px_-4px_rgba(15,23,42,0.18)]"
     : "w-0"
   )}
   aria-hidden={!open}
   aria-label={open ? "紀錄預覽" : undefined}
  >
   {preview ? (
    <>
     <button
      type="button"
      className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted"
      onClick={closePreview}
      aria-label="關閉"
     >
      <X className="h-5 w-5" aria-hidden />
     </button>
     <div className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 pr-10">
      {preview.kind === "student" ? (
       <StudentPreviewPanel studentId={preview.id} />
      ) : preview.kind === "class" ? (
       <ClassPreviewPanel classId={preview.id} />
      ) : (
       <TeacherPreviewPanel teacherId={preview.id} />
      )}
     </div>
    </>
   ) : null}
  </aside>
 )
}
