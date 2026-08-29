import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"

import type { DrilldownFocus, MgmtDashboardPayload, NearFullClassRow } from "@/components/mgmtDashboard/types"
import { isLoadOk } from "@/components/mgmtDashboard/types"
import { MgmtGroupLoadError } from "@/components/mgmtDashboard/MgmtGroupLoadError"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

type Props = {
 data: MgmtDashboardPayload
 focus: DrilldownFocus
}

type SortDir = "asc" | "desc"

function useSortable<T>(rows: T[], key: keyof T | null, dir: SortDir) {
 return useMemo(() => {
  if (!key) return rows
  const sorted = [...rows]
  sorted.sort((a, b) => {
   const av = a[key]
   const bv = b[key]
   if (typeof av === "number" && typeof bv === "number") {
    return dir === "asc" ? av - bv : bv - av
   }
   return dir === "asc"
    ? String(av ?? "").localeCompare(String(bv ?? ""), "zh-Hant")
    : String(bv ?? "").localeCompare(String(av ?? ""), "zh-Hant")
  })
  return sorted
 }, [rows, key, dir])
}

function SortHeader({
 label,
 active,
 dir,
 align = "left",
 onClick,
 className,
}: {
 label: string
 active: boolean
 dir: SortDir
 align?: "left" | "right"
 onClick: () => void
 className?: string
}) {
 return (
  <th className={cn("px-2 py-2 font-medium", className)}>
   <button
    type="button"
    onClick={onClick}
    className={cn(
     "inline-flex w-full items-center gap-1 text-muted-foreground hover:text-foreground",
     align === "right" && "justify-end"
    )}
   >
    {label}
    {active ? <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span> : null}
   </button>
  </th>
 )
}

function defaultTab(focus: DrilldownFocus): string {
 if (!focus) return "unpaid"
 if (focus.type === "alert") {
  if (focus.category === "withdraw") return "withdraw"
  if (focus.category === "nearFull") return "nearFull"
  if (focus.category === "teacherLoad") return "teachers"
  if (focus.category === "lowAttendance") return "classes"
  return "unpaid"
 }
 if (focus.type === "analysis") {
  if (focus.panel === "withdrawal") return "withdraw"
  if (focus.panel === "unpaid") return "unpaid"
  if (focus.panel === "funnel") return "subjects"
  return "unpaid"
 }
 if (focus.type === "kpi") {
  if (focus.kpiId === "withdraw") return "withdraw"
  if (focus.kpiId === "pendingPay" || focus.kpiId === "receivable") return "unpaid"
  if (focus.kpiId === "teacherLoad") return "teachers"
  if (focus.kpiId === "enrollmentSeats" || focus.kpiId === "enrolled") return "classes"
  if (focus.kpiId === "attendanceVisits") return "classes"
  if (focus.kpiId === "enroll" || focus.kpiId === "conversion") return "subjects"
  return "unpaid"
 }
 return "unpaid"
}

export function MgmtDetailTablesSection({ data, focus }: Props) {
 const [query, setQuery] = useState("")
 const [tab, setTab] = useState(() => defaultTab(focus))
 const [sortKey, setSortKey] = useState<string | null>(null)
 const [sortDir, setSortDir] = useState<SortDir>("desc")

 // 當 drill-down 焦點改變時切換分頁
 useEffect(() => {
  setTab(defaultTab(focus))
 }, [focus])

 const q = query.trim().toLowerCase()

 const unpaidRows = useMemo(() => {
  if (!isLoadOk(data.unpaidOverdue)) return []
  const rows = data.unpaidOverdue.ok.filter(
   (r) =>
    !q ||
    r.studentName.toLowerCase().includes(q) ||
    r.status.toLowerCase().includes(q) ||
    r.followUpStatus.toLowerCase().includes(q)
  )
  return rows
 }, [data.unpaidOverdue, q])

 const withdrawRows = useMemo(() => {
  if (!isLoadOk(data.alerts.recentWithdrawals)) return []
  return data.alerts.recentWithdrawals.ok.filter(
   (r) =>
    !q ||
    r.studentName.toLowerCase().includes(q) ||
    r.classLabel.toLowerCase().includes(q)
  )
 }, [data.alerts.recentWithdrawals, q])

 const classRows = useMemo(() => {
  return data.distribution.classFill.filter(
   (r) => !q || r.label.toLowerCase().includes(q)
  )
 }, [data.distribution.classFill, q])

 const teacherRows = useMemo(() => {
  return data.distribution.byTeacher.filter(
   (r) => !q || r.name.toLowerCase().includes(q)
  )
 }, [data.distribution.byTeacher, q])

 const subjectRows = useMemo(() => {
  return data.distribution.bySubject.filter(
   (r) => !q || r.label.toLowerCase().includes(q)
  )
 }, [data.distribution.bySubject, q])

 const lessonRows = useMemo(() => {
  if (!isLoadOk(data.alerts.lessonGaps)) return []
  return data.alerts.lessonGaps.ok.filter(
   (r) =>
    !q ||
    r.studentName.toLowerCase().includes(q) ||
    r.classLabel.toLowerCase().includes(q)
  )
 }, [data.alerts.lessonGaps, q])

 const toggleSort = (key: string) => {
  if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
  else {
   setSortKey(key)
   setSortDir("desc")
  }
 }

 const sortedUnpaid = useSortable(
  unpaidRows,
  (sortKey as keyof (typeof unpaidRows)[number] | null) ?? null,
  sortDir
 )
 const sortedWithdraw = useSortable(
  withdrawRows,
  (sortKey as keyof (typeof withdrawRows)[number] | null) ?? null,
  sortDir
 )
 const sortedClasses = useSortable(
  classRows,
  (sortKey as keyof (typeof classRows)[number] | null) ?? null,
  sortDir
 )
 const sortedTeachers = useSortable(
  teacherRows,
  (sortKey as keyof (typeof teacherRows)[number] | null) ?? null,
  sortDir
 )
 const sortedSubjects = useSortable(
  subjectRows,
  (sortKey as keyof (typeof subjectRows)[number] | null) ?? null,
  sortDir
 )

 return (
  <section className="space-y-3">
   <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
     <h2 className="text-lg font-semibold tracking-tight">明細與跟進清單</h2>
     <p className="mt-1 text-sm text-muted-foreground">
      支援搜尋、排序；狀態以標籤顯示，金額右對齊
     </p>
    </div>
    <div className="relative w-full max-w-xs">
     <Search
      className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden
     />
     <Input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="搜尋學生、班別、狀態…"
      className="pl-8"
     />
    </div>
   </div>

   <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <Tabs value={tab} onValueChange={setTab}>
     <TabsList className="flex h-auto flex-wrap gap-1">
      <TabsTrigger value="unpaid">
       欠費學生（{isLoadOk(data.unpaidOverdue) ? unpaidRows.length : "—"}）
      </TabsTrigger>
      <TabsTrigger value="withdraw">
       近區間退讀（{isLoadOk(data.alerts.recentWithdrawals) ? withdrawRows.length : "—"}）
      </TabsTrigger>
      <TabsTrigger value="nearFull">
       滿班班別（{isLoadOk(data.alerts.nearFullClasses) ? data.alerts.nearFullClasses.ok.length : "—"}）
      </TabsTrigger>
      <TabsTrigger value="classes">班別健康度（{classRows.length}）</TabsTrigger>
      <TabsTrigger value="teachers">導師負荷（{teacherRows.length}）</TabsTrigger>
      <TabsTrigger value="subjects">科目報讀（{subjectRows.length}）</TabsTrigger>
      <TabsTrigger value="lessons">
       堂數異常（{isLoadOk(data.alerts.lessonGaps) ? lessonRows.length : "—"}）
      </TabsTrigger>
     </TabsList>

     <TabsContent value="unpaid" className="mt-4">
      {!isLoadOk(data.unpaidOverdue) ? (
       <MgmtGroupLoadError />
      ) : (
      <>
      <div className="mb-2 text-right text-sm">
       <Link to="/PaymentHistory" className="text-primary underline-offset-2 hover:underline">
        前往繳費紀錄
       </Link>
      </div>
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left">
          <SortHeader
           label="學生"
           className="w-[26%]"
           active={sortKey === "studentName"}
           dir={sortDir}
           onClick={() => toggleSort("studentName")}
          />
          <SortHeader
           label="日期"
           className="w-[16%]"
           active={sortKey === "paymentDate"}
           dir={sortDir}
           onClick={() => toggleSort("paymentDate")}
          />
          <SortHeader
           label="金額"
           className="w-[16%]"
           align="right"
           active={sortKey === "amount"}
           dir={sortDir}
           onClick={() => toggleSort("amount")}
          />
          <SortHeader
           label="逾期天數"
           className="w-[14%]"
           align="right"
           active={sortKey === "overdueDays"}
           dir={sortDir}
           onClick={() => toggleSort("overdueDays")}
          />
          <th className="w-[14%] px-2 py-2 font-medium text-muted-foreground">狀態</th>
          <th className="w-[14%] px-2 py-2 font-medium text-muted-foreground">跟進</th>
         </tr>
        </thead>
        {sortedUnpaid.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
            無符合條件的欠費資料
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {sortedUnpaid.map((row, i) => (
           <StaggerItem
            key={row.id}
            as="tr"
            className={cn(
             "border-b border-border/60 hover:bg-muted/40",
             i % 2 === 1 && "bg-muted/20"
            )}
           >
            <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
            <td className="px-2 py-2 tabular-nums">{row.paymentDate || "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums">
             {row.amount.toLocaleString("en-HK")}
            </td>
            <td className="px-2 py-2 text-right tabular-nums">{row.overdueDays}</td>
            <td className="px-2 py-2">
             <Tag tone={statusToTagTone(row.status)} size="sm">
              {row.status}
             </Tag>
            </td>
            <td className="px-2 py-2">
             <Tag tone={statusToTagTone(row.followUpStatus)} size="sm">
              {row.followUpStatus}
             </Tag>
            </td>
           </StaggerItem>
          ))}
         </StaggerList>
        )}
       </table>
      </div>
      </>
      )}
     </TabsContent>

     <TabsContent value="withdraw" className="mt-4">
      {!isLoadOk(data.alerts.recentWithdrawals) ? (
       <MgmtGroupLoadError />
      ) : (
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left">
          <SortHeader
           label="學生"
           className="w-[34%]"
           active={sortKey === "studentName"}
           dir={sortDir}
           onClick={() => toggleSort("studentName")}
          />
          <SortHeader
           label="班別"
           className="w-[40%]"
           active={sortKey === "classLabel"}
           dir={sortDir}
           onClick={() => toggleSort("classLabel")}
          />
          <SortHeader
           label="退讀日"
           className="w-[26%]"
           active={sortKey === "effectiveDate"}
           dir={sortDir}
           onClick={() => toggleSort("effectiveDate")}
          />
         </tr>
        </thead>
        {sortedWithdraw.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={3} className="px-2 py-8 text-center text-muted-foreground">
            篩選區間內無退讀名單
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {sortedWithdraw.map((row, i) => (
           <StaggerItem
            key={row.id}
            as="tr"
            className={cn(
             "border-b border-border/60 hover:bg-muted/40",
             i % 2 === 1 && "bg-muted/20"
            )}
           >
            <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
            <td className="min-w-0 truncate px-2 py-2" title={row.classLabel}>
             {row.classLabel}
            </td>
            <td className="px-2 py-2 tabular-nums">{row.effectiveDate}</td>
           </StaggerItem>
          ))}
         </StaggerList>
        )}
       </table>
      </div>
      )}
     </TabsContent>

     <TabsContent value="nearFull" className="mt-4">
      {isLoadOk(data.alerts.nearFullClasses) ? (
       <NearFullTable rows={data.alerts.nearFullClasses.ok} query={q} />
      ) : (
       <MgmtGroupLoadError />
      )}
     </TabsContent>

     <TabsContent value="classes" className="mt-4">
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left">
          <SortHeader
           label="班別"
           className="w-[40%]"
           active={sortKey === "label"}
           dir={sortDir}
           onClick={() => toggleSort("label")}
          />
          <SortHeader
           label="就讀"
           className="w-[15%]"
           align="right"
           active={sortKey === "enrolled"}
           dir={sortDir}
           onClick={() => toggleSort("enrolled")}
          />
          <th className="w-[15%] px-2 py-2 text-right font-medium text-muted-foreground">
           名額
          </th>
          <SortHeader
           label="滿班率"
           className="w-[15%]"
           align="right"
           active={sortKey === "fillPct"}
           dir={sortDir}
           onClick={() => toggleSort("fillPct")}
          />
          <th className="w-[15%] px-2 py-2 font-medium text-muted-foreground">操作</th>
         </tr>
        </thead>
        {sortedClasses.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
            暫無班別資料
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {sortedClasses.slice(0, 30).map((row, i) => (
           <StaggerItem
            key={row.classId}
            as="tr"
            className={cn(
             "border-b border-border/60 hover:bg-muted/40",
             i % 2 === 1 && "bg-muted/20"
            )}
           >
            <td className="min-w-0 truncate px-2 py-2" title={row.label}>
             {row.label}
            </td>
            <td className="px-2 py-2 text-right tabular-nums">{row.enrolled}</td>
            <td className="px-2 py-2 text-right tabular-nums">{row.capacity ?? "—"}</td>
            <td className="px-2 py-2 text-right tabular-nums">
             {row.fillPct != null ? `${row.fillPct}%` : "—"}
            </td>
            <td className="px-2 py-2">
             <Link
              to={`/Classes/${row.classId}`}
              className="text-primary underline-offset-2 hover:underline"
             >
              班別詳情
             </Link>
            </td>
           </StaggerItem>
          ))}
         </StaggerList>
        )}
       </table>
      </div>
     </TabsContent>

     <TabsContent value="teachers" className="mt-4">
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left">
          <SortHeader
           label="導師"
           className="w-[50%]"
           active={sortKey === "name"}
           dir={sortDir}
           onClick={() => toggleSort("name")}
          />
          <SortHeader
           label="報讀人次"
           className="w-[30%]"
           align="right"
           active={sortKey === "enrollmentCount"}
           dir={sortDir}
           onClick={() => toggleSort("enrollmentCount")}
          />
          <th className="w-[20%] px-2 py-2 font-medium text-muted-foreground">狀態</th>
         </tr>
        </thead>
        {sortedTeachers.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={3} className="px-2 py-8 text-center text-muted-foreground">
            暫無導師負荷資料
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {sortedTeachers.map((row, i) => {
           const overloaded = row.enrollmentCount > 39
           return (
            <StaggerItem
             key={row.teacherId}
             as="tr"
             className={cn(
              "border-b border-border/60 hover:bg-muted/40",
              i % 2 === 1 && "bg-muted/20"
             )}
            >
             <td className="min-w-0 truncate px-2 py-2">{row.name}</td>
             <td className="px-2 py-2 text-right tabular-nums">{row.enrollmentCount}</td>
             <td className="px-2 py-2">
              <Tag tone={statusToTagTone(overloaded ? "注意" : "正常")} size="sm">
               {overloaded ? "注意" : "正常"}
              </Tag>
             </td>
            </StaggerItem>
           )
          })}
         </StaggerList>
        )}
       </table>
      </div>
     </TabsContent>

     <TabsContent value="subjects" className="mt-4">
      <div className="mb-2 text-right text-sm">
       <Link
        to="/EnrollmentReports"
        className="text-primary underline-offset-2 hover:underline"
       >
        前往人數報表
       </Link>
      </div>
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left">
          <SortHeader
           label="科目"
           className="w-[60%]"
           active={sortKey === "label"}
           dir={sortDir}
           onClick={() => toggleSort("label")}
          />
          <SortHeader
           label="報讀人數"
           className="w-[40%]"
           align="right"
           active={sortKey === "count"}
           dir={sortDir}
           onClick={() => toggleSort("count")}
          />
         </tr>
        </thead>
        {sortedSubjects.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={2} className="px-2 py-8 text-center text-muted-foreground">
            暫無科目報讀資料
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {sortedSubjects.map((row, i) => (
           <StaggerItem
            key={row.label}
            as="tr"
            className={cn(
             "border-b border-border/60 hover:bg-muted/40",
             i % 2 === 1 && "bg-muted/20"
            )}
           >
            <td className="px-2 py-2">{row.label}</td>
            <td className="px-2 py-2 text-right tabular-nums">{row.count}</td>
           </StaggerItem>
          ))}
         </StaggerList>
        )}
       </table>
      </div>
     </TabsContent>

     <TabsContent value="lessons" className="mt-4">
      {!isLoadOk(data.alerts.lessonGaps) ? (
       <MgmtGroupLoadError />
      ) : (
      <>
      <div className="mb-2 text-right text-sm">
       <Link
        to="/LessonBalanceMismatch"
        className="text-primary underline-offset-2 hover:underline"
       >
        前往堂數對帳
       </Link>
      </div>
      <div className="overflow-x-auto">
       <table className="w-full table-fixed text-sm">
        <thead>
         <tr className="border-b border-border text-left text-muted-foreground">
          <th className="w-[22%] px-2 py-2 font-medium">學生</th>
          <th className="w-[30%] px-2 py-2 font-medium">班別</th>
          <th className="w-[12%] px-2 py-2 text-right font-medium">已繳</th>
          <th className="w-[12%] px-2 py-2 text-right font-medium">已綁</th>
          <th className="w-[12%] px-2 py-2 text-right font-medium">差額</th>
          <th className="w-[12%] px-2 py-2 font-medium">操作</th>
         </tr>
        </thead>
        {lessonRows.length === 0 ? (
         <tbody>
          <tr>
           <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
            目前無堂數待跟進
           </td>
          </tr>
         </tbody>
        ) : (
         <StaggerList as="tbody">
          {lessonRows.map((row, i) => (
           <StaggerItem
            key={row.enrollmentId}
            as="tr"
            className={cn(
             "border-b border-border/60 hover:bg-muted/40",
             i % 2 === 1 && "bg-muted/20"
            )}
           >
            <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
            <td className="min-w-0 truncate px-2 py-2" title={row.classLabel}>
             {row.classLabel}
            </td>
            <td className="px-2 py-2 text-right tabular-nums">{row.paidLessons}</td>
            <td className="px-2 py-2 text-right tabular-nums">{row.boundLessons}</td>
            <td className="px-2 py-2 text-right tabular-nums">{row.gap}</td>
            <td className="px-2 py-2">
             <Link
              to={`/Students/${row.studentId}`}
              className="text-primary underline-offset-2 hover:underline"
             >
              學生
             </Link>
            </td>
           </StaggerItem>
          ))}
         </StaggerList>
        )}
       </table>
      </div>
      </>
      )}
     </TabsContent>
    </Tabs>
   </div>
  </section>
 )
}

function NearFullTable({
 rows,
 query,
}: {
 rows: NearFullClassRow[]
 query: string
}) {
 const filtered = rows.filter((r) => !query || r.label.toLowerCase().includes(query))
 return (
  <div className="overflow-x-auto">
   <table className="w-full table-fixed text-sm">
    <thead>
     <tr className="border-b border-border text-left text-muted-foreground">
      <th className="w-[40%] px-2 py-2 font-medium">班別</th>
      <th className="w-[15%] px-2 py-2 text-right font-medium">就讀</th>
      <th className="w-[15%] px-2 py-2 text-right font-medium">名額</th>
      <th className="w-[15%] px-2 py-2 text-right font-medium">滿班率</th>
      <th className="w-[15%] px-2 py-2 font-medium">操作</th>
     </tr>
    </thead>
     {filtered.length === 0 ? (
      <tbody>
       <tr>
        <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
         目前無將近滿班班別（≥90%）
        </td>
       </tr>
      </tbody>
     ) : (
      <StaggerList as="tbody">
       {filtered.map((row, i) => (
        <StaggerItem
         key={row.classId}
         as="tr"
         className={cn(
          "border-b border-border/60 hover:bg-muted/40",
          i % 2 === 1 && "bg-muted/20"
         )}
        >
         <td className="min-w-0 truncate px-2 py-2" title={row.label}>
          {row.label}
         </td>
         <td className="px-2 py-2 text-right tabular-nums">{row.enrolled}</td>
         <td className="px-2 py-2 text-right tabular-nums">{row.capacity}</td>
         <td className="px-2 py-2 text-right tabular-nums">{row.fillPct}%</td>
         <td className="px-2 py-2">
          <Link
           to={`/Classes/${row.classId}`}
           className="text-primary underline-offset-2 hover:underline"
          >
           班別詳情
          </Link>
         </td>
        </StaggerItem>
       ))}
      </StaggerList>
     )}
   </table>
  </div>
 )
}
