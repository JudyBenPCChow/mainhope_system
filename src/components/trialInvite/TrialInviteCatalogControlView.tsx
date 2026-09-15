import { Fragment, useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Link } from "react-router-dom"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { BulkSelectionBar } from "@/components/list/BulkSelectionBar"
import { SortableColumnHeader } from "@/components/list/SortableColumnHeader"
import {
  StickyListLead,
  StickyListShell,
  stickyTableBodyClass,
  stickyTableHeadCellClass,
  stickyTableHeadClass,
  stickyTableHeadRowClass,
  stickyTableWrapClass,
} from "@/components/list/StickyListShell"
import { dirMul, emptyLast, type SortDir } from "@/components/list/listFilterUtils"
import {
  useOpenClassRecord,
  useOpenStudentRecord,
  useOpenTeacherRecord,
  useRecordPreview,
} from "@/components/recordPreview/recordPreviewContext"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import {
  fetchTrialInviteCatalogControls,
  setTrialInviteClassListed,
  setTrialInviteClassesListed,
  setTrialInviteScheduleExcluded,
  type TrialInviteCatalogClassControl,
  type TrialInviteCatalogTeacherControl,
} from "@/services/trialInviteQueries"

type CatalogRow = {
  teacher: TrialInviteCatalogTeacherControl
  cls: TrialInviteCatalogClassControl
}

type SortKey = "teacher" | "class" | "count" | "time"

function classKindLabel(kind: string): string {
  if (kind === "group") return "專科班"
  if (kind === "homework") return "功課輔導班"
  return kind || "班別"
}

function scheduleLabel(s: {
  scheduledDate: string
  startTime: string
  endTime: string
  sessionNumber: number | null
}): string {
  const time =
    s.startTime && s.endTime
      ? `${s.startTime}–${s.endTime}`
      : s.startTime || "—"
  const session =
    s.sessionNumber != null && Number.isFinite(s.sessionNumber)
      ? ` · 第${s.sessionNumber}節`
      : ""
  return `${s.scheduledDate || "—"} ${time}${session}`
}

function classTimeLabel(cls: TrialInviteCatalogClassControl): string {
  const days = formatWeekdaysDisplay(cls.dayOfWeek)
  const weekly = [days, cls.timeSlot].filter(Boolean).join(" ")
  if (weekly) return weekly
  const first = cls.schedules[0]
  if (!first) return ""
  return scheduleLabel(first)
}

function classMatchesSearch(row: CatalogRow, needle: string): boolean {
  if (row.teacher.name.toLowerCase().includes(needle)) return true
  if (row.cls.label.toLowerCase().includes(needle)) return true
  if (row.cls.courseCodeFull.toLowerCase().includes(needle)) return true
  if (classTimeLabel(row.cls).toLowerCase().includes(needle)) return true
  return row.cls.enrolledStudents.some(
    (s) =>
      s.fullName.toLowerCase().includes(needle) ||
      s.studentCode.toLowerCase().includes(needle)
  )
}

export function TrialInviteCatalogControlView() {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const openStudent = useOpenStudentRecord()
  const openClass = useOpenClassRecord()
  const openTeacher = useOpenTeacherRecord()
  const { preview } = useRecordPreview()
  const previewStudentId = preview?.kind === "student" ? preview.id : null
  const previewClassId = preview?.kind === "class" ? preview.id : null
  const previewTeacherId = preview?.kind === "teacher" ? preview.id : null
  const [teachers, setTeachers] = useState<TrialInviteCatalogTeacherControl[]>([])
  const [academicYearLabel, setAcademicYearLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("teacher")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [scheduleClass, setScheduleClass] = useState<TrialInviteCatalogClassControl | null>(null)

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchTrialInviteCatalogControls()
      setAcademicYearLabel(data.academicYearLabel)
      setTeachers(data.teachers)
    } catch (e) {
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.load",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const allRows = useMemo((): CatalogRow[] => {
    const out: CatalogRow[] = []
    for (const teacher of teachers) {
      for (const cls of teacher.classes) out.push({ teacher, cls })
    }
    return out
  }, [teachers])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return allRows
    return allRows.filter((row) => classMatchesSearch(row, needle))
  }, [allRows, q])

  const sorted = useMemo(() => {
    const mul = dirMul(sortDir)
    return [...filtered].sort((a, b) => {
      if (sortKey === "count") {
        const byCount = a.cls.enrolledStudents.length - b.cls.enrolledStudents.length
        if (byCount !== 0) return byCount * mul
      } else if (sortKey === "time") {
        const empty = emptyLast(!classTimeLabel(a.cls), !classTimeLabel(b.cls))
        if (empty != null) return empty
        const byTime = classTimeLabel(a.cls).localeCompare(classTimeLabel(b.cls), "zh-Hant")
        if (byTime !== 0) return byTime * mul
      } else if (sortKey === "class") {
        const byClass = a.cls.label.localeCompare(b.cls.label, "zh-Hant")
        if (byClass !== 0) return byClass * mul
      } else {
        const empty = emptyLast(!a.teacher.name.trim(), !b.teacher.name.trim())
        if (empty != null) return empty
        const byTeacher = a.teacher.name.localeCompare(b.teacher.name, "zh-Hant")
        if (byTeacher !== 0) return byTeacher * mul
      }
      return a.cls.label.localeCompare(b.cls.label, "zh-Hant")
    })
  }, [filtered, sortDir, sortKey])

  const summary = useMemo(() => {
    let classCount = 0
    let classOff = 0
    let scheduleExcl = 0
    for (const t of teachers) {
      for (const c of t.classes) {
        classCount += 1
        if (!c.listed) classOff += 1
        scheduleExcl += c.schedules.filter((s) => s.excluded).length
      }
    }
    return { classCount, classOff, scheduleExcl }
  }, [teachers])

  const allFilteredSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.cls.id))
  const someFilteredSelected = sorted.some((r) => selected.has(r.cls.id))

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(sorted.map((r) => r.cls.id)))
  }

  const applyListed = (classIds: Set<string> | string[], listed: boolean) => {
    const ids = classIds instanceof Set ? classIds : new Set(classIds)
    setTeachers((cur) =>
      cur.map((t) => ({
        ...t,
        classes: t.classes.map((c) => (ids.has(c.id) ? { ...c, listed } : c)),
      }))
    )
    setScheduleClass((cur) => (cur && ids.has(cur.id) ? { ...cur, listed } : cur))
  }

  const onToggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  const onClassListed = async (cls: TrialInviteCatalogClassControl, next: boolean) => {
    const key = `class:${cls.id}`
    setSavingKey(key)
    setErr(null)
    const prev = teachers
    applyListed([cls.id], next)
    try {
      await setTrialInviteClassListed(cls.id, next)
      pushBanner({
        title: next ? "已納入班別" : "已剔走班別",
        tone: "success",
        message: next
          ? "此班會出現在公開試堂名單（仍受未剔除的未來堂次約束）。"
          : "此班暫不出現在公開試堂名單。",
      })
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onClassListed",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingKey(null)
    }
  }

  const onBulkListed = async (listed: boolean) => {
    const ids = [...selected]
    if (ids.length === 0) return
    setBusy(true)
    setErr(null)
    const prev = teachers
    applyListed(selected, listed)
    try {
      await setTrialInviteClassesListed(ids, listed)
      pushBanner({
        title: listed ? "已批量納入" : "已批量剔走",
        tone: "success",
        message: listed
          ? `共 ${ids.length} 班會出現在公開試堂名單。`
          : `共 ${ids.length} 班暫不出現在公開試堂名單。`,
      })
      setSelected(new Set())
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onBulkListed",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const onScheduleOpen = async (
    classId: string,
    scheduleId: string,
    openInCatalog: boolean
  ) => {
    const key = `schedule:${scheduleId}`
    setSavingKey(key)
    setErr(null)
    const prev = teachers
    const patch = (cls: TrialInviteCatalogClassControl) =>
      cls.id !== classId
        ? cls
        : {
            ...cls,
            schedules: cls.schedules.map((s) =>
              s.id === scheduleId ? { ...s, excluded: !openInCatalog } : s
            ),
          }
    setTeachers((cur) =>
      cur.map((t) => ({
        ...t,
        classes: t.classes.map(patch),
      }))
    )
    setScheduleClass((cur) => (cur ? patch(cur) : cur))
    try {
      await setTrialInviteScheduleExcluded(scheduleId, !openInCatalog)
      pushBanner({
        title: openInCatalog ? "已開放堂次" : "已剔除堂次",
        tone: "success",
        message: openInCatalog
          ? "家長可在邀請連結中選取此堂次。"
          : "此堂次不再出現於公開試堂名單。",
      })
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onScheduleOpen",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <StickyListShell
      sticky={!isMobile}
      header={
        <>
          <AdminPageHeader
            eyebrow="行政工作"
            title="試堂名單控管"
            description={
              academicYearLabel
                ? `只列出目前學年（${academicYearLabel}）的專科班與功課輔導班。預設全部可出現。可剔選單班或批量納入／剔走試堂資格，亦可剔除某一堂排程。變更即時影響未提交的公開邀請連結。`
                : "只列出目前學年的專科班與功課輔導班。預設全部可出現。可剔選單班或批量納入／剔走試堂資格，亦可剔除某一堂排程。變更即時影響未提交的公開邀請連結。"
            }
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link to="/TrialInviteCampaign">返回試堂邀請</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void load()}
                  disabled={loading}
                >
                  重新整理
                </Button>
              </div>
            }
          />

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Tag tone={statusToTagTone("待")}>
              班別移出 {summary.classOff}/{summary.classCount}
            </Tag>
            <Tag tone={statusToTagTone("取消")}>排程剔除 {summary.scheduleExcl}</Tag>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋老師、班別、課程代碼或在讀學生"
              className="pl-9"
              aria-label="搜尋試堂名單"
            />
          </div>
        </>
      }
    >
      {err ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {err}
        </div>
      ) : null}

      <StickyListLead>
        <BulkSelectionBar
          selectedCount={selected.size}
          unitLabel="班"
          allFilteredSelected={allFilteredSelected}
          onToggleSelectAll={toggleSelectAllFiltered}
          onClear={() => setSelected(new Set())}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || selected.size === 0}
            onClick={() => void onBulkListed(true)}
          >
            納入試堂
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || selected.size === 0}
            onClick={() => void onBulkListed(false)}
          >
            剔走試堂
          </Button>
        </BulkSelectionBar>
      </StickyListLead>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {q.trim()
            ? "沒有符合搜尋的專科班或功課輔導班。"
            : "目前學年沒有專科班或功課輔導班。"}
        </p>
      ) : (
        <div className={stickyTableWrapClass}>
          <table className="w-full min-w-[68rem] table-fixed border-separate border-spacing-0 text-sm isolate">
            <thead className={stickyTableHeadClass}>
              <tr className={cn(stickyTableHeadRowClass, "text-xs font-medium text-muted-foreground")}>
                <th className={cn(stickyTableHeadCellClass, "w-10 px-3 py-2")}>
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected && !allFilteredSelected}
                    onCheckedChange={() => toggleSelectAllFiltered()}
                    aria-label="全選目前列表"
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[13%] px-3 py-2")}>
                  <SortableColumnHeader
                    label="老師"
                    active={sortKey === "teacher"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("teacher")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[22%] px-3 py-2")}>
                  <SortableColumnHeader
                    label="班別"
                    active={sortKey === "class"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("class")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[5.5rem] px-3 py-2 text-center")}>
                  <SortableColumnHeader
                    label="人數"
                    active={sortKey === "count"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("count")}
                    className="justify-center"
                    labelClassName="whitespace-nowrap"
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[26%] px-3 py-2")}>學生名單</th>
                <th className={cn(stickyTableHeadCellClass, "w-[18%] px-3 py-2")}>
                  <SortableColumnHeader
                    label="時間日期"
                    active={sortKey === "time"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("time")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[6.5rem] px-3 py-2")}>納入</th>
              </tr>
            </thead>
            <tbody className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}>
              {sorted.map((row) => {
                const { teacher, cls } = row
                const classBusy = savingKey === `class:${cls.id}`
                const time = classTimeLabel(cls)
                const excludedCount = cls.schedules.filter((s) => s.excluded).length
                return (
                  <tr
                    key={cls.id}
                    className={cn(
                      selected.has(cls.id) && "bg-info/10",
                      previewClassId === cls.id && "bg-info/15"
                    )}
                  >
                    <td className="align-top px-3 py-2">
                      <Checkbox
                        checked={selected.has(cls.id)}
                        onCheckedChange={() => toggleSelected(cls.id)}
                        aria-label={`選取 ${cls.label}`}
                      />
                    </td>
                    <td className="align-top px-3 py-2">
                      {teacher.id ? (
                        <button
                          type="button"
                          className={cn(
                            "block min-w-0 text-left font-medium text-foreground hover:underline",
                            previewTeacherId === teacher.id && "text-primary"
                          )}
                          onClick={() => openTeacher(teacher.id!)}
                        >
                          {teacher.name}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">{teacher.name}</span>
                      )}
                    </td>
                    <td className="align-top px-3 py-2">
                      <button
                        type="button"
                        className="block min-w-0 text-left"
                        onClick={() => openClass(cls.id)}
                      >
                        <p className="font-medium text-foreground hover:underline">{cls.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {classKindLabel(cls.classKind)}
                        </p>
                      </button>
                    </td>
                    <td
                      className="align-top px-3 py-2 text-center tabular-nums text-muted-foreground"
                      title="僅統計報讀狀態為「就讀中」"
                    >
                      {cls.enrolledStudents.length}
                    </td>
                    <td className="align-top px-3 py-2">
                      {cls.enrolledStudents.length > 0 ? (
                        <p className="text-sm leading-relaxed">
                          {cls.enrolledStudents.map((st, idx) => {
                            const canOpen = Boolean(st.id)
                            return (
                              <Fragment key={st.id || `${cls.id}-${st.fullName}-${idx}`}>
                                {idx > 0 ? "、" : null}
                                {canOpen ? (
                                  <button
                                    type="button"
                                    className={cn(
                                      "hover:underline",
                                      previewStudentId === st.id && "font-medium text-primary"
                                    )}
                                    title={
                                      [st.fullName, st.studentCode].filter(Boolean).join(" · ")
                                    }
                                    onClick={() => openStudent(st.id)}
                                  >
                                    {st.fullName}
                                  </button>
                                ) : (
                                  st.fullName
                                )}
                              </Fragment>
                            )
                          })}
                        </p>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="align-top px-3 py-2">
                      <p>{time || "—"}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs text-primary hover:underline"
                        onClick={() => setScheduleClass(cls)}
                      >
                        {cls.schedules.length === 0
                          ? "沒有未來堂次"
                          : excludedCount > 0
                            ? `未來 ${cls.schedules.length} 堂 · 已剔除 ${excludedCount}`
                            : `未來 ${cls.schedules.length} 堂`}
                      </button>
                    </td>
                    <td className="align-top px-3 py-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={cls.listed}
                          disabled={classBusy || busy}
                          onCheckedChange={(next) => void onClassListed(cls, next)}
                          aria-label={`${cls.label}納入試堂名單`}
                        />
                        <span className={cn(!cls.listed && "text-muted-foreground")}>納入</span>
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(scheduleClass)}
        onOpenChange={(open) => !open && setScheduleClass(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>堂次控管</DialogTitle>
          </DialogHeader>
          {scheduleClass ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{scheduleClass.label}</p>
              {scheduleClass.schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">沒有未來堂次可控管。</p>
              ) : (
                <ul className="max-h-80 space-y-1.5 overflow-y-auto">
                  {scheduleClass.schedules.map((sch) => {
                    const openInCatalog = !sch.excluded
                    const schBusy = savingKey === `schedule:${sch.id}`
                    return (
                      <li
                        key={sch.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span
                          className={cn(
                            !openInCatalog && "text-muted-foreground line-through"
                          )}
                        >
                          {scheduleLabel(sch)}
                        </span>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={openInCatalog}
                            disabled={schBusy}
                            onCheckedChange={(next) =>
                              void onScheduleOpen(scheduleClass.id, sch.id, next)
                            }
                            aria-label={`${scheduleLabel(sch)}開放試堂`}
                          />
                          <span className={cn(!openInCatalog && "text-muted-foreground")}>
                            開放此堂
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </StickyListShell>
  )
}
