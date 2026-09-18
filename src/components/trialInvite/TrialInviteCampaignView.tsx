import { useCallback, useEffect, useMemo, useState } from "react"
import { Ban, Copy, Link2, MessageCircle, Search } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { RecordPageTabs } from "@/components/detail/RecordPageTabs"
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
  useOpenStudentRecord,
  useRecordPreview,
} from "@/components/recordPreview/recordPreviewContext"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useIsMobile } from "@/hooks/use-mobile"
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
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { buildTrialInviteNotifyMessage } from "@/lib/trialInviteNotifyMessage"
import {
  trialInviteTokenHasPublicUrl,
  trialInviteTokenVoidable,
} from "@/lib/trialInviteToken"
import {
  isTrialInviteType,
  trialInviteTypeOrDefault,
  TRIAL_INVITE_TYPES,
  type TrialInviteType,
} from "@/lib/trialInviteTypes"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { formatStudentGrade } from "@/lib/studentGrade"
import { statusToTagTone } from "@/lib/statusTag"
import { formatRecentTrialSubjectsCaption } from "@/lib/trialInviteRecentSubjects"
import { cn } from "@/lib/utils"
import {
  openPrimaryMessagingTarget,
  resolvePrimaryMessagingTarget,
  type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"
import {
  createTrialInviteTokens,
  fetchRecentInviteTrialSubjects,
  fetchTrialInviteRequests,
  fetchTrialInviteTokensByStudentIds,
  fetchUnpaidInviteTrialIds,
  reviewTrialInviteRequest,
  trialInvitePublicUrl,
  voidTrialInviteToken,
  type TrialInviteRequestListRow,
  type TrialInviteTokenRow,
} from "@/services/trialInviteQueries"
import {
  issueZeroReceiptForTrialSessions,
  trialTypeCategory,
} from "@/services/trialQueries"
import { fetchAllStudents, normalizeEnrollmentStatus, type StudentRecord } from "@/services/studentQueries"

type UiStatus = "未產生" | "未交" | "待審核" | "已核准" | "過期" | "已作廢"

type EnrollmentFilter = "all" | "在讀" | "非在讀"

const ENROLLMENT_FILTERS: { key: EnrollmentFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "在讀", label: "在讀" },
  { key: "非在讀", label: "非在讀" },
]

type CampaignRow = {
  student: StudentRecord
  tokenRow: TrialInviteTokenRow | null
  uiStatus: UiStatus
}

function mapUiStatus(token: TrialInviteTokenRow | null): UiStatus {
  if (!token) return "未產生"
  if (token.status === "open") {
    if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) return "過期"
    return "未交"
  }
  if (token.status === "submitted") return "待審核"
  if (token.status === "approved") return "已核准"
  if (token.status === "expired") return "過期"
  if (token.status === "voided") return "已作廢"
  return "未產生"
}

function statusTone(status: UiStatus) {
  if (status === "已核准") return statusToTagTone("已批核")
  if (status === "待審核") return statusToTagTone("待審核")
  if (status === "未交") return statusToTagTone("待")
  if (status === "過期") return statusToTagTone("逾期")
  if (status === "已作廢") return statusToTagTone("取消")
  return statusToTagTone("非活躍生")
}

function statusSortRank(status: UiStatus): number {
  switch (status) {
    case "未產生":
      return 0
    case "未交":
      return 1
    case "待審核":
      return 2
    case "已核准":
      return 3
    case "過期":
      return 4
    case "已作廢":
      return 5
  }
}

function messagingTargetFromStudent(st: StudentRecord): PrimaryMessagingTarget | null {
  return resolvePrimaryMessagingTarget({
    student_phone: st.student_phone,
    parent_phone: st.parent_phone,
    student_phone_country_code: st.student_phone_country_code,
    parent_phone_country_code: st.parent_phone_country_code,
    primary_contact_person: st.primary_contact_person,
    student_preferred_contact_method: st.student_preferred_contact_method,
    parent_preferred_contact_method: st.parent_preferred_contact_method,
    student_wechat_id: st.student_wechat_id,
    parent_wechat_id: st.parent_wechat_id,
  })
}

function formatSchedule(ln: TrialInviteRequestListRow["lines"][number]): string {
  const date = ln.scheduled_date ?? "—"
  const start = (ln.start_time ?? "").slice(0, 5)
  const end = (ln.end_time ?? "").slice(0, 5)
  if (start && end) return `${date} ${start}–${end}`
  if (start) return `${date} ${start}`
  return date
}

function formatSubmittedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ")
  return d.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function requestTrialType(
  req: TrialInviteRequestListRow,
  token: TrialInviteTokenRow | null | undefined
): string | null {
  const fromRequest = req.trial_type?.trim()
  if (fromRequest) return fromRequest
  const fromToken = token?.trial_type?.trim()
  return fromToken || null
}

type StatusTabId = "所有" | "待審核" | "已確認"
type SortKey = "student" | "status"
type GenerateAfter = "none" | "copy" | "notify"
type GenerateIntent = {
  studentIds: string[]
  after: GenerateAfter
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
}

export function TrialInviteCampaignView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const openStudent = useOpenStudentRecord()
  const { preview } = useRecordPreview()
  const previewStudentId = preview?.kind === "student" ? preview.id : null
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [tokensByStudent, setTokensByStudent] = useState<Map<string, TrialInviteTokenRow>>(
    () => new Map()
  )
  const [pending, setPending] = useState<TrialInviteRequestListRow[]>([])
  const [recentSubjectsByStudent, setRecentSubjectsByStudent] = useState<Map<string, string[]>>(
    () => new Map()
  )
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusTabId>("所有")
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("在讀")
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("student")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [reviewRow, setReviewRow] = useState<TrialInviteRequestListRow | null>(null)
  const [approveHeadcount, setApproveHeadcount] = useState<"1" | "0" | "">("")
  const [approveTrialType, setApproveTrialType] = useState("免費試堂")
  const [generateIntent, setGenerateIntent] = useState<GenerateIntent | null>(null)
  const [generateTrialType, setGenerateTrialType] = useState("")

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const all = await fetchAllStudents()
      const list = all.filter((s) => s.academic_stage !== "已畢業")
      setStudents(list)
      const [tokens, requests, recentSubjects] = await Promise.all([
        fetchTrialInviteTokensByStudentIds(list.map((s) => s.id)),
        fetchTrialInviteRequests(["submitted"]),
        fetchRecentInviteTrialSubjects(),
      ])
      const map = new Map<string, TrialInviteTokenRow>()
      for (const t of tokens) map.set(t.student_id, t)
      setTokensByStudent(map)
      setPending(requests)
      setRecentSubjectsByStudent(recentSubjects)
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.load" })
      pushBanner({
        tone: "error",
        title: "載入失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [pushBanner])

  useEffect(() => {
    void reload()
  }, [reload])

  const rows: CampaignRow[] = useMemo(
    () =>
      students.map((student) => {
        const tokenRow = tokensByStudent.get(student.id) ?? null
        return { student, tokenRow, uiStatus: mapUiStatus(tokenRow) }
      }),
    [students, tokensByStudent]
  )

  const enrollmentScopedRows = useMemo(() => {
    if (enrollmentFilter === "all") return rows
    return rows.filter(
      (row) => normalizeEnrollmentStatus(row.student.enrollment_status) === enrollmentFilter
    )
  }, [rows, enrollmentFilter])

  const enrollmentCounts = useMemo(() => {
    let enrolled = 0
    let notEnrolled = 0
    for (const row of rows) {
      if (normalizeEnrollmentStatus(row.student.enrollment_status) === "在讀") enrolled += 1
      else notEnrolled += 1
    }
    return { all: rows.length, enrolled, notEnrolled }
  }, [rows])

  const isReviewTab = statusFilter === "待審核"
  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enrollmentScopedRows.filter((row) => {
      if (statusFilter === "已確認" && row.uiStatus !== "已核准") return false
      if (!q) return true
      const hay = [
        row.student.full_name,
        row.student.student_code,
        row.student.grade,
        row.student.school,
        ...(recentSubjectsByStudent.get(row.student.id) ?? []),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [enrollmentScopedRows, query, recentSubjectsByStudent, statusFilter])

  const pendingFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pending
    return pending.filter((req) => {
      const hay = [
        req.student_name,
        req.student_code,
        req.student_grade,
        req.trial_type,
        req.parent_note,
        req.elected_subject_codes.join(" "),
        ...req.lines.map((ln) => `${ln.class_label} ${formatSchedule(ln)}`),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [pending, query])

  const sorted = useMemo(() => {
    const mul = dirMul(sortDir)
    return [...filtered].sort((a, b) => {
      if (sortKey === "status") {
        const byStatus = statusSortRank(a.uiStatus) - statusSortRank(b.uiStatus)
        if (byStatus !== 0) return byStatus * mul
      } else {
        const empty = emptyLast(!a.student.full_name?.trim(), !b.student.full_name?.trim())
        if (empty != null) return empty
        const byName = a.student.full_name.localeCompare(b.student.full_name, "zh-Hant")
        if (byName !== 0) return byName * mul
      }
      return (a.student.student_code ?? "").localeCompare(b.student.student_code ?? "", "zh-Hant")
    })
  }, [filtered, sortDir, sortKey])

  const allFilteredSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.student.id))
  const someFilteredSelected = sorted.some((r) => selected.has(r.student.id))

  const statusTabs = useMemo(() => {
    let confirmedCount = 0
    for (const row of enrollmentScopedRows) {
      if (row.uiStatus === "已核准") confirmedCount += 1
    }
    return [
      { id: "所有" as const, label: `所有（${enrollmentScopedRows.length}）` },
      { id: "待審核" as const, label: `待審核（${pending.length}）` },
      { id: "已確認" as const, label: `已確認（${confirmedCount}）` },
    ]
  }, [enrollmentScopedRows, pending.length])

  const mergeTokens = (created: TrialInviteTokenRow[]) => {
    setTokensByStudent((prev) => {
      const next = new Map(prev)
      for (const t of created) next.set(t.student_id, t)
      return next
    })
  }

  const generateEligibleIds = (studentIds: string[]) => {
    const blocked: string[] = []
    const eligible: string[] = []
    for (const id of uniqueIds(studentIds)) {
      const existing = tokensByStudent.get(id)
      if (existing?.status === "submitted") blocked.push(id)
      else eligible.push(id)
    }
    return { blocked, eligible }
  }

  const openGenerate = (studentIds: string[], after: GenerateAfter = "none") => {
    const ids = uniqueIds(studentIds)
    if (ids.length === 0) return
    const { blocked, eligible } = generateEligibleIds(ids)
    if (eligible.length === 0) {
      pushBanner({
        tone: "error",
        title: "無法產生連結",
        message: "所選學生均有待審核申請，請先作廢現有連結。",
      })
      return
    }
    if (blocked.length > 0) {
      pushBanner({
        tone: "warning",
        title: "部分學生已有待審核申請",
        message: `已剔除 ${blocked.length} 人；請先作廢其連結後再產生。`,
      })
    }
    setGenerateIntent({ studentIds: eligible, after })
    setGenerateTrialType("")
  }

  const sendNotify = async (student: StudentRecord, token: string, trialType: TrialInviteType) => {
    const url = trialInvitePublicUrl(token)
    const message = buildTrialInviteNotifyMessage({
      fullName: student.full_name,
      url,
      trialType,
    })
    const target = messagingTargetFromStudent(student)
    if (!target) throw new Error("第一聯絡人未有電話／WeChat ID")
    if (target.channel === "WeChat") {
      await navigator.clipboard.writeText(message)
      pushBanner({
        tone: "success",
        title: "已複製 WeChat 話術",
        message: target.wechatId ? `WeChat ID：${target.wechatId}` : student.full_name,
      })
      return
    }
    openPrimaryMessagingTarget(target, message)
    pushBanner({ tone: "success", title: "已開啟 WhatsApp", message: student.full_name })
  }

  const confirmGenerate = async () => {
    if (!generateIntent) return
    if (!isTrialInviteType(generateTrialType)) {
      pushBanner({ tone: "error", title: "請選擇試堂類型", message: "免費、半價或原價試堂。" })
      return
    }
    setBusy(true)
    try {
      const created = await createTrialInviteTokens(generateIntent.studentIds, generateTrialType)
      mergeTokens(created)
      const after = generateIntent.after
      const firstId = generateIntent.studentIds[0]
      const firstStudent = firstId ? studentById.get(firstId) : undefined
      const firstToken =
        created.find((t) => t.student_id === firstId) ?? created[0] ?? null
      setGenerateIntent(null)
      setGenerateTrialType("")
      setSelected(new Set())
      if (after === "copy" && firstStudent && firstToken) {
        await navigator.clipboard.writeText(trialInvitePublicUrl(firstToken.token))
        pushBanner({
          tone: "success",
          title: "已產生並複製連結",
          message: `${firstStudent.full_name} · ${generateTrialType}`,
        })
      } else if (after === "notify" && firstStudent && firstToken) {
        await sendNotify(firstStudent, firstToken.token, generateTrialType)
      } else {
        pushBanner({
          tone: "success",
          title: "已產生連結",
          message: `共 ${created.length} 個 · ${generateTrialType}`,
        })
      }
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.generate" })
      pushBanner({
        tone: "error",
        title: "產生失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async (student: StudentRecord, tokenRow: TrialInviteTokenRow | null) => {
    if (!trialInviteTokenHasPublicUrl(tokenRow)) {
      pushBanner({
        tone: "error",
        title: "沒有可複製的連結",
        message: "請先產生連結。",
      })
      return
    }
    setBusy(true)
    try {
      await navigator.clipboard.writeText(trialInvitePublicUrl(tokenRow.token))
      pushBanner({ tone: "success", title: "已複製連結", message: student.full_name })
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.copy" })
      pushBanner({
        tone: "error",
        title: "複製失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const notify = async (student: StudentRecord, tokenRow: TrialInviteTokenRow | null) => {
    if (!trialInviteTokenHasPublicUrl(tokenRow)) {
      openGenerate([student.id], "notify")
      return
    }
    setBusy(true)
    try {
      await sendNotify(student, tokenRow.token, trialInviteTypeOrDefault(tokenRow.trial_type))
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.notify" })
      pushBanner({
        tone: "error",
        title: "通知失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const voidTokensFor = async (studentIds: string[]) => {
    const tokens = uniqueIds(studentIds)
      .map((id) => tokensByStudent.get(id) ?? null)
      .filter(trialInviteTokenVoidable)
    if (tokens.length === 0) {
      pushBanner({ tone: "error", title: "沒有可作廢的連結", message: "" })
      return
    }
    const hasSubmitted = tokens.some((t) => t.status === "submitted")
    const ok = await confirmDialog({
      title: "作廢邀請連結",
      description: hasSubmitted
        ? `將作廢 ${tokens.length} 個連結；待審核申請會一併取消，家長無法再使用舊連結。`
        : `將作廢 ${tokens.length} 個連結，家長無法再使用舊連結。`,
      confirmText: "確認作廢",
      tone: "destructive",
    })
    if (!ok) return
    setBusy(true)
    try {
      const voided: TrialInviteTokenRow[] = []
      for (const row of tokens) {
        voided.push(await voidTrialInviteToken(row.token))
      }
      mergeTokens(voided)
      if (hasSubmitted) await reload()
      setSelected(new Set())
      pushBanner({
        tone: "success",
        title: "已作廢連結",
        message: `共 ${voided.length} 個`,
      })
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.void" })
      pushBanner({
        tone: "error",
        title: "作廢失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const onApprove = async () => {
    if (!reviewRow) return
    if (approveHeadcount !== "1" && approveHeadcount !== "0") {
      pushBanner({ tone: "error", title: "請選擇是否計人頭", message: "" })
      return
    }
    setBusy(true)
    try {
      const studentId = reviewRow.student_id
      const classIds = reviewRow.lines.map((ln) => ln.class_id).filter(Boolean)
      const result = await reviewTrialInviteRequest({
        requestId: reviewRow.id,
        action: "approve",
        countsTowardHeadcount: approveHeadcount === "1",
        trialType: approveTrialType,
      })
      const createdCount = result.trial_sessions_created ?? 0
      const isFree = trialTypeCategory(approveTrialType) === "free"
      if (isFree) {
        let trialIds = result.trial_session_ids
        if (trialIds.length === 0) {
          trialIds = await fetchUnpaidInviteTrialIds({ studentId, classIds })
        }
        try {
          await issueZeroReceiptForTrialSessions({
            studentId,
            trialIds,
            trialType: approveTrialType,
          })
          pushBanner({
            tone: "success",
            title: "已核准試堂",
            message: `已建立 ${createdCount} 筆試堂，並出 $0 單確認收款；學生將出現在對應堂次的點名紙。`,
          })
        } catch (receiptErr) {
          reportUserFacingError(receiptErr, {
            source: "TrialInviteCampaignView.approve.receipt",
          })
          const trialPay = "free"
          const q = new URLSearchParams({
            studentId,
            mode: "receive",
            trialPay,
          })
          const firstClassId = classIds[0]
          if (firstClassId) q.set("classId", firstClassId)
          pushBanner({
            tone: "warning",
            title: "試堂已核准，但尚未上點名紙",
            message:
              "免費試堂 $0 單未能自動完成。請在收款登記確認後，學生才會出現在點名紙。",
          })
          setReviewRow(null)
          setApproveHeadcount("")
          await reload()
          navigate(`/Payments?${q.toString()}`)
          return
        }
      } else {
        const trialPay = trialTypeCategory(approveTrialType) === "half" ? "half" : "full"
        const q = new URLSearchParams({
          studentId,
          mode: "receive",
          trialPay,
        })
        const firstClassId = classIds[0]
        if (firstClassId) q.set("classId", firstClassId)
        pushBanner({
          tone: "success",
          title: "已核准試堂",
          message: `已建立 ${createdCount} 筆試堂；請完成收款確認後，學生才會出現在點名紙。`,
        })
        setReviewRow(null)
        setApproveHeadcount("")
        await reload()
        navigate(`/Payments?${q.toString()}`)
        return
      }
      setReviewRow(null)
      setApproveHeadcount("")
      await reload()
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.approve" })
      pushBanner({
        tone: "error",
        title: "核准失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const onReject = async () => {
    if (!reviewRow) return
    setBusy(true)
    try {
      await reviewTrialInviteRequest({
        requestId: reviewRow.id,
        action: "reject",
        rejectReason: "職員駁回",
      })
      pushBanner({ tone: "success", title: "已駁回申請", message: reviewRow.student_name })
      setReviewRow(null)
      await reload()
    } catch (e) {
      reportUserFacingError(e, { source: "TrialInviteCampaignView.reject" })
      pushBanner({
        tone: "error",
        title: "駁回失敗",
        message: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

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
    setSelected(new Set(sorted.map((r) => r.student.id)))
  }

  const openReview = (req: TrialInviteRequestListRow) => {
    const pendingType = requestTrialType(req, tokensByStudent.get(req.student_id))
    setReviewRow(req)
    setApproveHeadcount("")
    setApproveTrialType(trialInviteTypeOrDefault(pendingType))
  }

  const onToggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDir("asc")
  }

  return (
    <StickyListShell
      sticky={!isMobile}
      header={
        <>
          <AdminPageHeader
            eyebrow="行政工作"
            title="試堂邀請"
            description={
              isReviewTab
                ? "家長已選堂並提交的申請。核准後才建立試堂；免費試堂會自動出 $0 單並上點名紙，半價／原價須完成收款確認。"
                : "為既有學生產生專屬連結，產生前須選擇免費／半價／原價試堂。家長選堂提交後，請到「待審核」處理。免費試堂核准時自動出 $0 單並上點名紙；半價／原價仍須完成收款確認。"
            }
            actions={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link to="/TrialInviteCatalog">試堂名單控管</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || loading}
                  onClick={() => void reload()}
                >
                  重新載入
                </Button>
              </div>
            }
          />

          <RecordPageTabs
            tabs={statusTabs}
            value={statusFilter}
            onChange={setStatusFilter}
            isMobile={isMobile}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {isReviewTab ? null : (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  在讀狀態
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="在讀狀態">
                  {ENROLLMENT_FILTERS.map((f) => {
                    const active = enrollmentFilter === f.key
                    const count =
                      f.key === "all"
                        ? enrollmentCounts.all
                        : f.key === "在讀"
                          ? enrollmentCounts.enrolled
                          : enrollmentCounts.notEnrolled
                    return (
                      <button
                        key={f.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setEnrollmentFilter(f.key)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-muted/80"
                        )}
                      >
                        {f.label}（{count}）
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className={cn("relative w-full max-w-md", isReviewTab && "sm:ml-auto")}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isReviewTab ? "搜尋姓名／學號／班別" : "搜尋姓名／學號／年級"}
                className="pl-9"
              />
            </div>
          </div>
        </>
      }
    >
      {isReviewTab ? null : (
        <StickyListLead>
          <BulkSelectionBar
            selectedCount={selected.size}
            unitLabel="人"
            allFilteredSelected={allFilteredSelected}
            onToggleSelectAll={toggleSelectAllFiltered}
            onClear={() => setSelected(new Set())}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || selected.size === 0}
              onClick={() => openGenerate([...selected])}
            >
              <Link2 className="mr-1 h-4 w-4" aria-hidden />
              產生連結
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                busy ||
                ![...selected].some((id) => trialInviteTokenVoidable(tokensByStudent.get(id) ?? null))
              }
              onClick={() => void voidTokensFor([...selected])}
            >
              <Ban className="mr-1 h-4 w-4" aria-hidden />
              作廢連結
            </Button>
          </BulkSelectionBar>
        </StickyListLead>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : isReviewTab ? (
        pendingFiltered.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {pending.length === 0 ? "目前沒有待審核的申請。" : "沒有符合的申請。"}
          </p>
        ) : (
          <div className={stickyTableWrapClass}>
            <table className="w-full min-w-[48rem] table-fixed border-separate border-spacing-0 text-sm isolate">
              <thead className={stickyTableHeadClass}>
                <tr className={cn(stickyTableHeadRowClass, "text-xs font-medium text-muted-foreground")}>
                  <th className={cn(stickyTableHeadCellClass, "w-[22%] px-3 py-2")}>學生</th>
                  <th className={cn(stickyTableHeadCellClass, "w-[40%] px-3 py-2")}>申請堂次</th>
                  <th className={cn(stickyTableHeadCellClass, "w-[16%] px-3 py-2")}>試堂類型</th>
                  <th className={cn(stickyTableHeadCellClass, "w-[22%] px-3 py-2")}>操作</th>
                </tr>
              </thead>
              <tbody className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}>
                {pendingFiltered.map((req) => {
                  const tokenRow = tokensByStudent.get(req.student_id) ?? null
                  const trialType = requestTrialType(req, tokenRow)
                  const student = studentById.get(req.student_id)
                  const canVoid = trialInviteTokenVoidable(tokenRow)
                  return (
                    <tr
                      key={req.id}
                      className={cn(previewStudentId === req.student_id && "bg-info/15")}
                    >
                      <td className="align-top px-3 py-3">
                        <button
                          type="button"
                          className="block min-w-0 text-left"
                          onClick={() => openStudent(req.student_id)}
                        >
                          <p className="font-medium text-foreground hover:underline">
                            {req.student_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              req.student_code,
                              formatStudentGrade(req.student_grade),
                              student?.school,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          提交 {formatSubmittedAt(req.created_at)}
                        </p>
                      </td>
                      <td className="align-top px-3 py-3">
                        {req.lines.length === 0 ? (
                          <p className="text-muted-foreground">沒有堂次</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {req.lines.map((ln) => (
                              <li key={ln.id}>
                                <p className="font-medium text-foreground">{ln.class_label}</p>
                                <p className="text-xs text-muted-foreground">{formatSchedule(ln)}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                        {req.elected_subject_codes.length > 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            選修：{req.elected_subject_codes.join("、")}
                          </p>
                        ) : null}
                        {req.parent_note?.trim() ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            家長備註：{req.parent_note.trim()}
                          </p>
                        ) : null}
                      </td>
                      <td className="align-top px-3 py-3">
                        <p className="font-medium text-foreground">{trialType ?? "—"}</p>
                      </td>
                      <td className="align-top px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => openReview(req)}
                          >
                            審核
                          </Button>
                          {canVoid ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() => void voidTokensFor([req.student_id])}
                            >
                              <Ban className="mr-1 h-3.5 w-3.5" aria-hidden />
                              作廢
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          沒有符合的學生。
        </p>
      ) : (
        <div className={stickyTableWrapClass}>
          <table className="w-full min-w-[40rem] table-fixed border-separate border-spacing-0 text-sm isolate">
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
                <th className={cn(stickyTableHeadCellClass, "w-[34%] px-3 py-2")}>
                  <SortableColumnHeader
                    label="學生"
                    active={sortKey === "student"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("student")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[16%] px-3 py-2")}>
                  <SortableColumnHeader
                    label="狀態"
                    active={sortKey === "status"}
                    dir={sortDir}
                    onToggle={() => onToggleSort("status")}
                  />
                </th>
                <th className={cn(stickyTableHeadCellClass, "w-[40%] px-3 py-2")}>操作</th>
              </tr>
            </thead>
            <tbody className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}>
              {sorted.map((row) => {
                const tokenRow = row.tokenRow
                const recentCaption = formatRecentTrialSubjectsCaption(
                  recentSubjectsByStudent.get(row.student.id) ?? []
                )
                const target = messagingTargetFromStudent(row.student)
                const channel = target?.channel ?? "WhatsApp"
                const canNotify =
                  channel === "WeChat"
                    ? Boolean(target?.wechatId?.trim())
                    : Boolean(target?.phone?.trim())
                const canCopy = trialInviteTokenHasPublicUrl(tokenRow)
                const canVoid = trialInviteTokenVoidable(tokenRow)
                return (
                  <tr
                    key={row.student.id}
                    className={cn(previewStudentId === row.student.id && "bg-info/15")}
                  >
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={selected.has(row.student.id)}
                        onCheckedChange={() => toggleSelected(row.student.id)}
                        aria-label={`選取 ${row.student.full_name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="block min-w-0 text-left"
                        onClick={() => openStudent(row.student.id)}
                      >
                        <p className="font-medium text-foreground hover:underline">
                          {row.student.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[
                            row.student.student_code,
                            formatStudentGrade(row.student.grade),
                            row.student.school,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </button>
                      {recentCaption ? (
                        <p className="mt-1 text-xs text-muted-foreground">{recentCaption}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <Tag tone={statusTone(row.uiStatus)}>{row.uiStatus}</Tag>
                        {tokenRow && row.uiStatus !== "未產生" ? (
                          <p className="text-xs text-muted-foreground">{tokenRow.trial_type}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => openGenerate([row.student.id])}
                        >
                          <Link2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                          生成連結
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !canCopy}
                          onClick={() => void copyLink(row.student, tokenRow)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                          複製連結
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || !canNotify}
                          className={
                            channel === "WeChat"
                              ? "border-sky-500/40 text-sky-700 hover:bg-sky-600 hover:text-white"
                              : "border-success/40 text-success hover:bg-success"
                          }
                          onClick={() => void notify(row.student, tokenRow)}
                        >
                          <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
                          {channel === "WeChat" ? "WeChat" : "WhatsApp"}
                        </Button>
                        {canVoid ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void voidTokensFor([row.student.id])}
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" aria-hidden />
                            作廢
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        免費試堂核准後會自動出 $0 單並上點名紙。半價／原價核准後請到收款登記確認，確認後才上紙。
      </p>

      <Dialog open={Boolean(reviewRow)} onOpenChange={(open) => !open && setReviewRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>審核試堂申請</DialogTitle>
          </DialogHeader>
          {reviewRow ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground">{reviewRow.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {[reviewRow.student_code, formatStudentGrade(reviewRow.student_grade)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  提交 {formatSubmittedAt(reviewRow.created_at)}
                </p>
              </div>
              <ul className="space-y-2 rounded-lg border border-border p-3 text-sm">
                {reviewRow.lines.map((ln) => (
                  <li key={ln.id}>
                    <span className="font-medium">{ln.class_label}</span>
                    <span className="text-muted-foreground"> · {formatSchedule(ln)}</span>
                  </li>
                ))}
              </ul>
              {reviewRow.elected_subject_codes.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  選修科目：{reviewRow.elected_subject_codes.join("、")}
                </p>
              ) : null}
              {reviewRow.parent_note ? (
                <p className="text-sm text-muted-foreground">家長備註：{reviewRow.parent_note}</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">試堂類型</span>
                  <Select
                    value={approveTrialType}
                    onChange={(e) => setApproveTrialType(e.target.value)}
                  >
                    <option value="免費試堂">免費試堂</option>
                    <option value="半價試堂">半價試堂</option>
                    <option value="原價試堂">原價試堂</option>
                    <option value="體驗課">體驗課</option>
                  </Select>
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">計人頭</span>
                  <Select
                    value={approveHeadcount}
                    onChange={(e) => setApproveHeadcount(e.target.value as "1" | "0" | "")}
                  >
                    <option value="">請選擇</option>
                    <option value="1">計入</option>
                    <option value="0">不計入</option>
                  </Select>
                </label>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={() => void onReject()}>
                  駁回
                </Button>
                <Button type="button" loading={busy} onClick={() => void onApprove()}>
                  核准並建立試堂
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(generateIntent)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setGenerateIntent(null)
            setGenerateTrialType("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>選擇試堂類型</DialogTitle>
          </DialogHeader>
          {generateIntent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                此次將為 {generateIntent.studentIds.length}{" "}
                名學生產生專屬連結。若該生已有未提交連結，將作廢舊連結並產生新連結。
              </p>
              {generateIntent.studentIds.some((id) => {
                const existing = tokensByStudent.get(id)
                return existing?.status === "open" || existing?.status === "expired"
              }) ? (
                <p className="text-sm text-warning">
                  部分學生已有未提交連結，確認後舊連結即時失效。
                </p>
              ) : null}
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">這次屬於</span>
                <Select
                  value={generateTrialType}
                  onChange={(e) => setGenerateTrialType(e.target.value)}
                  aria-label="試堂類型"
                >
                  <option value="">請選擇</option>
                  {TRIAL_INVITE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </label>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setGenerateIntent(null)
                    setGenerateTrialType("")
                  }}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  loading={busy}
                  disabled={!isTrialInviteType(generateTrialType)}
                  onClick={() => void confirmGenerate()}
                >
                  {generateIntent.after === "copy"
                    ? "產生並複製"
                    : generateIntent.after === "notify"
                      ? "產生並通知"
                      : "產生連結"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </StickyListShell>
  )
}
