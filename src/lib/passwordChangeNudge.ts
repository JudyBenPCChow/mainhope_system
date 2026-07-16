/** sessionStorage key：登入成功後 Layout 消費一次，避免刷新重複彈 Banner */
export const MGMT_PWD_NUDGE_KEY = "mgmt_pwd_nudge"

export function setPasswordChangeNudge(): void {
  try {
    sessionStorage.setItem(MGMT_PWD_NUDGE_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}

/** 若有旗標則清除並回傳 true（本 session 只提醒一次） */
export function consumePasswordChangeNudge(): boolean {
  try {
    if (sessionStorage.getItem(MGMT_PWD_NUDGE_KEY) !== "1") return false
    sessionStorage.removeItem(MGMT_PWD_NUDGE_KEY)
    return true
  } catch {
    return false
  }
}
