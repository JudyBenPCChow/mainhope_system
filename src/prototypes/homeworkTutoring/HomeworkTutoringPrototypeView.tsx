import { useMemo, useState } from "react"
import { BookOpen, FlaskConical } from "lucide-react"

import { Select } from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import { AdminHomeworkWorkbench } from "./AdminHomeworkWorkbench"
import { ManagerHomeworkWorkbench } from "./ManagerHomeworkWorkbench"
import { TeacherHomeworkWorkbench } from "./TeacherHomeworkWorkbench"
import {
  MOCK_ACADEMIC_YEAR,
  MOCK_DUTY_DAYS,
  MOCK_FEES,
  MOCK_MONTH_LABEL,
  MOCK_STUDENTS,
  MOCK_SUBJECT_TEACHERS,
  MOCK_MONTH_ROSTER_STATUS,
  MOCK_ROSTER_MONTH_KEY,
  cloneAvailability,
  cloneHwAccessIds,
  cloneSubmitStatus,
  monthRosterToLock,
  teachersWithHwAccess,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type MockDutyDay,
  type MockStudent,
  type MonthRosterState,
  type SandboxRole,
} from "./mockData"
import {
  ADMIN_NAV,
  MANAGER_NAV,
  TEACHER_NAV,
  type AdminPageId,
  type ManagerPageId,
  type TeacherPageId,
} from "./sandboxNav"
import { SandboxSectionNav } from "./sharedUi"

const ROLE_OPTIONS: { value: SandboxRole; label: string }[] = [
  { value: "admin", label: "行政" },
  { value: "manager", label: "管理層" },
  { value: "teacher", label: "老師" },
]

/**
 * 功課輔導 UI 沙盒（全角色）。
 * 硬編碼假資料；不呼叫 services／Supabase。
 * 副頁以左側清單預覽正式側欄一級「功課輔導」；尚未掛 navStructure。
 */
export function HomeworkTutoringPrototypeView() {
  const isMobile = useIsMobile()
  const [role, setRole] = useState<SandboxRole>("admin")
  const [teacherId, setTeacherId] = useState(MOCK_SUBJECT_TEACHERS[0]!.id)
  const [adminPage, setAdminPage] = useState<AdminPageId>("overview")
  const [managerPage, setManagerPage] = useState<ManagerPageId>("home")
  const [teacherPage, setTeacherPage] = useState<TeacherPageId>("submit")
  const [students] = useState<MockStudent[]>(() => [...MOCK_STUDENTS])
  const [fees] = useState(() => [...MOCK_FEES])
  const [avail, setAvail] = useState<AllTeacherAvailability>(() => cloneAvailability())
  const [submitStatus, setSubmitStatus] = useState<AllTeacherSubmitStatus>(() =>
    cloneSubmitStatus()
  )
  const [dutyDays, setDutyDays] = useState<MockDutyDay[]>(() => [...MOCK_DUTY_DAYS])
  const [monthRosterStatus, setMonthRosterStatus] = useState<Record<string, MonthRosterState>>(
    () => ({ ...MOCK_MONTH_ROSTER_STATUS })
  )
  const [hwAccessIds, setHwAccessIds] = useState<Set<string>>(() => cloneHwAccessIds())
  const hwTeachers = useMemo(() => teachersWithHwAccess(hwAccessIds), [hwAccessIds])
  const teacherHasHwAccess = hwAccessIds.has(teacherId)
  /** 老師報更鎖定跟十月編更狀態 */
  const rosterPublishStatus = monthRosterToLock(
    monthRosterStatus[MOCK_ROSTER_MONTH_KEY] ?? "未編更"
  )

  const currentPageLabel = useMemo(() => {
    if (role === "admin") return ADMIN_NAV.find((p) => p.value === adminPage)?.label ?? "概覽"
    if (role === "manager") return MANAGER_NAV.find((p) => p.value === managerPage)?.label ?? "監督首屏"
                if (!teacherHasHwAccess) return "功課輔導"
    return TEACHER_NAV.find((p) => p.value === teacherPage)?.label ?? "功輔報更"
  }, [role, adminPage, managerPage, teacherPage, teacherHasHwAccess])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-sm sm:px-4">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium text-foreground">功課輔導 UI 預覽（全角色・示範資料）</p>
            <p className="mt-1 text-muted-foreground">
              不連接真實資料庫。正式產品側欄一級為「功課輔導」，打開後見各副頁，不用頁內標籤。本沙盒以左側清單預覽。每日功課進度繼續用
              Notion。
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <header>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{currentPageLabel}</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            功課輔導班｜{MOCK_ACADEMIC_YEAR}學年｜{MOCK_MONTH_LABEL}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-lg border border-border bg-muted/30 p-0.5"
            role="group"
            aria-label="沙盒角色"
          >
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  role === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {role === "teacher" ? (
            <Select
              aria-label="示範老師"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-44"
            >
              {MOCK_SUBJECT_TEACHERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {hwAccessIds.has(t.id) ? "" : "（無入口）"}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="lg:sticky lg:top-4">
          {role === "admin" ? (
            <SandboxSectionNav items={ADMIN_NAV} value={adminPage} onChange={setAdminPage} isMobile={isMobile} />
          ) : null}
          {role === "manager" ? (
            <SandboxSectionNav
              items={MANAGER_NAV}
              value={managerPage}
              onChange={setManagerPage}
              isMobile={isMobile}
            />
          ) : null}
          {role === "teacher" && teacherHasHwAccess ? (
            <SandboxSectionNav
              items={TEACHER_NAV}
              value={teacherPage}
              onChange={setTeacherPage}
              isMobile={isMobile}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          {role === "admin" ? (
            <AdminHomeworkWorkbench
              tab={adminPage}
              onTabChange={setAdminPage}
              students={students}
              fees={fees}
              avail={avail}
              setAvail={setAvail}
              submitStatus={submitStatus}
              setSubmitStatus={setSubmitStatus}
              dutyDays={dutyDays}
              setDutyDays={setDutyDays}
              monthRosterStatus={monthRosterStatus}
              setMonthRosterStatus={setMonthRosterStatus}
              hwTeachers={hwTeachers}
            />
          ) : null}

          {role === "manager" ? (
            <ManagerHomeworkWorkbench
              tab={managerPage}
              onTabChange={setManagerPage}
              students={students}
              fees={fees}
              submitStatus={submitStatus}
              rosterPublishStatus={rosterPublishStatus}
              hwTeachers={hwTeachers}
              hwAccessIds={hwAccessIds}
              onToggleHwAccess={(id, next) => {
                setHwAccessIds((prev) => {
                  const copy = new Set(prev)
                  if (next) copy.add(id)
                  else copy.delete(id)
                  return copy
                })
              }}
              onSwitchToAdmin={() => setRole("admin")}
            />
          ) : null}

          {role === "teacher" ? (
            teacherHasHwAccess ? (
              <TeacherHomeworkWorkbench
                tab={teacherPage}
                onTabChange={setTeacherPage}
                teacherId={teacherId}
                avail={avail}
                setAvail={setAvail}
                submitStatus={submitStatus}
                setSubmitStatus={setSubmitStatus}
                rosterPublishStatus={rosterPublishStatus}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <p className="font-medium text-foreground">此專科老師沒有功課輔導入口</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  管理層未剔選時，系統側欄不會出現「功課輔導」。請切管理層 → 老師入口剔選後再睇。
                </p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
