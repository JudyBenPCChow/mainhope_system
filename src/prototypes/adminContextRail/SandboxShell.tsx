/**
 * 管理員桌面三欄殼試版。移植時右欄併入 `src/components/Layout.tsx`（僅 role === "admin"）。
 * 開關跟 Cursor：撳摺疊符號；開住就留住；離開右欄唔關。
 */
import { useState } from "react"
import {
  BookOpen,
  CalendarDays,
  CalendarX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HandCoins,
  Home,
  Inbox,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { navGroupClass, navL1Class, navL1IconClass, navL2Class, navL2IconClass, navL2RailClass } from "@/lib/navItemStyles"
import { cn } from "@/lib/utils"

import { ContextRail } from "./ContextRail"
import type { SandboxPageId, SandboxStudent } from "./mockData"

type NavTarget = SandboxPageId | "toast"

type NavItem = {
  id: string
  label: string
  icon: typeof Home
  target: NavTarget
}

type NavGroup = {
  id: string
  label: string
  icon: typeof Home
  children: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "students",
    label: "學生與報讀",
    icon: GraduationCap,
    children: [{ id: "students-list", label: "學生管理", icon: GraduationCap, target: "students" }],
  },
  {
    id: "classes",
    label: "班別與教務",
    icon: BookOpen,
    children: [{ id: "classes-list", label: "班別管理", icon: BookOpen, target: "classes" }],
  },
  {
    id: "schedule",
    label: "排程與出勤",
    icon: CalendarDays,
    children: [
      { id: "schedule-list", label: "排程管理", icon: CalendarDays, target: "toast" },
      { id: "leave", label: "請假管理", icon: CalendarX, target: "toast" },
    ],
  },
  {
    id: "pay",
    label: "收費與優惠",
    icon: HandCoins,
    children: [{ id: "payments", label: "收款登記", icon: HandCoins, target: "toast" }],
  },
]

type Props = {
  page: SandboxPageId
  onPageChange: (page: SandboxPageId) => void
  pinnedStudent: SandboxStudent | null
  railCollapsed: boolean
  onToggleRail: () => void
  onUnpin: () => void
  onPreview: (label: string) => void
  children: React.ReactNode
}

export function SandboxShell({
  page,
  onPageChange,
  pinnedStudent,
  railCollapsed,
  onToggleRail,
  onUnpin,
  onPreview,
  children,
}: Props) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(["students", "classes"]))

  const go = (item: NavItem) => {
    if (item.target === "toast") {
      onPreview(item.label)
      return
    }
    onPageChange(item.target)
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-brand-bg">
      <aside
        className={cn(
          "flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#1e3a6e] via-[#2A4E8A] to-[#3B6AB3] text-white shadow-[4px_0_24px_-4px_rgba(30,58,110,0.35)] transition-[width] duration-200 ease-out",
          leftCollapsed ? "w-[4.25rem]" : "w-60 md:w-64"
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-4">
          {!leftCollapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-[1.00625rem] font-semibold tracking-tight">明學教育</div>
              <div className="text-[0.8625rem] text-white/80">管理系統</div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-9 w-9 shrink-0 text-white hover:bg-white/10", leftCollapsed && "mx-auto")}
            onClick={() => setLeftCollapsed((v) => !v)}
            aria-label={leftCollapsed ? "展開側欄" : "收起側欄"}
          >
            {leftCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className={cn("flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4", leftCollapsed && "items-center px-2")} aria-label="主選單（沙盒）">
          <button
            type="button"
            className={navL1Class({ active: false })}
            onClick={() => onPreview("首頁")}
          >
            <Home className={navL1IconClass} aria-hidden />
            {!leftCollapsed ? <span className="truncate">首頁</span> : <span className="sr-only">首頁</span>}
          </button>

          {leftCollapsed
            ? NAV_GROUPS.flatMap((group) =>
                group.children.map((child) => {
                  const Icon = child.icon
                  const active = child.target === page
                  return (
                    <button
                      key={child.id}
                      type="button"
                      title={child.label}
                      className={navL1Class({ active })}
                      onClick={() => go(child)}
                    >
                      <Icon className={navL1IconClass} aria-hidden />
                      <span className="sr-only">{child.label}</span>
                    </button>
                  )
                })
              )
            : NAV_GROUPS.map((group) => {
                const open = openGroups.has(group.id)
                const GroupIcon = group.icon
                const childActive = group.children.some((c) => c.target === page)
                return (
                  <div key={group.id} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      className={navGroupClass({ childActive })}
                      aria-expanded={open}
                      onClick={() =>
                        setOpenGroups((prev) => {
                          const next = new Set(prev)
                          if (next.has(group.id)) next.delete(group.id)
                          else next.add(group.id)
                          return next
                        })
                      }
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <GroupIcon className={navL1IconClass} aria-hidden />
                        <span className="truncate font-medium">{group.label}</span>
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 shrink-0 opacity-80 transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                    </button>
                    <div className={navL2RailClass({ open })}>
                      {open
                        ? group.children.map((child) => {
                            const Icon = child.icon
                            const active = child.target === page
                            return (
                              <button
                                key={child.id}
                                type="button"
                                className={navL2Class({ active })}
                                onClick={() => go(child)}
                              >
                                <Icon className={navL2IconClass} aria-hidden />
                                <span className="truncate">{child.label}</span>
                              </button>
                            )
                          })
                        : null}
                    </div>
                  </div>
                )
              })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 text-[0.8625rem]">
          {!leftCollapsed ? (
            <>
              <button
                type="button"
                className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-white/90 hover:bg-white/10"
                onClick={() => onPreview("收件匣")}
              >
                <Inbox className="h-4 w-4" aria-hidden />
                收件匣
              </button>
              <div className="rounded-lg bg-white/10 px-3 py-2 text-white/90">你登入為 Sophie</div>
            </>
          ) : (
            <div className="text-center text-white/80">行</div>
          )}
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto min-h-full max-w-[1600px] px-5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>

      <aside
        className={cn(
          "flex h-full min-h-0 shrink-0 overflow-hidden border-l border-border bg-background shadow-[-4px_0_24px_-8px_rgba(15,23,42,0.08)] transition-[width] duration-200 ease-out",
          railCollapsed ? "w-11" : "w-[22.5rem]"
        )}
      >
        <button
          type="button"
          className="flex h-full w-11 shrink-0 flex-col items-center gap-2 border-r border-border/70 bg-muted/30 pt-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onToggleRail}
          aria-label={railCollapsed ? "展開右欄" : "收起右欄"}
          title={railCollapsed ? "展開右欄" : "收起右欄"}
        >
          {railCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {railCollapsed && pinnedStudent ? (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              title={pinnedStudent.fullName}
            >
              {pinnedStudent.fullName.slice(0, 1)}
            </span>
          ) : null}
        </button>
        {!railCollapsed ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">右欄</p>
                <p className="truncate text-xs text-muted-foreground">
                  {pinnedStudent ? `已固定 ${pinnedStudent.fullName}` : "未固定"}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ContextRail student={pinnedStudent} onUnpin={onUnpin} onShortcut={onPreview} />
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
