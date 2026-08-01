import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
  classAbsentTotal,
  classAmount,
  classBillableHc,
  classKindLabel,
  classPresentTotal,
  formatHkd,
  gradeAmount,
  gradeBillableHc,
  gradeLessonCount,
  lessonAbsentCount,
  lessonPresentCount,
  statusLabel,
  teacherAbsentTotal,
  teacherBillableHc,
  teacherCategoryTotals,
  teacherGradeKindRows,
  teacherPresentTotal,
  type PayrollClassBlock,
  type PayrollLesson,
  type PayrollRunStatus,
  type PayrollTeacherRow,
} from "./mockData"

export function statusTag(status: PayrollRunStatus) {
  const label = statusLabel(status)
  if (status === "已結算") return <Tag tone={statusToTagTone("已結算")}>{label}</Tag>
  if (status === "待管理層核實") return <Tag tone={statusToTagTone("待審核")}>{label}</Tag>
  if (status === "財務審閱中") return <Tag tone={statusToTagTone("審閱")}>{label}</Tag>
  return <Tag tone={statusToTagTone("草稿")}>{label}</Tag>
}

export function SummaryTile({
  label,
  value,
  hint,
  warn,
}: {
  label: string
  value: string
  hint?: string
  warn?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-3 shadow-sm",
        warn ? "border-warning/40" : "border-border"
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function NameList({ label, names, empty }: { label: string; names: string[]; empty: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm text-foreground">
        {names.length > 0 ? names.join("、") : empty}
      </p>
    </div>
  )
}

function LessonCard({
  lesson,
  highlight,
}: {
  lesson: PayrollLesson
  highlight?: boolean
}) {
  const present = lessonPresentCount(lesson)
  const absent = lessonAbsentCount(lesson)
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
              <span className="tabular-nums text-foreground">扣堂 {lesson.billableHc} 人</span>
              <span className="tabular-nums text-muted-foreground">出席 {present}</span>
              <span className="tabular-nums text-muted-foreground">缺席 {absent}</span>
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
      {lesson.formula ? (
        <p className="mt-1 text-xs font-medium text-foreground">計法：{lesson.formula}</p>
      ) : null}
      {lesson.listPrice != null ? (
        <p className="mt-0.5 text-xs text-muted-foreground">原價基數 {formatHkd(lesson.listPrice)}</p>
      ) : null}
      {lesson.note ? <p className="mt-1 text-xs text-muted-foreground">{lesson.note}</p> : null}
      {lesson.notRolled ? (
        <p className="mt-2 text-sm text-muted-foreground">尚無點名紀錄，未計入薪酬</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <NameList label="出席學生" names={lesson.presentStudents} empty="—" />
          <NameList label="缺席學生" names={lesson.absentStudents} empty="—" />
        </div>
      )}
    </div>
  )
}

function ClassDetail({
  block,
  highlightLessonId,
}: {
  block: PayrollClassBlock
  highlightLessonId?: string | null
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{block.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {classKindLabel(block.classKind)} · {block.lessons.length} 堂 · 扣堂{" "}
            {classBillableHc(block)} 人次 · 出席 {classPresentTotal(block)} · 缺席{" "}
            {classAbsentTotal(block)} · 小計 {formatHkd(classAmount(block))}
          </p>
        </div>
        <Tag tone={block.classKind === "private" ? "info" : "default"} size="sm">
          {classKindLabel(block.classKind)}
        </Tag>
      </div>
      <div className="mt-3 space-y-2">
        {block.lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} highlight={l.id === highlightLessonId} />
        ))}
      </div>
    </section>
  )
}

export function SplitAuditPanel({ teacher }: { teacher: PayrollTeacherRow }) {
  if (!teacher.personalSplit && !teacher.commissionPool) return null
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">分成核對（原價基數）</h3>
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
            原價合計 {formatHkd(teacher.commissionPool.listPriceTotal)} ×{" "}
            {Math.round(teacher.commissionPool.rate * 100)}% ={" "}
            <span className="font-semibold text-foreground">
              {formatHkd(teacher.commissionPool.amount)}
            </span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2">授課教師</th>
                  <th className="px-2 py-2">班／說明</th>
                  <th className="px-2 py-2">日期</th>
                  <th className="px-2 py-2">原價</th>
                </tr>
              </thead>
              <tbody>
                {teacher.commissionPool.items.map((it, i) => (
                  <tr key={`${it.teacherName}-${it.date}-${i}`} className="border-b border-border last:border-0">
                    <td className="px-2 py-2">{it.teacherName}</td>
                    <td className="px-2 py-2 text-muted-foreground">{it.className}</td>
                    <td className="px-2 py-2 tabular-nums">{it.date}</td>
                    <td className="px-2 py-2 tabular-nums font-medium">{formatHkd(it.listPrice)}</td>
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

export function TeacherLessonStats({
  teacher,
  compact,
  highlightLessonId,
}: {
  teacher: PayrollTeacherRow
  /** manager 預設較短：只顯示兩張合計表，不展開逐堂 */
  compact?: boolean
  highlightLessonId?: string | null
}) {
  const cats = teacherCategoryTotals(teacher)
  const gradeKindRows = teacherGradeKindRows(teacher)

  if (teacher.grades.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        此同事本月無授課排程統計（固定月薪／在家工作時薪等）。薪酬見下方明細。
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[36rem] table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">類別</th>
              <th className="px-3 py-2.5 font-medium">年級數</th>
              <th className="px-3 py-2.5 font-medium">班數</th>
              <th className="px-3 py-2.5 font-medium">堂數</th>
              <th className="px-3 py-2.5 font-medium">扣堂人次</th>
              <th className="px-3 py-2.5 font-medium">出席／缺席</th>
              <th className="px-3 py-2.5 font-medium">薪酬小計</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((b) => (
              <tr key={b.key} className="border-b border-border">
                <td className="px-3 py-2.5 font-medium">{b.label}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.gradeIds.size}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.classCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.lessonCount}</td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{b.billableHc}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {b.presentVisits} / {b.absentVisits}
                </td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{formatHkd(b.amount)}</td>
              </tr>
            ))}
            <tr className="bg-muted/20">
              <td className="px-3 py-2.5 font-semibold">合計</td>
              <td className="px-3 py-2.5 text-muted-foreground">—</td>
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
                {teacherPresentTotal(teacher)} / {teacherAbsentTotal(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {formatHkd(cats.reduce((s, c) => s + c.amount, 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[32rem] table-fixed text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">年級</th>
              <th className="px-3 py-2.5 font-medium">類型</th>
              <th className="px-3 py-2.5 font-medium">班數</th>
              <th className="px-3 py-2.5 font-medium">堂數</th>
              <th className="px-3 py-2.5 font-medium">扣堂人次</th>
              <th className="px-3 py-2.5 font-medium">出席／缺席</th>
              <th className="px-3 py-2.5 font-medium">薪酬小計</th>
            </tr>
          </thead>
          <tbody>
            {gradeKindRows.map((r) => (
              <tr
                key={`${r.gradeLabel}-${r.classKind}`}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-2.5 font-medium">{r.gradeLabel}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {classKindLabel(r.classKind)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{r.classCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{r.lessonCount}</td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{r.billableHc}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {r.presentVisits} / {r.absentVisits}
                </td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{formatHkd(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  highlightLessonId={highlightLessonId}
                />
              ))}
            </div>
          ))
        : null}
    </div>
  )
}

export function TeacherPayFooter({ teacher }: { teacher: PayrollTeacherRow }) {
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
      {teacher.previousGross != null ? (
        <p className="text-xs text-muted-foreground">
          上月總薪酬對照：{formatHkd(teacher.previousGross)}
        </p>
      ) : null}
    </div>
  )
}
