/** 收款登記深連結：帶上剛建立的試堂或報讀，避免到頁再選一次班別。 */

export type TrialPayQuery = "free" | "half" | "full"

export type PaymentReceiveTrial = {
  classId: string
  trialType?: string | null
}

export type PaymentReceiveTrialLine = {
  classId: string
  trialPay: TrialPayQuery
}

export type PaymentReceivePref =
  | { kind: "trial"; lines: PaymentReceiveTrialLine[] }
  | { kind: "enrollment"; classIds: string[] }

export function trialPayQueryValue(trialType: string | null | undefined): TrialPayQuery {
  if (trialType === "半價試堂") return "half"
  if (trialType === "原價試堂") return "full"
  return "free"
}

export function paymentsReceiveHref(input: {
  studentId: string
  trials?: PaymentReceiveTrial[]
  enrollmentClassIds?: string[]
}): string {
  const q = new URLSearchParams()
  q.set("studentId", input.studentId)
  q.set("mode", "receive")
  const trials = dedupeTrials(input.trials ?? [])
  if (trials.length > 0) {
    for (const trial of trials) {
      q.append("trialPay", trialPayQueryValue(trial.trialType))
      if (trial.classId) q.append("classId", trial.classId)
    }
  } else {
    for (const classId of uniqueIds(input.enrollmentClassIds ?? [])) {
      q.append("classId", classId)
    }
  }
  return `/Payments?${q.toString()}`
}

/** 讀收款網址。有試堂類型時一班一列；只有班別時走報讀預填。 */
export function parsePaymentReceivePref(params: URLSearchParams): PaymentReceivePref | null {
  const classIds = uniqueIds(params.getAll("classId"))
  const trialPays = params
    .getAll("trialPay")
    .map((value) => value.trim())
    .filter(isTrialPay)
  if (trialPays.length > 0) {
    if (classIds.length === 0) {
      return {
        kind: "trial",
        lines: trialPays.map((trialPay) => ({ classId: "", trialPay })),
      }
    }
    return {
      kind: "trial",
      lines: classIds.map((classId, index) => ({
        classId,
        trialPay: trialPays[Math.min(index, trialPays.length - 1)]!,
      })),
    }
  }
  if (classIds.length === 0) return null
  return { kind: "enrollment", classIds }
}

function dedupeTrials(trials: PaymentReceiveTrial[]): PaymentReceiveTrial[] {
  const seen = new Set<string>()
  const withClass: PaymentReceiveTrial[] = []
  for (const trial of trials) {
    const classId = trial.classId.trim()
    if (!classId || seen.has(classId)) continue
    seen.add(classId)
    withClass.push({ classId, trialType: trial.trialType })
  }
  if (withClass.length > 0) return withClass
  const blank = trials.find((trial) => !trial.classId.trim())
  return blank ? [{ classId: "", trialType: blank.trialType }] : []
}

function uniqueIds(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const id = raw.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

function isTrialPay(value: string): value is TrialPayQuery {
  return value === "free" || value === "half" || value === "full"
}
