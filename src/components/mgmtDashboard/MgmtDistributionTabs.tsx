import { Link } from "react-router-dom"

import {
 DonutChart,
 HorizontalBarChart,
} from "@/components/mgmtDashboard/charts/MgmtCharts"
import type { MgmtDashboardPayload } from "@/components/mgmtDashboard/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"

type Props = {
 distribution: MgmtDashboardPayload["distribution"]
}

export function MgmtDistributionTabs({ distribution }: Props) {
 return (
  <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
   <h2 className="text-base font-semibold">分析分布</h2>
   <p className="mt-1 text-sm text-muted-foreground">招生、留存概況、滿班與導師負荷</p>

   <Tabs defaultValue="acquisition" className="mt-4">
    <TabsList>
     <TabsTrigger value="acquisition">招生</TabsTrigger>
     <TabsTrigger value="retention">留存概況</TabsTrigger>
     <TabsTrigger value="classes">課堂與滿班</TabsTrigger>
     <TabsTrigger value="teachers">導師</TabsTrigger>
    </TabsList>

    <TabsContent value="acquisition" className="mt-4">
     <div className="grid gap-4 lg:grid-cols-2">
      <div>
       <h3 className="mb-2 text-sm font-medium">科目報讀人數</h3>
       <DonutChart data={distribution.bySubject} />
      </div>
      <div>
       <h3 className="mb-2 text-sm font-medium">課種分布</h3>
       <DonutChart data={distribution.byClassKind} />
      </div>
     </div>
    </TabsContent>

    <TabsContent value="retention" className="mt-4">
     <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(
       [
        ["注冊", distribution.statusBuckets.registration],
        ["在讀", distribution.statusBuckets.enrollment],
        ["活躍", distribution.statusBuckets.activity],
        ["學業階段", distribution.statusBuckets.academicStage],
       ] as const
      ).map(([title, buckets]) => (
       <div key={title} className="rounded-lg border border-border p-3">
        <h3 className="mb-3 text-sm font-medium">{title}</h3>
        <ul className="space-y-2">
         {buckets.map((b) => (
          <li key={b.label} className="flex items-center justify-between gap-2 text-sm">
           <Tag tone={statusToTagTone(b.label)}>{b.label}</Tag>
           <span className="tabular-nums font-medium">{b.count.toLocaleString("en-HK")}</span>
          </li>
         ))}
        </ul>
       </div>
      ))}
     </div>
     <p className="mt-3 text-xs text-muted-foreground">
      狀態為全站快照，非篩選區間內事件；詳見「人數報表」。
      <Link to="/EnrollmentReports" className="ml-1 text-primary underline-offset-2 hover:underline">
       前往人數報表
      </Link>
     </p>
    </TabsContent>

    <TabsContent value="classes" className="mt-4">
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
        {distribution.classFill.length === 0 ? (
         <tr>
          <td colSpan={5} className="px-2 py-8 text-center text-muted-foreground">
           暫無班別資料
          </td>
         </tr>
        ) : (
         distribution.classFill.slice(0, 15).map((row) => (
          <tr key={row.classId} className="border-b border-border/60">
           <td className="min-w-0 truncate px-2 py-2" title={row.label}>
            {row.label}
           </td>
           <td className="px-2 py-2 tabular-nums">{row.enrolled}</td>
           <td className="px-2 py-2 tabular-nums">{row.capacity ?? "—"}</td>
           <td className="px-2 py-2 tabular-nums">
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
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
    </TabsContent>

    <TabsContent value="teachers" className="mt-4">
     <HorizontalBarChart
      data={distribution.byTeacher.map((t) => ({
       label: t.name,
       count: t.enrollmentCount,
      }))}
     />
    </TabsContent>
   </Tabs>
  </section>
 )
}
