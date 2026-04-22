/**
 * 取代 Base44 `api/entities`：改接 Supabase（表名見 `supabase/migrations/20260418120000_baseline.sql`）。
 * 認證舊版 `base44.auth` 請改 `supabase.auth`（見 README）。
 */

import {
 listAppUsers,
 listAttendanceDetail,
 listClasses,
 listClassrooms,
 listLeaveMakeupRecord,
 listPaymentDetails,
 listPayments,
 listSchedule,
 listStudentClassEnrollment,
 listStudents,
 listStudentStatusHistory,
 listTeachers,
 listTrialSession,
 updateAppUser,
} from "@/services/queries"
import {
 deleteStudent,
 getStudentById,
 insertStudent,
 updateStudent,
} from "@/services/studentQueries"
import {
 deleteTeacher,
 getTeacherById,
 insertTeacher,
 updateTeacher,
} from "@/services/teacherQueries"
import {
 deleteClass,
 duplicateClass,
 getClassById,
 insertClass,
 updateClass,
} from "@/services/classQueries"

export const Classrooms = { list: listClassrooms }
export const Teachers = {
 list: listTeachers,
 get: getTeacherById,
 create: insertTeacher,
 update: updateTeacher,
 remove: deleteTeacher,
}
export const Students = {
 list: listStudents,
 get: getStudentById,
 create: insertStudent,
 update: updateStudent,
 remove: deleteStudent,
}
export const Classes = {
 list: listClasses,
 get: getClassById,
 create: insertClass,
 update: updateClass,
 remove: deleteClass,
 duplicate: duplicateClass,
}
export const StudentClassEnrollment = { list: listStudentClassEnrollment }
export const Schedule = { list: listSchedule }
export const AttendanceDetail = { list: listAttendanceDetail }
export const Payments = { list: listPayments }
export const PaymentDetails = { list: listPaymentDetails }
export const StudentStatusHistory = { list: listStudentStatusHistory }
export const LeaveMakeupRecord = { list: listLeaveMakeupRecord }
export const TrialSession = { list: listTrialSession }

/** 後台使用者列表（表 `app_users`）；舊版 `base44.auth` 請改 `supabase.auth` */
export const User = {
 list: listAppUsers,
 update: updateAppUser,
}
