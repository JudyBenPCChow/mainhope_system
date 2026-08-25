import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  UserPlus,
  Users,
} from "lucide-react"

import { formatWeekdaysDisplay } from "@/components/classes/classesUi"
import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isPrimaryStudentGrade } from "@/lib/studentGrade"
import type {
  ClassMatchBundle,
  PromotionClassSummary,
  PromotionExclusionReason,
  PromotionStudentRow,
  StudentMatchBundle,
} from "@/lib/promotionMatch"
import { buildPromotionMatchWhatsAppMessage } from "@/lib/promotionMatchWhatsApp"
import { cn } from "@/lib/utils"
import { openWhatsAppWithPrefilledText } from "@/lib/whatsappReminder"
import { fetchPromotionMatchSnapshot } from "@/services/promotionMatchQueries"

type ViewMode = "byClass" | "byStudent"
type EnrollmentFilter = "all" | "none" | "has"
type PriorYearFilter = "all" | "has" | "none"
type ActivityFilter = "all" | "active" | "inactive"
type CandidateFilter = "all" | "formerSubject"

const FULL_TERM_COUNT_OPTIONS = [1, 2, 3] as const
type FullTermCountOption = (typeof FULL_TERM_COUNT_OPTIONS)[number]

const REASON_LABEL: Record<PromotionExclusionReason, string> = {
  非注冊: "非註冊",
  年級不合: "年級不合",
  時間衝突: "時間衝突",
  已報讀本班: "已報讀本班",
  已報讀同課程: "已報讀同科",
  已退讀本班: "已退讀本班",
}

function scheduleText(dayOfWeek: string | null, timeSlot: string | null): string {
  const day = formatWeekdaysDisplay(dayOfWeek)
  const slot = (timeSlot ?? "").trim()
  if (day && slot) return `${day} ${slot}`
  return day || slot || "—"
}

function studentListSummary(bundle: StudentMatchBundle): string {
  const parts: string[] = []
  if (bundle.summerClasses.length > 0) {
    parts.push(`暑期 ${bundle.summerClasses.length} 班`)
  }
  if (bundle.regularClasses.length > 0) {
    parts.push(`2627 已報 ${bundle.regularClasses.length} 班`)
  }
  if (parts.length === 0) return "尚未報讀 2627"
  const preview = [...bundle.summerClasses, ...bundle.regularClasses]
    .slice(0, 2)
    .map((c) => c.label)
  const extra =
    bundle.summerClasses.length + bundle.regularClasses.length > 2 ? " …" : ""
  return `${parts.join(" · ")}${preview.length ? ` · ${preview.join(" · ")}` : ""}${extra}`
}

function ClassSummaryBlock({
  title,
  classes,
}: {
  title: string
  classes: PromotionClassSummary[]
}) {
  if (classes.length === 0) return null
  return (
    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      <div>{title}</div>
      {classes.map((c) => (
        <div key={c.classId}>
          {c.label} · {scheduleText(c.dayOfWeek, c.timeSlot)}
        </div>
      ))}
    </div>
  )
}

function StudentMeta({ student }: { student: PromotionStudentRow }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-foreground">
        <Link
          to={`/Students/${student.id}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {student.fullName}
        </Link>
        {student.englishName ? (
          <span className="ml-2 font-normal text-muted-foreground">{student.englishName}</span>
        ) : null}
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {[student.studentCode, student.gradeLabel, student.contactPhone].filter(Boolean).join(" · ") ||
          "—"}
      </div>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
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
          {cls.grades.length > 0 ? (
            <Tag tone="default" size="sm">
              {cls.grades.join("、")}
            </Tag>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {scheduleText(cls.dayOfWeek, cls.timeSlot)}
          </span>
          {cls.teacherName ? <span>{cls.teacherName}</span> : null}
          <span>
            已報 {fullTermCount}
            {cls.capacity != null ? `/${cls.capacity}` : ""} 人
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
        <div className="mt-1 text-xs text-muted-foreground">
          {studentListSummary(bundle)}
        </div>
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
              {item.previouslyStudiedTargetSubject ? (
                <div className="mt-1.5">
                  <Tag tone="info" size="sm">
                    曾讀本科
                  </Tag>
                </div>
              ) : null}
              <ClassSummaryBlock title="暑期班別" classes={item.summerClasses} />
              <ClassSummaryBlock title="2627 已報" classes={item.regularClasses} />
              {item.summerClasses.length === 0 && item.regularClasses.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">尚未報讀 2627</div>
              ) : null}
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" className="shrink-0" asChild>
            <Link to={`/Students/${item.student.id}`}>前往學生</Link>
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
        目前 2627 已報讀（{bundle.fullTermCount}）
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bundle.fullTermStudents.map((s) => (
          <Link
            key={s.id}
            to={`/Students/${s.id}`}
            className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground hover:border-primary/40"
          >
            {s.fullName}
            <span className="ml-1 text-muted-foreground">{s.gradeLabel}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function EligibleClassesList({
  bundle,
  selectedClassIds,
  onToggle,
}: {
  bundle: StudentMatchBundle
  selectedClassIds: ReadonlySet<string>
  onToggle: (classId: string) => void
}) {
  if (bundle.eligible.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
        目前沒有符合其年級、且時段無衝突的可報班別。
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {bundle.eligible.map((item) => {
        const selected = selectedClassIds.has(item.cls.id)
        return (
          <li
            key={item.cls.id}
            className={cn(
              "flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between",
              selected && "bg-primary/5"
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/Classes/${item.cls.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {item.cls.label}
                </Link>
                <Tag tone="info" size="sm">
                  {item.cls.subject}
                </Tag>
                <Tag tone={item.isHotFullTerm ? "success" : "default"} size="sm">
                  已報 {item.fullTermCount} 人
                </Tag>
                {item.previouslyStudiedTargetSubject ? (
                  <Tag tone="info" size="sm">
                    曾讀本科
                  </Tag>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {scheduleText(item.cls.dayOfWeek, item.cls.timeSlot)}
                </span>
                {item.cls.teacherName ? <span>{item.cls.teacherName}</span> : null}
                {item.cls.grades.length > 0 ? (
                  <span>適用 {item.cls.grades.join("、")}</span>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selected}
                  onChange={() => onToggle(item.cls.id)}
                />
                加入推薦
              </label>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to={`/Classes/${item.cls.id}`}>前往班別</Link>
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function recommendationSignature(classIds: ReadonlySet<string>): string {
  return [...classIds].sort().join(",")
}

function selectedPromotionClasses(
  bundle: StudentMatchBundle,
  classIds: ReadonlySet<string>
) {
  return bundle.eligible
    .filter((item) => classIds.has(item.cls.id))
    .map((item) => ({
      label: item.cls.label,
      subject: item.cls.subject,
      dayOfWeek: item.cls.dayOfWeek,
      timeSlot: item.cls.timeSlot,
      schedule:
        item.cls.dayOfWeek || item.cls.timeSlot
          ? scheduleText(item.cls.dayOfWeek, item.cls.timeSlot)
          : null,
      teacherName: item.cls.teacherName,
    }))
}

function StudentPromotionWorkspace({ bundle }: { bundle: StudentMatchBundle }) {
  const { pushBanner } = useAppBanner()
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(() => new Set())
  const [generatedSignature, setGeneratedSignature] = useState("")

  const buildMessage = useCallback(
    (classIds: ReadonlySet<string>) =>
      buildPromotionMatchWhatsAppMessage({
        studentName: bundle.student.fullName,
        gradeLabel: bundle.student.gradeLabel,
        studiedSummer: bundle.student.activeIn26SM,
        classes: selectedPromotionClasses(bundle, classIds),
      }),
    [bundle]
  )
  const [draft, setDraft] = useState(() => buildMessage(new Set<string>()))

  const selectedSignature = recommendationSignature(selectedClassIds)
  const messageOutOfDate = selectedSignature !== generatedSignature
  const selectedCount = selectedClassIds.size
  const phone = bundle.student.contactPhone?.trim() ?? ""

  const toggleClass = (classId: string) => {
    setSelectedClassIds((current) => {
      const next = new Set(current)
      if (next.has(classId)) next.delete(classId)
      else next.add(classId)
      return next
    })
  }

  const regenerateMessage = () => {
    setDraft(buildMessage(selectedClassIds))
    setGeneratedSignature(selectedSignature)
  }

  const openWhatsApp = () => {
    if (!phone || selectedCount === 0 || !draft.trim()) return
    const opened = openWhatsAppWithPrefilledText(phone, draft.trim())
    if (!opened) {
      pushBanner({
        tone: "warning",
        title: "無法開啟 WhatsApp",
        message: "請檢查學生聯絡電話格式後再試。",
      })
    }
  }

  const whatsAppDisabled = !phone || selectedCount === 0 || !draft.trim()
  const whatsAppTitle = !phone
    ? "此學生沒有聯絡電話"
    : selectedCount === 0
      ? "請先選擇至少一個推薦班別"
      : !draft.trim()
        ? "請先填寫宣傳文案"
        : undefined

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">
          可報班別（{bundle.eligible.length}）
          <span className="ml-2 font-normal text-muted-foreground">年級合適 · 時段無衝突</span>
        </h3>
        <span className="text-xs font-medium text-primary">已選 {selectedCount} 個推薦</span>
      </div>
      <EligibleClassesList
        bundle={bundle}
        selectedClassIds={selectedClassIds}
        onToggle={toggleClass}
      />

      <section className="mt-4 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">建議宣傳文案</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {bundle.student.activeIn26SM
                ? "暑期有讀稿；可直接修改。切換學生時會重新開始。"
                : "暑期無讀稿；可直接修改。切換學生時會重新開始。"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedCount === 0}
            onClick={regenerateMessage}
          >
            <RotateCcw />
            按已選班別重新產生
          </Button>
        </div>

        {messageOutOfDate ? (
          <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            推薦班別已變更。你可自行更新文案，或按「重新產生」套用最新選擇。
          </p>
        ) : null}

        <Textarea
          className="mt-3 min-h-[220px] resize-y bg-background"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`${bundle.student.fullName}的建議宣傳文案`}
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {phone ? `將傳送至 ${phone}` : "此學生未有聯絡電話，請先到學生資料補充。"}
            </p>
            <p className="text-xs text-muted-foreground">
              發送時請同時附上小冊子檔案（系統只預填文字）。
            </p>
          </div>
          <Button
            type="button"
            variant="success"
            disabled={whatsAppDisabled}
            title={whatsAppTitle}
            onClick={openWhatsApp}
          >
            <MessageCircle />
            WhatsApp
          </Button>
        </div>
      </section>
    </>
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
                    {scheduleText(item.cls.dayOfWeek, item.cls.timeSlot)}
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
          符合條件的班別
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
              <h2 className="text-base font-semibold text-foreground">
                <Link to={`/Classes/${selected.cls.id}`} className="hover:underline">
                  {selected.cls.label}
                </Link>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {scheduleText(selected.cls.dayOfWeek, selected.cls.timeSlot)}
                {selected.cls.grades.length > 0 ? ` · 適用 ${selected.cls.grades.join("、")}` : ""}
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
                <Link to={`/Students/${selected.student.id}`} className="hover:underline">
                  {selected.student.fullName}
                </Link>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {selected.student.gradeLabel}
                </span>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[selected.student.studentCode, selected.student.englishName]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>

            {selected.summerClasses.length > 0 || selected.regularClasses.length > 0 ? (
              <div className="mb-3 space-y-2">
                {selected.summerClasses.length > 0 ? (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      暑期班別（{selected.summerClasses.length}）
                    </div>
                    <div className="space-y-0.5 text-xs text-foreground">
                      {selected.summerClasses.map((c) => (
                        <div key={c.classId}>
                          <Link to={`/Classes/${c.classId}`} className="hover:underline">
                            {c.label}
                          </Link>
                          {" · "}
                          {scheduleText(c.dayOfWeek, c.timeSlot)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selected.regularClasses.length > 0 ? (
                  <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      2627 已報（{selected.regularClasses.length}）
                    </div>
                    <div className="space-y-0.5 text-xs text-foreground">
                      {selected.regularClasses.map((c) => (
                        <div key={c.classId}>
                          <Link to={`/Classes/${c.classId}`} className="hover:underline">
                            {c.label}
                          </Link>
                          {" · "}
                          {scheduleText(c.dayOfWeek, c.timeSlot)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <StudentPromotionWorkspace key={selected.student.id} bundle={selected} />
            <BlockedClassesList bundle={selected} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">請選擇左側學生。</p>
        )}
      </section>
    </div>
  )
}

export function PromotionMatchView() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [allClassBundles, setAllClassBundles] = useState<ClassMatchBundle[]>([])
  const [allStudentBundles, setAllStudentBundles] = useState<StudentMatchBundle[]>([])

  const [mode, setMode] = useState<ViewMode>("byStudent")
  const [fullTermCounts, setFullTermCounts] = useState<Set<FullTermCountOption>>(
    () => new Set()
  )
  const [studentGrades, setStudentGrades] = useState<Set<string>>(() => new Set())
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("all")
  const [priorYearFilter, setPriorYearFilter] = useState<PriorYearFilter>("all")
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [candidateFilter, setCandidateFilter] = useState<CandidateFilter>("formerSubject")
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const snap = await fetchPromotionMatchSnapshot()
      setAllClassBundles(snap.classBundles)
      setAllStudentBundles(snap.studentBundles)
    } catch (e) {
      reportUserFacingError(e, {
        source: "PromotionMatchView.load",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const gradeOptions = useMemo(() => {
    const grades = [
      ...new Set(
        allStudentBundles
          .map((b) => b.student.gradeLabel)
          .filter((grade) => !isPrimaryStudentGrade(grade))
      ),
    ]
    return grades.sort((a, b) => a.localeCompare(b, "zh-Hant"))
  }, [allStudentBundles])

  const classBundles = useMemo(() => {
    const byClassSize =
      fullTermCounts.size === 0
        ? allClassBundles
        : allClassBundles.filter((b) => {
            const n = b.fullTermCount
            if (n >= 1 && n <= 3) return fullTermCounts.has(n as FullTermCountOption)
            if (n > 3) return fullTermCounts.has(3)
            return false
          })
    if (candidateFilter === "all") return byClassSize
    return byClassSize.map((bundle) => ({
      ...bundle,
      eligible: bundle.eligible.filter(
        (item) =>
          item.previouslyStudiedTargetSubject && !item.currentlyStudiesTargetSubject
      ),
    }))
  }, [allClassBundles, fullTermCounts, candidateFilter])

  const studentBundles = useMemo(() => {
    return allStudentBundles.filter((b) => {
      if (studentGrades.size > 0 && !studentGrades.has(b.student.gradeLabel)) return false
      const hasEnroll = b.regularClasses.length > 0
      if (enrollmentFilter === "none" && hasEnroll) return false
      if (enrollmentFilter === "has" && !hasEnroll) return false
      if (priorYearFilter === "has" && !b.student.enrolledIn2526) return false
      if (priorYearFilter === "none" && b.student.enrolledIn2526) return false
      if (activityFilter === "active" && !b.student.activeIn26SM) return false
      if (activityFilter === "inactive" && b.student.activeIn26SM) return false
      return true
    })
  }, [allStudentBundles, studentGrades, enrollmentFilter, priorYearFilter, activityFilter])

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

  const countLabel =
    fullTermCounts.size === 0
      ? "全部"
      : [...fullTermCounts]
          .sort((a, b) => a - b)
          .map((n) => `${n}人`)
          .join("／")

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            宣傳配對
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {mode === "byClass"
              ? "以 2627 常規專科班為單位，找出年級合適、時段無衝突的已註冊學生。預設顯示暑期曾讀本科、尚未報讀該科的學生。"
              : "以已註冊學生為單位，按年級／2526／2627／暑期報讀篩選，列出可宣傳跟進的 2627 班別。"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            重新整理
          </Button>
        </div>
      </div>

      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}

      {loading && allClassBundles.length === 0 ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <>
          {mode === "byClass" ? (
            <FilterBar>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    2627 已報讀人數
                  </label>
                  <MultiSelect
                    value={[...fullTermCounts].map(String)}
                    options={FULL_TERM_COUNT_OPTIONS.map((n) => ({
                      value: String(n),
                      label: `${n} 人`,
                    }))}
                    placeholder="全部人數"
                    onChange={(next) => {
                      const valid = next
                        .map(Number)
                        .filter((n): n is FullTermCountOption =>
                          FULL_TERM_COUNT_OPTIONS.includes(n as FullTermCountOption)
                        )
                      setFullTermCounts(new Set(valid))
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    宣傳對象
                  </label>
                  <Select
                    value={candidateFilter}
                    onChange={(e) => setCandidateFilter(e.target.value as CandidateFilter)}
                  >
                    <option value="all">全部可報讀學生</option>
                    <option value="formerSubject">曾讀本科、現未讀本科</option>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                未選代表全部；可按需要多選。目前篩選：{countLabel}
                {fullTermCounts.has(3) ? "（含 3 人以上）" : ""}
                。人數為該 2627 班就讀中報讀。「曾讀本科」= 26SM 就讀中同科；「現未讀本科」= 尚未報讀 2627 該科。
              </p>
            </FilterBar>
          ) : (
            <FilterBar>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    年級
                  </label>
                  <MultiSelect
                    value={[...studentGrades]}
                    options={gradeOptions.map((g) => ({ value: g, label: g }))}
                    placeholder="全部年級"
                    onChange={(next) => setStudentGrades(new Set(next))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    2526 報讀
                  </label>
                  <Select
                    value={priorYearFilter}
                    onChange={(e) => setPriorYearFilter(e.target.value as PriorYearFilter)}
                  >
                    <option value="all">全部</option>
                    <option value="has">有報讀 2526</option>
                    <option value="none">無報讀 2526</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    2627 報讀
                  </label>
                  <Select
                    value={enrollmentFilter}
                    onChange={(e) => setEnrollmentFilter(e.target.value as EnrollmentFilter)}
                  >
                    <option value="all">全部</option>
                    <option value="none">尚未報讀 2627</option>
                    <option value="has">已報讀 2627</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    暑期報讀
                  </label>
                  <Select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
                  >
                    <option value="all">全部</option>
                    <option value="active">暑期有讀</option>
                    <option value="inactive">暑期無讀</option>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                年級未選代表全部。「有報讀 2526」＝ Notion 舊科目或系統 2526 班報讀；「暑期有讀」＝ 26SM
                有就讀中專科報讀。
              </p>
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
                    已報讀人數
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
        </>
      )}
    </div>
  )
}
