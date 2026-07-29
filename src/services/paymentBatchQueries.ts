import { supabase } from "@/lib/supabaseClient"

export async function createPaymentBatch(paymentDate: string, notes?: string | null): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("payment_batches")
  .insert({ payment_date: paymentDate, notes: notes?.trim() || null })
  .select("id")
  .single()
 if (error) throw error
 return String((data as { id: string }).id)
}

export async function countPaymentsInBatch(batchId: string): Promise<number> {
 if (!supabase) return 0
 const { count, error } = await supabase
  .from("payments")
  .select("id", { count: "exact", head: true })
  .eq("payment_batch_id", batchId)
  .neq("status", "作廢")
 if (error) throw error
 return count ?? 0
}

export type BatchPaymentMember = {
 paymentId: string
 studentId: string
 classIds: string[]
}

export async function fetchBatchPaymentMembers(batchId: string): Promise<BatchPaymentMember[]> {
 if (!supabase) return []
 const { data: pays, error: e1 } = await supabase
  .from("payments")
  .select("id, student_id")
  .eq("payment_batch_id", batchId)
  .neq("status", "作廢")
 if (e1) throw e1
 const members: BatchPaymentMember[] = []
 for (const pay of pays ?? []) {
  const p = pay as { id: string; student_id: string }
  const { data: det, error: e2 } = await supabase
   .from("payment_details")
   .select("class_id")
   .eq("payment_id", p.id)
  if (e2) throw e2
  const classIds = (det ?? [])
   .map((d) => (d as { class_id: unknown }).class_id)
   .filter((id): id is string => id != null)
   .map(String)
  members.push({
   paymentId: String(p.id),
   studentId: String(p.student_id),
   classIds,
  })
 }
 return members
}
