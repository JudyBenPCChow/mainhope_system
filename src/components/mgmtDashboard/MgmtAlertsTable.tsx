import { Link } from "react-router-dom"

import type { MgmtDashboardPayload } from "@/components/mgmtDashboard/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"

type Props = {
 alerts: MgmtDashboardPayload["alerts"]
}

export function MgmtAlertsTable({ alerts }: Props) {
 return (
  <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
   <div className="flex flex-wrap items-start justify-between gap-2">
    <div>
     <h2 className="text-base font-semibold">預警與跟進</h2>
     <p className="mt-1 text-sm text-muted-foreground">只讀清單；點擊前往既有作業頁處理</p>
    </div>
   </div>

   <Tabs defaultValue="unpaid" className="mt-4">
    <TabsList>
     <TabsTrigger value="unpaid">待繳費（{alerts.unpaid.length}）</TabsTrigger>
     <TabsTrigger value="lessons">堂數異常（{alerts.lessonGaps.length}）</TabsTrigger>
     <TabsTrigger value="full">將近滿班（{alerts.nearFullClasses.length}）</TabsTrigger>
    </TabsList>

    <TabsContent value="unpaid" className="mt-4">
     <div className="mb-2 text-right text-sm">
      <Link to="/PaymentHistory" className="text-primary underline-offset-2 hover:underline">
       前往繳費紀錄
      </Link>
     </div>
     <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
       <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
         <th className="w-[30%] px-2 py-2 font-medium">學生</th>
         <th className="w-[20%] px-2 py-2 font-medium">日期</th>
         <th className="w-[20%] px-2 py-2 font-medium">金額</th>
         <th className="w-[30%] px-2 py-2 font-medium">狀態</th>
        </tr>
       </thead>
       <tbody>
        {alerts.unpaid.length === 0 ? (
         <tr>
          <td colSpan={4} className="px-2 py-8 text-center text-muted-foreground">
           目前無待繳費／待收款
          </td>
         </tr>
        ) : (
         alerts.unpaid.map((row) => (
          <tr key={row.id} className="border-b border-border/60">
           <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
           <td className="px-2 py-2 tabular-nums">{row.paymentDate || "—"}</td>
           <td className="px-2 py-2 tabular-nums">
            HK$ {row.amount.toLocaleString("en-HK")}
           </td>
           <td className="px-2 py-2">
            <Tag tone={statusToTagTone(row.status)}>{row.status}</Tag>
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </TabsContent>

    <TabsContent value="lessons" className="mt-4">
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
         <th className="w-[12%] px-2 py-2 font-medium">已繳</th>
         <th className="w-[12%] px-2 py-2 font-medium">已綁</th>
         <th className="w-[12%] px-2 py-2 font-medium">差額</th>
         <th className="w-[12%] px-2 py-2 font-medium">操作</th>
        </tr>
       </thead>
       <tbody>
        {alerts.lessonGaps.length === 0 ? (
         <tr>
          <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
           目前無堂數待跟進
          </td>
         </tr>
        ) : (
         alerts.lessonGaps.map((row) => (
          <tr key={row.enrollmentId} className="border-b border-border/60">
           <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
           <td className="min-w-0 truncate px-2 py-2" title={row.classLabel}>
            {row.classLabel}
           </td>
           <td className="px-2 py-2 tabular-nums">{row.paidLessons}</td>
           <td className="px-2 py-2 tabular-nums">{row.boundLessons}</td>
           <td className="px-2 py-2 tabular-nums">{row.gap}</td>
           <td className="px-2 py-2">
            <Link
             to={`/Students/${row.studentId}`}
             className="text-primary underline-offset-2 hover:underline"
            >
             學生
            </Link>
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </TabsContent>

    <TabsContent value="full" className="mt-4">
     <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
       <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
         <th className="w-[40%] px-2 py-2 font-medium">班別</th>
         <th className="w-[15%] px-2 py-2 font-medium">就讀</th>
         <th className="w-[15%] px-2 py-2 font-medium">名額</th>
         <th className="w-[15%] px-2 py-2 font-medium">滿班率</th>
         <th className="w-[15%] px-2 py-2 font-medium">操作</th>
        </tr>
       </thead>
       <tbody>
        {alerts.nearFullClasses.length === 0 ? (
         <tr>
          <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
           目前無將近滿班班別（≥90%）
          </td>
         </tr>
        ) : (
         alerts.nearFullClasses.map((row) => (
          <tr key={row.classId} className="border-b border-border/60">
           <td className="min-w-0 truncate px-2 py-2" title={row.label}>
            {row.label}
           </td>
           <td className="px-2 py-2 tabular-nums">{row.enrolled}</td>
           <td className="px-2 py-2 tabular-nums">{row.capacity}</td>
           <td className="px-2 py-2 tabular-nums">{row.fillPct}%</td>
           <td className="px-2 py-2">
            <Link
             to={`/Classes/${row.classId}`}
             className="text-primary underline-offset-2 hover:underline"
            >
             班別詳情
            </Link>
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </TabsContent>
   </Tabs>
  </section>
 )
}
