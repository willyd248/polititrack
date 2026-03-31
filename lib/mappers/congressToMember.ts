/**
 * Mapper from Congress.gov API v3 member response to Polititrack Member type
 * 
 * Congress.gov API documentation: https://api.congress.gov/
 */

import { Member } from "../../data/types-members";
import { getFecCandidateIdForBioguide } from "../../data/fec-mapping";
import { getFecCandidateIdFromDataset } from "../fecIdLookup";
import { getLisIdFromDataset } from "../lisIdLookup";
import { autoLookupFecCandidateId } from "../fecIdAutoLookup";
import { getPartyForBioguide } from "../partyLookup";
import { getPartyForBioguideFromMapping } from "../../data/party-mapping";
import { getPartyForHouseMember as getHousePartyFromList } from "../../data/house-party-list";

// Congress.gov API response types (partial, based on actual API structure)
// Note: Congress.gov API may return names in various formats:
// - firstName/lastName (direct fields)
// - name (full name string)
// - directOrderName (e.g., "Bernard Sanders")
// - invertedOrderName (e.g., "Sanders, Bernard")
interface CongressMember {
  bioguideId: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Full name (may be in various formats)
  directOrderName?: string; // "FirstName LastName"
  invertedOrderName?: string; // "LastName, FirstName"
  chamber?: "House" | "Senate"; // May be undefined - we'll infer from district
  state: string;
  district?: string | number;
  party?: string; // May be undefined - check partyName or partyHistory instead
  partyName?: string; // Congress.gov API returns this in list endpoint (e.g., "Democratic", "Republican")
  partyHistory?: Array<{ partyName: string; startDate?: string; endDate?: string }>; // Party history from API
  terms?: { item: Array<{ chamber: string; startYear?: number; endYear?: number }> }; // Congress.gov list endpoint
  imageUrl?: string;
  depiction?: { imageUrl?: string; attribution?: string }; // Congress.gov list endpoint format
  officialWebsite?: string; // Official website URL if available
  // Note: fecCandidateId is NOT used from Congress.gov API response
  // It comes from our explicit mapping table instead
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
 * Generate Polititrack member ID from bioguideId
 * Format: member-{bioguideId} (e.g., "member-S000148")
 */
export function formatMemberId(bioguideId: string): string {
  return `member-${bioguideId}`;
}

/**
 * Parse Polititrack member ID to bioguideId
 * Format: member-{bioguideId} (e.g., "member-S000148" -> "S000148")
 */
export function parseMemberId(id: string): string | null {
  if (!id.startsWith("member-")) return null;
  return id.replace("member-", "");
}

/**
 * Parse a full name string into firstName and lastName
 * Handles formats like:
 * - "Bernard Sanders" (direct order)
 * - "Sanders, Bernard" (inverted order)
 * - "Sanders, Bernard J." (with middle initial)
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  
  // Check for inverted format: "LastName, FirstName"
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return {
        lastName: parts[0] || "Unknown",
        firstName: parts[1] || "Unknown",
      };
    }
  }
  
  // Direct format: "FirstName LastName" or "FirstName Middle LastName"
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    // Last word is last name, everything else is first name (may include middle)
    const lastName = words[words.length - 1] || "Unknown";
    const firstName = words.slice(0, -1).join(" ") || "Unknown";
    return { firstName, lastName };
  }
  
  // Single word - treat as last name
  if (words.length === 1) {
    return {
      firstName: "Unknown",
      lastName: words[0] || "Unknown",
    };
  }
  
  // Fallback
  return {
    firstName: "Unknown",
    lastName: "Unknown",
  };
}

/**
 * Extract and normalize name fields from Congress.gov member response
 * Handles all possible name field formats returned by the API
 */
function extractNameFields(congressMember: CongressMember): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  // Priority 1: Direct firstName/lastName fields
  if (congressMember.firstName && congressMember.lastName) {
    const firstName = congressMember.firstName.trim();
    const lastName = congressMember.lastName.trim();
    return {
      firstName: firstName || "Unknown",
      lastName: lastName || "Unknown",
      fullName: `${firstName} ${lastName}`.trim() || "Unknown",
    };
  }
  
  // Priority 2: directOrderName (e.g., "Bernard Sanders")
  if (congressMember.directOrderName) {
    const parsed = parseName(congressMember.directOrderName);
    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fullName: congressMember.directOrderName.trim(),
    };
  }
  
  // Priority 3: invertedOrderName (e.g., "Sanders, Bernard")
  if (congressMember.invertedOrderName) {
    const parsed = parseName(congressMember.invertedOrderName);
    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fullName: `${parsed.firstName} ${parsed.lastName}`.trim(),
    };
  }
  
  // Priority 4: name field (full name string)
  if (congressMember.name) {
    const parsed = parseName(congressMember.name);
    return {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      fullName: congressMember.name.trim(),
    };
  }
  
  // Priority 5: Try to use partial fields if available
  if (congressMember.firstName) {
    return {
      firstName: congressMember.firstName.trim() || "Unknown",
      lastName: congressMember.lastName?.trim() || "Unknown",
      fullName: congressMember.firstName.trim() || "Unknown",
    };
  }
  
  if (congressMember.lastName) {
    return {
      firstName: congressMember.firstName?.trim() || "Unknown",
      lastName: congressMember.lastName.trim() || "Unknown",
      fullName: congressMember.lastName.trim() || "Unknown",
    };
  }
  
  // Fallback: Use bioguideId as identifier
  return {
    firstName: "Unknown",
    lastName: "Unknown",
    fullName: `Member ${congressMember.bioguideId}`,
  };
}

/**
 * Map Congress.gov member to Polititrack Member type
 */
export async function mapCongressMemberToMember(
  congressMember: CongressMember,
  options?: { skipFecLookup?: boolean; skipLisLookup?: boolean }
): Promise<Member> {
  // Extract name fields with defensive parsing
  const { firstName, lastName, fullName } = extractNameFields(congressMember);
  
  // Ensure no undefined values (defensive check)
  const safeFirstName = firstName || "Unknown";
  const safeLastName = lastName || "Unknown";
  const safeFullName = fullName || `${safeFirstName} ${safeLastName}`.trim() || "Unknown";
  
  // Infer chamber if not provided by API
  // House members have districts, Senators typically don't
  // Territory delegates (AS, DC, GU, MP, PR, VI) are always House, never Senate
  const TERRITORY_CODES = ["AS", "DC", "GU", "MP", "PR", "VI"];
  const isTerritory = TERRITORY_CODES.includes(congressMember.state?.toUpperCase());

  // Extract chamber from terms array (list endpoint returns it here, not at top level)
  // Find the most recent term without an endYear (i.e., current term)
  const currentTerm = congressMember.terms?.item
    ?.slice()
    .reverse()
    .find((t) => !t.endYear);
  const termsChamber = currentTerm?.chamber;
  const apiChamber: "House" | "Senate" | undefined = termsChamber?.includes("House")
    ? "House"
    : termsChamber?.includes("Senate")
    ? "Senate"
    : undefined;

  let chamber: "House" | "Senate" = apiChamber || congressMember.chamber || "Senate";
  if (!apiChamber && !congressMember.chamber) {
    if (congressMember.district !== undefined && congressMember.district !== null) {
      chamber = "House";
    } else if (isTerritory) {
      chamber = "House"; // Territory delegates/resident commissioners are House members
    } else {
      chamber = "Senate"; // Default to Senate if no district and not a territory
    }
  }
  
  // Handle district - convert to string or null
  let district: string | null = null;
  if (congressMember.district !== undefined && congressMember.district !== null) {
    district = String(congressMember.district);
    // At-large districts (0, 00) → null (display as state-only)
    if (district === "0" || district === "00") {
      district = null;
    }
    // Format district with leading zero if needed (e.g., "5" -> "05")
    if (district && chamber === "House" && district.length === 1) {
      district = `0${district}`;
    }
  }
  
  // Resolve FEC candidate ID in priority order:
  // (a) Manual override via data/fec-mapping.ts
  // (b) Automatic lookup via unitedstates dataset
  // (c) Automatic lookup via OpenFEC API search
  // (d) Fallback null
  let fecCandidateId = getFecCandidateIdForBioguide(congressMember.bioguideId);
  
  if (!fecCandidateId && !options?.skipFecLookup) {
    // Try automatic lookup from dataset
    fecCandidateId = await getFecCandidateIdFromDataset(congressMember.bioguideId);
  }

  if (!fecCandidateId && !options?.skipFecLookup) {
    // Try automatic lookup via OpenFEC API search (expensive — skip in bulk)
    fecCandidateId = await autoLookupFecCandidateId(
      safeFullName,
      congressMember.state,
      chamber
    );
  }

  // Resolve LIS ID for Senate members (for roll call vote lookups)
  // Skip in bulk fetches to avoid 100+ dataset fetches
  const lisId = (chamber === "Senate" && !options?.skipLisLookup)
    ? await getLisIdFromDataset(congressMember.bioguideId)
    : null;
  
  // Extract party - try multiple sources in priority order
  // 1. Manual mapping (data/party-mapping.ts) - most reliable
  // 2. House party list (data/house-party-list.ts) - matches by name+state+district
  // 3. Congress.gov API party field (direct)
  // 4. Congress.gov API partyHistory (most recent)
  // 5. unitedstates dataset (fallback if available)
  let party = "";
  
  // Try manual mapping first
  party = getPartyForBioguideFromMapping(congressMember.bioguideId) || "";
  
  // Try House party list for House members (matches by name+state+district)
  if (!party && chamber === "House") {
    const houseParty = getHousePartyFromList(
      safeFullName,
      congressMember.state,
      district
    );
    if (houseParty) {
      party = houseParty;
    }
  }
  
  // Try Congress.gov API party fields (partyName from list, party from detail)
  if (!party && (congressMember.partyName || congressMember.party)) {
    party = congressMember.partyName || congressMember.party || "";
  }
  
  // Try partyHistory if party field is empty
  if (!party && congressMember.partyHistory && congressMember.partyHistory.length > 0) {
    // Get the most recent party (first entry in partyHistory is usually current)
    const currentParty = congressMember.partyHistory[0];
    party = currentParty.partyName || "";
  }
  
  // Try dataset as last resort (but it's currently unavailable)
  if (!party) {
    party = await getPartyForBioguide(congressMember.bioguideId) || "";
  }
  
  // Normalize party to single letter if it's a full name
  if (party) {
    const partyLower = party.toLowerCase().trim();
    if (partyLower.includes("democrat") || partyLower === "d" || partyLower === "dem") {
      party = "D";
    } else if (partyLower.includes("republican") || partyLower === "r" || partyLower === "rep") {
      party = "R";
    } else if (partyLower.includes("independent") || partyLower === "i" || partyLower === "ind") {
      party = "I";
    } else if (party.length === 1) {
      // If it's already a single letter, uppercase it
      party = party.toUpperCase();
    }
  }
  
  return {
    id: formatMemberId(congressMember.bioguideId),
    bioguideId: congressMember.bioguideId,
    firstName: safeFirstName,
    lastName: safeLastName,
    fullName: safeFullName,
    chamber: chamber,
    state: congressMember.state,
    district,
    party: party || "N/A",
    imageUrl: congressMember.imageUrl || congressMember.depiction?.imageUrl || null,
    fecCandidateId: fecCandidateId || null,
    lisId: lisId || null,
    officialWebsite: congressMember.officialWebsite || null,
  };
}

/**
 * Example mapped Member objects:
 * 
 * With FEC candidate ID (if mapped):
 * {
 *   id: "member-S000148",
 *   bioguideId: "S000148",
 *   firstName: "Bernard",
 *   lastName: "Sanders",
 *   fullName: "Bernard Sanders",
 *   chamber: "Senate",
 *   state: "VT",
 *   district: null,
 *   party: "I",
 *   imageUrl: "https://www.congress.gov/img/member/S000148.jpg",
 *   fecCandidateId: "S4VT00033" // From FEC_CANDIDATE_BY_BIOGUIDE mapping
 * }
 * 
 * Without FEC candidate ID (not in mapping table):
 * {
 *   id: "member-A000360",
 *   bioguideId: "A000360",
 *   firstName: "John",
 *   lastName: "Doe",
 *   fullName: "John Doe",
 *   chamber: "House",
 *   state: "CA",
 *   district: "05",
 *   party: "D",
 *   imageUrl: "https://www.congress.gov/img/member/A000360.jpg",
 *   fecCandidateId: null // Not in FEC_CANDIDATE_BY_BIOGUIDE mapping
 * }
 */

