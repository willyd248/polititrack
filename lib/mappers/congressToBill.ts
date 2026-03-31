/**
 * Mapper from Congress.gov API v3 bill response to Polititrack Bill type
 * 
 * Congress.gov API documentation: https://api.congress.gov/
 */

import { TimelineEvent, Source } from "../../data/types";
import { Bill, BillSponsor } from "../../data/bills";
import { inferTopicFromText } from "../topicTagger";

// Congress.gov API response types
// Note: The detail endpoint returns actions/summaries/cosponsors as {count, url} objects.
// The list endpoint returns bills with latestAction inline.
// We handle both structures gracefully.
interface CongressBill {
  number: string | number;
  type: string; // "HR", "S", etc.
  congress: number;
  title: string;
  latestAction?: {
    text: string;
    actionDate: string;
  };
  updateDate?: string;
  // Detail endpoint: {count, url} object; not an inline text
  summary?: {
    text: string;
  };
  // Detail endpoint returns {count, url}; list endpoint omits this
  // We fetch actions separately if needed, but for now use latestAction
  actions?: Array<{
    text: string;
    actionDate: string;
    type?: string;
  }> | { count: number; url: string };
  url?: string;
  textVersions?: Array<{
    url: string;
    type: string;
  }> | { count: number; url: string };
  // Detail endpoint uses sponsors[] (array), list endpoint omits
  sponsor?: {
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
  };
  sponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    district?: number;
  }>;
  cosponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    cosponsorDate?: string;
  }> | { count: number; url: string };
  policyArea?: { name: string };
  introducedDate?: string;
}

interface CongressBillsResponse {
  bills?: CongressBill[];
  pagination?: {
    count: number;
    next?: string;
  };
}

interface CongressBillResponse {
  bill: CongressBill;
}

/**
 * Map Congress.gov bill ID format to Polititrack ID
 * Format: {congress}-{type}{number} (e.g., "118-hr123", "118-s1")
 */
export function formatBillId(congress: number, type: string, number: string): string {
  const typeLower = type.toLowerCase();
  return `${congress}-${typeLower}${number}`;
}

/**
 * Parse Polititrack bill ID to Congress.gov format
 * Format: {congress}-{type}{number} (e.g., "118-hr123", "118-s1")
 */
export function parseBillId(id: string): { congress: number; type: string; number: string } | null {
  const match = id.match(/^(\d+)-([a-z]+)(\d+)$/i);
  if (!match) return null;
  
  return {
    congress: parseInt(match[1], 10),
    type: match[2].toUpperCase(),
    number: match[3],
  };
}

/**
 * Map Congress.gov status to Polititrack status
 */
function mapStatus(bill: CongressBill): Bill["status"] {
  const latestAction = bill.latestAction?.text?.toLowerCase() || "";
  
  if (latestAction.includes("became public law") || latestAction.includes("signed")) {
    return "Passed";
  }
  if (latestAction.includes("failed") || latestAction.includes("vetoed")) {
    return "Failed";
  }
  if (latestAction.includes("committee") || latestAction.includes("referred")) {
    return "In Committee";
  }
  
  return "Introduced";
}

/**
 * Map Congress.gov actions to timeline events
 */
function mapTimelineEvents(bill: CongressBill, congress: number, type: string, number: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  const actionsArray = Array.isArray(bill.actions) ? bill.actions : [];
  if (actionsArray.length > 0) {
    actionsArray.forEach((action, index) => {
      const eventId = `timeline-${index}`;
      const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
      
      events.push({
        id: eventId,
        date: action.actionDate || bill.updateDate || "",
        title: action.text || "Action",
        details: action.text,
        topic: undefined, // Congress.gov doesn't provide topic categorization
        sources: [
          {
            title: "Congress.gov Bill Actions",
            publisher: "U.S. Congress",
            date: action.actionDate || "",
            url: billUrl,
            excerpt: `Official record of bill action: ${action.text}`,
          },
        ],
      });
    });
  } else if (bill.latestAction) {
    // Fallback to latest action if no actions array
    const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
    events.push({
      id: "timeline-0",
      date: bill.latestAction.actionDate || bill.updateDate || "",
      title: bill.latestAction.text || "Latest Action",
      details: bill.latestAction.text,
      sources: [
        {
          title: "Congress.gov Latest Action",
          publisher: "U.S. Congress",
          date: bill.latestAction.actionDate || "",
          url: billUrl,
          excerpt: `Latest action: ${bill.latestAction.text}`,
        },
      ],
    });
  }
  
  return events;
}

/**
 * Create summary sources from bill data
 */
function createSummarySources(
  bill: CongressBill,
  congress: number,
  type: string,
  number: string,
  summaryText?: string
): Source[] {
  const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
  const sources: Source[] = [
    {
      title: "Congress.gov Bill Page",
      publisher: "U.S. Congress",
      date: bill.updateDate || "",
      url: billUrl,
      excerpt: `Official bill page for ${type} ${number} (${congress}th Congress)`,
    },
  ];
  
  // Add summary source if official summary exists
  if (summaryText) {
    sources.unshift({
      title: "Official Bill Summary",
      publisher: "Congress.gov",
      date: bill.updateDate || "",
      url: billUrl,
      excerpt: `Official summary text for ${type} ${number} from Congress.gov.`,
    });
  }
  
  // Add text version if available (detail endpoint returns {count, url}, skip in that case)
  if (Array.isArray(bill.textVersions) && bill.textVersions.length > 0) {
    const textVersion = bill.textVersions[0];
    sources.push({
      title: `Bill Text (${textVersion.type})`,
      publisher: "U.S. Congress",
      date: bill.updateDate || "",
      url: textVersion.url,
      excerpt: `Full text of ${type} ${number}`,
    });
  }
  
  return sources;
}

/**
 * Map Congress.gov sponsor to BillSponsor
 */
function mapSponsor(sponsor?: { bioguideId: string; firstName?: string; lastName?: string; fullName?: string; party?: string; state?: string }): BillSponsor | undefined {
  if (!sponsor || !sponsor.bioguideId) return undefined;
  
  return {
    bioguideId: sponsor.bioguideId,
    name: sponsor.fullName || `${sponsor.firstName || ""} ${sponsor.lastName || ""}`.trim(),
    party: sponsor.party,
    state: sponsor.state,
  };
}

/**
 * Map Congress.gov cosponsors to BillSponsor array (limit 10)
 */
function mapCosponsors(cosponsors?: Array<{ bioguideId: string; firstName?: string; lastName?: string; fullName?: string; party?: string; state?: string; cosponsorDate?: string }>): BillSponsor[] {
  if (!cosponsors || cosponsors.length === 0) return [];
  
  return cosponsors
    .slice(0, 10) // Limit to 10
    .map((cosponsor) => ({
      bioguideId: cosponsor.bioguideId,
      name: cosponsor.fullName || `${cosponsor.firstName || ""} ${cosponsor.lastName || ""}`.trim(),
      party: cosponsor.party,
      state: cosponsor.state,
    }))
    .filter((cosponsor) => cosponsor.bioguideId); // Filter out any invalid entries
}

/**
 * Create sponsor/cosponsor sources
 */
function createSponsorSources(
  bill: CongressBill,
  congress: number,
  type: string,
  number: string
): Source[] {
  const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
  const sources: Source[] = [
    {
      title: "Congress.gov Bill Page - Cosponsors",
      publisher: "Congress.gov",
      date: bill.updateDate || "",
      url: billUrl,
      excerpt: `Official bill page with sponsor and cosponsor information for ${type} ${number}.`,
    },
  ];
  
  // Add Congress.gov API endpoint for cosponsors if available
  sources.push({
    title: "Congress.gov API - Bill Cosponsors",
    publisher: "Congress.gov",
    date: bill.updateDate || "",
    url: `https://api.congress.gov/v3/bill/${congress}/${type}/${number}/cosponsors`,
    excerpt: `API endpoint for cosponsor data for ${type} ${number}.`,
  });
  
  return sources;
}

/**
 * Map Congress.gov bill to Polititrack Bill type
 */
export function mapCongressBillToBill(congressBill: CongressBill): Bill {
  const congress = congressBill.congress;
  const type = congressBill.type;
  const number = String(congressBill.number);
  const id = formatBillId(congress, type, number);
  
  // Extract official summary text from Congress.gov
  const summaryText = congressBill.summary?.text || undefined;
  
  // Convert summary text to bullet points if available
  // Otherwise use placeholder
  const summary = summaryText
    ? summaryText
        .split(/[.\n]/)
        .filter((s) => s.trim().length > 20)
        .slice(0, 6) // Allow more bullets for real summaries
        .map((s) => s.trim() + (s.trim().endsWith(".") ? "" : "."))
    : [
        `This bill was introduced in the ${congress}th Congress.`,
        "Detailed summary information is being processed.",
      ];
  
  // Map status
  const status = mapStatus(congressBill);
  
  // Create timeline from actions
  const timeline = mapTimelineEvents(congressBill, congress, type, number);
  
  // Create summary sources - include Congress.gov summary endpoint if summary exists
  const summarySources = createSummarySources(congressBill, congress, type, number, summaryText);
  
  // Map sponsor — detail endpoint uses sponsors[] array, list uses sponsor
  const sponsorData = congressBill.sponsor || (congressBill.sponsors && congressBill.sponsors[0]) || undefined;
  const sponsor = mapSponsor(sponsorData);
  // Cosponsors — detail endpoint returns {count, url}, list may have inline array
  const cosponsors = Array.isArray(congressBill.cosponsors)
    ? mapCosponsors(congressBill.cosponsors)
    : [];
  
  // Create sponsor sources if sponsor/cosponsors exist
  const sponsorSources = (sponsor || cosponsors.length > 0)
    ? createSponsorSources(congressBill, congress, type, number)
    : undefined;
  
  // Create status and next steps from latest action
  const statusAndNextSteps = congressBill.latestAction
    ? [
        {
          step: congressBill.latestAction.text,
          date: congressBill.latestAction.actionDate,
        },
      ]
    : [];
  
  // Infer topic from bill title and summary
  const topicText = `${congressBill.title} ${congressBill.summary?.text || ""}`;
  const topic = inferTopicFromText(topicText) || undefined;
  
  return {
    id,
    name: `${type} ${number}: ${congressBill.title}`,
    status,
    topic,
    summary,
    summaryText, // Store official summary text if available
    sponsor,
    cosponsors: cosponsors.length > 0 ? cosponsors : undefined,
    sponsorSources,
    whatChangesForMostPeople: [
      "Impact analysis will be available once the bill progresses further.",
      "Check back for updates on how this bill affects everyday Americans.",
    ],
    whoIsImpacted: ["Analysis pending"],
    argumentsFor: ["Arguments will be updated as the bill progresses."],
    argumentsAgainst: ["Arguments will be updated as the bill progresses."],
    statusAndNextSteps,
    timeline,
    summarySources,
  };
}

/**
 * Fetch and map a single bill from Congress.gov
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  const parsed = parseBillId(id);
  if (!parsed) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[fetchBillById] Invalid bill ID format: ${id}. Expected format: {congress}-{type}{number} (e.g., "118-hr123")`);
    }
    return null;
  }
  
  const { congress, type, number } = parsed;
  
  if (process.env.NODE_ENV === "development") {
    console.log(`[fetchBillById] Fetching bill: ${id} -> Congress: ${congress}, Type: ${type}, Number: ${number}`);
  }
  
  try {
    const { congressFetch } = await import("../congress");
    const response = await congressFetch<CongressBillResponse>(
      `/bill/${congress}/${type.toLowerCase()}/${number}`,
      { revalidate: 1800 } // 30 minutes
    );
    
    if (!response.bill) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[fetchBillById] No bill data in response for ${id}`);
      }
      return null;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchBillById] Successfully fetched bill ${id}: ${response.bill.title}`);
    }
    
    return mapCongressBillToBill(response.bill);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[fetchBillById] Failed to fetch bill ${id} (${congress}/${type}/${number}):`, errorMessage);
    return null;
  }
}

/**
 * Fetch list of bills from Congress.gov
 */
export async function fetchBills(limit: number = 10): Promise<Bill[]> {
  try {
    const { congressFetch } = await import("../congress");
    const response = await congressFetch<CongressBillsResponse>(
      "/bill/119",
      {
        params: {
          limit,
          sort: "updateDate desc", // Most recently updated first
        },
        revalidate: 1800, // 30 minutes
      }
    );
    
    if (!response.bills || response.bills.length === 0) {
      return [];
    }
    
    return response.bills.map(mapCongressBillToBill);
  } catch (error) {
    console.error("Failed to fetch bills:", error);
    return [];
  }
}

