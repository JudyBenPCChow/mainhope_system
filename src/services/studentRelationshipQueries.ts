import { supabase } from "@/lib/supabaseClient"

/** Supabase / PostgREST 的 error 不是 Error 實例，直接 alert 會變成 [object Object] */
function throwQueryError(err: unknown): never {
  if (err instanceof Error) throw err
  if (err && typeof err === "object") {
    const o = err as { message?: string; details?: string; hint?: string; code?: string }
    const parts = [o.message, o.details, o.hint].filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    )
    if (parts.length) throw new Error(parts.join(" — "))
    if (o.code) throw new Error(`錯誤代碼 ${o.code}`)
  }
  throw new Error("操作失敗")
}

/** 正規化學生對（字典序）：與 DB check constraint 一致 */
export function canonicalStudentPair(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

export type StudentRelativeRow = {
  relationshipId: string
  relatedStudentId: string
  relatedName: string
  relatedCode: string | null
  relationship: string
}

export const RELATIONSHIP_PRESETS = [
  "姐妹",
  "兄弟",
  "兄妹",
  "姐弟",
  "同學",
  "朋友",
  "堂／表兄弟姊妹",
  "家人",
  "其他（自訂）",
] as const

export async function fetchRelativesForStudent(studentId: string): Promise<StudentRelativeRow[]> {
  if (!supabase) return []
  const { data: rows, error } = await supabase
    .from("student_relationships")
    .select("id, relationship, student_a_id, student_b_id")
    .or(`student_a_id.eq.${studentId},student_b_id.eq.${studentId}`)
  if (error) throwQueryError(error)

  const pairs = (rows ?? []).map((r) => {
    const row = r as Record<string, unknown>
    const a = String(row.student_a_id)
    const b = String(row.student_b_id)
    return {
      relationshipId: String(row.id),
      relatedStudentId: a === studentId ? b : a,
      relationship: String(row.relationship ?? ""),
    }
  })
  if (pairs.length === 0) return []

  const ids = [...new Set(pairs.map((p) => p.relatedStudentId))]
  const { data: studs, error: e2 } = await supabase
    .from("students")
    .select("id, full_name, student_code")
    .in("id", ids)
  if (e2) throwQueryError(e2)
  const smap = new Map(
    (studs ?? []).map((s) => {
      const row = s as Record<string, unknown>
      return [String(row.id), row] as const
    })
  )

  return pairs.map((p) => {
    const st = smap.get(p.relatedStudentId)
    return {
      relationshipId: p.relationshipId,
      relatedStudentId: p.relatedStudentId,
      relatedName: st?.full_name != null ? String(st.full_name) : "—",
      relatedCode: st?.student_code != null ? String(st.student_code) : null,
      relationship: p.relationship,
    }
  })
}

/** 建立或更新與另一學生的關係標籤（雙向共用一列） */
export async function saveStudentRelationship(
  studentId: string,
  otherStudentId: string,
  relationship: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const label = relationship.trim()
  if (!label) throw new Error("請選擇或填寫關係")
  const [a, b] = canonicalStudentPair(studentId, otherStudentId)
  if (a === b) throw new Error("不可與自己建立親友")

  const { error } = await supabase.from("student_relationships").upsert(
    {
      student_a_id: a,
      student_b_id: b,
      relationship: label,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_a_id,student_b_id" }
  )
  if (error) throwQueryError(error)
}

export async function updateStudentRelationshipLabel(
  relationshipId: string,
  relationship: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const label = relationship.trim()
  if (!label) throw new Error("關係不可為空")
  const { error } = await supabase
    .from("student_relationships")
    .update({ relationship: label, updated_at: new Date().toISOString() })
    .eq("id", relationshipId)
  if (error) throwQueryError(error)
}

export async function deleteStudentRelationship(relationshipId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("student_relationships").delete().eq("id", relationshipId)
  if (error) throwQueryError(error)
}
