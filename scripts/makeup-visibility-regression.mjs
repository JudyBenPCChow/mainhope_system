#!/usr/bin/env node
/**
 * 跨班／跨老師／跨科補堂：日視圖標籤與「空班」判斷回歸（離線）
 * 執行：node scripts/makeup-visibility-regression.mjs
 *
 * 鏡像 src/lib/scheduleDayViewTags.ts；並模擬排程列表「有出席對象」判斷。
 */

function isDayViewIdleCard(input) {
  if (input.hasTrial || input.hasMakeupTarget) return false
  if (input.rosterCount === 0) return true
  return input.leaveAmongRosterCount >= input.rosterCount
}

function buildDayViewExtraTags(input) {
  const tags = []
  const allLeave =
    input.rosterCount > 0 && input.leaveAmongRosterCount >= input.rosterCount

  if (input.rosterCount === 0 && !input.hasMakeupTarget) {
    tags.push("無人報讀")
  } else if (allLeave) {
    tags.push("所有學生請假")
  } else if (input.leaveAmongRosterCount > 0) {
    tags.push("請假生")
  }

  if (input.hasTrial) tags.push("試堂生")
  if (input.hasMakeupTarget) tags.push("補堂生")
  if (input.hasOnlineMakeup) tags.push("網課生")
  if (input.hasRecordMakeup) tags.push("要錄影")
  return tags
}

/** 列表卡：是否應灰卡（無報讀且無補堂／試堂／點名資格） */
function listCardLooksEmpty({ enrollCount, makeup, trial, rollCallEligible }) {
  const hasAttendees = enrollCount > 0 || makeup || trial || rollCallEligible
  return !hasAttendees
}

/** 舊 RLS：接待老師能否讀 leave 列 */
function hostSeesLeaveOldRls({ originTeacherId, hostTeacherId }) {
  return originTeacherId === hostTeacherId
}

/** 新 RLS：原班 OR makeup_schedule 屬接待老師 */
function hostSeesLeaveNewRls({
  originTeacherId,
  hostTeacherId,
  makeupScheduleTeacherId,
}) {
  if (originTeacherId === hostTeacherId) return true
  return makeupScheduleTeacherId === hostTeacherId
}

/** 學生未來排程：就讀班 OR makeup 目標 */
function studentUpcomingIncludes({
  enrolledClassIds,
  hostClassId,
  makeupScheduleId,
  fromYmd,
  makeupDate,
}) {
  if (enrolledClassIds.includes(hostClassId)) return true
  if (!makeupScheduleId) return false
  return String(makeupDate) >= String(fromYmd)
}

const cases = [
  {
    name: "同老師跨班（梁天因 A→B）",
    dims: { crossClass: true, crossTeacher: false, crossSubject: false },
    enrollCount: 2,
    rosterCount: 3,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: true,
    originTeacherId: "mark",
    hostTeacherId: "mark",
    makeupScheduleTeacherId: "mark",
    enrolledClassIds: ["A"],
    hostClassId: "B",
    makeupScheduleId: "s1",
    makeupDate: "2026-07-20",
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: true,
      hostSeesNew: true,
      idle: false,
      tagsInclude: ["補堂生"],
      tagsExclude: ["無人報讀"],
      listEmpty: false,
      upcoming: true,
    },
  },
  {
    name: "跨班＋跨老師＋空接待班（計曉汶 Mark→Liam）",
    dims: { crossClass: true, crossTeacher: true, crossSubject: false },
    enrollCount: 0,
    rosterCount: 1,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: true,
    originTeacherId: "mark",
    hostTeacherId: "liam",
    makeupScheduleTeacherId: "liam",
    enrolledClassIds: ["A"],
    hostClassId: "B",
    makeupScheduleId: "s2",
    makeupDate: "2026-07-20",
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: false,
      hostSeesNew: true,
      idle: false,
      tagsInclude: ["補堂生"],
      tagsExclude: ["無人報讀"],
      listEmpty: false,
      upcoming: true,
    },
  },
  {
    name: "跨班＋跨老師＋有報讀接待班（黃詠仁 Mark→Liam）",
    dims: { crossClass: true, crossTeacher: true, crossSubject: false },
    enrollCount: 2,
    rosterCount: 3,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: true,
    originTeacherId: "mark",
    hostTeacherId: "liam",
    makeupScheduleTeacherId: "liam",
    enrolledClassIds: ["A"],
    hostClassId: "B",
    makeupScheduleId: "s3",
    makeupDate: "2026-07-20",
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: false,
      hostSeesNew: true,
      idle: false,
      tagsInclude: ["補堂生"],
      tagsExclude: ["無人報讀"],
      listEmpty: false,
      upcoming: true,
    },
  },
  {
    name: "模擬跨科＋跨老師＋空班（中文→數學）",
    dims: { crossClass: true, crossTeacher: true, crossSubject: true },
    enrollCount: 0,
    rosterCount: 1,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: true,
    originTeacherId: "christine",
    hostTeacherId: "liam",
    makeupScheduleTeacherId: "liam",
    enrolledClassIds: ["CHIS"],
    hostClassId: "MATHS",
    makeupScheduleId: "s4",
    makeupDate: "2026-07-20",
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: false,
      hostSeesNew: true,
      idle: false,
      tagsInclude: ["補堂生"],
      tagsExclude: ["無人報讀"],
      listEmpty: false,
      upcoming: true,
    },
  },
  {
    name: "同班同老師調堂（趙佳鑫）",
    dims: { crossClass: false, crossTeacher: false, crossSubject: false },
    enrollCount: 8,
    rosterCount: 8,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: true,
    originTeacherId: "cyndi",
    hostTeacherId: "cyndi",
    makeupScheduleTeacherId: "cyndi",
    enrolledClassIds: ["ENGS"],
    hostClassId: "ENGS",
    makeupScheduleId: "s5",
    makeupDate: "2026-07-26",
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: true,
      hostSeesNew: true,
      idle: false,
      tagsInclude: ["補堂生"],
      tagsExclude: ["無人報讀"],
      listEmpty: false,
      upcoming: true,
    },
  },
  {
    name: "真・空班（無報讀無補堂無試堂）",
    dims: { crossClass: false, crossTeacher: false, crossSubject: false },
    enrollCount: 0,
    rosterCount: 0,
    leaveAmongRosterCount: 0,
    hasTrial: false,
    hasMakeupTarget: false,
    originTeacherId: "x",
    hostTeacherId: "x",
    makeupScheduleTeacherId: "x",
    enrolledClassIds: [],
    hostClassId: "EMPTY",
    makeupScheduleId: null,
    makeupDate: null,
    fromYmd: "2026-07-20",
    expect: {
      hostSeesOld: true,
      hostSeesNew: true,
      idle: true,
      tagsInclude: ["無人報讀"],
      tagsExclude: ["補堂生"],
      listEmpty: true,
      upcoming: false,
    },
  },
]

let failed = 0
for (const c of cases) {
  const tags = buildDayViewExtraTags({
    rosterCount: c.rosterCount,
    leaveAmongRosterCount: c.leaveAmongRosterCount,
    hasTrial: c.hasTrial,
    hasMakeupTarget: c.hasMakeupTarget,
    hasOnlineMakeup: false,
    hasRecordMakeup: false,
  })
  const idle = isDayViewIdleCard({
    rosterCount: c.rosterCount,
    leaveAmongRosterCount: c.leaveAmongRosterCount,
    hasTrial: c.hasTrial,
    hasMakeupTarget: c.hasMakeupTarget,
  })
  const hostSeesOld = hostSeesLeaveOldRls(c)
  const hostSeesNew = hostSeesLeaveNewRls(c)
  const listEmpty = listCardLooksEmpty({
    enrollCount: c.enrollCount,
    makeup: c.hasMakeupTarget,
    trial: c.hasTrial,
    rollCallEligible: c.hasMakeupTarget,
  })
  const upcoming = studentUpcomingIncludes(c)

  const checks = [
    ["hostSeesOld", hostSeesOld, c.expect.hostSeesOld],
    ["hostSeesNew", hostSeesNew, c.expect.hostSeesNew],
    ["idle", idle, c.expect.idle],
    ["listEmpty", listEmpty, c.expect.listEmpty],
    ["upcoming", upcoming, c.expect.upcoming],
  ]
  const missing = c.expect.tagsInclude.filter((t) => !tags.includes(t))
  const unexpected = c.expect.tagsExclude.filter((t) => tags.includes(t))

  const ok =
    checks.every(([, got, exp]) => got === exp) &&
    missing.length === 0 &&
    unexpected.length === 0

  const dim = [
    c.dims.crossClass ? "跨班" : "同班",
    c.dims.crossTeacher ? "跨老師" : "同老師",
    c.dims.crossSubject ? "跨科" : "同科",
  ].join("·")

  if (ok) {
    console.log(`PASS  [${dim}] ${c.name}`)
  } else {
    failed += 1
    console.error(`FAIL  [${dim}] ${c.name}`)
    for (const [k, got, exp] of checks) {
      if (got !== exp) console.error(`  ${k}: got ${got}, expect ${exp}`)
    }
    if (missing.length) console.error(`  missing tags: ${missing.join(", ")}`)
    if (unexpected.length) console.error(`  unexpected tags: ${unexpected.join(", ")}`)
    console.error(`  tags=${JSON.stringify(tags)}`)
  }
}

if (failed) {
  console.error(`\n${failed} case(s) failed`)
  process.exit(1)
}
console.log(`\nAll ${cases.length} makeup visibility cases passed.`)
