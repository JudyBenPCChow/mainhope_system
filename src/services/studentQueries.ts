import { supabase } from "@/lib/supabaseClient"

function localYmd(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export type StudentRecord = {
  id: string
  student_code: string | null
  full_name: string
  english_name: string | null
  gender: string | null
  date_of_birth: string | null
  grade: string | null
  school: string | null
  status: string | null
  parent_name: string | null
  parent_relationship: string | null
  parent_phone: string | null
  whatsapp: string | null
  address: string | null
  remarks: string | null
  created_at: string
  updated_at: string
}

function asStudent(row: Record<string, unknown>): StudentRecord {
  return {
    id: String(row.id),
    student_code: row.student_code != null ? String(row.student_code) : null,
    full_name: String(row.full_name ?? ""),
    english_name: row.english_name != null ? String(row.english_name) : null,
    gender: row.gender != null ? String(row.gender) : null,
    date_of_birth: row.date_of_birth != null ? String(row.date_of_birth) : null,
    grade: row.grade != null ? String(row.grade) : null,
    school: row.school != null ? String(row.school) : null,
    status: row.status != null ? String(row.status) : null,
    parent_name: row.parent_name != null ? String(row.parent_name) : null,
    parent_relationship:
      row.parent_relationship != null ? String(row.parent_relationship) : null,
    parent_phone: row.parent_phone != null ? String(row.parent_phone) : null,
    whatsapp: row.whatsapp != null ? String(row.whatsapp) : null,
    address: row.address != null ? String(row.address) : null,
    remarks: row.remarks != null ? String(row.remarks) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  }
}

export async function fetchAllStudents(): Promise<StudentRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => asStudent(r as Record<string, unknown>))
}

export async function getStudentById(id: string): Promise<StudentRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return asStudent(data as Record<string, unknown>)
}

export async function insertStudent(
  row: Partial<StudentRecord> & { full_name: string }
): Promise<StudentRecord> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("students")
    .insert({
      full_name: row.full_name,
      english_name: row.english_name ?? null,
      grade: row.grade ?? null,
      school: row.school ?? null,
      status: row.status ?? "就讀中",
      parent_name: row.parent_name ?? null,
      parent_phone: row.parent_phone ?? null,
      student_code: row.student_code ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  return asStudent(data as Record<string, unknown>)
}

export async function updateStudent(
  id: string,
  patch: Partial<Omit<StudentRecord, "id" | "created_at">>
): Promise<StudentRecord> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("students")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return asStudent(data as Record<string, unknown>)
}

export async function deleteStudent(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("students").delete().eq("id", id)
  if (error) throw error
}

/** student_id -> 科目標籤（報讀班別） */
export async function fetchEnrollmentSubjectsByStudentIds(
  studentIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (!supabase || studentIds.length === 0) return map
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .select("student_id, classes ( subject )")
    .in("student_id", studentIds)
  if (error) {
    console.error(error)
    return map
  }
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const sid = String(r.student_id)
    const cls = r.classes as { subject?: string } | null
    const sub = cls?.subject
    if (!sub) continue
    const arr = map.get(sid) ?? []
    if (!arr.includes(sub)) arr.push(sub)
    map.set(sid, arr)
  }
  return map
}

export type EnrollmentWithClass = {
  id: string
  status: string
  enroll_date: string | null
  classId: string
  subject: string
  courseCode: string | null
  dayOfWeek: string | null
  timeSlot: string | null
  pricePerLesson: number | null
}

export async function fetchEnrollmentsForStudent(
  studentId: string
): Promise<EnrollmentWithClass[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .select(
      "id, status, enroll_date, class_id, classes ( subject, course_code, day_of_week, time_slot, price_per_lesson )"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const cls = r.classes as Record<string, unknown> | null
    return {
      id: String(r.id),
      status: String(r.status ?? "就讀中"),
      enroll_date: r.enroll_date != null ? String(r.enroll_date) : null,
      classId: String(r.class_id),
      subject: cls?.subject != null ? String(cls.subject) : "—",
      courseCode: cls?.course_code != null ? String(cls.course_code) : null,
      dayOfWeek: cls?.day_of_week != null ? String(cls.day_of_week) : null,
      timeSlot: cls?.time_slot != null ? String(cls.time_slot) : null,
      pricePerLesson:
        cls?.price_per_lesson != null ? Number(cls.price_per_lesson) : null,
    }
  })
}

export async function insertEnrollment(
  studentId: string,
  classId: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const today = localYmd()
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .insert({
      student_id: studentId,
      class_id: classId,
      status: "就讀中",
      enroll_date: today,
    })
    .select("id")
    .single()
  if (error) throw error
  const enrollmentId = String((data as { id: string }).id)
  const { error: evErr } = await supabase.from("enrollment_change_events").insert({
    student_id: studentId,
    class_id: classId,
    enrollment_id: enrollmentId,
    action: "enroll",
    effective_date: today,
    reason: null,
  })
  if (evErr) {
    await supabase.from("student_class_enrollments").delete().eq("id", enrollmentId)
    throw evErr
  }
}

export async function updateEnrollment(id: string, status: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("student_class_enrollments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
}

export async function deleteEnrollment(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("student_class_enrollments").delete().eq("id", id)
  if (error) throw error
}

/** 退讀：寫入增退紀錄後刪除報讀列（生效日為當日，依本機日曆） */
export async function withdrawStudentFromClass(opts: {
  enrollmentId: string
  studentId: string
  classId: string
  effectiveDate: string
  reason: string | null
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const reason = opts.reason?.trim() || null
  const { data: evRow, error: e1 } = await supabase
    .from("enrollment_change_events")
    .insert({
      student_id: opts.studentId,
      class_id: opts.classId,
      enrollment_id: opts.enrollmentId,
      action: "withdraw",
      effective_date: opts.effectiveDate,
      reason,
    })
    .select("id")
    .single()
  if (e1) throw e1
  const eventId = String((evRow as { id: string }).id)
  const { error: e2 } = await supabase
    .from("student_class_enrollments")
    .delete()
    .eq("id", opts.enrollmentId)
  if (e2) {
    await supabase.from("enrollment_change_events").delete().eq("id", eventId)
    throw e2
  }
}

export type ClassEnrollmentChangeEvent = {
  id: string
  action: "enroll" | "withdraw"
  effectiveDate: string
  reason: string | null
  studentId: string
  studentName: string
  createdAt: string
}

/** 班別詳情「增退紀錄」 */
export async function fetchEnrollmentChangeEventsForClass(
  classId: string
): Promise<ClassEnrollmentChangeEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("enrollment_change_events")
    .select(
      "id, action, effective_date, reason, created_at, student_id, students ( full_name )"
    )
    .eq("class_id", classId)
    .order("effective_date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) {
    console.warn("[fetchEnrollmentChangeEventsForClass]", error.message)
    return []
  }
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    return {
      id: String(r.id),
      action: r.action === "withdraw" ? "withdraw" : "enroll",
      effectiveDate: String(r.effective_date ?? "").slice(0, 10),
      reason: r.reason != null ? String(r.reason) : null,
      studentId: String(r.student_id),
      studentName: st?.full_name != null ? String(st.full_name) : "—",
      createdAt: String(r.created_at ?? ""),
    }
  })
}

export type ClassOption = {
  id: string
  subject: string
  courseCode: string | null
  label: string
}

export async function fetchClassOptions(): Promise<ClassOption[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("classes")
    .select("id, subject, course_code, day_of_week, time_slot")
    .order("subject")
  if (error) throw error
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    const sub = String(row.subject ?? "")
    const code = row.course_code != null ? String(row.course_code) : ""
    const day = row.day_of_week != null ? String(row.day_of_week) : ""
    const slot = row.time_slot != null ? String(row.time_slot) : ""
    const tail = [code, day, slot].filter(Boolean).join(" · ")
    return {
      id: String(row.id),
      subject: sub,
      courseCode: code || null,
      label: tail ? `${sub} ${tail}` : sub,
    }
  })
}

export type PaymentRow = {
  id: string
  receipt_number: string | null
  payment_date: string
  total_amount: number
  payment_method: string | null
  status: string
}

export async function fetchPaymentsForStudent(studentId: string): Promise<PaymentRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("payments")
    .select("id, receipt_number, payment_date, total_amount, payment_method, status")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    return {
      id: String(row.id),
      receipt_number: row.receipt_number != null ? String(row.receipt_number) : null,
      payment_date: String(row.payment_date ?? ""),
      total_amount: Number(row.total_amount ?? 0),
      payment_method: row.payment_method != null ? String(row.payment_method) : null,
      status: String(row.status ?? ""),
    }
  })
}

export async function insertPaymentForStudent(
  studentId: string,
  row: { total_amount: number; payment_date: string; payment_method?: string; status?: string }
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("payments").insert({
    student_id: studentId,
    payment_date: row.payment_date,
    total_amount: row.total_amount,
    payment_method: row.payment_method ?? "現金",
    status: row.status ?? "已收款",
  })
  if (error) throw error
}

export async function deletePayment(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("payments").delete().eq("id", id)
  if (error) throw error
}

export type AttendanceRow = {
  id: string
  classId: string
  attendance_date: string
  status: string
  classLabel: string
}

export async function fetchAttendanceForStudent(
  studentId: string
): Promise<AttendanceRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("attendance_details")
    .select("id, class_id, attendance_date, status, classes ( subject, course_code )")
    .eq("student_id", studentId)
    .order("attendance_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const cls = r.classes as Record<string, unknown> | null
    const sub = cls?.subject != null ? String(cls.subject) : "—"
    const code = cls?.course_code != null ? String(cls.course_code) : ""
    return {
      id: String(r.id),
      classId: r.class_id != null ? String(r.class_id) : "",
      attendance_date: String(r.attendance_date ?? ""),
      status: String(r.status ?? ""),
      classLabel: code ? `${sub} ${code}` : sub,
    }
  })
}

export type LeaveRow = {
  id: string
  classId: string
  leave_date: string
  leave_reason: string | null
  status: string
  classLabel: string
}

export async function fetchLeaveForStudent(studentId: string): Promise<LeaveRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("leave_makeup_records")
    .select("id, class_id, leave_date, leave_reason, status, classes ( subject, course_code )")
    .eq("student_id", studentId)
    .order("leave_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const cls = r.classes as Record<string, unknown> | null
    const sub = cls?.subject != null ? String(cls.subject) : "—"
    const code = cls?.course_code != null ? String(cls.course_code) : ""
    return {
      id: String(r.id),
      classId: r.class_id != null ? String(r.class_id) : "",
      leave_date: String(r.leave_date ?? ""),
      leave_reason: r.leave_reason != null ? String(r.leave_reason) : null,
      status: String(r.status ?? ""),
      classLabel: code ? `${sub} ${code}` : sub,
    }
  })
}

export type HistoryRow = {
  id: string
  kind: "status" | "payment" | "enrollment" | "withdrawal"
  title: string
  subtitle: string
  date: string
  tone: "green" | "blue" | "muted" | "amber"
}

export async function fetchStudentActivity(studentId: string): Promise<HistoryRow[]> {
  const items: HistoryRow[] = []
  if (!supabase) return items

  const [hist, pays, enrs, evWithdraw] = await Promise.all([
    supabase
      .from("student_status_history")
      .select("id, old_status, new_status, changed_date, reason, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, total_amount, payment_method, status, payment_date, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_class_enrollments")
      .select(
        "id, status, created_at, classes ( subject, course_code )"
      )
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollment_change_events")
      .select("id, effective_date, reason, classes ( subject, course_code )")
      .eq("student_id", studentId)
      .eq("action", "withdraw")
      .order("created_at", { ascending: false }),
  ])

  if (!hist.error && hist.data) {
    for (const r of hist.data as Record<string, unknown>[]) {
      items.push({
        id: `h-${r.id}`,
        kind: "status",
        title: `狀態變更：${String(r.old_status ?? "—")} → ${String(r.new_status ?? "")}`,
        subtitle: String(r.reason ?? ""),
        date: String(r.changed_date ?? r.created_at ?? "").slice(0, 10),
        tone: "muted",
      })
    }
  }
  if (!pays.error && pays.data) {
    for (const r of pays.data as Record<string, unknown>[]) {
      const amt = Number(r.total_amount ?? 0)
      items.push({
        id: `p-${r.id}`,
        kind: "payment",
        title: `繳費 HKD $${amt.toLocaleString("zh-Hant-TW")}`,
        subtitle: `${String(r.payment_date)} · ${String(r.payment_method ?? "")} · ${String(r.status ?? "")}`,
        date: String(r.payment_date ?? "").slice(0, 10),
        tone: "green",
      })
    }
  }
  if (!enrs.error && enrs.data) {
    for (const r of enrs.data as Record<string, unknown>[]) {
      const cls = r.classes as Record<string, unknown> | null
      const sub = cls?.subject != null ? String(cls.subject) : "—"
      const code = cls?.course_code != null ? String(cls.course_code) : ""
      items.push({
        id: `e-${r.id}`,
        kind: "enrollment",
        title: `加入班別：${sub}`,
        subtitle: `${code} · 狀態：${String(r.status ?? "")}`,
        date: String(r.created_at ?? "").slice(0, 10),
        tone: "blue",
      })
    }
  }
  if (evWithdraw.error) {
    console.warn("[fetchStudentActivity] enrollment_change_events:", evWithdraw.error.message)
  }
  if (evWithdraw.error) {
    console.warn("[fetchStudentActivity] enrollment_change_events:", evWithdraw.error.message)
  } else if (evWithdraw.data) {
    for (const r of evWithdraw.data as Record<string, unknown>[]) {
      const cls = r.classes as Record<string, unknown> | null
      const sub = cls?.subject != null ? String(cls.subject) : "—"
      const code = cls?.course_code != null ? String(cls.course_code) : ""
      const eff = String(r.effective_date ?? "").slice(0, 10)
      const reason = r.reason != null ? String(r.reason) : ""
      items.push({
        id: `w-${r.id}`,
        kind: "withdrawal",
        title: `退讀班別：${sub}${code ? `（${code}）` : ""}`,
        subtitle: [reason ? `原因：${reason}` : "", `生效日：${eff}`].filter(Boolean).join(" · "),
        date: eff,
        tone: "amber",
      })
    }
  }

  items.sort((a, b) => b.date.localeCompare(a.date))
  return items
}

/** 計入「已上課／應計堂數」的點名狀態（缺席與請假不計） */
function attendanceCountsAsBilledLesson(status: string): boolean {
  const s = status ?? ""
  if (s.includes("缺席")) return false
  if (s.includes("請假")) return false
  if (s.includes("假") && !s.includes("補")) return false
  return true
}

export type StudentTuitionArrearsInfo = {
  paidLessons: number
  attendedLessons: number
  /** 出席堂數 ≥ 已繳費堂數，且非兩者皆為 0 */
  showArrears: boolean
}

/**
 * 依 `payment_details.lesson_count`（僅計 `payments.status = 已收款`）與 `attendance_details` 點名列，
 * 判斷是否顯示「追收學費」：出席堂數 ≥ 已繳費堂數，且（已繳堂數或出席堂數）至少一項大於 0。
 */
export async function fetchStudentTuitionArrearsByStudentIds(
  studentIds: string[]
): Promise<Map<string, StudentTuitionArrearsInfo>> {
  const out = new Map<string, StudentTuitionArrearsInfo>()
  if (!supabase || studentIds.length === 0) return out
  for (const id of studentIds) {
    out.set(id, { paidLessons: 0, attendedLessons: 0, showArrears: false })
  }

  const paymentIdToStudent = new Map<string, string>()
  const idChunkPay = 200
  for (let i = 0; i < studentIds.length; i += idChunkPay) {
    const slice = studentIds.slice(i, i + idChunkPay)
    const { data: paidPayments, error: payErr } = await supabase
      .from("payments")
      .select("id, student_id")
      .in("student_id", slice)
      .eq("status", "已收款")
    if (payErr) {
      console.warn("[fetchStudentTuitionArrearsByStudentIds] payments", payErr.message)
      break
    }
    for (const row of paidPayments ?? []) {
      const r = row as Record<string, unknown>
      paymentIdToStudent.set(String(r.id), String(r.student_id ?? ""))
    }
  }
  {
    const paymentIds = [...paymentIdToStudent.keys()]
    const chunkSize = 150
    for (let i = 0; i < paymentIds.length; i += chunkSize) {
      const slice = paymentIds.slice(i, i + chunkSize)
      const { data: pdRows, error: pdErr } = await supabase
        .from("payment_details")
        .select("payment_id, lesson_count")
        .in("payment_id", slice)
      if (pdErr) {
        console.warn("[fetchStudentTuitionArrearsByStudentIds] payment_details", pdErr.message)
        break
      }
      for (const row of pdRows ?? []) {
        const r = row as Record<string, unknown>
        const pid = String(r.payment_id ?? "")
        const sid = paymentIdToStudent.get(pid)
        if (!sid || !out.has(sid)) continue
        const n = Number(r.lesson_count ?? 0)
        if (!Number.isFinite(n) || n <= 0) continue
        const cur = out.get(sid)!
        out.set(sid, { ...cur, paidLessons: cur.paidLessons + n })
      }
    }
  }

  const idChunk = 200
  for (let i = 0; i < studentIds.length; i += idChunk) {
    const slice = studentIds.slice(i, i + idChunk)
    const { data: attRows, error: attErr } = await supabase
      .from("attendance_details")
      .select("student_id, status")
      .in("student_id", slice)
    if (attErr) {
      console.warn("[fetchStudentTuitionArrearsByStudentIds] attendance_details", attErr.message)
      break
    }
    for (const row of attRows ?? []) {
      const r = row as Record<string, unknown>
      const sid = String(r.student_id ?? "")
      if (!out.has(sid)) continue
      if (!attendanceCountsAsBilledLesson(String(r.status ?? ""))) continue
      const cur = out.get(sid)!
      out.set(sid, { ...cur, attendedLessons: cur.attendedLessons + 1 })
    }
  }

  for (const [sid, v] of out) {
    const show =
      v.attendedLessons >= v.paidLessons && !(v.paidLessons === 0 && v.attendedLessons === 0)
    out.set(sid, { ...v, showArrears: show })
  }

  return out
}
