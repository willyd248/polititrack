/**
 * Adapter to convert Member to Politician for compare store compatibility
 * 
 * This is a temporary adapter until the compare store and politician pages
 * are updated to work directly with Member types.
 */

import { Member } from "../../data/types-members";
import { Politician } from "../../data/politicians";

/**
 * Convert a Member to a minimal Politician object for compare functionality
 * 
 * Note: This creates placeholder data for fields not available in Member.
 * The compare feature will work but won't show detailed metrics until
 * the politician page is updated to use Member types.
 * 
 * This adapter ensures all identity fields are always populated with safe defaults
 * to prevent undefined values from appearing in the UI.
 */
export function memberToPolitician(member: Member): Politician {
  // Ensure all identity fields have safe fallbacks
  const fullName = member.fullName || `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown Member";
  const role = member.chamber === "House" ? "U.S. Representative" : member.chamber === "Senate" ? "U.S. Senator" : "Member of Congress";
  const state = member.state || "Unknown";
  const district = member.district || undefined; // Optional field, can be undefined
  const party = member.party || "Unknown";
  
  // Build chamber description for key takeaways
  const chamberDescription = member.chamber === "House" 
    ? "U.S. House of Representatives member"
    : member.chamber === "Senate"
    ? "U.S. Senator"
    : "Member of Congress";
  
  // Build district string for key takeaways
  const districtString = member.chamber === "House" && member.district
    ? `, District ${member.district}`
    : "";
  
  return {
    id: member.bioguideId, // Use bioguideId as the ID for routing
    name: fullName, // Always a string, never undefined
    role: role, // Always a string, never undefined
    district: district, // Optional, can be undefined (this is fine per Politician type)
    state: state, // Always a string, never undefined
    committees: [], // Committees not available from basic member data
    keyTakeaways: [
      `${fullName} represents ${state}${districtString}`,
      `Party: ${party}`,
      chamberDescription,
    ],
    whyThisMatters: "Member data from Congress.gov API",
    metrics: {
      topDonorCategory: "Data pending", // Will be populated when FEC integration is added
      votesThisYear: 0, // Will be populated when vote data is integrated
      billsSponsored: 0, // Will be populated when bill sponsorship data is integrated
    },
    money: {
      summary: "Campaign finance data will be available when FEC integration is complete.",
      moduleSummary: "Campaign finance data pending integration with FEC API.",
      topContributors: [],
      sources: [],
    },
    votes: {
      moduleSummary: "Vote data pending integration with Congress.gov API.",
      votes: [],
    },
    statements: {
      moduleSummary: "Statement data pending integration with Congress.gov API.",
      statements: [],
    },
  };
}

