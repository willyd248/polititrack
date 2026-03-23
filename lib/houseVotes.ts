/**
 * House roll-call vote utilities
 * 
 * Server-only utilities for fetching and parsing House roll call votes.
 * 
 * Note: This implementation attempts to use Congress.gov API v3 for House votes.
 * If a reliable list endpoint is not available, this will return empty array.
 */

import { Vote, Source } from "../data/types";
import { congressFetch } from "./congress";
import { inferTopicFromText } from "./topicTagger";
import { recordSourceStatus } from "./dataHealth";

interface CongressVote {
  rollNumber?: string;
  date?: string;
  question?: string;
  description?: string;
  result?: string;
  url?: string;
}

interface CongressVotesResponse {
  votes?: CongressVote[];
  pagination?: {
    count: number;
    next?: string;
  };
}

interface CongressVoteDetail {
  vote?: {
    rollNumber?: string;
    date?: string;
    question?: string;
    description?: string;
    result?: string;
    url?: string;
    positions?: Array<{
      bioguideId?: string;
      position?: string; // "Yea", "Nay", "Present", "Not Voting"
    }>;
  };
}

/**
 * Normalize House vote position to our Vote type position
 */
function normalizeHousePosition(position: string): "Yes" | "No" | "Abstain" {
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
 * Create sources for a House vote
 */
function createHouseVoteSources(
  rollNumber: string,
  date: string,
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
      excerpt: `Official roll call vote record for House vote ${rollNumber}.`,
    });
  }
  
  // Clerk.house.gov vote page
  const dateStr = date.replace(/-/g, "");
  sources.push({
    title: `House Roll Call ${rollNumber}`,
    publisher: "U.S. House of Representatives",
    date: date,
    url: `https://clerk.house.gov/Votes/${dateStr}${rollNumber}`,
    excerpt: `Official House roll call vote record from the Office of the Clerk.`,
  });
  
  return sources;
}

/**
 * Fetch recent House roll call vote list from Congress.gov API
 * 
 * @param congress - Congress number (default: 118)
 * @param limit - Maximum number of votes to fetch (default: 20)
 * @returns Array of vote numbers with dates, or empty array if unavailable
 */
async function fetchHouseVoteList(
  congress: number = 118,
  limit: number = 20
): Promise<Array<{ rollNumber: string; date: string }>> {
  try {
    // Try Congress.gov API v3 vote endpoint for House
    // Note: This endpoint may not exist - if it fails, we return empty array
    // and the UI will show a "coming soon" message
    const response = await congressFetch<CongressVotesResponse>(
      "/vote/house",
      {
        params: {
          congress: congress,
          limit: limit,
          sort: "updateDate+desc",
        },
        revalidate: 3600, // 1 hour cache
      }
    );
    
    if (!response.votes || response.votes.length === 0) {
      return [];
    }
    
    return response.votes
      .filter((v) => v.rollNumber && v.date)
      .map((v) => ({
        rollNumber: v.rollNumber!,
        date: v.date!,
      }));
  } catch (error) {
    // Endpoint may not exist - this is expected if Congress.gov doesn't provide
    // a reliable House vote list endpoint. Return empty array gracefully.
    console.warn(`House vote list endpoint not available:`, error);
    return [];
  }
}

/**
 * Fetch a single House roll call vote detail from Congress.gov API
 * 
 * @param rollNumber - Roll call vote number
 * @param congress - Congress number
 * @param date - Vote date
 * @returns Vote detail with member positions, or null if unavailable
 */
async function fetchHouseVoteDetail(
  rollNumber: string,
  congress: number,
  date: string
): Promise<CongressVoteDetail | null> {
  try {
    // Try Congress.gov API v3 vote detail endpoint
    // Format may vary - try common patterns
    // Note: These endpoints may not exist - if they fail, we return null
    const possiblePaths = [
      `/vote/house/${congress}/${rollNumber}`,
      `/vote/${congress}/house/${rollNumber}`,
    ];
    
    for (const path of possiblePaths) {
      try {
        const response = await congressFetch<CongressVoteDetail>(path, {
          revalidate: 3600,
        });
        
        if (response.vote) {
          return response;
        }
      } catch (err) {
        // Try next path - endpoint may not exist
        continue;
      }
    }
    
    return null;
  } catch (error) {
    // Endpoint may not exist - this is expected if Congress.gov doesn't provide
    // House vote detail endpoints. Return null gracefully.
    return null;
  }
}

/**
 * Fetch roll-call votes for a House member
 * 
 * @param bioguideId - Member's bioguide ID
 * @param congress - Congress number (default: 118)
 * @param limit - Maximum number of votes to return (default: 10)
 * @returns Array of normalized Vote objects, or empty array if reliable source unavailable
 */
export async function fetchHouseMemberVotes(
  bioguideId: string,
  congress: number = 118,
  limit: number = 10
): Promise<Vote[]> {
  try {
    // Step 1: Get reliable list of recent House votes
    const voteList = await fetchHouseVoteList(congress, limit * 2);
    
    if (voteList.length === 0) {
      // No reliable list source available - return empty array
      recordSourceStatus("congress", false, "House vote list endpoint not available");
      return [];
    }
    
    // Step 2: For each vote, fetch detail and find member's position
    const votes: Vote[] = [];
    
    for (const { rollNumber, date } of voteList) {
      if (votes.length >= limit) {
        break;
      }
      
      const voteDetail = await fetchHouseVoteDetail(rollNumber, congress, date);
      
      if (!voteDetail?.vote?.positions) {
        continue;
      }
      
      // Find this member's position
      const memberPosition = voteDetail.vote.positions.find(
        (p) => p.bioguideId === bioguideId
      );
      
      if (!memberPosition || !memberPosition.position) {
        continue;
      }
      
      // Build vote object
      const question = voteDetail.vote.question || voteDetail.vote.description || "Roll Call Vote";
      const description = question;
      const topic = inferTopicFromText(description) || "Other";
      
      votes.push({
        id: `vote-${congress}-house-${rollNumber}`,
        topic,
        date: date,
        description,
        position: normalizeHousePosition(memberPosition.position),
        sources: createHouseVoteSources(rollNumber, date, voteDetail.vote.url),
      });
    }
    
    if (votes.length > 0) {
      recordSourceStatus("congress", true);
    } else {
      recordSourceStatus("congress", false, "House vote positions not available via API");
    }
    
    return votes;
  } catch (error) {
    // Never throw - return empty array on failure
    console.warn(`Failed to fetch House votes for ${bioguideId}:`, error);
    recordSourceStatus("congress", false, error instanceof Error ? error.message : String(error));
    return [];
  }
}

