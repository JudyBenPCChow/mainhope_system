import type { ReactNode } from "react"
import { X } from "lucide-react"

import { ClassPreviewPanel } from "@/components/recordPreview/ClassPreviewPanel"
import { SchedulePreviewPanel } from "@/components/recordPreview/SchedulePreviewPanel"
import { StudentPreviewPanel } from "@/components/recordPreview/StudentPreviewPanel"
import { TeacherPreviewPanel } from "@/components/recordPreview/TeacherPreviewPanel"
import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { cn } from "@/lib/utils"

type Props = {
 /** 無選定紀錄時顯示（例如行政首頁常用工作）。 */
 empty?: ReactNode
}

export function RecordPreviewRail({ empty }: Props) {
 const { preview, closePreview, enabled, emptyOpen, setEmptyOpen } = useRecordPreview()

 if (!enabled) return null

 const showEmpty = Boolean(empty) && emptyOpen && !preview
 const open = Boolean(preview) || showEmpty

 return (
  <aside
   className={cn(
    "relative z-10 flex h-full min-h-0 shrink-0 flex-col overflow-hidden bg-card transition-[width,box-shadow] duration-200 ease-out",
    open
     ? "w-[min(26rem,42vw)] border-l border-border shadow-[-6px_0_24px_-4px_rgba(15,23,42,0.18)]"
     : "w-0"
   )}
   aria-hidden={!open}
   aria-label={preview ? "紀錄預覽" : showEmpty ? "常用工作" : undefined}
  >
   {preview ? (
    <>
     <button
      type="button"
      className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted"
      onClick={closePreview}
      aria-label="關閉"
     >
      <X className="h-5 w-5" aria-hidden />
     </button>
     <div className="relative min-h-0 flex-1 overflow-y-auto">
      {preview.kind === "student" ? (
       <StudentPreviewPanel studentId={preview.id} />
      ) : preview.kind === "class" ? (
       <ClassPreviewPanel classId={preview.id} />
      ) : preview.kind === "schedule" ? (
       <SchedulePreviewPanel scheduleId={preview.id} />
      ) : (
       <div className="px-3 py-3 pr-10">
        <TeacherPreviewPanel teacherId={preview.id} />
       </div>
      )}
     </div>
    </>
   ) : showEmpty ? (
    <>
     <button
      type="button"
      className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-card/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted"
      onClick={() => setEmptyOpen(false)}
      aria-label="摺疊常用工作"
     >
      <X className="h-5 w-5" aria-hidden />
     </button>
     <div className="relative min-h-0 flex-1 overflow-y-auto">{empty}</div>
    </>
   ) : null}
  </aside>
 )
}
