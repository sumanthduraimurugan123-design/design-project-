# Plan 003 — Prevent Unbounded Alert Accumulation in Supabase

**Written against commit:** `90c608b`  
**Category:** Correctness / Performance  
**Effort:** S  
**Risk of fix:** Low — adding a delete step before insert cannot break reads; worst case is a failed delete leaving the table slightly over the limit, which is identical to today's behavior.

---

## Why This Matters

`backend/services/alertEngine.js` line 58–59 correctly caps the **in-memory** alert cache at 50 items:
```js
memoryAlerts.unshift(alert);
if (memoryAlerts.length > 50) memoryAlerts.pop();
```

But `persistAlert()` on line 73 inserts every alert into Supabase with **no row limit** and **no deduplication**:
```js
await supabase.from('alerts').insert([{ message, severity, country, source_url }]);
```

The background sync loop in `server.js` runs every 30 seconds and scans every ingested article for keyword matches. With 15 hotspot countries cycling, that is up to ~300 alert-eligible articles per hour. The `alerts` table will grow indefinitely and is never pruned.

---

## Scope

**File to change:**
- `backend/services/alertEngine.js`

**Files to leave alone:**
- All route files, `server.js`, all frontend files, `schema.sql`.

---

## Implementation Steps

### Step 1 — Add deduplication before insert

A new article producing the same alert message as a recent one should not create a duplicate row. Add a Supabase check before the insert in `persistAlert()`.

**In `backend/services/alertEngine.js`, replace the `persistAlert` function body (lines 65–92) with:**

```js
export async function persistAlert(alert) {
  if (!alert) return null;
  addCachedAlert(alert);

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Dedup: skip if an identical message was inserted in the last 60 minutes
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('message', alert.message)
        .gte('created_at', oneHourAgo)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0]; // duplicate within the hour — skip
      }

      // 2. Insert the new alert
      const { data, error } = await supabase
        .from('alerts')
        .insert([{
          message: alert.message,
          severity: alert.severity,
          country: alert.country,
          source_url: alert.source_url
        }])
        .select();

      if (error) {
        console.error('⚠️ [Alert Engine] Error persisting alert to Supabase:', error.message);
      } else {
        console.log(`🚨 [Alert Engine] Alert saved [${alert.severity}]: ${alert.country}`);

        // 3. Prune: keep only the 200 most recent alerts in the table
        const { data: oldest } = await supabase
          .from('alerts')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1000); // fetch a batch; delete those beyond the tail

        const total = (oldest || []).length;
        const LIMIT = 200;
        if (total > LIMIT) {
          const toDelete = oldest.slice(0, total - LIMIT).map(r => r.id);
          await supabase.from('alerts').delete().in('id', toDelete);
        }

        return data?.[0];
      }
    } catch (err) {
      console.error('⚠️ [Alert Engine] Exception inserting alert:', err.message);
    }
  }
  return alert;
}
```

> **Note on pruning approach:** The `select` then `delete` approach above has a race condition under heavy concurrency, but this service is single-process, so it is safe. A cleaner alternative is a PostgreSQL function, but that requires a schema migration and is out of scope for this plan.

---

## Verification

1. Start backend: `cd backend && npm run dev`
2. Confirm the service starts without errors.
3. Wait 2–3 minutes for the background sync to run and generate alerts.
4. In the Supabase dashboard (or via `LogsViewer`), query `SELECT COUNT(*) FROM alerts` repeatedly.  
   **Expected:** Count grows but stabilizes; duplicate messages from the same hour appear only once.
5. If you have a Supabase client available, manually insert 210 rows via SQL editor, then trigger one more alert.  
   **Expected:** Total row count stays at or below 201 (200 cap + the new one before pruning).

---

## Maintenance Note

The dedup window is hard-coded to 60 minutes. If the sync interval in `server.js` is ever changed, the dedup window should be updated to be at least 2× that interval. Consider extracting both values to a shared config constant in a future refactor.

---

## Escape Hatch

If the `select` before `insert` adds noticeable latency (>500ms per alert), the dedup step can be replaced with a Supabase `upsert` with `onConflict: 'message'`. That requires adding a `UNIQUE` constraint on `alerts(message)` in the schema — do that in a separate migration plan and STOP here.
