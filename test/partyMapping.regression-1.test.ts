// Regression: ISSUE-004 — Mike Rogers (R000575) wrongly mapped as Democrat
// Found by /qa on 2026-03-23
// Report: .gstack/qa-reports/qa-report-polititrack-chi-vercel-app-2026-03-23.md

import { describe, it, expect } from 'vitest'
import { PARTY_BY_BIOGUIDE } from '../data/party-mapping'

describe('PARTY_BY_BIOGUIDE', () => {
  it('R000575 (Mike Rogers, AL-03) should NOT be mapped as Democrat', () => {
    // R000575 is Mike Rogers, a Republican from Alabama-03.
    // It was previously mapped as "D" due to a copy-paste error
    // that confused it with Jacky Rosen (R000608).
    expect(PARTY_BY_BIOGUIDE['R000575']).not.toBe('D')
  })

  it('R000608 (Jacky Rosen, NV) should be mapped as Democrat', () => {
    expect(PARTY_BY_BIOGUIDE['R000608']).toBe('D')
  })
})
