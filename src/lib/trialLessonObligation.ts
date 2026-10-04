/**
 * 已綁該堂、學費已收款、未取消的試堂，該堂仍算試堂。
 * 「已完成」只表示試堂列表結案，不拿掉這一堂的義務。
 */
export function paidTrialObligesSchedule(status: string, paymentConfirmed: boolean): boolean {
 if (!paymentConfirmed) return false
 return !status.includes("取消")
}

/**
 * 扣堂選池：已有消耗紀錄沿用原池；否則該堂試堂票優先於報讀宣告。
 */
export function resolveConsumptionPoolId(input: {
 pinnedPoolId?: string | null
 paidTrialPoolId?: string | null
 declarationPoolId?: string | null
 fallbackPoolId?: string | null
}): string | null {
 if (input.pinnedPoolId) return input.pinnedPoolId
 if (input.paidTrialPoolId) return input.paidTrialPoolId
 if (input.declarationPoolId) return input.declarationPoolId
 return input.fallbackPoolId ?? null
}
