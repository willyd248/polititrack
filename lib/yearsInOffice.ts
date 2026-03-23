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

/**
 * Fetch and parse the legislators dataset for term start dates
 */
async function fetchLegislatorsDatasetForYears(): Promise<Map<string, number> | null> {
  try {
    const url = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json";
    
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        Accept: "application/json",
      },
    });
    
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
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns Years in office as number, or null if not found
 */
export async function getYearsInOffice(bioguideId: string): Promise<number | null> {
  try {
    const now = Date.now();
    if (yearsMap && (now - lastFetchTime) < CACHE_DURATION) {
      return yearsMap.get(bioguideId) || null;
    }
    
    const map = await fetchLegislatorsDatasetForYears();
    
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
    if (process.env.NODE_ENV === "development") {
      console.warn(`[yearsInOffice] Failed to lookup years for ${bioguideId}:`, error);
    }
    
    if (yearsMap) {
      return yearsMap.get(bioguideId) || null;
    }
    
    return null;
  }
}

