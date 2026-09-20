# Plan 001 — Harden CORS: Remove Wildcard Origin

**Written against commit:** `90c608b`  
**Category:** Security  
**Effort:** S  
**Risk of fix:** Low — CORS is a browser-side check; the server will not crash; at worst a misconfigured allowlist breaks a frontend call, which is immediately visible.

---

## Why This Matters

`backend/server.js` line 18 configures CORS with `origin: '*'`. This means **any domain in the world** can issue credentialed cross-origin requests to the API. In production this defeats CORS entirely as a defense layer. Because the backend also accepts `DELETE` and `PUT` (line 19), a third-party site could potentially trigger mutations via CSRF if session cookies are ever added.

Current state in `backend/server.js`:
```js
app.use(cors({
  origin: '*',                // line 18 — allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']  // line 19
}));
```

---

## Scope

**Files to change:**
- `backend/server.js`

**Files to leave alone:**
- All frontend files, all route files, `supabaseClient.js`

---

## Implementation Steps

### Step 1 — Introduce an `ALLOWED_ORIGINS` env variable

In `backend/.env.example`, add a new variable documenting where the frontend will be hosted:
```
# Comma-separated list of allowed frontend origins.
# Example: http://localhost:5173,https://yourdomain.com
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 2 — Replace the wildcard with a dynamic allowlist

In `backend/server.js`, replace the CORS block (lines 17–20) with:

```js
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`Origin '${origin}' not permitted by CORS policy`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],  // Remove PUT/DELETE — no route uses them
  allowedHeaders: ['Content-Type', 'Accept']
}));
```

> **Note on methods:** A search of all route files confirms no `router.put()` or `router.delete()` is defined anywhere. Remove those from the allowed methods list at the same time.

### Step 3 — Update your `.env` on the dev machine

Add `ALLOWED_ORIGINS=http://localhost:5173` to your local `backend/.env`. This is for development. For production, add the real domain.

---

## Verification

1. Start the backend: `cd backend && npm run dev`  
2. In a browser console on `http://localhost:5173`, run:
   ```js
   fetch('http://localhost:5000/api/status').then(r => r.json()).then(console.log)
   ```
   **Expected:** Response prints `{ status: 'ONLINE', ... }` — origin `localhost:5173` is in the allowlist.

3. In a browser console on any **other** origin (open DevTools on `google.com` if needed, or use a Playwright/curl test), try the same fetch.  
   **Expected:** Network tab shows `CORS error` — the wildcard is gone.

4. Confirm `PUT` and `DELETE` are rejected:
   ```bash
   curl -X DELETE http://localhost:5000/api/news -v
   ```
   **Expected:** Response `405 Method Not Allowed` or CORS preflight rejection.

---

## Maintenance Note

Whenever a new deployment environment (staging, production CDN) is set up, add its origin to `ALLOWED_ORIGINS` in that environment's `.env`. Never re-introduce `'*'` as a shortcut.

---

## Escape Hatch

If step 2 causes the frontend to receive CORS errors unexpectedly, verify that `ALLOWED_ORIGINS` is correctly set in `backend/.env` (no trailing slashes, exact scheme match). If the problem persists, STOP and report back before making further changes.
