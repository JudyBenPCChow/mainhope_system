/** 避免 ilike 模式注入：移除 % 與 _ */
export function sanitizeIlikeFragment(s: string): string {
 return s.replace(/%/g, "").replace(/_/g, "").trim()
}
