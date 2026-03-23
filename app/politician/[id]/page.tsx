/**
 * Server component that fetches member data and passes it to client component
 */

import { fetchMemberByBioguideId } from "../../../lib/congressMembers";
import { politicians as mockPoliticians } from "../../../data/politicians";
import { memberToPolitician } from "../../../lib/mappers/memberToPolitician";
import { fetchMoneyForCandidate } from "../../../lib/mappers/fecToMoney";
import { fetchSponsoredBills, fetchCosponsoredBills } from "../../../lib/congressSponsorship";
import { fetchMemberVotes } from "../../../lib/congressVotes";
import { Vote } from "../../../data/types";
import { notFound } from "next/navigation";
import PoliticianPageClient from "./page-client";

/**
 * Check if an ID looks like a valid bioguideId format
 * BioguideIds typically: Letter + 6 digits (e.g., "S000148", "A000360")
 */
function isValidBioguideIdFormat(id: string): boolean {
  // BioguideId pattern: starts with a letter, followed by 6 digits
  return /^[A-Z]\d{6}$/i.test(id);
}

/**
 * Server component that fetches member data by bioguideId
 */
export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Try to fetch real member by bioguideId
  let member = null;
  let useMockData = false;
  let politicianForCompare = null;
  let moneyData = null;
  let sponsoredBills = null;
  let cosponsoredBills = null;
  let memberVotes: Vote[] = [];

  // Only try API if ID looks like a bioguideId (e.g., "S000148")
  // Otherwise, go straight to mock data lookup
  if (isValidBioguideIdFormat(id)) {
    try {
      member = await fetchMemberByBioguideId(id);
      if (member) {
        // Convert to politician for compare store compatibility
        politicianForCompare = memberToPolitician(member);
        
        // Fetch money data if member has FEC candidate ID
        if (member.fecCandidateId) {
          if (process.env.NODE_ENV === "development") {
            console.log(`[PoliticianPage] Fetching money data for ${member.bioguideId} with FEC ID: ${member.fecCandidateId}`);
          }
          try {
            moneyData = await fetchMoneyForCandidate(member.fecCandidateId);
            if (process.env.NODE_ENV === "development") {
              console.log(`[PoliticianPage] Money data result for ${member.fecCandidateId}:`, {
                found: !!moneyData,
                raised: moneyData?.totals?.raised || 0,
                spent: moneyData?.totals?.spent || 0,
                cashOnHand: moneyData?.totals?.cashOnHand || 0,
                topContributorsCount: moneyData?.topContributors?.length || 0,
                industryBreakdownCount: moneyData?.industryBreakdown?.length || 0,
              });
            }
          } catch (error) {
            // Silently fail - money data is optional
            console.warn(`[PoliticianPage] Failed to fetch money data for ${member.fecCandidateId}:`, error);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log(`[PoliticianPage] Member ${member.bioguideId} has no FEC candidate ID. Full member object:`, {
              bioguideId: member.bioguideId,
              fullName: member.fullName,
              state: member.state,
              chamber: member.chamber,
              fecCandidateId: member.fecCandidateId,
            });
          }
        }
        
        // Fetch legislative activity (sponsored and cosponsored bills)
        try {
          const [sponsored, cosponsored] = await Promise.all([
            fetchSponsoredBills(member.bioguideId, 118, 5),
            fetchCosponsoredBills(member.bioguideId, 118, 5),
          ]);
          sponsoredBills = sponsored;
          cosponsoredBills = cosponsored;
          if (process.env.NODE_ENV === "development") {
            console.log(`[PoliticianPage] Legislative activity for ${member.bioguideId}:`, {
              sponsored: sponsored?.length || 0,
              cosponsored: cosponsored?.length || 0,
            });
          }
        } catch (error) {
          // Silently fail - legislative activity is optional
          console.warn(`Failed to fetch legislative activity for ${member.bioguideId}:`, error);
        }
        
        // Fetch roll-call votes (pass member object for lisId)
        try {
          memberVotes = await fetchMemberVotes(member.bioguideId, 118, 10, member.chamber, member);
          if (process.env.NODE_ENV === "development") {
            console.log(`[PoliticianPage] Votes for ${member.bioguideId}:`, memberVotes?.length || 0);
          }
        } catch (error) {
          // Silently fail - votes are optional
          console.warn(`Failed to fetch votes for ${member.bioguideId}:`, error);
        }
      } else {
        // Member not found in API, try mock data as fallback
        const mockPolitician = mockPoliticians.find((p) => p.id === id);
        if (mockPolitician) {
          useMockData = true;
          politicianForCompare = mockPolitician;
        } else {
          notFound();
        }
      }
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn(`Failed to fetch member ${id}, trying mock data:`, error);
      const mockPolitician = mockPoliticians.find((p) => p.id === id);
      if (mockPolitician) {
        useMockData = true;
        politicianForCompare = mockPolitician;
      } else {
        notFound();
      }
    }
  } else {
    // ID doesn't look like a bioguideId, go straight to mock data
    const mockPolitician = mockPoliticians.find((p) => p.id === id);
    if (mockPolitician) {
      useMockData = true;
      politicianForCompare = mockPolitician;
    } else {
      notFound();
    }
  }

  if (!politicianForCompare) {
    notFound();
  }

  return (
    <PoliticianPageClient
      member={member}
      useMockData={useMockData}
      politicianForCompare={politicianForCompare}
      moneyData={moneyData}
      sponsoredBills={sponsoredBills}
      cosponsoredBills={cosponsoredBills}
      memberVotes={memberVotes}
    />
  );
}

