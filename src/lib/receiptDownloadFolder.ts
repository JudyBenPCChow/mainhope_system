/**
 * 收據 PDF 下載目錄（接待處 OneDrive）。
 * 瀏覽器無法直接寫入絕對路徑；首次需以 File System Access API 選取此資料夾並授權，之後自動存入。
 */
export const RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH =
 "/Users/mainhope/Library/CloudStorage/OneDrive-MainHopeEducation/share drive - HK Main Hope Education/Reception/學生收據(綠悠軒)/2026 Summer"

const IDB_NAME = "mainhope-receipt-download"
const IDB_STORE = "handles"
const IDB_KEY = "receipt-folder-v1"
/** Chromium：記住上次選的目錄位置 */
const DIRECTORY_PICKER_ID = "mainhope-student-receipts-2026-summer"

type StoredHandleRecord = {
 handle: FileSystemDirectoryHandle
}

function supportsDirectoryPicker(): boolean {
 return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function"
}

function openIdb(): Promise<IDBDatabase> {
 return new Promise((resolve, reject) => {
  const req = indexedDB.open(IDB_NAME, 1)
  req.onerror = () => reject(req.error ?? new Error("無法開啟本機儲存"))
  req.onupgradeneeded = () => {
   const db = req.result
   if (!db.objectStoreNames.contains(IDB_STORE)) {
    db.createObjectStore(IDB_STORE)
   }
  }
  req.onsuccess = () => resolve(req.result)
 })
}

async function idbGetHandle(): Promise<FileSystemDirectoryHandle | null> {
 try {
  const db = await openIdb()
  try {
   const row = await new Promise<StoredHandleRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly")
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    req.onerror = () => reject(req.error ?? new Error("讀取資料夾授權失敗"))
    req.onsuccess = () => resolve(req.result as StoredHandleRecord | undefined)
   })
   return row?.handle ?? null
  } finally {
   db.close()
  }
 } catch {
  return null
 }
}

async function idbSetHandle(handle: FileSystemDirectoryHandle): Promise<void> {
 const db = await openIdb()
 try {
  await new Promise<void>((resolve, reject) => {
   const tx = db.transaction(IDB_STORE, "readwrite")
   tx.oncomplete = () => resolve()
   tx.onerror = () => reject(tx.error ?? new Error("儲存資料夾授權失敗"))
   tx.objectStore(IDB_STORE).put({ handle } satisfies StoredHandleRecord, IDB_KEY)
  })
 } finally {
  db.close()
 }
}

async function ensureWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
 const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" }
 const query = handle.queryPermission?.bind(handle)
 const request = handle.requestPermission?.bind(handle)
 if (!query || !request) {
  // 舊版實作可能無 permission API；嘗試直接寫入時再失敗
  return true
 }
 if ((await query(opts)) === "granted") return true
 if ((await request(opts)) === "granted") return true
 return false
}

/**
 * 取得可寫入的收據目錄。
 * 須在使用者點擊手勢內呼叫（首次選資料夾時）。
 * 不支援 File System Access API 時回傳 null。
 */
export async function ensureReceiptDownloadDirectory(options?: {
 /** 強制重新選擇資料夾 */
 forcePick?: boolean
}): Promise<FileSystemDirectoryHandle | null> {
 if (!supportsDirectoryPicker()) return null

 if (!options?.forcePick) {
  const stored = await idbGetHandle()
  if (stored) {
   try {
    if (await ensureWritePermission(stored)) return stored
   } catch {
    // 權限失效或 handle 無效 → 改請使用者重選
   }
  }
 }

 const picker = window.showDirectoryPicker
 if (!picker) return null
 const handle = await picker.call(window, {
  id: DIRECTORY_PICKER_ID,
  mode: "readwrite",
  startIn: "documents",
 })
 await idbSetHandle(handle)
 return handle
}

export async function writeBlobToDirectory(
 dir: FileSystemDirectoryHandle,
 filename: string,
 blob: Blob
): Promise<void> {
 const fileHandle = await dir.getFileHandle(filename, { create: true })
 const writable = await fileHandle.createWritable()
 try {
  await writable.write(blob)
 } finally {
  await writable.close()
 }
}

export function isReceiptFolderPickerAbortError(err: unknown): boolean {
 if (!err || typeof err !== "object") return false
 const name = "name" in err ? String((err as { name?: unknown }).name ?? "") : ""
 return name === "AbortError"
}
