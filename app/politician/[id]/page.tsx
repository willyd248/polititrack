/**
 * Server component that fetches member data and passes it to client component.
 *
 * FEC financial data is NOT fetched here — it's loaded client-side via
 * /api/fec/money to avoid blocking the page on FEC rate limits (60/hr).
 */

import { fetchMemberByBioguideId } from "../../../lib/congressMembers";
import { politicians as mockPoliticians } from "../../../data/politicians";
import { memberToPolitician } from "../../../lib/mappers/memberToPolitician";
import { fetchSponsoredBills, fetchCosponsoredBills } from "../../../lib/congressSponsorship";
import { fetchMemberVotes } from "../../../lib/congressVotes";
import { getFecCandidateIdForBioguide } from "../../../data/fec-mapping";
import { Vote } from "../../../data/types";
import { LegislativeActivityItem } from "../../../lib/congressSponsorship";
import { notFound } from "next/navigation";
import PoliticianPageClient from "./page-client";

function isValidBioguideIdFormat(id: string): boolean {
  return /^[A-Z]\d{6}$/i.test(id);
}

/** Wrap a promise with a timeout — returns null on timeout instead of blocking */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([promise, timeout]);
}

export default async function PoliticianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Non-bioguide IDs go straight to mock data
  if (!isValidBioguideIdFormat(id)) {
    const mockPolitician = mockPoliticians.find((p) => p.id === id);
    if (!mockPolitician) notFound();
    return (
      <PoliticianPageClient
        member={null}
        useMockData={true}
        politicianForCompare={mockPolitician}
        moneyData={null}
        sponsoredBills={null}
        cosponsoredBills={null}
        memberVotes={[]}
      />
    );
  }

  // Fetch member from Congress.gov — FEC ID resolved via unitedstates dataset (cached 24hr)
  // and OpenFEC API search fallback. LIS lookup still skipped (not needed here).
  // FEC money data is loaded client-side via /api/fec/money
  let member;
  try {
    member = await withTimeout(
      fetchMemberByBioguideId(id, undefined, { skipFecLookup: false, skipLisLookup: false }),
      10000
    );
  } catch {
    member = null;
  }

  if (!member) {
    // Try mock data as fallback
    const mockPolitician = mockPoliticians.find((p) => p.id === id);
    if (!mockPolitician) notFound();
    return (
      <PoliticianPageClient
        member={null}
        useMockData={true}
        politicianForCompare={mockPolitician}
        moneyData={null}
        sponsoredBills={null}
        cosponsoredBills={null}
        memberVotes={[]}
      />
    );
  }

  const politicianForCompare = memberToPolitician(member);

  // Fetch supplemental data in parallel with 8s timeout each
  // These are all optional — page renders without them
  const [sponsoredResult, cosponsoredResult, votesResult] = await Promise.allSettled([
    withTimeout(fetchSponsoredBills(member.bioguideId, 119, 5), 8000),
    withTimeout(fetchCosponsoredBills(member.bioguideId, 119, 5), 8000),
    withTimeout(fetchMemberVotes(member.bioguideId, 119, 10, member.chamber, member), 8000),
  ]);

  const sponsoredBills: LegislativeActivityItem[] | null =
    sponsoredResult.status === "fulfilled" ? sponsoredResult.value : null;
  const cosponsoredBills: LegislativeActivityItem[] | null =
    cosponsoredResult.status === "fulfilled" ? cosponsoredResult.value : null;
  const memberVotes: Vote[] =
    votesResult.status === "fulfilled" && votesResult.value ? votesResult.value : [];

  // Get FEC ID: manual override takes precedence, then dataset/API auto-lookup (via member)
  const fecCandidateId = getFecCandidateIdForBioguide(id) || member.fecCandidateId || null;

  // moneyData is null here — loaded client-side via /api/fec/money
  return (
    <PoliticianPageClient
      member={member}
      useMockData={false}
      politicianForCompare={politicianForCompare}
      moneyData={null}
      sponsoredBills={sponsoredBills}
      cosponsoredBills={cosponsoredBills}
      memberVotes={memberVotes}
      fecCandidateId={fecCandidateId}
    />
  );
}
