/**
 * Server component that fetches member data and passes it to client component
 */

import { fetchMemberByBioguideId } from "../../../lib/congressMembers";
import { politicians as mockPoliticians } from "../../../data/politicians";
import { memberToPolitician } from "../../../lib/mappers/memberToPolitician";
import { notFound } from "next/navigation";
import PoliticianPageClient from "./page-client";

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

  try {
    member = await fetchMemberByBioguideId(id);
    if (member) {
      // Convert to politician for compare store compatibility
      politicianForCompare = memberToPolitician(member);
    } else {
      // Fallback to mock data if member not found
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

  if (!politicianForCompare) {
    notFound();
  }

  return (
    <PoliticianPageClient
      member={member}
      useMockData={useMockData}
      politicianForCompare={politicianForCompare}
    />
  );
}

