/**
 * API route for fetching member press releases and statements
 * 
 * Server-only endpoint that attempts to fetch official statements from member websites.
 * Currently a minimal stub implementation.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMemberByBioguideId } from "../../../../lib/congressMembers";
import { Statement } from "../../../../data/types";
import { inferTopicFromText } from "../../../../lib/topicTagger";

/**
 * Fetch statements for a member
 * 
 * For now, this is a stub that:
 * - Returns empty array if member has no official website
 * - If website exists, returns a placeholder statement item pointing to the website
 * - Future: Could fetch RSS feed or scrape press releases page
 */
async function fetchMemberStatements(bioguideId: string): Promise<Statement[]> {
  try {
    // Fetch member data to check for official website
    const member = await fetchMemberByBioguideId(bioguideId);
    
    if (!member || !member.officialWebsite) {
      // No official website available - return empty array
      return [];
    }
    
    // For now, return a single placeholder statement pointing to the official website
    // Future: Could fetch RSS feed from website if available
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    const statements: Statement[] = [
      {
        id: `statement-website-${bioguideId}`,
        title: "Official Website",
        date: dateString,
        text: `Visit ${member.fullName}'s official website for press releases, statements, and updates.`,
        sourceType: "Official Website",
        sources: [
          {
            title: "Official Website",
            publisher: member.fullName,
            url: member.officialWebsite,
            excerpt: `Official website for ${member.fullName} (${member.chamber}, ${member.state}).`,
          },
          {
            title: "Congress.gov Member Profile",
            publisher: "Congress.gov",
            url: `https://www.congress.gov/member/${bioguideId}/${bioguideId}`,
            excerpt: `Official member profile and information from Congress.gov.`,
          },
        ],
      },
    ];
    
    // Infer topic from statement text
    const topic = inferTopicFromText(statements[0].text);
    if (topic) {
      statements[0].topic = topic;
    }
    
    return statements;
  } catch (error) {
    console.error(`Failed to fetch statements for ${bioguideId}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bioguideId = searchParams.get("bioguideId");
    
    if (!bioguideId) {
      return NextResponse.json(
        { error: "bioguideId parameter is required" },
        { status: 400 }
      );
    }
    
    const statements = await fetchMemberStatements(bioguideId);
    
    return NextResponse.json({ statements });
  } catch (error) {
    console.error("Error fetching member statements:", error);
    return NextResponse.json(
      { error: "Failed to fetch statements", statements: [] },
      { status: 500 }
    );
  }
}

