# Maintenance Mode (Kill Switch) — Setup Guide

A global switch that stops the **frontend** from working, with a custom message shown to
all users. Toggled by editing a public GitHub Gist — no code changes, no redeploys, no
Firebase account, no quotas.

---

## 1. One-time setup (GitHub Gist)

1. Go to <https://gist.github.com> (log in if needed).
2. Create a **public** Gist named `maintenance.json` with this content:

   ```json
   {
     "maintenance_enabled": false,
     "maintenance_title": "Site Under Maintenance",
     "maintenance_message": "We're performing scheduled maintenance. Please check back soon.",
     "maintenance_retry_after": 300
   }
   ```
3. Copy the **Raw** URL — it looks like:
   `https://gist.githubusercontent.com/<your-user>/<gist-id>/raw/maintenance.json`

   > **Important:** Use the `/raw/` URL, **not** the gist page URL. The Gist must be **public**.

## 2. One-time setup (this repo)

1. Paste the raw URL into `.env` (or your deploy platform's env vars):

   ```dotenv
   VITE_MAINTENANCE_CONFIG_URL=https://gist.githubusercontent.com/<you>/<id>/raw/maintenance.json
   ```

   No trailing slash.

2. Deploy. Vercel: **Settings → Environment Variables** → add `VITE_MAINTENANCE_CONFIG_URL`.
   GitHub Pages: add as a repository secret with a `VITE_` prefix in the build workflow.

> The URL is **not a secret** — it's a public Gist. Safe to ship in the client bundle.

## 3. Using the kill switch

**To stop the site:**
1. Open your Gist on GitHub → click the pencil (Edit).
2. Change `"maintenance_enabled": false` to `"maintenance_enabled": true`.
3. Click **Update public gist**.

Users see the overlay within **~30 seconds** (or immediately on next page load). The countdown
on the overlay auto-refreshes, so an open tab picks it up on its own.

**To bring the site back:** edit the Gist, set `maintenance_enabled: false`, save.

**To change the message:** edit `maintenance_title` / `maintenance_message` and save.
No deploy needed.

## 4. Local testing

Without a Gist configured, use the dev-only URL override:

```
http://localhost:5174/Web/?maintenance=1
```

Optional query params:

```
?maintenance=1
&maintenance_title=Custom%20Title
&maintenance_message=Custom%20message
&maintenance_retry=60
```

This override is compiled out of production builds (`import.meta.env.DEV` guard).

---

## Behaviour

- **Blocks the frontend only.** The backend keeps running; only the web app is halted.
- **No API calls fire** while maintenance is on — the page is held back (spinner) until the
  flag is known, then replaced by the overlay.
- **Fails open.** If the Gist is unreachable or the fetch times out (4s), the app renders
  normally. A CDN/GitHub outage never takes the site down.
- **Open tabs poll** every 60s in production (15s in dev) so the overlay appears without
  a reload.
- **Widgets** (`/widgets/...` routes) are also covered — the overlay replaces them.
- **Zero quota.** GitHub Gist CDN has no rate limit for this usage pattern. The shared
  time-bucket cache-buster keeps origin load flat (one hit per 30s window, not per user).

## Parameters reference

| Key                      | Type    | Default                                          |
|--------------------------|---------|--------------------------------------------------|
| `maintenance_enabled`    | Boolean | `false`                                          |
| `maintenance_title`      | String  | `Site Under Maintenance`                         |
| `maintenance_message`    | String  | `We're performing scheduled maintenance. Please check back soon.` |
| `maintenance_retry_after`| Number  | `300` (seconds between auto-refreshes)           |

## Files

| File                                  | Role                                        |
|---------------------------------------|---------------------------------------------|
| `src/services/maintenance-config.ts`   | Gist fetch + parsing + shared-bucket cache  |
| `src/hooks/useMaintenanceMode.ts`      | Fetches/polls the flag, exposes state        |
| `src/components/MaintenanceOverlay.tsx`| Full-screen overlay UI                       |
| `src/App.tsx`                          | Gates page rendering on the flag             |
| `.env.example`                         | Env var template                             |

---

## Why Gist instead of Firebase Remote Config?

| | Firebase Remote Config | GitHub Gist |
|---|---|---|
| **Free tier quota** | 100,000 fetch requests/day → **throttles** silently | **None** |
| **Cost at scale** | $0.06 / 10K over 100K/day | **Free** |
| **Admin UI** | Firebase Console | Gist edit page |
| **Propagation latency** | Configurable (min 1s) | ~30s (Fastly `max-age=300` + bucket cache-buster) |
| **Setup time** | Create project, add app, copy config | Create Gist, copy raw URL |
| **Auth required** | Yes (Google account) | Yes (GitHub account) |

The Gist approach was chosen because:
1. The quota risk is real — a popular frontend can exceed 100K fetches/day with a 60s poll.
2. Propagation at ~30s is acceptable for a maintenance banner.
3. Zero infrastructure, zero cost, zero maintenance.