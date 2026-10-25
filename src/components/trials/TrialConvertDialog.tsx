import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { ChoiceChips } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select } from "@/components/ui/select"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import type { CourseMode, EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import {
  excludeScheduleById,
  formatClassScheduleLabel,
  listEnrollmentStartScheduleOptions,
  resolveEnrollmentStartDate,
  resolveNextClassSchedule,
  type EnrollmentStartMode,
} from "@/lib/enrollmentStart"
import { isActualPresentStatus } from "@/lib/attendancePresence"
import { classKindLabel, type ClassKind } from "@/lib/privateClassKind"
import {
  isTeacherCommentNudgeInScope,
  isWrittenTrialComment,
  trialCommentAuthorLabel,
} from "@/lib/trialTeacherComment"

function formatLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatLocalHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export type HomeworkDayPlan = "三日" | "四日" | "五日" | "七日"

const NEW_HOMEWORK_PLANS = ["三日", "四日", "五日"] as const

function trialClockLabel(start: string | null, end: string | null): string | null {
  const a = start ? String(start).slice(0, 5) : ""
  const b = end ? String(end).slice(0, 5) : ""
  if (!a || !b) return null
  return `${a}–${b}`
}

export type TrialConvertClassOption = {
  id: string
  label: string
  courseMode: CourseMode
  enrollmentNotice: string | null
  classKind: ClassKind
  courseCode: string | null
  /** 學生已有該班就讀中報讀：只連結，不新增 */
  existingEnrollment: boolean
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
  trialScheduleId: string
  rollCallDone: boolean
  teacherComment: string | null
  teacherCommentAt: string | null
  teacherCommentByName: string | null
  teacherCommentEditedAt: string | null
  attendanceStatus: string | null
  courseMode: CourseMode
  classKind: ClassKind
  courseCode: string | null
}

export type TrialConvertSubmitPayload = {
  targetClassId: string
  enrollmentPeriod: EnrollmentFormValue | null
  scheduleIds: string[]
  formLabel: string
  /** 轉化備註；寫入試堂結果說明 */
  note: string | null
  /** 專科：報讀開始日。功輔／私人為 null（今天） */
  enrollDate: string | null
  homeworkDayPlan: HomeworkDayPlan | null
}

type Props = {
  open: boolean
  target: TrialConvertDialogTarget | null
  classOptions: TrialConvertClassOption[]
  classOptionsLoading?: boolean
  /** 目標班排程；由父層依 convertClassId 載入 */
  sessions: TrialConvertSessionOption[]
  sessionsLoading?: boolean
  sessionsError?: string | null
  /** 目前 sessions 對應的班別；與選擇不一致時不准提交 */
  sessionsForClassId?: string | null
  onTargetClassChange?: (classId: string) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: TrialConvertSubmitPayload) => void | Promise<void>
  saving?: boolean
}

export function TrialConvertDialog({
  open,
  target,
  classOptions,
  classOptionsLoading = false,
  sessions,
  sessionsLoading = false,
  sessionsError = null,
  sessionsForClassId = null,
  onTargetClassChange,
  onOpenChange,
  onSubmit,
  saving = false,
}: Props) {
  const [targetClassId, setTargetClassId] = useState("")
  const [enrollForm, setEnrollForm] = useState<"full" | "第一期" | "第二期" | "兩期全報">("full")
  const [startMode, setStartMode] = useState<EnrollmentStartMode>("next")
  const [startScheduleId, setStartScheduleId] = useState("")
  const [hwPlan, setHwPlan] = useState<HomeworkDayPlan | "">("")
  const [note, setNote] = useState("")
  const [dlgErr, setDlgErr] = useState<string | null>(null)

  const selectedClass = useMemo(
    () => classOptions.find((c) => c.id === targetClassId) ?? null,
    [classOptions, targetClassId]
  )
  const classKind: ClassKind = target?.classKind ?? "group"
  const isGroup = classKind === "group"
  const isHomework = classKind === "homework"
  const isPrivate = classKind === "private"
  const isLinking = Boolean(selectedClass?.existingEnrollment)
  const courseMode: CourseMode = selectedClass?.courseMode ?? target?.courseMode ?? "regular"

  const trialId = target?.id ?? null
  const trialClassId = target?.trialClassId ?? ""
  const trialCourseMode = target?.courseMode
  const homeworkPlanOptions = NEW_HOMEWORK_PLANS

  useEffect(() => {
    if (!open || !trialId) return
    setEnrollForm(trialCourseMode === "summer_two_period" ? "兩期全報" : "full")
    setStartMode("next")
    setStartScheduleId("")
    setHwPlan("")
    setNote("")
    setDlgErr(null)
    if (isPrivate) {
      setTargetClassId(trialClassId)
    } else {
      setTargetClassId("")
    }
    // 只在開啟或換一筆試堂時重設。父層回呼每次 render 都是新函式，放進依賴會把已選的其他班打回試堂班。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trialId])

  useEffect(() => {
    if (!open || isPrivate || classOptionsLoading) return
    const nextId = classOptions.some((c) => c.id === targetClassId)
      ? targetClassId
      : classOptions.some((c) => c.id === trialClassId)
        ? trialClassId
        : (classOptions[0]?.id ?? "")
    if (nextId === targetClassId) return
    setTargetClassId(nextId)
    setStartMode("next")
    setStartScheduleId("")
    setEnrollForm(
      (classOptions.find((c) => c.id === nextId)?.courseMode ?? trialCourseMode) ===
        "summer_two_period"
        ? "兩期全報"
        : "full"
    )
    if (nextId) onTargetClassChange?.(nextId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPrivate, classOptions, classOptionsLoading, trialClassId])

  const classSearchOptions = useMemo(
    () =>
      classOptions.map((c) => {
        const bits = [c.label]
        if (c.id === trialClassId) bits.push("試堂班")
        if (c.existingEnrollment) bits.push("連結現有報讀")
        const label = bits.length > 1 ? `${bits[0]}（${bits.slice(1).join(" · ")}）` : bits[0]
        return { value: c.id, label, searchText: c.label, displayText: label }
      }),
    [classOptions, trialClassId]
  )

  const now = new Date()
  const todayYmd = formatLocalYmd(now)
  const nowHm = formatLocalHm(now)
  const startRows = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        scheduled_date: s.date,
        status: "正常",
        start_time: s.start,
        session_number: s.sessionNumber,
      })),
    [sessions]
  )
  const trialScheduleId = target?.trialScheduleId ?? ""
  const enrollStartRows = useMemo(() => {
    if (!trialScheduleId || !targetClassId || targetClassId !== trialClassId) return startRows
    return excludeScheduleById(startRows, trialScheduleId)
  }, [startRows, trialScheduleId, targetClassId, trialClassId])
  const nextSchedule = useMemo(
    () => resolveNextClassSchedule(enrollStartRows, todayYmd, nowHm),
    [enrollStartRows, todayYmd, nowHm]
  )
  const futureSchedules = useMemo(
    () =>
      listEnrollmentStartScheduleOptions(enrollStartRows).filter(
        (row) => row.scheduled_date.slice(0, 10) >= todayYmd
      ),
    [enrollStartRows, todayYmd]
  )
  const sessionsReady =
    !isGroup ||
    (!sessionsLoading && !sessionsError && sessionsForClassId === targetClassId && Boolean(targetClassId))
  const hasFutureStart = Boolean(nextSchedule) && futureSchedules.length > 0
  const resolvedEnrollDate = useMemo(() => {
    if (!isGroup) return null
    if (startMode === "next") {
      return nextSchedule?.scheduled_date.slice(0, 10) ?? null
    }
    try {
      return resolveEnrollmentStartDate({
        mode: "schedule",
        todayYmd,
        nextScheduleDate: nextSchedule?.scheduled_date,
        specifiedScheduleDate: futureSchedules.find((row) => row.id === startScheduleId)
          ?.scheduled_date,
      })
    } catch {
      return null
    }
  }, [futureSchedules, isGroup, nextSchedule, startMode, startScheduleId, todayYmd])

  const formLabel = useMemo(() => {
    if (!target) return ""
    if (isHomework) return hwPlan ? `功課輔導班（每週${hwPlan}）` : "功課輔導班"
    if (isPrivate) return "私人課程"
    const startSuffix =
      resolvedEnrollDate && resolvedEnrollDate !== todayYmd ? `（由 ${resolvedEnrollDate} 起）` : ""
    if (courseMode === "summer_two_period") {
      if (enrollForm === "第一期") return `暑期第一期${startSuffix}`
      if (enrollForm === "第二期") return `暑期第二期${startSuffix}`
      if (enrollForm === "兩期全報") return `暑期兩期全報${startSuffix}`
    }
    return `報讀${startSuffix}`
  }, [
    courseMode,
    enrollForm,
    hwPlan,
    isHomework,
    isPrivate,
    resolvedEnrollDate,
    target,
    todayYmd,
  ])

  const allowedHomeworkPlans: readonly string[] = homeworkPlanOptions
  const hwPlanOk = hwPlan !== "" && allowedHomeworkPlans.includes(hwPlan)

  const submit = async () => {
    if (!target || !targetClassId) return
    if (!isLinking && isHomework && !hwPlanOk) {
      setDlgErr("請選擇每週日數檔")
      return
    }
    if (!isLinking && isGroup && !sessionsReady) {
      setDlgErr(sessionsError || "請等待排程載入完成")
      return
    }
    if (!isLinking && isGroup && !hasFutureStart) {
      setDlgErr("此班別未有未來排程")
      return
    }
    if (!isLinking && isGroup && startMode === "schedule" && !resolvedEnrollDate) {
      setDlgErr("請選擇開始報讀的未來排程")
      return
    }
    const enrollmentPeriod: EnrollmentFormValue | null =
      isLinking || enrollForm === "full" || isHomework || isPrivate ? null : enrollForm
    setDlgErr(null)
    try {
      await onSubmit({
        targetClassId,
        enrollmentPeriod,
        scheduleIds: [],
        formLabel: isLinking ? "連結現有報讀" : formLabel,
        note: note.trim() || null,
        enrollDate: isLinking || !isGroup ? null : resolvedEnrollDate,
        homeworkDayPlan: isLinking || !isHomework || !hwPlanOk ? null : hwPlan,
      })
    } catch (e) {
      reportUserFacingError(e, {
        source: "TrialConvertDialog.submit",
        setErr: setDlgErr,
        userMessage: e instanceof Error ? e.message : "正式報讀失敗",
      })
    }
  }

  const startOk =
    !isGroup ||
    (sessionsReady &&
      hasFutureStart &&
      (startMode !== "schedule" || Boolean(startScheduleId && resolvedEnrollDate)))
  const canSubmit =
    !saving &&
    Boolean(targetClassId) &&
    (isLinking ||
      isPrivate ||
      (isHomework && hwPlanOk) ||
      (isGroup && !classOptionsLoading && startOk))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>正式報讀</DialogTitle>
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
              <div className="mt-0.5 text-muted-foreground">
                試堂班：{target.trialClassLabel}
                <span className="ml-2">（{classKindLabel(classKind)}）</span>
              </div>
              <div className="mt-0.5 tabular-nums text-xs text-muted-foreground">
                試堂 {target.trialDate}
                {trialClockLabel(target.schedStart, target.schedEnd)
                  ? ` ${trialClockLabel(target.schedStart, target.schedEnd)}`
                  : null}
              </div>
            </div>

            {!target.rollCallDone ? (
              <div
                role="status"
                className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
              >
                學生尚未完成試堂點名。若已收學費但未點名，堂數與出席會對不上。確認正式報讀前請再核對。
              </div>
            ) : null}

            {isActualPresentStatus(target.attendanceStatus) ? (
              isWrittenTrialComment(target.teacherCommentAt) && target.teacherComment?.trim() ? (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="whitespace-pre-wrap">老師評語：{target.teacherComment}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {trialCommentAuthorLabel(target.teacherCommentByName)}
                    {target.teacherCommentEditedAt ? " · 其後改過" : null}
                  </p>
                </div>
              ) : isTeacherCommentNudgeInScope(target.trialDate) ? (
                <p className="text-sm text-muted-foreground">尚未收到老師評語</p>
              ) : null
            ) : null}

            {isGroup || isHomework ? (
              <div className="grid gap-1 text-xs text-muted-foreground">
                <span>報讀班別 *</span>
                <SearchableSelect
                  combobox
                  className="min-h-10 w-full"
                  value={targetClassId}
                  options={classSearchOptions}
                  placeholder="搜尋班別名稱或代碼…"
                  searchPlaceholder="搜尋班別名稱或代碼…"
                  emptyMessage={
                    classOptionsLoading
                      ? "載入班別…"
                      : classOptions.length === 0
                        ? isHomework
                          ? "沒有可報讀的功課輔導班"
                          : "沒有可報讀的專科班"
                        : "找不到班別"
                  }
                  aria-label="報讀班別"
                  onChange={(id) => {
                    if (!id) return
                    setTargetClassId(id)
                    setStartMode("next")
                    setStartScheduleId("")
                    setDlgErr(null)
                    const cls = classOptions.find((c) => c.id === id)
                    setEnrollForm(cls?.courseMode === "summer_two_period" ? "兩期全報" : "full")
                    onTargetClassChange?.(id)
                  }}
                />
                <span>
                  {isHomework
                    ? "可改選其他功課輔導班（例如小學部／中學部）。已就讀則連結現有報讀，不會再新增。"
                    : "可搜尋改選其他專科班。已就讀則連結現有報讀，不會再新增。"}
                </span>
              </div>
            ) : (
              <div className="grid gap-1 text-xs text-muted-foreground">
                <span>報讀班別</span>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
                  {target.trialClassLabel}
                </div>
                <span>此試堂為私人課程，轉化後報讀此班，開始日為今天。改老師或加堂請到私人課程頁。</span>
              </div>
            )}

            {isLinking ? (
              <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                學生已在此班就讀。確認後只把本筆試堂標為已正式報讀並連結該報讀，不會再新增一筆。
              </p>
            ) : null}

            {!isLinking && isHomework ? (
              <fieldset className="grid gap-2">
                <legend className="text-xs font-medium text-muted-foreground">每週日數檔 *</legend>
                <ChoiceChips
                  options={homeworkPlanOptions}
                  value={hwPlan}
                  onChange={setHwPlan}
                  label={(plan) => plan}
                />
              </fieldset>
            ) : null}

            {!isLinking && isGroup ? (
              <fieldset className="grid gap-2">
                <legend className="text-xs font-medium text-muted-foreground">報讀形式</legend>
                {courseMode === "summer_two_period" ? (
                  <Select
                    className="h-10 min-h-10"
                    value={enrollForm === "full" ? "兩期全報" : enrollForm}
                    onChange={(e) =>
                      setEnrollForm(e.target.value as "第一期" | "第二期" | "兩期全報")
                    }
                  >
                    <option value="第一期">暑期第一期</option>
                    <option value="第二期">暑期第二期</option>
                    <option value="兩期全報">暑期兩期全報</option>
                  </Select>
                ) : (
                  <p className="text-muted-foreground">報讀（常規學年）</p>
                )}
                <div className="grid gap-2">
                  <span className="text-xs font-medium text-muted-foreground">開始報讀</span>
                  <ChoiceChips
                    options={["next", "schedule"] as const}
                    value={startMode}
                    onChange={(mode) => {
                      setStartMode(mode)
                      if (mode === "schedule" && !startScheduleId && nextSchedule) {
                        setStartScheduleId(nextSchedule.id)
                      }
                    }}
                    label={(mode) => (mode === "next" ? "下一堂" : "指定未來排程")}
                  />
                  {targetClassId === trialClassId ? (
                    <p className="text-xs text-muted-foreground">
                      開始日不會用試堂當堂，避免試堂費與學費疊在同一堂。
                    </p>
                  ) : null}
                  {startMode === "next" ? (
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-muted-foreground">
                      {!sessionsReady && sessionsError ? (
                        <p role="alert" className="text-destructive">
                          無法載入排程，請重試。
                          {targetClassId ? (
                            <>
                              {" "}
                              <button
                                type="button"
                                className="text-info underline-offset-4 hover:underline"
                                onClick={() => onTargetClassChange?.(targetClassId)}
                              >
                                重試
                              </button>
                            </>
                          ) : null}
                        </p>
                      ) : !sessionsReady ? (
                        "載入排程中…"
                      ) : nextSchedule ? (
                        <>
                          將由{" "}
                          <strong className="text-foreground">
                            {formatClassScheduleLabel(nextSchedule)}
                          </strong>{" "}
                          開始計入報讀
                        </>
                      ) : (
                        <p role="status" className="text-warning">
                          此班別未有未來排程。
                        </p>
                      )}
                    </div>
                  ) : (
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-muted-foreground">選擇開始排程</span>
                      {!sessionsReady && sessionsError ? (
                        <p role="alert" className="text-destructive">
                          無法載入排程，請重試。
                          {targetClassId ? (
                            <>
                              {" "}
                              <button
                                type="button"
                                className="text-info underline-offset-4 hover:underline"
                                onClick={() => onTargetClassChange?.(targetClassId)}
                              >
                                重試
                              </button>
                            </>
                          ) : null}
                        </p>
                      ) : !sessionsReady ? (
                        <p className="text-muted-foreground">載入排程中…</p>
                      ) : futureSchedules.length === 0 ? (
                        <p role="status" className="text-warning">
                          此班別未有未來排程。
                        </p>
                      ) : (
                        <Select
                          className="h-10 min-h-10"
                          value={startScheduleId}
                          onChange={(e) => setStartScheduleId(e.target.value)}
                        >
                          <option value="">請選擇排程…</option>
                          {futureSchedules.map((row) => (
                            <option key={row.id} value={row.id}>
                              {formatClassScheduleLabel(row)}
                            </option>
                          ))}
                        </Select>
                      )}
                    </label>
                  )}
                </div>
              </fieldset>
            ) : null}

            <label className="grid gap-1 text-xs text-muted-foreground">
              <span>備註（選填）</span>
              <Input
                className="h-10"
                placeholder={isGroup ? "例如改選班別的原因" : "補充說明"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <p className="text-xs text-muted-foreground">
              學費請到{" "}
              <Link className="text-info hover:underline" to={`/Payments?studentId=${target.studentId}`}>
                收款登記
              </Link>{" "}
              處理；本對話框
              {isLinking ? "只把試堂標為已正式報讀。" : "只建立報讀並標為已正式報讀。"}
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
              <Button
                type="button"
                disabled={!canSubmit}
                loading={saving}
                loadingText="處理中…"
                onClick={() => void submit()}
              >
                {isLinking ? "確認連結並結案" : "確認正式報讀"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
