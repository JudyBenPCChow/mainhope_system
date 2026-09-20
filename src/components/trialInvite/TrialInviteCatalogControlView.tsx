import { Fragment, useEffect, useMemo, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Link } from "react-router-dom"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { BulkSelectionBar } from "@/components/list/BulkSelectionBar"
import { HeaderFilterButton } from "@/components/list/HeaderFilterButton"
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
import type { SortDir } from "@/components/list/listFilterUtils"
import {
  useOpenClassRecord,
  useOpenStudentRecord,
  useOpenTeacherRecord,
  useRecordPreview,
} from "@/components/recordPreview/recordPreviewContext"
import { TrialInviteCatalogSchedulePanel } from "@/components/trialInvite/TrialInviteCatalogSchedulePanel"
import {
  CATALOG_LIST_COLUMN_LABEL,
  CATALOG_LIST_DATA_COLUMNS,
  COUNT_BUCKET_OPTIONS,
  EMPTY_CATALOG_HEADER_FILTERS,
  GRADE_HEADER_FILTER_OPTIONS,
  LISTED_FILTER_OPTIONS,
  catalogClassKindLabel,
  catalogClassTimeLabel,
  catalogMatchesHeaderFilters,
  catalogMatchesSearch,
  catalogSortLabel,
  compareCatalogRows,
  countActiveCatalogHeaderFilters,
  isCatalogListColumnId,
  isCatalogPresetColumn,
  nearestScheduleSplit,
  publicAutoHideReason,
  rowsMatchingCatalogHeaderFiltersExcept,
  uniqueCatalogHeaderFilterOptions,
  type CatalogClassKindFilter,
  type CatalogListColumnId,
  type CatalogListHeaderFilters,
  type CatalogRow,
} from "@/components/trialInvite/trialInviteCatalogColumns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { TRIAL_INVITE_NEAR_LIMIT } from "@/lib/trialInvitePublicFlow"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
  fetchTrialInviteCatalogControls,
  setTrialInviteClassListed,
  setTrialInviteClassesListed,
  setTrialInviteScheduleExcluded,
  setTrialInviteSchedulesExcluded,
  type TrialInviteCatalogClassControl,
  type TrialInviteCatalogTeacherControl,
} from "@/services/trialInviteQueries"

const COL_SPAN = 1 + CATALOG_LIST_DATA_COLUMNS.length

const COLUMN_WIDTH: Record<CatalogListColumnId, string> = {
  teacher: "w-[10%]",
  grade: "w-[5.5rem]",
  subject: "w-[6.5rem]",
  class: "w-[16%]",
  count: "w-[5.5rem]",
  students: "w-[18%]",
  time: "w-[14%]",
  listed: "w-[6.5rem]",
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
  const [q, setQ] = usePersistentState("mgmt_trialInviteCatalog_q", "")
  const [classKind, setClassKind] = usePersistentState<CatalogClassKindFilter>(
    "mgmt_trialInviteCatalog_classKind",
    "all"
  )
  const [sortKeyStored, setSortKey] = usePersistentState<CatalogListColumnId>(
    "mgmt_trialInviteCatalog_sortKey",
    "teacher"
  )
  const sortKey = isCatalogListColumnId(sortKeyStored) ? sortKeyStored : "teacher"
  const [sortDir, setSortDir] = usePersistentState<SortDir>("mgmt_trialInviteCatalog_sortDir", "asc")
  const [headerFiltersStored, setHeaderFilters] = usePersistentState<CatalogListHeaderFilters>(
    "mgmt_trialInviteCatalog_headerFilters",
    EMPTY_CATALOG_HEADER_FILTERS
  )
  const headerFilters = useMemo(() => {
    const out = { ...EMPTY_CATALOG_HEADER_FILTERS }
    for (const id of CATALOG_LIST_DATA_COLUMNS) {
      const stored = headerFiltersStored[id]
      out[id] = typeof stored === "string" ? stored : ""
    }
    return out
  }, [headerFiltersStored])
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(() => new Set())
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

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

  const searched = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return allRows.filter((row) => {
      if (classKind !== "all" && row.cls.classKind !== classKind) return false
      return catalogMatchesSearch(row, needle)
    })
  }, [allRows, classKind, q])

  const filtered = useMemo(
    () => searched.filter((row) => catalogMatchesHeaderFilters(row, headerFilters)),
    [headerFilters, searched]
  )

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareCatalogRows(a, b, sortKey, sortDir)),
    [filtered, sortDir, sortKey]
  )

  const summary = useMemo(() => {
    let classOff = 0
    let scheduleExcl = 0
    let publicHidden = 0
    for (const row of sorted) {
      if (!row.cls.listed) classOff += 1
      scheduleExcl += row.cls.schedules.filter((s) => s.excluded).length
      if (publicAutoHideReason(row.cls)) publicHidden += 1
    }
    return { classCount: sorted.length, classOff, scheduleExcl, publicHidden }
  }, [sorted])

  const expandedScheduleIds = useMemo(() => {
    const ids: string[] = []
    for (const row of sorted) {
      if (!expanded.has(row.cls.id)) continue
      for (const s of row.cls.schedules) ids.push(s.id)
    }
    return ids
  }, [expanded, sorted])

  const scheduleSelectMode = selectedSchedules.size > 0
  const allFilteredSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.cls.id))
  const someFilteredSelected = sorted.some((r) => selected.has(r.cls.id))
  const allExpandedSchedulesSelected =
    expandedScheduleIds.length > 0 &&
    expandedScheduleIds.every((id) => selectedSchedules.has(id))
  const someExpandedSchedulesSelected = expandedScheduleIds.some((id) =>
    selectedSchedules.has(id)
  )

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

  const toggleScheduleSelected = (id: string) => {
    setSelectedSchedules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllExpandedSchedules = () => {
    if (allExpandedSchedulesSelected) {
      setSelectedSchedules(new Set())
      return
    }
    setSelectedSchedules(new Set(expandedScheduleIds))
  }

  const toggleExpanded = (classId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(classId)) next.delete(classId)
      else next.add(classId)
      return next
    })
  }

  const applyListed = (classIds: Set<string> | string[], listed: boolean) => {
    const ids = classIds instanceof Set ? classIds : new Set(classIds)
    setTeachers((cur) =>
      cur.map((t) => ({
        ...t,
        classes: t.classes.map((c) => (ids.has(c.id) ? { ...c, listed } : c)),
      }))
    )
  }

  const applyScheduleExcluded = (scheduleIds: Iterable<string>, excluded: boolean) => {
    const ids = scheduleIds instanceof Set ? scheduleIds : new Set(scheduleIds)
    setTeachers((cur) =>
      cur.map((t) => ({
        ...t,
        classes: t.classes.map((c) => ({
          ...c,
          schedules: c.schedules.map((s) => (ids.has(s.id) ? { ...s, excluded } : s)),
        })),
      }))
    )
  }

  const applyNearestOpen = (cls: TrialInviteCatalogClassControl) => {
    const { keep, drop } = nearestScheduleSplit(cls.schedules, TRIAL_INVITE_NEAR_LIMIT)
    const keepIds = new Set(keep.map((s) => s.id))
    const dropIds = new Set(drop.map((s) => s.id))
    setTeachers((cur) =>
      cur.map((t) => ({
        ...t,
        classes: t.classes.map((c) =>
          c.id !== cls.id
            ? c
            : {
                ...c,
                schedules: c.schedules.map((s) => ({
                  ...s,
                  excluded: dropIds.has(s.id) ? true : keepIds.has(s.id) ? false : s.excluded,
                })),
              }
        ),
      }))
    )
  }

  const onToggleSort = (key: CatalogListColumnId) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  const onHeaderFilterChange = (key: CatalogListColumnId, value: string) => {
    setHeaderFilters((prev) => ({ ...prev, [key]: value }))
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
          ? "此班會出現在公開試堂名單（仍受未剔除的未來堂次與公開頁自動隱藏約束）。"
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

  const onScheduleOpen = async (scheduleId: string, openInCatalog: boolean) => {
    const key = `schedule:${scheduleId}`
    setSavingKey(key)
    setErr(null)
    const prev = teachers
    applyScheduleExcluded([scheduleId], !openInCatalog)
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

  const onBulkSchedulesExcluded = async (ids: string[], excluded: boolean) => {
    if (ids.length === 0) return
    setBusy(true)
    setErr(null)
    const prev = teachers
    applyScheduleExcluded(ids, excluded)
    try {
      await setTrialInviteSchedulesExcluded(ids, excluded)
      pushBanner({
        title: excluded ? "已剔除堂次" : "已開放堂次",
        tone: "success",
        message: excluded
          ? `共 ${ids.length} 堂不再出現於公開試堂名單。`
          : `共 ${ids.length} 堂可供家長選取。`,
      })
      setSelectedSchedules(new Set())
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onBulkSchedulesExcluded",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const onClassSchedulesOpen = async (cls: TrialInviteCatalogClassControl, open: boolean) => {
    const ids = cls.schedules.map((s) => s.id)
    if (ids.length === 0) return
    const key = `class-schedules:${cls.id}`
    setSavingKey(key)
    setErr(null)
    const prev = teachers
    applyScheduleExcluded(ids, !open)
    try {
      await setTrialInviteSchedulesExcluded(ids, !open)
      pushBanner({
        title: open ? "已全部開放" : "已全部剔除",
        tone: "success",
        message: open
          ? `${cls.label} 的未來堂次均可供家長選取。`
          : `${cls.label} 的未來堂次已全部剔除。`,
      })
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onClassSchedulesOpen",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingKey(null)
    }
  }

  const onKeepNearest = async (cls: TrialInviteCatalogClassControl) => {
    const { keep, drop } = nearestScheduleSplit(cls.schedules, TRIAL_INVITE_NEAR_LIMIT)
    if (cls.schedules.length === 0) return
    const key = `class-schedules:${cls.id}`
    setSavingKey(key)
    setErr(null)
    const prev = teachers
    applyNearestOpen(cls)
    try {
      await Promise.all([
        keep.length > 0 ? setTrialInviteSchedulesExcluded(keep.map((s) => s.id), false) : Promise.resolve(),
        drop.length > 0 ? setTrialInviteSchedulesExcluded(drop.map((s) => s.id), true) : Promise.resolve(),
      ])
      pushBanner({
        title: "已只開放最近堂次",
        tone: "success",
        message: `已開放最近 ${keep.length} 堂，其餘 ${drop.length} 堂已剔除。`,
      })
    } catch (e) {
      setTeachers(prev)
      reportUserFacingError(e, {
        source: "TrialInviteCatalogControlView.onKeepNearest",
        setErr,
        userMessage: formatUnknownError(e),
      })
    } finally {
      setSavingKey(null)
    }
  }

  const emptyHint = (() => {
    if (q.trim() || classKind !== "all" || countActiveCatalogHeaderFilters(headerFilters) > 0) {
      return "沒有符合篩選的專科班或功課輔導班。"
    }
    return "目前學年沒有專科班或功課輔導班。"
  })()

  const kindChip = (id: CatalogClassKindFilter, label: string) => (
    <button
      key={id}
      type="button"
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        classKind === id
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
      )}
      onClick={() => setClassKind(id)}
    >
      {label}
    </button>
  )

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
                ? `只列出目前學年（${academicYearLabel}）的專科班與功課輔導班。預設全部可出現。可剔選單班或批量納入／剔走試堂資格；展開列可勾選未來堂次。變更即時影響未提交的公開邀請連結。`
                : "只列出目前學年的專科班與功課輔導班。預設全部可出現。可剔選單班或批量納入／剔走試堂資格；展開列可勾選未來堂次。變更即時影響未提交的公開邀請連結。"
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
            <Tag tone="warning">公開頁自動隱藏 {summary.publicHidden}</Tag>
          </div>

          <div className="flex flex-wrap gap-2">
            {kindChip("all", "全部班型")}
            {kindChip("group", "專科班")}
            {kindChip("homework", "功課輔導班")}
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
        {countActiveCatalogHeaderFilters(headerFilters) > 0 ||
        sortKey !== "teacher" ||
        sortDir !== "asc" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="default" size="sm">
              目前排序：{catalogSortLabel(sortKey, sortDir)}
            </Tag>
            {countActiveCatalogHeaderFilters(headerFilters) > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHeaderFilters(EMPTY_CATALOG_HEADER_FILTERS)}
              >
                清除表頭篩選
              </Button>
            ) : null}
          </div>
        ) : null}
        {scheduleSelectMode ? (
          <BulkSelectionBar
            selectedCount={selectedSchedules.size}
            unitLabel="堂"
            allFilteredSelected={allExpandedSchedulesSelected}
            onToggleSelectAll={toggleSelectAllExpandedSchedules}
            onClear={() => setSelectedSchedules(new Set())}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || selectedSchedules.size === 0}
              onClick={() => void onBulkSchedulesExcluded([...selectedSchedules], false)}
            >
              開放此堂
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || selectedSchedules.size === 0}
              onClick={() => void onBulkSchedulesExcluded([...selectedSchedules], true)}
            >
              剔除堂次
            </Button>
          </BulkSelectionBar>
        ) : (
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
        )}
      </StickyListLead>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <div className={stickyTableWrapClass}>
          <table className="w-full min-w-[80rem] table-fixed border-separate border-spacing-0 text-sm isolate">
            <thead className={stickyTableHeadClass}>
              <tr className={cn(stickyTableHeadRowClass, "text-xs font-medium text-muted-foreground")}>
                <th className={cn(stickyTableHeadCellClass, "w-10 px-3 py-2")}>
                  <Checkbox
                    checked={
                      scheduleSelectMode ? allExpandedSchedulesSelected : allFilteredSelected
                    }
                    indeterminate={
                      scheduleSelectMode
                        ? someExpandedSchedulesSelected && !allExpandedSchedulesSelected
                        : someFilteredSelected && !allFilteredSelected
                    }
                    onCheckedChange={() =>
                      scheduleSelectMode
                        ? toggleSelectAllExpandedSchedules()
                        : toggleSelectAllFiltered()
                    }
                    aria-label={scheduleSelectMode ? "全選目前展開堂次" : "全選目前列表"}
                  />
                </th>
                {CATALOG_LIST_DATA_COLUMNS.map((id) => (
                  <th
                    key={id}
                    className={cn(
                      stickyTableHeadCellClass,
                      COLUMN_WIDTH[id],
                      "px-3 py-2",
                      id === "count" ? "text-center" : ""
                    )}
                  >
                    <SortableColumnHeader
                      label={CATALOG_LIST_COLUMN_LABEL[id]}
                      active={sortKey === id}
                      dir={sortDir}
                      onToggle={() => onToggleSort(id)}
                      className={id === "count" ? "justify-center" : undefined}
                      labelClassName={id === "count" ? "whitespace-nowrap" : undefined}
                    >
                      <CatalogHeaderFilter
                        column={id}
                        value={headerFilters[id]}
                        onChange={(v) => onHeaderFilterChange(id, v)}
                        sourceRows={searched}
                        headerFilters={headerFilters}
                      />
                    </SortableColumnHeader>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}>
              {sorted.map((row) => {
                const { teacher, cls } = row
                const classBusy = savingKey === `class:${cls.id}`
                const time = catalogClassTimeLabel(cls)
                const excludedCount = cls.schedules.filter((s) => s.excluded).length
                const open = expanded.has(cls.id)
                const hideReason = publicAutoHideReason(cls)
                return (
                  <Fragment key={cls.id}>
                    <tr
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
                      <td className="align-top px-3 py-2 text-xs leading-relaxed">
                        {cls.grades.join("、") || "—"}
                      </td>
                      <td className="align-top px-3 py-2">{cls.subject || "未分類"}</td>
                      <td className="align-top px-3 py-2">
                        <button
                          type="button"
                          className="block min-w-0 text-left"
                          onClick={() => openClass(cls.id)}
                        >
                          <p className="font-medium text-foreground hover:underline">{cls.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {catalogClassKindLabel(cls.classKind)}
                          </p>
                        </button>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {!cls.listed ? (
                            <Tag tone={statusToTagTone("取消")} size="sm">
                              已剔走
                            </Tag>
                          ) : null}
                          {hideReason === "full" ? (
                            <Tag tone="warning" size="sm">
                              滿班隱藏
                            </Tag>
                          ) : null}
                          {hideReason === "no_open_schedule" ? (
                            <Tag tone={statusToTagTone("待")} size="sm">
                              {cls.schedules.length === 0 ? "無未來堂" : "無可選堂"}
                            </Tag>
                          ) : null}
                        </div>
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
                          className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          onClick={() => toggleExpanded(cls.id)}
                          aria-expanded={open}
                        >
                          <ChevronDown
                            className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                            aria-hidden
                          />
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
                    {open ? (
                      <tr className="bg-muted/20">
                        <td colSpan={COL_SPAN} className="px-0 py-0">
                          <TrialInviteCatalogSchedulePanel
                            cls={cls}
                            selectedIds={selectedSchedules}
                            savingKey={savingKey}
                            busy={busy}
                            onToggleSelect={toggleScheduleSelected}
                            onToggleSelectAll={() => {
                              const ids = cls.schedules.map((s) => s.id)
                              const allOn = ids.length > 0 && ids.every((id) => selectedSchedules.has(id))
                              setSelectedSchedules((prev) => {
                                const next = new Set(prev)
                                if (allOn) {
                                  for (const id of ids) next.delete(id)
                                } else {
                                  for (const id of ids) next.add(id)
                                }
                                return next
                              })
                            }}
                            onToggleOpen={(scheduleId, next) =>
                              void onScheduleOpen(scheduleId, next)
                            }
                            onBulkOpen={(next) => void onClassSchedulesOpen(cls, next)}
                            onKeepNearest={() => void onKeepNearest(cls)}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </StickyListShell>
  )
}

function CatalogHeaderFilter({
  column,
  value,
  onChange,
  sourceRows,
  headerFilters,
}: {
  column: CatalogListColumnId
  value: string
  onChange: (next: string) => void
  sourceRows: CatalogRow[]
  headerFilters: CatalogListHeaderFilters
}) {
  const options = useMemo(() => {
    if (column === "grade") return GRADE_HEADER_FILTER_OPTIONS
    if (column === "count") return COUNT_BUCKET_OPTIONS
    if (column === "listed") return LISTED_FILTER_OPTIONS
    const subset = rowsMatchingCatalogHeaderFiltersExcept(sourceRows, headerFilters, column)
    return uniqueCatalogHeaderFilterOptions(column, subset)
  }, [column, headerFilters, sourceRows])

  return (
    <HeaderFilterButton
      columnLabel={CATALOG_LIST_COLUMN_LABEL[column]}
      value={value}
      onChange={onChange}
      mode={isCatalogPresetColumn(column) ? "preset" : "text"}
      options={options}
    />
  )
}
