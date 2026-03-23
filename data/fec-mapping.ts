/**
 * FEC Candidate ID mapping by Bioguide ID
 * 
 * This table maps Bioguide IDs to their corresponding FEC candidate IDs
 * for campaign finance data lookups.
 * 
 * FEC candidate IDs are used to query the OpenFEC API for campaign finance data.
 * 
 * To find FEC candidate IDs:
 * 1. Visit https://www.fec.gov/data/candidates/
 * 2. Search by candidate name or office
 * 3. The candidate ID format: H/S/P followed by 7 digits (e.g., "H1234567", "S1234567")
 */

export const FEC_CANDIDATE_BY_BIOGUIDE: Record<string, string> = {
  // Example mappings (add more as needed):
  // "S000148": "S1234567", // Bernard Sanders (VT Senator)
  // "P000197": "H8CA05035", // Nancy Pelosi (CA-11) - Example format
  
  // Add more mappings here as you identify them
  // To find FEC IDs, use the dev helper on politician pages or visit:
  // https://www.fec.gov/data/candidates/
};

/**
 * FEC Candidate ID format validation pattern
 * Format: H (House), S (Senate), or P (Presidential) followed by 7 digits
 */
const FEC_CANDIDATE_ID_PATTERN = /^[HSP]\d{7}$/;

/**
 * Validate FEC candidate ID format
 * 
 * @param fecId - FEC candidate ID to validate
 * @returns true if format is valid, false otherwise
 */
function isValidFecCandidateIdFormat(fecId: string): boolean {
  return FEC_CANDIDATE_ID_PATTERN.test(fecId);
}

/**
 * Validate all FEC candidate IDs in the mapping table
 * 
 * In development mode, logs warnings for invalid IDs.
 * No validation in production.
 */
function validateFecMappings(): void {
  if (process.env.NODE_ENV !== "development") {
    return; // Skip validation in production
  }
  
  for (const [bioguideId, fecId] of Object.entries(FEC_CANDIDATE_BY_BIOGUIDE)) {
    if (!isValidFecCandidateIdFormat(fecId)) {
      console.warn(
        `[FEC Mapping Validation] Invalid FEC candidate ID format for bioguideId "${bioguideId}": "${fecId}". ` +
        `Expected format: H/S/P followed by 7 digits (e.g., "H1234567", "S1234567").`
      );
    }
  }
}

/**
 * Get FEC candidate ID for a given bioguideId
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns FEC candidate ID if found and valid, null otherwise
 */
export function getFecCandidateIdForBioguide(bioguideId: string): string | null {
  const fecId = FEC_CANDIDATE_BY_BIOGUIDE[bioguideId];
  
  if (!fecId) {
    return null;
  }
  
  // Validate format in development only
  if (process.env.NODE_ENV === "development" && !isValidFecCandidateIdFormat(fecId)) {
    console.warn(
      `[FEC Mapping Validation] Invalid FEC candidate ID format for bioguideId "${bioguideId}": "${fecId}". ` +
      `Expected format: H/S/P followed by 7 digits (e.g., "H1234567", "S1234567").`
    );
  }
  
  return fecId;
}

// Validate mappings on module load (development only)
validateFecMappings();

