- Test auth: open app, click google button, complete onboarding.
- Test messaging: use two browser profiles and two Google accounts, add each other, send messages.
- Test delete modes:
  - view once: open then blur tab, confirm deletion
  - timed: set short time, confirm countdown then deletion
  - hybrid: confirm either blur or timeout deletes
  - persistent: confirm 15-day expiry behavior
- Test key export/import: export in browser A, import in browser B.
- Test broadcast: select multiple friends, send once, verify each recipient gets an independently encrypted message.

Common issues:
- key not found: clear IndexedDB then re-import key
- message will not decrypt: keys do not match sender encryption expectation
- realtime not working: verify Supabase Realtime is enabled
