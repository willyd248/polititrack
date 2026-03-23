/**
 * Mapper from OpenFEC API to Polititrack Money module data
 * 
 * OpenFEC API documentation: https://api.open.fec.gov/developers/
 */

import { Source } from "../../data/types";

// OpenFEC API response types (partial, based on actual API structure)
// Note: OpenFEC returns totals as an array, one per cycle
interface FecCandidateTotals {
  candidate_id: string;
  cycle: number;
  receipts?: number; // Total receipts (raised)
  disbursements?: number; // Total disbursements (spent)
  cash_on_hand_end_period?: number; // Cash on hand
  candidate_election_year?: number;
}

interface FecCandidateTotalsResponse {
  results?: FecCandidateTotals[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

export interface MoneyModule {
  totals: {
    raised: number;
    spent: number;
    cashOnHand: number;
  };
  topContributors: Array<{
    name: string;
    amount: string;
  }>;
  industryBreakdown: Array<{
    industry: string;
    percentage: number;
  }>;
  sources: Source[];
}

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * FEC API response types for committees
 */
interface FecCommittee {
  committee_id?: string;
  name?: string;
  committee_type?: string;
}

interface FecCommitteesResponse {
  results?: FecCommittee[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

/**
 * FEC API response types for contributors
 */
interface FecContributor {
  contributor_name?: string;
  contribution_receipt_amount?: number;
  contributor_aggregate_ytd?: number;
  total?: number; // Alternative field name
}

interface FecContributorsResponse {
  results?: FecContributor[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

/**
 * FEC API response types for industry breakdown
 */
interface FecIndustry {
  employer?: string;
  total?: number;
  count?: number;
}

interface FecIndustryResponse {
  results?: FecIndustry[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

/**
 * Get committees for a candidate
 */
async function getCandidateCommittees(
  fecCandidateId: string,
  cycle?: number
): Promise<string[]> {
  try {
    const { fecFetch } = await import("../fec");
    
    const params: Record<string, string | number> = {
      per_page: 50, // Get all committees
    };
    
    if (cycle) {
      params.cycle = cycle;
    }
    
    const response = await fecFetch<FecCommitteesResponse>(
      `/candidate/${fecCandidateId}/committees/`,
      {
        params,
        revalidate: 3600,
      }
    );
    
    if (!response.results || response.results.length === 0) {
      return [];
    }
    
    // Return committee IDs, prioritizing principal committees
    return response.results
      .filter((committee) => committee.committee_id)
      .map((committee) => committee.committee_id!)
      .slice(0, 5); // Limit to top 5 committees to avoid too many API calls
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[getCandidateCommittees] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Fetch top contributors for a candidate
 * Tries candidate-level endpoint first, then falls back to committee-level aggregation
 */
async function fetchTopContributors(
  fecCandidateId: string,
  cycle?: number
): Promise<Array<{ name: string; amount: string }>> {
  try {
    const { fecFetch } = await import("../fec");
    
    // Try candidate-level endpoint first
    const params: Record<string, string | number> = {
      sort: "-contribution_receipt_amount", // Sort by contribution amount descending
      per_page: 10, // Top 10 contributors
    };
    
    if (cycle) {
      params.cycle = cycle;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchTopContributors] Fetching for ${fecCandidateId}, cycle: ${cycle}`);
    }
    
    try {
      const response = await fecFetch<FecContributorsResponse>(
        `/candidate/${fecCandidateId}/schedules/schedule_a/by_contributor/`,
        {
          params,
          revalidate: 3600, // 1 hour cache
        }
      );
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchTopContributors] Candidate-level results for ${fecCandidateId}:`, response.results?.length || 0, "contributors");
      }
      
      if (response.results && response.results.length > 0) {
        return response.results
          .filter((contributor) => {
            const amount = contributor.contribution_receipt_amount || contributor.total || 0;
            return contributor.contributor_name && amount > 0;
          })
          .map((contributor) => {
            const amount = contributor.contribution_receipt_amount || contributor.total || 0;
            return {
              name: contributor.contributor_name || "Unknown",
              amount: formatCurrency(amount),
            };
          })
          .slice(0, 10); // Limit to top 10
      }
    } catch (candidateError) {
      // Endpoint doesn't exist (404) or other error - this is expected for many candidates
      // Don't log unless in development, and only if it's not a 404
      if (process.env.NODE_ENV === "development") {
        const is404 = candidateError instanceof Error && candidateError.message.includes("404");
        if (!is404) {
          console.log(`[fetchTopContributors] Candidate-level endpoint failed, trying committees:`, candidateError);
        }
      }
    }
    
    // Fallback: Get committees and aggregate
    const committeeIds = await getCandidateCommittees(fecCandidateId, cycle);
    
    if (committeeIds.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchTopContributors] No committees found for ${fecCandidateId}`);
      }
      return [];
    }
    
    // Aggregate contributors from all committees
    const contributorMap = new Map<string, number>();
    
    for (const committeeId of committeeIds) {
      try {
        const committeeParams: Record<string, string | number> = {
          sort: "-contribution_receipt_amount",
          per_page: 20, // Get more per committee to aggregate
        };
        
        if (cycle) {
          committeeParams.cycle = cycle;
        }
        
        const committeeResponse = await fecFetch<FecContributorsResponse>(
          `/committee/${committeeId}/schedules/schedule_a/by_contributor/`,
          {
            params: committeeParams,
            revalidate: 3600,
          }
        );
        
        if (committeeResponse.results) {
          for (const contributor of committeeResponse.results) {
            if (contributor.contributor_name) {
              const amount = contributor.contribution_receipt_amount || contributor.total || 0;
              const current = contributorMap.get(contributor.contributor_name) || 0;
              contributorMap.set(contributor.contributor_name, current + amount);
            }
          }
        }
      } catch (committeeError) {
        // Skip this committee if it fails (404s are common - endpoints may not exist)
        // Only log non-404 errors in development
        if (process.env.NODE_ENV === "development") {
          const is404 = committeeError instanceof Error && committeeError.message.includes("404");
          if (!is404) {
            console.warn(`[fetchTopContributors] Failed for committee ${committeeId}:`, committeeError);
          }
        }
      }
    }
    
    // Sort by total amount and return top 10
    const sortedContributors = Array.from(contributorMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchTopContributors] Aggregated results for ${fecCandidateId}:`, sortedContributors.length, "contributors");
    }
    
    return sortedContributors.map((contributor) => ({
      name: contributor.name,
      amount: formatCurrency(contributor.amount),
    }));
  } catch (error) {
    // Log error but don't throw - contributors are optional
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchTopContributors] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Fetch industry breakdown for a candidate
 * Tries candidate-level endpoint first, then falls back to committee-level aggregation
 */
async function fetchIndustryBreakdown(
  fecCandidateId: string,
  cycle?: number
): Promise<Array<{ industry: string; percentage: number }>> {
  try {
    const { fecFetch } = await import("../fec");
    
    // First, get total contributions to calculate percentages
    const totalsParams: Record<string, string | number> = {
      sort: "-cycle",
      per_page: 1,
    };
    
    if (cycle) {
      totalsParams.cycle = cycle;
    }
    
    const totalsResponse = await fecFetch<FecCandidateTotalsResponse>(
      `/candidate/${fecCandidateId}/totals/`,
      {
        params: totalsParams,
        revalidate: 3600,
      }
    );
    
    const totalRaised = totalsResponse.results?.[0]?.receipts || 0;
    
    if (totalRaised === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchIndustryBreakdown] No total raised for ${fecCandidateId}, skipping industry breakdown`);
      }
      return [];
    }
    
    // Try candidate-level endpoint first
    const industryParams: Record<string, string | number> = {
      sort: "-total", // Sort by total amount descending
      per_page: 10, // Top 10 industries
    };
    
    if (cycle) {
      industryParams.cycle = cycle;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchIndustryBreakdown] Fetching for ${fecCandidateId}, cycle: ${cycle}, totalRaised: ${totalRaised}`);
    }
    
    try {
      const response = await fecFetch<FecIndustryResponse>(
        `/candidate/${fecCandidateId}/schedules/schedule_a/by_employer/`,
        {
          params: industryParams,
          revalidate: 3600, // 1 hour cache
        }
      );
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchIndustryBreakdown] Candidate-level results for ${fecCandidateId}:`, response.results?.length || 0, "industries");
      }
      
      if (response.results && response.results.length > 0) {
        return response.results
          .filter((industry) => industry.employer && industry.total && industry.total > 0)
          .map((industry) => ({
            industry: industry.employer || "Unknown",
            percentage: Math.round((industry.total! / totalRaised) * 100),
          }))
          .slice(0, 10); // Limit to top 10
      }
    } catch (candidateError) {
      // Endpoint doesn't exist (404) or other error - this is expected for many candidates
      // Don't log unless in development, and only if it's not a 404
      if (process.env.NODE_ENV === "development") {
        const is404 = candidateError instanceof Error && candidateError.message.includes("404");
        if (!is404) {
          console.log(`[fetchIndustryBreakdown] Candidate-level endpoint failed, trying committees:`, candidateError);
        }
      }
    }
    
    // Fallback: Get committees and aggregate
    const committeeIds = await getCandidateCommittees(fecCandidateId, cycle);
    
    if (committeeIds.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchIndustryBreakdown] No committees found for ${fecCandidateId}`);
      }
      return [];
    }
    
    // Aggregate industry data from all committees
    const industryMap = new Map<string, number>();
    
    for (const committeeId of committeeIds) {
      try {
        const committeeParams: Record<string, string | number> = {
          sort: "-total",
          per_page: 20, // Get more per committee to aggregate
        };
        
        if (cycle) {
          committeeParams.cycle = cycle;
        }
        
        const committeeResponse = await fecFetch<FecIndustryResponse>(
          `/committee/${committeeId}/schedules/schedule_a/by_employer/`,
          {
            params: committeeParams,
            revalidate: 3600,
          }
        );
        
        if (committeeResponse.results) {
          for (const industry of committeeResponse.results) {
            if (industry.employer && industry.total) {
              const current = industryMap.get(industry.employer) || 0;
              industryMap.set(industry.employer, current + industry.total);
            }
          }
        }
      } catch (committeeError) {
        // Skip this committee if it fails (404s are common - endpoints may not exist)
        // Only log non-404 errors in development
        if (process.env.NODE_ENV === "development") {
          const is404 = committeeError instanceof Error && committeeError.message.includes("404");
          if (!is404) {
            console.warn(`[fetchIndustryBreakdown] Failed for committee ${committeeId}:`, committeeError);
          }
        }
      }
    }
    
    // Sort by total amount and calculate percentages
    const sortedIndustries = Array.from(industryMap.entries())
      .map(([employer, total]) => ({ employer, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchIndustryBreakdown] Aggregated results for ${fecCandidateId}:`, sortedIndustries.length, "industries");
    }
    
    return sortedIndustries.map((industry) => ({
      industry: industry.employer,
      percentage: Math.round((industry.total / totalRaised) * 100),
    }));
  } catch (error) {
    // Log error but don't throw - industry breakdown is optional
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchIndustryBreakdown] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Fetch money totals for a candidate from OpenFEC API
 * 
 * @param fecCandidateId - FEC candidate ID (e.g., "S4VT00033")
 * @returns MoneyModule object with financial totals and sources, or null if not found
 */
export async function fetchMoneyForCandidate(
  fecCandidateId: string
): Promise<MoneyModule | null> {
  try {
    const { fecFetch } = await import("../fec");
    
    // Fetch candidate totals for the most recent election cycle
    // Sort by cycle descending to get the latest cycle deterministically
    const response = await fecFetch<FecCandidateTotalsResponse>(
      `/candidate/${fecCandidateId}/totals/`,
      {
        params: {
          sort: "-cycle", // Most recent cycle first (descending)
          per_page: 1, // Just get the most recent cycle
          sort_hide_null: false, // Include all results
        },
        revalidate: 3600, // 1 hour cache
      }
    );
    
    if (!response.results || response.results.length === 0) {
      // No totals available - return null to show "not available" message
      return null;
    }
    
    // Get the first (most recent) result
    const totals = response.results[0];
    
    // Map OpenFEC fields to our MoneyModule format with safe fallbacks
    // Field mappings: receipts -> raised, disbursements -> spent, cash_on_hand_end_period -> cashOnHand
    // Use nullish coalescing to handle undefined, but check for null/0 separately
    const receipts = totals.receipts;
    const disbursements = totals.disbursements;
    const cashOnHandValue = totals.cash_on_hand_end_period;
    
    // Convert to numbers, defaulting to 0 if undefined/null
    const raised = typeof receipts === "number" ? receipts : 0;
    const spent = typeof disbursements === "number" ? disbursements : 0;
    const cashOnHand = typeof cashOnHandValue === "number" ? cashOnHandValue : 0;
    
    // If all totals are zero or missing, return null (data not available yet)
    // This prevents showing misleading zero values when data hasn't been filed
    if (raised === 0 && spent === 0 && cashOnHand === 0) {
      return null;
    }
    
    // Fetch top contributors and industry breakdown in parallel
    const [topContributors, industryBreakdown] = await Promise.all([
      fetchTopContributors(fecCandidateId, totals.cycle),
      fetchIndustryBreakdown(fecCandidateId, totals.cycle),
    ]);
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchMoneyForCandidate] Results for ${fecCandidateId}:`, {
        topContributors: topContributors.length,
        industryBreakdown: industryBreakdown.length,
        cycle: totals.cycle,
      });
    }
    
    // Create sources pointing to OpenFEC
    const sources: Source[] = [
      {
        title: "Candidate Financial Totals",
        publisher: "Federal Election Commission",
        date: totals.cycle?.toString(),
        excerpt: `Official campaign finance totals for election cycle ${totals.cycle}.`,
        url: `https://www.fec.gov/data/candidate/${fecCandidateId}/`,
      },
      {
        title: "OpenFEC API Data",
        publisher: "Federal Election Commission",
        excerpt: `Raw financial data from the OpenFEC API for candidate ${fecCandidateId}.`,
        url: `https://api.open.fec.gov/v1/candidate/${fecCandidateId}/totals/`,
      },
    ];
    
    return {
      totals: {
        raised,
        spent,
        cashOnHand,
      },
      topContributors,
      industryBreakdown,
      sources,
    };
  } catch (error) {
    console.error(`Failed to fetch money data for candidate ${fecCandidateId}:`, error);
    return null;
  }
}

