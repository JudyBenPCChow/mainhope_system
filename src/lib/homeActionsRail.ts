/** 提醒列點擊後離開本頁時，常用功能不要收起。 */
export function homeActionsKeepOpenState(): { keepHomeActions: true } {
 return { keepHomeActions: true }
}

export function keepsHomeActionsOpen(state: unknown): boolean {
 return Boolean(
  state &&
   typeof state === "object" &&
   (state as { keepHomeActions?: unknown }).keepHomeActions
 )
}
