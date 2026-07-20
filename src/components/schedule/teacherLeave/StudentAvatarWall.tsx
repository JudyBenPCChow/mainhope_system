import { UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

import type { TeacherLeaveStudent, TeacherLeaveStudentKind } from "@/services/teacherLeaveWizardQueries"

import { InitialAvatar } from "./visualBits"

function studentDetail(student: TeacherLeaveStudent): string {
  if (student.kind === "leave") {
    return `${student.leaveReason ?? "請假"}／${student.leaveMakeup ?? "—"}`
  }
  if (student.kind === "makeup") {
    return student.makeupFromHint ?? "來補堂"
  }
  return "應到課"
}

function toneForKind(kind: TeacherLeaveStudentKind): "neutral" | "warning" | "info" | "success" {
  if (kind === "expected") return "warning"
  if (kind === "leave") return "neutral"
  return "info"
}

function StudentAvatar({ student }: { student: TeacherLeaveStudent }) {
  return (
    <div className="flex flex-col items-center gap-1" title={studentDetail(student)}>
      <InitialAvatar name={student.fullName} size="md" tone={toneForKind(student.kind)} />
      <span className="max-w-[4.5rem] truncate text-center text-[11px] font-medium leading-tight">
        {student.fullName}
      </span>
    </div>
  )
}

function Column({
  title,
  count,
  accent,
  students,
}: {
  title: string
  count: number
  accent: "warning" | "default" | "info"
  students: TeacherLeaveStudent[]
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border p-3",
        accent === "warning" && "border-warning/30 bg-warning/5",
        accent === "default" && "border-border bg-muted/20",
        accent === "info" && "border-info/30 bg-info/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              accent === "warning" && "bg-warning",
              accent === "default" && "bg-neutral-400",
              accent === "info" && "bg-info"
            )}
          />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
            accent === "warning" && "bg-warning/20 text-warning",
            accent === "default" && "bg-neutral-200 text-neutral-700",
            accent === "info" && "bg-info/20 text-info"
          )}
        >
          {count}
        </span>
      </div>
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 py-4 text-muted-foreground">
          <UserRound className="h-6 w-6 opacity-40" aria-hidden />
          <span className="text-xs">無</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {students.map((st) => (
            <StudentAvatar key={st.studentId} student={st} />
          ))}
        </div>
      )}
    </div>
  )
}

export function StudentAvatarWall({
  expected,
  leave,
  makeup,
}: {
  expected: TeacherLeaveStudent[]
  leave: TeacherLeaveStudent[]
  makeup: TeacherLeaveStudent[]
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Column title="應到課" count={expected.length} accent="warning" students={expected} />
      <Column title="已請假" count={leave.length} accent="default" students={leave} />
      <Column title="來補堂" count={makeup.length} accent="info" students={makeup} />
    </div>
  )
}
