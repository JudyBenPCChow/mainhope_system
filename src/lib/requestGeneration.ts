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
