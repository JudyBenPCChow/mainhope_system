import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade, STUDENT_GRADE_CODES, type StudentGradeCode } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
  convertLeadToStudent,
  fetchLeads,
  findPhoneMatches,
  insertManualLead,
  setLeadStatus,
  staleAdIntentions,
  type LeadRow,
  type LeadSource,
  type LeadStatus,
  type PhoneMatch,
} from "@/services/leadQueries"

const STATUS_TABS: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "新進" },
  { id: "contacted", label: "已聯絡" },
  { id: "converted", label: "已建檔" },
  { id: "closed", label: "已結束" },
]

const SOURCE_LABEL: Record<LeadSource, string> = {
  ad_trial: "廣告試堂",
  phone: "電話",
  front_desk: "前台",
  website: "官網",
  other: "其他",
}

const GRADE_OPTIONS = STUDENT_GRADE_CODES.filter(
  (code): code is Exclude<StudentGradeCode, "GD" | "NA"> => code !== "GD" && code !== "NA"
)

export function LeadsPageView() {
  const [status, setStatus] = useState<LeadStatus>("new")
  const [source, setSource] = useState<LeadSource | "all">("all")
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [banner, setBanner] = useState<{ studentId: string; name: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setRows(await fetchLeads(status))
    } catch (e) {
      reportUserFacingError(e, { source: "LeadsPageView.load", setErr })
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => (source === "all" ? rows : rows.filter((r) => r.source === source)),
    [rows, source]
  )

  return (
    <div className="space-y-4">
      <AdminPageHeader
        eyebrow="行政工作"
        title="潛在客戶"
        description="尚未建學生主檔的查詢與廣告登記。建檔只建立非註冊學生，不在此頁排試堂或收款。"
        actions={
          <Button type="button" onClick={() => setAddOpen(true)}>
            人手新增
          </Button>
        }
      />
      {banner ? (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          已為 {banner.name} 建立非註冊學生。
          <Link className="ml-2 text-primary hover:underline" to={`/TrialSessions?studentId=${banner.studentId}`}>
            前往排試堂
          </Link>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              status === tab.id ? "border-primary bg-primary text-primary-foreground" : "border-border"
            )}
            onClick={() => setStatus(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <SourceChip id="all" current={source} label="全部來源" onPick={setSource} />
        {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((id) => (
          <SourceChip
            key={id}
            id={id}
            current={source}
            label={SOURCE_LABEL[id]}
            muted={id === "website"}
            onPick={setSource}
          />
        ))}
      </div>
      {err ? (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">這個分頁沒有潛在客戶。</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <LeadCard
              key={row.id}
              row={row}
              onChanged={() => void load()}
              onConverted={(studentId) => setBanner({ studentId, name: row.fullName })}
            />
          ))}
        </ul>
      )}
      <ManualLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setStatus("new")
          void load()
        }}
      />
    </div>
  )
}

function SourceChip({
  id,
  current,
  label,
  muted,
  onPick,
}: {
  id: LeadSource | "all"
  current: LeadSource | "all"
  label: string
  muted?: boolean
  onPick: (id: LeadSource | "all") => void
}) {
  const on = current === id
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-3 py-1 text-xs",
        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
        muted && !on && "opacity-60"
      )}
      onClick={() => onPick(id)}
    >
      {label}
    </button>
  )
}

function LeadCard({
  row,
  onChanged,
  onConverted,
}: {
  row: LeadRow
  onChanged: () => void
  onConverted: (studentId: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [matches, setMatches] = useState<PhoneMatch[] | null>(null)
  const [stale, setStale] = useState<string[] | null>(null)
  const wa = `https://wa.me/852${row.phone.replace(/\D/g, "")}`
  const hint = row.intentions
    .map((line) => [line.classLabel, line.scheduledDate].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("、")

  const convert = async () => {
    setBusy(true)
    setErr(null)
    try {
      const found = await findPhoneMatches(row.phone, row.id)
      const expired = await staleAdIntentions(row.intentions)
      setMatches(found)
      setStale(expired)
      if (found.length > 0 || expired.length > 0) return
      const studentId = await convertLeadToStudent(row)
      onConverted(studentId)
      onChanged()
    } catch (e) {
      reportUserFacingError(e, { source: "LeadCard.convert", setErr })
    } finally {
      setBusy(false)
    }
  }

  const convertAnyway = async () => {
    setBusy(true)
    setErr(null)
    try {
      const studentId = await convertLeadToStudent(row)
      setMatches(null)
      setStale(null)
      onConverted(studentId)
      onChanged()
    } catch (e) {
      reportUserFacingError(e, { source: "LeadCard.convertAnyway", setErr })
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">
            {row.fullName}
            <span className="ml-2 font-normal text-muted-foreground">{formatStudentGrade(row.grade)}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            {row.school || "—"} ·{" "}
            {row.contactMethod === "WeChat" ? (
              <span>WeChat {row.wechatId}</span>
            ) : (
              <a className="text-primary hover:underline" href={wa} target="_blank" rel="noreferrer">
                WhatsApp {row.phone}
              </a>
            )}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">想試：{hint}</p> : null}
          {row.interestedSubjects.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">有興趣：{row.interestedSubjects.join("、")}</p>
          ) : null}
        </div>
        <Tag tone={statusToTagTone("待")} size="sm">
          {SOURCE_LABEL[row.source]}
        </Tag>
      </div>
      {err ? <p className="mt-2 text-destructive">{err}</p> : null}
      {matches && matches.length > 0 ? (
        <p className="mt-2 text-warning">
          同電話已有：{matches.map((m) => m.label).join("、")}
        </p>
      ) : null}
      {stale && stale.length > 0 ? (
        <p className="mt-2 text-warning">意向堂次需改選：{stale.join("；")}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {row.status === "new" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void setLeadStatus(row.id, "contacted")
                .then(onChanged)
                .catch((e) => reportUserFacingError(e, { source: "LeadCard.contacted", setErr }))
                .finally(() => setBusy(false))
            }}
          >
            標已聯絡
          </Button>
        ) : null}
        {row.status !== "converted" && row.status !== "closed" ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void convert()}>
            建檔（非註冊）
          </Button>
        ) : null}
        {row.convertedStudentId ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`/Students/${row.convertedStudentId}`}>學生詳情</Link>
          </Button>
        ) : null}
        {(matches && matches.length > 0) || (stale && stale.length > 0) ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void convertAnyway()}>
            仍要建檔
          </Button>
        ) : null}
      </div>
    </li>
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
          <Input placeholder="姓名" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="學校" value={school} onChange={(e) => setSchool(e.target.value)} />
          <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="年級">
            <option value="">年級</option>
            {GRADE_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {formatStudentGrade(code)}
              </option>
            ))}
          </Select>
          <Input placeholder="聯絡電話" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as "phone" | "front_desk" | "other")}
            aria-label="來源"
          >
            <option value="phone">電話</option>
            <option value="front_desk">前台</option>
            <option value="other">其他</option>
          </Select>
          <Input placeholder="備註（可選）" value={note} onChange={(e) => setNote(e.target.value)} />
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? "儲存中…" : "新增"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
