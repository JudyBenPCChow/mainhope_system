import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { takeGroupClassPreview } from "@/lib/adPublicLandingCopy"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade, type StudentGradeCode } from "@/lib/studentGrade"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { classMeetingLabel } from "@/lib/trialInvitePublicFlow"
import { getAdTrialCatalog } from "@/services/adTrialQueries"
import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

const GRADE_OPTIONS = ["S1", "S2", "S3", "S4", "S5", "S6"] as const satisfies readonly StudentGradeCode[]

/** 先選一個年級再查詢。不可一次查出中一至中六。 */
export function AdPublicCatalogPreview({ onUseGrade }: { onUseGrade: (grade: StudentGradeCode) => void }) {
  const [grade, setGrade] = useState("")
  const [rows, setRows] = useState<TrialInviteClassOption[]>([])
  const [hiddenCount, setHiddenCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number])) {
      setRows([])
      setHiddenCount(0)
      setErr(null)
      return
    }
    if (!isSupabaseConfigured) {
      setRows([])
      setHiddenCount(0)
      setErr("系統尚未設定，請直接填寫下方表格。")
      return
    }
    let cancelled = false
    setLoading(true)
    setErr(null)
    void getAdTrialCatalog(grade)
      .then((catalog) => {
        if (cancelled) return
        const group = catalog.classes.filter((row) => row.class_kind === "group")
        setRows(takeGroupClassPreview(group))
        setHiddenCount(Math.max(0, group.length - 6))
      })
      .catch((e) => {
        if (cancelled) return
        setRows([])
        setHiddenCount(0)
        reportUserFacingError(e, { source: "AdPublicCatalogPreview", setErr })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [grade])

  return (
    <section className="mt-8 space-y-3" aria-label="本學年開辦班別">
      <h2 className="text-lg font-semibold text-foreground">本學年開辦班別（即時）</h2>
      <p className="text-sm text-muted-foreground">以下為系統即時資料。請先選擇一個年級。</p>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-foreground">年級</span>
        <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">請選擇</option>
          {GRADE_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {formatStudentGrade(code)}
            </option>
          ))}
        </Select>
      </label>
      {loading ? <p className="text-sm text-muted-foreground">載入班別…</p> : null}
      {err ? (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      ) : null}
      {!loading && grade && !err && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">此年級暫時沒有已開放的專科班。可於下方留名，由本社建議班別。</p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((row) => {
            const meeting = [row.teacher_name.trim(), classMeetingLabel(row)].filter(Boolean).join(" · ")
            return (
              <li key={row.id} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{row.course_name.trim() || row.subject.trim() || "專科班"}</p>
                {meeting ? <p className="text-muted-foreground">{meeting}</p> : null}
              </li>
            )
          })}
        </ul>
      ) : null}
      {hiddenCount > 0 ? (
        <p className="text-sm text-muted-foreground">尚有其他班別。選擇年級後可看到全部時間。</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number])}
        onClick={() => {
          if (!GRADE_OPTIONS.includes(grade as (typeof GRADE_OPTIONS)[number])) return
          onUseGrade(grade as StudentGradeCode)
        }}
      >
        選擇年級，查看可選時間
      </Button>
    </section>
  )
}
