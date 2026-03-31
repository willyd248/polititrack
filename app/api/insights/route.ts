/**
 * AI-powered "Follow the Money" insights generator.
 *
 * Cross-references FEC campaign finance data with voting records and
 * sponsored bills to generate plain-English transparency analysis.
 *
 * Uses Claude Haiku for cost-efficient generation. Results cached 24hr
 * in-memory to minimize API calls.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface InsightRequest {
  memberName: string;
  chamber: string;
  state: string;
  party: string;
  totalRaised?: number;
  topContributors?: Array<{ name: string; amount: string }>;
  industryBreakdown?: Array<{ industry: string; percentage: number }>;
  recentVotes?: Array<{ description: string; position: string; topic?: string; date?: string }>;
  sponsoredBills?: Array<{ title: string; topic?: string }>;
  cosponsoredBills?: Array<{ title: string; topic?: string }>;
}

interface InsightConnection {
  industry: string;
  amount: string;
  votingPattern: string;
  alignment: "High" | "Moderate" | "Low" | "Unknown";
}

interface Insights {
  headline: string;
  summary: string;
  connections: InsightConnection[];
  notable: string[];
  smallDonorPct?: string;
  generatedAt: number;
}

// In-memory cache: bioguideId → Insights
const cache = new Map<string, Insights>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isCacheValid(insights: Insights): boolean {
  return Date.now() - insights.generatedAt < CACHE_TTL_MS;
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function buildInsightsWithoutAI(data: InsightRequest): Insights {
  const topIndustry = data.industryBreakdown?.[0];
  const raised = data.totalRaised ? formatMoney(data.totalRaised) : null;

  const connections: InsightConnection[] = (data.industryBreakdown || [])
    .slice(0, 3)
    .map((ind) => ({
      industry: ind.industry,
      amount: `${ind.percentage}% of contributions`,
      votingPattern: "Voting pattern analysis requires AI insights",
      alignment: "Unknown" as const,
    }));

  const notable: string[] = [];
  if (raised) notable.push(`Raised ${raised} this election cycle`);
  if (topIndustry) notable.push(`Largest contributor sector: ${topIndustry.industry} (${topIndustry.percentage}%)`);
  if (data.sponsoredBills?.length)
    notable.push(`Sponsored ${data.sponsoredBills.length} bills in the 119th Congress`);

  return {
    headline: topIndustry
      ? `Primarily funded by ${topIndustry.industry}`
      : `Campaign Finance Overview for ${data.memberName}`,
    summary: `${data.memberName} has raised ${raised || "an unspecified amount"} in campaign contributions. ${
      topIndustry
        ? `The largest sector is ${topIndustry.industry}, representing ${topIndustry.percentage}% of contributions.`
        : ""
    } Enable AI insights for a full money-to-votes analysis.`,
    connections,
    notable,
    generatedAt: Date.now(),
  };
}

async function generateInsightsWithAI(
  bioguideId: string,
  data: InsightRequest
): Promise<Insights> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildInsightsWithoutAI(data);
  }

  const client = new Anthropic({ apiKey });

  const raised = data.totalRaised ? formatMoney(data.totalRaised) : "unknown amount";
  const topContributorsText = data.topContributors?.length
    ? data.topContributors
        .slice(0, 5)
        .map((c) => `${c.name}: ${c.amount}`)
        .join(", ")
    : "not available";
  const industryText = data.industryBreakdown?.length
    ? data.industryBreakdown
        .slice(0, 5)
        .map((i) => `${i.industry} (${i.percentage}%)`)
        .join(", ")
    : "not available";
  const votesText = data.recentVotes?.length
    ? data.recentVotes
        .slice(0, 8)
        .map((v) => `${v.position} on "${v.description}"${v.topic ? ` [${v.topic}]` : ""}`)
        .join("; ")
    : "not available";
  const billsText = data.sponsoredBills?.length
    ? data.sponsoredBills
        .slice(0, 5)
        .map((b) => b.title)
        .join("; ")
    : "not available";

  const prompt = `You are an investigative political analyst for a civic transparency tool. Analyze the following data about a US Congress member and generate a plain-English "Follow the Money" transparency report.

MEMBER: ${data.memberName} (${data.chamber}, ${data.state}, ${data.party})
TOTAL RAISED: ${raised}
TOP CONTRIBUTORS: ${topContributorsText}
INDUSTRY BREAKDOWN: ${industryText}
RECENT VOTES: ${votesText}
SPONSORED BILLS: ${billsText}

Generate a JSON response with this exact structure:
{
  "headline": "One punchy sentence (max 12 words) summarizing the money-votes story",
  "summary": "2-3 sentences connecting top donor industries to voting patterns. Be specific. If data is limited, note that but still provide what you can.",
  "connections": [
    {
      "industry": "Industry name",
      "amount": "Dollar amount or percentage string",
      "votingPattern": "One sentence describing voting pattern related to this industry",
      "alignment": "High|Moderate|Low|Unknown"
    }
  ],
  "notable": [
    "Notable fact 1 (specific, concrete)",
    "Notable fact 2",
    "Notable fact 3"
  ],
  "smallDonorPct": "Estimated % from small individual donors if calculable, else null"
}

Rules:
- Be factual and non-partisan — present facts, not judgments
- Use specific dollar amounts when available
- "alignment" means how often their votes align with that industry's typical legislative interests
- Keep connections to top 3 industries max
- Notable facts should be specific and interesting
- If data is sparse, still provide the best analysis possible with what's available
- Never say "not available" in the output — work with what you have`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      headline: parsed.headline || "",
      summary: parsed.summary || "",
      connections: (parsed.connections || []).slice(0, 3),
      notable: (parsed.notable || []).slice(0, 4),
      smallDonorPct: parsed.smallDonorPct || null,
      generatedAt: Date.now(),
    };
  } catch (err) {
    console.error("[insights] Claude generation failed:", err);
    return buildInsightsWithoutAI(data);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bioguideId, ...insightData } = body as InsightRequest & { bioguideId: string };

    if (!bioguideId || !insightData.memberName) {
      return NextResponse.json({ error: "bioguideId and memberName required" }, { status: 400 });
    }

    // Return cached result if fresh
    const cached = cache.get(bioguideId);
    if (cached && isCacheValid(cached)) {
      return NextResponse.json({ insights: cached, cached: true });
    }

    const insights = await generateInsightsWithAI(bioguideId, insightData);
    cache.set(bioguideId, insights);

    return NextResponse.json({ insights, cached: false });
  } catch (err) {
    console.error("[insights] Route error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
