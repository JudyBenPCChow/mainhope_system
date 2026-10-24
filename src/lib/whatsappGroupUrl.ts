const WHATSAPP_GROUP_URL =
  /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{8,64}(\?[A-Za-z0-9_=&%.-]{0,80})?$/

export function readWhatsappGroupUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const url = value.trim()
  return WHATSAPP_GROUP_URL.test(url) ? url : null
}

/** `teachers ( teachers_private ( whatsapp_group_url ) )` 的嵌入列。 */
export function whatsappGroupUrlFromTeacherEmbed(teacher: Record<string, unknown> | null): string | null {
  if (!teacher) return null
  const raw = teacher.teachers_private
  const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null | undefined
  return readWhatsappGroupUrl(row?.whatsapp_group_url)
}
