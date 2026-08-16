import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type ScriptLibraryEntry = {
  id: string
  question: string
  answer: string
  tags: string[]
  sortOrder: number
  createdAt: string
  updatedAt: string
  createdByLabel: string | null
}

export type ScriptLibraryEntryInput = {
  question: string
  answer: string
  tags?: string[]
  sortOrder?: number
}

type RawRow = Record<string, unknown>

export function normalizeScriptTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const t = raw.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

function asEntry(row: RawRow): ScriptLibraryEntry {
  const tagsRaw = row.tags
  const tags = Array.isArray(tagsRaw)
    ? normalizeScriptTags(tagsRaw.map((t) => String(t ?? "")))
    : []
  return {
    id: String(row.id ?? ""),
    question: String(row.question ?? ""),
    answer: String(row.answer ?? ""),
    tags,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    createdByLabel: row.created_by_label != null ? String(row.created_by_label) : null,
  }
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("尚未設定 Supabase")
  }
  return supabase
}

export async function fetchScriptLibraryEntries(): Promise<ScriptLibraryEntry[]> {
  const client = requireClient()
  const { data, error } = await client
    .from("script_library_entries")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => asEntry(row as RawRow))
}

export async function createScriptLibraryEntry(
  input: ScriptLibraryEntryInput
): Promise<ScriptLibraryEntry> {
  const client = requireClient()
  const question = input.question.trim()
  const answer = input.answer.trim()
  if (!question) throw new Error("請填寫問題")
  if (!answer) throw new Error("請填寫回答")

  const { data, error } = await client
    .from("script_library_entries")
    .insert({
      question,
      answer,
      tags: normalizeScriptTags(input.tags ?? []),
      sort_order: input.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single()
  if (error) throw error
  return asEntry(data as RawRow)
}

export async function updateScriptLibraryEntry(
  id: string,
  input: ScriptLibraryEntryInput
): Promise<ScriptLibraryEntry> {
  const client = requireClient()
  const question = input.question.trim()
  const answer = input.answer.trim()
  if (!question) throw new Error("請填寫問題")
  if (!answer) throw new Error("請填寫回答")

  const patch: Record<string, unknown> = {
    question,
    answer,
    tags: normalizeScriptTags(input.tags ?? []),
    updated_at: new Date().toISOString(),
  }
  if (input.sortOrder != null) patch.sort_order = input.sortOrder

  const { data, error } = await client
    .from("script_library_entries")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return asEntry(data as RawRow)
}

export async function deleteScriptLibraryEntry(id: string): Promise<void> {
  const client = requireClient()
  const { error } = await client.from("script_library_entries").delete().eq("id", id)
  if (error) throw error
}
