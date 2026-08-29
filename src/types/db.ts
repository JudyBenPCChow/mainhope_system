import type { Database, Json } from "./database"

export type { Database, Json }

export type PublicTable = keyof Database["public"]["Tables"]
export type TableInsert<T extends PublicTable> = Database["public"]["Tables"][T]["Insert"]
export type TableUpdate<T extends PublicTable> = Database["public"]["Tables"][T]["Update"]
