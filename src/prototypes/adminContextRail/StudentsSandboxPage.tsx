import { useMemo, useState } from "react"
import { GraduationCap, Pin, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import { enrollmentLabels, SANDBOX_STUDENTS, type SandboxStudent } from "./mockData"

type Props = {
  pinnedId: string | null
  onPin: (student: SandboxStudent) => void
}

export function StudentsSandboxPage({ pinnedId, onPin }: Props) {
  const [search, setSearch] = useState("")
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return SANDBOX_STUDENTS
    return SANDBOX_STUDENTS.filter((s) =>
      [s.fullName, s.englishName, s.studentCode, s.studentPhone, s.parentPhone, s.school]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [search])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <GraduationCap className="h-7 w-7 shrink-0 text-primary" aria-hidden />
          學生管理
        </h1>
        <Tag tone="info">{rows.length} 人</Tag>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜尋姓名 / 學號 / 學生電話 / 家長電話…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                {["學號", "姓名", "年級", "學生電話", "家長電話", "報讀班別", "狀態", "動作"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const pinned = pinnedId === s.id
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      pinned ? "bg-primary/5" : "hover:bg-muted/70"
                    )}
                  >
                    <td className="px-3 py-3 font-mono tabular-nums text-muted-foreground">{s.studentCode}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.englishName}</div>
                    </td>
                    <td className="px-3 py-3">{s.grade}</td>
                    <td className="px-3 py-3 tabular-nums">{s.studentPhone}</td>
                    <td className="px-3 py-3 tabular-nums">{s.parentPhone}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {enrollmentLabels(s).join("、") || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Tag tone={statusToTagTone(s.registrationStatus)} size="sm">
                          {s.registrationStatus === "非註冊" ? "非註冊" : "註冊"}
                        </Tag>
                        <Tag tone={statusToTagTone(s.enrollmentStatus)} size="sm">
                          {s.enrollmentStatus}
                        </Tag>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={pinned ? "secondary" : "outline"}
                        onClick={() => onPin(s)}
                      >
                        <Pin className="h-3.5 w-3.5" aria-hidden />
                        {pinned ? "已固定" : "固定"}
                      </Button>
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
