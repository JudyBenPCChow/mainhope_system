import { useEffect } from "react"

import { useAppBanner } from "@/lib/appBanner"
import { consumePasswordChangeNudge } from "@/lib/passwordChangeNudge"

/** Layout 掛載後消費一次登入旗標，顯示可略過的改密提醒 Banner */
export function usePasswordChangeNudgeBanner(): void {
  const { pushBanner } = useAppBanner()

  useEffect(() => {
    if (!consumePasswordChangeNudge()) return
    pushBanner({
      tone: "warning",
      title: "建議修改臨時密碼",
      message: "管理員已為你重設或建立臨時密碼。建議盡快在設定中改成自己記得的密碼。",
      action: { pageLabel: "設定", to: "/Settings" },
    })
  }, [pushBanner])
}
