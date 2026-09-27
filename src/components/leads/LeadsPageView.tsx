import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, SlidersHorizontal } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
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
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { LeadPreviewPanel } from "@/components/leads/LeadPreviewPanel"
import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import {
  LEAD_SORT_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  filterLeads,
  leadHasTrialSchedule,
  pickOpenIntention,
  sortLeads,
  type LeadBrowseMode,
  type LeadListSource,
  type LeadListStatus,
  type LeadSortKey,
} from "@/lib/leadQueue"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade, STUDENT_GRADE_CODES, type StudentGradeCode } from "@/lib/studentGrade"
import { cn } from "@/lib/utils"
import {
  fetchLeads,
  insertManualLead,
  staleAdIntentions,
  type LeadIntention,
  type LeadRow,
  type LeadSource,
  type LeadStatus,
} from "@/services/leadQueries"

const GRADE_OPTIONS = STUDENT_GRADE_CODES.filter(
  (code): code is Exclude<StudentGradeCode, "GD" | "NA"> => code !== "GD" && code !== "NA"
)

const SORT_KEYS: LeadSortKey[] = ["createdAt", "fullName", "grade", "school"]

export function LeadsPageView() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { enabled: previewEnabled, preview, openPreview, replacePreview } = useRecordPreview()
  const [status, setStatus] = useState<LeadListStatus>("new")
  const [source, setSource] = useState<LeadListSource>("all")
  const [browse, setBrowse] = useState<LeadBrowseMode>("all")
  const [grade, setGrade] = useState("")
  const [sortKey, setSortKey] = useState<LeadSortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [rows, setRows] = useState<LeadRow[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mobileLeadId, setMobileLeadId] = useState<string | null>(null)
  const [banner, setBanner] = useState<{
    studentId: string
    name: string
    intentions: LeadIntention[]
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setRows(await fetchLeads("all"))
    } catch (e) {
      reportUserFacingError(e, { source: "LeadsPageView.load", setErr })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const counts = useMemo(() => {
    const next: Record<LeadStatus, number> = { new: 0, contacted: 0, converted: 0, closed: 0 }
    for (const row of rows) next[row.status] += 1
    return next
  }, [rows])

  const gradeOptions = useMemo(() => {
    const pool = filterLeads(rows, { status, source, query, grade: "", browse })
    const seen = new Set(pool.map((row) => row.grade).filter(Boolean))
    return GRADE_OPTIONS.filter((code) => seen.has(code)).map((code) => ({
      value: code,
      label: formatStudentGrade(code),
    }))
  }, [rows, status, source, query, browse])

  const scoped = useMemo(
    () => filterLeads(rows, { status, source, query, grade, browse: "all" }),
    [rows, status, source, query, grade]
  )
  const visible = useMemo(
    () => sortLeads(filterLeads(rows, { status, source, query, grade, browse }), sortKey, sortDir),
    [rows, status, source, query, grade, browse, sortKey, sortDir]
  )
  const inquiryCount = scoped.filter((row) => !leadHasTrialSchedule(row)).length
  const trialCount = scoped.length - inquiryCount

  const activeFilterCount = (status !== "new" ? 1 : 0) + (source !== "all" ? 1 : 0) + (grade ? 1 : 0)

  const resetFilters = () => {
    setStatus("new")
    setSource("all")
    setGrade("")
  }

  const toggleSort = (key: LeadSortKey) => {
    if (key === sortKey) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "createdAt" ? "desc" : "asc")
    }
  }

  const scheduleTrial = useCallback(
    async (studentId: string, intentions: LeadIntention[]) => {
      const params = new URLSearchParams({ studentId })
      const stale = await staleAdIntentions(intentions)
      const pick = pickOpenIntention(intentions, stale)
      if (pick && pick !== "expired") {
        params.set("classId", pick.classId)
        params.set("scheduleId", pick.scheduleId)
      } else if (pick === "expired") {
        params.set("intentExpired", "1")
      }
      navigate(`/TrialSessions?${params.toString()}`)
    },
    [navigate]
  )

  const openLead = (row: LeadRow) => {
    if (!previewEnabled) {
      setMobileLeadId(row.id)
      return
    }
    openPreview({
      kind: "lead",
      id: row.id,
      row,
      onChanged: () => void load(),
      onConverted: (studentId) => setBanner({ studentId, name: row.fullName, intentions: row.intentions }),
      onScheduleTrial: scheduleTrial,
    })
  }

  useEffect(() => {
    if (!previewEnabled || preview?.kind !== "lead") return
    const fresh = rows.find((row) => row.id === preview.id)
    if (!fresh) return
    if (
      fresh.status === preview.row.status &&
      fresh.note === preview.row.note &&
      fresh.convertedStudentId === preview.row.convertedStudentId &&
      fresh.intentions.length === preview.row.intentions.length
    ) {
      return
    }
    replacePreview({ ...preview, row: fresh })
  }, [rows, previewEnabled, preview, replacePreview])

  const mobileLead = rows.find((row) => row.id === mobileLeadId) ?? null
  const previewLeadId = preview?.kind === "lead" ? preview.id : null

  const filterFields = (
    <>
      <Select
        aria-label="狀態"
        className="h-10 min-w-[9rem]"
        value={status}
        onChange={(e) => setStatus(e.target.value as LeadListStatus)}
      >
        <option value="all">全部狀態（{rows.length}）</option>
        {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((id) => (
          <option key={id} value={id}>
            {LEAD_STATUS_LABEL[id]}（{counts[id]}）
          </option>
        ))}
      </Select>
      <Select
        aria-label="來源"
        className="h-10 min-w-[8rem]"
        value={source}
        onChange={(e) => setSource(e.target.value as LeadListSource)}
      >
        <option value="all">全部來源</option>
        {(Object.keys(LEAD_SOURCE_LABEL) as LeadSource[]).map((id) => (
          <option key={id} value={id}>
            {LEAD_SOURCE_LABEL[id]}
          </option>
        ))}
      </Select>
    </>
  )

  return (
    <StickyListShell
      sticky={!isMobile}
      header={
        <>
          <AdminPageHeader
            eyebrow="行政工作"
            title="潛在客戶"
            description="尚未建學生主檔的查詢與廣告登記。建檔只建立非註冊學生，不在此頁排試堂或收款。"
            titleExtra={
              <Tag tone="info" size="sm">
                {loading ? "…" : `顯示 ${visible.length}`}
              </Tag>
            }
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5" role="group" aria-label="瀏覽模式">
                  {(
                    [
                      ["all", `全部 ${scoped.length}`],
                      ["inquiry", `只看查詢 ${inquiryCount}`],
                      ["trial", `只看試堂 ${trialCount}`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={browse === id}
                      onClick={() => setBrowse(id)}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                        browse === id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Button type="button" onClick={() => setAddOpen(true)}>
                  人手新增
                </Button>
              </div>
            }
          />
          {banner ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm">
              <p className="min-w-0 flex-1">已為 {banner.name} 建立非註冊學生。下一步請排試堂。</p>
              <Button type="button" size="sm" onClick={() => void scheduleTrial(banner.studentId, banner.intentions)}>
                排試堂
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to={`/Students/${banner.studentId}`}>前往學生詳情</Link>
              </Button>
            </div>
          ) : null}
        </>
      }
    >
      <StickyListLead>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isMobile ? (
            <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              篩選
              {activeFilterCount > 0 ? (
                <Tag tone="info" size="sm">
                  {activeFilterCount}
                </Tag>
              ) : null}
            </Button>
          ) : (
            filterFields
          )}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              className="pl-9"
              value={query}
              placeholder="搜尋姓名、學校、電話或備註"
              aria-label="搜尋潛在客戶"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              aria-label="排序欄位"
              className="h-10 min-w-[8rem]"
              value={sortKey}
              onChange={(e) => {
                const next = e.target.value as LeadSortKey
                if (!SORT_KEYS.includes(next)) return
                setSortKey(next)
                if (next !== sortKey) setSortDir(next === "createdAt" ? "desc" : "asc")
              }}
            >
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {LEAD_SORT_LABEL[key]}
                </option>
              ))}
            </Select>
            <Select
              aria-label="排序方向"
              className="h-10 w-[5.5rem]"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value === "asc" ? "asc" : "desc")}
            >
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </Select>
          </div>
        </div>
        {isMobile ? (
          <MobileFilterSheet
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="篩選潛在客戶"
            activeCount={activeFilterCount}
            onReset={resetFilters}
          >
            <div className="flex flex-col gap-3">{filterFields}</div>
          </MobileFilterSheet>
        ) : null}
        {err ? (
          <p role="alert" className="text-sm text-destructive">
            {err}
          </p>
        ) : null}
      </StickyListLead>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有潛在客戶。</p>
      ) : (
        <div className={stickyTableWrapClass}>
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead className={stickyTableHeadClass}>
              <tr className={stickyTableHeadRowClass}>
                <th className={cn(stickyTableHeadCellClass, "px-3 py-2 font-medium")}>
                  <SortableColumnHeader
                    label="姓名"
                    active={sortKey === "fullName"}
                    dir={sortDir}
                    onToggle={() => toggleSort("fullName")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-28 px-3 py-2 font-medium")}>
                  <SortableColumnHeader
                    label="年級"
                    active={sortKey === "grade"}
                    dir={sortDir}
                    onToggle={() => toggleSort("grade")}
                  >
                    <HeaderFilterButton
                      columnLabel="年級"
                      mode="preset"
                      value={grade}
                      options={gradeOptions}
                      onChange={setGrade}
                    />
                  </SortableColumnHeader>
                </th>
              </tr>
            </thead>
            <tbody className={stickyTableBodyClass}>
              {visible.map((row, index) => {
                const selected = previewLeadId === row.id || mobileLeadId === row.id
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors hover:bg-info/20",
                      index % 2 === 1 ? "bg-muted/20" : "",
                      selected ? "bg-info/15" : ""
                    )}
                    onClick={() => openLead(row)}
                  >
                    <td className="px-3 py-3 font-medium text-foreground">{row.fullName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatStudentGrade(row.grade)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {mobileLead ? (
        <Dialog open onOpenChange={(open) => { if (!open) setMobileLeadId(null) }}>
          <DialogContent className="max-h-[85vh] overflow-y-auto p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{mobileLead.fullName}</DialogTitle>
            </DialogHeader>
            <LeadPreviewPanel
              row={mobileLead}
              onChanged={() => void load()}
              onConverted={(studentId) =>
                setBanner({ studentId, name: mobileLead.fullName, intentions: mobileLead.intentions })
              }
              onScheduleTrial={scheduleTrial}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <ManualLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setStatus("new")
          void load()
        }}
      />
    </StickyListShell>
  )
}

function ManualLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [school, setSchool] = useState("")
  const [grade, setGrade] = useState("")
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState("")
  const [source, setSource] = useState<"phone" | "front_desk" | "other">("phone")
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    setErr(null)
    try {
      await insertManualLead({ fullName, school, grade, phone, note, source })
      setFullName("")
      setSchool("")
      setGrade("")
      setPhone("")
      setNote("")
      onOpenChange(false)
      onCreated()
    } catch (e) {
      reportUserFacingError(e, { source: "ManualLeadDialog.submit", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>人手新增潛在客戶</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="grid gap-1 text-sm">
            <span>姓名</span>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>學校</span>
            <SchoolSearchableSelect value={school} onChange={setSchool} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>年級</span>
            <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="年級">
              <option value="">請選擇</option>
              {GRADE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {formatStudentGrade(code)}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>聯絡電話</span>
            <Input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>來源</span>
            <Select
              value={source}
              onChange={(e) => setSource(e.target.value as "phone" | "front_desk" | "other")}
              aria-label="來源"
            >
              <option value="phone">電話</option>
              <option value="front_desk">前台</option>
              <option value="other">其他</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>備註（可選）</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? "儲存中…" : "新增"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
