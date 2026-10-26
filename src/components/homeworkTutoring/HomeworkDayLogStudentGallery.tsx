import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutGrid, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { HW_PATH, hwDayLogStudentPath } from "@/lib/homeworkTutoringNav"
import {
  WEEKDAY_OPTIONS,
  formatWeekdaysShort,
  type HomeworkStudentRow,
  type Weekday,
} from "@/lib/homeworkTutoringUi"
import {
  STUDENT_GRADE_CODES,
  STUDENT_GRADE_LABELS,
  formatStudentGradeCode,
  normalizeStudentGrade,
  type StudentGradeCode,
} from "@/lib/studentGrade"
import { cn } from "@/lib/utils"

const SELECT_CLASS = "h-10 min-w-[8.5rem] rounded-md border border-input bg-background px-2 text-sm"

type GradeFilter = "all" | StudentGradeCode
type SortKey = "grade" | "name"

/** 封面色：對齊 Notion 圖庫分級色感，但收斂飽和度以配系統淺底。 */
function gradeCoverClass(code: StudentGradeCode | null): string {
  if (!code) return "bg-slate-500 text-white"
  if (code === "P1" || code === "P2" || code === "P3") {
    return "bg-[#9B4B6C] text-white"
  }
  if (code === "P4" || code === "P5" || code === "P6") {
    return "bg-[#3D6B8C] text-white"
  }
  if (code === "S1" || code === "S2" || code === "S3") {
    return "bg-[#A67B3B] text-white"
  }
  if (code === "S4" || code === "S5" || code === "S6") {
    return "bg-[#4A5568] text-white"
  }
  return "bg-slate-500 text-white"
}

function gradeSortRank(grade: string): number {
  const code = normalizeStudentGrade(grade)
  if (!code) return 999
  const idx = (STUDENT_GRADE_CODES as readonly string[]).indexOf(code)
  return idx >= 0 ? idx : 999
}

type Props = {
  students: HomeworkStudentRow[]
  /** 圖庫列表路徑；行政工作域用舊路徑，老師用 `/HomeworkDayLogs`。 */
  listPath?: string
}

/** Notion 式圖庫（系統風格）：年級色塊封面＋篩選列，點卡進該生功課紀錄。 */
export function HomeworkDayLogStudentGallery({
  students,
  listPath = HW_PATH.dayLogs,
}: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all")
  const [weekdayFilter, setWeekdayFilter] = useState<"" | Weekday>("")
  const [sortKey, setSortKey] = useState<SortKey>("grade")

  const enrolled = useMemo(
    () => students.filter((s) => s.status === "在籍"),
    [students]
  )

  const gradeTabs = useMemo(() => {
    const present = new Set<StudentGradeCode>()
    for (const s of enrolled) {
      const code = normalizeStudentGrade(s.grade)
      if (code && code !== "GD" && code !== "NA") present.add(code)
    }
    return STUDENT_GRADE_CODES.filter((c) => present.has(c))
  }, [enrolled])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = enrolled.filter((s) => {
      const code = normalizeStudentGrade(s.grade)
      if (gradeFilter !== "all" && code !== gradeFilter) return false
      if (weekdayFilter && !s.weekdays.includes(weekdayFilter)) return false
      if (!q) return true
      const codeLabel = formatStudentGradeCode(s.grade).toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        codeLabel.includes(q)
      )
    })
    rows.sort((a, b) => {
      if (sortKey === "grade") {
        const g = gradeSortRank(a.grade) - gradeSortRank(b.grade)
        if (g !== 0) return g
      }
      return a.name.localeCompare(b.name, "zh-Hant")
    })
    return rows
  }, [enrolled, gradeFilter, weekdayFilter, query, sortKey])

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="text-[1.1375rem] font-semibold leading-snug">學生功課紀錄</h2>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
        <GalleryTab
          active={gradeFilter === "all"}
          onClick={() => setGradeFilter("all")}
          label="就讀中"
          count={enrolled.length}
        />
        {gradeTabs.map((code) => {
          const count = enrolled.filter((s) => normalizeStudentGrade(s.grade) === code).length
          return (
            <GalleryTab
              key={code}
              active={gradeFilter === code}
              onClick={() => setGradeFilter(code)}
              label={`${STUDENT_GRADE_LABELS[code]}`}
              count={count}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋姓名／學號"
            className="h-10 pl-8"
            aria-label="搜尋學生"
          />
        </div>
        <Select
          className={SELECT_CLASS}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="排序"
        >
          <option value="grade">排序：年級</option>
          <option value="name">排序：姓名</option>
        </Select>
        <Select
          className={SELECT_CLASS}
          value={weekdayFilter}
          onChange={(e) => setWeekdayFilter(e.target.value as "" | Weekday)}
          aria-label="篩選到校日"
        >
          <option value="">到校日：全部</option>
          {WEEKDAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              逢星期{d}
            </option>
          ))}
        </Select>
        {(gradeFilter !== "all" || weekdayFilter || query.trim()) && (
          <button
            type="button"
            className="h-10 px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setGradeFilter("all")
              setWeekdayFilter("")
              setQuery("")
            }}
          >
            清除篩選
          </button>
        )}
        <Tag tone="default" size="sm" className="ml-auto tabular-nums">
          {visible.length} 人
        </Tag>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
          <LayoutGrid className="h-8 w-8 text-muted-foreground/50" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {enrolled.length === 0
              ? "尚無在籍功輔學生。"
              : "沒有符合篩選的學生。"}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((s) => {
            const code = normalizeStudentGrade(s.grade)
            const codeLabel = formatStudentGradeCode(s.grade)
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(hwDayLogStudentPath(s.id, listPath))}
                  className={cn(
                    "group flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-background text-left shadow-sm",
                    "transition-[transform,box-shadow,border-color] duration-150",
                    "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <div
                    className={cn(
                      "flex aspect-[5/3] w-full items-center justify-center px-3",
                      gradeCoverClass(code)
                    )}
                  >
                    <span className="line-clamp-2 text-center text-lg font-semibold tracking-tight drop-shadow-sm sm:text-xl">
                      {codeLabel !== "—" ? `${codeLabel} ${s.name}` : s.name}
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.code}
                      {s.grade ? ` · ${s.grade}` : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.weekdays.length > 0
                        ? `逢${formatWeekdaysShort(s.weekdays)}`
                        : "未設到校日"}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function GalleryTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      <LayoutGrid className="h-3.5 w-3.5 opacity-70" aria-hidden />
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums leading-none",
          active
            ? "bg-background text-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  )
}
