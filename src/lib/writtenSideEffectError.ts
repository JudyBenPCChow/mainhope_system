import { formatUnknownError } from "@/lib/formatUnknownError"

/**
 * 報讀列或排程列已寫入，但鑄池、到課宣告或結束試堂未完成。
 * 呼叫端應顯示，且不要回滾已寫入列。
 */
export class WrittenSideEffectError extends Error {
 readonly headline: string
 readonly detailNote?: string
 readonly enrollmentId?: string
 readonly scheduleId?: string

 constructor(
  headline: string,
  opts?: {
   cause?: unknown
   detail?: string
   enrollmentId?: string
   scheduleId?: string
  }
 ) {
  const detail = opts?.detail?.trim()
  const message = detail ? `${headline}（${detail}）` : headline
  super(message, opts?.cause !== undefined ? { cause: opts.cause } : undefined)
  this.name = "WrittenSideEffectError"
  this.headline = headline
  this.detailNote = detail || undefined
  this.enrollmentId = opts?.enrollmentId
  this.scheduleId = opts?.scheduleId
 }
}

export function writtenSideEffectDetail(err: unknown): string | undefined {
 const detail = formatUnknownError(err).trim()
 if (!detail || detail === "未知錯誤" || detail === "發生錯誤") return undefined
 return detail
}

/** 已是本類別則保留標題與原因，並可補上已寫入列的 id。 */
export function writtenSideEffectFrom(
 err: unknown,
 extras?: { scheduleId?: string; enrollmentId?: string; headline?: string }
): WrittenSideEffectError {
 if (err instanceof WrittenSideEffectError) {
  return new WrittenSideEffectError(extras?.headline ?? err.headline, {
   cause: err,
   detail: err.detailNote,
   scheduleId: extras?.scheduleId ?? err.scheduleId,
   enrollmentId: extras?.enrollmentId ?? err.enrollmentId,
  })
 }
 return new WrittenSideEffectError(
  extras?.headline ?? "排程已寫入，但到課宣告未能完成",
  {
   cause: err,
   detail: writtenSideEffectDetail(err),
   scheduleId: extras?.scheduleId,
   enrollmentId: extras?.enrollmentId,
  }
 )
}
