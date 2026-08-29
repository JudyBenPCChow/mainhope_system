/**
 * 管理員右欄試版。移植時 → `src/components/contextRail/ContextRail.tsx`
 * 上截＝釘資料（pinned context）；下截＝對住該學生嘅快捷導航（唔內嵌表單）。
 */
import { BookOpen, GraduationCap, HandCoins, PinOff, Wallet, CalendarX, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import { classLabel, type SandboxStudent } from "./mockData"

type Props = {
  student: SandboxStudent | null
  onUnpin: () => void
  onShortcut: (label: string) => void
}

const SHORTCUTS = [
  { id: "detail", label: "學生詳情", icon: GraduationCap },
  { id: "pay", label: "收款登記", icon: HandCoins },
  { id: "history", label: "繳費紀錄", icon: Wallet },
  { id: "leave", label: "請假管理", icon: CalendarX },
  { id: "attendance", label: "出席紀錄", icon: ClipboardList },
] as const

export function ContextRail({ student, onUnpin, onShortcut }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">固定資料</p>
        {!student ? (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            尚未固定學生。在學生管理列表按「固定」，切換頁面後此欄仍會保留。
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold tracking-tight">{student.fullName}</h2>
                  <p className="truncate text-xs text-muted-foreground">{student.englishName}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onUnpin}>
                  <PinOff className="h-4 w-4" aria-hidden />
                  取消固定
                </Button>
              </div>
              <p className="mt-2 font-mono text-sm tabular-nums text-muted-foreground">{student.studentCode}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag tone={statusToTagTone(student.registrationStatus)} size="sm">
                  {student.registrationStatus === "非註冊" ? "非註冊" : "註冊"}
                </Tag>
                <Tag tone={statusToTagTone(student.enrollmentStatus)} size="sm">
                  {student.enrollmentStatus}
                </Tag>
                <Tag tone={statusToTagTone(student.activityStatus)} size="sm">
                  {student.activityStatus}
                </Tag>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <InfoCell label="年級" value={student.grade} />
              <InfoCell label="學校" value={student.school} />
              <InfoCell label="學生電話" value={student.studentPhone} />
              <InfoCell label="家長電話" value={student.parentPhone} />
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">已繳堂數</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{student.paidLessons}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">總上堂數</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{student.attendedLessons}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden />
                進行中報讀
              </div>
              {student.classIds.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">目前沒有報讀班別（可作試堂對象）</p>
              ) : (
                <ul className="mt-2 list-inside list-disc text-sm">
                  {student.classIds.map((id) => (
                    <li key={id}>{classLabel(id)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="shrink-0 border-t border-border px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">快捷功能</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {student ? `作用於 ${student.fullName}；沙盒只提示、不進入正式頁。` : "先固定學生，快捷會帶上該學生。"}
        </p>
        <div className="mt-3 grid gap-1.5">
          {SHORTCUTS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                disabled={!student}
                onClick={() => onShortcut(item.label)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm font-medium shadow-sm transition-colors",
                  student
                    ? "hover:border-primary/40 hover:bg-muted/40"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                {item.label}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  )
}
