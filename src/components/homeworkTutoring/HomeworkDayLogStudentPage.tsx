import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
  homeworkClosureYmdSet,
  homeworkDayLogCoreFilled,
  homeworkDayLogPhase,
  homeworkDayLogPhaseLabel,
  nextHomeworkSchoolDay,
  todayYmdLocal,
} from "@/lib/homeworkDayLogDates"
import { HW_PATH } from "@/lib/homeworkTutoringNav"
import {
  dutyAssignments,
  formatWeekdaysShort,
  type HomeworkDutyDay,
  type HomeworkHoliday,
  type HomeworkStudentRow,
  type HomeworkTeacherRow,
} from "@/lib/homeworkTutoringUi"
import {
  fetchHomeworkStandingInstructions,
  listActiveHomeworkFollowups,
  listHomeworkDayLogAttachmentsForStudent,
  listHomeworkDayLogsForStudent,
  type HomeworkDayLogAttachmentRow,
  type HomeworkDayLogRow,
  type HomeworkFollowupRow,
} from "@/services/homeworkDayLogQueries"

import { HomeworkDayLogAttachmentThumbs } from "./HomeworkDayLogAttachmentThumbs"
import { HomeworkDayLogEditorDialog } from "./HomeworkDayLogTodayPanel"

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

function handbookLabel(status: string | null): string {
  if (status === "has_photo") return "有手冊圖"
  if (status === "no_handbook") return "無手冊"
  if (status === "no_homework") return "無功課"
  return "—"
}

function yesNo(v: boolean | null): string {
  if (v === true) return "是"
  if (v === false) return "否"
  return "—"
}

type Props = {
  student: HomeworkStudentRow
  hwTeachers: HomeworkTeacherRow[]
  todayDuty: HomeworkDutyDay | null
  holidays: HomeworkHoliday[]
  academicYearLabel: string
  canDelete: boolean
  preferredTeacherId?: string | null
  /** 返回圖庫的列表路徑。 */
  listPath?: string
}

/** 單生功課紀錄時間軸（由圖庫卡片進入）。 */
export function HomeworkDayLogStudentPage({
  student,
  hwTeachers,
  todayDuty,
  holidays,
  academicYearLabel,
  canDelete,
  preferredTeacherId,
  listPath = HW_PATH.dayLogs,
}: Props) {
  const { pushBanner } = useAppBanner()
  const [logs, setLogs] = useState<HomeworkDayLogRow[]>([])
  const [attachments, setAttachments] = useState<HomeworkDayLogAttachmentRow[]>([])
  const [followups, setFollowups] = useState<HomeworkFollowupRow[]>([])
  const [standing, setStanding] = useState("")
  const [standingLoaded, setStandingLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null)

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

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const asOf = todayYmdLocal()
      const [logRows, attRows, followRows, standingText] = await Promise.all([
        listHomeworkDayLogsForStudent(student.id),
        listHomeworkDayLogAttachmentsForStudent(student.id),
        listActiveHomeworkFollowups({ studentIds: [student.id], asOfDate: asOf }),
        fetchHomeworkStandingInstructions(student.id),
      ])
      setLogs(logRows)
      setAttachments(attRows)
      setFollowups(followRows)
      setStanding(standingText)
      setStandingLoaded(true)
    } catch (e) {
      pushBanner({
        title: "載入學生功課紀錄失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    } finally {
      setLoading(false)
    }
  }, [student.id, pushBanner])

  useEffect(() => {
    void reload()
  }, [reload])

  const attachmentsByLog = useMemo(() => {
    const m = new Map<string, HomeworkDayLogAttachmentRow[]>()
    for (const a of attachments) {
      const list = m.get(a.logId) ?? []
      list.push(a)
      m.set(a.logId, list)
    }
    return m
  }, [attachments])

  const teacherName = useCallback(
    (id: string | null) => {
      if (!id) return "—"
      return hwTeachers.find((t) => t.id === id)?.name ?? "—"
    },
    [hwTeachers]
  )

  const editingLog = editingLogDate
    ? logs.find((l) => l.logDate === editingLogDate) ?? null
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            to={listPath}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            返回圖庫
          </Link>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{student.name}</h2>
          <p className="text-sm text-muted-foreground">
            {student.code} · {student.grade}
            {student.weekdays.length > 0
              ? ` · 逢${formatWeekdaysShort(student.weekdays)}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
            重新整理
          </Button>
          <Button type="button" size="sm" onClick={() => setEditingLogDate(todayYmdLocal())}>
            更新今日
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">常設指示</p>
            {standingLoaded && standing.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{standing}</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">尚未設定常設指示。</p>
            )}
          </section>

          {followups.length > 0 ? (
            <section className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                進行中持續項目
              </p>
              <ul className="space-y-1.5">
                {followups.map((f) => (
                  <li key={f.id} className="text-sm">
                    <Tag tone="info" size="sm">
                      {f.kind === "homework" ? "欠功課" : "默測"}
                    </Tag>{" "}
                    {f.body}
                    <span className="ml-1 text-xs text-muted-foreground">至 {f.endsOn}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold">每日紀錄</h3>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚無每日紀錄。到達時可按「更新今日」建檔。</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => {
                  const atts = attachmentsByLog.get(log.id) ?? []
                  const phase = homeworkDayLogPhase(log)
                  const coreOk = homeworkDayLogCoreFilled(log)
                  return (
                    <li key={log.id} className="rounded-lg border border-border px-3 py-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-medium">{log.logDate}</p>
                            <Tag
                              tone={
                                phase === "left" ? "success" : phase === "open" ? "info" : "warning"
                              }
                              size="sm"
                            >
                              {homeworkDayLogPhaseLabel(phase)}
                            </Tag>
                            {!coreOk ? (
                              <Tag tone="warning" size="sm">
                                日結未齊
                              </Tag>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            負責：{teacherName(log.teacherId)} · 到 {formatClock(log.arrivedAt)} · 離{" "}
                            {formatClock(log.leftAt)}
                          </p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:max-w-md">
                            <span>
                              兩小時 {yesNo(log.fullTwoHours)}
                              {log.hoursNote ? `（${log.hoursNote}）` : ""}
                            </span>
                            <span>
                              功課 {yesNo(log.homeworkDone)}
                              {log.homeworkOwed ? `（欠：${log.homeworkOwed}）` : ""}
                            </span>
                            <span>默測 {yesNo(log.hasDictation)}</span>
                            <span>手冊 {handbookLabel(log.handbookStatus)}</span>
                          </div>
                          {log.revisionNote ? (
                            <p className="text-sm">溫習：{log.revisionNote}</p>
                          ) : null}
                          {log.parentNote ? (
                            <p className="text-sm">家長備註：{log.parentNote}</p>
                          ) : null}
                          {log.staffOnlyNote ? (
                            <p className="text-sm text-warning">職員：{log.staffOnlyNote}</p>
                          ) : null}
                          {atts.length > 0 ? (
                            <HomeworkDayLogAttachmentThumbs
                              attachments={atts}
                              emptyLabel=""
                            />
                          ) : null}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingLogDate(log.logDate)}
                        >
                          更新
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {editingLogDate ? (
        <HomeworkDayLogEditorDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditingLogDate(null)
          }}
          student={student}
          logDate={editingLogDate}
          existing={editingLog}
          followups={followups}
          hwTeachers={hwTeachers}
          defaultTeacherId={defaultTeacherId}
          academicYearLabel={academicYearLabel}
          canDelete={canDelete}
          nextSchoolDay={nextHomeworkSchoolDay(editingLogDate, closureSet)}
          allowAdvance={false}
          onSaved={async () => {
            await reload()
            // 漸進填寫：留在詳情，可繼續拍照／改欄
          }}
          onClockStamped={async () => {
            await reload()
          }}
        />
      ) : null}
    </div>
  )
}
