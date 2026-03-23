/**
 * API route for searching FEC candidates
 * 
 * Server-only endpoint that searches OpenFEC API for candidates.
 * Does not expose FEC_API_KEY to client.
 */

import { searchFecCandidates } from "../../../../lib/fecCandidates";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("q") || searchParams.get("name") || undefined;
    const state = searchParams.get("state") || undefined;
    const office = searchParams.get("office") || undefined;
    
    if (!name && !state && !office) {
      return NextResponse.json(
        { error: "At least one search parameter (q/name, state, or office) is required" },
        { status: 400 }
      );
    }
    
    const results = await searchFecCandidates({
      name,
      state,
      office,
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching FEC candidates:", error);
    return NextResponse.json(
      { error: "Failed to search candidates" },
      { status: 500 }
    );
  }
}

