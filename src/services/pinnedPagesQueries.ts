import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import { parseHiddenDefaultPaths, parsePinnedPagePaths } from "@/lib/pinnedPages"

type RawRow = { paths?: unknown; hidden_defaults?: unknown }

export type AppUserPinnedPagesPrefs = {
 paths: string[]
 hiddenDefaults: string[]
}

function requireClient() {
 if (!isSupabaseConfigured || !supabase) {
  throw new Error("尚未設定 Supabase")
 }
 return supabase
}

function mapRow(row: RawRow | null): AppUserPinnedPagesPrefs {
 return {
  paths: parsePinnedPagePaths(row?.paths),
  hiddenDefaults: parseHiddenDefaultPaths(row?.hidden_defaults),
 }
}

export async function fetchAppUserPinnedPagesPrefs(appUserId: string): Promise<AppUserPinnedPagesPrefs> {
 const client = requireClient()
 const { data, error } = await client
  .from("app_user_pinned_pages")
  .select("paths, hidden_defaults")
  .eq("app_user_id", appUserId)
  .maybeSingle()
 if (error) throw error
 return mapRow((data as RawRow | null) ?? null)
}

export async function saveAppUserPinnedPagesPrefs(
 appUserId: string,
 prefs: AppUserPinnedPagesPrefs
): Promise<AppUserPinnedPagesPrefs> {
 const client = requireClient()
 const next: AppUserPinnedPagesPrefs = {
  paths: parsePinnedPagePaths([...prefs.paths]),
  hiddenDefaults: parseHiddenDefaultPaths([...prefs.hiddenDefaults]),
 }
 const { data, error } = await client
  .from("app_user_pinned_pages")
  .upsert(
   {
    app_user_id: appUserId,
    paths: next.paths,
    hidden_defaults: next.hiddenDefaults,
    updated_at: new Date().toISOString(),
   },
   { onConflict: "app_user_id" }
  )
  .select("paths, hidden_defaults")
  .maybeSingle()
 if (error) throw error
 return mapRow((data as RawRow | null) ?? next)
}
