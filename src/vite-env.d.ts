/// <reference types="vite/client" />

/** 由 vite.config.ts `define` 注入的本次 build id。 */
declare const __APP_BUILD_ID__: string

interface ImportMetaEnv {
 readonly VITE_SUPABASE_URL?: string
 readonly VITE_SUPABASE_ANON_KEY?: string
 readonly VITE_PORTAL_BASE_URL?: string
 /** 廣告公開表單正規 origin，例如 https://ad.mainhope.edu.hk（設了才會從 system 轉址） */
 readonly VITE_AD_PUBLIC_ORIGIN?: string
 /** Cloudflare Turnstile site key；與 Edge secret 成對 */
 readonly VITE_TURNSTILE_SITE_KEY?: string
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
