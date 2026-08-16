export type ListLoad<T> =
 | { status: "loading" }
 | { status: "ready"; rows: T[] }
 | { status: "error" }

export function listLoadKind<T>(load: ListLoad<T>): "loading" | "error" | "empty" | "rows" {
 if (load.status === "loading") return "loading"
 if (load.status === "error") return "error"
 return load.rows.length === 0 ? "empty" : "rows"
}

/** 失敗／載入中回 `null`（畫面「—」）；真 0 回 `0` */
export function listLoadCount<T>(load: ListLoad<T>, pick: (rows: T[]) => number = (rows) => rows.length): number | null {
 if (load.status !== "ready") return null
 return pick(load.rows)
}
