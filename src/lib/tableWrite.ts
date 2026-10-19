import type { Database } from "@/types/database"

type PublicTableName = keyof Database["public"]["Tables"]

/**
 * 動態拼出的更新列。呼叫端只可放該表欄位；
 * `Record<string, unknown>` 無法通過產生型別的多餘欄位檢查。
 */
export function asTableUpdate<T extends PublicTableName>(
  row: Record<string, unknown>,
): Database["public"]["Tables"][T]["Update"] {
  return row as Database["public"]["Tables"][T]["Update"]
}

/** 動態拼出的新增列。用途同 `asTableUpdate`。 */
export function asTableInsert<T extends PublicTableName>(
  row: Record<string, unknown>,
): Database["public"]["Tables"][T]["Insert"] {
  return row as Database["public"]["Tables"][T]["Insert"]
}
