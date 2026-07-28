/// <reference types="vite/client" />

/** 由 vite.config.ts `define` 注入的本次 build id。 */
declare const __APP_BUILD_ID__: string

interface ImportMetaEnv {
 readonly VITE_SUPABASE_URL?: string
 readonly VITE_SUPABASE_ANON_KEY?: string
 readonly VITE_PORTAL_BASE_URL?: string
 readonly VITE_BASE44_APP_ID?: string
 readonly VITE_BASE44_APP_BASE_URL?: string
 readonly VITE_BASE44_FUNCTIONS_VERSION?: string
}

interface ImportMeta {
 readonly env: ImportMetaEnv
}

/** Chromium File System Access API（收據寫入 OneDrive 資料夾用） */
type FileSystemPermissionMode = "read" | "readwrite"

interface FileSystemHandlePermissionDescriptor {
 mode?: FileSystemPermissionMode
}

interface FileSystemHandle {
 queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
 requestPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface DirectoryPickerOptions {
 id?: string
 mode?: FileSystemPermissionMode
 startIn?: FileSystemHandle | "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos"
}

interface Window {
 showDirectoryPicker?(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
}
