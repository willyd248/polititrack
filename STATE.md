# PolitiTrack — Project State

**Last updated:** 2026-03-24
**Version:** v1.1
**Status:** Deployed to production, core flows working
**Live URL:** https://polititrack-chi.vercel.app
**Repo:** https://github.com/willyd248/polititrack

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Home page | Working | 538 members from 119th Congress, real bills |
| Representative grid | Working | Paginated (24/page), party colors, photos |
| Politician profile | Working | Loads in <1s via Congress.gov data |
| Bill detail pages | Working | Real data from Congress.gov API |
| Chamber toggle (House/Senate) | Working | |
| Search (Cmd+K) | Working | API at /api/members/search |
| Topic filters | Working | Nav bar chip filters |
| Status page | Working | Live API health checks |
| Analytics | Working | Vercel Analytics wired up |
| FEC financial data | Partially working | Lazy-loads client-side, rate-limited (60/hr) |

## What's Broken / Missing

| Issue | GitHub | Priority |
|-------|--------|----------|
| FEC rate limiting (60 req/hr) | #12 | High |
| House votes always empty (no API endpoint) | #14 | High |
| ZIP code dataset too limited | #15 | Medium |
| Compare page needs standalone search | #16 | Medium |
| Stitch design not applied to profile/bill/compare pages | #17 | Medium |
| Member photos may not load (needs verification) | #18 | Medium |
| Mission/about page content | #19 | Low |
| ChamberFloor visualization missing from home | #20 | Medium |
| Dark mode broken by redesign | #21 | Low |
| Search results link to profile (works now) | #22 | Closed by #11 fix |
| Data freshness indicators | #23 | Low |

## Architecture

```
Next.js 16 (App Router) + React 19 + Tailwind v4
├── Server Components: fetch data from Congress.gov + OpenFEC
├── Client Components: interactive UI, lazy FEC loading
├── API Routes: /api/members/search, /api/fec/money, /api/health
└── Deployed on Vercel (auto-deploy from main)
```

### Data Flow
- **Member list**: Server-side at build time, cached 30min (ISR)
- **Member detail**: Server-side on request, Congress.gov data only (~1s)
- **FEC financials**: Client-side lazy load via /api/fec/money (avoids blocking)
- **Bills**: Server-side, /bill/119 endpoint, cached 30min
- **Senate votes**: Server-side via Senate.gov XML
- **House votes**: Not working (API endpoint doesn't exist)

### API Keys (Vercel env vars)
- `CONGRESS_API_KEY` — 20,000 req/hr, no issues
- `FEC_API_KEY` — 60 req/hr, rate limiting is the main bottleneck
- `NEXT_PUBLIC_SITE_URL` — https://polititrack-chi.vercel.app

## Key Decisions Made This Session
1. **119th Congress** — Updated from hardcoded 118th
2. **FEC lazy loading** — Moved from server-side blocking to client-side async
3. **Skip FEC auto-lookup in bulk/profile** — Uses manual mapping table instead
4. **24hr FEC cache** — Up from 1hr to reduce rate limit pressure
5. **Stitch redesign** — Applied to home/nav/cards, other pages still on old design
6. **Design system** — Epilogue + Public Sans fonts, navy/deep red palette (DESIGN.md)

## Milestones
- **v1.1 polish** — All 10 issues closed
- **v2.0 production ready** — 11 open issues remaining (https://github.com/willyd248/polititrack/milestone/2)
