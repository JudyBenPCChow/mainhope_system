import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import {
  HW_DAY_LOG_ATTACHMENT_BUCKET,
  HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY,
  buildHwDayLogStoragePath,
  compressHwDayLogImage,
  hwDayLogAttachmentContentType,
  hwDayLogAttachmentValidationError,
  type HwDayLogAttachmentKind,
  type HwFollowupKind,
  type HwHandbookStatus,
} from "@/lib/homeworkDayLogAttachments"

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase 尚未設定")
  }
  return supabase
}

export type HomeworkDayLogRow = {
  id: string
  studentId: string
  logDate: string
  teacherId: string | null
  arrivedAt: string | null
  leftAt: string | null
  fullTwoHours: boolean | null
  hoursNote: string | null
  homeworkDone: boolean | null
  homeworkOwed: string | null
  hasDictation: boolean | null
  revisionNote: string | null
  handbookStatus: HwHandbookStatus | null
  parentNote: string | null
  staffOnlyNote: string | null
  updatedAt: string
}

export type HomeworkDayLogInput = {
  studentId: string
  logDate: string
  teacherId: string | null
  arrivedAt: string | null
  leftAt: string | null
  fullTwoHours: boolean | null
  hoursNote: string | null
  homeworkDone: boolean | null
  homeworkOwed: string | null
  hasDictation: boolean | null
  revisionNote: string | null
  handbookStatus: HwHandbookStatus | null
  parentNote: string | null
  /** 省略＝不改職員備註表；null／空字＝清除 */
  staffOnlyNote?: string | null
}

export type HomeworkFollowupRow = {
  id: string
  studentId: string
  kind: HwFollowupKind
  body: string
  endsOn: string
  completedAt: string | null
  createdAt: string
}

export type HomeworkDayLogAttachmentRow = {
  id: string
  logId: string
  studentId: string
  logDate: string
  kind: HwDayLogAttachmentKind
  storagePath: string
  fileName: string
  byteSize: number
  contentType: string | null
  createdAt: string
}

type Raw = Record<string, unknown>

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v)
}

function asStringOrNull(v: unknown): string | null {
  if (v == null) return null
  const s = typeof v === "string" ? v : String(v)
  return s.trim() ? s : null
}

function asBoolOrNull(v: unknown): boolean | null {
  if (v === true || v === false) return v
  return null
}

function mapLog(row: Raw, staffNote: string | null): HomeworkDayLogRow {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id),
    logDate: asString(row.log_date),
    teacherId: asStringOrNull(row.teacher_id),
    arrivedAt: asStringOrNull(row.arrived_at),
    leftAt: asStringOrNull(row.left_at),
    fullTwoHours: asBoolOrNull(row.full_two_hours),
    hoursNote: asStringOrNull(row.hours_note),
    homeworkDone: asBoolOrNull(row.homework_done),
    homeworkOwed: asStringOrNull(row.homework_owed),
    hasDictation: asBoolOrNull(row.has_dictation),
    revisionNote: asStringOrNull(row.revision_note),
    handbookStatus: (asStringOrNull(row.handbook_status) as HwHandbookStatus | null),
    parentNote: asStringOrNull(row.parent_note),
    staffOnlyNote: staffNote,
    updatedAt: asString(row.updated_at),
  }
}

function mapFollowup(row: Raw): HomeworkFollowupRow {
  return {
    id: asString(row.id),
    studentId: asString(row.student_id),
    kind: asString(row.kind) as HwFollowupKind,
    body: asString(row.body),
    endsOn: asString(row.ends_on),
    completedAt: asStringOrNull(row.completed_at),
    createdAt: asString(row.created_at),
  }
}

function mapAttachment(row: Raw): HomeworkDayLogAttachmentRow {
  return {
    id: asString(row.id),
    logId: asString(row.log_id),
    studentId: asString(row.student_id),
    logDate: asString(row.log_date),
    kind: asString(row.kind) as HwDayLogAttachmentKind,
    storagePath: asString(row.storage_path),
    fileName: asString(row.file_name),
    byteSize: Number(row.byte_size) || 0,
    contentType: asStringOrNull(row.content_type),
    createdAt: asString(row.created_at),
  }
}

async function attachStaffNotes(rows: Raw[]): Promise<HomeworkDayLogRow[]> {
  const client = requireClient()
  const ids = rows.map((r) => asString(r.id)).filter(Boolean)
  const noteByLog = new Map<string, string | null>()
  if (ids.length > 0) {
    const { data: notes, error: nErr } = await client
      .from("homework_student_day_log_staff_notes")
      .select("log_id, staff_only_note")
      .in("log_id", ids)
    if (nErr) throw new Error(nErr.message)
    for (const n of notes ?? []) {
      const raw = n as Raw
      noteByLog.set(asString(raw.log_id), asStringOrNull(raw.staff_only_note))
    }
  }
  return rows.map((r) => mapLog(r, noteByLog.get(asString(r.id)) ?? null))
}

export async function listHomeworkDayLogsForDate(
  logDate: string
): Promise<HomeworkDayLogRow[]> {
  const client = requireClient()
  const { data, error } = await client
    .from("homework_student_day_logs")
    .select("*")
    .eq("log_date", logDate)
  if (error) throw new Error(error.message)
  return attachStaffNotes((data ?? []) as Raw[])
}

/** 單一學生時間軸：依日期新→舊。職員備註僅在有權限時才會回傳。 */
export async function listHomeworkDayLogsForStudent(
  studentId: string,
  opts?: { limit?: number }
): Promise<HomeworkDayLogRow[]> {
  const client = requireClient()
  const limit = Math.min(Math.max(opts?.limit ?? 60, 1), 200)
  const { data, error } = await client
    .from("homework_student_day_logs")
    .select("*")
    .eq("student_id", studentId)
    .order("log_date", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return attachStaffNotes((data ?? []) as Raw[])
}

export async function listHomeworkDayLogAttachmentsForStudent(
  studentId: string,
  opts?: { limit?: number }
): Promise<HomeworkDayLogAttachmentRow[]> {
  const client = requireClient()
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500)
  const { data, error } = await client
    .from("homework_student_day_log_attachments")
    .select("*")
    .eq("student_id", studentId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return ((data ?? []) as Raw[]).map(mapAttachment)
}

/**
 * 漸進填寫：允許先建檔（只到／離），其餘欄可空。
 * 僅當明確選「否」時，才要求原因／欠什麼。
 */
export async function upsertHomeworkDayLog(
  input: HomeworkDayLogInput
): Promise<HomeworkDayLogRow> {
  const client = requireClient()
  if (input.fullTwoHours === false && !input.hoursNote?.trim()) {
    throw new Error("未上足兩小時請填寫原因")
  }
  if (input.homeworkDone === false && !input.homeworkOwed?.trim()) {
    throw new Error("未完成功課請填寫欠什麼")
  }

  const payload = {
    student_id: input.studentId,
    log_date: input.logDate,
    teacher_id: input.teacherId,
    arrived_at: input.arrivedAt,
    left_at: input.leftAt,
    full_two_hours: input.fullTwoHours,
    hours_note: input.hoursNote?.trim() || null,
    homework_done: input.homeworkDone,
    homework_owed: input.homeworkOwed?.trim() || null,
    has_dictation: input.hasDictation,
    revision_note: input.revisionNote?.trim() || null,
    handbook_status: input.handbookStatus,
    parent_note: input.parentNote?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await client
    .from("homework_student_day_logs")
    .upsert(payload, { onConflict: "student_id,log_date" })
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  const log = data as Raw
  const logId = asString(log.id)

  // staff_only_note：僅在明確傳入時覆寫；undefined 表示這次不碰職員備註表
  if (input.staffOnlyNote !== undefined) {
    const note = input.staffOnlyNote?.trim() || null
    if (note) {
      const { error: nErr } = await client
        .from("homework_student_day_log_staff_notes")
        .upsert({
          log_id: logId,
          staff_only_note: note,
          updated_at: new Date().toISOString(),
        })
      if (nErr) throw new Error(nErr.message)
    } else {
      await client.from("homework_student_day_log_staff_notes").delete().eq("log_id", logId)
    }
    return mapLog(log, note)
  }

  const [withNote] = await attachStaffNotes([log])
  return withNote!
}

export async function getHomeworkDayLogForStudentDate(
  studentId: string,
  logDate: string
): Promise<HomeworkDayLogRow | null> {
  const client = requireClient()
  const { data, error } = await client
    .from("homework_student_day_logs")
    .select("*")
    .eq("student_id", studentId)
    .eq("log_date", logDate)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const [row] = await attachStaffNotes([data as Raw])
  return row ?? null
}

/** 名冊／Dialog 一鍵到離：只動時間戳，不洗掉已填欄位。 */
export async function stampHomeworkDayLogClock(opts: {
  studentId: string
  logDate: string
  teacherId?: string | null
  which: "arrived" | "left"
  /** true＝清除該時間；預設寫入當下 */
  clear?: boolean
}): Promise<HomeworkDayLogRow> {
  const client = requireClient()
  const existing = await getHomeworkDayLogForStudentDate(opts.studentId, opts.logDate)
  const stamp = opts.clear ? null : new Date().toISOString()
  const col = opts.which === "arrived" ? "arrived_at" : "left_at"

  if (!existing) {
    const payload = {
      student_id: opts.studentId,
      log_date: opts.logDate,
      teacher_id: opts.teacherId ?? null,
      arrived_at: opts.which === "arrived" ? stamp : null,
      left_at: opts.which === "left" ? stamp : null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await client
      .from("homework_student_day_logs")
      .insert(payload)
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    return mapLog(data as Raw, null)
  }

  const { data, error } = await client
    .from("homework_student_day_logs")
    .update({
      [col]: stamp,
      ...(opts.teacherId && !existing.teacherId ? { teacher_id: opts.teacherId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return mapLog(data as Raw, existing.staffOnlyNote)
}

export async function deleteHomeworkDayLog(logId: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from("homework_student_day_logs").delete().eq("id", logId)
  if (error) throw new Error(error.message)
}

export async function listActiveHomeworkFollowups(opts: {
  studentIds?: string[]
  asOfDate: string
}): Promise<HomeworkFollowupRow[]> {
  const client = requireClient()
  let q = client
    .from("homework_student_followups")
    .select("*")
    .is("completed_at", null)
    .gte("ends_on", opts.asOfDate)
    .order("ends_on", { ascending: true })
  if (opts.studentIds && opts.studentIds.length > 0) {
    q = q.in("student_id", opts.studentIds)
  }
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return ((data ?? []) as Raw[]).map(mapFollowup)
}

export async function createHomeworkFollowup(input: {
  studentId: string
  kind: HwFollowupKind
  body: string
  endsOn: string
}): Promise<HomeworkFollowupRow> {
  const client = requireClient()
  const body = input.body.trim()
  if (!body) throw new Error("請填寫持續項目內容")
  if (!input.endsOn) throw new Error("請填寫結束日")
  const { data, error } = await client
    .from("homework_student_followups")
    .insert({
      student_id: input.studentId,
      kind: input.kind,
      body,
      ends_on: input.endsOn,
    })
    .select("*")
    .single()
  if (error) throw new Error(error.message)
  return mapFollowup(data as Raw)
}

export async function completeHomeworkFollowup(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from("homework_student_followups")
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function fetchHomeworkStandingInstructions(
  studentId: string
): Promise<string> {
  const client = requireClient()
  const { data, error } = await client
    .from("homework_student_profiles")
    .select("standing_instructions")
    .eq("student_id", studentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return asStringOrNull((data as Raw | null)?.standing_instructions) ?? ""
}

export async function upsertHomeworkStandingInstructions(
  studentId: string,
  text: string
): Promise<void> {
  const client = requireClient()
  const { error } = await client.from("homework_student_profiles").upsert({
    student_id: studentId,
    standing_instructions: text.trim() || null,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function listHomeworkDayLogAttachments(
  logId: string
): Promise<HomeworkDayLogAttachmentRow[]> {
  const client = requireClient()
  const { data, error } = await client
    .from("homework_student_day_log_attachments")
    .select("*")
    .eq("log_id", logId)
    .order("created_at", { ascending: true })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Raw[]).map(mapAttachment)
}

export async function countHomeworkDayLogAttachmentsForStudentDate(
  studentId: string,
  logDate: string
): Promise<number> {
  const client = requireClient()
  const { count, error } = await client
    .from("homework_student_day_log_attachments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("log_date", logDate)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function uploadHomeworkDayLogAttachment(opts: {
  logId: string
  studentId: string
  logDate: string
  academicYearLabel: string
  kind: HwDayLogAttachmentKind
  file: File
}): Promise<HomeworkDayLogAttachmentRow> {
  const client = requireClient()
  const existing = await countHomeworkDayLogAttachmentsForStudentDate(
    opts.studentId,
    opts.logDate
  )
  if (existing >= HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY) {
    throw new Error(`每日最多上載 ${HW_DAY_LOG_ATTACHMENT_MAX_PER_DAY} 張相片`)
  }

  let file = opts.file
  const preErr = hwDayLogAttachmentValidationError(file)
  if (preErr) throw new Error(preErr)
  file = await compressHwDayLogImage(file)
  const validation = hwDayLogAttachmentValidationError(file)
  if (validation) throw new Error(validation)
  const contentType = hwDayLogAttachmentContentType(file)
  if (!contentType) throw new Error("不支援的檔案類型")

  const objectPath = buildHwDayLogStoragePath({
    academicYearLabel: opts.academicYearLabel,
    studentId: opts.studentId,
    logDate: opts.logDate,
    kind: opts.kind,
    fileName: file.name,
  })

  const { error: uploadErr } = await client.storage
    .from(HW_DAY_LOG_ATTACHMENT_BUCKET)
    .upload(objectPath, file, { contentType, upsert: false })
  if (uploadErr) throw new Error(uploadErr.message)

  const displayName = file.name.replace(/^.*[/\\]/, "").slice(0, 180) || "photo"
  const { data, error } = await client
    .from("homework_student_day_log_attachments")
    .insert({
      log_id: opts.logId,
      student_id: opts.studentId,
      log_date: opts.logDate,
      kind: opts.kind,
      storage_path: objectPath,
      file_name: displayName,
      byte_size: file.size,
      content_type: contentType,
    })
    .select("*")
    .single()

  if (error) {
    await client.storage.from(HW_DAY_LOG_ATTACHMENT_BUCKET).remove([objectPath])
    throw new Error(error.message)
  }
  return mapAttachment(data as Raw)
}

export async function getHomeworkDayLogAttachmentSignedUrl(
  path: string
): Promise<string> {
  const client = requireClient()
  const p = path.trim()
  if (!p) throw new Error("沒有附件")
  const { data, error } = await client.storage
    .from(HW_DAY_LOG_ATTACHMENT_BUCKET)
    .createSignedUrl(p, 3600)
  if (error) throw new Error(error.message)
  if (!data?.signedUrl) throw new Error("無法開啟附件")
  return data.signedUrl
}

export async function deleteHomeworkDayLogAttachment(
  attachment: HomeworkDayLogAttachmentRow
): Promise<void> {
  const client = requireClient()
  const { error } = await client
    .from("homework_student_day_log_attachments")
    .delete()
    .eq("id", attachment.id)
  if (error) throw new Error(error.message)
  await client.storage
    .from(HW_DAY_LOG_ATTACHMENT_BUCKET)
    .remove([attachment.storagePath])
}
