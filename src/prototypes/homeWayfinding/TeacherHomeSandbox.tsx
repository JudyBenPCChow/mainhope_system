import {
  BookOpen,
  CalendarRange,
  ChevronRight,
  ClipboardCheck,
  DoorOpen,
  Inbox,
  UserRound,
} from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

import {
  MOCK_TEACHER_NAME,
  MOCK_TEACHER_PENDING_ROLL,
  MOCK_TEACHER_SHORTCUTS,
  MOCK_TEACHER_TODAY,
  MOCK_TEACHER_TOMORROW,
  MOCK_TODAY_LABEL,
  type MockClassRow,
  type MockTeacherShortcut,
} from "./mockData"

type Props = {
  onPreviewAction: (label: string) => void
}

const SHORTCUT_ICONS: Record<string, typeof CalendarRange> = {
  ts1: CalendarRange,
  ts2: BookOpen,
  ts3: UserRound,
  ts4: DoorOpen,
  ts5: Inbox,
}

function ClassRow({
  row,
  showRollCta,
  onPreviewAction,
}: {
  row: MockClassRow
  showRollCta?: boolean
  onPreviewAction: Props["onPreviewAction"]
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">{row.time}</span>
      <span className="min-w-0 flex-1">
        <span className="font-medium text-foreground">{row.label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {row.room} · {row.headcount} 人
        </span>
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {row.tags?.map((t) => (
          <Tag key={t} tone="info" size="sm">
            {t}
          </Tag>
        ))}
        <Tag tone={row.rollCallDone ? "success" : "warning"} size="sm">
          {row.rollCallDone ? "已點名" : "未點名"}
        </Tag>
        {showRollCta && !row.rollCallDone ? (
          <button
            type="button"
            onClick={() => onPreviewAction(`點名 · ${row.label}`)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
          >
            點名
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  )
}

function ShortcutButton({
  item,
  onPreviewAction,
}: {
  item: MockTeacherShortcut
  onPreviewAction: Props["onPreviewAction"]
}) {
  const Icon = SHORTCUT_ICONS[item.id] ?? BookOpen
  return (
    <button
      type="button"
      onClick={() => onPreviewAction(item.label)}
      className="group flex min-w-0 items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-info/40 hover:bg-info/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{item.label}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{item.detail}</span>
      </span>
      <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  )
}

/**
 * 老師首頁改善草案：先點名、再今日課堂；次要入口收斂，不再堆疊多個近似按鈕。
 */
export function TeacherHomeSandbox({ onPreviewAction }: Props) {
  const pending = MOCK_TEACHER_PENDING_ROLL.length
  const todayCount = MOCK_TEACHER_TODAY.length

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="rounded-2xl border border-info/30 bg-info/5 p-4 shadow-sm md:p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-info">專班老師工作台 · 草案</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          您好，{MOCK_TEACHER_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {MOCK_TODAY_LABEL} · 今日 {todayCount} 堂 · 僅顯示指派給您的班別
        </p>
      </header>

      {pending > 0 ? (
        <section
          className="rounded-xl border border-warning/40 bg-warning/10 p-4 shadow-sm md:p-5"
          aria-labelledby="teacher-roll-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2
                id="teacher-roll-title"
                className="flex items-center gap-2 text-base font-semibold text-foreground md:text-lg"
              >
                <ClipboardCheck className="h-5 w-5 shrink-0 text-warning" aria-hidden />
                請先完成點名（{pending} 堂）
              </h2>
              <p className="text-sm text-muted-foreground">
                未點名不會扣堂。請假單僅影響預填，請開啟點名表確認後儲存。
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {MOCK_TEACHER_PENDING_ROLL.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onPreviewAction(`點名 · ${r.label}`)}
                      className="font-medium text-info underline-offset-2 hover:underline"
                    >
                      {r.time} · {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onPreviewAction("進行點名（今日未完成）")}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm",
                "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              一次處理
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3" aria-labelledby="teacher-today-title">
        <div>
          <h2 id="teacher-today-title" className="text-lg font-semibold text-foreground">
            今日課堂
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            主要工作區；無須再於頂部在「排程／點名／時間表」之間選擇。
          </p>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {MOCK_TEACHER_TODAY.map((row) => (
            <ClassRow key={row.id} row={row} showRollCta onPreviewAction={onPreviewAction} />
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="teacher-shortcuts-title">
        <div>
          <h2 id="teacher-shortcuts-title" className="text-lg font-semibold text-foreground">
            其他常用
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            刻意收斂：不再並排「我的排程／進行點名／排程點名／時間表」等近似按鈕。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_TEACHER_SHORTCUTS.map((item) => (
            <ShortcutButton key={item.id} item={item} onPreviewAction={onPreviewAction} />
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="teacher-tomorrow-title">
        <h2 id="teacher-tomorrow-title" className="text-lg font-semibold text-foreground">
          明日預告
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {MOCK_TEACHER_TOMORROW.map((row) => (
            <ClassRow key={row.id} row={row} onPreviewAction={onPreviewAction} />
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onPreviewAction("時間表")}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          查看完整時間表 →
        </button>
      </section>
    </div>
  )
}
