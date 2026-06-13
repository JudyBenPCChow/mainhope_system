const DEFAULT_ID_CHUNK = 80

/** PostgREST `.in()` with many UUIDs (especially with embeds) can exceed URL limits. */
export async function forEachIdChunk<T>(
 ids: string[],
 chunkSize: number,
 run: (slice: string[]) => Promise<T>
): Promise<T[]> {
 if (ids.length === 0) return []
 const size = chunkSize > 0 ? chunkSize : DEFAULT_ID_CHUNK
 const out: T[] = []
 for (let i = 0; i < ids.length; i += size) {
  out.push(await run(ids.slice(i, i + size)))
 }
 return out
}

export { DEFAULT_ID_CHUNK }
