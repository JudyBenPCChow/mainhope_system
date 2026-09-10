import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"

import { TuitionChaseStatusTag } from "@/components/payments/tuitionChaseDueUi"
import { TuitionChasePoolSection } from "@/components/students/studentTuitionChaseUi"
import { Button } from "@/components/ui/button"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { specialistTuitionPeriodCaption } from "@/lib/specialistTuitionPeriods"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 fetchTuitionChaseForStudent,
 fetchTuitionChaseStudentDetail,
 type TuitionChasePeriodRef,
 type TuitionChasePoolDetail,
 type TuitionChaseStudentRow,
} from "@/services/tuitionChaseQueries"

export function StudentTuitionChaseTab({
 studentId,
 active,
 reloadToken,
 canRegisterPayment,
}: {
 studentId: string
 active: boolean
 reloadToken: number
 canRegisterPayment: boolean
}) {
 const [searchParams] = useSearchParams()
 const poolFromUrl = searchParams.get("pool")
 const [row, setRow] = useState<TuitionChaseStudentRow | null>(null)
 const [currentPeriod, setCurrentPeriod] = useState<TuitionChasePeriodRef | null>(null)
 const [nextPeriod, setNextPeriod] = useState<TuitionChasePeriodRef | null>(null)
 const [detailsByPool, setDetailsByPool] = useState<Map<string, TuitionChasePoolDetail>>(
  () => new Map()
 )
 const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle")
 const [detailErr, setDetailErr] = useState<string | null>(null)
 const [err, setErr] = useState<string | null>(null)
 const loadedRef = useRef(false)
 const highlightRef = useRef<HTMLElement | null>(null)

 useEffect(() => {
  loadedRef.current = false
  setRow(null)
  setCurrentPeriod(null)
  setNextPeriod(null)
  setDetailsByPool(new Map())
  setErr(null)
  setDetailErr(null)
  setLoadState("idle")
 }, [studentId])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRow(null)
   setCurrentPeriod(null)
   setNextPeriod(null)
   setDetailsByPool(new Map())
   setLoadState("ready")
   loadedRef.current = true
   return
  }
  setLoadState("loading")
  setErr(null)
  setDetailErr(null)
  setDetailsByPool(new Map())
  try {
   const result = await fetchTuitionChaseForStudent(studentId)
   setRow(result.row)
   setCurrentPeriod(result.currentPeriod)
   setNextPeriod(result.nextPeriod)
   setLoadState("ready")
   loadedRef.current = true
   if (result.row) {
    try {
     const list = await fetchTuitionChaseStudentDetail({
      studentId: result.row.studentId,
      pools: result.row.pools,
      currentPeriod: result.currentPeriod,
      nextPeriod: result.nextPeriod,
      academicYearLabel: result.opsYearLabels[0],
     })
     setDetailsByPool(new Map(list.map((d) => [d.poolKey, d])))
    } catch (e) {
     reportUserFacingError(e, { source: "StudentTuitionChaseTab.detail", setErr: setDetailErr })
     setDetailsByPool(new Map())
    }
   } else {
    setDetailsByPool(new Map())
   }
  } catch (e) {
   reportUserFacingError(e, { source: "StudentTuitionChaseTab.load", setErr })
   setRow(null)
   setLoadState("error")
  }
 }, [studentId])

 useEffect(() => {
  if (!active && !loadedRef.current) return
  void load()
 }, [active, reloadToken, load])

 useEffect(() => {
  if (!active || loadState !== "ready" || !poolFromUrl) return
  highlightRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
 }, [active, loadState, poolFromUrl, row])

 if (!active && !loadedRef.current && loadState === "idle") return null

 const thisPeriodLabel = currentPeriod?.label ?? "本期"
 const nextPeriodLabel = nextPeriod?.label ?? "下期"
 const thisCaption = specialistTuitionPeriodCaption(currentPeriod)
 const nextCaption = specialistTuitionPeriodCaption(nextPeriod)
 const periodLine = [thisCaption, nextCaption].filter(Boolean).join(" ／ ")

 return (
  <div hidden={!active} className="space-y-4">
   {loadState === "loading" && !row ? (
    <p className="text-sm text-muted-foreground">載入學費追收…</p>
   ) : null}

   {loadState === "error" ? (
    <div className="space-y-2" role="alert">
     <p className="text-sm text-destructive">{err ?? "學費追收資料未能載入。"}</p>
     <button
      type="button"
      className="text-sm font-medium text-primary hover:underline"
      onClick={() => {
       loadedRef.current = false
       void load()
      }}
     >
      重試
     </button>
    </div>
   ) : null}

   {loadState === "ready" && !row ? (
    <div className="space-y-3">
     <p className="text-sm text-muted-foreground">
      {currentPeriod
       ? "本學年沒有可追收的專科班／私人課程組別（僅功輔或不在本學年在讀名單者不顯示）。"
       : "本頁只適用常規專科班／私人課程的期數追收；功課輔導班是月費，請走收款登記。本學年沒有期數表或學年已完課。"}
     </p>
     <Button asChild variant="outline" size="sm">
      <Link to="/TuitionChase">開啟學費追收名單</Link>
     </Button>
    </div>
   ) : null}

   {row ? (
    <>
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
       <p className="text-sm font-medium">{periodLine || "學費追收"}</p>
       <TuitionChaseStatusTag status={row.status} />
      </div>
      {canRegisterPayment ? (
       <Button asChild size="sm">
        <Link to={`/Payments?studentId=${encodeURIComponent(row.studentId)}`}>
         <Plus className="h-4 w-4" />
         收款登記
        </Link>
       </Button>
      ) : (
       <p className="text-xs text-muted-foreground">收款登記請由行政／外星人處理。</p>
      )}
     </div>
     <p className="text-sm text-muted-foreground">
      報讀班別「尚差堂數」是全學年口徑，不是本期要收。
     </p>
     {detailErr ? (
      <p className="text-sm text-destructive" role="alert">
       {detailErr}
      </p>
     ) : null}
     <div className="space-y-8">
      {row.pools.map((pool) => {
       const highlighted = Boolean(poolFromUrl && pool.poolKey === poolFromUrl)
       return (
        <TuitionChasePoolSection
         key={pool.poolKey}
         pool={pool}
         detail={detailsByPool.get(pool.poolKey) ?? null}
         thisPeriodLabel={thisPeriodLabel}
         nextPeriodLabel={nextPeriodLabel}
         studentId={row.studentId}
         highlighted={highlighted}
         sectionRef={highlighted ? highlightRef : undefined}
        />
       )
      })}
     </div>
    </>
   ) : null}
  </div>
 )
}
