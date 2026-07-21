import type { MgmtDashboardPayload } from "@/components/mgmtDashboard/types"

/** Phase 1／無 Supabase 時的同型別假資料，方便 layout 與圖表接線 */
export function buildMgmtDashboardMock(): MgmtDashboardPayload {
 return {
  kpis: [
   {
    id: "revenue",
    label: "已收款",
    value: 186500,
    format: "hkd",
    deltaPct: 8.2,
    tone: "success",
   },
   {
    id: "consumed",
    label: "消堂價值",
    value: 152400,
    format: "hkd",
    deltaPct: 5.4,
    tone: "default",
    hint: "共 508 堂",
   },
   {
    id: "receivable",
    label: "應收未收",
    value: 42300,
    format: "hkd",
    deltaPct: -3.1,
    tone: "warning",
   },
   { id: "enroll", label: "新報讀", value: 28, format: "count", deltaPct: 12.0, tone: "success" },
   { id: "withdraw", label: "退讀", value: 5, format: "count", deltaPct: 25.0, tone: "destructive" },
   { id: "enrolled", label: "在讀學生", value: 312, format: "count", deltaPct: 1.6, tone: "default" },
   { id: "lessonGap", label: "堂數待跟進", value: 14, format: "count", deltaPct: null, tone: "warning" },
  ],
  revenueSeries: [
   { label: "2月", amount: 142000 },
   { label: "3月", amount: 158000 },
   { label: "4月", amount: 151200 },
   { label: "5月", amount: 169800 },
   { label: "6月", amount: 172400 },
   { label: "7月", amount: 186500 },
  ],
  funnel: [
   { stage: "試堂", count: 46 },
   { stage: "新報讀", count: 28 },
   { stage: "在讀", count: 312 },
  ],
  distribution: {
   bySubject: [
    { label: "英文", count: 98 },
    { label: "數學", count: 86 },
    { label: "中文", count: 54 },
    { label: "理科", count: 42 },
    { label: "其他", count: 32 },
   ],
   byClassKind: [
    { label: "小組", count: 240 },
    { label: "一對一", count: 72 },
   ],
   statusBuckets: {
    registration: [
     { label: "已註冊", count: 280 },
     { label: "非注冊", count: 48 },
    ],
    enrollment: [
     { label: "在讀", count: 312 },
     { label: "非在讀", count: 16 },
    ],
    activity: [
     { label: "活躍生", count: 268 },
     { label: "非活躍生", count: 60 },
    ],
    academicStage: [
     { label: "中學階段", count: 300 },
     { label: "已畢業", count: 28 },
    ],
   },
   classFill: [
    { classId: "c1", label: "英文 F3A", enrolled: 9, capacity: 10, fillPct: 90 },
    { classId: "c2", label: "數學 F4B", enrolled: 8, capacity: 8, fillPct: 100 },
    { classId: "c3", label: "中文 F2C", enrolled: 7, capacity: 10, fillPct: 70 },
    { classId: "c4", label: "英文 F5 一對一", enrolled: 1, capacity: 1, fillPct: 100 },
   ],
   byTeacher: [
    { teacherId: "t1", name: "陳老師", enrollmentCount: 42 },
    { teacherId: "t2", name: "李老師", enrollmentCount: 38 },
    { teacherId: "t3", name: "王老師", enrollmentCount: 31 },
    { teacherId: "t4", name: "黃老師", enrollmentCount: 27 },
   ],
  },
  alerts: {
   unpaid: [
    { id: "p1", studentName: "陳小明", paymentDate: "2026-07-01", amount: 2750, status: "待繳費" },
    { id: "p2", studentName: "李美華", paymentDate: "2026-07-05", amount: 1650, status: "待收款" },
    { id: "p3", studentName: "王大文", paymentDate: "2026-07-10", amount: 825, status: "待繳費" },
   ],
   lessonGaps: [
    {
     enrollmentId: "e1",
     classId: "c1",
     classLabel: "英文 F3A",
     enrollDate: "2026-04-01",
     enrollmentPeriod: null,
     paidLessons: 8,
     boundLessons: 6,
     pendingLessons: 0,
     leaveAwaitingMakeupCount: 0,
     gap: 2,
     isAligned: false,
     pendingRows: [],
     leaveAwaitingMakeupRows: [],
     studentId: "s1",
     studentCode: "S001",
     studentName: "陳小明",
     englishName: null,
    },
   ],
   nearFullClasses: [
    { classId: "c2", label: "數學 F4B", enrolled: 8, capacity: 8, fillPct: 100 },
    { classId: "c1", label: "英文 F3A", enrolled: 9, capacity: 10, fillPct: 90 },
   ],
  },
 }
}
