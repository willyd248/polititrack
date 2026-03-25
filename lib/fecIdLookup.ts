/**
 * Automatic FEC Candidate ID lookup using unitedstates/congress-legislators dataset
 *
 * Server-only utility that fetches the public legislators dataset and builds
 * a map of bioguideId -> fecCandidateId.
 *
 * Dataset: https://theunitedstates.io/congress-legislators/
 *
 * NOTE: The static mapping in data/fec-mapping.ts covers all 538 current members
 * as of 2026-03-25. This file is a fallback for newly sworn-in members only.
 * The dataset is YAML (not JSON), so runtime parsing requires a YAML parser.
 * Until that's added, this fallback returns null gracefully for any member not
 * in the static mapping. Regenerate data/fec-mapping.ts periodically via:
 *   node scripts/generate-fec-mapping.js
 */

interface Legislator {
  id: {
    bioguide?: string;
    fec?: string[];
  };
  name?: {
    first?: string;
    last?: string;
  };
}

interface LegislatorsData {
  [key: string]: Legislator;
}

// In-memory cache for the lookup map
let fecIdMap: Map<string, string> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch and parse the legislators dataset
 * 
 * @returns Map of bioguideId -> fecCandidateId, or null if unavailable
 */
async function fetchLegislatorsDataset(): Promise<Map<string, string> | null> {
  try {
    // Use unitedstates/congress-legislators dataset
    // Note: This dataset may not be available - we gracefully fall back to manual mappings
    const url = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json";
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24 hours cache
      headers: {
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      // Dataset not available - return null gracefully
      // Only log once when we first try to fetch (when cache is empty)
      if (!fecIdMap && response.status === 404) {
        // Silently fail - manual mappings in data/fec-mapping.ts are the primary source
        return null;
      }
      if (!fecIdMap) {
        // Only log non-404 errors (network issues, etc.)
        console.warn(`Legislators dataset fetch failed (${response.status}): FEC ID auto-lookup disabled. Using manual mappings only.`);
      }
      return null;
    }

    const legislators: Legislator[] = await response.json();
    
    // Build map: bioguideId -> fecCandidateId
    const map = new Map<string, string>();
    
    for (const legislator of legislators) {
      const bioguideId = legislator.id?.bioguide;
      const fecIds = legislator.id?.fec;
      
      if (bioguideId && fecIds && fecIds.length > 0) {
        // Use the first FEC ID if multiple exist
        const fecId = fecIds[0];
        if (fecId) {
          map.set(bioguideId, fecId);
        }
      }
    }
    
    return map;
  } catch (error) {
    console.warn("Failed to fetch legislators dataset:", error);
    return null;
  }
}

/**
 * Get FEC candidate ID for a bioguideId from the automatic lookup
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns FEC candidate ID if found, null otherwise
 */
export async function getFecCandidateIdFromDataset(
  bioguideId: string
): Promise<string | null> {
  try {
    // Check if we have a cached map and it's still fresh
    const now = Date.now();
    if (fecIdMap && (now - lastFetchTime) < CACHE_DURATION) {
      return fecIdMap.get(bioguideId) || null;
    }
    
    // Fetch fresh data
    const map = await fetchLegislatorsDataset();
    
    if (!map) {
      // If fetch failed but we have stale cache, use it
      if (fecIdMap) {
        return fecIdMap.get(bioguideId) || null;
      }
      return null;
    }
    
    // Update cache
    fecIdMap = map;
    lastFetchTime = now;
    
    return map.get(bioguideId) || null;
  } catch (error) {
    // Never throw - return null on any error
    console.warn(`Failed to lookup FEC ID for ${bioguideId}:`, error);
    
    // Try to use stale cache if available
    if (fecIdMap) {
      return fecIdMap.get(bioguideId) || null;
    }
    
    return null;
  }
}

/**
 * Get the dataset source URL for receipts
 */
export function getFecIdDatasetSource() {
  return {
    title: "United States Congress Legislators Dataset",
    publisher: "The United States Project",
    url: "https://github.com/unitedstates/congress-legislators",
    excerpt: "Public dataset containing bioguide IDs and FEC candidate IDs for current members of Congress.",
  };
}

