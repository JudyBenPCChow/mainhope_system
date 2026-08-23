import { describe, expect, it } from "vitest"

import {
 EMPTY_HEADER_FILTERS,
 rowsMatchingHeaderFiltersExcept,
 uniqueHeaderFilterValues,
 type StudentListHeaderFilters,
} from "@/components/students/studentsListColumns"
import type { StudentRecord } from "@/services/studentQueries"

function rec(partial: Partial<StudentRecord> & Pick<StudentRecord, "id" | "full_name">): StudentRecord {
 return {
  old_student_id: null,
  student_code: null,
  english_name: null,
  gender: null,
  date_of_birth: null,
  grade: "S1",
  school: null,
  registration_status: "已註冊",
  enrollment_status: "在讀",
  activity_status: "活躍生",
  academic_stage: "中學階段",
  status: null,
  parent_name: null,
  parent_relationship: null,
  parent_phone: null,
  parent_phone_country_code: null,
  student_phone: null,
  student_phone_country_code: null,
  whatsapp: null,
  preferred_contact_method: null,
  student_preferred_contact_method: null,
  parent_preferred_contact_method: null,
  student_wechat_id: null,
  parent_wechat_id: null,
  primary_contact_person: null,
  address: null,
  remarks: null,
  assigned_agent_user_id: null,
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-08-01T12:00:00.000Z",
  ...partial,
 }
}

describe("uniqueHeaderFilterValues", () => {
 it("學校去重並按中文排序", () => {
  const rows = [
   rec({ id: "1", full_name: "甲", school: "拔萃男書院" }),
   rec({ id: "2", full_name: "乙", school: "英華書院" }),
   rec({ id: "3", full_name: "丙", school: "拔萃男書院" }),
   rec({ id: "4", full_name: "丁", school: "  " }),
  ]
  expect(uniqueHeaderFilterValues("school", rows, new Map())).toEqual(["拔萃男書院", "英華書院"])
 })

 it("姓名含中文與英文", () => {
  const rows = [rec({ id: "1", full_name: "陳大文", english_name: "Chan Tai Man" })]
  expect(uniqueHeaderFilterValues("name", rows, new Map())).toEqual(["陳大文", "Chan Tai Man"])
 })

 it("報讀班別由 tags 展開", () => {
  const rows = [rec({ id: "1", full_name: "甲" }), rec({ id: "2", full_name: "乙" })]
  const tags = new Map<string, string[]>([
   ["1", ["中文", "英文"]],
   ["2", ["中文"]],
  ])
  expect(uniqueHeaderFilterValues("subjects", rows, tags)).toEqual(["中文", "英文"])
 })
})

describe("rowsMatchingHeaderFiltersExcept", () => {
 it("忽略指定欄的篩選，仍套用其他表頭條件", () => {
  const rows = [
   rec({ id: "1", full_name: "陳大文", school: "英華書院", grade: "S1" }),
   rec({ id: "2", full_name: "陳小文", school: "喇沙書院", grade: "S2" }),
   rec({ id: "3", full_name: "李四", school: "英華書院", grade: "S1" }),
  ]
  const filters: StudentListHeaderFilters = {
   ...EMPTY_HEADER_FILTERS,
   name: "陳",
   school: "英華",
  }
  const matched = rowsMatchingHeaderFiltersExcept(rows, filters, "school", new Map())
  expect(matched.map((r) => r.id)).toEqual(["1", "2"])
 })
})
