import { useMemo, useState } from "react"
import { BookOpen, FlaskConical } from "lucide-react"

import { Select } from "@/components/ui/select"
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
  MOCK_TEACHERS,
  cloneAvailability,
  cloneSubmitStatus,
  summarizeOverview,
  type MockDutyDay,
  type MockStudent,
  type RosterPublishStatus,
  type SandboxRole,
  type SubmitStatus,
  type DutySlot,
} from "./mockData"
import { SummaryTile } from "./sharedUi"

const ROLE_OPTIONS: { value: SandboxRole; label: string }[] = [
  { value: "admin", label: "行政" },
  { value: "manager", label: "管理層" },
  { value: "teacher", label: "老師" },
]

/**
 * 功課輔導 UI 沙盒（全角色）。
 * 硬編碼假資料；不呼叫 services／Supabase；不掛正式側欄。
 */
export function HomeworkTutoringPrototypeView() {
  const [role, setRole] = useState<SandboxRole>("admin")
  const [teacherId, setTeacherId] = useState(MOCK_TEACHERS[0]!.id)
  const [students, setStudents] = useState<MockStudent[]>(() => [...MOCK_STUDENTS])
  const [fees] = useState(() => [...MOCK_FEES])
  const [avail, setAvail] = useState<Record<string, Record<string, DutySlot>>>(() =>
    cloneAvailability()
  )
  const [submitStatus, setSubmitStatus] = useState<Record<string, SubmitStatus>>(() =>
    cloneSubmitStatus()
  )
  const [dutyDays, setDutyDays] = useState<MockDutyDay[]>(() => [...MOCK_DUTY_DAYS])
  /** 十月編更發布狀態（老師報更鎖定） */
  const [rosterPublishStatus, setRosterPublishStatus] = useState<RosterPublishStatus>("草稿")

  const overview = useMemo(() => summarizeOverview(students, fees), [students, fees])
  const showDashboard = role === "admin" || role === "manager"

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <div className="rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-sm sm:px-4">
        <div className="flex items-start gap-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium text-foreground">功課輔導 UI 預覽（全角色・示範資料）</p>
            <p className="mt-1 text-muted-foreground">
              不連接真實資料庫。頂部可切換行政／管理層／老師視角。每日功課進度（影相＋打字）不進本系統，繼續用
              Notion。
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <header>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">功課輔導</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {MOCK_ACADEMIC_YEAR}學年｜{MOCK_MONTH_LABEL}
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
              className="w-36"
            >
              {MOCK_TEACHERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </div>

      {showDashboard ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label="在籍學生" value={String(overview.activeCount)} />
          <SummaryTile label="本月已繳" value={String(overview.paid)} />
          <SummaryTile label="本月未繳" value={String(overview.unpaid)} hint="不含暫停／結束" />
          <SummaryTile
            label="本月當值日"
            value={`${overview.dutyDays} 日`}
            hint="九月示範片段"
          />
        </div>
      ) : null}

      {role === "admin" ? (
        <AdminHomeworkWorkbench
          students={students}
          setStudents={setStudents}
          fees={fees}
          avail={avail}
          setAvail={setAvail}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatus}
          dutyDays={dutyDays}
          setDutyDays={setDutyDays}
          rosterPublishStatus={rosterPublishStatus}
          setRosterPublishStatus={setRosterPublishStatus}
        />
      ) : null}

      {role === "manager" ? (
        <ManagerHomeworkWorkbench
          students={students}
          fees={fees}
          submitStatus={submitStatus}
          rosterPublishStatus={rosterPublishStatus}
          onSwitchToAdmin={() => setRole("admin")}
        />
      ) : null}

      {role === "teacher" ? (
        <TeacherHomeworkWorkbench
          teacherId={teacherId}
          avail={avail}
          setAvail={setAvail}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatus}
          rosterPublishStatus={rosterPublishStatus}
        />
      ) : null}
    </div>
  )
}
