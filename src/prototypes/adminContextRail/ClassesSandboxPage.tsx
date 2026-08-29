import { BookOpen } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import { SANDBOX_CLASSES, SANDBOX_STUDENTS, type SandboxStudent } from "./mockData"

type Props = {
  pinnedStudent: SandboxStudent | null
}

export function ClassesSandboxPage({ pinnedStudent }: Props) {
  const stats = {
    total: SANDBOX_CLASSES.length,
    inProg: SANDBOX_CLASSES.filter((c) => c.status === "進行中").length,
  }
  const pinnedClassIds = new Set(pinnedStudent?.classIds ?? [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <BookOpen className="h-7 w-7 shrink-0 text-primary" aria-hidden />
          班別管理
          <Tag tone="info" size="sm">
            {stats.total} 班
          </Tag>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.total} label="班級總數" />
        <StatCard value={stats.inProg} label="進行中" emphasize="success" />
        <StatCard value={SANDBOX_CLASSES.length} label="篩選結果" emphasize="info" />
      </div>

      {pinnedStudent ? (
        <p className="text-sm text-muted-foreground">
          已固定 {pinnedStudent.fullName}：其報讀班別會在列表高亮，方便對照右欄。
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                {["課程編號", "年級", "課程名稱", "上課時間", "老師", "學生人數", "學生名單", "狀態"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SANDBOX_CLASSES.map((c) => {
                const names = c.studentIds
                  .map((id) => SANDBOX_STUDENTS.find((s) => s.id === id)?.fullName)
                  .filter(Boolean)
                const related = pinnedClassIds.has(c.id)
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      related ? "bg-primary/5" : "hover:bg-muted/70"
                    )}
                  >
                    <td className="px-3 py-3 font-mono text-xs tabular-nums text-muted-foreground">{c.courseCode}</td>
                    <td className="px-3 py-3">{c.grade}</td>
                    <td className="px-3 py-3 font-medium">
                      {c.courseName}
                      <div className="text-xs font-normal text-muted-foreground">{c.room}</div>
                    </td>
                    <td className="px-3 py-3">{c.time}</td>
                    <td className="px-3 py-3">{c.teacher}</td>
                    <td className="px-3 py-3 tabular-nums">{c.studentIds.length}</td>
                    <td className="px-3 py-3 text-muted-foreground">{names.join("、") || "—"}</td>
                    <td className="px-3 py-3">
                      <Tag tone={statusToTagTone(c.status)} size="sm">
                        {c.status}
                      </Tag>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  value,
  label,
  emphasize,
}: {
  value: number
  label: string
  emphasize?: "success" | "info"
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div
        className={cn(
          "text-2xl font-bold",
          emphasize === "success" && "text-success",
          emphasize === "info" && "text-info"
        )}
      >
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}
