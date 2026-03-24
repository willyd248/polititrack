/**
 * Congress.gov API v3 member fetching utilities
 * 
 * Server-only utilities for fetching member data from the Congress.gov API.
 * Do not import this in client components.
 * 
 * Documentation: https://api.congress.gov/
 */

import { Member } from "../data/types-members";
import { mapCongressMemberToMember } from "./mappers/congressToMember";
import { FEC_CANDIDATE_BY_BIOGUIDE } from "../data/fec-mapping";

// Congress.gov API response types
// Note: Name fields may come in various formats - see congressToMember.ts for parsing
interface CongressMember {
  bioguideId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  directOrderName?: string;
  invertedOrderName?: string;
  chamber?: "House" | "Senate";
  state: string;
  district?: string | number;
  party?: string;
  partyName?: string; // Congress.gov list endpoint returns this (e.g., "Democratic")
  partyHistory?: Array<{ partyName: string; startDate?: string; endDate?: string }>;
  imageUrl?: string;
  officialWebsite?: string;
  // Note: fecCandidateId is NOT used from Congress.gov API response
  // It comes from our explicit mapping table in data/fec-mapping.ts
}

interface CongressMembersResponse {
  members?: CongressMember[];
  pagination?: {
    count: number;
    next?: string;
  };
}

interface CongressMemberResponse {
  member: CongressMember;
}

/**
 * Fetch current members from Congress.gov API v3
 * 
 * @param congress - Congress number (e.g., 118 for 118th Congress). Defaults to current Congress.
 * @returns Array of Member objects
 */
export async function fetchMembers(congress?: number): Promise<Member[]> {
  try {
    const { congressFetch } = await import("./congress");
    const congressNumber = congress || 119; // 119th Congress (2025-2027)
    
    // Fetch all members with pagination (API max is 250 per page)
    const PAGE_SIZE = 250;
    let allMembers: CongressMember[] = [];
    let offset = 0;
    let totalCount = Infinity;

    while (offset < totalCount) {
      const response = await congressFetch<CongressMembersResponse>(
        `/member`,
        {
          params: {
            congress: congressNumber,
            currentMember: true,
            limit: PAGE_SIZE,
            offset,
          },
          revalidate: 21600, // 6 hours cache
        }
      );

      if (!response.members || response.members.length === 0) break;

      allMembers = allMembers.concat(response.members);

      // Update total from pagination metadata
      if (response.pagination?.count) {
        totalCount = response.pagination.count;
      } else {
        break; // No pagination info, stop
      }

      offset += PAGE_SIZE;

      // Safety: don't fetch more than 3 pages (750 members max)
      if (offset >= PAGE_SIZE * 3) break;
    }

    if (allMembers.length === 0) {
      return [];
    }

    console.log(`[fetchMembers] Fetched ${allMembers.length} members for ${congressNumber}th Congress`);
    
    // Map all members — skip expensive FEC/LIS lookups in bulk fetch
    // Individual profile pages will do full lookups
    const mappedMembers = await Promise.all(
      allMembers.map((member) =>
        mapCongressMemberToMember(member, { skipFecLookup: true, skipLisLookup: true })
      )
    );
    
    return mappedMembers;
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return [];
  }
}

/**
 * Fetch a single member by Bioguide ID
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @param congress - Optional Congress number. Defaults to current Congress.
 * @returns Member object or null if not found
 */
export async function fetchMemberByBioguideId(
  bioguideId: string,
  congress?: number,
  options?: { skipFecLookup?: boolean; skipLisLookup?: boolean }
): Promise<Member | null> {
  try {
    const { congressFetch } = await import("./congress");
    const congressNumber = congress || 119;
    
    const response = await congressFetch<CongressMemberResponse>(
      `/member/${bioguideId}`,
      {
        params: {
          congress: congressNumber,
        },
        revalidate: 21600, // 6 hours cache
      }
    );
    
    if (!response.member) {
      return null;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[fetchMemberByBioguideId] Raw Congress.gov response for ${bioguideId}:`, {
        bioguideId: response.member.bioguideId,
        state: response.member.state,
        chamber: response.member.chamber,
        district: response.member.district,
        name: response.member.name,
        firstName: response.member.firstName,
        lastName: response.member.lastName,
        party: response.member.party,
        partyHistory: (response.member as any).partyHistory,
        allKeys: Object.keys(response.member),
      });
    }
    
    // Congress.gov API v3 may not return chamber directly
    // Infer chamber from district: House members have districts, Senators don't
    if (!response.member.chamber) {
      if (response.member.district !== undefined && response.member.district !== null) {
        response.member.chamber = "House";
      } else {
        // If no district, likely a Senator
        // Note: Some House members are at-large (no district), but that's rare
        // We can also check the bioguideId pattern: House IDs often start with different letters
        // For now, default to Senate if no district
        response.member.chamber = "Senate";
      }
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[fetchMemberByBioguideId] Inferred chamber for ${bioguideId}:`, response.member.chamber, "based on district:", response.member.district);
      }
    }
    
    return await mapCongressMemberToMember(response.member, options);
  } catch (error) {
    console.error(`Failed to fetch member ${bioguideId}:`, error);
    return null;
  }
}

/**
 * Fetch members by state
 * 
 * @param state - Two-letter state code (e.g., "CA")
 * @param congress - Optional Congress number. Defaults to current Congress.
 * @returns Array of Member objects from that state
 */
export async function fetchMembersByState(
  state: string,
  congress?: number
): Promise<Member[]> {
  try {
    const { congressFetch } = await import("./congress");
    const congressNumber = congress || 119;
    
    const response = await congressFetch<CongressMembersResponse>(
      `/member`,
      {
        params: {
          congress: congressNumber,
          state: state.toUpperCase(),
          limit: 100,
        },
        revalidate: 21600, // 6 hours cache
      }
    );
    
    if (!response.members || response.members.length === 0) {
      return [];
    }
    
    // Map all members (now async)
    const mappedMembers = await Promise.all(
      response.members.map((member) => mapCongressMemberToMember(member))
    );
    
    return mappedMembers;
  } catch (error) {
    console.error(`Failed to fetch members for state ${state}:`, error);
    return [];
  }
}

/**
 * Development helper: Find members missing FEC candidate IDs
 * 
 * This function identifies members that don't have an FEC candidate ID mapping.
 * Useful for development to identify which members need FEC ID mappings added.
 * 
 * @param members - Array of Member objects to check
 * @returns Array of Member objects that are missing FEC candidate IDs
 * 
 * @example
 * ```ts
 * const members = await fetchMembers(118);
 * const missingFecIds = findMembersMissingFecCandidateId(members);
 * // Returns members that need FEC ID mappings
 * ```
 */
export function findMembersMissingFecCandidateId(members: Member[]): Member[] {
  return members.filter((member) => {
    // Check if member has FEC candidate ID from mapping table
    const hasFecId = FEC_CANDIDATE_BY_BIOGUIDE[member.bioguideId] !== undefined;
    return !hasFecId;
  });
}

