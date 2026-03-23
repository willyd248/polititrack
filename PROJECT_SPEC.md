# Polititrack – V1 Spec (UI-first)

## Goal
Build a premium, calm, readable civic transparency web app UI.

Users should be able to understand:
- where politicians get money from
- how they vote
- what they say
- what laws do and why they matter

All information is presented neutrally with sources (“receipts”).

## Tech Stack
- Next.js App Router
- TypeScript
- TailwindCSS
- Framer Motion

V1 uses mock data only. No real APIs yet.

## Design principles
- Calm, high-whitespace, readable typography
- Progressive disclosure: summary → modules → deep dive
- No inflammatory language
- Trust via transparency and sources
- No clutter, no popups, no feed-style UI

## Core routes (V1)
- `/` → Home dashboard
- `/politician/[id]` → Politician profile (overview)
- `/bill/[id]` → Bill explainer

## Global layout
- Sticky top navigation
- Centered reading column
- Receipts Drawer:
  - desktop: right-side drawer
  - mobile: bottom sheet
- Drawer opens from any “View receipts” action

## Pages

### Home
- Hero title and short description
- Sections:
  - Politicians (mock list)
  - Bills (mock list)
- Calm dashboard feel (not a news feed)

### Politician profile
- Header: name, role, district/state, committee chips
- Key takeaways card (3–5 bullets)
- Modules (cards):
  - Money
  - Votes
  - Statements
- Each module contains at least one interaction that opens receipts drawer

### Bill page
- Header: bill name + status
- 1-minute summary bullets
- What changes
- Timeline preview
- At least two receipts interactions

## Motion rules
- Use Framer Motion
- Subtle transitions (150–250ms)
- Animate drawers, expand/collapse, layout shifts
- Do not animate large text blocks

## Constraints
- TypeScript only
- No external APIs yet
- No heavy state libraries unless absolutely necessary
- Keep components small and readable

## Acceptance criteria
- `npm run dev` works without errors
- All three routes render
- Receipts drawer opens and closes
- UI feels calm, readable, and consistent
