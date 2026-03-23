/**
 * API route for searching Congress members by name
 * 
 * Server-only endpoint that searches Congress.gov API for members.
 * Does not expose CONGRESS_API_KEY to client.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMembers } from "../../../../lib/congressMembers";

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
    
    // Fetch all members (or a reasonable limit)
    const members = await fetchMembers(118); // Get members for 118th Congress
    
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
      { status: 500 }
    );
  }
}

