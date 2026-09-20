# Plan 005 — Add `VITE_API_BASE_URL` to Frontend `.env.example`

**Written against commit:** `90c608b`  
**Category:** DX / Configuration  
**Effort:** XS  
**Risk of fix:** None — adding a line to an example file cannot break anything.

---

## Why This Matters

`frontend/src/services/newsService.js` line 3 reads:
```js
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
```

The `VITE_API_BASE_URL` variable controls where the frontend sends all API calls. This is critical for any non-local deployment (staging, production). However, `frontend/.env.example` does not document it:

Current `frontend/.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key
```

A developer deploying the frontend to a hosting platform (Vercel, Netlify) who doesn't read the source code will not know this variable exists and will get a production frontend that silently talks to `localhost:5000` — which fails in a browser tab on any machine other than the dev machine.

The same variable appears in `frontend/src/services/newsService.js` at lines 14–16 as repeated hardcoded `http://localhost:5000` fallbacks, which further obscures the intent.

---

## Scope

**File to change:**
- `frontend/.env.example`

**Files to leave alone:**
- All source files. (The hardcoded `localhost` fallbacks in `newsService.js` are a technical debt item for a later plan — do NOT touch them here.)

---

## Implementation Steps

### Step 1 — Add the missing variable to `frontend/.env.example`

Open `frontend/.env.example` and append the following after the existing lines:

```
# Backend API base URL. Change this for staging/production deployments.
# Default (dev): http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
```

Final file should read:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key

# Backend API base URL. Change this for staging/production deployments.
# Default (dev): http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Verification

1. Inspect the file: `cat frontend/.env.example`  
   **Expected:** All three variables are present and documented.

2. Create a test `.env` from the example: `cp frontend/.env.example frontend/.env.test`  
   **Expected:** The file copies without error.

3. No runtime verification needed — this is a documentation-only change.

---

## Maintenance Note

When a staging or production URL is established for the backend, update the comment in `.env.example` with the pattern, e.g. `VITE_API_BASE_URL=https://api.yourapp.com/api`. Never commit real URLs to source control — the `.env` file is gitignored; `.env.example` is the contract.
