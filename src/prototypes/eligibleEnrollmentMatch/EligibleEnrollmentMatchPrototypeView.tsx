import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

import {
  buildClassMatchBundles,
  buildStudentMatchBundles,
  formatWeekdays,
  type ClassMatchBundle,
  type ExclusionReason,
  type MockStudent,
  type StudentMatchBundle,
} from "./mockData"

type ViewMode = "byClass" | "byStudent"
type EnrollmentFilter = "all" | "none" | "has"

const FULL_TERM_COUNT_OPTIONS = [1, 2, 3] as const
type FullTermCountOption = (typeof FULL_TERM_COUNT_OPTIONS)[number]

const REASON_LABEL: Record<ExclusionReason, string> = {
  非注冊: "非注冊",
  年級不合: "年級不合",
  時間衝突: "時間衝突",
  已報讀本班: "已報讀本班",
  已退讀本班: "已退讀本班",
}

function StudentMeta({ student }: { student: MockStudent }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-foreground">
        {student.fullName}
        <span className="ml-2 font-normal text-muted-foreground">{student.englishName}</span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {student.studentCode} · {student.grade} · {student.parentPhone}
      </div>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange("byClass")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition",
          mode === "byClass"
            ? "bg-card font-medium text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
        按班別
      </button>
      <button
        type="button"
        onClick={() => onChange("byStudent")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition",
          mode === "byStudent"
            ? "bg-card font-medium text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Users className="h-3.5 w-3.5" />
        按學生
      </button>
    </div>
  )
}

type ChipOption<T extends string | number> = { value: T; label: string }

function FilterChipGroup<T extends string | number>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: ChipOption<T>[]
  selected: Set<T> | T
  onToggle: (value: T) => void
}) {
  const isOn = (v: T) => (selected instanceof Set ? selected.has(v) : selected === v)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = isOn(opt.value)
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(opt.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition",
                on
                  ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-card px-3 py-3 sm:px-4">
      {children}
    </div>
  )
}

function ClassHeader({ bundle, expanded }: { bundle: ClassMatchBundle; expanded: boolean }) {
  const { cls, fullTermCount, eligible } = bundle
  return (
    <div className="flex flex-1 items-start gap-3 text-left">
      <div className="mt-0.5 text-muted-foreground">
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{cls.label}</span>
          <Tag tone="info" size="sm">
            {cls.subject}
          </Tag>
          <Tag tone="default" size="sm">
            {cls.grades.join("、")}
          </Tag>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatWeekdays(cls.dayOfWeek)} {cls.timeSlot}
          </span>
          <span>{cls.teacherName}</span>
          <span>
            全期 {fullTermCount}/{cls.capacity} 人
          </span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg font-semibold tabular-nums text-primary">{eligible.length}</div>
        <div className="text-[11px] text-muted-foreground">可報讀</div>
      </div>
    </div>
  )
}

function StudentHeader({ bundle, expanded }: { bundle: StudentMatchBundle; expanded: boolean }) {
  return (
    <div className="flex flex-1 items-start gap-3 text-left">
      <div className="mt-0.5 text-muted-foreground">
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <StudentMeta student={bundle.student} />
        {bundle.currentClasses.length > 0 ? (
          <div className="mt-1 text-xs text-muted-foreground">
            現讀 {bundle.currentClasses.length} 班
            {bundle.currentClasses.slice(0, 2).map((c) => (
              <span key={c.classId}> · {c.label.replace(/（.*）$/, "")}</span>
            ))}
            {bundle.currentClasses.length > 2 ? " …" : ""}
          </div>
        ) : (
          <div className="mt-1 text-xs text-muted-foreground">尚未報讀任何班別</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-lg font-semibold tabular-nums text-primary">{bundle.eligible.length}</div>
        <div className="text-[11px] text-muted-foreground">可報班</div>
      </div>
    </div>
  )
}

function EligibleList({ bundle }: { bundle: ClassMatchBundle }) {
  if (bundle.eligible.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
        目前沒有同時符合年級與時間的已註冊學生。
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {bundle.eligible.map((item) => (
        <li
          key={item.student.id}
          className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <div>
              <StudentMeta student={item.student} />
              {item.currentClasses.length > 0 ? (
                <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  <div className="text-muted-foreground/80">現有班別（無衝突）</div>
                  {item.currentClasses.map((c) => (
                    <div key={c.classId}>
                      {c.label} · {formatWeekdays(c.dayOfWeek)} {c.timeSlot}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1.5 text-xs text-muted-foreground">尚未報讀其他班別</div>
              )}
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" className="shrink-0" disabled>
            報讀（mock）
          </Button>
        </li>
      ))}
    </ul>
  )
}

function ExcludedList({ bundle }: { bundle: ClassMatchBundle }) {
  const [open, setOpen] = useState(false)
  if (bundle.excluded.length === 0) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        同齡但未能報讀（{bundle.excluded.length}）
      </button>
      {open ? (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-muted/40">
          {bundle.excluded.map((item) => (
            <li
              key={item.student.id}
              className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <StudentMeta student={item.student} />
              <div className="flex flex-wrap gap-1">
                {item.reasons.map((r) => (
                  <Tag key={r} tone={r === "時間衝突" ? "warning" : "default"} size="sm">
                    {REASON_LABEL[r]}
                  </Tag>
                ))}
              </div>
              {item.conflictWith ? (
                <div className="w-full text-xs text-warning sm:basis-full">
                  衝突：{item.conflictWith}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function FullTermRoster({ bundle }: { bundle: ClassMatchBundle }) {
  return (
    <div className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        目前全期報讀（{bundle.fullTermCount}）
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bundle.fullTermStudents.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground"
          >
            {s.fullName}
            <span className="ml-1 text-muted-foreground">{s.grade}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function EligibleClassesList({ bundle }: { bundle: StudentMatchBundle }) {
  if (bundle.eligible.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
        目前沒有符合其年級、且時段無衝突的可報班別。
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {bundle.eligible.map((item) => (
        <li
          key={item.cls.id}
          className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{item.cls.label}</span>
              <Tag tone="info" size="sm">
                {item.cls.subject}
              </Tag>
              {item.isHotFullTerm ? (
                <Tag tone="success" size="sm">
                  全期 {item.fullTermCount} 人
                </Tag>
              ) : (
                <Tag tone="default" size="sm">
                  全期 {item.fullTermCount} 人
                </Tag>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatWeekdays(item.cls.dayOfWeek)} {item.cls.timeSlot}
              </span>
              <span>{item.cls.teacherName}</span>
              <span>適用 {item.cls.grades.join("、")}</span>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" className="shrink-0" disabled>
            報讀（mock）
          </Button>
        </li>
      ))}
    </ul>
  )
}

function BlockedClassesList({ bundle }: { bundle: StudentMatchBundle }) {
  const [open, setOpen] = useState(false)
  if (bundle.blocked.length === 0) return null

  return (
    <div className="mt-3">
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        同年級但未能報讀（{bundle.blocked.length}）
      </button>
      {open ? (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border bg-muted/40">
          {bundle.blocked.map((item) => (
            <li key={item.cls.id} className="flex flex-col gap-1 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{item.cls.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatWeekdays(item.cls.dayOfWeek)} {item.cls.timeSlot}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.reasons.map((r) => (
                    <Tag key={r} tone={r === "時間衝突" ? "warning" : "default"} size="sm">
                      {REASON_LABEL[r]}
                    </Tag>
                  ))}
                </div>
              </div>
              {item.conflictWith ? (
                <div className="text-xs text-warning">衝突：{item.conflictWith}</div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ByClassPanel({
  bundles,
  selectedId,
  onSelect,
}: {
  bundles: ClassMatchBundle[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = bundles.find((b) => b.cls.id === selectedId) ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Users className="h-4 w-4" />
          符合門檻的班別
        </h2>
        <div className="space-y-2">
          {bundles.map((bundle) => {
            const active = bundle.cls.id === selectedId
            return (
              <button
                key={bundle.cls.id}
                type="button"
                onClick={() => onSelect(bundle.cls.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-3 transition",
                  active
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <ClassHeader bundle={bundle} expanded={active} />
              </button>
            )
          })}
            {bundles.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                沒有符合篩選條件的班別。
              </p>
            ) : null}
        </div>
      </section>

      <section className="min-h-[320px] rounded-lg border border-border bg-card p-4">
        {selected ? (
          <>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-foreground">{selected.cls.label}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatWeekdays(selected.cls.dayOfWeek)} {selected.cls.timeSlot} · 適用{" "}
                {selected.cls.grades.join("、")}
              </p>
            </div>
            <FullTermRoster bundle={selected} />
            <h3 className="mb-2 text-sm font-medium text-foreground">
              可報讀學生（{selected.eligible.length}）
            </h3>
            <EligibleList bundle={selected} />
            <ExcludedList bundle={selected} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">請選擇左側班別。</p>
        )}
      </section>
    </div>
  )
}

function ByStudentPanel({
  bundles,
  selectedId,
  onSelect,
}: {
  bundles: StudentMatchBundle[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = bundles.find((b) => b.student.id === selectedId) ?? null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="space-y-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <GraduationCap className="h-4 w-4" />
          已註冊學生
        </h2>
        <div className="space-y-2">
          {bundles.map((bundle) => {
            const active = bundle.student.id === selectedId
            return (
              <button
                key={bundle.student.id}
                type="button"
                onClick={() => onSelect(bundle.student.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-3 transition",
                  active
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <StudentHeader bundle={bundle} expanded={active} />
              </button>
            )
          })}
          {bundles.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
              沒有符合篩選條件的學生。
            </p>
          ) : null}
        </div>
      </section>

      <section className="min-h-[320px] rounded-lg border border-border bg-card p-4">
        {selected ? (
          <>
            <div className="mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {selected.student.fullName}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {selected.student.grade}
                </span>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {selected.student.studentCode} · {selected.student.englishName}
              </p>
            </div>

            {selected.currentClasses.length > 0 ? (
              <div className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  現有班別（{selected.currentClasses.length}）
                </div>
                <div className="space-y-0.5 text-xs text-foreground">
                  {selected.currentClasses.map((c) => (
                    <div key={c.classId}>
                      {c.label} · {formatWeekdays(c.dayOfWeek)} {c.timeSlot}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <h3 className="mb-2 text-sm font-medium text-foreground">
              可報班別（{selected.eligible.length}）
              <span className="ml-2 font-normal text-muted-foreground">年級合適 · 時段無衝突</span>
            </h3>
            <EligibleClassesList bundle={selected} />
            <BlockedClassesList bundle={selected} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">請選擇左側學生。</p>
        )}
      </section>
    </div>
  )
}

export function EligibleEnrollmentMatchPrototypeView() {
  const allClassBundles = useMemo(() => buildClassMatchBundles(1), [])
  const allStudentBundles = useMemo(() => buildStudentMatchBundles(2), [])

  const gradeOptions = useMemo(() => {
    const grades = [...new Set(allStudentBundles.map((b) => b.student.grade))]
    return grades.sort((a, b) => a.localeCompare(b, "zh-Hant"))
  }, [allStudentBundles])

  const [mode, setMode] = useState<ViewMode>("byClass")
  const [showRules, setShowRules] = useState(true)

  /** 按班別：全期報讀人數（可多選 1／2／3） */
  const [fullTermCounts, setFullTermCounts] = useState<Set<FullTermCountOption>>(
    () => new Set<FullTermCountOption>([1, 2, 3])
  )

  /** 按學生：年級（空 Set = 全部） */
  const [studentGrades, setStudentGrades] = useState<Set<string>>(() => new Set())
  /** 按學生：已有報讀 */
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("all")

  const classBundles = useMemo(() => {
    if (fullTermCounts.size === 0) return []
    return allClassBundles.filter((b) => {
      const n = b.fullTermCount as number
      if (n >= 1 && n <= 3) return fullTermCounts.has(n as FullTermCountOption)
      // 超過 3 人：勾選「3人」時一併顯示
      if (n > 3) return fullTermCounts.has(3)
      return false
    })
  }, [allClassBundles, fullTermCounts])

  const studentBundles = useMemo(() => {
    return allStudentBundles.filter((b) => {
      if (studentGrades.size > 0 && !studentGrades.has(b.student.grade)) return false
      const hasEnroll = b.currentClasses.length > 0
      if (enrollmentFilter === "none" && hasEnroll) return false
      if (enrollmentFilter === "has" && !hasEnroll) return false
      return true
    })
  }, [allStudentBundles, studentGrades, enrollmentFilter])

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  useEffect(() => {
    if (classBundles.length === 0) {
      setSelectedClassId(null)
      return
    }
    setSelectedClassId((prev) =>
      prev && classBundles.some((b) => b.cls.id === prev) ? prev : classBundles[0]!.cls.id
    )
  }, [classBundles])

  useEffect(() => {
    if (studentBundles.length === 0) {
      setSelectedStudentId(null)
      return
    }
    setSelectedStudentId((prev) =>
      prev && studentBundles.some((b) => b.student.id === prev)
        ? prev
        : studentBundles[0]!.student.id
    )
  }, [studentBundles])

  const classEligiblePairs = classBundles.reduce((n, b) => n + b.eligible.length, 0)
  const studentsWithOptions = studentBundles.filter((b) => b.eligible.length > 0).length
  const studentEligiblePairs = studentBundles.reduce((n, b) => n + b.eligible.length, 0)

  const toggleFullTermCount = (n: FullTermCountOption) => {
    setFullTermCounts((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  }

  const countLabel =
    fullTermCounts.size === 0
      ? "未選"
      : [...fullTermCounts]
          .sort((a, b) => a - b)
          .map((n) => `${n}人`)
          .join("／")

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
              <FlaskConical className="h-3.5 w-3.5" />
              沙盒 · 假資料
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              可報讀配對
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {mode === "byClass"
                ? "以班別為單位，依全期報讀人數篩選，列出年級合適、時段無衝突的已註冊學生。"
                : "以已註冊學生為單位，可按年級／已有報讀篩選，列出可報班別。"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ModeToggle mode={mode} onChange={setMode} />
            <Link
              to="/prototype/FrontDeskWizard"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              其他沙盒
            </Link>
          </div>
        </div>

        {mode === "byClass" ? (
          <FilterBar>
            <FilterChipGroup
              label="全期報讀人數"
              options={FULL_TERM_COUNT_OPTIONS.map((n) => ({
                value: n,
                label: `${n} 人`,
              }))}
              selected={fullTermCounts}
              onToggle={toggleFullTermCount}
            />
            <p className="text-[11px] text-muted-foreground">
              可多選。目前勾選：{countLabel}
              {fullTermCounts.has(3) ? "（含 3 人以上）" : ""}
            </p>
          </FilterBar>
        ) : (
          <FilterBar>
            <FilterChipGroup
              label="年級"
              options={gradeOptions.map((g) => ({ value: g, label: g }))}
              selected={studentGrades.size === 0 ? new Set(gradeOptions) : studentGrades}
              onToggle={(g) => {
                setStudentGrades((prev) => {
                  const effective =
                    prev.size === 0 ? new Set(gradeOptions) : new Set(prev)
                  if (effective.has(g)) effective.delete(g)
                  else effective.add(g)
                  if (effective.size === 0 || effective.size === gradeOptions.length) {
                    return new Set()
                  }
                  return effective
                })
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted-foreground">已有報讀</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { value: "all", label: "全部" },
                    { value: "none", label: "尚未報讀" },
                    { value: "has", label: "已有報讀" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={enrollmentFilter === opt.value}
                    onClick={() => setEnrollmentFilter(opt.value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition",
                      enrollmentFilter === opt.value
                        ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {studentGrades.size > 0 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => setStudentGrades(new Set())}
                >
                  清除年級篩選
                </button>
              ) : null}
            </div>
          </FilterBar>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {mode === "byClass" ? (
            <>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  目標班別
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {classBundles.length}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5" />
                  可報讀人次
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                  {classEligiblePairs}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5" />
                  全期人數
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{countLabel}</div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  篩選後學生
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {studentBundles.length}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5" />
                  有可報選項
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">
                  {studentsWithOptions}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  可報班人次
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {studentEligiblePairs}
                </div>
              </div>
            </>
          )}
        </div>

        {showRules ? (
          <div className="rounded-lg border border-info/20 bg-info/10 px-4 py-3 text-sm text-foreground">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">Mock 配對規則</div>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-muted-foreground">
                  {mode === "byClass" ? (
                    <>
                      <li>只看小組班；全期 =「報足全期」或「兩期全報」（單堂／單期不計）。</li>
                      <li>可用「全期報讀人數」篩選 1／2／3 人班別。</li>
                      <li>候選須為「已註冊」，且尚未就讀該班；年級與時段需合適。</li>
                    </>
                  ) : (
                    <>
                      <li>可按年級、是否已有報讀篩選學生。</li>
                      <li>可報班別：年級合適、尚未報讀、時段無衝突。</li>
                      <li>綠標「全期 N 人」= 全期報讀 &gt; 1。</li>
                    </>
                  )}
                </ol>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowRules(false)}>
                收起
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="text-xs text-info underline-offset-2 hover:underline"
            onClick={() => setShowRules(true)}
          >
            顯示配對規則
          </button>
        )}

        {mode === "byClass" ? (
          <ByClassPanel
            bundles={classBundles}
            selectedId={selectedClassId}
            onSelect={setSelectedClassId}
          />
        ) : (
          <ByStudentPanel
            bundles={studentBundles}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
          />
        )}
      </div>
    </div>
  )
}
