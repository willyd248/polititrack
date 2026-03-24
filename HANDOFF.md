# PolitiTrack — Session Handoff

**Session date:** 2026-03-24
**Branch:** main
**Last commit:** c575ca8

## What Was Done This Session

### Deployment
- Created Vercel project, linked GitHub repo
- Set env vars (CONGRESS_API_KEY, FEC_API_KEY, NEXT_PUBLIC_SITE_URL)
- Auto-deploys on push to main
- Live at https://polititrack-chi.vercel.app

### v1.1 Polish Milestone (10/10 issues closed)
1. Removed duplicate page-server.tsx files
2. Implemented getYearsInOffice() with server-side computation
3. Implemented member press API (RSS + sponsored bills fallback)
4. Deployed to Vercel
5. Added Next.js Image optimization with remote patterns
6. Added pagination (24/page) to representatives grid
7. Wired up Vercel Analytics
8. API keys rotated (user provided new keys)
9. Simplified topic-lens-store URL sync
10. UI redesign via Stitch — civic data journalism aesthetic

### Critical Bug Fixes
- **Updated 118th → 119th Congress** across all API calls
- **Fixed member pagination** — now fetches all 538 members (was only 100)
- **Fixed party data** — mapped `partyName` field from Congress.gov list endpoint
- **Fixed member photos** — mapped `depiction.imageUrl` from API
- **Fixed bill detail pages** — API response structure mismatch (actions/sponsors/cosponsors have different shapes in list vs detail endpoints)
- **Fixed profile page timeout** — moved FEC data to client-side lazy loading, skipped FEC auto-lookup in member fetch, parallel fetches with timeouts
- **Fixed bill type casing** — lowercase type in API path (`/bill/119/hr/144` not `/HR/`)
- **Rewrote status page** — live API health checks instead of in-memory state

### Stitch Redesign
- Generated 5 screens (home, profile, bill detail, compare x2)
- Stitch project ID: 5351571162885503412
- Applied new design to: home page, nav, cards, chamber floor, button/chip/card components
- NOT yet applied to: profile page, bill page, compare page, methodology, receipts drawer
- Created DESIGN.md with full design system spec

### v2.0 Milestone Created (11 open issues)
See STATE.md for full list. Key remaining work:
- #12: FEC rate limiting fix (need caching strategy or bulk data)
- #14: House votes (need alternative data source like clerk.house.gov XML)
- #15: ZIP code dataset expansion
- #17: Apply Stitch design to remaining pages

## What to Do Next

### Immediate (make the app genuinely useful)
1. **Fix FEC rate limiting (#12)** — Either use FEC bulk CSV data or implement a server-side cache/queue
2. **Add House votes (#14)** — Implement clerk.house.gov XML scraping (mirrors Senate pattern)
3. **Expand ZIP dataset (#15)** — Import HUD USPS crosswalk file

### Polish (complete the redesign)
4. **Apply Stitch design to all pages (#17)** — Profile, bill detail, compare, methodology
5. **Add ChamberFloor back to home (#20)**
6. **Compare page standalone search (#16)**

### Content
7. **Rewrite mission/methodology (#19)**
8. **Data freshness indicators (#23)**

## Gotchas for Next Session
- FEC API rate limit is 60/hr — be careful with any code that triggers FEC calls
- Congress.gov API uses `partyName` in list endpoint, `partyHistory` in detail
- Bill detail endpoint returns `sponsors[]` (array) not `sponsor` (singular)
- House votes API endpoint does NOT exist in Congress.gov v3
- The `fetchMemberByBioguideId` function accepts `options.skipFecLookup` — always use it unless you specifically need the FEC ID
- Mock data IDs (e.g., "politician-1") don't match real bioguide IDs (e.g., "S000148")
