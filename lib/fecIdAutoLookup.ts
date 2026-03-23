/**
 * Automatic FEC Candidate ID lookup using OpenFEC API
 * 
 * Server-only utility that automatically searches OpenFEC API
 * to find FEC candidate IDs for Congress members.
 * 
 * This is used as a fallback when manual mappings and dataset lookups fail.
 */

import { searchFecCandidates } from "./fecCandidates";
import { stateNameToCode } from "./stateConverter";

/**
 * Simple name matching - checks if two names are similar enough
 * Handles variations like "Nancy Pelosi" vs "Pelosi, Nancy"
 */
function namesMatch(name1: string, name2: string): boolean {
  const normalize = (name: string) => 
    name.toLowerCase()
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  
  const n1 = normalize(name1);
  const n2 = normalize(name2);
  
  // Exact match after normalization
  if (n1 === n2) return true;
  
  // Check if last names match and first names are similar
  const parts1 = n1.split(" ");
  const parts2 = n2.split(" ");
  
  if (parts1.length >= 2 && parts2.length >= 2) {
    const lastName1 = parts1[parts1.length - 1];
    const lastName2 = parts2[parts2.length - 1];
    
    if (lastName1 === lastName2) {
      // Last names match, check first name (first word)
      const firstName1 = parts1[0];
      const firstName2 = parts2[0];
      
      // First names match or one is a substring of the other
      if (firstName1 === firstName2 || 
          firstName1.startsWith(firstName2) || 
          firstName2.startsWith(firstName1)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Automatically lookup FEC candidate ID using OpenFEC API search
 * 
 * @param fullName - Member's full name (e.g., "Nancy Pelosi")
 * @param state - Two-letter state code (e.g., "CA")
 * @param chamber - "House" or "Senate"
 * @returns FEC candidate ID if found, null otherwise
 */
export async function autoLookupFecCandidateId(
  fullName: string,
  state: string,
  chamber: "House" | "Senate" | undefined
): Promise<string | null> {
  try {
    // Convert state name to code (e.g., "California" -> "CA")
    const stateCode = stateNameToCode(state);
    
    // Ensure chamber is valid
    if (!chamber || (chamber !== "House" && chamber !== "Senate")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Auto FEC Lookup] Invalid or missing chamber for ${fullName}: ${chamber}`);
      }
      return null;
    }
    
    const office = chamber === "House" ? "H" : "S";
    
    // Search OpenFEC API
    const results = await searchFecCandidates({
      name: fullName,
      state: stateCode,
      office: office,
    });
    
    if (results.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auto FEC Lookup] No results found for ${fullName} (${stateCode}, ${chamber})`);
      }
      return null;
    }
    
    // Find best match by name similarity and state/office
    for (const candidate of results) {
      // Check if name matches (handles variations)
      if (namesMatch(fullName, candidate.name)) {
        // Verify state and office match
        if (candidate.state?.toUpperCase() === stateCode.toUpperCase() &&
            candidate.office?.toUpperCase() === office.toUpperCase()) {
          
          if (process.env.NODE_ENV === "development") {
            console.log(`[Auto FEC Lookup] Found match: ${candidate.candidate_id} for ${fullName}`);
          }
          
          return candidate.candidate_id;
        }
      }
    }
    
    // If no exact match, try first result if state/office match
    const firstResult = results[0];
    if (firstResult.state?.toUpperCase() === stateCode.toUpperCase() &&
        firstResult.office?.toUpperCase() === office.toUpperCase()) {
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auto FEC Lookup] Using first result: ${firstResult.candidate_id} for ${fullName} (name similarity: ${namesMatch(fullName, firstResult.name)})`);
      }
      
      return firstResult.candidate_id;
    }
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[Auto FEC Lookup] No good match found for ${fullName} (${stateCode}, ${chamber})`);
    }
    
    return null;
  } catch (error) {
    // Never throw - return null on any error
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Auto FEC Lookup] Error searching for ${fullName}:`, error);
    }
    return null;
  }
}

