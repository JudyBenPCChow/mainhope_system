import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import type { CourseMode, EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { SINGLE_SESSION_ENROLLMENT } from "@/lib/enrollmentPeriod"

export type TrialConvertClassOption = {
  id: string
  label: string
  courseMode: CourseMode
  enrollmentNotice: string | null
}

export type TrialConvertSessionOption = {
  id: string
  sessionNumber: number
  date: string
  start: string
  end: string
}

export type TrialConvertDialogTarget = {
  id: string
  studentId: string
  studentName: string
  studentGrade: string | null
  trialClassId: string
  trialClassLabel: string
  trialDate: string
  schedStart: string | null
  schedEnd: string | null
  rollCallDone: boolean
  courseMode: CourseMode
}

export type TrialConvertSubmitPayload = {
  targetClassId: string
  enrollmentPeriod: EnrollmentFormValue | null
  scheduleIds: string[]
  formLabel: string
}

type Props = {
  open: boolean
  target: TrialConvertDialogTarget | null
  classOptions: TrialConvertClassOption[]
  /** 目標班單堂選項；由父層依 convertClassId 載入 */
  sessions: TrialConvertSessionOption[]
  sessionsLoading?: boolean
  onTargetClassChange?: (classId: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: TrialConvertSubmitPayload) => void | Promise<void>
  saving?: boolean
}

export function TrialConvertDialog({
  open,
  target,
  classOptions,
  sessions,
  sessionsLoading = false,
  onTargetClassChange,
  onOpenChange,
  onSubmit,
  saving = false,
}: Props) {
  const [targetClassId, setTargetClassId] = useState("")
  const [enrollForm, setEnrollForm] = useState<"full" | "single" | "第一期" | "第二期" | "兩期全報">(
    "full"
  )
  const [pickedSessions, setPickedSessions] = useState<string[]>([])
  const [dlgErr, setDlgErr] = useState<string | null>(null)

  const selectedClass = useMemo(
    () => classOptions.find((c) => c.id === targetClassId) ?? null,
    [classOptions, targetClassId]
  )
  const courseMode: CourseMode = selectedClass?.courseMode ?? target?.courseMode ?? "regular"

  useEffect(() => {
    if (!open || !target) return
    setTargetClassId(target.trialClassId)
    setEnrollForm(target.courseMode === "summer_two_period" ? "兩期全報" : "full")
    setPickedSessions([])
    setDlgErr(null)
    onTargetClassChange?.(target.trialClassId)
  }, [open, target, onTargetClassChange])

  const toggleSession = (id: string) => {
    setPickedSessions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const formLabel = useMemo(() => {
    if (!target) return ""
    if (enrollForm === "single") {
      const nums = pickedSessions
        .map((id) => sessions.find((s) => s.id === id)?.sessionNumber)
        .filter((n): n is number => n != null)
        .sort((a, b) => a - b)
      return nums.length ? `單堂（第${nums.join("、")}堂）` : "單堂"
    }
    if (courseMode === "summer_two_period") {
      if (enrollForm === "第一期") return "暑期第一期"
      if (enrollForm === "第二期") return "暑期第二期"
      if (enrollForm === "兩期全報") return "暑期兩期全報"
    }
    return "報讀"
  }, [courseMode, enrollForm, pickedSessions, sessions, target])

  const submit = async () => {
    if (!target || !targetClassId) return
    if (enrollForm === "single" && pickedSessions.length === 0) {
      setDlgErr("單堂請至少勾選一堂")
      return
    }
    const enrollmentPeriod: EnrollmentFormValue | null =
      enrollForm === "full"
        ? null
        : enrollForm === "single"
          ? SINGLE_SESSION_ENROLLMENT
          : enrollForm
    setDlgErr(null)
    try {
      await onSubmit({
        targetClassId,
        enrollmentPeriod,
        scheduleIds: enrollForm === "single" ? pickedSessions : [],
        formLabel,
      })
    } catch (e) {
      reportUserFacingError(e, {
        source: "TrialConvertDialog.submit",
        setErr: setDlgErr,
        userMessage: e instanceof Error ? e.message : "轉正失敗",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>正式報讀（轉化）</DialogTitle>
        </DialogHeader>
        {target ? (
          <div className="grid gap-4 text-sm">
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="font-medium">
                <Link
                  to={`/Students/${target.studentId}`}
                  className="text-info hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {target.studentName}
                </Link>
                {target.studentGrade ? (
                  <span className="ml-2 text-muted-foreground">{target.studentGrade}</span>
                ) : null}
              </div>
              <div className="mt-0.5 text-muted-foreground">試堂班：{target.trialClassLabel}</div>
              <div className="mt-0.5 tabular-nums text-xs text-muted-foreground">
                試堂 {target.trialDate}
                {target.schedStart && target.schedEnd
                  ? ` ${target.schedStart}–${target.schedEnd}`
                  : null}
              </div>
            </div>

            {!target.rollCallDone ? (
              <div
                role="status"
                className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
              >
                學生尚未完成試堂點名。若已收學費但未點名，堂數與出席會對不上。確認轉正前請再核對。
              </div>
            ) : null}

            <label className="grid gap-1 text-xs text-muted-foreground">
              <span>報讀班別 *</span>
              <Select
                className="h-10 min-h-10 w-full"
                value={targetClassId}
                onChange={(e) => {
                  const id = e.target.value
                  setTargetClassId(id)
                  setPickedSessions([])
                  const cls = classOptions.find((c) => c.id === id)
                  setEnrollForm(cls?.courseMode === "summer_two_period" ? "兩期全報" : "full")
                  onTargetClassChange?.(id)
                }}
              >
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {c.id === target.trialClassId ? "（試堂班）" : ""}
                  </option>
                ))}
              </Select>
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-xs font-medium text-muted-foreground">報讀形式</legend>
              {courseMode === "regular" ? (
                <Select
                  className="h-10 min-h-10"
                  value={enrollForm === "single" ? "single" : "full"}
                  onChange={(e) => setEnrollForm(e.target.value === "single" ? "single" : "full")}
                >
                  <option value="full">報讀（常規學年）</option>
                  <option value="single">單堂（自選堂數）</option>
                </Select>
              ) : (
                <Select
                  className="h-10 min-h-10"
                  value={enrollForm}
                  onChange={(e) =>
                    setEnrollForm(
                      e.target.value as "full" | "single" | "第一期" | "第二期" | "兩期全報"
                    )
                  }
                >
                  <option value="第一期">暑期第一期</option>
                  <option value="第二期">暑期第二期</option>
                  <option value="兩期全報">暑期兩期全報</option>
                  <option value="single">單堂（自選堂數）</option>
                </Select>
              )}
              {enrollForm === "single" ? (
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  <p className="mb-1 text-xs text-muted-foreground">勾選要報讀的堂次</p>
                  {sessionsLoading ? (
                    <p className="text-xs text-muted-foreground">載入排程…</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">此班暫無可選堂次</p>
                  ) : (
                    sessions.map((s) => {
                      const checked = pickedSessions.includes(s.id)
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/60",
                            checked && "bg-muted/40"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border"
                            checked={checked}
                            onChange={() => toggleSession(s.id)}
                          />
                          <span>
                            第{s.sessionNumber}堂 · {s.date} {s.start}–{s.end}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              ) : null}
            </fieldset>

            <p className="text-xs text-muted-foreground">
              學費請到{" "}
              <Link className="text-info hover:underline" to={`/Payments?studentId=${target.studentId}`}>
                收款頁
              </Link>{" "}
              處理；本對話框只建立報讀並標轉化。
            </p>

            {dlgErr ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
              >
                {dlgErr}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="button" disabled={saving || !targetClassId} onClick={() => void submit()}>
                {saving ? "處理中…" : "確認轉正"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
