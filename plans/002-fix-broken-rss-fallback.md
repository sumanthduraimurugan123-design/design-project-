# Plan 002 — Fix Crash Bug in Tertiary RSS Fallback

**Written against commit:** `90c608b`  
**Category:** Correctness / Bugs  
**Effort:** S  
**Risk of fix:** Low — the fallback path only runs when the backend *and* Supabase are both unreachable. A broken fallback means users see an empty news panel; fixing it cannot make things worse.

---

## Why This Matters

`frontend/src/services/newsService.js` lines 68–122 contain a tertiary RSS fallback using a regex parser. **Line 82 uses a variable `titleMatch` that is never declared in that scope:**

```js
// Line 78 — itemRegex.exec() grabs the <item> block
while ((match = itemRegex.exec(xml)) !== null && items.length < 25) {
  const itemBlock = match[1];

  // BUG: `titleMatch` is referenced here but never declared above this point!
  let title = titleMatch ? titleMatch[1].trim() : '';  // line 82
```

`titleMatch` is `undefined` at this point, so `titleMatch ?` always evaluates falsy, producing an empty `title` for every article. Every article then fails the `if (title && articleUrl ...)` check on line 100 and is discarded. The function always returns `[]` from the tertiary path.

---

## Scope

**File to change:**
- `frontend/src/services/newsService.js`

**Files to leave alone:**
- All other frontend files, all backend files.

---

## Implementation Steps

### Step 1 — Declare `titleMatch` before use

On line 82, a `titleMatch` regex call must be inserted immediately before the `let title` line. The pattern to extract the title from the item block is the standard RSS `<title><![CDATA[...]]></title>` or `<title>...</title>` format, consistent with how `descMatch` and `linkMatch` are extracted on lines 86 and 92.

Replace the block starting at line 82:

**Before (buggy):**
```js
// line 82 — titleMatch is never declared, always undefined
let title = titleMatch ? titleMatch[1].trim() : '';
title = title.replace(/&amp;/g, '&')...;
```

**After (fixed):**
```js
// Declare titleMatch from the item block
const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i)
  || itemBlock.match(/<title>(.*?)<\/title>/i);
let title = titleMatch ? titleMatch[1].trim() : '';
title = title.replace(/&amp;/g, '&')...;
```

The rest of the block (lines 83–122) does not require changes.

---

## Verification

Since there are no automated tests, manually verify:

1. Temporarily simulate both the backend and Supabase being unavailable by pointing `API_BASE` at a non-existent URL. In `frontend/src/services/newsService.js` line 3, temporarily change:
   ```js
   const API_BASE = 'http://localhost:9999/api'; // unreachable
   ```
   And ensure `isConfigured` is false (no Supabase creds in frontend `.env`).

2. Run the frontend: `cd frontend && npm run dev`. Load the dashboard.

3. **Expected result:** The News Feed panel populates with BBC articles from the tertiary RSS fallback (titles will be non-empty strings like "UK election results...").

4. **Before fix:** The panel showed 0 articles.

5. Revert the `API_BASE` change after verification.

---

## Maintenance Note

This tertiary fallback uses `allorigins.win` — a public CORS proxy. It is not production-reliable and could go offline. Consider replacing it with a Vite proxy rule (`vite.config.js`) that forwards `/rss-proxy` to the BBC feed server-side, removing the need for a third-party proxy entirely. That is a separate improvement (not part of this plan).

---

## Escape Hatch

If `titleMatch` now returns titles but articles are still missing, check that `linkMatch` on line 92 is returning `http` URLs. If `articleUrl` is empty for all items, the BBC feed's `<link>` element may use CDATA or a different attribute. STOP and report back rather than expanding scope.
