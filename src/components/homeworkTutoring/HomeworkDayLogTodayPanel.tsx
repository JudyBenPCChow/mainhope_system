import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { cn } from "@/lib/utils"
import {
  HW_DAY_LOG_ATTACHMENT_ACCEPT,
  HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY,
  type HwDayLogAttachmentKind,
  type HwFollowupKind,
  type HwHandbookStatus,
} from "@/lib/homeworkDayLogAttachments"
import {
  homeworkClosureYmdSet,
  homeworkDayLogCoreFilled,
  homeworkDayLogPhase,
  homeworkDayLogPhaseLabel,
  nextHomeworkSchoolDay,
  nextUnwrittenStudentId,
  todayYmdLocal,
} from "@/lib/homeworkDayLogDates"
import {
  dutyAssignments,
  studentsComingOnWeekday,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkStudentRow,
  type HomeworkTeacherRow,
  type Weekday,
} from "@/lib/homeworkTutoringUi"
import {
  completeHomeworkFollowup,
  createHomeworkFollowup,
  deleteHomeworkDayLog,
  fetchHomeworkStandingInstructions,
  listActiveHomeworkFollowups,
  listHomeworkDayLogAttachments,
  listHomeworkDayLogsForDate,
  stampHomeworkDayLogClock,
  uploadHomeworkDayLogAttachment,
  upsertHomeworkDayLog,
  upsertHomeworkStandingInstructions,
  type HomeworkDayLogAttachmentRow,
  type HomeworkDayLogRow,
  type HomeworkFollowupRow,
} from "@/services/homeworkDayLogQueries"

import { HomeworkDayLogAttachmentThumbs } from "./HomeworkDayLogAttachmentThumbs"

const SELECT_CLASS = "h-10 w-full rounded-md border border-input bg-background px-2"

function boolToSelect(v: boolean | null): string {
  if (v === true) return "yes"
  if (v === false) return "no"
  return ""
}

function selectToBool(v: string): boolean | null {
  if (v === "yes") return true
  if (v === "no") return false
  return null
}

function formatClock(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat("zh-HK", {
      timeZone: "Asia/Hong_Kong",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** 表單用分段選擇（觸控 h-10）；比 Select 少一次點擊。 */
function FormChoiceChips({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex min-h-10 min-w-[3.25rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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

const YES_NO_OPTIONS = [
  { value: "yes", label: "是" },
  { value: "no", label: "否" },
] as const

const HANDBOOK_OPTIONS = [
  { value: "has_photo", label: "有手冊圖" },
  { value: "no_handbook", label: "無手冊" },
  { value: "no_homework", label: "無功課" },
] as const

type Props = {
  students: HomeworkStudentRow[]
  hwTeachers: HomeworkTeacherRow[]
  todayDuty: HomeworkDutyDay | null
  todayWeekday: Weekday | null
  holidays: HomeworkHoliday[]
  academicYearLabel: string
  canDelete: boolean
  preferredTeacherId?: string | null
}

export function HomeworkDayLogTodayPanel({
  students,
  hwTeachers,
  todayDuty,
  todayWeekday,
  holidays,
  academicYearLabel,
  canDelete,
  preferredTeacherId,
}: Props) {
  const { pushBanner } = useAppBanner()
  const logDate = todayYmdLocal()
  const coming = useMemo(
    () => studentsComingOnWeekday(students, todayWeekday),
    [students, todayWeekday]
  )
  const comingIdsKey = useMemo(() => coming.map((s) => s.id).sort().join(","), [coming])
  const closureSet = useMemo(
    () => homeworkClosureYmdSet(holidays, academicYearLabel),
    [holidays, academicYearLabel]
  )
  const defaultTeacherId = useMemo(() => {
    const duties = todayDuty ? dutyAssignments(todayDuty) : []
    const firstDuty = duties[0]?.teacherId
    if (preferredTeacherId && hwTeachers.some((t) => t.id === preferredTeacherId)) {
      return preferredTeacherId
    }
    return firstDuty ?? hwTeachers[0]?.id ?? null
  }, [todayDuty, preferredTeacherId, hwTeachers])

  const [logs, setLogs] = useState<HomeworkDayLogRow[]>([])
  const [followups, setFollowups] = useState<HomeworkFollowupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [stampingId, setStampingId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const ids = comingIdsKey ? comingIdsKey.split(",") : []
      const [logRows, followRows] = await Promise.all([
        listHomeworkDayLogsForDate(logDate),
        ids.length > 0
          ? listActiveHomeworkFollowups({ studentIds: ids, asOfDate: logDate })
          : Promise.resolve([] as HomeworkFollowupRow[]),
      ])
      setLogs(logRows)
      setFollowups(followRows)
    } catch (e) {
      pushBanner({
        title: "載入每日紀錄失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    } finally {
      setLoading(false)
    }
  }, [comingIdsKey, logDate, pushBanner])

  useEffect(() => {
    void reload()
  }, [reload])

  const logByStudent = useMemo(() => {
    const m = new Map<string, HomeworkDayLogRow>()
    for (const l of logs) m.set(l.studentId, l)
    return m
  }, [logs])

  const followupsByStudent = useMemo(() => {
    const m = new Map<string, HomeworkFollowupRow[]>()
    for (const f of followups) {
      const list = m.get(f.studentId) ?? []
      list.push(f)
      m.set(f.studentId, list)
    }
    return m
  }, [followups])

  const editingStudent = coming.find((s) => s.id === editingStudentId) ?? null
  const openCount = coming.filter((s) => homeworkDayLogPhase(logByStudent.get(s.id)) === "open").length
  const leftCount = coming.filter((s) => homeworkDayLogPhase(logByStudent.get(s.id)) === "left").length
  const noneCount = coming.filter((s) => homeworkDayLogPhase(logByStudent.get(s.id)) === "none").length

  const stampRoster = async (studentId: string, which: "arrived" | "left", clear = false) => {
    setStampingId(`${studentId}:${which}`)
    try {
      await stampHomeworkDayLogClock({
        studentId,
        logDate,
        teacherId: defaultTeacherId,
        which,
        clear,
      })
      await reload()
      pushBanner({
        title: clear
          ? which === "arrived"
            ? "已清除到達"
            : "已清除離開"
          : which === "arrived"
            ? "已記錄到達"
            : "已記錄離開",
        tone: "success",
        message: coming.find((s) => s.id === studentId)?.name ?? "",
      })
    } catch (e) {
      pushBanner({
        title: "更新失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    } finally {
      setStampingId(null)
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">今日學生紀錄</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {logDate}
            {todayWeekday ? ` · 慣常逢星期${todayWeekday}` : ""}
            {" · "}
            應到 {coming.length} · 進行中 {openCount} · 已離開 {leftCount}
            {noneCount > 0 ? ` · 未建檔 ${noneCount}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            學生到達時先按「到」建檔，上課期間可多次更新與拍照，離開時再按「離」。
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          重新整理
        </Button>
      </div>

      {todayDuty?.holiday ? (
        <p className="text-sm text-muted-foreground">今日功輔放假，通常無需寫紀錄。</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : coming.length === 0 ? (
        <p className="text-sm text-muted-foreground">今日無名冊應到學生。</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {coming.map((s) => {
            const log = logByStudent.get(s.id)
            const phase = homeworkDayLogPhase(log)
            const openFollow = followupsByStudent.get(s.id)?.length ?? 0
            const coreOk = homeworkDayLogCoreFilled(log)
            const busy = stampingId?.startsWith(`${s.id}:`)
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {s.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {s.code} · {s.grade}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Tag
                      tone={phase === "left" ? "success" : phase === "open" ? "info" : "warning"}
                      size="sm"
                    >
                      {homeworkDayLogPhaseLabel(phase)}
                    </Tag>
                    {phase !== "none" && !coreOk ? (
                      <Tag tone="warning" size="sm">
                        日結未齊
                      </Tag>
                    ) : null}
                    {openFollow > 0 ? (
                      <Tag tone="info" size="sm">
                        持續 {openFollow}
                      </Tag>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      到 {formatClock(log?.arrivedAt ?? null)}
                      {" · "}
                      離 {formatClock(log?.leftAt ?? null)}
                    </span>
                    {log?.fullTwoHours != null ? (
                      <span className="text-xs text-muted-foreground">
                        兩小時{log.fullTwoHours ? "✓" : "✗"}
                      </span>
                    ) : null}
                    {log?.homeworkDone != null ? (
                      <span className="text-xs text-muted-foreground">
                        功課{log.homeworkDone ? "✓" : "✗"}
                      </span>
                    ) : null}
                    {log?.handbookStatus ? (
                      <span className="text-xs text-muted-foreground">
                        {log.handbookStatus === "has_photo"
                          ? "有手冊圖"
                          : log.handbookStatus === "no_handbook"
                            ? "無手冊"
                            : "無功課"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={log?.arrivedAt ? "outline" : "default"}
                    disabled={Boolean(busy)}
                    onClick={() => void stampRoster(s.id, "arrived", Boolean(log?.arrivedAt))}
                  >
                    {log?.arrivedAt ? "清到" : "到"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={log?.leftAt ? "outline" : "secondary"}
                    disabled={Boolean(busy)}
                    onClick={() => void stampRoster(s.id, "left", Boolean(log?.leftAt))}
                  >
                    {log?.leftAt ? "清離" : "離"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingStudentId(s.id)}
                  >
                    {phase === "none" ? "詳情" : "更新"}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editingStudent ? (
        <HomeworkDayLogEditorDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditingStudentId(null)
          }}
          student={editingStudent}
          logDate={logDate}
          existing={logByStudent.get(editingStudent.id) ?? null}
          followups={followupsByStudent.get(editingStudent.id) ?? []}
          hwTeachers={hwTeachers}
          defaultTeacherId={defaultTeacherId}
          academicYearLabel={academicYearLabel}
          canDelete={canDelete}
          nextSchoolDay={nextHomeworkSchoolDay(logDate, closureSet)}
          onSaved={async ({ advance } = {}) => {
            const currentId = editingStudent.id
            const written = new Set(logByStudent.keys())
            written.add(currentId)
            const nextId =
              advance === true
                ? nextUnwrittenStudentId(coming, currentId, written)
                : null
            await reload()
            // 漸進填寫：預設留在同一生；僅「儲存並下一位」才跳
            setEditingStudentId(advance === true ? nextId : currentId)
          }}
          onClockStamped={async () => {
            await reload()
          }}
        />
      ) : null}
    </section>
  )
}


export function HomeworkDayLogEditorDialog({
  open,
  onOpenChange,
  student,
  logDate,
  existing,
  followups,
  hwTeachers,
  defaultTeacherId,
  academicYearLabel,
  canDelete,
  nextSchoolDay,
  onSaved,
  onClockStamped,
  allowAdvance = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: HomeworkStudentRow
  logDate: string
  existing: HomeworkDayLogRow | null
  followups: HomeworkFollowupRow[]
  hwTeachers: HomeworkTeacherRow[]
  defaultTeacherId: string | null
  academicYearLabel: string
  canDelete: boolean
  nextSchoolDay: string
  onSaved: (opts?: { advance?: boolean }) => Promise<void>
  /** 到／離即時打卡後通知父層刷新名冊 */
  onClockStamped?: () => Promise<void>
  /** 今日名冊批次用；單生時間軸關閉 */
  allowAdvance?: boolean
}) {
  const { pushBanner } = useAppBanner()
  const [teacherId, setTeacherId] = useState(existing?.teacherId ?? defaultTeacherId ?? "")
  const [arrivedAt, setArrivedAt] = useState<string | null>(existing?.arrivedAt ?? null)
  const [leftAt, setLeftAt] = useState<string | null>(existing?.leftAt ?? null)
  const [fullTwoHours, setFullTwoHours] = useState(boolToSelect(existing?.fullTwoHours ?? null))
  const [hoursNote, setHoursNote] = useState(existing?.hoursNote ?? "")
  const [homeworkDone, setHomeworkDone] = useState(boolToSelect(existing?.homeworkDone ?? null))
  const [homeworkOwed, setHomeworkOwed] = useState(existing?.homeworkOwed ?? "")
  const [hasDictation, setHasDictation] = useState(boolToSelect(existing?.hasDictation ?? null))
  const [revisionNote, setRevisionNote] = useState(existing?.revisionNote ?? "")
  const [handbookStatus, setHandbookStatus] = useState(existing?.handbookStatus ?? "")
  const [parentNote, setParentNote] = useState(existing?.parentNote ?? "")
  const [staffOnlyNote, setStaffOnlyNote] = useState(existing?.staffOnlyNote ?? "")
  const [standing, setStanding] = useState("")
  const [standingLoaded, setStandingLoaded] = useState(false)
  const [editingStanding, setEditingStanding] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [attachments, setAttachments] = useState<HomeworkDayLogAttachmentRow[]>([])
  const [followKind, setFollowKind] = useState<HwFollowupKind>("homework")
  const [followBody, setFollowBody] = useState("")
  const [followEndsOn, setFollowEndsOn] = useState(nextSchoolDay)
  const [attachKind, setAttachKind] = useState<HwDayLogAttachmentKind>("handbook")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [localFollowups, setLocalFollowups] = useState(followups)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [localLogId, setLocalLogId] = useState<string | null>(existing?.id ?? null)

  // 切換學生／日期才重載整表；到離即時打卡後只同步時間，勿洗掉未儲存欄位。
  useEffect(() => {
    setTeacherId(existing?.teacherId ?? defaultTeacherId ?? "")
    setArrivedAt(existing?.arrivedAt ?? null)
    setLeftAt(existing?.leftAt ?? null)
    setFullTwoHours(boolToSelect(existing?.fullTwoHours ?? null))
    setHoursNote(existing?.hoursNote ?? "")
    setHomeworkDone(boolToSelect(existing?.homeworkDone ?? null))
    setHomeworkOwed(existing?.homeworkOwed ?? "")
    setHasDictation(boolToSelect(existing?.hasDictation ?? null))
    setRevisionNote(existing?.revisionNote ?? "")
    setHandbookStatus(existing?.handbookStatus ?? "")
    setParentNote(existing?.parentNote ?? "")
    setStaffOnlyNote(existing?.staffOnlyNote ?? "")
    setLocalFollowups(followups)
    setFollowEndsOn(nextSchoolDay)
    setConfirmDelete(false)
    setFormError(null)
    setLocalLogId(existing?.id ?? null)
    setEditingStanding(false)
    setStandingLoaded(false)
    setShowMore(
      followups.length > 0 ||
        Boolean(existing?.staffOnlyNote?.trim()) ||
        Boolean(existing?.revisionNote?.trim()) ||
        existing?.hasDictation != null
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 僅學生／日期切換時整表重載
  }, [student.id, logDate])

  useEffect(() => {
    setArrivedAt(existing?.arrivedAt ?? null)
    setLeftAt(existing?.leftAt ?? null)
    if (existing?.id) setLocalLogId(existing.id)
    if (existing?.teacherId) setTeacherId(existing.teacherId)
  }, [existing?.id, existing?.arrivedAt, existing?.leftAt, existing?.teacherId])

  useEffect(() => {
    setLocalFollowups(followups)
  }, [followups])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const text = await fetchHomeworkStandingInstructions(student.id)
        if (!cancelled) {
          setStanding(text)
          setStandingLoaded(true)
          if (!text.trim()) setEditingStanding(true)
        }
        if (existing?.id) {
          const atts = await listHomeworkDayLogAttachments(existing.id)
          if (!cancelled) setAttachments(atts)
        } else if (!cancelled) {
          setAttachments([])
        }
      } catch (e) {
        if (!cancelled) {
          pushBanner({
            title: "載入學生資料失敗",
            tone: "error",
            message: formatUnknownError(e),
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [student.id, existing?.id, pushBanner])

  const buildInput = (handbookFallback?: HwHandbookStatus | null) => ({
    studentId: student.id,
    logDate,
    teacherId: teacherId || null,
    arrivedAt,
    leftAt,
    fullTwoHours: selectToBool(fullTwoHours),
    hoursNote,
    homeworkDone: selectToBool(homeworkDone),
    homeworkOwed,
    hasDictation: selectToBool(hasDictation),
    revisionNote,
    handbookStatus: (handbookStatus || handbookFallback || null) as HwHandbookStatus | null,
    parentNote,
    staffOnlyNote,
  })

  const validateConditional = (): string | null => {
    if (fullTwoHours === "no" && !hoursNote.trim()) return "未足兩小時請填寫原因。"
    if (homeworkDone === "no" && !homeworkOwed.trim()) return "未完成功課請填寫欠什麼。"
    return null
  }

  const completenessHint = (): string | null => {
    const missing: string[] = []
    if (!arrivedAt) missing.push("到達")
    if (!fullTwoHours) missing.push("兩小時")
    if (!homeworkDone) missing.push("功課")
    if (!handbookStatus) missing.push("手冊")
    if (!leftAt) missing.push("離開")
    if (missing.length === 0) return null
    return `尚可稍後補：${missing.join("、")}（可先儲存，不必一次填完）。`
  }

  const stampClock = async (which: "arrived" | "left", clear: boolean) => {
    setSaving(true)
    setFormError(null)
    try {
      const row = await stampHomeworkDayLogClock({
        studentId: student.id,
        logDate,
        teacherId: teacherId || defaultTeacherId,
        which,
        clear,
      })
      setArrivedAt(row.arrivedAt)
      setLeftAt(row.leftAt)
      setLocalLogId(row.id)
      if (row.teacherId) setTeacherId(row.teacherId)
      pushBanner({
        title: clear
          ? which === "arrived"
            ? "已清除到達"
            : "已清除離開"
          : which === "arrived"
            ? "已記錄到達並建檔"
            : "已記錄離開",
        tone: "success",
        message: student.name,
      })
      await onClockStamped?.()
    } catch (e) {
      setFormError(formatUnknownError(e))
    } finally {
      setSaving(false)
    }
  }

  const save = async (advance: boolean) => {
    const err = validateConditional()
    if (err) {
      setFormError(err)
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      await upsertHomeworkDayLog(buildInput())
      await upsertHomeworkStandingInstructions(student.id, standing)
      pushBanner({
        title: "已更新",
        tone: "success",
        message: advance ? `${student.name} · 下一位未建檔` : `${student.name} 的今日紀錄`,
      })
      await onSaved({ advance })
    } catch (e) {
      pushBanner({
        title: "儲存失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setSaving(true)
    try {
      let logId = localLogId ?? existing?.id
      if (!logId) {
        const row = await upsertHomeworkDayLog(buildInput("has_photo"))
        logId = row.id
        setLocalLogId(row.id)
        if (!handbookStatus) setHandbookStatus("has_photo")
      }
      const att = await uploadHomeworkDayLogAttachment({
        logId,
        studentId: student.id,
        logDate,
        academicYearLabel,
        kind: attachKind,
        file: fileList[0]!,
      })
      setAttachments((prev) => [...prev, att])
      pushBanner({ title: "已上載相片", tone: "success", message: att.fileName })
    } catch (e) {
      pushBanner({
        title: "上載失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    } finally {
      setSaving(false)
    }
  }

  const standingSummary = standing.trim()
  const showStandingReadonly = standingLoaded && standingSummary.length > 0 && !editingStanding

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {student.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{logDate}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}
          {completenessHint() ? (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {completenessHint()}
            </p>
          ) : leftAt ? (
            <p className="text-xs text-muted-foreground">核心欄位已齊，並已記錄離開。</p>
          ) : (
            <p className="text-xs text-muted-foreground">核心欄位已齊；學生離開時請按「離開」。</p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">負責老師</label>
            <Select
              className={SELECT_CLASS}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">選擇老師</option>
              {hwTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">到達（即時寫入）</p>
              <p className="text-sm tabular-nums">{formatClock(arrivedAt)}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void stampClock("arrived", false)}
                >
                  到達
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving || !arrivedAt}
                  onClick={() => void stampClock("arrived", true)}
                >
                  清除
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">離開（即時寫入）</p>
              <p className="text-sm tabular-nums">{formatClock(leftAt)}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void stampClock("left", false)}
                >
                  離開
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving || !leftAt}
                  onClick={() => void stampClock("left", true)}
                >
                  清除
                </Button>
              </div>
            </div>
          </div>

          <FormChoiceChips
            label="已上足兩小時"
            value={fullTwoHours}
            onChange={(v) => {
              setFullTwoHours(v)
              setFormError(null)
            }}
            options={[...YES_NO_OPTIONS]}
          />
          {fullTwoHours === "no" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">原因</label>
              <Input
                value={hoursNote}
                onChange={(e) => setHoursNote(e.target.value)}
                className="h-10"
              />
            </div>
          ) : null}

          <FormChoiceChips
            label="已完成功課"
            value={homeworkDone}
            onChange={(v) => {
              setHomeworkDone(v)
              setFormError(null)
            }}
            options={[...YES_NO_OPTIONS]}
          />
          {homeworkDone === "no" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">欠什麼</label>
              <Input
                value={homeworkOwed}
                onChange={(e) => setHomeworkOwed(e.target.value)}
                className="h-10"
              />
            </div>
          ) : null}

          <FormChoiceChips
            label="手冊狀態"
            value={handbookStatus}
            onChange={(v) => {
              setHandbookStatus(v)
              setFormError(null)
            }}
            options={[...HANDBOOK_OPTIONS]}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">家長可見備註</label>
            <Textarea value={parentNote} onChange={(e) => setParentNote(e.target.value)} rows={2} />
          </div>

          {standingLoaded ? (
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">常設指示</p>
                {showStandingReadonly ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => {
                      setShowMore(true)
                      setEditingStanding(true)
                    }}
                  >
                    編輯
                  </Button>
                ) : null}
              </div>
              {showStandingReadonly ? (
                <p className="line-clamp-2 whitespace-pre-wrap text-sm text-foreground">
                  {standingSummary}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {standingSummary ? "請在下方「更多」編輯。" : "尚未設定；可在「更多」填寫。"}
                </p>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40"
            aria-expanded={showMore}
            onClick={() => setShowMore((v) => !v)}
          >
            <span>更多（默測、職員備註、持續項目、相片）</span>
            {showMore ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
          </button>

          {showMore ? (
            <div className="space-y-4 rounded-lg border border-dashed border-border p-3">
              <FormChoiceChips
                label="有默測"
                value={hasDictation}
                onChange={setHasDictation}
                options={[...YES_NO_OPTIONS]}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">溫習狀態</label>
                <Input
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">僅職員備註</label>
                <Textarea
                  value={staffOnlyNote}
                  onChange={(e) => setStaffOnlyNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">常設指示（職員可寫）</label>
                <Textarea
                  value={standing}
                  onChange={(e) => {
                    setStanding(e.target.value)
                    setEditingStanding(true)
                  }}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">持續項目（至結束日）</p>
                {localFollowups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">無活躍項目</p>
                ) : (
                  <ul className="space-y-2">
                    {localFollowups.map((f) => (
                      <li key={f.id} className="flex items-start justify-between gap-2 text-sm">
                        <span>
                          <Tag tone="info" size="sm">
                            {f.kind === "homework" ? "欠功課" : "默測"}
                          </Tag>{" "}
                          {f.body}
                          <span className="ml-1 text-xs text-muted-foreground">至 {f.endsOn}</span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void (async () => {
                              try {
                                await completeHomeworkFollowup(f.id)
                                setLocalFollowups((prev) => prev.filter((x) => x.id !== f.id))
                              } catch (e) {
                                pushBanner({
                                  title: "標記失敗",
                                  tone: "error",
                                  message: formatUnknownError(e),
                                })
                              }
                            })()
                          }}
                        >
                          完成
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    className={SELECT_CLASS}
                    value={followKind}
                    onChange={(e) => setFollowKind(e.target.value as HwFollowupKind)}
                  >
                    <option value="homework">欠功課</option>
                    <option value="dictation">默測</option>
                  </Select>
                  <Input
                    type="date"
                    value={followEndsOn}
                    onChange={(e) => setFollowEndsOn(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Input
                  placeholder="內容"
                  value={followBody}
                  onChange={(e) => setFollowBody(e.target.value)}
                  className="h-10"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFollowEndsOn(nextSchoolDay)}
                  >
                    結束日＝下一上課日
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void (async () => {
                        if (!followBody.trim()) {
                          pushBanner({
                            title: "請填寫內容",
                            tone: "error",
                            message: "持續項目不可空白。",
                          })
                          return
                        }
                        try {
                          const row = await createHomeworkFollowup({
                            studentId: student.id,
                            kind: followKind,
                            body: followBody.trim(),
                            endsOn: followEndsOn,
                          })
                          setLocalFollowups((prev) => [...prev, row])
                          setFollowBody("")
                          pushBanner({ title: "已新增持續項目", tone: "success", message: row.body })
                        } catch (e) {
                          pushBanner({
                            title: "新增失敗",
                            tone: "error",
                            message: formatUnknownError(e),
                          })
                        }
                      })()
                    }}
                  >
                    新增持續項目
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">新增／完成會即時寫入，無需按主儲存。</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  相片（最多 {HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY} 張）
                </p>
                <Select
                  className={SELECT_CLASS}
                  value={attachKind}
                  onChange={(e) => setAttachKind(e.target.value as HwDayLogAttachmentKind)}
                >
                  <option value="handbook">手冊</option>
                  <option value="dictation">默書紙</option>
                  <option value="other">其他</option>
                </Select>
                <Input
                  type="file"
                  accept={HW_DAY_LOG_ATTACHMENT_ACCEPT}
                  disabled={saving || attachments.length >= HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY}
                  onChange={(e) => {
                    void onUpload(e.target.files)
                    e.target.value = ""
                  }}
                />
                <HomeworkDayLogAttachmentThumbs
                  attachments={attachments}
                  canDelete
                  onDeleted={(id) => setAttachments((prev) => prev.filter((x) => x.id !== id))}
                />
                <p className="text-[11px] text-muted-foreground">上載會即時寫入。</p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {canDelete && existing ? (
              confirmDelete ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={saving}
                    onClick={() => {
                      void (async () => {
                        setSaving(true)
                        try {
                          await deleteHomeworkDayLog(existing.id)
                          pushBanner({ title: "已刪除", tone: "success", message: student.name })
                          await onSaved({ advance: false })
                        } catch (e) {
                          pushBanner({
                            title: "刪除失敗",
                            tone: "error",
                            message: formatUnknownError(e),
                          })
                        } finally {
                          setSaving(false)
                        }
                      })()
                    }}
                  >
                    確認刪除
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
                    取消刪除
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
                  刪除紀錄
                </Button>
              )
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              關閉
            </Button>
            {allowAdvance ? (
              <Button
                type="button"
                variant="outline"
                loading={saving}
                loadingText="儲存中…"
                onClick={() => void save(true)}
              >
                更新並下一位
              </Button>
            ) : null}
            <Button type="button" loading={saving} loadingText="儲存中…" onClick={() => void save(false)}>
              更新紀錄
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
