/**
 * API route for fetching FEC financial data for a candidate.
 * Called client-side from the politician profile page so the
 * server-rendered page doesn't block on FEC rate limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMoneyForCandidate } from "../../../../lib/mappers/fecToMoney";

export async function GET(request: NextRequest) {
  const fecId = request.nextUrl.searchParams.get("fecId");

  if (!fecId) {
    return NextResponse.json(
      { error: "fecId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const moneyData = await fetchMoneyForCandidate(fecId);
    return NextResponse.json({ moneyData });
  } catch (error) {
    console.error(`[api/fec/money] Failed for ${fecId}:`, error);
    return NextResponse.json(
      { moneyData: null, error: "Financial data temporarily unavailable" },
      { status: 200 } // Return 200 so the client doesn't treat it as a hard failure
    );
  }
}
