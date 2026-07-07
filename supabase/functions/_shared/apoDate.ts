/** 香港時間今日 YYYY-MM-DD（Edge Function 用，注入 prompt 防 LLM 亂填日期） */
export function hkTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong" }).format(now)
}

export function hkTodayPromptLine(now = new Date()): string {
  return `系統今日日期（香港時間）：${hkTodayYmd(now)}。回答涉及「今日」時必須用此日期；不可自行假設其他日期。`
}
