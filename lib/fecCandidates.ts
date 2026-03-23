/**
 * OpenFEC candidate search utilities
 * 
 * Server-only utilities for searching candidates in the OpenFEC API.
 * Do not import this in client components.
 * 
 * Documentation: https://api.open.fec.gov/developers/
 */

// OpenFEC API response types
interface FecCandidate {
  candidate_id: string;
  name: string;
  office?: string;
  state?: string;
  party?: string;
  election_years?: number[];
  active_through?: number;
}

interface FecCandidatesResponse {
  results?: FecCandidate[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

export interface CandidateSearchResult {
  candidate_id: string;
  name: string;
  office: string | null;
  state: string | null;
  party: string | null;
  election_years: number[];
}

export interface CandidateSearchParams {
  name?: string;
  state?: string;
  office?: string;
}

/**
 * Search for candidates in OpenFEC API
 * 
 * @param params - Search parameters (name, state, office)
 * @returns Array of candidate search results (top 10)
 */
export async function searchFecCandidates(
  params: CandidateSearchParams
): Promise<CandidateSearchResult[]> {
  try {
    const { fecFetch } = await import("./fec");
    
    // Build query parameters
    const queryParams: Record<string, string | number> = {
      per_page: 10, // Limit to top 10 results
      sort: "-election_years", // Most recent first
    };
    
    if (params.name) {
      // OpenFEC search uses "q" parameter for name search
      queryParams.q = params.name;
      // Also try "name" parameter as fallback
      queryParams.name = params.name;
    }
    if (params.state) {
      queryParams.state = params.state.toUpperCase();
    }
    if (params.office) {
      // OpenFEC expects: "H" for House, "S" for Senate, "P" for President
      queryParams.office = params.office.toUpperCase();
    }
    
    const response = await fecFetch<FecCandidatesResponse>(
      "/candidates/",
      {
        params: queryParams,
        revalidate: 3600, // 1 hour cache
      }
    );
    
    if (!response.results || response.results.length === 0) {
      return [];
    }
    
    return response.results.map((candidate) => ({
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      office: candidate.office || null,
      state: candidate.state || null,
      party: candidate.party || null,
      election_years: candidate.election_years || [],
    }));
  } catch (error) {
    console.error("Failed to search FEC candidates:", error);
    return [];
  }
}

