/**
 * Script to populate party-mapping.ts with House member bioguideIds
 * 
 * This script:
 * 1. Fetches all House members from Congress.gov API
 * 2. Matches them to the provided list by name+state+district
 * 3. Generates party mapping entries with actual bioguideIds
 * 
 * Run with: npx tsx scripts/populate-party-mapping.ts
 */

import { fetchMembers } from "../lib/congressMembers";
import { stateNameToCode } from "../lib/stateConverter";

// House member list from user (name, state, district, party)
interface HouseMemberInfo {
  name: string;
  state: string;
  district: string;
  party: "D" | "R" | "I";
}

// Parse district from format like "AL-01" or "AK-At Large"
function parseDistrict(districtStr: string): { state: string; district: string | null } {
  const match = districtStr.match(/^([A-Z]{2})-(\d+|At Large)$/);
  if (!match) return { state: "", district: null };
  
  const state = match[1];
  const district = match[2] === "At Large" ? null : match[2];
  return { state, district };
}

// Normalize name for matching (remove extra spaces, handle variations)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "")
    .trim();
}

// Check if two names match (handles variations)
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // Check if last names match and first names are similar
  const parts1 = n1.split(" ");
  const parts2 = n2.split(" ");
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    const lastName1 = parts1[parts1.length - 1];
    const lastName2 = parts2[parts2.length - 1];
    
    if (lastName1 === lastName2) {
      // Last names match, check first name
      const firstName1 = parts1[0];
      const firstName2 = parts2[0];
      
      // First names match or one is a substring
      if (firstName1 === firstName2 || 
          firstName1.startsWith(firstName2) || 
          firstName2.startsWith(firstName1)) {
        return true;
      }
    }
  }
  
  return false;
}

// House member data from user's list
const HOUSE_MEMBERS: HouseMemberInfo[] = [
  // This will be populated from the user's list
  // For now, we'll fetch from API and match
];

async function populatePartyMapping() {
  console.log("Fetching all House members from Congress.gov...");
  
  try {
    // Fetch all members (House and Senate)
    const allMembers = await fetchMembers(118);
    
    // Filter to House members only
    const houseMembers = allMembers.filter(m => m.chamber === "House");
    
    console.log(`Found ${houseMembers.length} House members from API`);
    
    // Group by state for easier matching
    const membersByState = new Map<string, typeof houseMembers>();
    for (const member of houseMembers) {
      const state = member.state;
      if (!membersByState.has(state)) {
        membersByState.set(state, []);
      }
      membersByState.get(state)!.push(member);
    }
    
    // Generate mapping entries
    const mappingEntries: string[] = [];
    mappingEntries.push("  // ============================================");
    mappingEntries.push("  // House of Representatives - 118th Congress");
    mappingEntries.push("  // ============================================");
    mappingEntries.push("");
    
    // Group by state
    const states = Array.from(membersByState.keys()).sort();
    
    for (const state of states) {
      const stateMembers = membersByState.get(state)!;
      const stateName = state; // Already a code
      
      mappingEntries.push(`  // ${stateName} (${stateMembers.length} districts)`);
      
      // Sort by district
      const sorted = [...stateMembers].sort((a, b) => {
        const distA = a.district ? parseInt(a.district) : 999;
        const distB = b.district ? parseInt(b.district) : 999;
        return distA - distB;
      });
      
      for (const member of sorted) {
        const district = member.district || "At Large";
        const party = member.party || "N/A";
        const name = member.fullName;
        
        mappingEntries.push(
          `  "${member.bioguideId}": "${party}", // ${name} - ${stateName}-${district}`
        );
      }
      
      mappingEntries.push("");
    }
    
    console.log(`\nGenerated ${houseMembers.length} House member mappings`);
    console.log("\n=== MAPPING ENTRIES ===");
    console.log(mappingEntries.join("\n"));
    
    return mappingEntries;
    
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

// Run if called directly
if (require.main === module) {
  populatePartyMapping()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { populatePartyMapping };

