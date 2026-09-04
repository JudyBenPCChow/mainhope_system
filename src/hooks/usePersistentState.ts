import { useEffect, useRef, useState } from "react"

type StorageKind = "session" | "local"

function getStorage(kind: StorageKind): Storage | null {
 try {
  return kind === "local" ? localStorage : sessionStorage
 } catch {
  return null
 }
}

/**
 * 與 `useState` 介面相同，但會把值持久化到 `sessionStorage`（預設）或 `localStorage`。
 *
 * 主要用途：列表頁的篩選／檢視狀態。進出詳情頁（屬平行路由，會卸載列表元件）後，
 * 重新掛載仍能還原同樣的篩選，不會被重設為預設值。
 *
 * - 預設用 `sessionStorage`：同一分頁有效，關閉分頁即清除，避免跨工作階段殘留。
 * - `key` 請全應用唯一（建議前綴 `mgmt_<領域>_<欄位>`）。
 */
export function usePersistentState<T>(
 key: string,
 defaultValue: T,
 options?: { storage?: StorageKind; initialOverride?: T }
): [T, React.Dispatch<React.SetStateAction<T>>] {
 const kind = options?.storage ?? "session"
 // key 在元件生命週期內不應改變；以 ref 鎖定，避免 effect 因 key 變動誤寫。
 const keyRef = useRef(key)

 const [state, setState] = useState<T>(() => {
  if (options?.initialOverride !== undefined) return options.initialOverride
  const storage = getStorage(kind)
  if (!storage) return defaultValue
  try {
   const raw = storage.getItem(key)
   if (raw == null) return defaultValue
   return JSON.parse(raw) as T
  } catch {
   return defaultValue
  }
 })

 useEffect(() => {
  const storage = getStorage(kind)
  if (!storage) return
  try {
   storage.setItem(keyRef.current, JSON.stringify(state))
  } catch {
   /* 忽略寫入配額錯誤 */
  }
 }, [kind, state])

 return [state, setState]
}
