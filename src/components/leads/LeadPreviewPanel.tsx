import { useState } from "react"
import { Link } from "react-router-dom"
import { GraduationCap, MessageCircle, School } from "lucide-react"

import { PreviewPropertyRow, PreviewSection } from "@/components/recordPreview/previewUi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import {
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  formatLeadAge,
  leadHasTrialSchedule,
  leadIsStaleNew,
} from "@/lib/leadQueue"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
  closeLead,
  convertLeadToStudent,
  deleteLead,
  findPhoneMatches,
  markLeadContacted,
  staleAdIntentions,
  type LeadIntention,
  type LeadRow,
  type PhoneMatch,
} from "@/services/leadQueries"

type Props = {
  row: LeadRow
  onChanged: () => void
  onConverted: (studentId: string) => void
  onScheduleTrial: (studentId: string, intentions: LeadIntention[]) => void
}

export function LeadPreviewPanel({ row, onChanged, onConverted, onScheduleTrial }: Props) {
  const { confirmDialog } = useAppConfirm()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [matches, setMatches] = useState<PhoneMatch[] | null>(null)
  const [stale, setStale] = useState<string[] | null>(null)
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeReason, setCloseReason] = useState("")
  const [contactOpen, setContactOpen] = useState(false)
  const [contactResult, setContactResult] = useState("已接通")
  const [contactNote, setContactNote] = useState("")
  const wa = `https://wa.me/852${row.phone.replace(/\D/g, "")}`
  const age = formatLeadAge(row.createdAt)
  const staleNew = leadIsStaleNew(row)
  const trial = leadHasTrialSchedule(row)

  const remove = async () => {
    const ok = await confirmDialog({
      title: "刪除潛在客戶",
      description: `確定刪除「${row.fullName}」？試堂意向一併刪除，此操作無法復原。已建檔的學生主檔不受影響。`,
      confirmText: "確認刪除",
      tone: "destructive",
    })
    if (!ok) return
    setBusy(true)
    setErr(null)
    try {
      await deleteLead(row.id)
      onChanged()
    } catch (e) {
      reportUserFacingError(e, { source: "LeadPreviewPanel.remove", setErr })
    } finally {
      setBusy(false)
    }
  }

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
      reportUserFacingError(e, { source: "LeadPreviewPanel.convert", setErr })
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
      reportUserFacingError(e, { source: "LeadPreviewPanel.convertAnyway", setErr })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 px-3 py-4 pr-12">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{trial ? "試堂" : "查詢"}</p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">{row.fullName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{formatStudentGrade(row.grade)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Tag tone={statusToTagTone(LEAD_STATUS_LABEL[row.status])} size="sm">
            {LEAD_STATUS_LABEL[row.status]}
          </Tag>
          <Tag tone="info" size="sm">
            {LEAD_SOURCE_LABEL[row.source]}
          </Tag>
        </div>
      </div>

      <PreviewSection title="聯絡" icon={MessageCircle}>
        <PreviewPropertyRow icon={School} label="學校">
          {row.school || "—"}
        </PreviewPropertyRow>
        <PreviewPropertyRow icon={MessageCircle} label="聯絡">
          {row.contactMethod === "WeChat" ? (
            `WeChat ${row.wechatId}`
          ) : (
            <a className="text-primary hover:underline" href={wa} target="_blank" rel="noreferrer">
              WhatsApp {row.phone}
            </a>
          )}
        </PreviewPropertyRow>
        <PreviewPropertyRow icon={GraduationCap} label="提交">
          <span className={cn(staleNew && "text-warning")}>
            {age || "—"}
            {staleNew ? " · 超過一日未處理" : ""}
          </span>
        </PreviewPropertyRow>
      </PreviewSection>

      <PreviewSection title={trial ? "想試堂次" : "有興趣"}>
        {row.interestedSubjects.length > 0 ? (
          <p className="text-sm">有興趣：{row.interestedSubjects.join("、")}</p>
        ) : null}
        {row.intentions.length > 0 ? (
          <ul className="mt-1 space-y-1 text-sm">
            {row.intentions.map((line) => (
              <li key={line.id || `${line.classLabel}-${line.scheduledDate}`}>
                {[line.classLabel, line.scheduledDate, line.startTime && line.endTime ? `${line.startTime}–${line.endTime}` : line.startTime]
                  .filter(Boolean)
                  .join(" ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">未選試堂日子</p>
        )}
        {row.note ? <p className="mt-2 text-sm text-muted-foreground">備註：{row.note}</p> : null}
      </PreviewSection>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      {matches && matches.length > 0 ? (
        <p className="text-sm text-warning">同電話已有：{matches.map((m) => m.label).join("、")}</p>
      ) : null}
      {stale && stale.length > 0 ? (
        <p className="text-sm text-warning">意向堂次需改選：{stale.join("；")}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {row.status === "new" ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setContactOpen(true)}>
            標已聯絡
          </Button>
        ) : null}
        {row.status !== "converted" && row.status !== "closed" ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void convert()}>
            建檔（非註冊）
          </Button>
        ) : null}
        {row.convertedStudentId ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => void onScheduleTrial(row.convertedStudentId ?? "", row.intentions)}
            >
              排試堂
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={`/Students/${row.convertedStudentId}`}>學生詳情</Link>
            </Button>
          </>
        ) : null}
        {row.status !== "converted" && row.status !== "closed" ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setCloseOpen(true)}>
            標已結束
          </Button>
        ) : null}
        {(matches && matches.length > 0) || (stale && stale.length > 0) ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void convertAnyway()}>
            仍要建檔
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void remove()}>
          刪除
        </Button>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>記錄聯絡結果</DialogTitle>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            <span>結果</span>
            <Select aria-label="聯絡結果" value={contactResult} onChange={(e) => setContactResult(e.target.value)}>
              <option value="已接通">已接通</option>
              <option value="未接聽">未接聽</option>
              <option value="稍後再聯絡">稍後再聯絡</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>補充（可選）</span>
            <Input value={contactNote} onChange={(e) => setContactNote(e.target.value)} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setContactOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                const result = contactNote.trim() ? `${contactResult}；${contactNote.trim()}` : contactResult
                setBusy(true)
                void markLeadContacted(row.id, result, row.note)
                  .then(() => {
                    setContactOpen(false)
                    setContactNote("")
                    onChanged()
                  })
                  .catch((e) => reportUserFacingError(e, { source: "LeadPreviewPanel.contacted", setErr }))
                  .finally(() => setBusy(false))
              }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>結束潛在客戶</DialogTitle>
          </DialogHeader>
          <label className="grid gap-1 text-sm">
            <span>結束原因</span>
            <Input
              value={closeReason}
              placeholder="例如：無意願、電話錯誤"
              onChange={(e) => setCloseReason(e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCloseOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void closeLead(row.id, closeReason, row.note)
                  .then(() => {
                    setCloseOpen(false)
                    setCloseReason("")
                    onChanged()
                  })
                  .catch((e) => reportUserFacingError(e, { source: "LeadPreviewPanel.close", setErr }))
                  .finally(() => setBusy(false))
              }}
            >
              確認結束
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
