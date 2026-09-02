/** 與 Tailwind `md` 斷點對齊：寬度小於此值視為流動裝置版面 */
export const MOBILE_BREAKPOINT = 768

export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)` as const

/** 與 Tailwind `xl` 斷點對齊：排程右側預覽只在此寬度以上啟用 */
export const XL_BREAKPOINT = 1280

export const XL_MEDIA_QUERY = `(min-width: ${XL_BREAKPOINT}px)` as const
