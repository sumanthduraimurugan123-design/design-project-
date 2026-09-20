# Plan 004 — Rate-Limit the News and Alerts API Endpoints

**Written against commit:** `90c608b`  
**Category:** Security / Performance  
**Effort:** S  
**Risk of fix:** Low — rate limiting only affects callers who exceed the limit. The frontend fetches on a 30s interval with at most 1 concurrent user per session, so it will never hit a reasonable limit.

---

## Why This Matters

The backend has no rate limiting on any endpoint. The `GET /api/news` route triggers an **outbound HTTP RSS fetch from multiple external sources** (BBC, NYT, Guardian, Al Jazeera, Google News) for every incoming request. A single attacker calling `GET /api/news?country=global&refresh=true` in a tight loop will:
1. Exhaust the server's outbound connection pool.
2. Cause the server's IP to be rate-limited or blocked by those upstream RSS providers.
3. Potentially rack up Supabase read/write quota.

No authentication protects any endpoint. This is standard for a public read-only news app, but rate limiting is still essential.

---

## Scope

**Files to change:**
- `backend/server.js`
- `backend/package.json`

**Files to leave alone:**
- All route files (the limiter goes on the Express app level), all frontend files, `schema.sql`.

---

## Implementation Steps

### Step 1 — Install `express-rate-limit`

```bash
cd backend
npm install express-rate-limit
```

In `backend/package.json`, under `"dependencies"`, add:
```json
"express-rate-limit": "^7.4.1"
```
(The install command above does this automatically; confirm the version that resolves.)

### Step 2 — Add rate limiters in `backend/server.js`

Add the import near the top of `server.js`, after the existing imports:
```js
import rateLimit from 'express-rate-limit';
```

Then add two rate limiters **before** the route declarations (before line 30 `app.use('/api/news', newsRoutes)`):

```js
// General API limiter: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api', generalLimiter);

// Stricter limiter on the news refresh endpoint (triggers heavy outbound fetches)
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                     // max 5 force-refreshes per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Refresh rate limit exceeded. Please wait before forcing another sync.' }
});
app.use('/api/news/refresh', refreshLimiter);  // POST /api/news/refresh
```

### Step 3 — Place the limiters in the correct order

The final ordering in `server.js` middleware section must be:
1. `cors(...)` 
2. `express.json()`
3. Request logging middleware
4. `app.use('/api', generalLimiter)` ← new
5. `app.use('/api/news/refresh', refreshLimiter)` ← new
6. Route declarations (`app.use('/api/news', ...)`, etc.)

---

## Verification

1. Start backend: `cd backend && npm run dev`
2. Send 101 rapid requests to the news endpoint:
   ```bash
   for i in {1..101}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/news; done
   ```
   **Expected:** First 100 return `200`, the 101st returns `429 Too Many Requests`.

3. Send 6 rapid POST requests to the refresh endpoint:
   ```bash
   for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/news/refresh -H "Content-Type: application/json" -d '{"country":"global"}'; done
   ```
   **Expected:** First 5 return `200`, 6th returns `429`.

4. Confirm the frontend still works normally: `cd frontend && npm run dev`, load the dashboard, wait for the 30s auto-refresh.  
   **Expected:** News loads as before — the 30s interval is far below 100 req/min.

---

## Maintenance Note

If the app is ever deployed behind a reverse proxy (Nginx, Cloudflare, etc.), set `app.set('trust proxy', 1)` in `server.js` before the rate limiters. Without this, `req.ip` will be the proxy's IP and all clients will share a single rate-limit bucket.

---

## Escape Hatch

If `express-rate-limit` v7 has a breaking API change, check the changelog at `npmjs.com/package/express-rate-limit`. The `windowMs` / `max` API has been stable since v6. If a version conflict occurs during `npm install`, STOP and report the error before proceeding.
