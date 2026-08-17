import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/authBootstrap"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import type { Role } from "@/lib/navStructure"
import {
 dismissChickenGentlemanNudge,
 isChickenGentlemanNudgeDismissed,
 shouldShowChickenGentlemanNudge,
} from "@/lib/teacherRollCallNudge"
import { cn } from "@/lib/utils"
import { todayYmdLocal } from "@/lib/weekdayUtils"
import { countPastPendingRollCallDaysForTeacher } from "@/services/attendanceQueries"

const CHICKEN_GENTLEMAN_SRC = "/chicken-gentleman.png"

type ChickenGentlemanNudgeProps = {
 role: Role
}

export function ChickenGentlemanNudge({ role }: ChickenGentlemanNudgeProps) {
 const { profile } = useAuth()
 const teacherId = role === "teacher" ? profile?.teacherId ?? null : null
 const [open, setOpen] = useState(false)
 const [leaving, setLeaving] = useState(false)

 useEffect(() => {
  if (role !== "teacher" || !teacherId || !isSupabaseConfigured) {
   setOpen(false)
   return
  }
  const today = todayYmdLocal()
  if (isChickenGentlemanNudgeDismissed(teacherId, today)) return

  let cancelled = false
  let appearTimer = 0

  void countPastPendingRollCallDaysForTeacher(teacherId, today)
   .then((uniqueDays) => {
    if (cancelled || !shouldShowChickenGentlemanNudge(uniqueDays)) return
    appearTimer = window.setTimeout(() => {
     if (!cancelled) setOpen(true)
    }, 400)
   })
   .catch(() => {
    /* 裝飾提醒：查詢失敗就唔彈，避免洗畫面／報錯列表 */
   })

  return () => {
   cancelled = true
   window.clearTimeout(appearTimer)
  }
 }, [role, teacherId])

 const close = () => {
  const today = todayYmdLocal()
  if (teacherId) dismissChickenGentlemanNudge(teacherId, today)
  const reduceMotion =
   typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (reduceMotion) {
   setOpen(false)
   return
  }
  setLeaving(true)
  window.setTimeout(() => {
   setOpen(false)
   setLeaving(false)
  }, 430)
 }

 if (!open || typeof document === "undefined") return null

 return createPortal(
  <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] flex justify-start md:justify-center">
   <div
    className={cn(
     "pointer-events-auto relative mb-[calc(5.5rem+env(safe-area-inset-bottom))] ml-3 w-[min(16rem,calc(100vw-5.75rem))] md:mb-6 md:ml-0",
     leaving ? "animate-chicken-card-leave" : "animate-chicken-card-rise motion-reduce:animate-none"
    )}
    role="status"
    aria-label="雞先生點名提醒"
   >
    <Button
     type="button"
     variant="secondary"
     size="icon"
     className="absolute -right-2 -top-2 z-[1] h-10 w-10 rounded-full border border-border shadow-md"
     onClick={close}
     aria-label="關閉雞先生提醒"
    >
     <X className="h-4 w-4" />
    </Button>
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
     <img
      src={CHICKEN_GENTLEMAN_SRC}
      alt="雞先生"
      className="mx-auto block h-44 w-auto object-contain sm:h-48"
      draggable={false}
     />
     <p className="px-3 pb-3 pt-1 text-center text-sm font-semibold leading-snug text-foreground">
      雞先生發現你好似未點名呀！記得要點名呀！
     </p>
    </div>
   </div>
  </div>,
  document.body
 )
}
