# Future Work: Banner Push/Scheduled Notifications

## Current Scope (already implemented)

- Banner is used for frontend operation notifications (success/info/warning/error).
- Notifications appear as fixed top banners, auto-dismiss after 2s (manual `X` still available), newest first.
- Optional action button supports in-app navigation (`前往XXXX頁面`).

## Future Scope (to be planned)

- Integrate backend push notifications (e.g. Supabase Realtime / queue / webhook).
- Add scheduled notifications for upcoming events (class changes, leave reminders, payment reminders).
- Support per-role targeting and routing payload (`admin` / `teacher` / `alien`).
- Add read/unread state and banner history panel.
- Add deduplication and rate limiting to avoid banner flooding.

## Suggested Technical Direction

1. Define backend notification schema (`id`, `tone`, `title`, `message`, `action_to`, `target_roles`, `created_at`, `expires_at`).
2. Create a notification service layer that maps backend payload to `AppBannerInput`.
3. Add a single subscription entrypoint in app bootstrap (with reconnect handling).
4. Keep current banner component as renderer; do not couple UI directly with transport.
