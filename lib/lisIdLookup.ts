/**
 * Automatic LIS ID lookup using unitedstates/congress-legislators dataset
 * 
 * Server-only utility that fetches the public legislators dataset and builds
 * a map of bioguideId -> lisId for Senate roll call vote lookups.
 * 
 * Dataset: https://github.com/unitedstates/congress-legislators
 * 
 * LIS IDs are used to match senators in Senate.gov roll call vote XML.
 */

interface Legislator {
  id: {
    bioguide?: string;
    lis?: string; // LIS ID (e.g., "S148")
  };
  name?: {
    first?: string;
    last?: string;
  };
}

// In-memory cache for the lookup map
let lisIdMap: Map<string, string> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch and parse the legislators dataset for LIS IDs
 * 
 * @returns Map of bioguideId -> lisId, or null if unavailable
 */
async function fetchLegislatorsDatasetForLis(): Promise<Map<string, string> | null> {
  try {
    // Use unitedstates/congress-legislators dataset
    // Note: This dataset may not be available - we gracefully fall back
    const url = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json";
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24 hours cache
      headers: {
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      // Dataset not available - return null gracefully
      // Only log once when we first try to fetch (when cache is empty) and it's not a 404
      if (!lisIdMap && response.status !== 404) {
        console.warn(`Legislators dataset fetch failed (${response.status}): LIS ID auto-lookup disabled. Senate votes may not work for some members.`);
      }
      return null;
    }

    const legislators: Legislator[] = await response.json();
    
    // Build map: bioguideId -> lisId
    const map = new Map<string, string>();
    
    for (const legislator of legislators) {
      const bioguideId = legislator.id?.bioguide;
      const lisId = legislator.id?.lis;
      
      if (bioguideId && lisId) {
        map.set(bioguideId, lisId);
      }
    }
    
    return map;
  } catch (error) {
    console.warn("Failed to fetch legislators dataset for LIS IDs:", error);
    return null;
  }
}

/**
 * Get LIS ID for a bioguideId from the automatic lookup
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns LIS ID if found, null otherwise
 */
export async function getLisIdFromDataset(
  bioguideId: string
): Promise<string | null> {
  try {
    // Check if we have a cached map and it's still fresh
    const now = Date.now();
    if (lisIdMap && (now - lastFetchTime) < CACHE_DURATION) {
      return lisIdMap.get(bioguideId) || null;
    }
    
    // Fetch fresh data
    const map = await fetchLegislatorsDatasetForLis();
    
    if (!map) {
      // If fetch failed but we have stale cache, use it
      if (lisIdMap) {
        return lisIdMap.get(bioguideId) || null;
      }
      return null;
    }
    
    // Update cache
    lisIdMap = map;
    lastFetchTime = now;
    
    return map.get(bioguideId) || null;
  } catch (error) {
    // Never throw - return null on any error
    console.warn(`Failed to lookup LIS ID for ${bioguideId}:`, error);
    
    // Try to use stale cache if available
    if (lisIdMap) {
      return lisIdMap.get(bioguideId) || null;
    }
    
    return null;
  }
}

