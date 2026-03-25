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
import { getFecCandidateIdFromDataset } from "../../../lib/fecIdLookup";
import { getFecCandidateIdByBioguideApi } from "../../../lib/fecBioguideApiLookup";
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

  // Fetch member from Congress.gov — skip FEC/LIS lookups so this stays fast (~1-2s)
  // FEC data is loaded client-side via /api/fec/money
  let member;
  try {
    member = await withTimeout(
      fetchMemberByBioguideId(id, undefined, { skipFecLookup: true, skipLisLookup: true }),
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

  // Resolve FEC candidate ID in priority order (all fallbacks cached 24hr):
  // 1. Manual override in data/fec-mapping.ts (sync, instant)
  // 2. congress-legislators dataset (in-memory + ISR, covers most members)
  // 3. OpenFEC /candidates/?bioguide_id=X (canonical API lookup, covers remainder)
  // 4. null — money module stays hidden
  const fecCandidateId: string | null =
    getFecCandidateIdForBioguide(id) ||
    (await withTimeout(getFecCandidateIdFromDataset(id), 3000)) ||
    (await withTimeout(getFecCandidateIdByBioguideApi(id), 4000)) ||
    null;

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
