/**
 * Party affiliation lookup from unitedstates/congress-legislators dataset
 * 
 * Server-only utility to look up party affiliation by bioguideId.
 * Uses the same dataset as FEC ID and LIS ID lookups.
 * 
 * Dataset structure: https://github.com/unitedstates/congress-legislators
 */

interface Legislator {
  id: {
    bioguide?: string;
  };
  terms?: Array<{
    type?: string; // "rep" or "sen"
    start?: string;
    end?: string;
    party?: string; // "Democrat", "Republican", "Independent", etc.
  }>;
}

// In-memory cache for the lookup map
let partyMap: Map<string, string> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch and parse the legislators dataset for party affiliations
 * 
 * @returns Map of bioguideId -> party code, or null if unavailable
 */
async function fetchLegislatorsDatasetForParty(): Promise<Map<string, string> | null> {
  try {
    // Use unitedstates/congress-legislators dataset
    const url = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json";
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24 hours cache
      headers: {
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      // Dataset not available - return null gracefully
      if (!partyMap && response.status !== 404) {
        console.warn(`[partyLookup] Legislators dataset fetch failed (${response.status}): Party auto-lookup disabled.`);
      }
      return null;
    }

    const legislators: Legislator[] = await response.json();
    
    // Build map: bioguideId -> party code
    const map = new Map<string, string>();
    
    for (const legislator of legislators) {
      const bioguideId = legislator.id?.bioguide;
      
      if (!bioguideId || !legislator.terms || legislator.terms.length === 0) {
        continue;
      }
      
      // Get the most recent term (first term is usually current)
      const currentTerm = legislator.terms[0];
      
      if (!currentTerm || !currentTerm.party) {
        continue;
      }
      
      // Normalize party name to single letter code
      const partyName = currentTerm.party.toLowerCase();
      let partyCode: string | null = null;
      
      if (partyName.includes("democrat") || partyName === "d") {
        partyCode = "D";
      } else if (partyName.includes("republican") || partyName === "r") {
        partyCode = "R";
      } else if (partyName.includes("independent") || partyName === "i") {
        partyCode = "I";
      } else if (currentTerm.party.length === 1) {
        // Return first letter if it's a single character
        partyCode = currentTerm.party.toUpperCase();
      }
      
      if (partyCode) {
        map.set(bioguideId, partyCode);
      }
    }
    
    return map;
  } catch (error) {
    console.warn("[partyLookup] Failed to fetch legislators dataset:", error);
    return null;
  }
}

/**
 * Get party affiliation for a member by bioguideId
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns Party code ("D", "R", "I") or null if not found
 */
export async function getPartyForBioguide(bioguideId: string): Promise<string | null> {
  try {
    // Check if we have a cached map and it's still fresh
    const now = Date.now();
    if (partyMap && (now - lastFetchTime) < CACHE_DURATION) {
      return partyMap.get(bioguideId) || null;
    }
    
    // Fetch fresh data
    const map = await fetchLegislatorsDatasetForParty();
    
    if (!map) {
      // If fetch failed but we have stale cache, use it
      if (partyMap) {
        return partyMap.get(bioguideId) || null;
      }
      return null;
    }
    
    // Update cache
    partyMap = map;
    lastFetchTime = now;
    
    return map.get(bioguideId) || null;
  } catch (error) {
    // Never throw - return null on any error
    if (process.env.NODE_ENV === "development") {
      console.warn(`[partyLookup] Failed to lookup party for ${bioguideId}:`, error);
    }
    
    // Try to use stale cache if available
    if (partyMap) {
      return partyMap.get(bioguideId) || null;
    }
    
    return null;
  }
}

