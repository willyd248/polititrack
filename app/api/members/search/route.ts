/**
 * API route for searching Congress members by name
 * 
 * Server-only endpoint that searches Congress.gov API for members.
 * Does not expose CONGRESS_API_KEY to client.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMembers } from "../../../../lib/congressMembers";

// Allow up to 15s on Vercel (member fetch can be slow on cold start)
export const maxDuration = 15;

// In-memory cache for member list (avoid re-fetching on every search)
let cachedMembers: Awaited<ReturnType<typeof fetchMembers>> | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getCachedMembers() {
  const now = Date.now();
  if (cachedMembers && (now - cacheTime) < CACHE_TTL) {
    return cachedMembers;
  }

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000));
  const result = await Promise.race([fetchMembers(119), timeout]);

  if (result && result.length > 0) {
    cachedMembers = result;
    cacheTime = now;
    return result;
  }

  // Return stale cache if available
  return cachedMembers || [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("query") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const members = await getCachedMembers();

    // Filter by name (case-insensitive)
    const searchTerm = query.toLowerCase().trim();
    const results = members
      .filter((member) => {
        const fullName = member.fullName.toLowerCase();
        const firstName = member.firstName.toLowerCase();
        const lastName = member.lastName.toLowerCase();
        return (
          fullName.includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm)
        );
      })
      .slice(0, 10) // Limit to 10 results
      .map((member) => ({
        id: member.bioguideId,
        name: member.fullName,
        role: member.chamber === "House" ? "U.S. Representative" : "U.S. Senator",
        state: member.state,
        district: member.district,
        party: member.party,
        url: `/politician/${member.bioguideId}`,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching members:", error);
    return NextResponse.json(
      { error: "Failed to search members", results: [] },
      { status: 200 } // Return 200 so client doesn't show hard error
    );
  }
}

