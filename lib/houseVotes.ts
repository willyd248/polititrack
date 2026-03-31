/**
 * House roll-call vote utilities using clerk.house.gov XML
 *
 * Server-only utilities for fetching and parsing House roll call votes.
 * Do not import this in client components.
 *
 * Strategy:
 * 1. Fetch the vote list from the Congress.gov API v3
 *    (GET /v3/vote/{congress}/{chamber}/{sessionNumber}) to get roll numbers.
 * 2. For each roll number, fetch the individual XML from clerk.house.gov to
 *    get the specific member's position — the XML is the authoritative source.
 * 3. Gracefully return [] if either source is unavailable.
 *
 * clerk.house.gov XML URL pattern:
 *   https://clerk.house.gov/evs/{year}/roll{NNN}.xml   (NNN zero-padded to 3 digits)
 *
 * clerk.house.gov XML structure (relevant fields):
 *   <rollcall-vote>
 *     <vote-metadata>
 *       <rollcall-num>42</rollcall-num>
 *       <vote-question>On Passage</vote-question>
 *       <vote-desc>Some bill description</vote-desc>
 *       <action-date month="01" day="15" year="2025">January 15, 2025</action-date>
 *     </vote-metadata>
 *     <vote-data>
 *       <recorded-vote>
 *         <legislator name-id="A000370" party="D" state="NC" ...>Adams, Alma</legislator>
 *         <vote>Yea</vote>   <!-- or Nay, Present, Not Voting -->
 *       </recorded-vote>
 *       ...
 *     </vote-data>
 *   </rollcall-vote>
 *
 * The `name-id` attribute on <legislator> matches the member's bioguide ID.
 */

import { Vote, Source } from "../data/types";
import { inferTopicFromText } from "./topicTagger";
import { recordSourceStatus } from "./dataHealth";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ParsedClerkVote {
  rollNumber: string;
  date: string; // ISO YYYY-MM-DD
  question: string;
  description: string;
  memberPosition: "Yes" | "No" | "Abstain" | null; // null = member not in this vote
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute the calendar year for a given Congress session.
 * The nth Congress starts in year (2*(n-1)+1789).
 * Session 1 → startYear, Session 2 → startYear+1.
 */
function sessionYear(congress: number, session: number): number {
  return 2 * (congress - 1) + 1789 + (session - 1);
}

/**
 * Return sessions (most recent first) that are valid for the given congress
 * up to and including the current calendar year.
 */
function activeSessions(
  congress: number
): Array<{ session: number; year: number }> {
  const congressStartYear = 2 * (congress - 1) + 1789;
  const currentYear = new Date().getFullYear();
  const result: Array<{ session: number; year: number }> = [];

  for (let s = 2; s >= 1; s--) {
    const y = sessionYear(congress, s);
    if (y <= currentYear && y >= congressStartYear) {
      result.push({ session: s, year: y });
    }
  }
  return result;
}

/**
 * Normalize a raw clerk.house.gov vote string to our canonical position.
 */
function normalizeHousePosition(raw: string): "Yes" | "No" | "Abstain" {
  const upper = raw.trim().toUpperCase();
  if (upper === "YEA" || upper === "YES" || upper === "Y") return "Yes";
  if (upper === "NAY" || upper === "NO" || upper === "N") return "No";
  return "Abstain"; // Present, Not Voting, etc.
}

/**
 * Parse an <action-date> element into ISO YYYY-MM-DD.
 * Tries attribute form first (month="01" day="03" year="2025"),
 * then falls back to parsing the text content ("January 3, 2025").
 */
function parseActionDate(xml: string): string {
  // Try attributes: month="01" day="03" year="2025"
  const attrMatch = xml.match(
    /month="(\d{1,2})"\s+day="(\d{1,2})"\s+year="(\d{4})"/i
  );
  if (attrMatch) {
    const [, m, d, y] = attrMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try text content: "January 3, 2025"
  const textMatch = xml.match(/<action-date[^>]*>([^<]+)<\/action-date>/i);
  if (textMatch) {
    const d = new Date(textMatch[1].trim());
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }

  return "";
}

/**
 * Build source citations for a House vote.
 */
function createHouseVoteSources(
  rollNumber: string,
  year: number,
  date: string
): Source[] {
  const paddedRoll = rollNumber.padStart(3, "0");
  return [
    {
      title: `House Roll Call Vote ${rollNumber}`,
      publisher: "U.S. House of Representatives – Office of the Clerk",
      date,
      url: `https://clerk.house.gov/evs/${year}/roll${paddedRoll}.xml`,
      excerpt: `Official House roll call vote XML record from the Office of the Clerk.`,
    },
    {
      title: `House Roll Call Votes – ${year}`,
      publisher: "U.S. House of Representatives – Office of the Clerk",
      date,
      url: `https://clerk.house.gov/evs/${year}/index.asp`,
      excerpt: `Index of all House roll call votes for ${year}.`,
    },
  ];
}

// ─── Data fetching ───────────────────────────────────────────────────────────

/**
 * Fetch the vote list for a given year from clerk.house.gov index page.
 * Returns roll numbers in descending order (most recent first).
 * Returns [] if the index page is unavailable.
 */
async function fetchVoteListFromClerk(
  year: number,
  limit: number
): Promise<Array<{ rollNumber: string; date: string }>> {
  try {
    const url = `https://clerk.house.gov/evs/${year}/index.asp`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "text/html, */*" },
    });

    if (!response.ok) return [];

    const html = await response.text();

    // Extract roll numbers from links like: rollnumber=108
    const matches = [...html.matchAll(/rollnumber=(\d+)/g)];
    const rollNumbers = [...new Set(matches.map((m) => m[1]))]
      .map(Number)
      .sort((a, b) => b - a) // descending
      .slice(0, limit)
      .map((n) => ({ rollNumber: String(n), date: "" }));

    return rollNumbers;
  } catch {
    return [];
  }
}

/**
 * Fetch a single House roll-call vote XML from clerk.house.gov and extract
 * the target member's position plus vote metadata.
 *
 * @param rollNumber  Roll call number (e.g., "42")
 * @param year        Calendar year the vote occurred in
 * @param bioguideId  Member bioguide ID to search for (e.g., "P000197")
 */
async function fetchClerkVoteXml(
  rollNumber: string,
  year: number,
  bioguideId: string
): Promise<ParsedClerkVote | null> {
  try {
    const paddedRoll = rollNumber.padStart(3, "0");
    const url = `https://clerk.house.gov/evs/${year}/roll${paddedRoll}.xml`;

    const response = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/xml, text/xml, */*" },
    });

    if (!response.ok) return null;

    const xml = await response.text();
    if (!xml || xml.trim().length === 0) return null;

    // Parse date
    const date = parseActionDate(xml);

    // Parse vote description — prefer <vote-desc>, fall back to <vote-question>
    const descMatch =
      xml.match(/<vote-desc>([^<]+)<\/vote-desc>/i) ??
      xml.match(/<vote-question>([^<]+)<\/vote-question>/i);
    const description = descMatch ? descMatch[1].trim() : "Roll Call Vote";

    const questionMatch = xml.match(/<vote-question>([^<]+)<\/vote-question>/i);
    const question = questionMatch ? questionMatch[1].trim() : description;

    // Find member's position.
    // Each <recorded-vote> contains a <legislator name-id="BIOGUIDE"> and <vote>.
    // We regex-scan for the block containing our bioguideId.
    const memberBlockRegex = new RegExp(
      `<recorded-vote>[\\s\\S]*?name-id="${bioguideId}"[\\s\\S]*?<\\/recorded-vote>`,
      "i"
    );
    const memberBlock = xml.match(memberBlockRegex);

    let memberPosition: "Yes" | "No" | "Abstain" | null = null;
    if (memberBlock) {
      const voteMatch = memberBlock[0].match(/<vote>([^<]+)<\/vote>/i);
      if (voteMatch) {
        memberPosition = normalizeHousePosition(voteMatch[1]);
      }
    }

    return { rollNumber, date, question, description, memberPosition };
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch roll-call votes for a House member.
 *
 * @param bioguideId  Member's bioguide ID (e.g., "P000197")
 * @param congress    Congress number (default: 119)
 * @param limit       Maximum number of votes to return (default: 10)
 */
export async function fetchHouseMemberVotes(
  bioguideId: string,
  congress: number = 119,
  limit: number = 10
): Promise<Vote[]> {
  try {
    const sessions = activeSessions(congress);
    if (sessions.length === 0) return [];

    // Collect candidate roll numbers from all active sessions (most recent first)
    // Use clerk.house.gov index pages since Congress.gov API v3 lacks this endpoint
    const candidates: Array<{ rollNumber: string; year: number; date: string }> =
      [];

    for (const { year } of sessions) {
      if (candidates.length >= limit * 4) break; // enough to find `limit` member votes

      const list = await fetchVoteListFromClerk(year, limit * 4);

      for (const v of list) {
        candidates.push({ rollNumber: v.rollNumber, year, date: v.date });
      }
    }

    if (candidates.length === 0) {
      recordSourceStatus("congress", false, "House vote list unavailable");
      return [];
    }

    // For each candidate, fetch XML and find member's position
    const votes: Vote[] = [];

    for (const { rollNumber, year, date } of candidates) {
      if (votes.length >= limit) break;

      const parsed = await fetchClerkVoteXml(rollNumber, year, bioguideId);
      if (!parsed || parsed.memberPosition === null) continue;

      const description = parsed.description || parsed.question || "Roll Call Vote";
      const topic = inferTopicFromText(description) ?? "Other";

      votes.push({
        id: `vote-${congress}-house-${rollNumber}`,
        topic,
        date: parsed.date || date,
        description,
        position: parsed.memberPosition,
        sources: createHouseVoteSources(rollNumber, year, parsed.date || date),
      });
    }

    if (votes.length > 0) {
      recordSourceStatus("congress", true);
    } else {
      recordSourceStatus(
        "congress",
        false,
        "No House vote positions found for member"
      );
    }

    return votes;
  } catch (error) {
    console.warn(`Failed to fetch House votes for ${bioguideId}:`, error);
    recordSourceStatus(
      "congress",
      false,
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}
