/**
 * Member type definition for Polititrack
 * 
 * Represents a member of Congress (House or Senate)
 */

export interface Member {
  id: string; // Polititrack ID (e.g., "member-S000148")
  bioguideId: string; // Bioguide ID from Congress.gov (e.g., "S000148")
  firstName: string;
  lastName: string;
  fullName: string;
  chamber: "House" | "Senate";
  state: string; // Two-letter state code (e.g., "CA")
  district: string | null; // House district (e.g., "05") or null for Senators
  party: string; // Party affiliation (e.g., "D", "R", "I")
  imageUrl: string | null; // URL to official photo
  fecCandidateId: string | null; // FEC candidate ID for campaign finance lookups
  lisId: string | null; // LIS ID for Senate roll call vote lookups (e.g., "S148")
  officialWebsite?: string | null; // Official website URL from Congress.gov
  yearsInOffice?: number | null; // Computed server-side from term start dates
}

