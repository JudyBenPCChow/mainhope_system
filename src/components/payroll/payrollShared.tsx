import { ChevronDown, ChevronRight } from "lucide-react"
import { Fragment, useMemo, useState } from "react"

import { Tag } from "@/components/ui/tag"
import { payrollModeLabel } from "@/lib/payroll/modeLabel"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
  classAmount,
  classBillableHc,
  classKindLabel,
  classNoShowTotal,
  classNonBillableLeaveTotal,
  classNotRolledCount,
  classPresentTotal,
  formatHkd,
  gradeAmount,
  gradeBillableHc,
  gradeLessonCount,
  isPresentStatus,
  lessonNoShowCount,
  lessonNonBillableLeaveCount,
  lessonPresentCount,
  mpfBandSteps,
  statusLabel,
  studentHcStatusLabel,
  teacherBillableHc,
  teacherCategoryHierarchy,
  teacherNonBillableLeaveTotal,
  teacherNoShowTotal,
  teacherNotRolledCount,
  teacherPresentTotal,
  type CalcVersionMeta,
  type PayrollClassBlock,
  type PayrollLesson,
  type PayrollRunStatus,
  type PayrollTeacherRow,
} from "./mockData"

export type LessonVerifyTarget = {
  lesson: PayrollLesson
  className: string
  classId?: string
  teacherId: string
  teacherName: string
}

export function statusTag(status: PayrollRunStatus) {
  const label = statusLabel(status)
  if (status === "已結算") return <Tag tone={statusToTagTone("已結算")}>{label}</Tag>
  if (status === "待管理層核實") return <Tag tone={statusToTagTone("待審核")}>{label}</Tag>
  if (status === "財務審閱中") return <Tag tone={statusToTagTone("審閱")}>{label}</Tag>
  return <Tag tone={statusToTagTone("草稿")}>{label}</Tag>
}

export function VersionBar({
  calc,
  onViewDiff,
}: {
  calc?: CalcVersionMeta
  onViewDiff?: () => void
}) {
  if (!calc) return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <span>
        資料截至 <span className="font-medium text-foreground">{calc.dataCutoffAt}</span>
      </span>
      <span aria-hidden>·</span>
      <span>
        計算版本{" "}
        <span className="font-medium text-foreground">#{calc.version}</span>（
        {calc.computedAt}）
      </span>
      {calc.previousVersion != null ? (
        <>
          <span aria-hidden>·</span>
          <span>
            前版 #{calc.previousVersion}
            {calc.previousComputedAt ? `（${calc.previousComputedAt}）` : ""}
          </span>
          {onViewDiff ? (
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={onViewDiff}
            >
              查看差異
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function SummaryTile({
  label,
  value,
  hint,
  warn,
  onClick,
  selected,
}: {
  label: string
  value: string
  hint?: string
  warn?: boolean
  /** 可點時對齊 MgmtStatCard 互動（hover／focus ring） */
  onClick?: () => void
  selected?: boolean
}) {
  const className = cn(
    "flex h-full w-full flex-col rounded-xl border bg-card px-4 py-3 text-left shadow-sm",
    warn ? "border-warning/40" : "border-border",
    onClick &&
      "cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected && "ring-2 ring-primary/40"
  )
  const body = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}

function LessonCard({
  lesson,
  className,
  classId,
  teacherId,
  teacherName,
  highlight,
  onVerify,
  onRemindRollcall,
}: {
  lesson: PayrollLesson
  className: string
  classId?: string
  teacherId: string
  teacherName: string
  highlight?: boolean
  onVerify?: (target: LessonVerifyTarget) => void
  onRemindRollcall?: (target: LessonVerifyTarget) => void
}) {
  const present = lessonPresentCount(lesson)
  const noShow = lessonNoShowCount(lesson)
  const leave = lessonNonBillableLeaveCount(lesson)
  const rows = lesson.studentRows ?? []
  const presentRows = rows.filter((r) => isPresentStatus(r.status))
  const absentBillable = rows.filter((r) => r.status === "no_show")
  const absentNonBillable = rows.filter(
    (r) => r.status === "sick" || r.status === "personal"
  )
  const roster = lesson.rosterCount ?? rows.length
  const target: LessonVerifyTarget = { lesson, className, classId, teacherId, teacherName }

  return (
    <div
      id={`lesson-${lesson.id}`}
      className={cn(
        "rounded-lg border bg-muted/20 px-3 py-3 scroll-mt-28",
        highlight ? "border-warning ring-2 ring-warning/40" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium tabular-nums text-foreground">
          {lesson.date}
          <span className="ml-2 font-normal text-muted-foreground">
            {lesson.startTime}–{lesson.endTime}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lesson.notRolled ? (
            <Tag tone="warning" size="sm">
              未點名
            </Tag>
          ) : (
            <>
              <span className="tabular-nums text-foreground">
                計薪 {lesson.billableHc}
                {roster > 0 ? `／名冊 ${roster}` : ""} 人
              </span>
              <span className="tabular-nums text-muted-foreground">
                到課 {present} · no show {noShow} · 不扣堂請假 {leave}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatHkd(lesson.amount)}
              </span>
            </>
          )}
          {lesson.substitute === "given" ? (
            <Tag tone="info" size="sm">
              代入（代 {lesson.substitutePeer}）
            </Tag>
          ) : null}
          {lesson.substitute === "received" ? (
            <Tag tone="warning" size="sm">
              代出（{lesson.substitutePeer}）
            </Tag>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="text-xs font-medium text-foreground underline-offset-2 hover:underline"
          onClick={() => onVerify?.(target)}
        >
          查證排程／點名表
        </button>
        {lesson.notRolled && onRemindRollcall ? (
          <button
            type="button"
            className="text-xs font-medium text-warning underline-offset-2 hover:underline"
            onClick={() => onRemindRollcall(target)}
          >
            發送點名提醒
          </button>
        ) : null}
      </div>

      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {lesson.classTypeSnapshot ? <p>班型：{lesson.classTypeSnapshot}</p> : null}
        {lesson.subject ? <p>科目：{lesson.subject}</p> : null}
        {lesson.listPrice != null ? (
          <p>
            原價基數：{formatHkd(lesson.listPrice)}
            {lesson.listPriceAsOf ? `（${lesson.listPriceAsOf}）` : ""}
            {roster > lesson.billableHc
              ? ` · 已剔除不扣堂缺席 ${roster - lesson.billableHc} 人`
              : ""}
          </p>
        ) : null}
        {lesson.poolDisposition && lesson.poolDisposition !== "n/a" ? (
          <p>
            分成池：
            {lesson.poolDisposition === "in_pool" ? "納入" : "排除"}
            {lesson.poolDispositionReason ? ` — ${lesson.poolDispositionReason}` : ""}
          </p>
        ) : lesson.poolDispositionReason ? (
          <p>{lesson.poolDispositionReason}</p>
        ) : null}
        {lesson.eventTimeline ? <p>本節事件：{lesson.eventTimeline}</p> : null}
      </div>

      {lesson.formula ? (
        <p className="mt-1 text-xs font-medium text-foreground">計法：{lesson.formula}</p>
      ) : null}
      {lesson.rateSource ? (
        <p className="mt-0.5 text-xs text-muted-foreground">費率來源：{lesson.rateSource}</p>
      ) : null}
      {lesson.note ? <p className="mt-1 text-xs text-muted-foreground">{lesson.note}</p> : null}

      {lesson.notRolled ? (
        <p className="mt-2 text-sm text-muted-foreground">
          尚無點名紀錄，未計入薪酬。可發送點名提醒予授課老師。
        </p>
      ) : rows.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="overflow-x-auto rounded-md border border-border/70">
            <p className="border-b border-border bg-muted/40 px-2 py-1.5 text-xs font-medium">
              出席（現場／Zoom／錄影）· 計入
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto px-2 py-2 text-xs">
              {presentRows.length === 0 ? (
                <li className="text-muted-foreground">—</li>
              ) : (
                presentRows.map((r) => (
                  <li key={`p-${r.name}`} className="flex justify-between gap-2">
                    <span>{r.name}</span>
                    <Tag tone={statusToTagTone(r.status)} size="sm">
                      {studentHcStatusLabel(r.status)}
                    </Tag>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="space-y-2">
            <div className="overflow-x-auto rounded-md border border-border/70">
              <p className="border-b border-border bg-muted/40 px-2 py-1.5 text-xs font-medium">
                缺席 · 照扣堂（no show）
              </p>
              <ul className="px-2 py-2 text-xs">
                {absentBillable.length === 0 ? (
                  <li className="text-muted-foreground">—</li>
                ) : (
                  absentBillable.map((r) => (
                    <li key={`ab-${r.name}`} className="flex justify-between gap-2">
                      <span>{r.name}</span>
                      <span className="text-foreground">✓ 計入人頭</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="overflow-x-auto rounded-md border border-warning/30">
              <p className="border-b border-border bg-warning/10 px-2 py-1.5 text-xs font-medium">
                缺席 · 不扣堂（病假／事假）
              </p>
              <ul className="px-2 py-2 text-xs">
                {absentNonBillable.length === 0 ? (
                  <li className="text-muted-foreground">—</li>
                ) : (
                  absentNonBillable.map((r) => (
                    <li key={`an-${r.name}`} className="flex justify-between gap-2">
                      <span>{r.name}</span>
                      <span className="text-muted-foreground">
                        {studentHcStatusLabel(r.status)} · 不計費
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ClassDetail({
  block,
  teacherId,
  teacherName,
  highlightLessonIds,
  onVerify,
  onRemindRollcall,
}: {
  block: PayrollClassBlock
  teacherId: string
  teacherName: string
  highlightLessonIds?: ReadonlySet<string>
  onVerify?: (target: LessonVerifyTarget) => void
  onRemindRollcall?: (target: LessonVerifyTarget) => void
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{block.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {classKindLabel(block.classKind)} · {block.lessons.length} 堂 · 扣堂{" "}
            {classBillableHc(block)} 人次 · 到課 {classPresentTotal(block)} · no show{" "}
            {classNoShowTotal(block)} · 不扣堂請假 {classNonBillableLeaveTotal(block)}
            {classNotRolledCount(block) > 0 ? ` · 未點名 ${classNotRolledCount(block)} 堂` : ""}{" "}
            · 小計 {formatHkd(classAmount(block))}
          </p>
        </div>
        <Tag tone={block.classKind === "private" ? "info" : "default"} size="sm">
          {classKindLabel(block.classKind)}
        </Tag>
      </div>
      <div className="mt-3 space-y-2">
        {block.lessons.map((l) => (
          <LessonCard
            key={l.id}
            lesson={l}
            className={block.name}
            classId={block.id}
            teacherId={teacherId}
            teacherName={teacherName}
            highlight={highlightLessonIds?.has(l.id)}
            onVerify={onVerify}
            onRemindRollcall={onRemindRollcall}
          />
        ))}
      </div>
    </section>
  )
}

export function SplitAuditPanel({ teacher }: { teacher: PayrollTeacherRow }) {
  if (!teacher.personalSplit && !teacher.commissionPool) return null
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">分成核對（原價基數 · 歷史價）</h3>
      <p className="text-xs text-muted-foreground">
        原價取自各節課堂當日 course price 快照，非今日價。
      </p>
      {teacher.personalSplit ? (
        <div className="text-sm">
          <p className="font-medium">個人授課</p>
          <p className="text-muted-foreground">
            原價合計 {formatHkd(teacher.personalSplit.listPriceTotal)} ×{" "}
            {Math.round(teacher.personalSplit.rate * 100)}% ={" "}
            <span className="font-semibold text-foreground">
              {formatHkd(teacher.personalSplit.amount)}
            </span>
          </p>
        </div>
      ) : null}
      {teacher.commissionPool ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium">{teacher.commissionPool.label}</p>
          <p className="text-muted-foreground">
            納入原價合計 {formatHkd(teacher.commissionPool.listPriceTotal)} ×{" "}
            {Math.round(teacher.commissionPool.rate * 100)}% ={" "}
            <span className="font-semibold text-foreground">
              {formatHkd(teacher.commissionPool.amount)}
            </span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2">授課教師</th>
                  <th className="px-2 py-2">班／科目</th>
                  <th className="px-2 py-2">日期</th>
                  <th className="px-2 py-2">原價</th>
                  <th className="px-2 py-2">池</th>
                </tr>
              </thead>
              <tbody>
                {teacher.commissionPool.items.map((it, i) => (
                  <tr
                    key={`${it.teacherName}-${it.date}-${i}`}
                    className={cn(
                      "border-b border-border last:border-0",
                      !it.included ? "bg-muted/30 text-muted-foreground" : null
                    )}
                  >
                    <td className="px-2 py-2">{it.teacherName}</td>
                    <td className="px-2 py-2">
                      {it.className}
                      {it.subject ? (
                        <span className="block text-xs">科目：{it.subject}</span>
                      ) : null}
                      {it.reason ? (
                        <span className="block text-xs text-warning">{it.reason}</span>
                      ) : null}
                      {it.listPriceAsOf ? (
                        <span className="block text-xs">{it.listPriceAsOf}</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 tabular-nums">{it.date}</td>
                    <td className="px-2 py-2 tabular-nums font-medium">
                      {formatHkd(it.listPrice)}
                    </td>
                    <td className="px-2 py-2">
                      {it.included ? (
                        <Tag tone="success" size="sm">
                          納入
                        </Tag>
                      ) : (
                        <Tag tone="warning" size="sm">
                          排除
                        </Tag>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ModeStreamsPanel({ teacher }: { teacher: PayrollTeacherRow }) {
  if (!teacher.modeStreams?.length) return null
  return (
    <div className="space-y-2 rounded-xl border border-info/35 bg-info/5 px-3 py-3 sm:px-4">
      <h3 className="text-sm font-semibold">跨模式拆分</h3>
      <ul className="space-y-2 text-sm">
        {teacher.modeStreams.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
          >
            <div>
              <p className="font-medium">
                {s.label}{" "}
                <Tag tone="default" size="sm">
                  {payrollModeLabel(s.mode)}
                </Tag>
              </p>
              <p className="text-xs text-muted-foreground">{s.detail}</p>
            </div>
            <p className="font-semibold tabular-nums">{formatHkd(s.amount)}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        合計 {formatHkd(teacher.modeStreams.reduce((n, s) => n + s.amount, 0))}（應對齊總薪酬）
      </p>
    </div>
  )
}

export function SalaryEvidencePanel({ teacher }: { teacher: PayrollTeacherRow }) {
  if (!teacher.salaryEvidence) return null
  const e = teacher.salaryEvidence
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-sm sm:px-4">
      <h3 className="text-sm font-semibold">固定月薪適用證據</h3>
      <p className="mt-1 text-muted-foreground">
        {formatHkd(e.amount)} · 自 {e.effectiveFrom} 起
        {e.effectiveTo ? ` 至 ${e.effectiveTo}` : "（無結束日）"}
      </p>
      <p className="mt-1 text-muted-foreground">本月狀態：{e.monthStatus}</p>
      <p className="mt-1 font-medium">→ 本月薪酬：{formatHkd(e.amount)}</p>
    </div>
  )
}

export function TeacherLessonStats({
  teacher,
  compact,
  highlightLessonIds,
  onVerify,
  onRemindRollcall,
  onJumpNotRolled,
}: {
  teacher: PayrollTeacherRow
  compact?: boolean
  highlightLessonIds?: ReadonlySet<string>
  onVerify?: (target: LessonVerifyTarget) => void
  onRemindRollcall?: (target: LessonVerifyTarget) => void
  onJumpNotRolled?: () => void
}) {
  if (teacher.grades.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        此同事本月無授課排程統計（固定月薪／在家工作時薪／無堂 $0 等）。薪酬見下方明細。
      </p>
    )
  }

  return (
    <TeacherLessonStatsBody
      key={teacher.id}
      teacher={teacher}
      compact={compact}
      highlightLessonIds={highlightLessonIds}
      onVerify={onVerify}
      onRemindRollcall={onRemindRollcall}
      onJumpNotRolled={onJumpNotRolled}
    />
  )
}

function TeacherLessonStatsBody({
  teacher,
  compact,
  highlightLessonIds,
  onVerify,
  onRemindRollcall,
  onJumpNotRolled,
}: {
  teacher: PayrollTeacherRow
  compact?: boolean
  highlightLessonIds?: ReadonlySet<string>
  onVerify?: (target: LessonVerifyTarget) => void
  onRemindRollcall?: (target: LessonVerifyTarget) => void
  onJumpNotRolled?: () => void
}) {
  const hierarchy = useMemo(() => teacherCategoryHierarchy(teacher), [teacher])
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(hierarchy.filter((h) => h.children.length > 0).map((h) => h.category.key))
  )

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const cats = hierarchy.map((h) => h.category)

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">類別／年級</th>
              <th className="px-3 py-2.5 font-medium">班數</th>
              <th className="px-3 py-2.5 font-medium">堂數</th>
              <th className="px-3 py-2.5 font-medium">扣堂人次</th>
              <th className="px-3 py-2.5 font-medium">實際到課</th>
              <th className="px-3 py-2.5 font-medium">no show</th>
              <th className="px-3 py-2.5 font-medium">不扣堂請假</th>
              <th className="px-3 py-2.5 font-medium">未點名</th>
              <th className="px-3 py-2.5 font-medium">薪酬小計</th>
            </tr>
          </thead>
          <tbody>
            {hierarchy.map(({ category: b, children }) => {
              const canExpand = children.length > 0
              const open = canExpand && expandedKeys.has(b.key)
              return (
                <Fragment key={b.key}>
                  <tr
                    className={cn(
                      "border-b border-border",
                      canExpand ? "bg-muted/15" : undefined
                    )}
                  >
                    <td className="px-3 py-2.5">
                      {canExpand ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 font-semibold text-foreground"
                          aria-expanded={open}
                          onClick={() => toggle(b.key)}
                        >
                          {open ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          )}
                          {b.label}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {children.length} 個年級
                          </span>
                        </button>
                      ) : (
                        <span className="pl-5 font-medium text-muted-foreground">{b.label}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium">{b.classCount}</td>
                    <td className="px-3 py-2.5 tabular-nums font-medium">{b.lessonCount}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold">{b.billableHc}</td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {b.presentVisits}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {b.noShowVisits}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {b.nonBillableLeaveVisits}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {b.notRolledCount}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold">
                      {formatHkd(b.amount)}
                    </td>
                  </tr>
                  {open
                    ? children.map((r) => (
                        <tr
                          key={`${b.key}-${r.gradeLabel}-${r.classKind}`}
                          className="border-b border-border bg-background"
                        >
                          <td className="px-3 py-2 pl-10 text-muted-foreground">
                            <span className="font-medium text-foreground">{r.gradeLabel}</span>
                            <span className="ml-1.5 text-xs">{classKindLabel(r.classKind)}</span>
                          </td>
                          <td className="px-3 py-2 tabular-nums">{r.classCount}</td>
                          <td className="px-3 py-2 tabular-nums">{r.lessonCount}</td>
                          <td className="px-3 py-2 tabular-nums font-semibold">{r.billableHc}</td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {r.presentVisits}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {r.noShowVisits}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {r.nonBillableLeaveVisits}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {r.notRolledCount}
                          </td>
                          <td className="px-3 py-2 tabular-nums font-semibold">
                            {formatHkd(r.amount)}
                          </td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              )
            })}
            <tr className="bg-muted/25">
              <td className="px-3 py-2.5 font-semibold">合計</td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {cats.reduce((s, c) => s + c.classCount, 0)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {cats.reduce((s, c) => s + c.lessonCount, 0)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherBillableHc(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherPresentTotal(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherNoShowTotal(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherNonBillableLeaveTotal(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherNotRolledCount(teacher) > 0 && onJumpNotRolled ? (
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline"
                    onClick={onJumpNotRolled}
                  >
                    {teacherNotRolledCount(teacher)} 堂
                  </button>
                ) : (
                  `${teacherNotRolledCount(teacher)} 堂`
                )}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {formatHkd(cats.reduce((s, c) => s + c.amount, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        扣堂人次＝實際到課＋no show＋請假而不需補回。舊狀態「出席」計入實際到課，「請假」計入不扣堂請假。此欄與出席紀錄頁的「出席／缺席」不是同一套數字。
      </p>

      {!compact
        ? teacher.grades.map((g) => (
            <div key={g.gradeLabel} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
                <h3 className="text-base font-semibold text-foreground">{g.gradeLabel}</h3>
                <p className="text-xs text-muted-foreground">
                  扣堂 {gradeBillableHc(g)} 人次 · {g.classes.length} 班 · {gradeLessonCount(g)}{" "}
                  堂 · 小計 {formatHkd(gradeAmount(g))}
                </p>
              </div>
              {g.classes.map((c) => (
                <ClassDetail
                  key={`${g.gradeLabel}-${c.id}-${c.classKind}`}
                  block={c}
                  teacherId={teacher.id}
                  teacherName={teacher.name}
                  highlightLessonIds={highlightLessonIds}
                  onVerify={onVerify}
                  onRemindRollcall={onRemindRollcall}
                />
              ))}
            </div>
          ))
        : null}
    </div>
  )
}

export function TeacherPayFooter({ teacher }: { teacher: PayrollTeacherRow }) {
  const mpf = ["Mark Yu", "Christine Fan", "Sophie Yu", "Katie Lee"].includes(teacher.name)
    ? mpfBandSteps(teacher.gross)
    : null
  const momDetail =
    teacher.previousGross != null && teacher.gross != null
      ? teacher.gross - teacher.previousGross
      : null

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">薪酬結算</h3>
      {teacher.lines.length > 0 ? (
        <ul className="space-y-2">
          {teacher.lines.map((line) => (
            <li
              key={`${teacher.id}-${line.label}`}
              className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground">{line.label}</p>
                {line.note ? <p className="text-xs text-muted-foreground">{line.note}</p> : null}
              </div>
              <p
                className={cn(
                  "tabular-nums font-medium",
                  line.amount < 0 ? "text-destructive" : "text-foreground"
                )}
              >
                {formatHkd(line.amount)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          授課金額見上方各堂小計；以下為扣強積金後實收。
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 border-t border-border/70 pt-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">總薪酬</p>
          <p className="font-semibold tabular-nums">{formatHkd(teacher.gross)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">僱員強積金</p>
          <p className="font-semibold tabular-nums">{formatHkd(teacher.employeeMpf)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">僱主強積金</p>
          <p className="font-semibold tabular-nums">{formatHkd(teacher.employerMpf)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">實收</p>
          <p className="font-semibold tabular-nums">{formatHkd(teacher.net)}</p>
        </div>
      </div>
      {mpf ? (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">強積金步驟（適用四人）</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>適用薪酬：{mpf.applicable}</li>
            <li>band：{mpf.band}</li>
            <li>僱員供款：{mpf.employee}</li>
            <li>僱主供款：{mpf.employer}</li>
          </ol>
        </div>
      ) : null}
      {teacher.previousGross != null ? (
        <p className="text-xs text-muted-foreground">
          上月總薪酬對照：{formatHkd(teacher.previousGross)}
          {momDetail != null
            ? `（差額 ${momDetail >= 0 ? "+" : ""}${formatHkd(momDetail).replace("$", "$")}；波動請對照逐堂課量）`
            : ""}
        </p>
      ) : null}
    </div>
  )
}
