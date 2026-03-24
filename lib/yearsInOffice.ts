/**
 * Calculate years in office from unitedstates/congress-legislators dataset
 *
 * Server-only utility to look up term start dates and calculate years in office.
 */

interface Legislator {
  id: {
    bioguide?: string;
  };
  terms?: Array<{
    type?: string;
    start?: string;
    end?: string;
  }>;
}

// In-memory cache
let yearsMap: Map<string, number> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Dedup lock: prevents 538 simultaneous calls from all fetching
let pendingFetch: Promise<Map<string, number> | null> | null = null;

/**
 * Fetch and parse the legislators dataset for term start dates
 */
async function fetchLegislatorsDatasetForYears(): Promise<Map<string, number> | null> {
  try {
    const url = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const legislators: Legislator[] = await response.json();
    const map = new Map<string, number>();

    for (const legislator of legislators) {
      const bioguideId = legislator.id?.bioguide;

      if (!bioguideId || !legislator.terms || legislator.terms.length === 0) {
        continue;
      }

      // Get the earliest term start date
      const termStarts = legislator.terms
        .map((term) => term.start)
        .filter((start): start is string => !!start)
        .map((start) => new Date(start).getFullYear())
        .filter((year) => !isNaN(year));

      if (termStarts.length > 0) {
        const earliestYear = Math.min(...termStarts);
        const currentYear = new Date().getFullYear();
        const years = currentYear - earliestYear;
        map.set(bioguideId, years);
      }
    }

    return map;
  } catch (error) {
    console.warn("[yearsInOffice] Failed to fetch legislators dataset:", error);
    return null;
  }
}

/**
 * Get years in office for a member by bioguideId
 *
 * Uses a dedup lock so 538 simultaneous calls during Promise.all
 * only trigger one actual fetch.
 */
export async function getYearsInOffice(bioguideId: string): Promise<number | null> {
  try {
    const now = Date.now();
    if (yearsMap && (now - lastFetchTime) < CACHE_DURATION) {
      return yearsMap.get(bioguideId) || null;
    }

    // Dedup: if a fetch is already in progress, wait for it
    if (!pendingFetch) {
      pendingFetch = fetchLegislatorsDatasetForYears().finally(() => {
        pendingFetch = null;
      });
    }

    const map = await pendingFetch;

    if (!map) {
      if (yearsMap) {
        return yearsMap.get(bioguideId) || null;
      }
      return null;
    }

    yearsMap = map;
    lastFetchTime = now;

    return map.get(bioguideId) || null;
  } catch (error) {
    if (yearsMap) {
      return yearsMap.get(bioguideId) || null;
    }

    return null;
  }
}
