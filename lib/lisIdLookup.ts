/**
 * Automatic LIS ID lookup using unitedstates/congress-legislators dataset
 *
 * Server-only utility that fetches the public legislators YAML dataset and builds
 * a map of bioguideId -> lisId for Senate roll call vote lookups.
 *
 * Dataset: https://github.com/unitedstates/congress-legislators
 * Note: The project moved from JSON to YAML in early 2025. We parse the YAML
 *       with a lightweight regex approach to avoid adding a YAML parser dependency.
 *
 * LIS IDs are used to match senators in Senate.gov roll call vote XML.
 */

// In-memory cache for the lookup map
let lisIdMap: Map<string, string> | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Parse legislators YAML into a bioguideId -> lisId map.
 *
 * The YAML format is consistently structured — each record starts with `- id:`
 * followed by indented fields. We use regex to extract the pairs we need
 * without pulling in a full YAML parser.
 */
function parseLegislatorsYaml(yaml: string): Map<string, string> {
  const map = new Map<string, string>();

  // Split on legislator record boundaries
  const records = yaml.split(/^- id:/m).slice(1); // first element is empty

  for (const record of records) {
    const bioguideMatch = record.match(/^\s+bioguide:\s+([A-Z]\d{6})/m);
    const lisMatch = record.match(/^\s+lis:\s+(S\d+)/m);

    if (bioguideMatch?.[1] && lisMatch?.[1]) {
      map.set(bioguideMatch[1], lisMatch[1]);
    }
  }

  return map;
}

/**
 * Fetch and parse the legislators dataset for LIS IDs
 */
async function fetchLegislatorsDatasetForLis(): Promise<Map<string, string> | null> {
  try {
    const url =
      "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";

    const response = await fetch(url, {
      next: { revalidate: 86400 }, // 24 hours cache
      headers: { Accept: "text/plain" },
    });

    if (!response.ok) {
      if (!lisIdMap) {
        console.warn(
          `Legislators YAML fetch failed (${response.status}): LIS ID auto-lookup disabled. Senate votes may not work for some members.`
        );
      }
      return null;
    }

    const yaml = await response.text();
    const map = parseLegislatorsYaml(yaml);
    console.log(`[lisIdLookup] Loaded ${map.size} bioguide→LIS mappings`);
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
    const now = Date.now();
    if (lisIdMap && now - lastFetchTime < CACHE_DURATION) {
      return lisIdMap.get(bioguideId) || null;
    }

    const map = await fetchLegislatorsDatasetForLis();

    if (!map) {
      // Use stale cache if fetch failed
      return lisIdMap?.get(bioguideId) || null;
    }

    lisIdMap = map;
    lastFetchTime = now;

    return map.get(bioguideId) || null;
  } catch (error) {
    console.warn(`Failed to lookup LIS ID for ${bioguideId}:`, error);
    return lisIdMap?.get(bioguideId) || null;
  }
}
