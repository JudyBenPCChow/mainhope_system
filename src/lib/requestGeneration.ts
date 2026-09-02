/** 拒絕過期的並行請求結果（後發先至）。 */

export type RequestGenerationBox = {
 current: number
}

export function bumpRequestGeneration(box: RequestGenerationBox): number {
 box.current += 1
 return box.current
}

export function isLiveRequestGeneration(box: RequestGenerationBox, generation: number): boolean {
 return box.current === generation
}

/** generation 與查詢 key 都相符才套用結果；只靠 cancelled boolean 不足以表達跨 hook 契約。 */
export function isLiveKeyedRequest<T>(
 box: RequestGenerationBox,
 generation: number,
 currentKey: T,
 resultKey: T,
 keysEqual: (a: T, b: T) => boolean
): boolean {
 return isLiveRequestGeneration(box, generation) && keysEqual(currentKey, resultKey)
}
