import {
 Bar,
 BarChart,
 CartesianGrid,
 Cell,
 Legend,
 Pie,
 PieChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from "recharts"

const CHART_COLORS = [
 "hsl(var(--chart-1))",
 "hsl(var(--chart-2))",
 "hsl(var(--chart-3))",
 "hsl(var(--chart-4))",
 "hsl(var(--chart-5))",
]

type SeriesPoint = { label: string; amount: number }

export function RevenueTrendChart({ data }: { data: SeriesPoint[] }) {
 return (
  <div className="h-64 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis dataKey="label" tick={{ fontSize: 12 }} />
     <YAxis tick={{ fontSize: 12 }} width={56} />
     <Tooltip
      formatter={(value: number) => [
       `HK$ ${Number(value).toLocaleString("en-HK")}`,
       "已收款",
      ]}
     />
     <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
    </BarChart>
   </ResponsiveContainer>
  </div>
 )
}

type FunnelPoint = { stage: string; count: number }

export function EnrollmentFunnelChart({ data }: { data: FunnelPoint[] }) {
 return (
  <div className="h-64 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis type="number" tick={{ fontSize: 12 }} />
     <YAxis type="category" dataKey="stage" width={56} tick={{ fontSize: 12 }} />
     <Tooltip formatter={(value: number) => [Number(value).toLocaleString("en-HK"), "人數"]} />
     <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
    </BarChart>
   </ResponsiveContainer>
  </div>
 )
}

type NamedCount = { label: string; count: number }

export function DonutChart({ data }: { data: NamedCount[] }) {
 if (data.length === 0) {
  return <p className="py-10 text-center text-sm text-muted-foreground">暫無資料</p>
 }
 return (
  <div className="h-64 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <PieChart>
     <Pie
      data={data}
      dataKey="count"
      nameKey="label"
      innerRadius={55}
      outerRadius={90}
      paddingAngle={2}
     >
      {data.map((_, i) => (
       <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
      ))}
     </Pie>
     <Tooltip formatter={(value: number) => Number(value).toLocaleString("en-HK")} />
     <Legend />
    </PieChart>
   </ResponsiveContainer>
  </div>
 )
}

export function HorizontalBarChart({ data }: { data: NamedCount[] }) {
 if (data.length === 0) {
  return <p className="py-10 text-center text-sm text-muted-foreground">暫無資料</p>
 }
 return (
  <div className="h-72 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <BarChart
     data={data}
     layout="vertical"
     margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
    >
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis type="number" tick={{ fontSize: 12 }} />
     <YAxis
      type="category"
      dataKey="label"
      width={88}
      tick={{ fontSize: 11 }}
     />
     <Tooltip formatter={(value: number) => Number(value).toLocaleString("en-HK")} />
     <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
    </BarChart>
   </ResponsiveContainer>
  </div>
 )
}
