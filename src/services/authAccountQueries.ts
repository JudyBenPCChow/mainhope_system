import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export async function getMustChangePasswordFlag(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) return false
  return data.session.user.user_metadata?.must_change_password === true
}

export type ChangeOwnPasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ChangeOwnPasswordResult = { ok: true } | { ok: false; message: string }

export async function changeOwnPassword(
  input: ChangeOwnPasswordInput
): Promise<ChangeOwnPasswordResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "尚未設定 Supabase，暫時無法修改密碼。" }
  }

  const currentPassword = input.currentPassword
  const newPassword = input.newPassword
  if (!currentPassword) {
    return { ok: false, message: "請輸入目前密碼。" }
  }
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: "新密碼至少需要 8 個字元。" }
  }
  if (newPassword === currentPassword) {
    return { ok: false, message: "新密碼不可與目前密碼相同。" }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session?.user?.email) {
    return { ok: false, message: "登入已失效，請重新登入後再試。" }
  }

  const email = sessionData.session.user.email.trim().toLowerCase()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (verifyError) {
    return { ok: false, message: "目前密碼不正確。" }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: { must_change_password: false },
  })
  if (updateError) {
    return { ok: false, message: formatUnknownError(updateError) }
  }

  return { ok: true }
}
