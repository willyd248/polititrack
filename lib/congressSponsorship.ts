/**
 * Congress.gov API v3 member sponsorship utilities
 * 
 * Server-only utilities for fetching sponsored and cosponsored bills.
 * Do not import this in client components.
 * 
 * Documentation: https://api.congress.gov/
 */

import { Source } from "../data/types";
import { formatBillId } from "./mappers/congressToBill";
import { inferTopicFromText } from "./topicTagger";
import { recordSourceStatus } from "./dataHealth";

// Congress.gov API response types
interface CongressBill {
  number: string;
  type: string; // "HR", "S", etc.
  congress: number;
  title: string;
  latestAction?: {
    text: string;
    actionDate: string;
  };
  updateDate?: string;
  url?: string;
}

interface CongressBillsResponse {
  bills?: CongressBill[];
  // Congress.gov API v3 returns sponsoredLegislation as either:
  // - An array directly: sponsoredLegislation: CongressBill[]
  // - An object with bills: sponsoredLegislation: { bills: CongressBill[], pagination: {...} }
  sponsoredLegislation?: CongressBill[] | {
    bills?: CongressBill[];
    pagination?: {
      count: number;
      next?: string;
    };
  };
  // Same for cosponsoredLegislation
  cosponsoredLegislation?: CongressBill[] | {
    bills?: CongressBill[];
    pagination?: {
      count: number;
      next?: string;
    };
  };
  pagination?: {
    count: number;
    next?: string;
  };
}

export interface LegislativeActivityItem {
  id: string; // Polititrack bill ID (e.g., "118-hr123")
  title: string;
  type: string; // "HR", "S", etc.
  number: string;
  congress: number;
  topic?: string; // Inferred topic (e.g., "Healthcare", "Environment")
  latestAction: string | null;
  updateDate: string | null;
  url: string | null;
  sources: Source[];
}

/**
 * Create sources for a bill item
 */
function createBillSources(bill: CongressBill): Source[] {
  const billUrl = bill.url || 
    `https://www.congress.gov/bill/${bill.congress}th-congress/${bill.type.toLowerCase()}-bill/${bill.number}`;
  
  return [
    {
      title: "Bill Details",
      publisher: "Congress.gov",
      date: bill.updateDate || undefined,
      excerpt: `Official bill information and status for ${bill.type} ${bill.number}.`,
      url: billUrl,
    },
    {
      title: "Bill Text",
      publisher: "Congress.gov",
      excerpt: `Full text and amendments for ${bill.type} ${bill.number}.`,
      url: `${billUrl}/text`,
    },
  ];
}

/**
 * Fetch bills sponsored by a member
 * 
 * Uses Congress.gov API v3 member endpoint: /member/{bioguideId}/sponsored-legislation
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @param congress - Congress number (default: 118)
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of legislative activity items
 */
export async function fetchSponsoredBills(
  bioguideId: string,
  congress: number = 118,
  limit: number = 10
): Promise<LegislativeActivityItem[]> {
  try {
    const { congressFetch } = await import("./congress");
    
    // Use the official member endpoint for sponsored legislation
    const response = await congressFetch<CongressBillsResponse>(
      `/member/${bioguideId}/sponsored-legislation`,
      {
        params: {
          congress: congress,
          limit: limit,
          sort: "updateDate+desc", // Most recently updated first
        },
        revalidate: 3600, // 1 hour cache
      }
    );
    
    // Handle different response structures
    // Congress.gov API v3 returns:
    // - response.sponsoredLegislation as an array directly (not nested under .bills)
    // - OR response.sponsoredLegislation.bills (nested)
    // - OR response.bills (flat array)
    const bills = Array.isArray(response.sponsoredLegislation)
      ? response.sponsoredLegislation
      : response.bills || response.sponsoredLegislation?.bills || [];
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchSponsoredBills] ${bioguideId}:`, {
        hasBills: !!response.bills,
        hasSponsoredLegislation: !!response.sponsoredLegislation,
        isArray: Array.isArray(response.sponsoredLegislation),
        billsCount: bills.length,
        responseKeys: Object.keys(response),
      });
    }
    
    if (bills.length === 0) {
      recordSourceStatus("congress", true, `No sponsored legislation found for ${bioguideId} in 118th Congress.`);
      return [];
    }
    
    recordSourceStatus("congress", true);
    
    return bills.map((bill: CongressBill) => {
      const id = formatBillId(bill.congress, bill.type, bill.number);
      const sources = createBillSources(bill);
      
      // Infer topic from bill title
      const topic = inferTopicFromText(bill.title) || undefined;
      
      return {
        id,
        title: bill.title,
        type: bill.type,
        number: bill.number,
        congress: bill.congress,
        topic,
        latestAction: bill.latestAction?.text || null,
        updateDate: bill.updateDate || null,
        url: bill.url || null,
        sources,
      };
    });
  } catch (error) {
    console.warn(`Failed to fetch sponsored bills for ${bioguideId}:`, error);
    return [];
  }
}

/**
 * Fetch bills cosponsored by a member
 * 
 * Uses Congress.gov API v3 member endpoint: /member/{bioguideId}/cosponsored-legislation
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @param congress - Congress number (default: 118)
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of legislative activity items
 */
export async function fetchCosponsoredBills(
  bioguideId: string,
  congress: number = 118,
  limit: number = 10
): Promise<LegislativeActivityItem[]> {
  try {
    const { congressFetch } = await import("./congress");
    
    // Use the official member endpoint for cosponsored legislation
    const response = await congressFetch<CongressBillsResponse>(
      `/member/${bioguideId}/cosponsored-legislation`,
      {
        params: {
          congress: congress,
          limit: limit,
          sort: "updateDate+desc", // Most recently updated first
        },
        revalidate: 3600, // 1 hour cache
      }
    );
    
    // Handle different response structures
    // Congress.gov API v3 returns:
    // - response.cosponsoredLegislation as an array directly (not nested under .bills)
    // - OR response.cosponsoredLegislation.bills (nested)
    // - OR response.bills (flat array)
    const bills = Array.isArray(response.cosponsoredLegislation)
      ? response.cosponsoredLegislation
      : response.bills || 
        response.cosponsoredLegislation?.bills || 
        (response as any).member?.cosponsoredLegislation?.bills ||
        [];
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchCosponsoredBills] ${bioguideId}:`, {
        hasBills: !!response.bills,
        hasCosponsoredLegislation: !!response.cosponsoredLegislation,
        isArray: Array.isArray(response.cosponsoredLegislation),
        billsCount: bills.length,
        responseKeys: Object.keys(response),
      });
    }
    
    if (bills.length === 0) {
      recordSourceStatus("congress", true, `No cosponsored legislation found for ${bioguideId} in 118th Congress.`);
      return [];
    }
    
    recordSourceStatus("congress", true);
    
    return bills.map((bill: CongressBill) => {
      const id = formatBillId(bill.congress, bill.type, bill.number);
      const sources = createBillSources(bill);
      
      // Infer topic from bill title
      const topic = inferTopicFromText(bill.title) || undefined;
      
      return {
        id,
        title: bill.title,
        type: bill.type,
        number: bill.number,
        congress: bill.congress,
        topic,
        latestAction: bill.latestAction?.text || null,
        updateDate: bill.updateDate || null,
        url: bill.url || null,
        sources,
      };
    });
  } catch (error) {
    console.warn(`Failed to fetch cosponsored bills for ${bioguideId}:`, error);
    return [];
  }
}

