import { Link } from "react-router-dom"
import { GraduationCap, ListOrdered, Sparkles, UserPlus } from "lucide-react"

import { StudentStatsChart } from "@/components/home/StudentStatsChart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { StatusSlice } from "@/services/dashboard"

type Props = {
 studentStatusSlices: StatusSlice[]
 loading?: boolean
 /** 手機精簡：捷徑列 + 不顯示統計圖 */
 compact?: boolean
}

const cardClass =
 "flex min-h-[5.5rem] flex-col justify-between gap-3 rounded-xl border border-border/80 bg-card/90 p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.02] md:min-h-[6rem] md:p-6"

export function AdminHomeStudentsTrialsPanel({ studentStatusSlices, loading, compact }: Props) {
 if (compact) {
  return (
   <div className="grid grid-cols-3 gap-2">
    <Button type="button" className="h-auto flex-col gap-1.5 px-2 py-3.5 text-xs" asChild>
     <Link to="/FrontDeskWizard">
      <ListOrdered className="h-5 w-5" aria-hidden />
      前台精靈
     </Link>
    </Button>
    <Button type="button" variant="outline" className="h-auto flex-col gap-1.5 px-2 py-3.5 text-xs" asChild>
     <Link to="/Students">
      <UserPlus className="h-5 w-5" aria-hidden />
      學生管理
     </Link>
    </Button>
    <Button type="button" variant="outline" className="h-auto flex-col gap-1.5 px-2 py-3.5 text-xs" asChild>
     <Link to="/TrialSessions">
      <GraduationCap className="h-5 w-5" aria-hidden />
      試堂紀錄
     </Link>
    </Button>
   </div>
  )
 }

 return (
  <div className="space-y-4">
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div className={cn(cardClass)}>
     <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
       <ListOrdered className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
       <h2 className="text-base font-semibold text-foreground">前台指引精靈</h2>
       <p className="mt-1 text-sm text-muted-foreground">新生登記 → 報讀 → 收款 → 請假一條龍。</p>
      </div>
     </div>
     <Button type="button" className="w-full sm:w-auto" asChild>
      <Link to="/FrontDeskWizard">開始精靈</Link>
     </Button>
    </div>

    <div className={cn(cardClass)}>
     <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700">
       <UserPlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
       <h2 className="text-base font-semibold text-foreground">新增學生</h2>
       <p className="mt-1 text-sm text-muted-foreground">建立學生基本資料（學號自動生成）。</p>
      </div>
     </div>
     <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
      <Link to="/Students">前往學生管理</Link>
     </Button>
    </div>

    <div className={cn(cardClass)}>
     <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info/15 text-info">
       <Sparkles className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
       <h2 className="text-base font-semibold text-foreground">試堂</h2>
       <p className="mt-1 text-sm text-muted-foreground">安排試堂、檢視本週試堂紀錄。</p>
      </div>
     </div>
     <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
      <Link to="/TrialSessions">
       <GraduationCap className="h-4 w-4" aria-hidden />
       前往試堂紀錄
      </Link>
     </Button>
    </div>
   </div>

   <StudentStatsChart slices={studentStatusSlices} loading={loading} />
  </div>
 )
}
