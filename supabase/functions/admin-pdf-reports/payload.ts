/** 試堂名單與追收學費的分類。規則對齊 scripts/export_2627_trial_followup.py
 *  與 scripts/export_2627_period2_tuition_chase.py，不要在這裡另訂口徑。
 */

export type Row = Record<string, unknown>

const GRADE_TO_CODE: Record<string, string> = {
  小一: "P1",
  小二: "P2",
  小三: "P3",
  小四: "P4",
  小五: "P5",
  小六: "P6",
  中一: "S1",
  中二: "S2",
  中三: "S3",
  中四: "S4",
  中五: "S5",
  中六: "S6",
}
const CODE_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(GRADE_TO_CODE).map(([label, code]) => [code, label]),
)
const GRADE_ORDER = ["P1", "P2", "P3", "P4", "P5", "P6", "S1", "S2", "S3", "S4", "S5", "S6"]
const FEE: Record<string, Record<string, number>> = {
  三日: { 中一: 2800, 中二: 2900, 中三: 3000 },
  四日: { 中一: 3100, 中二: 3200, 中三: 3300 },
  五日: { 中一: 3200, 中二: 3300, 中三: 3400 },
  七日: { 中一: 3400, 中二: 3500, 中三: 3600 },
}
const PRIMARY_FEE: Record<string, number> = { 三日: 2500, 四日: 2700, 五日: 2800 }
const GRADE_MAP: Record<string, string> = { ...CODE_TO_LABEL }
const YEAR_ID = "978d2726-efdd-48db-aae7-3598c463e5d8"
const PERIOD2 = new Set([
  "2026-09-29", "2026-09-30", "2026-10-02", "2026-10-04", "2026-10-05", "2026-10-06",
  "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12",
  "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-19",
  "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25",
  "2026-10-26", "2026-10-29", "2026-10-31", "2026-11-01",
])
const BILLABLE = new Set([
  "現場", "錄影回放", "zoom實時網課", "no show", "請假而不需補回",
  "即時直播", "不用補回", "出席", "網課", "補課", "線上",
])
const NONDEDUCT = new Set(["事假", "病假"])
const CROSS = new Set(["student_makeup", "class_reschedule"])
const ATTENDED = new Set(["現場", "出席"])

export type TrialPayload = {
  asOf: string
  periodCaption: string
  followUpRows: Record<string, string>[]
  upcomingRows: Record<string, string>[]
  otherFollowups: string[]
}

export type TuitionPayload = {
  asOf: string
  year: string
  periodLabel: string
  periodCaption: string
  studentCount: number
  poolCount: number
  totalAmount: number
  totalDueLessons: number
  rows: Record<string, unknown>[]
  homeworkBillingMonth: string
  homeworkRows: Record<string, unknown>[]
  homeworkStudentCount: number
  homeworkTotalAmount: number
  combinedStudentCount: number
  combinedTotalAmount: number
}

function num(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function text(value: unknown): string {
  return String(value ?? "").trim()
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function fmtHm(raw: unknown): string {
  const value = text(raw)
  if (value.length >= 5 && value[2] === ":") return value.slice(0, 5)
  return value
}

function fmtDay(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split("-").map((part) => Number(part))
  if (!y || !m || !d) return ymd
  return `${m}月${d}日`
}

function fmtDate(ymd: string | null): string {
  if (!ymd) return ""
  const parts = ymd.split("-")
  if (parts.length < 3) return ymd
  return `${Number(parts[1])}/${Number(parts[2])}`
}

function gradeCode(raw: unknown): string {
  const value = text(raw)
  if (GRADE_TO_CODE[value]) return GRADE_TO_CODE[value]
  const upper = value.toUpperCase()
  if (Object.values(GRADE_TO_CODE).some((code) => code.toUpperCase() === upper)) return upper
  return value || "—"
}

function contactOf(row: Row): string {
  const parent = text(row.parent_phone)
  if (parent) return `${text(row.parent_phone_country_code)} ${parent}`.trim()
  for (const key of ["whatsapp", "student_phone"]) {
    const value = text(row[key])
    if (value) return value
  }
  return "—"
}

function classLabel(row: Row): string {
  return text(row.course_name) || text(row.subject) || "—"
}

function timeLabel(row: Row): string {
  const start = fmtHm(row.start_time)
  const end = fmtHm(row.end_time)
  if (start && end) return `${start}-${end}`
  return start || end || ""
}

function isCancelled(row: Row): boolean {
  return text(row.status).includes("取消")
}

function attended(row: Row): boolean {
  const mark = text(row.attendance_status)
  if (ATTENDED.has(mark)) return true
  return !mark && text(row.status) === "已完成"
}

function isActiveEnrollment(value: unknown): boolean {
  return value === true || value === "true" || value === "t" || value === "1" || value === 1
}

function otherLine(row: Row): string {
  const day = fmtDay(text(row.trial_date))
  const name = text(row.student_name) || "（未命名）"
  const label = classLabel(row)
  if (isCancelled(row)) return `${day} ${name} ${label} 已取消`
  const outcome = text(row.outcome) || "open"
  if (outcome === "lost") {
    const reason = text(row.outcome_reason)
    return `${day} ${name} ${label} 已流失${reason ? `：${reason}` : ""}`
  }
  if (outcome === "other") {
    const reason = text(row.outcome_reason) || text(row.outcome_note)
    return `${day} ${name} ${label} 其他結果${reason ? `：${reason}` : ""}`
  }
  const mark = text(row.attendance_status)
  if (mark) return `${day} ${name} ${label} 點名為${mark}`
  return `${day} ${name} ${label} 尚未點名`
}

export function buildTrialPayload(asOf: string, trials: Row[]): TrialPayload {
  const monthStart = `${asOf.slice(0, 7)}-01`
  const follow: Array<Record<string, string> & { _sort: [string, string, string] }> = []
  const upcoming: Array<Record<string, string> & { _sort: [string, string, string] }> = []
  const other: string[] = []

  for (const row of trials) {
    if (isActiveEnrollment(row.enrolled_active)) continue
    const trialDay = text(row.trial_date).slice(0, 10)
    if (!trialDay) continue
    const base = {
      studentName: text(row.student_name),
      grade: gradeCode(row.student_grade),
      contact: contactOf(row),
      classLabel: classLabel(row),
      teacher: text(row.teacher_name) || "—",
      trialDate: fmtDay(trialDay),
      time: timeLabel(row),
      trialType: text(row.trial_type),
      payment: text(row.payment_status) || "未出單",
      actionHint: "跟進轉正",
      _sort: [trialDay, timeLabel(row), text(row.student_name)] as [string, string, string],
    }
    const outcome = text(row.outcome) || "open"
    const past = trialDay < asOf
    const future = trialDay >= asOf
    const inMonthOrFuture = trialDay >= monthStart || future
    if (isCancelled(row)) {
      if (inMonthOrFuture) other.push(otherLine(row))
      continue
    }
    if (outcome === "lost" || outcome === "other") {
      if (inMonthOrFuture) other.push(otherLine(row))
      continue
    }
    if (future) {
      upcoming.push(base)
      continue
    }
    if (past && attended(row)) {
      follow.push(base)
      continue
    }
    if (past && inMonthOrFuture) other.push(otherLine(row))
  }

  const sortKey = (item: { _sort: [string, string, string] }) => item._sort.join("\u0000")
  follow.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0))
  upcoming.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0))
  const strip = (item: Record<string, string> & { _sort?: unknown }) => {
    const { _sort: _ignored, ...rest } = item
    return rest
  }
  const parsed = asOf.split("-")
  return {
    asOf,
    periodCaption: `${Number(parsed[0])}年${Number(parsed[1])}月`,
    followUpRows: follow.map(strip),
    upcomingRows: upcoming.map(strip),
    otherFollowups: other,
  }
}

function normGradeCode(raw: unknown): string {
  const grade = text(raw).toUpperCase()
  if (grade.length === 2 && grade[0] === "F" && /\d/.test(grade[1] ?? "")) return `S${grade[1]}`
  return grade
}

function resolveGradeLabels(classGrade: unknown, gradeCodeValue: unknown, eligible: unknown): string[] {
  const elig: string[] = []
  for (const item of asList(eligible)) {
    const code = normGradeCode(item)
    if (GRADE_ORDER.includes(code)) elig.push(code)
  }
  const primary = normGradeCode(gradeCodeValue)
  if (GRADE_ORDER.includes(primary) && !elig.includes(primary)) elig.push(primary)
  const ordered = GRADE_ORDER.filter((code) => elig.includes(code))
  if (ordered.length > 0 && eligible != null && asList(eligible).length > 0) {
    return ordered.map((code) => CODE_TO_LABEL[code]).filter((label): label is string => Boolean(label))
  }
  const labels = [...new Set(asList(classGrade).map((item) => text(item).replace("級", "")).filter((item) => item in GRADE_TO_CODE))]
  labels.sort()
  if (labels.length > 0) return labels
  if (primary in CODE_TO_LABEL) return [CODE_TO_LABEL[primary]]
  return []
}

function namespaceFor(enr: Row): [string, string, boolean] {
  const classId = text(enr.class_id)
  if (text(enr.class_kind) === "private") return ["private", `class:${classId}`, false]
  const labels = resolveGradeLabels(enr.class_grade, enr.grade_code, enr.eligible_grade_codes)
  if (labels.length === 1) return ["group_specialist", GRADE_TO_CODE[labels[0]], true]
  return ["group_specialist", `class:${classId}`, false]
}

function priceOf(row: Row): number | null {
  if (row.class_price != null && num(row.class_price) > 0) return num(row.class_price)
  if (row.price_per_lesson_period_2 != null && num(row.price_per_lesson_period_2) > 0) {
    return num(row.price_per_lesson_period_2)
  }
  if (row.course_price != null && num(row.course_price) > 0) return num(row.course_price)
  return null
}

function covers(start: unknown, count: unknown, target: string): boolean {
  const ym = text(start).slice(0, 7)
  if (ym.length !== 7) return false
  let n = Math.trunc(num(count || 1))
  if (n < 1) n = 1
  let year = Number(ym.slice(0, 4))
  let month = Number(ym.slice(5, 7))
  const months: string[] = []
  for (let i = 0; i < n; i += 1) {
    let mm = month + i
    let yy = year + Math.floor((mm - 1) / 12)
    mm = ((mm - 1) % 12) + 1
    months.push(`${String(yy).padStart(4, "0")}-${String(mm).padStart(2, "0")}`)
  }
  return months.includes(target)
}

function hwFee(plan: unknown, grade: unknown, courseCode: unknown, month: string): number | null {
  const planText = text(plan)
  if (!planText) return null
  const code = text(courseCode).toUpperCase()
  const label = GRADE_MAP[text(grade)] ?? text(grade)
  const base = code.includes("HWKP")
    ? PRIMARY_FEE[planText]
    : FEE[planText]?.[label.startsWith("小") ? "中一" : label]
  if (base == null) return null
  if (month.endsWith("-12") || month.endsWith("-02")) return Math.round(base * 3 / 4)
  return base
}

function poolKey(parts: [string, string, string, string]): string {
  return parts.join("\u0000")
}

export function buildTuitionPayload(
  asOf: string,
  billingMonth: string,
  sources: { enrollments: Row[]; pools: Row[]; decls: Row[]; payments: Row[]; homework: Row[] },
): TuitionPayload {
  const studentMeta = new Map<string, { student_code: unknown; name: string; grade: unknown }>()
  const poolsAcc = new Map<string, {
    student_id: string
    year_id: string
    course_group: string
    namespace_key: string
    shares: boolean
    class_ids: string[]
    subjects: string[]
  }>()
  const classSubject = new Map<string, string>()
  const classUnits = new Map<string, number>()
  const classPrice = new Map<string, number>()

  for (const enrollment of sources.enrollments) {
    const sid = text(enrollment.student_id)
    if (!studentMeta.has(sid)) {
      studentMeta.set(sid, {
        student_code: enrollment.student_code,
        name: text(enrollment.full_name) || text(enrollment.english_name) || "（未命名）",
        grade: enrollment.student_grade,
      })
    }
    const [courseGroup, namespaceKey, shares] = namespaceFor(enrollment)
    const classId = text(enrollment.class_id)
    classSubject.set(classId, text(enrollment.subject) || text(enrollment.course_name) || "（未命名）")
    classUnits.set(classId, num(enrollment.lesson_slots_per_session) === 2 ? 2 : 1)
    const price = priceOf(enrollment)
    if (price != null) classPrice.set(classId, price)
    const key = poolKey([sid, text(enrollment.academic_year_id), courseGroup, namespaceKey])
    let acc = poolsAcc.get(key)
    if (!acc) {
      acc = {
        student_id: sid,
        year_id: text(enrollment.academic_year_id),
        course_group: courseGroup,
        namespace_key: namespaceKey,
        shares,
        class_ids: [],
        subjects: [],
      }
      poolsAcc.set(key, acc)
    }
    if (!acc.class_ids.includes(classId)) {
      acc.class_ids.push(classId)
      const subject = classSubject.get(classId) ?? "（未命名）"
      if (!acc.subjects.includes(subject)) acc.subjects.push(subject)
    }
  }

  const remaining = new Map<string, number>()
  const initial = new Map<string, number>()
  const poolById = new Map<string, Row>()
  for (const pool of sources.pools) {
    const key = poolKey([
      text(pool.student_id),
      text(pool.academic_year_id),
      text(pool.course_group) || "group_specialist",
      text(pool.namespace_key) || `class:${text(pool.class_id)}`,
    ])
    remaining.set(key, num(pool.remaining_lessons))
    initial.set(key, num(pool.initial_lessons))
    poolById.set(text(pool.pool_id), pool)
  }

  const applies = (decl: Row, pool: { student_id: string; class_ids: string[]; course_group: string; namespace_key: string; year_id: string }) => {
    if (pool.class_ids.includes(text(decl.class_id))) return true
    if (!CROSS.has(text(decl.source_event_type))) return false
    const poolId = text(decl.pool_id)
    const linked = poolId ? poolById.get(poolId) : undefined
    if (!linked) return false
    return text(linked.student_id) === pool.student_id
      && text(linked.course_group) === pool.course_group
      && text(linked.namespace_key) === pool.namespace_key
      && (!text(linked.academic_year_id) || text(linked.academic_year_id) === pool.year_id)
  }

  const paidByStudentClass = new Map<string, number>()
  for (const pay of sources.payments) {
    if (text(pay.academic_year_id) && text(pay.academic_year_id) !== YEAR_ID) continue
    if (!text(pay.class_id)) continue
    const description = text(pay.description)
    if (description.includes("功輔") || description.includes("月費") || description.includes("試堂")) continue
    if (num(pay.lesson_count) < 1) continue
    const key = `${text(pay.student_id)}\u0000${text(pay.class_id)}`
    paidByStudentClass.set(key, (paidByStudentClass.get(key) ?? 0) + num(pay.lesson_count))
  }

  const rowsOut: Record<string, unknown>[] = []
  for (const pool of poolsAcc.values()) {
    const remKey = poolKey([pool.student_id, pool.year_id, pool.course_group, pool.namespace_key])
    if (!remaining.has(remKey)) continue
    const rem = remaining.get(remKey) ?? 0
    const init = initial.get(remKey) ?? 0
    const pendingLines: Row[] = []
    let pendingUnits = 0
    const seen = new Set<string>()
    for (const decl of sources.decls) {
      if (text(decl.student_id) !== pool.student_id || !PERIOD2.has(text(decl.scheduled_date))) continue
      if (!applies(decl, pool) || seen.has(text(decl.schedule_id))) continue
      seen.add(text(decl.schedule_id))
      const units = classUnits.get(text(decl.class_id))
        ?? (num(decl.lesson_slots_per_session) === 2 ? 2 : 1)
      const status = text(decl.attendance_status)
      if (BILLABLE.has(status) || NONDEDUCT.has(status)) continue
      pendingUnits += units
      const subject = classSubject.get(text(decl.class_id)) || text(decl.subject) || "（未命名）"
      const price = classPrice.get(text(decl.class_id)) ?? priceOf(decl)
      pendingLines.push({
        subject,
        date: text(decl.scheduled_date),
        start: text(decl.start_time).slice(0, 5),
        end: text(decl.end_time).slice(0, 5),
        units,
        unit_price: price,
      })
    }
    const due = Math.max(0, pendingUnits - rem)
    if (due <= 0) continue
    let paidLessonsPool = 0
    for (const enrollment of sources.enrollments) {
      if (text(enrollment.student_id) !== pool.student_id) continue
      const [courseGroup, namespaceKey] = namespaceFor(enrollment)
      if (courseGroup === pool.course_group && namespaceKey === pool.namespace_key) {
        paidLessonsPool += paidByStudentClass.get(`${text(enrollment.student_id)}\u0000${text(enrollment.class_id)}`) ?? 0
      }
    }
    if (init <= 0 && paidLessonsPool <= 0) continue
    const arrears = Math.max(0, -rem)
    let need = due
    const chargeLines: Row[] = []
    const sortedPending = [...pendingLines].sort((a, b) => {
      const ak = `${text(a.date)}\u0000${text(a.start)}\u0000${text(a.subject)}`
      const bk = `${text(b.date)}\u0000${text(b.start)}\u0000${text(b.subject)}`
      return ak < bk ? -1 : ak > bk ? 1 : 0
    })
    for (const line of sortedPending) {
      if (need <= 0) break
      const take = Math.min(num(line.units), need)
      need -= take
      const unitPrice = line.unit_price == null ? null : num(line.unit_price)
      chargeLines.push({
        ...line,
        charge_units: take,
        amount: unitPrice == null ? null : Math.round(unitPrice * take * 100) / 100,
        kind: "本期還會扣",
      })
    }
    if (need > 0) {
      const per = [...pool.class_ids].sort().map((classId) => [classSubject.get(classId) ?? "（未命名）", classPrice.get(classId) ?? null] as const)
      let index = 0
      let left = need
      while (left > 0 && per.length > 0) {
        const [subject, price] = per[index % per.length]
        left -= 1
        index += 1
        chargeLines.push({
          subject,
          date: null,
          start: "",
          end: "",
          units: 1,
          unit_price: price,
          charge_units: 1,
          amount: price == null ? null : Math.round(price * 100) / 100,
          kind: "已上課未付款",
        })
      }
    }

    const bySubject = new Map<string, { units: number; amount: number; dates: string[]; unit_price: unknown }>()
    for (const line of chargeLines) {
      const subject = text(line.subject)
      const info = bySubject.get(subject) ?? { units: 0, amount: 0, dates: [], unit_price: null }
      info.units += num(line.charge_units)
      if (line.amount != null) info.amount += num(line.amount)
      if (line.date) info.dates.push(text(line.date))
      info.unit_price = line.unit_price
      bySubject.set(subject, info)
    }
    const detailParts = [...bySubject.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([subject, info]) => {
      const dates = info.dates.length
        ? [...new Set(info.dates)].sort().map((day) => fmtDate(day)).join("、")
        : "已上課未付款"
      return `${subject} ${fmtG(info.units)}堂（${dates}）`
    })
    const meta = studentMeta.get(pool.student_id) ?? { student_code: "", name: "（未命名）", grade: "" }
    const poolLabel = pool.shares
      ? `專科班（${CODE_TO_LABEL[pool.namespace_key] ?? pool.namespace_key}）`
      : pool.subjects.join("／")
    rowsOut.push({
      studentCode: text(meta.student_code),
      studentName: meta.name,
      grade: text(meta.grade),
      poolLabel,
      remaining: rem,
      pending: pendingUnits,
      dueLessons: due,
      arrears,
      amount: chargeLines.reduce((sum, line) => sum + (line.amount == null ? 0 : num(line.amount)), 0),
      detailSummary: detailParts.join("；"),
      chargeLines: chargeLines.map((line) => ({
        kind: line.kind,
        subject: line.subject,
        date: line.date,
        dateLabel: line.date ? fmtDate(text(line.date)) : "已上課未付款",
        time: text(line.start) ? `${text(line.start)}-${text(line.end)}` : "",
        units: line.charge_units,
        unitPrice: line.unit_price,
        amount: line.amount,
      })),
    })
  }
  rowsOut.sort((a, b) => {
    const ak = `${text(a.studentName)}\u0000${text(a.poolLabel)}`
    const bk = `${text(b.studentName)}\u0000${text(b.poolLabel)}`
    return ak < bk ? -1 : ak > bk ? 1 : 0
  })

  const hwByStudent = new Map<string, { pays: Row[]; meta: Row | null }>()
  for (const row of sources.homework) {
    const sid = text(row.student_id)
    const pack = hwByStudent.get(sid) ?? { pays: [], meta: null }
    if (!pack.meta) pack.meta = row
    if (text(row.coverage_start_month)) pack.pays.push(row)
    hwByStudent.set(sid, pack)
  }
  const homeworkRows: Record<string, unknown>[] = []
  for (const pack of hwByStudent.values()) {
    const meta = pack.meta
    if (!meta) continue
    const paid = pack.pays.some((pay) => covers(pay.coverage_start_month, pay.lesson_count, billingMonth))
    if (paid) continue
    const plan = text(meta.homework_day_plan)
    const amount = hwFee(plan, meta.grade, meta.course_code_full, billingMonth)
    if (amount == null) continue
    let lastNote = "未見功輔已收款覆蓋紀錄"
    if (pack.pays.length > 0) {
      const ends: string[] = []
      for (const pay of pack.pays) {
        const start = text(pay.coverage_start_month).slice(0, 7)
        const count = Math.trunc(num(pay.lesson_count || 1))
        if (!start || start.length < 7) continue
        let year = Number(start.slice(0, 4))
        let month = Number(start.slice(5, 7)) + Math.max(count, 1) - 1
        year += Math.floor((month - 1) / 12)
        month = ((month - 1) % 12) + 1
        ends.push(`${year}年${month}月`)
      }
      if (ends.length > 0) lastNote = `上次覆蓋至 ${ends.sort().at(-1)}`
    }
    const label = GRADE_MAP[text(meta.grade)] ?? text(meta.grade)
    const primaryNote = label.startsWith("小") && !text(meta.course_code_full).toUpperCase().includes("HWKP")
      ? "（小學生跟中一價）"
      : ""
    const division = text(meta.course_code_full).toUpperCase().includes("HWKP") ? "小學部" : "中學部"
    const [yearText, monthText] = billingMonth.split("-")
    homeworkRows.push({
      studentCode: text(meta.student_code),
      studentName: text(meta.full_name),
      grade: text(meta.grade),
      poolLabel: `功課輔導班（${division}）`,
      dayPlan: plan,
      billingMonth,
      billingMonthLabel: `${Number(yearText)}年${Number(monthText)}月`,
      amount,
      detailSummary: `功課輔導 · ${plan}檔 · ${Number(yearText)}年${Number(monthText)}月月費${primaryNote} @$${amount.toLocaleString("en-US")}`,
      lastPaidNote: lastNote,
      courseCode: text(meta.course_code_full),
    })
  }
  homeworkRows.sort((a, b) => {
    const ak = `${text(a.studentName)}\u0000${text(a.studentCode)}`
    const bk = `${text(b.studentName)}\u0000${text(b.studentCode)}`
    return ak < bk ? -1 : ak > bk ? 1 : 0
  })

  const specialistKeys = new Set(rowsOut.map((row) => `${text(row.studentCode)}${text(row.studentName)}`))
  const homeworkKeys = new Set(homeworkRows.map((row) => `${text(row.studentCode)}${text(row.studentName)}`))
  const totalAmount = rowsOut.reduce((sum, row) => sum + num(row.amount), 0)
  const homeworkTotal = homeworkRows.reduce((sum, row) => sum + num(row.amount), 0)
  return {
    asOf,
    year: "2627",
    periodLabel: "常規第二期",
    periodCaption: "常規第二期 · 9/29–11/1",
    studentCount: specialistKeys.size,
    poolCount: rowsOut.length,
    totalAmount,
    totalDueLessons: rowsOut.reduce((sum, row) => sum + num(row.dueLessons), 0),
    rows: rowsOut,
    homeworkBillingMonth: billingMonth,
    homeworkRows,
    homeworkStudentCount: homeworkRows.length,
    homeworkTotalAmount: homeworkTotal,
    combinedStudentCount: new Set([...specialistKeys, ...homeworkKeys]).size,
    combinedTotalAmount: totalAmount + homeworkTotal,
  }
}

function fmtG(value: number): string {
  const rounded = Math.round(value * 1000) / 1000
  return String(rounded)
}
