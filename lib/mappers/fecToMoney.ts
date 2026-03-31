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
  designation?: string; // 'P' = principal campaign committee
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
 * FEC API response types for individual schedule_a contributions
 */
interface FecScheduleAItem {
  contributor_name?: string;
  contribution_receipt_amount?: number;
  contributor_aggregate_ytd?: number;
}

interface FecScheduleAResponse {
  results?: FecScheduleAItem[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

/**
 * FEC API response types for industry/employer breakdown
 */
interface FecEmployerItem {
  employer?: string;
  total?: number;
  count?: number;
}

interface FecEmployerResponse {
  results?: FecEmployerItem[];
  pagination?: {
    count: number;
    page: number;
    pages: number;
  };
}

/**
 * In-memory cache to prevent burning FEC rate limit (60 req/hr)
 * Keyed by FEC candidate ID, value is { data, timestamp }
 */
const moneyCache = new Map<string, { data: MoneyModule | null; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get committees for a candidate, preferring the principal campaign committee
 */
async function getCandidateCommittees(
  fecCandidateId: string,
  cycle?: number
): Promise<string[]> {
  try {
    const { fecFetch } = await import("../fec");

    const params: Record<string, string | number> = {
      per_page: 20,
    };

    if (cycle) {
      params.cycle = cycle;
    }

    const response = await fecFetch<FecCommitteesResponse>(
      `/candidate/${fecCandidateId}/committees/`,
      {
        params,
        revalidate: 86400,
      }
    );

    if (!response.results || response.results.length === 0) {
      return [];
    }

    // Sort to put principal campaign committee first (designation = 'P')
    const sorted = [...response.results].sort((a, b) => {
      if (a.designation === "P") return -1;
      if (b.designation === "P") return 1;
      return 0;
    });

    return sorted
      .filter((c) => c.committee_id)
      .map((c) => c.committee_id!)
      .slice(0, 3); // Limit to top 3 committees
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[getCandidateCommittees] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Aggregate raw schedule_a contributions by contributor name
 */
function aggregateContributors(
  results: FecScheduleAItem[]
): Array<{ name: string; amount: string }> {
  const contributorMap = new Map<string, number>();

  for (const item of results) {
    if (item.contributor_name) {
      const amount = item.contribution_receipt_amount || 0;
      if (amount > 0) {
        const current = contributorMap.get(item.contributor_name) || 0;
        contributorMap.set(item.contributor_name, current + amount);
      }
    }
  }

  return Array.from(contributorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount: formatCurrency(amount) }));
}

/**
 * Fetch top contributors for a candidate
 * Uses /schedules/schedule_a/ with committee_id (correct OpenFEC endpoint)
 */
async function fetchTopContributors(
  fecCandidateId: string,
  cycle?: number
): Promise<Array<{ name: string; amount: string }>> {
  try {
    const { fecFetch } = await import("../fec");

    // Get committee IDs first
    const committeeIds = await getCandidateCommittees(fecCandidateId, cycle);

    if (committeeIds.length === 0) {
      // Fallback: try querying by candidate_id directly
      const params: Record<string, string | number | boolean> = {
        candidate_id: fecCandidateId,
        sort: "-contribution_receipt_amount",
        per_page: 100,
        sort_hide_null: true,
      };
      if (cycle) params.two_year_transaction_period = cycle;

      const response = await fecFetch<FecScheduleAResponse>(
        `/schedules/schedule_a/`,
        { params, revalidate: 86400 }
      );
      return aggregateContributors(response.results || []);
    }

    // Fetch contributions for the primary committee (largest, most recent cycle)
    const primaryCommitteeId = committeeIds[0];
    const params: Record<string, string | number | boolean> = {
      committee_id: primaryCommitteeId,
      sort: "-contribution_receipt_amount",
      per_page: 100,
      sort_hide_null: true,
    };
    if (cycle) params.two_year_transaction_period = cycle;

    const response = await fecFetch<FecScheduleAResponse>(
      `/schedules/schedule_a/`,
      { params, revalidate: 86400 }
    );

    const contributors = aggregateContributors(response.results || []);

    return contributors;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchTopContributors] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Industry classification rules — match employer/organization names to real sectors.
 * Order matters: first match wins, so put specific patterns before generic ones.
 */
const INDUSTRY_RULES: Array<{ sector: string; patterns: RegExp }> = [
  { sector: "Defense", patterns: /DEFENSE|LOCKHEED|RAYTHEON|BOEING|NORTHROP|GRUMMAN|GENERAL DYNAMICS|BAE SYSTEMS|L3HARRIS|LEIDOS|SAIC|HUNTINGTON INGALLS|MILITARY|ARMED FORCES/ },
  { sector: "Healthcare", patterns: /HEALTH|PHARMA|MEDICAL|HOSPITAL|AETNA|CIGNA|UNITEDHEALTH|HUMANA|ANTHEM|BLUECROSS|BLUE CROSS|KAISER|PFIZER|JOHNSON & JOHNSON|MERCK|ABBOTT|AMGEN|BIOTECH|NURSE|PHYSICIAN|DOCTOR|DENTAL|OPTOM|CLINIC|SURGICAL|ORTHO|CARDIO|ONCOL/ },
  { sector: "Energy", patterns: /ENERGY|OIL|GAS|PETROLEUM|EXXON|CHEVRON|SHELL|CONOCO|HALLIBURTON|SCHLUMBERGER|SOLAR|WIND POWER|PIPELINE|DRILLING|REFIN|UTILITIES|ELECTRIC POWER|COAL|MINING|NUCLEAR/ },
  { sector: "Finance & Insurance", patterns: /BANK|FINANCIAL|INSURANCE|GOLDMAN|JPMORGAN|JP MORGAN|WELLS FARGO|MORGAN STANLEY|CITIGROUP|CITI|CREDIT SUISSE|BLACKROCK|VANGUARD|FIDELITY|CAPITAL GROUP|STATE STREET|PRUDENTIAL|METLIFE|ALLSTATE|BERKSHIRE|HEDGE|PRIVATE EQUITY|VENTURE CAPITAL|INVESTMENT|SECURITIES|BROKER|MUTUAL FUND|ASSET MANAGE/ },
  { sector: "Technology", patterns: /TECH|GOOGLE|ALPHABET|MICROSOFT|APPLE INC|META PLATFORMS|FACEBOOK|AMAZON|ORACLE|INTEL|IBM|CISCO|SALESFORCE|ADOBE|NVIDIA|QUALCOMM|SOFTWARE|COMPUTER|CYBER|DATA|CLOUD|DIGITAL|\.COM|SEMICONDUCTOR|SILICON/ },
  { sector: "Real Estate", patterns: /REAL ESTATE|REALTOR|REALTY|HOUSING|PROPERTY|MORTGAGE|HOME BUILD|CONSTRUCTION|DEVELOP.*GROUP|DEVELOP.*CORP|DEVELOP.*LLC|BUILDING|ARCHITECT/ },
  { sector: "Education", patterns: /EDUCATION|TEACHER|UNIVERSITY|COLLEGE|SCHOOL|PROFESSOR|ACADEMIC|TUTOR|LIBRARIAN|STUDENT|HIGHER ED/ },
  { sector: "Agriculture", patterns: /AGRICULTUR|FARM|RANCH|CROP|LIVESTOCK|DAIRY|CATTLE|POULTRY|GRAIN|SEED|FERTILIZ|MONSANTO|CARGILL|ARCHER DANIELS|ADM|DEERE|AGRI/ },
  { sector: "Transportation", patterns: /TRANSPORT|AIRLINE|RAILROAD|RAIL|FREIGHT|SHIPPING|LOGISTICS|TRUCKING|AVIATION|PILOT|FEDEX|UPS(?:\s|$)|DELTA AIR|UNITED AIR|AMERICAN AIR|SOUTHWEST AIR|UBER|LYFT|TRANSIT/ },
  { sector: "Telecommunications", patterns: /TELECOM|COMCAST|VERIZON|AT&T|T-MOBILE|SPRINT|CHARTER COMM|CABLE|WIRELESS|BROADCAST|MEDIA GROUP|NEWS CORP|DISNEY|WARNER|NBC|CBS|FOX\s/ },
  { sector: "Labor Unions", patterns: /LABOR|UNION|WORKERS|AFL.CIO|SEIU|TEAMSTER|AFSCME|UAW|IBEW|UFCW|CARPENTERS|PLUMBERS|IRONWORKER|SHEET METAL|OPERATING ENGINEER|PIPE ?FITTER|MACHINISTS|STEELWORK/ },
  { sector: "Legal", patterns: /LAW\b|ATTORNEY|LEGAL|LAWYER|FIRM.*LLP|LLP$|LITIGATION|COUNSEL/ },
  { sector: "Retail & Consumer", patterns: /RETAIL|WALMART|TARGET|COSTCO|HOME DEPOT|LOWE'S|CONSUMER|RESTAURANT|FOOD SERVICE|MCDONALD|STARBUCK|HOSPITALITY|HOTEL|MARRIOTT|HILTON/ },
  { sector: "Manufacturing", patterns: /MANUFACTUR|INDUSTRIAL|FACTORY|STEEL|ALUMINUM|CHEMICAL|DOW CHEM|DUPONT|3M|CATERPILLAR|HONEYWELL|GENERAL ELECTRIC/ },
  { sector: "Lobbying & Political", patterns: /LOBBY|POLITICAL|PAC$|COMMITTEE|CAMPAIGN|GOVERNMENT AFFAIR|PUBLIC AFFAIR|ADVOCACY|CIVIC/ },
];

/**
 * Employers/occupations that are noise for industry classification — these are
 * individual donor statuses, not actual industries.
 */
const NOISE_EMPLOYERS = new Set([
  "SELF-EMPLOYED", "SELF EMPLOYED", "SELF", "NOT EMPLOYED", "NONE", "N/A",
  "RETIRED", "HOMEMAKER", "STUDENT", "UNEMPLOYED", "NULL", "INFORMATION REQUESTED",
  "INFORMATION REQUESTED PER BEST EFFORTS", "-", "",
]);

/**
 * Classify an employer/organization name into an industry sector.
 * Returns null if the name is noise or unclassifiable.
 */
function classifyIndustry(name: string): string | null {
  const upper = name.toUpperCase().trim();
  if (NOISE_EMPLOYERS.has(upper)) return null;

  for (const rule of INDUSTRY_RULES) {
    if (rule.patterns.test(upper)) return rule.sector;
  }

  return null; // Unclassified — will be grouped separately
}

/**
 * Fetch industry breakdown for a candidate by classifying employer/org contributions
 * into real industry sectors (Defense, Healthcare, Finance, etc.).
 *
 * Uses /schedules/schedule_a/by_employer/ with a larger result set, then maps
 * each employer to an industry sector via keyword classification.
 */
async function fetchIndustryBreakdown(
  fecCandidateId: string,
  totalRaised: number,
  cycle?: number
): Promise<Array<{ industry: string; percentage: number }>> {
  try {
    if (totalRaised === 0) return [];

    const { fecFetch } = await import("../fec");

    const committeeIds = await getCandidateCommittees(fecCandidateId, cycle);

    // Fetch raw employer data — request 100 results to get better classification coverage
    const buildParams = (idKey: string, idValue: string): Record<string, string | number | boolean> => {
      const p: Record<string, string | number | boolean> = {
        [idKey]: idValue,
        sort: "-total",
        per_page: 100,
        sort_hide_null: true,
      };
      if (cycle) p.two_year_transaction_period = cycle;
      return p;
    };

    const idKey = committeeIds.length > 0 ? "committee_id" : "candidate_id";
    const idValue = committeeIds.length > 0 ? committeeIds[0] : fecCandidateId;
    const params = buildParams(idKey, idValue);

    const response = await fecFetch<FecEmployerResponse>(
      `/schedules/schedule_a/by_employer/`,
      { params, revalidate: 86400 }
    );

    // Classify each employer into an industry sector and aggregate totals
    const sectorTotals = new Map<string, number>();
    let unclassifiedTotal = 0;

    for (const item of response.results || []) {
      if (!item.employer || !item.total || item.total <= 0) continue;

      const sector = classifyIndustry(item.employer);
      if (sector) {
        sectorTotals.set(sector, (sectorTotals.get(sector) || 0) + item.total);
      } else {
        // Only count genuinely unclassified orgs, not noise
        const upper = item.employer.toUpperCase().trim();
        if (!NOISE_EMPLOYERS.has(upper)) {
          unclassifiedTotal += item.total;
        }
      }
    }

    // Add "Other" bucket if there's meaningful unclassified money
    if (unclassifiedTotal > 0) {
      sectorTotals.set("Other", unclassifiedTotal);
    }

    if (sectorTotals.size === 0) return [];

    const sorted = Array.from(sectorTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Normalize percentages so they sum to 100%
    const sectorSum = sorted.reduce((sum, [, total]) => sum + total, 0);
    const denominator = sectorSum > 0 ? sectorSum : 1;

    return sorted.map(([sector, total]) => ({
      industry: sector,
      percentage: Math.round((total / denominator) * 100),
    }));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchIndustryBreakdown] Failed for ${fecCandidateId}:`, error);
    }
    return [];
  }
}

/**
 * Fetch money totals for a candidate from OpenFEC API
 *
 * @param fecCandidateId - FEC candidate ID (e.g., "H6AL04098")
 * @returns MoneyModule object with financial totals and sources, or null if not found
 */
export async function fetchMoneyForCandidate(
  fecCandidateId: string
): Promise<MoneyModule | null> {
  // Check in-memory cache first
  const cached = moneyCache.get(fecCandidateId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const { fecFetch } = await import("../fec");

    // Fetch candidate totals for the most recent election cycle
    const response = await fecFetch<FecCandidateTotalsResponse>(
      `/candidate/${fecCandidateId}/totals/`,
      {
        params: {
          sort: "-cycle",
          per_page: 1,
          sort_hide_null: false,
        },
        revalidate: 86400,
      }
    );

    if (!response.results || response.results.length === 0) {
      moneyCache.set(fecCandidateId, { data: null, timestamp: Date.now() });
      return null;
    }

    const totals = response.results[0];

    const receipts = totals.receipts;
    const disbursements = totals.disbursements;
    const cashOnHandValue = totals.cash_on_hand_end_period;

    const raised = typeof receipts === "number" ? receipts : 0;
    const spent = typeof disbursements === "number" ? disbursements : 0;
    const cashOnHand = typeof cashOnHandValue === "number" ? cashOnHandValue : 0;

    if (raised === 0 && spent === 0 && cashOnHand === 0) {
      moneyCache.set(fecCandidateId, { data: null, timestamp: Date.now() });
      return null;
    }

    // Fetch top contributors and industry breakdown in parallel
    // Pass totalRaised to industry breakdown to avoid a redundant totals call
    const [topContributors, industryBreakdown] = await Promise.all([
      fetchTopContributors(fecCandidateId, totals.cycle),
      fetchIndustryBreakdown(fecCandidateId, raised, totals.cycle),
    ]);

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

    const result: MoneyModule = {
      totals: { raised, spent, cashOnHand },
      topContributors,
      industryBreakdown,
      sources,
    };

    moneyCache.set(fecCandidateId, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`Failed to fetch money data for candidate ${fecCandidateId}:`, error);
    moneyCache.set(fecCandidateId, { data: null, timestamp: Date.now() });
    return null;
  }
}
