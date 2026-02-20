# Browser Automation Runbook
> Last updated: 2026-02-18

## Setup
- Profile: `openclaw` (headless Chromium via Playwright)
- Port: 18800
- Executable: /home/openclaw/.cache/ms-playwright/chromium-1208/chrome-linux/chrome

## Starting the Browser
```
browser action=start profile=openclaw
browser action=open profile=openclaw targetUrl=https://...
```

## When Browser Breaks
Symptoms: "Can't reach browser control service", timeouts, "tab not found"

Fix sequence:
1. `browser action=stop profile=openclaw`
2. `exec: pkill -9 -f chrome` (may kill your own exec session — that's fine)
3. Wait 5 seconds
4. `browser action=start profile=openclaw`
5. `browser action=open profile=openclaw targetUrl=...`

## Key Rules

### Always get fresh refs
- After any navigation, take a new snapshot before using refs
- Refs are invalidated by page loads, JS changes, tab switches
- Don't reuse refs from a previous snapshot

### Wait for page loads
- After navigate, wait 3-5 seconds before snapshot
- Some pages (Heroku apps) are slow — wait 5-8 seconds
- Use `exec sleep N` then snapshot

### Use `type` action, not JavaScript `.value`
- `type` with a ref triggers proper input events
- `.value = ` via evaluate does NOT trigger change/input events
- Only use evaluate for things that aren't form inputs

### File uploads DON'T work reliably
- `browser upload` tool reports success but `files.length` is often 0
- This is a headless Chrome issue
- Workaround: use URL-based inputs instead of file uploads

### Port conflicts with cron/sub-agents
- Only ONE browser session can use port 18800
- If main session has browser open, cron jobs can't use it
- Sub-agents spawned from main share the same browser — they conflict
- Solution: close browser in main before spawning browser-dependent sub-agents

### Login sessions persist
- The openclaw browser profile saves cookies in user-data dir
- Login to architecturehelper.com persists across browser restarts
- If logged out, re-login at /users/sign_in: atlas@architecturehelper.com / AtlasArch2025!

## Architecture Helper Admin Routes
- `/admin/building_analyses` — building list, search, bulk actions
- `/admin/building_analyses/{id}` — building detail
- `/admin/building_analyses/{id}/edit` — edit building
- `/admin/places` — place management
- `/architecture_explorer/address_search` — building submission form

## Bulk Actions (Admin)
1. Search for buildings (by city name, style, address)
2. Check individual checkboxes (or Select All)
3. Select bulk action from dropdown: Make Visible / Make Hidden / Delete Selected
4. Click Apply
Note: Select All only selects visible page (20 per page), not all search results
