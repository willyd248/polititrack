/**
 * API route: combined politician stats for the compare page.
 * Returns bills sponsored, vote count, and FEC financial summary.
 *
 * GET /api/politician/stats?bioguideId=M001150
 */

import { NextRequest, NextResponse } from "next/server";
import { getFecCandidateIdForBioguide } from "../../../../data/fec-mapping";
import { fetchMoneyForCandidate } from "../../../../lib/mappers/fecToMoney";
import { fetchSponsoredBills } from "../../../../lib/congressSponsorship";
import { fetchMemberVotes } from "../../../../lib/congressVotes";
import { fetchMemberByBioguideId } from "../../../../lib/congressMembers";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const bioguideId = request.nextUrl.searchParams.get("bioguideId");

  if (!bioguideId) {
    return NextResponse.json({ error: "bioguideId parameter required" }, { status: 400 });
  }

  // Look up FEC ID from the mapping table first
  const fecCandidateId = getFecCandidateIdForBioguide(bioguideId);

  // Fetch everything in parallel with individual try/catch so one failure doesn't block others
  const [memberResult, moneyResult, billsResult, votesResult] = await Promise.allSettled([
    fetchMemberByBioguideId(bioguideId, undefined, { skipLisLookup: true }),
    fecCandidateId ? fetchMoneyForCandidate(fecCandidateId) : Promise.resolve(null),
    fetchSponsoredBills(bioguideId, 119, 100),
    (async () => {
      // Need member chamber for vote lookup — fetch member first
      try {
        const m = await fetchMemberByBioguideId(bioguideId, undefined, { skipLisLookup: true });
        if (!m) return [];
        return await fetchMemberVotes(bioguideId, 119, 50, m.chamber, m);
      } catch {
        return [];
      }
    })(),
  ]);

  const member = memberResult.status === "fulfilled" ? memberResult.value : null;
  const moneyData = moneyResult.status === "fulfilled" ? moneyResult.value : null;
  const bills = billsResult.status === "fulfilled" ? billsResult.value : null;
  const votes = votesResult.status === "fulfilled" ? votesResult.value : [];

  const billsCount = bills?.length ?? 0;
  const votesCount = Array.isArray(votes) ? votes.length : 0;
  const topDonorCategory = moneyData?.industryBreakdown?.[0]?.industry ?? null;
  const raised = moneyData?.totals?.raised ?? null;
  const spent = moneyData?.totals?.spent ?? null;

  return NextResponse.json({
    bioguideId,
    fecCandidateId: fecCandidateId || member?.fecCandidateId || null,
    billsSponsored: billsCount,
    votesThisYear: votesCount,
    topDonorCategory,
    raised,
    spent,
    chamber: member?.chamber ?? null,
    party: member?.party ?? null,
  });
}
