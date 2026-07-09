/** 與 Tailwind `md` 斷點對齊：寬度小於此值視為流動裝置版面 */
export const MOBILE_BREAKPOINT = 768

export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)` as const
