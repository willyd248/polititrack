/**
 * Congress.gov API v3 member votes utilities
 * 
 * Server-only utilities for fetching roll-call vote data for members.
 * Do not import this in client components.
 * 
 * Note: Congress.gov API v3 may not have direct member vote positions endpoint.
 * This implementation provides a structure that can be extended with
 * official House Clerk / Senate sources as fallback.
 * 
 * Documentation: https://api.congress.gov/
 */

import { Vote, Source } from "../data/types";
import { congressFetch } from "./congress";
import { inferTopicFromText } from "./topicTagger";
import { recordSourceStatus } from "./dataHealth";
import { fetchSenateMemberVotes } from "./senateVotes";
import { fetchHouseMemberVotes } from "./houseVotes";
import { Member } from "../data/types-members";

/**
 * Normalize vote position to our Vote type position
 */
function normalizePosition(position: string): "Yes" | "No" | "Abstain" {
  const upper = position.toUpperCase();
  if (upper === "YEA" || upper === "YES" || upper === "Y") {
    return "Yes";
  }
  if (upper === "NAY" || upper === "NO" || upper === "N") {
    return "No";
  }
  // Present, Not Voting, etc. -> Abstain
  return "Abstain";
}

/**
 * Create sources for a vote
 */
function createVoteSources(
  rollNumber: string,
  date: string,
  chamber: "House" | "Senate",
  url?: string
): Source[] {
  const sources: Source[] = [];
  
  // Congress.gov vote URL if available
  if (url) {
    sources.push({
      title: `Roll Call ${rollNumber} on Congress.gov`,
      publisher: "Congress.gov",
      date: date,
      url: url,
      excerpt: `Official roll call vote record for ${chamber} vote ${rollNumber}.`,
    });
  }
  
  // Official roll call page based on chamber
  if (chamber === "House") {
    const dateStr = date.replace(/-/g, "");
    sources.push({
      title: `House Roll Call ${rollNumber}`,
      publisher: "U.S. House of Representatives",
      date: date,
      url: `https://clerk.house.gov/Votes/${dateStr}${rollNumber}`,
      excerpt: `Official House roll call vote record from the Office of the Clerk.`,
    });
  } else {
    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    sources.push({
      title: `Senate Roll Call Vote ${rollNumber}`,
      publisher: "U.S. Senate",
      date: date,
      url: `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${year}/vote_${year}_${month}_${rollNumber}.xml`,
      excerpt: `Official Senate roll call vote record.`,
    });
  }
  
  return sources;
}

/**
 * Fetch roll-call votes for a member
 * 
 * Strategy:
 * - For Senate members: Use Senate.gov XML sources (if lisId available)
 * - For House members: Return empty array (House implementation pending)
 * 
 * @param bioguideId - Member's bioguide ID
 * @param congress - Congress number (default: 118)
 * @param limit - Maximum number of votes to return (default: 20)
 * @param chamber - Member's chamber ("House" or "Senate")
 * @param member - Optional Member object (needed for lisId)
 * @returns Array of normalized Vote objects
 */
export async function fetchMemberVotes(
  bioguideId: string,
  congress: number = 119,
  limit: number = 20,
  chamber?: "House" | "Senate",
  member?: Member | null
): Promise<Vote[]> {
  try {
    // For Senate members, use Senate.gov XML sources
    if (chamber === "Senate" && member?.lisId) {
      return await fetchSenateMemberVotes(member.lisId, congress, 1, limit);
    }
    
    // For House members, try Congress.gov API (returns empty if not available)
    if (chamber === "House") {
      return await fetchHouseMemberVotes(bioguideId, congress, limit);
    }
    
    // If no chamber specified or no lisId for Senate, return empty
    recordSourceStatus("congress", true);
    return [];
    
  } catch (error) {
    // Never throw - return empty array on failure
    console.warn(`Failed to fetch votes for ${bioguideId}:`, error);
    recordSourceStatus("congress", false, error instanceof Error ? error.message : String(error));
    return [];
  }
}
