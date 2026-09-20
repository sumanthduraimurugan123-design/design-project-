# UGI — Improvement Plans Index

**Repository:** `sumanthproject` (Global Intel & Telemetry)  
**Audited commit:** `90c608b`  
**Audit date:** 2026-09-11  
**Effort key:** XS < 1h | S 1–4h | M 4–12h | L 12h+

---

## Execution Order

Plans must be executed in this order due to dependencies:

```
001  (CORS fix)          ← No dependencies. Start here.
002  (RSS bug fix)       ← No dependencies. Can run in parallel with 001.
004  (Rate limiting)     ← Depends on 001 being done (correct origin list known first).
003  (Alert dedup)       ← No dependencies. Can run in parallel with 004.
005  (Env docs)          ← No dependencies. Any time.
```

---

## Status Table

| # | Slug | Category | Impact | Effort | Risk | Status |
|---|------|----------|--------|--------|------|--------|
| 001 | [fix-cors-wildcard](./001-fix-cors-wildcard.md) | Security | HIGH | S | Low | TODO |
| 002 | [fix-broken-rss-fallback](./002-fix-broken-rss-fallback.md) | Correctness | MEDIUM | S | Low | TODO |
| 003 | [alert-dedup-and-pruning](./003-alert-dedup-and-pruning.md) | Correctness/Perf | MEDIUM | S | Low | TODO |
| 004 | [add-rate-limiting](./004-add-rate-limiting.md) | Security/Perf | HIGH | S | Low | TODO |
| 005 | [document-vite-api-base-url](./005-document-vite-api-base-url.md) | DX | LOW | XS | None | TODO |

---

## Considered and Rejected

These were identified during audit but are **not planned** — reasons given:

| Finding | Why Rejected |
|---------|-------------|
| Replace regex RSS parser in fallback with `DOMParser` | The fallback is tertiary (only runs if backend AND Supabase are down). Low priority. Fix the `titleMatch` bug (plan 002) first. |
| Add TypeScript to the codebase | Significant migration effort. No existing type errors confirmed. Not worth the cost for a project at this stage. |
| Replace hardcoded `http://localhost:5000` fallbacks in `newsService.js` | Low severity; they are well-understood fallbacks, not security issues. Document `VITE_API_BASE_URL` (plan 005) is the higher-leverage fix. |
| Hotspot threat levels in `Globe3D.jsx` are hardcoded, not driven by real alert data | Requires a new data contract between frontend and backend. Out of scope for a bug-fix audit. Good candidate for a direction/roadmap plan. |

---

## Not Audited

- `backend/services/countryClassifier.js` (8.6KB) — classification accuracy; functional but no test coverage
- `frontend/src/components/Globe3D.jsx` (25.6KB) — WebGL rendering correctness, memory management, Three.js cleanup on unmount
- `backend/scripts/` — two utility scripts; no automated tests exist for the project at all
- Accessibility compliance of the new UI (WCAG 2.1 AA)
- Production deployment configuration (no Dockerfile, no CI pipeline found)

A follow-on `deep` audit of `Globe3D.jsx` and `countryClassifier.js` is recommended before any production deployment.
