import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Calendar, Monitor, Users, Video } from "lucide-react"

import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 deleteSchedule,
 EMPTY_SCHEDULE_DETAIL_CONTEXT,
 fetchScheduleDetailContext,
 getScheduleById,
 type ScheduleDetailContext,
 type ScheduleDetailRecord,
 updateSchedule,
} from "@/services/classQueries"

function mentionsRecording(text: string): boolean {
 return /錄影|錄像|錄音/.test(text)
}

function isOnlineAttendanceStatus(status: string): boolean {
 return status.includes("網課") || status.includes("線上")
}

export function ScheduleDetailView() {
 const { scheduleId } = useParams<{ scheduleId: string }>()
 const navigate = useNavigate()
 const sid = scheduleId ?? ""
 const { confirmDialog } = useAppConfirm()
 const [row, setRow] = useState<ScheduleDetailRecord | null>(null)
 const [ctx, setCtx] = useState<ScheduleDetailContext | null>(null)
 const [loading, setLoading] = useState(true)
 const [remarksDraft, setRemarksDraft] = useState("")
 const [remarksSaving, setRemarksSaving] = useState(false)

 const load = useCallback(async () => {
  if (!sid) return
  setLoading(true)
  try {
   const s = await getScheduleById(sid)
   setRow(s)
   if (s) {
    setRemarksDraft(s.remarks ?? "")
    if (s.class_id) {
     const c = await fetchScheduleDetailContext(sid, s.class_id, s.scheduled_date)
     setCtx(c)
    } else {
     setCtx(EMPTY_SCHEDULE_DETAIL_CONTEXT)
    }
   } else {
    setCtx(null)
   }
  } finally {
   setLoading(false)
  }
 }, [sid])

 useEffect(() => {
  void load()
 }, [load])

 const safeCtx = ctx ?? EMPTY_SCHEDULE_DETAIL_CONTEXT

 const recordingLeaves = useMemo(() => {
  const fromLeaves = safeCtx.leaves.filter((l) => mentionsRecording(l.makeupType ?? ""))
  const fromMakeup = safeCtx.makeupsHere.filter((m) => mentionsRecording(m.makeupType ?? ""))
  return { fromLeaves, fromMakeup }
 }, [safeCtx])

 const onlineAttendanceLines = useMemo(() => {
  return safeCtx.attendance.filter((a) => isOnlineAttendanceStatus(a.status))
 }, [safeCtx])

 if (!sid) return <p className="p-6 text-muted-foreground">無效排程</p>

 if (!loading && !row) {
  return (
   <div className="p-6 md:p-8">
    <p className="text-base">找不到此排程。</p>
    <Button variant="outline" className="mt-4" asChild>
     <Link to="/Schedule">返回排程列表</Link>
    </Button>
   </div>
  )
 }

 return (
  <div className="min-h-full bg-background p-5 md:p-10">
   <Button
    type="button"
    variant="outline"
    size="sm"
    className="mb-8 transition-all hover:bg-muted active:scale-[0.98]"
    onClick={() => navigate(-1)}
   >
    <ArrowLeft className="h-4 w-4" />
    返回
   </Button>

   {loading || !row ? (
    <p className="text-base text-muted-foreground">載入中…</p>
   ) : (
    <div className="mx-auto max-w-5xl space-y-8">
     <div
      className={cn(
       "rounded-2xl border border-border bg-card p-8 shadow-md transition-shadow md:p-10 md:shadow-lg"
      )}
     >
      <div className="flex flex-wrap items-center gap-3 text-info">
       <Calendar className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
       <h1 className="text-3xl font-bold tracking-tight md:text-4xl">排程詳情</h1>
      </div>
      <p className="mt-5 text-2xl font-semibold leading-snug md:text-3xl">
       {row.scheduled_date}{" "}
       {row.start_time && row.end_time ? `${row.start_time}–${row.end_time}` : ""}
      </p>
      <div className="mt-3 text-base text-muted-foreground md:text-lg">
       {row.class_id ? (
        <>
         {row.class_subject}{" "}
         <span className="font-mono">{row.course_code ?? ""}</span>
        </>
       ) : (
        <span>無綁定班別（約房／其他）</span>
       )}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm md:text-base">
       <Tag tone={statusToTagTone(row.status)}>{row.status}</Tag>
       {row.class_id ? (
        <Link
         to={`/Classes/${row.class_id}`}
         className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 font-medium text-primary transition-colors hover:bg-primary/10"
        >
         班別詳情
        </Link>
       ) : null}
       {row.teacher_id ? (
        <Link
         to={`/Teachers/${row.teacher_id}`}
         className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 font-medium text-primary transition-colors hover:bg-primary/10"
        >
         老師：{row.teacher_name ?? "—"}
        </Link>
       ) : null}
       <Tag tone="default">
        課室：{row.classroom_name ?? "未分配"}
        {row.classroom_is_online ? "（線上）" : ""}
       </Tag>
      </div>
     </div>

     <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
       <Users className="h-5 w-5 text-teal-700" />
       學生名單
       <span className="text-sm font-normal text-muted-foreground">
        （共 {safeCtx.students.length} 人）
       </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
       含就讀中、試堂與當日請假／補堂／點名紀錄曾出現的學生。
      </p>
      {safeCtx.students.length === 0 ? (
       <p className="mt-4 text-sm text-muted-foreground">尚無學生資料。</p>
      ) : (
       <ul className="mt-4 flex flex-col gap-2">
        {safeCtx.students.map((s) => {
         const att = safeCtx.attendance.find((a) => a.studentId === s.studentId)
         return (
          <li key={s.studentId} className="flex flex-wrap items-center gap-2">
           <Link
            to={`/Students/${s.studentId}`}
            className="inline-flex max-w-full flex-1 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted/50"
           >
            <span className="font-medium">{s.fullName}</span>
            {s.englishName ? (
             <span className="truncate text-muted-foreground">({s.englishName})</span>
            ) : null}
            <Tag tone={statusToTagTone(s.source)} size="sm">
             {s.source}
            </Tag>
           </Link>
           <StudentWhatsAppReminderButton
            label="推送通知"
            contactPhone={s.contactPhone}
            payload={{
             studentName: s.fullName,
             subject: row.class_subject,
             courseCode: row.course_code,
             dateYmd: row.scheduled_date,
             startTime: row.start_time,
             endTime: row.end_time,
             classroomName: row.classroom_name,
             attendanceStatus: att?.status ?? null,
             isTrial: s.source === "試堂",
            }}
           />
          </li>
         )
        })}
       </ul>
      )}
     </section>

     <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
       <h2 className="text-lg font-semibold md:text-xl">請假紀錄</h2>
       <p className="mt-1 text-sm text-muted-foreground">
        與本排程連結，或同班同日之請假（含待連結排程）。
       </p>
       {safeCtx.leaves.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">尚無請假紀錄。</p>
       ) : (
        <ul className="mt-4 space-y-3">
         {safeCtx.leaves.map((l) => (
          <li
           key={l.id}
           className="rounded-xl border border-border bg-background/80 px-4 py-3 text-sm"
          >
           <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
             to={`/Students/${l.studentId}`}
             className="font-medium text-primary hover:underline"
            >
             {l.studentName}
            </Link>
            <Link
             to={`/LeaveManagement?${new URLSearchParams({ studentId: l.studentId, record: l.id }).toString()}`}
             className="shrink-0 text-xs font-medium text-warning hover:underline"
            >
             請假管理 →
            </Link>
           </div>
           <div className="mt-1 text-muted-foreground">
            {l.leaveReason ?? "—"} · 補課：{l.makeupType ?? "—"} · {l.status}
            {l.linkedToThisSchedule ? (
             <span className="ml-2 text-xs text-teal-700">（已連本排程）</span>
            ) : null}
           </div>
           {l.makeupScheduleId && l.makeupScheduleId !== sid ? (
            <div className="mt-2 text-xs">
             <span className="text-muted-foreground">補堂排程：</span>
             <Link
              to={`/Schedule/${l.makeupScheduleId}`}
              className="font-medium text-primary underline-offset-2 hover:underline"
             >
              開啟該堂
             </Link>
            </div>
           ) : null}
          </li>
         ))}
        </ul>
       )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
       <h2 className="text-lg font-semibold md:text-xl">補堂（來此堂補課）</h2>
       <p className="mt-1 text-sm text-muted-foreground">
        請假紀錄中，補堂排程指向本排程的學生。
       </p>
       {safeCtx.makeupsHere.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">尚無學生安排於此堂補課。</p>
       ) : (
        <ul className="mt-4 space-y-3">
         {safeCtx.makeupsHere.map((m) => (
          <li
           key={m.leaveId}
           className="rounded-xl border border-info/80 bg-info/50 px-4 py-3 text-sm"
          >
           <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link
             to={`/Students/${m.studentId}`}
             className="font-medium text-primary hover:underline"
            >
             {m.studentName}
            </Link>
            <Link
             to={`/LeaveManagement?${new URLSearchParams({ studentId: m.studentId, record: m.leaveId }).toString()}`}
             className="text-xs text-muted-foreground hover:text-primary"
            >
             請假紀錄 →
            </Link>
           </div>
           <div className="mt-1 text-muted-foreground">
            原請假日 {m.leaveDate} · {m.makeupType ?? "—"} · {m.status}
           </div>
          </li>
         ))}
        </ul>
       )}
      </section>
     </div>

     <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
       <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
        <Video className="h-5 w-5 text-rose-700" />
        錄影
       </div>
       <p className="mt-1 text-sm text-muted-foreground">
        補課方式為「錄影」之請假，或排程備註標示需錄影。
       </p>
       {mentionsRecording(row.remarks ?? "") ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50/80 px-3 py-2 text-sm text-rose-900">
         排程備註含錄影相關說明。
        </p>
       ) : null}
       {recordingLeaves.fromLeaves.length === 0 && recordingLeaves.fromMakeup.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">目前無錄影補課項目。</p>
       ) : (
        <ul className="mt-4 space-y-2 text-sm">
         {recordingLeaves.fromLeaves.map((l) => (
          <li key={`lv-${l.id}`} className="rounded-lg border border-border px-3 py-2">
           <span className="font-medium">{l.studentName}</span>
           <span className="text-muted-foreground">
            {" "}
            · {l.leaveReason ?? "—"} · {l.status}
           </span>
          </li>
         ))}
         {recordingLeaves.fromMakeup.map((m) => (
          <li key={`mk-${m.leaveId}`} className="rounded-lg border border-border px-3 py-2">
           <span className="font-medium">{m.studentName}</span>
           <span className="text-muted-foreground">
            {" "}
            · 原請假 {m.leaveDate} · {m.status}
           </span>
          </li>
         ))}
        </ul>
       )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
       <div className="flex items-center gap-2 text-lg font-semibold md:text-xl">
        <Monitor className="h-5 w-5 text-info" />
        網課
       </div>
       <p className="mt-1 text-sm text-muted-foreground">
        線上課室名稱（來自已指派之線上課室），以及點名為「網課／線上」之紀錄與備註。
       </p>
       {row.classroom_is_online && row.classroom_name ? (
        <div className="mt-4 rounded-xl border border-info bg-info/70 px-4 py-3">
         <div className="text-xs font-medium uppercase tracking-wide text-info/90">
          線上課室／平台名稱
         </div>
         <div className="mt-1 text-lg font-semibold text-info">{row.classroom_name}</div>
        </div>
       ) : (
        <p className="mt-4 text-sm text-muted-foreground">
         本排程未使用標記為「線上」的課室；若為實體課，網課名稱可能僅出現在點名備註。
        </p>
       )}
       {onlineAttendanceLines.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">無「網課／線上」點名紀錄。</p>
       ) : (
        <ul className="mt-3 space-y-2 text-sm">
         {onlineAttendanceLines.map((a) => (
          <li key={a.studentId} className="rounded-lg border border-info bg-info/40 px-3 py-2">
           <span className="font-medium">{a.studentName}</span>
           <span className="text-muted-foreground"> · {a.status}</span>
           {a.remarks ? (
            <div className="mt-1 text-xs text-info/90">備註：{a.remarks}</div>
           ) : null}
          </li>
         ))}
        </ul>
       )}
      </section>
     </div>

     <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold md:text-xl">當日出勤（點名）</h2>
      <p className="mt-1 text-sm text-muted-foreground">
       {row.scheduled_date} 本班已存檔之出勤列；可對照學生名單。
      </p>
      {safeCtx.attendance.length === 0 ? (
       <p className="mt-4 text-sm text-muted-foreground">尚無點名資料。</p>
      ) : (
       <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[28rem] table-fixed border-collapse text-left text-sm">
         <thead className="bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
          <tr>
           <th className="w-[34%] px-4 py-2">學生</th>
           <th className="w-[26%] px-4 py-2">狀態</th>
           <th className="w-[40%] px-4 py-2">備註</th>
          </tr>
         </thead>
         <tbody>
          {safeCtx.attendance.map((a) => (
           <tr key={a.studentId} className="border-t border-border">
            <td className="px-4 py-2">
             <Link to={`/Students/${a.studentId}`} className="font-medium text-primary hover:underline">
              {a.studentName}
             </Link>
            </td>
            <td className="px-4 py-2">{a.status}</td>
            <td className="px-4 py-2 text-muted-foreground">{a.remarks ?? "—"}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
     </section>

     <section className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold md:text-xl">排程備註</h2>
      <p className="mt-1 text-sm text-muted-foreground">
       可記錄課堂注意事項、錄影需求、連結等；儲存後寫入資料庫。
      </p>
      <Textarea
       className="mt-4 min-h-[140px] text-base"
       value={remarksDraft}
       onChange={(e) => setRemarksDraft(e.target.value)}
       placeholder="輸入備註…"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
       <Button
        type="button"
        disabled={remarksSaving || remarksDraft === (row.remarks ?? "")}
        onClick={async () => {
         setRemarksSaving(true)
         try {
          await updateSchedule(row.id, { remarks: remarksDraft.trim() || null })
          await load()
         } finally {
          setRemarksSaving(false)
         }
        }}
       >
        {remarksSaving ? "儲存中…" : "儲存備註"}
       </Button>
       {remarksDraft !== (row.remarks ?? "") ? (
        <span className="text-xs text-amber-700">有未儲存變更</span>
       ) : null}
      </div>
     </section>

     <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 p-6 md:p-8">
      <label className="flex items-center gap-2 text-sm font-medium md:text-base">
       <span className="text-muted-foreground">變更狀態</span>
       <Select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-primary/50 md:text-base"
        value={row.status}
        onChange={async (e) => {
         await updateSchedule(row.id, { status: e.target.value })
         await load()
        }}
       >
        <option value="預定">預定</option>
        <option value="完成">完成</option>
        <option value="取消">取消</option>
       </Select>
      </label>
      <Button
       type="button"
       variant="destructive"
       className="ml-auto"
       onClick={async () => {
       if (!(await confirmDialog({ title: "刪除排程", description: "確定刪除此排程？", confirmText: "確認刪除", tone: "destructive" }))) return
        await deleteSchedule(row.id)
        navigate(row.class_id ? `/Classes/${row.class_id}` : "/Schedule")
       }}
      >
       刪除排程
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}
