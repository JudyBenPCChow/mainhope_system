import type { Location } from "react-router-dom"
import { describe, expect, it } from "vitest"

import {
 resolveStudentDetailBackLabel,
 resolveStudentDetailExitPath,
 resolveStudentDetailLeaveTo,
 studentDetailLinkState,
} from "./studentDetailNav"

function loc(state?: unknown): Location {
 return {
  pathname: "/Students/s1",
  search: "?tab=tuitionChase",
  hash: "",
  key: "k",
  state,
 } as Location
}

describe("resolveStudentDetailExitPath", () => {
 it("uses state.from when it is an in-app path", () => {
  expect(resolveStudentDetailExitPath(loc({ from: "/TuitionChase" }))).toBe("/TuitionChase")
 })

 it("falls back to students for admin-like roles", () => {
  expect(resolveStudentDetailExitPath(loc(), "admin")).toBe("/Students")
 })

 it("falls back to classes for teachers", () => {
  expect(resolveStudentDetailExitPath(loc(), "teacher")).toBe("/Classes")
 })
})

describe("resolveStudentDetailLeaveTo", () => {
 it("goes history-back when idx > 0 even if from is set", () => {
  expect(resolveStudentDetailLeaveTo(loc({ from: "/TuitionChase" }), "admin", 1)).toEqual({
   kind: "back",
  })
 })

 it("uses from when there is no previous history entry", () => {
  expect(resolveStudentDetailLeaveTo(loc({ from: "/TuitionChase" }), "admin", 0)).toEqual({
   kind: "to",
   path: "/TuitionChase",
  })
 })

 it("falls back to the list when history and from are both missing", () => {
  expect(resolveStudentDetailLeaveTo(loc(), "admin", 0)).toEqual({
   kind: "to",
   path: "/Students",
  })
 })
})

describe("resolveStudentDetailBackLabel", () => {
 it("names the origin page from state.from", () => {
  expect(resolveStudentDetailBackLabel(loc({ from: "/TuitionChase" }), "admin", 1)).toBe(
   "返回學費追收"
  )
  expect(resolveStudentDetailBackLabel(loc({ from: "/Students" }), "admin", 1)).toBe(
   "返回學生管理"
  )
 })

 it("uses a generic 返回 when history can go back without a named origin", () => {
  expect(resolveStudentDetailBackLabel(loc(), "admin", 1)).toBe("返回")
 })

 it("keeps the list-layer wording when this is the first history entry", () => {
  expect(resolveStudentDetailBackLabel(loc(), "admin", 0)).toBe("返回學生管理")
  expect(resolveStudentDetailBackLabel(loc(), "teacher", 0)).toBe("返回班別管理")
 })
})

describe("studentDetailLinkState", () => {
 it("stores pathname and search as from", () => {
  expect(
   studentDetailLinkState({ pathname: "/TuitionChase", search: "?q=a" })
  ).toEqual({ from: "/TuitionChase?q=a" })
 })
})
