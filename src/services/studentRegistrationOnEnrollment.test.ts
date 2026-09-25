import { describe, expect, it } from "vitest"

import { mustPromoteRegistrationOnEnrollment } from "@/services/studentQueries"

describe("mustPromoteRegistrationOnEnrollment", () => {
 it("非注冊報讀後必須改已註冊", () => {
  expect(mustPromoteRegistrationOnEnrollment("非注冊")).toBe(true)
 })

 it("舊值試堂／查詢同樣要升", () => {
  expect(mustPromoteRegistrationOnEnrollment("試堂")).toBe(true)
  expect(mustPromoteRegistrationOnEnrollment("僅查詢")).toBe(true)
 })

 it("已註冊不必再寫", () => {
  expect(mustPromoteRegistrationOnEnrollment("已註冊")).toBe(false)
  expect(mustPromoteRegistrationOnEnrollment(null)).toBe(false)
 })
})
