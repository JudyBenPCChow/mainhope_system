import { useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import {
 CalendarDays,
 Check,
 ChevronDown,
 ChevronUp,
 ClipboardCheck,
 Download,
 FlaskConical,
 LayoutGrid,
 List,
 Plus,
 User,
 Users,
 XCircle,
} from "lucide-react"

import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { DayViewGrid } from "@/components/schedule/DayViewGrid"
import { ScheduleAlertIcons } from "@/components/schedule/ScheduleAlertIcons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import type { TagTone } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

import {
 PROTOTYPE_ALERTS,
 PROTOTYPE_EXPAND_ROSTER,
 PROTOTYPE_ROLLCALL_STUDENTS,
 PROTOTYPE_ROOMS,
 PROTOTYPE_SCHEDULES,
 PROTOTYPE_STUDENT_ROSTER,
 PROTOTYPE_TODAY,
 type PrototypeExpandRoster,
 type PrototypeRosterPerson,
} from "./mockData"
import { PrototypeRollCallSheet } from "./PrototypeRollCallSheet"

type ViewMode = "byDate" | "list" | "day"

export function ScheduleRollCallPrototypeView() {
 const isMobile = useIsMobile()
 const { pushBanner } = useAppBanner()
 /** 預設按日期：對齊截圖中的綠色展開卡 */
 const [viewMode, setViewMode] = useState<ViewMode>("byDate")
 const effectiveViewMode: ViewMode =
  isMobile && (viewMode === "list" || viewMode === "day") ? "byDate" : viewMode

 const [schedules, setSchedules] = useState(() => PROTOTYPE_SCHEDULES.map((s) => ({ ...s })))
 const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null)
 const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set())
 const [detailId, setDetailId] = useState<string | null>(null)

 const rooms = PROTOTYPE_ROOMS
 const alerts = PROTOTYPE_ALERTS
 const studentRoster = PROTOTYPE_STUDENT_ROSTER

 const activeSchedule = useMemo(
  () => schedules.find((s) => s.id === activeScheduleId) ?? null,
  [activeScheduleId, schedules]
 )
 const activeStudents = activeScheduleId
  ? (PROTOTYPE_ROLLCALL_STUDENTS[activeScheduleId] ?? [])
  : []
 const detailRow = useMemo(
  () => schedules.find((s) => s.id === detailId) ?? null,
  [detailId, schedules]
 )

 const activeRoomIdSet = useMemo(() => new Set(rooms.map((r) => r.id)), [rooms])
 const dayViewRoomColPct = useMemo(() => {
  const n = rooms.length + 1
  const timePct = 8
  const each = n > 0 ? (100 - timePct) / n : 46
  return { timePct, each }
 }, [rooms.length])

 const openRollCall = (id: string) => setActiveScheduleId(id)

 const patchSchedule = (id: string, patch: Partial<ScheduleManageRow>) => {
  setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  pushBanner({
   tone: "info",
   title: "原型：僅更新本頁假資料",
   message: "不會寫入資料庫。",
  })
 }

 return (
  <div className="space-y-5 text-sm leading-relaxed">
   <div
    role="status"
    className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning"
   >
    <p className="flex items-start gap-2 font-medium">
     <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
     原型預覽 · 版面仿照「排程管理」· 假資料 · 不會寫入資料庫
    </p>
    <p className="mt-1 pl-6 text-warning/90">
     保留綠色展開與所有按鈕；僅「確定點名」改為滑出點名紙（不跳轉點名頁）。路徑：
     <code className="mx-1 rounded bg-background/80 px-1.5 py-0.5 text-foreground">
      /prototype/ScheduleRollCall
     </code>
    </p>
   </div>

   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <CalendarDays className="h-6 w-6 shrink-0 text-info" aria-hidden />
      排程管理
      <Tag tone="info">{schedules.length} 堂今日</Tag>
      <Tag tone="warning" size="sm">
       原型
      </Tag>
     </h1>
     <p className="mt-2 text-sm text-muted-foreground">
      按日期／列表可點擊卡片展開班內學生、請假學生與試堂學生；日視圖可拖曳或「移動到…」調整課室與時間（需確認），亦可一鍵分配未編課室的排程。沒有任何學生（沒有報讀或全員請假）的排程以灰色淡化。非標準時間排程會顯示於「其他時段」列。日視圖以每格{" "}
      <strong>75 分鐘</strong>（09:00 起）對齊。
     </p>
    </div>
   </header>

   <div className="rounded-xl border border-info bg-info/90 px-4 py-3 text-sm text-info-foreground">
    你正以<strong>Katie Lee</strong>身分瀏覽：僅顯示指派給您的排程與統計。
    <span className="opacity-90">（原型模擬）</span>
   </div>

   <section className="grid gap-4 sm:grid-cols-3" aria-label="排程概覽">
    <div className="rounded-xl border border-border bg-card p-5 text-left shadow-sm ring-2 ring-info/50 md:p-6">
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <CalendarDays className="h-5 w-5 shrink-0 text-info" />
      今日課堂
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-info">{schedules.length}</p>
     <p className="mt-2 text-sm text-muted-foreground">點擊將列表起始日設為今天</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-5 text-left shadow-sm md:p-6">
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <XCircle className="h-5 w-5 shrink-0 text-destructive" />
      待處理（取消）
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">0</p>
     <p className="mt-2 text-sm text-muted-foreground">點擊篩選「已取消」排程（再點一次還原）</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-5 text-left shadow-sm md:p-6">
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <ClipboardCheck className="h-5 w-5 shrink-0 text-info" />
      已點名（原型）
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-info">{savedIds.size}</p>
     <p className="mt-2 text-sm text-muted-foreground">本頁本地標記次數</p>
    </div>
   </section>

   <div className="flex flex-wrap items-center justify-between gap-3">
    <div
     className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
     role="tablist"
     aria-label="檢視模式"
    >
     {(
      [
       { id: "byDate" as const, label: "按日期", icon: LayoutGrid },
       ...(!isMobile
        ? ([
           { id: "list" as const, label: "列表", icon: List },
           { id: "day" as const, label: "日視圖", icon: CalendarDays },
          ] as const)
        : []),
      ] as const
     ).map(({ id, label, icon: Icon }) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={effectiveViewMode === id}
       onClick={() => setViewMode(id)}
       className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
        effectiveViewMode === id
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:bg-background hover:text-foreground"
       )}
      >
       <Icon className="h-4 w-4 shrink-0" aria-hidden />
       {label}
      </button>
     ))}
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" size="default" className="gap-1.5 text-sm" disabled>
      <Download className="h-4 w-4" />
      匯出
     </Button>
     <Button type="button" size="default" className="gap-1.5 bg-info text-sm text-white" disabled>
      <Plus className="h-4 w-4" />
      新增排程
     </Button>
    </div>
   </div>

   {isMobile && (viewMode === "list" || viewMode === "day") ? (
    <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
     列表與日視圖建議使用桌面版；手機已改為「按日期」顯示。
    </p>
   ) : null}

   {effectiveViewMode === "byDate" ? (
    <ByDatePrototypeList
     schedules={schedules}
     alerts={alerts}
     savedIds={savedIds}
     onOpenRollCall={openRollCall}
     onPatchSchedule={patchSchedule}
     onOpenDetail={setDetailId}
     onRemoveSchedule={(id) => {
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      pushBanner({ tone: "warning", title: "原型：已自本頁移除假排程", message: "重新整理可恢復。" })
     }}
    />
   ) : null}

   {effectiveViewMode === "list" ? (
    <ListPrototypeTable
     schedules={schedules}
     alerts={alerts}
     savedIds={savedIds}
     onOpenRollCall={openRollCall}
    />
   ) : null}

   {effectiveViewMode === "day" ? (
    <>
     <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      日視圖為輔助預覽；點堂次班名亦會開啟點名紙原型。
     </p>
     <DayViewGrid
      dayViewDate={PROTOTYPE_TODAY}
      schedules={schedules}
      alerts={alerts}
      studentRoster={studentRoster}
      roomColumns={rooms}
      activeRoomIdSet={activeRoomIdSet}
      roomColPct={dayViewRoomColPct}
      scheduleRowLocked={() => true}
      inactiveRoomName={() => null}
      onDropOnCell={() => {}}
      onOpenDetail={openRollCall}
      onMoveRequest={() => {}}
     />
    </>
   ) : null}

   {activeSchedule ? (
    <PrototypeRollCallSheet
     key={activeSchedule.id}
     schedule={activeSchedule}
     students={activeStudents}
     initiallySaved={savedIds.has(activeSchedule.id)}
     onClose={() => setActiveScheduleId(null)}
     onSaved={(id) => setSavedIds((prev) => new Set(prev).add(id))}
    />
   ) : null}

   <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>排程詳細資料（原型）</DialogTitle>
     </DialogHeader>
     {detailRow ? (
      <div className="space-y-2 text-sm">
       <p className="font-medium">{detailRow.classLabel}</p>
       <p className="text-muted-foreground">
        {detailRow.scheduled_date} · {detailRow.start_time}–{detailRow.end_time}
       </p>
       <p className="text-muted-foreground">
        老師：{detailRow.teacher_name} · 課室：{detailRow.classroom_name}
       </p>
       <Button type="button" className="mt-2 gap-1.5 bg-success text-white hover:bg-success" onClick={() => {
        setDetailId(null)
        openRollCall(detailRow.id)
       }}>
        <Check className="h-4 w-4" />
        確定點名
       </Button>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>
  </div>
 )
}

function ByDatePrototypeList({
 schedules,
 alerts,
 savedIds,
 onOpenRollCall,
 onPatchSchedule,
 onOpenDetail,
 onRemoveSchedule,
}: {
 schedules: ScheduleManageRow[]
 alerts: typeof PROTOTYPE_ALERTS
 savedIds: Set<string>
 onOpenRollCall: (id: string) => void
 onPatchSchedule: (id: string, patch: Partial<ScheduleManageRow>) => void
 onOpenDetail: (id: string) => void
 onRemoveSchedule: (id: string) => void
}) {
 const { confirmDialog } = useAppConfirm()
 const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(
  () => schedules[0]?.id ?? null
 )

 return (
  <div className="space-y-6">
   <section className="space-y-3 rounded-xl border-2 border-amber-400 bg-amber-50/50 p-3 shadow-sm">
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/90 bg-amber-100/60 px-3 py-2">
     <CalendarDays className="h-4 w-4 shrink-0 text-amber-800" aria-hidden />
     <span className="text-lg font-semibold tabular-nums md:text-xl">{PROTOTYPE_TODAY}</span>
     <Tag tone="warning" size="sm">
      今天
     </Tag>
     <span className="text-base text-muted-foreground">{schedules.length} 堂</span>
    </div>
    <ul className="space-y-2">
     {schedules.map((s) => {
      const a = alerts.get(s.id) ?? {
       trial: false,
       makeup: false,
       leave: false,
       record: false,
      }
      const open = expandedScheduleId === s.id
      const classMetaParts = [s.class_day_of_week, s.class_time_slot].filter(Boolean)
      const noEnrollment = s.enrollCount === 0
      const roster = PROTOTYPE_EXPAND_ROSTER[s.id] ?? emptyRoster()
      const saved = savedIds.has(s.id)
      return (
       <li
        key={s.id}
        className={cn(
         "overflow-hidden rounded-xl border border-border shadow-sm transition-shadow hover:shadow-md",
         noEnrollment ? "border-border/80 bg-muted/70" : "bg-card"
        )}
       >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
         <button
          type="button"
          className="min-w-0 flex-1 rounded-lg text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50"
          aria-expanded={open}
          onClick={() => setExpandedScheduleId((id) => (id === s.id ? null : s.id))}
         >
          <div className="flex flex-wrap items-center gap-2">
           <span className="text-lg font-semibold text-foreground md:text-xl">
            {s.classLabel}
            {s.course_code_full ? (
             <span className="font-mono text-sm text-muted-foreground"> ({s.course_code_full})</span>
            ) : null}
           </span>
           <Tag tone={statusToTagTone(s.status)} size="sm">
            {s.status}
           </Tag>
           {saved ? (
            <Tag tone="success" size="sm">
             已點名
            </Tag>
           ) : null}
           {noEnrollment ? (
            <Tag tone={statusToTagTone("暫未有學生報讀")} size="sm">
             暫未有學生報讀
            </Tag>
           ) : null}
           <ScheduleAlertIcons alerts={a} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
           <span className="tabular-nums">
            {s.start_time ?? "—"}–{s.end_time ?? "—"}
           </span>
           <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            {s.teacher_name ?? "—"}
           </span>
           <span
            className={cn(
             "inline-flex items-center gap-1",
             noEnrollment ? "text-muted-foreground" : "text-info"
            )}
           >
            <Users className="h-4 w-4 opacity-70" aria-hidden />
            {s.enrollCount} 人報讀
           </span>
          </div>
         </button>
         <div
          className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
         >
          <Select
           className="h-11 max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-info/50"
           value={s.classroom_id ?? ""}
           onChange={(e) => {
            const v = e.target.value || null
            const room = PROTOTYPE_ROOMS.find((r) => r.id === v)
            onPatchSchedule(s.id, {
             classroom_id: v,
             classroom_name: room?.name ?? null,
            })
           }}
          >
           <option value="">課室未定</option>
           {PROTOTYPE_ROOMS.map((o) => (
            <option key={o.id} value={o.id}>
             {o.name}
            </option>
           ))}
          </Select>
          <Select
           className="h-11 rounded-md border border-input bg-background px-2 text-sm font-medium text-info transition-colors hover:border-info/50"
           value={s.status}
           onChange={(e) => onPatchSchedule(s.id, { status: e.target.value })}
          >
           <option value="正常">正常</option>
           <option value="完成">完成</option>
           <option value="取消">取消</option>
          </Select>
          <Link
           to="/LeaveManagement"
           className="rounded-md border border-warning px-3 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning hover:text-warning-foreground"
           onClick={(e) => e.stopPropagation()}
          >
           +請假
          </Link>
          <Link
           to="/TrialSessions"
           className="rounded-md border border-info px-3 py-2 text-sm font-medium text-info transition-colors hover:bg-info hover:text-info-foreground"
           onClick={(e) => e.stopPropagation()}
          >
           +補堂試堂
          </Link>
          <Button
           type="button"
           size="default"
           className="h-11 gap-1.5 bg-success px-3 text-base text-white hover:bg-success"
           onClick={(e) => {
            e.stopPropagation()
            onOpenRollCall(s.id)
           }}
          >
           <Check className="h-4 w-4" aria-hidden />
           確定點名
          </Button>
          <Button
           type="button"
           variant="ghost"
           size="icon"
           className="h-11 w-11 text-destructive hover:bg-destructive/10"
           aria-label="刪除排程"
           onClick={async () => {
            if (
             !(await confirmDialog({
              title: "刪除排程",
              description: "原型：僅自本頁移除假資料，不寫入資料庫。",
              confirmText: "確認刪除",
              tone: "destructive",
             }))
            ) {
             return
            }
            onRemoveSchedule(s.id)
           }}
          >
           ×
          </Button>
          <Button
           type="button"
           variant="ghost"
           size="icon"
           className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-muted"
           aria-expanded={open}
           aria-label={open ? "收合詳情" : "展開詳情"}
           onClick={() => setExpandedScheduleId((id) => (id === s.id ? null : s.id))}
          >
           {open ? <ChevronUp className="h-5 w-5" aria-hidden /> : <ChevronDown className="h-5 w-5" aria-hidden />}
          </Button>
         </div>
        </div>
        {open ? (
         <div className="border-t border-border bg-success/25 px-4 py-4 md:px-5">
          <PrototypeExpandedRoster
           schedule={s}
           roster={roster}
           classMeta={
            <p className="text-sm font-medium text-info">
             班別：{s.classLabel}
             {s.course_code_full ? `（${s.course_code_full}）` : ""}
             {classMetaParts.length > 0 ? ` · ${classMetaParts.join(" ")}` : ""}
            </p>
           }
           footer={
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
             <Button
              type="button"
              variant="outline"
              size="default"
              className="text-base"
              onClick={() => onOpenDetail(s.id)}
             >
              快速檢視
             </Button>
             <Button type="button" variant="outline" size="default" className="text-base" asChild>
              <Link to={`/Schedule/${s.id}`}>完整排程頁</Link>
             </Button>
             {s.class_id ? (
              <Button type="button" variant="outline" size="default" className="text-base" asChild>
               <Link to={`/Classes/${s.class_id}`}>班別詳情</Link>
              </Button>
             ) : null}
            </div>
           }
          />
         </div>
        ) : null}
       </li>
      )
     })}
    </ul>
   </section>
  </div>
 )
}

function emptyRoster(): PrototypeExpandRoster {
 return { enrolled: [], leave: [], trial: [], makeup: [], notEnrolled: [] }
}

function PrototypeExpandedRoster({
 schedule,
 roster,
 classMeta,
 footer,
}: {
 schedule: ScheduleManageRow
 roster: PrototypeExpandRoster
 classMeta?: ReactNode
 footer?: ReactNode
}) {
 const sections: {
  key: string
  label: string
  students: PrototypeRosterPerson[]
  tone: TagTone
  headerClass: string
  linkClass: string
  buttonBorderClass: string
  isTrial: boolean
  attendanceStatus: string | null
  alwaysShow: boolean
  nameSuffix?: string
 }[] = [
  {
   key: "enrolled",
   label: "班內學生",
   students: roster.enrolled,
   tone: "success",
   headerClass: "text-success",
   linkClass: "text-success",
   buttonBorderClass: "border-success/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: true,
  },
  {
   key: "notEnrolled",
   label: "沒有報讀此堂（單堂生）",
   students: roster.notEnrolled,
   tone: statusToTagTone("沒有報讀此堂"),
   headerClass: "text-info",
   linkClass: "text-info",
   buttonBorderClass: "border-info/60",
   isTrial: false,
   attendanceStatus: null,
   alwaysShow: false,
   nameSuffix: "沒有報讀此堂",
  },
  {
   key: "leave",
   label: "請假學生",
   students: roster.leave,
   tone: "error",
   headerClass: "text-destructive",
   linkClass: "text-destructive",
   buttonBorderClass: "border-destructive/60",
   isTrial: false,
   attendanceStatus: "請假",
   alwaysShow: false,
  },
  {
   key: "trial",
   label: "試堂學生",
   students: roster.trial,
   tone: statusToTagTone("試堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: true,
   attendanceStatus: null,
   alwaysShow: false,
  },
  {
   key: "makeup",
   label: "來此補堂",
   students: roster.makeup,
   tone: statusToTagTone("補堂"),
   headerClass: "text-warning",
   linkClass: "text-warning",
   buttonBorderClass: "border-warning/60",
   isTrial: false,
   attendanceStatus: "補課",
   alwaysShow: false,
  },
 ]

 return (
  <>
   {classMeta}
   {sections.map((section, index) => {
    if (!section.alwaysShow && section.students.length === 0) return null
    return (
     <div key={section.key} className={index === 0 && !classMeta ? undefined : "mt-3"}>
      <p className={cn("mb-2 text-sm font-medium", section.headerClass)}>
       {section.label}（{section.students.length}）
      </p>
      {section.students.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚無就讀學生。</p>
      ) : (
       <div className="flex flex-wrap gap-2">
        {section.students.map((st) => (
         <Tag
          key={`${section.key}-${st.studentId}`}
          tone={section.tone}
          size="sm"
          className="gap-1 py-0.5 pl-2 pr-1"
         >
          <Link
           to={`/Students/${st.studentId}`}
           className={cn("text-sm font-medium hover:underline", section.linkClass)}
           onClick={(e) => e.stopPropagation()}
          >
           {section.nameSuffix ? `${st.fullName}${section.nameSuffix}` : st.fullName}
          </Link>
          <StudentWhatsAppReminderButton
           compact
           className={cn("h-7 w-7", section.buttonBorderClass)}
           contactPhone={st.contactPhone}
           payload={{
            studentName: st.fullName,
            subject: schedule.subject,
            courseName: schedule.course_name,
            courseCode: schedule.course_code_full,
            dateYmd: schedule.scheduled_date,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            isConsecutive: Boolean(schedule.consecutive_group_id),
            classroomName: schedule.classroom_name,
            attendanceStatus: section.attendanceStatus,
            isTrial: section.isTrial,
           }}
          />
         </Tag>
        ))}
       </div>
      )}
     </div>
    )
   })}
   {footer}
  </>
 )
}

function ListPrototypeTable({
 schedules,
 alerts,
 savedIds,
 onOpenRollCall,
}: {
 schedules: ScheduleManageRow[]
 alerts: typeof PROTOTYPE_ALERTS
 savedIds: Set<string>
 onOpenRollCall: (id: string) => void
}) {
 return (
  <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
   <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
    <colgroup>
     <col style={{ width: "14%" }} />
     <col style={{ width: "28%" }} />
     <col style={{ width: "12%" }} />
     <col style={{ width: "14%" }} />
     <col style={{ width: "14%" }} />
     <col style={{ width: "18%" }} />
    </colgroup>
    <thead>
     <tr className="bg-muted/40 text-left">
      <th className="border border-border px-3 py-2.5 font-medium">時間</th>
      <th className="border border-border px-3 py-2.5 font-medium">班別</th>
      <th className="border border-border px-3 py-2.5 font-medium">課室</th>
      <th className="border border-border px-3 py-2.5 font-medium">老師</th>
      <th className="border border-border px-3 py-2.5 font-medium">狀態</th>
      <th className="border border-border px-3 py-2.5 font-medium">操作</th>
     </tr>
    </thead>
    <tbody>
     {schedules.map((s) => {
      const a = alerts.get(s.id) ?? {
       trial: false,
       makeup: false,
       leave: false,
       record: false,
      }
      return (
       <tr key={s.id} className="hover:bg-muted/20">
        <td className="border border-border px-3 py-2.5 tabular-nums">
         {s.start_time}–{s.end_time}
        </td>
        <td className="border border-border px-3 py-2.5">
         <span className="font-medium">{s.classLabel}</span>
         <div className="mt-0.5">
          <ScheduleAlertIcons alerts={a} />
         </div>
        </td>
        <td className="border border-border px-3 py-2.5">{s.classroom_name}</td>
        <td className="border border-border px-3 py-2.5">{s.teacher_name}</td>
        <td className="border border-border px-3 py-2.5">
         <div className="flex flex-wrap gap-1">
          <Tag tone={statusToTagTone(s.status)} size="sm">
           {s.status}
          </Tag>
          {savedIds.has(s.id) ? (
           <Tag tone="success" size="sm">
            已點名
           </Tag>
          ) : null}
         </div>
        </td>
        <td className="border border-border px-3 py-2.5">
         <Button
          type="button"
          size="sm"
          className="gap-1 bg-success text-white hover:bg-success"
          onClick={() => onOpenRollCall(s.id)}
         >
          <Check className="h-3.5 w-3.5" />
          確定點名
         </Button>
        </td>
       </tr>
      )
     })}
    </tbody>
   </table>
  </div>
 )
}
