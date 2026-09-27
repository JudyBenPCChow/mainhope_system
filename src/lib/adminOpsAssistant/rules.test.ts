import { describe, expect, it } from "vitest"

import {
  adminOpsConfirmLabel,
  adminOpsConfirmTitle,
  isActionablePendingMessage,
} from "./confirm"
import { classifyAdminOpsIntent, extractCourseCodes, isAmbiguousTimeChange } from "./intent"
import { canSeeAdminOpsAssistant } from "./permissions"
import {
  assertNoForbiddenPad,
  classifyScheduleRowForSlotChange,
  classroomRankTier,
  colleagueNoticeDraft,
  emptyClassHardDeleteGate,
  lessonCountPreviewLine,
  rankClassroomCandidates,
  regenerateSlotChangeGate,
  slotChangeWriteMode,
  specialistLessonDatesFromFirst,
} from "./rules"

describe("classifyAdminOpsIntent", () => {
  it("辨識第一波五種意圖", () => {
    expect(classifyAdminOpsIntent("取消沒有學生的班")).toBe("delete_empty_class")
    expect(classifyAdminOpsIntent("改固定時段")).toBe("change_fixed_slot")
    expect(classifyAdminOpsIntent("兩個班對調時間")).toBe("swap_slots")
    expect(classifyAdminOpsIntent("開新班並排堂")).toBe("create_class_schedule")
    expect(classifyAdminOpsIntent("取消空班後同一格開另一科")).toBe("replace_empty_slot")
  })

  it("改時間未講清楚時先問範圍", () => {
    expect(isAmbiguousTimeChange("改時間")).toBe(true)
    expect(classifyAdminOpsIntent("改時間")).toBe("clarify_scope")
    expect(classifyAdminOpsIntent("把 2627-CHIS5001-C 改去星期三 16:30")).toBe("change_fixed_slot")
  })

  it("抽出班碼", () => {
    expect(extractCourseCodes("取消 2627-CHIS1001-B 再開 M2S4001-A")).toEqual([
      "2627-CHIS1001-B",
      "M2S4001-A",
    ])
  })
})

describe("slotChangeWriteMode", () => {
  it("逢星期不變只改鐘 → UPDATE", () => {
    expect(slotChangeWriteMode("星期五", "星期五")).toBe("update_times")
    expect(slotChangeWriteMode("五", "星期五")).toBe("update_times")
  })

  it("改逢星期 → 重生日期網", () => {
    expect(slotChangeWriteMode("星期二", "星期三")).toBe("regenerate_dates")
  })
})

describe("classifyScheduleRowForSlotChange", () => {
  it("改鐘時保留取消堂與補回，只改日後正常列", () => {
    expect(
      classifyScheduleRowForSlotChange({
        scheduledDate: "2026-09-04",
        status: "取消",
        remarks: null,
        todayYmd: "2026-09-10",
        mode: "update_times",
      })
    ).toBe("ignore_past")
    expect(
      classifyScheduleRowForSlotChange({
        scheduledDate: "2026-09-11",
        status: "正常",
        remarks: null,
        todayYmd: "2026-09-10",
        mode: "update_times",
      })
    ).toBe("update")
    expect(
      classifyScheduleRowForSlotChange({
        scheduledDate: "2026-09-12",
        status: "正常",
        remarks: "makeup_of=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee 補回 2026-09-08",
        todayYmd: "2026-09-10",
        mode: "update_times",
      })
    ).toBe("keep")
  })

  it("改逢星期時日後正常列標為刪後重生，不整表刪建歷史列", () => {
    expect(
      classifyScheduleRowForSlotChange({
        scheduledDate: "2026-09-15",
        status: "正常",
        remarks: null,
        todayYmd: "2026-09-10",
        mode: "regenerate_dates",
      })
    ).toBe("delete_for_regen")
    expect(
      classifyScheduleRowForSlotChange({
        scheduledDate: "2026-09-15",
        status: "取消",
        remarks: "地板工程",
        todayYmd: "2026-09-10",
        mode: "regenerate_dates",
      })
    ).toBe("keep")
  })
})

describe("emptyClassHardDeleteGate", () => {
  it("有報讀或點名即中止", () => {
    expect(emptyClassHardDeleteGate({ activeEnrollmentCount: 1, attendanceCount: 0 }).ok).toBe(false)
    expect(emptyClassHardDeleteGate({ activeEnrollmentCount: 0, attendanceCount: 2 }).ok).toBe(false)
    expect(emptyClassHardDeleteGate({ activeEnrollmentCount: 0, attendanceCount: 0 }).ok).toBe(true)
  })
})

describe("regenerateSlotChangeGate", () => {
  it("有點名不可重生；有取消／補回須明示保留", () => {
    expect(
      regenerateSlotChangeGate({
        attendanceOnRowsToDelete: 1,
        keptCancelledCount: 0,
        keptMakeupCount: 0,
        userConfirmedKeepHistorical: false,
      }).ok
    ).toBe(false)
    expect(
      regenerateSlotChangeGate({
        attendanceOnRowsToDelete: 0,
        keptCancelledCount: 1,
        keptMakeupCount: 1,
        userConfirmedKeepHistorical: false,
      }).ok
    ).toBe(false)
    expect(
      regenerateSlotChangeGate({
        attendanceOnRowsToDelete: 0,
        keptCancelledCount: 1,
        keptMakeupCount: 1,
        userConfirmedKeepHistorical: true,
      }).ok
    ).toBe(true)
  })
})

describe("specialistLessonDatesFromFirst", () => {
  it("中途開班少於 40，且不含 6/29、6/30", () => {
    const { dates, calendarTarget } = specialistLessonDatesFromFirst({
      academicYearLabel: "2627",
      weekday: "星期五",
      firstDateYmd: "2026-09-11",
    })
    expect(calendarTarget).toBe(40)
    expect(dates.length).toBeLessThan(40)
    expect(dates[0]).toBe("2026-09-11")
    expect(dates.some((d) => d === "2027-06-29" || d === "2027-06-30")).toBe(false)
    expect(dates.every((d) => d <= "2027-06-28")).toBe(true)
  })

  it("從學年首個星期五起為 40 堂", () => {
    const { dates } = specialistLessonDatesFromFirst({
      academicYearLabel: "2627",
      weekday: "星期五",
      firstDateYmd: "2026-09-01",
    })
    expect(dates).toHaveLength(40)
  })
})

describe("forbiddenPadDates", () => {
  it("禁止補建已過日期或最後上課日之後", () => {
    expect(() =>
      assertNoForbiddenPad({
        proposedDates: ["2026-09-04", "2026-09-11"],
        todayYmd: "2026-09-10",
        lastLessonYmd: "2027-06-28",
      })
    ).toThrow(/已過日期/)
    expect(() =>
      assertNoForbiddenPad({
        proposedDates: ["2027-06-29"],
        todayYmd: "2026-09-10",
        lastLessonYmd: "2027-06-28",
      })
    ).toThrow(/最後上課日/)
  })
})

describe("classroom ranking", () => {
  it("平日不搶 17D、禁 17K、17E 最後才用", () => {
    expect(
      classroomRankTier({
        roomName: "17K",
        weekday: "星期五",
        currentRoomId: null,
        roomId: "k",
      })
    ).toBe("forbidden")
    expect(
      classroomRankTier({
        roomName: "17D",
        weekday: "星期五",
        currentRoomId: null,
        roomId: "d",
      })
    ).toBe("forbidden")
    expect(
      classroomRankTier({
        roomName: "17E",
        weekday: "星期五",
        currentRoomId: null,
        roomId: "e",
      })
    ).toBe("last_resort")
    const ranked = rankClassroomCandidates(
      [
        { id: "e", name: "17E" },
        { id: "k", name: "17K" },
        { id: "d", name: "17D" },
        { id: "s", name: "山案座" },
        { id: "cur", name: "矩尺座" },
      ],
      { weekday: "星期五", currentRoomId: "cur" }
    )
    expect(ranked.map((r) => r.name)).toEqual(["矩尺座", "山案座", "17E"])
  })
})

describe("colleagueNoticeDraft", () => {
  it("課程名稱、班碼、逢星期、時段分行", () => {
    expect(
      colleagueNoticeDraft({
        courseName: "中六企業、會計與財務概論",
        courseCode: "2627-BAFSS6001-A",
        dayOfWeek: "星期五",
        timeSlot: "17:45–19:00",
      })
    ).toBe("中六企業、會計與財務概論\n2627-BAFSS6001-A\n星期五\n17:45–19:00")
  })

  it("少於 40 堂的預覽句不把 40 當硬鎖", () => {
    expect(lessonCountPreviewLine(39, 40)).toContain("可少於此數")
  })
})

describe("permissions", () => {
  it("僅行政可見班務助手", () => {
    expect(canSeeAdminOpsAssistant("admin")).toBe(true)
    expect(canSeeAdminOpsAssistant("manager")).toBe(false)
    expect(canSeeAdminOpsAssistant("finance")).toBe(false)
    expect(canSeeAdminOpsAssistant("teacher")).toBe(false)
    expect(canSeeAdminOpsAssistant("alien")).toBe(false)
  })
})

describe("confirm card", () => {
  it("硬刪／開班／對調用對應確認文案", () => {
    expect(adminOpsConfirmLabel({ workflow: "delete_empty_class", classId: "c1", previewLines: [] })).toBe(
      "確認硬刪"
    )
    expect(
      adminOpsConfirmTitle({
        workflow: "replace_empty_slot",
        step: "delete",
        deleteClassId: "c1",
        createSlots: {},
        previewLines: [],
      })
    ).toBe("確認硬刪空班？")
    expect(
      adminOpsConfirmLabel({
        workflow: "create_class_schedule",
        slots: {},
        previewLines: [],
      })
    ).toBe("確認開班並排堂")
    expect(
      adminOpsConfirmLabel({ workflow: "swap_slots", classAId: "a", classBId: "b", previewLines: [] })
    ).toBe("確認對調")
  })

  it("只有最新助手訊息的預覽卡可確認寫入", () => {
    expect(
      isActionablePendingMessage({
        messageId: "old",
        hasPending: true,
        latestAssistantId: "new",
      })
    ).toBe(false)
    expect(
      isActionablePendingMessage({
        messageId: "new",
        hasPending: true,
        latestAssistantId: "new",
      })
    ).toBe(true)
    expect(
      isActionablePendingMessage({
        messageId: "new",
        hasPending: false,
        latestAssistantId: "new",
      })
    ).toBe(false)
  })
})
