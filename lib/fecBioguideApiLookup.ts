/**
 * FEC candidate ID lookup via OpenFEC bioguide_id parameter
 *
 * Uses the OpenFEC /candidates/ endpoint's bioguide_id filter — the canonical
 * way to map a Congressional bioguide ID to an FEC candidate ID.
 *
 * Cached with 24hr ISR via Next.js fetch cache.
 * Never throws — returns null on any failure.
 */

interface FecCandidate {
  candidate_id: string;
  election_years?: number[];
  candidate_status?: string;
  active_through?: number;
}

interface FecCandidatesResponse {
  results?: FecCandidate[];
}

/**
 * Look up FEC candidate ID by Congressional bioguide ID using OpenFEC API.
 *
 * OpenFEC maintains a `bioguide_id` field on candidate records that directly
 * links FEC candidates to their Congressional bioguide IDs. This is the most
 * reliable lookup method when the static legislators dataset is stale or missing
 * an entry.
 *
 * @param bioguideId - Congressional bioguide ID (e.g., "S000148")
 * @returns Most-recent FEC candidate ID, or null if not found
 */
export async function getFecCandidateIdByBioguideApi(
  bioguideId: string
): Promise<string | null> {
  try {
    const { fecFetch } = await import("./fec");

    const response = await fecFetch<FecCandidatesResponse>("/candidates/", {
      params: {
        bioguide_id: bioguideId,
        per_page: 10,
        sort: "-election_years",
        sort_hide_null: true,
      },
      revalidate: 86400, // 24hr ISR
    });

    if (!response.results || response.results.length === 0) {
      return null;
    }

    // Sort by most recent election year, prefer "C" (current) status
    const sorted = [...response.results].sort((a, b) => {
      // Prefer current-status candidates
      const aActive = a.candidate_status === "C" ? 1 : 0;
      const bActive = b.candidate_status === "C" ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;

      // Then sort by most recent election year
      const aYear = Math.max(0, ...(a.election_years ?? [0]));
      const bYear = Math.max(0, ...(b.election_years ?? [0]));
      return bYear - aYear;
    });

    return sorted[0].candidate_id;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[FEC Bioguide API] Lookup failed for ${bioguideId}:`,
        error
      );
    }
    return null;
  }
}
