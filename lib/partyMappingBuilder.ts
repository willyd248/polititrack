/**
 * Dynamic party mapping builder
 * 
 * This module builds party mappings from fetched Congress.gov members
 * and matches them to the provided House member list.
 * 
 * Since we can't reliably get party data from Congress.gov API,
 * we use the provided list as the source of truth for party affiliations.
 */

import { Member } from "../data/types-members";

// Normalize name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "")
    .trim();
}

// Check if names match (handles variations)
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return true;
  
  const parts1 = n1.split(" ");
  const parts2 = n2.split(" ");
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    const lastName1 = parts1[parts1.length - 1];
    const lastName2 = parts2[parts2.length - 1];
    
    if (lastName1 === lastName2) {
      const firstName1 = parts1[0];
      const firstName2 = parts2[0];
      
      if (firstName1 === firstName2 || 
          firstName1.startsWith(firstName2) || 
          firstName2.startsWith(firstName1)) {
        return true;
      }
    }
  }
  
  return false;
}

// House member party data from user's list
// Format: "State-District": { name: string, party: "D" | "R" | "I" }
const HOUSE_PARTY_DATA: Record<string, { name: string; party: "D" | "R" | "I" }> = {
  // This will be populated from the user's list
  // For now, we'll match dynamically
};

/**
 * Get party for a House member by matching name+state+district
 */
export function getPartyForHouseMember(
  member: Member,
  housePartyList?: Array<{ name: string; state: string; district: string; party: "D" | "R" | "I" }>
): "D" | "R" | "I" | null {
  if (member.chamber !== "House") return null;
  
  // If we have a house party list, match against it
  if (housePartyList) {
    const state = member.state;
    const district = member.district || "At Large";
    
    for (const entry of housePartyList) {
      if (entry.state === state && entry.district === district) {
        if (namesMatch(member.fullName, entry.name)) {
          return entry.party;
        }
      }
    }
  }
  
  return null;
}

/**
 * Build party mapping entries from fetched members
 */
export function buildPartyMappingEntries(
  members: Member[],
  housePartyList?: Array<{ name: string; state: string; district: string; party: "D" | "R" | "I" }>
): string[] {
  const entries: string[] = [];
  
  // Group by state
  const byState = new Map<string, Member[]>();
  for (const member of members) {
    if (!byState.has(member.state)) {
      byState.set(member.state, []);
    }
    byState.get(member.state)!.push(member);
  }
  
  const states = Array.from(byState.keys()).sort();
  
  for (const state of states) {
    const stateMembers = byState.get(state)!;
    const houseMembers = stateMembers.filter(m => m.chamber === "House");
    
    if (houseMembers.length === 0) continue;
    
    entries.push(`  // ${state} (${houseMembers.length} districts)`);
    
    // Sort by district
    const sorted = [...houseMembers].sort((a, b) => {
      const distA = a.district ? parseInt(a.district) : 999;
      const distB = b.district ? parseInt(b.district) : 999;
      return distA - distB;
    });
    
    for (const member of sorted) {
      const district = member.district || "At Large";
      
      // Try to get party from house party list
      let party = member.party || "N/A";
      if (housePartyList) {
        const matchedParty = getPartyForHouseMember(member, housePartyList);
        if (matchedParty) {
          party = matchedParty;
        }
      }
      
      entries.push(
        `  "${member.bioguideId}": "${party}", // ${member.fullName} - ${state}-${district}`
      );
    }
    
    entries.push("");
  }
  
  return entries;
}

