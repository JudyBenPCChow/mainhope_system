/** 老師請假處理精靈 — 沙盒假資料（不接 Supabase） */

export type MockTeacher = { id: string; full_name: string }

export type MockStudentKind = "expected" | "leave" | "makeup"

export type MockStudentOnLesson = {
  id: string
  full_name: string
  student_code: string
  kind: MockStudentKind
  /** 已請假時的補課安排 */
  leaveMakeup?: "待安排" | "錄影" | "調堂" | "不補回"
  leaveReason?: "病假" | "事假"
  /** 來補堂：原請假班／日期說明 */
  makeupFrom?: string
}

export type MockLesson = {
  id: string
  classLabel: string
  room: string
  start_time: string
  end_time: string
  consecutive?: boolean
  /** 沙盒提示：此堂為「只請這一堂」的請假對象 */
  leaveTarget?: boolean
  students: MockStudentOnLesson[]
}

export type ScenarioId = "1" | "2" | "3" | "4" | "5" | "6" | "mixed"

export type ScenarioPack = {
  id: ScenarioId
  title: string
  /** 情境卡一行短標 */
  shortTitle: string
  blurb: string
  leaveTeacherId: string
  leaveDate: string
  lessons: MockLesson[]
}

export const MOCK_TEACHERS: MockTeacher[] = [
  { id: "t-chen", full_name: "陳老師" },
  { id: "t-wong", full_name: "黃老師" },
  { id: "t-lam", full_name: "林老師" },
  { id: "t-ng", full_name: "吳老師" },
]

const DATE = "2026-07-21"

function s(
  id: string,
  name: string,
  code: string,
  kind: MockStudentKind,
  extra?: Partial<MockStudentOnLesson>
): MockStudentOnLesson {
  return { id, full_name: name, student_code: code, kind, ...extra }
}

/** 情況 1：一堂、全應到課、通常無人代堂 */
const SCENARIO_1: ScenarioPack = {
  id: "1",
  title: "情況 1｜一堂・全應到課・無代堂",
  shortTitle: "一堂・另約",
  blurb: "全日只有一班；學生本應上課；無人即日代堂 → 取消並另約。",
  leaveTeacherId: "t-chen",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-1a",
      classLabel: "中一數學 · MA101",
      room: "A201",
      start_time: "16:00",
      end_time: "17:30",
      students: [
        s("stu-a1", "王小明", "S26001", "expected"),
        s("stu-a2", "李小華", "S26002", "expected"),
        s("stu-a3", "張美玲", "S26003", "expected"),
      ],
    },
  ],
}

/** 情況 2：多堂、全應到課 */
const SCENARIO_2: ScenarioPack = {
  id: "2",
  title: "情況 2｜多堂・全應到課・無代堂",
  shortTitle: "多堂・另約",
  blurb: "全日超過一班；每堂都要決定取消並另約（可逐堂確認名單）。",
  leaveTeacherId: "t-chen",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-2a",
      classLabel: "中一數學 · MA101",
      room: "A201",
      start_time: "14:00",
      end_time: "15:30",
      students: [
        s("stu-b1", "陳大文", "S26011", "expected"),
        s("stu-b2", "黃小美", "S26012", "expected"),
      ],
    },
    {
      id: "les-2b",
      classLabel: "中二數學 · MA201",
      room: "A202",
      start_time: "16:00",
      end_time: "17:30",
      consecutive: true,
      students: [
        s("stu-b3", "周志強", "S26013", "expected"),
        s("stu-b4", "林雅婷", "S26014", "expected"),
        s("stu-b5", "吳嘉豪", "S26015", "expected"),
      ],
    },
  ],
}

/** 情況 3：一堂、混合已請假 */
const SCENARIO_3: ScenarioPack = {
  id: "3",
  title: "情況 3｜一堂・混合已請假",
  shortTitle: "混合請假",
  blurb: "有應到課、也有已請假；取消時應跳過已請假、只為應到課建待另約。",
  leaveTeacherId: "t-wong",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-3a",
      classLabel: "中三英文 · EN301",
      room: "B105",
      start_time: "15:00",
      end_time: "16:30",
      students: [
        s("stu-c1", "何啟明", "S26021", "expected"),
        s("stu-c2", "鄧曉彤", "S26022", "expected"),
        s("stu-c3", "馬俊傑", "S26023", "leave", {
          leaveReason: "病假",
          leaveMakeup: "待安排",
        }),
        s("stu-c4", "蔡詠詩", "S26024", "leave", {
          leaveReason: "事假",
          leaveMakeup: "錄影",
        }),
      ],
    },
  ],
}

/** 情況 4：一堂、可代堂 */
const SCENARIO_4: ScenarioPack = {
  id: "4",
  title: "情況 4｜一堂・有代堂老師",
  shortTitle: "一堂・代堂",
  blurb: "選即日代堂即可；不取消、不新建學生待另約。",
  leaveTeacherId: "t-lam",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-4a",
      classLabel: "小學常識 · GS05",
      room: "C301",
      start_time: "10:00",
      end_time: "11:00",
      students: [
        s("stu-d1", "梁梓軒", "S26031", "expected"),
        s("stu-d2", "葉詠心", "S26032", "expected"),
        s("stu-d3", "羅子晴", "S26033", "leave", {
          leaveReason: "事假",
          leaveMakeup: "不補回",
        }),
      ],
    },
  ],
}

/** 情況 5：多堂、部分可代 */
const SCENARIO_5: ScenarioPack = {
  id: "5",
  title: "情況 5｜多堂・部分可代",
  shortTitle: "部分代堂",
  blurb: "一堂可代、其餘取消並另約；另含「來補堂」學生示範拆回待安排。",
  leaveTeacherId: "t-chen",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-5a",
      classLabel: "中一數學 · MA101",
      room: "A201",
      start_time: "14:00",
      end_time: "15:30",
      students: [
        s("stu-e1", "馮浩然", "S26041", "expected"),
        s("stu-e2", "謝欣怡", "S26042", "expected"),
      ],
    },
    {
      id: "les-5b",
      classLabel: "中二數學 · MA201",
      room: "A202",
      start_time: "16:00",
      end_time: "17:30",
      students: [
        s("stu-e3", "鄭子信", "S26043", "expected"),
        s("stu-e4", "楊凱琳", "S26044", "leave", {
          leaveReason: "病假",
          leaveMakeup: "調堂",
        }),
        s("stu-e5", "潘卓銘", "S26045", "makeup", {
          makeupFrom: "原請假 7/14 MA101 · 調堂至此",
        }),
      ],
    },
  ],
}

/** 情況 6：多堂，只請其中一堂假，其餘老師照常上 */
const SCENARIO_6: ScenarioPack = {
  id: "6",
  title: "情況 6｜多堂・只請一堂假",
  shortTitle: "只請一堂",
  blurb: "當日有多於一班，但只請其中一堂；其餘選「老師照常」，請假那堂再選代堂或取消另約。",
  leaveTeacherId: "t-wong",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-6a",
      classLabel: "中三英文 · EN301",
      room: "B105",
      start_time: "14:00",
      end_time: "15:30",
      leaveTarget: true,
      students: [
        s("stu-f1", "何啟明", "S26021", "expected"),
        s("stu-f2", "鄧曉彤", "S26022", "expected"),
        s("stu-f3", "馬俊傑", "S26023", "leave", {
          leaveReason: "病假",
          leaveMakeup: "待安排",
        }),
      ],
    },
    {
      id: "les-6b",
      classLabel: "中四英文 · EN401",
      room: "B106",
      start_time: "16:00",
      end_time: "17:30",
      students: [
        s("stu-f4", "蔡詠詩", "S26024", "expected"),
        s("stu-f5", "梁梓軒", "S26031", "expected"),
        s("stu-f6", "葉詠心", "S26032", "expected"),
      ],
    },
  ],
}

/** 綜合：一次看齊三欄學生 */
const SCENARIO_MIXED: ScenarioPack = {
  id: "mixed",
  title: "綜合示範｜三欄學生齊全",
  shortTitle: "綜合",
  blurb: "兩堂、含應到課／已請假／來補堂；方便一次走完決策與摘要。",
  leaveTeacherId: "t-chen",
  leaveDate: DATE,
  lessons: [
    {
      id: "les-mx1",
      classLabel: "中一數學 · MA101",
      room: "A201",
      start_time: "14:00",
      end_time: "15:30",
      students: [
        s("stu-m1", "王小明", "S26001", "expected"),
        s("stu-m2", "李小華", "S26002", "expected"),
        s("stu-m3", "張美玲", "S26003", "leave", {
          leaveReason: "病假",
          leaveMakeup: "待安排",
        }),
      ],
    },
    {
      id: "les-mx2",
      classLabel: "中二數學 · MA201（連堂）",
      room: "A202",
      start_time: "16:00",
      end_time: "18:00",
      consecutive: true,
      students: [
        s("stu-m4", "周志強", "S26013", "expected"),
        s("stu-m5", "林雅婷", "S26014", "leave", {
          leaveReason: "事假",
          leaveMakeup: "錄影",
        }),
        s("stu-m6", "潘卓銘", "S26045", "makeup", {
          makeupFrom: "原請假 7/14 MA101 · 調堂至此",
        }),
      ],
    },
  ],
}

export const SCENARIOS: ScenarioPack[] = [
  SCENARIO_1,
  SCENARIO_2,
  SCENARIO_3,
  SCENARIO_4,
  SCENARIO_5,
  SCENARIO_6,
  SCENARIO_MIXED,
]

export function cloneScenario(pack: ScenarioPack): ScenarioPack {
  return {
    ...pack,
    lessons: pack.lessons.map((l) => ({
      ...l,
      students: l.students.map((st) => ({ ...st })),
    })),
  }
}

export function newMockId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
