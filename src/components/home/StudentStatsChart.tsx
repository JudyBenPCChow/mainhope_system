import type { StatusSlice } from "@/services/dashboard"

type Props = {
 slices: StatusSlice[]
 loading?: boolean
}

export function StudentStatsChart({ slices, loading }: Props) {
 const sum = slices.reduce((s, x) => s + x.count, 0)
 const total = sum > 0 ? sum : 1

 return (
  <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
   <h2 className="mb-5 text-lg font-semibold md:text-xl">學生動態統計</h2>
   {loading ? (
    <p className="text-base text-muted-foreground">載入中…</p>
   ) : sum === 0 ? (
    <p className="text-base text-muted-foreground">尚無學生資料。</p>
   ) : (
    <>
     <div className="mb-5 flex h-5 overflow-hidden rounded-full bg-muted md:h-6">
      {slices.map((s) => (
       <div
        key={s.status}
        className={`${s.className} transition-all`}
        style={{ width: `${(s.count / total) * 100}%` }}
        title={`${s.status}: ${s.count}`}
       />
      ))}
     </div>
     <ul className="flex flex-wrap gap-x-5 gap-y-3 text-base md:text-lg">
      {slices.map((s) => (
       <li key={s.status} className="flex items-center gap-2">
        <span className={`h-3 w-3 shrink-0 rounded-sm ${s.className}`} />
        <span className="text-muted-foreground">{s.status}</span>
        <span className="font-semibold tabular-nums text-foreground">{s.count}</span>
       </li>
      ))}
     </ul>
    </>
   )}
  </section>
 )
}
