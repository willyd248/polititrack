/**
 * Senate.gov roll call vote utilities
 * 
 * Server-only utilities for fetching and parsing Senate roll call votes from Senate.gov XML.
 * Do not import this in client components.
 * 
 * Senate.gov provides roll call votes in XML format:
 * - Vote list: https://www.senate.gov/legislative/LIS/roll_call_votes/vote{year}/vote_list_{year}_{session}.xml
 * - Individual vote: https://www.senate.gov/legislative/LIS/roll_call_votes/vote{year}/vote_{year}_{session}_{rollNumber}.xml
 */

import { Vote, Source } from "../data/types";
import { inferTopicFromText } from "./topicTagger";
import { recordSourceStatus } from "./dataHealth";

interface SenateVoteList {
  votes?: {
    vote?: Array<{
      vote_number?: string;
      vote_date?: string;
      issue?: string;
      question?: string;
      vote_tally?: {
        yeas?: string;
        nays?: string;
      };
    }>;
  };
}

interface SenateVoteDetail {
  vote?: {
    vote_number?: string;
    vote_date?: string;
    issue?: string;
    question?: string;
    vote_tally?: {
      yeas?: string;
      nays?: string;
    };
    members?: {
      member?: Array<{
        lis_member_id?: string;
        vote_cast?: string; // "Yea", "Nay", "Present", "Not Voting"
        last_name?: string;
        first_name?: string;
      }>;
    };
  };
}

/**
 * Normalize Senate vote position to our Vote type position
 */
function normalizeSenatePosition(position: string): "Yes" | "No" | "Abstain" {
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
 * Create sources for a Senate vote
 */
function createSenateVoteSources(
  rollNumber: string,
  date: string,
  congress: number,
  session: number
): Source[] {
  const year = date.substring(0, 4);
  const month = date.substring(5, 7);
  const day = date.substring(8, 10);
  
  const xmlUrl = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}/vote_${congress}_${session}_${rollNumber}.xml`;
  const htmlUrl = `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${congress}_${session}.htm`;
  
  return [
    {
      title: `Senate Roll Call Vote ${rollNumber} (XML)`,
      publisher: "U.S. Senate",
      date: date,
      url: xmlUrl,
      excerpt: `Official Senate roll call vote XML record for vote ${rollNumber} on ${date}.`,
    },
    {
      title: `Senate Roll Call Votes - ${congress}th Congress, Session ${session}`,
      publisher: "U.S. Senate",
      date: date,
      url: htmlUrl,
      excerpt: `Senate roll call vote list for the ${congress}th Congress, Session ${session}.`,
    },
  ];
}

/**
 * Parse XML text to object (simple parser for Senate.gov XML structure)
 */
function parseSenateXml(xmlText: string): any {
  // Simple XML parsing - extract key fields from Senate.gov XML structure
  // This is a simplified parser that works with Senate.gov's XML format
  
  const result: any = {};
  
  // Extract vote_number (handle both <vote_number> and <voteNumber>)
  const voteNumberMatch = xmlText.match(/<vote[_nN]umber>([^<]+)<\/vote[_nN]umber>/i);
  if (voteNumberMatch) {
    result.vote_number = voteNumberMatch[1].trim();
  }
  
  // Extract vote_date (handle both <vote_date> and <voteDate>)
  const voteDateMatch = xmlText.match(/<vote[_dD]ate>([^<]+)<\/vote[_dD]ate>/i);
  if (voteDateMatch) {
    result.vote_date = voteDateMatch[1].trim();
  }
  
  // Extract question
  const questionMatch = xmlText.match(/<question>([^<]+)<\/question>/i);
  if (questionMatch) {
    result.question = questionMatch[1].trim();
  }
  
  // Extract issue
  const issueMatch = xmlText.match(/<issue>([^<]+)<\/issue>/i);
  if (issueMatch) {
    result.issue = issueMatch[1].trim();
  }
  
  // Extract members (handle both <member> and <members><member>)
  const members: Array<{ lis_member_id?: string; vote_cast?: string }> = [];
  const memberMatches = xmlText.matchAll(/<member>([\s\S]*?)<\/member>/gi);
  for (const match of memberMatches) {
    const memberXml = match[1];
    // Try both lis_member_id and lisMemberId formats
    const lisIdMatch = memberXml.match(/<lis[_mM]ember[_iI]d>([^<]+)<\/lis[_mM]ember[_iI]d>/i);
    const voteCastMatch = memberXml.match(/<vote[_cC]ast>([^<]+)<\/vote[_cC]ast>/i);
    
    if (lisIdMatch || voteCastMatch) {
      members.push({
        lis_member_id: lisIdMatch ? lisIdMatch[1].trim() : undefined,
        vote_cast: voteCastMatch ? voteCastMatch[1].trim() : undefined,
      });
    }
  }
  
  if (members.length > 0) {
    result.members = { member: members };
  }
  
  return { vote: result };
}

/**
 * Fetch Senate roll call vote list for a congress/session
 */
async function fetchSenateVoteList(
  congress: number,
  session: number = 1
): Promise<string[]> {
  try {
    const year = new Date().getFullYear();
    const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}/vote_list_${congress}_${session}.xml`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
      headers: {
        Accept: "application/xml, text/xml",
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const xmlText = await response.text();
    const parsed = parseSenateXml(xmlText);
    
    // Extract vote numbers from the list
    const voteNumbers: string[] = [];
    if (parsed.vote?.votes?.vote) {
      const votes = Array.isArray(parsed.vote.votes.vote)
        ? parsed.vote.votes.vote
        : [parsed.vote.votes.vote];
      
      for (const vote of votes) {
        if (vote.vote_number) {
          voteNumbers.push(vote.vote_number);
        }
      }
    }
    
    // Also try to extract from raw XML if structure is different
    if (voteNumbers.length === 0) {
      const voteNumberMatches = xmlText.matchAll(/<vote[_nN]umber>([^<]+)<\/vote[_nN]umber>/gi);
      for (const match of voteNumberMatches) {
        voteNumbers.push(match[1].trim());
      }
    }
    
    // Sort by vote number (descending) and return most recent
    return voteNumbers
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n))
      .sort((a, b) => b - a)
      .map((n) => String(n));
  } catch (error) {
    console.warn(`Failed to fetch Senate vote list for ${congress}/${session}:`, error);
    return [];
  }
}

/**
 * Fetch a single Senate roll call vote detail
 */
async function fetchSenateVoteDetail(
  rollNumber: string,
  congress: number,
  session: number
): Promise<SenateVoteDetail | null> {
  try {
    const url = `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${congress}/vote_${congress}_${session}_${rollNumber}.xml`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
      headers: {
        Accept: "application/xml, text/xml",
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const xmlText = await response.text();
    return parseSenateXml(xmlText) as SenateVoteDetail;
  } catch (error) {
    console.warn(`Failed to fetch Senate vote ${rollNumber}:`, error);
    return null;
  }
}

/**
 * Fetch roll-call votes for a Senate member
 * 
 * @param lisId - Senator's LIS ID (e.g., "S148")
 * @param congress - Congress number (default: 118)
 * @param session - Session number (default: 1)
 * @param limit - Maximum number of votes to return (default: 10)
 * @returns Array of normalized Vote objects
 */
export async function fetchSenateMemberVotes(
  lisId: string,
  congress: number = 118,
  session: number = 1,
  limit: number = 10
): Promise<Vote[]> {
  try {
    // Get list of recent votes
    const voteNumbers = await fetchSenateVoteList(congress, session);
    
    if (voteNumbers.length === 0) {
      recordSourceStatus("congress", false, "Senate vote list not available");
      return [];
    }
    
    // Fetch details for the most recent votes (up to limit)
    const votes: Vote[] = [];
    const votesToCheck = voteNumbers.slice(0, Math.min(limit * 2, 30)); // Check more to find member's votes
    
    for (const rollNumber of votesToCheck) {
      if (votes.length >= limit) {
        break;
      }
      
      const voteDetail = await fetchSenateVoteDetail(rollNumber, congress, session);
      
      if (!voteDetail?.vote) {
        continue;
      }
      
      // Find this senator's position
      const members = voteDetail.vote.members?.member;
      if (!members) {
        continue;
      }
      
      // Handle both array and single member cases
      let memberVote: { lis_member_id?: string; vote_cast?: string } | null = null;
      
      if (Array.isArray(members)) {
        const found = members.find((m: any) => m.lis_member_id === lisId);
        if (found) {
          memberVote = found;
        }
      } else {
        const singleMember = members as any;
        if (singleMember.lis_member_id === lisId) {
          memberVote = singleMember;
        }
      }
      
      if (!memberVote || !memberVote.vote_cast) {
        continue;
      }
      
      // Build vote object
      const voteDate = voteDetail.vote.vote_date || "";
      const question = voteDetail.vote.question || voteDetail.vote.issue || "Roll Call Vote";
      const description = question;
      const topic = inferTopicFromText(description) || "Other";
      
      votes.push({
        id: `vote-${congress}-${session}-${rollNumber}`,
        topic,
        date: voteDate,
        description,
        position: normalizeSenatePosition(memberVote.vote_cast),
        sources: createSenateVoteSources(rollNumber, voteDate, congress, session),
      });
    }
    
    if (votes.length > 0) {
      recordSourceStatus("congress", true);
    } else {
      recordSourceStatus("congress", false, "No votes found for senator");
    }
    
    return votes;
  } catch (error) {
    // Never throw - return empty array on failure
    console.warn(`Failed to fetch Senate votes for LIS ID ${lisId}:`, error);
    recordSourceStatus("congress", false, error instanceof Error ? error.message : String(error));
    return [];
  }
}

