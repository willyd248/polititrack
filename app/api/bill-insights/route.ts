/**
 * AI-powered bill analysis endpoint.
 *
 * Takes a bill's title, summary, and subjects, then generates plain-English
 * analysis of impact, affected groups, and arguments for/against.
 *
 * Uses Claude Haiku for cost-efficient generation. Results cached 24hr in-memory.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface BillInsightRequest {
  billId: string;
  title: string;
  summaryText?: string;
  subjects?: string[];
  status: string;
  sponsor?: string;
  cosponsorCount?: number;
}

interface BillInsights {
  whatChanges: string[];
  whoIsImpacted: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  generatedAt: number;
}

// In-memory cache: billId → BillInsights
const cache = new Map<string, BillInsights>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isCacheValid(insights: BillInsights): boolean {
  return Date.now() - insights.generatedAt < CACHE_TTL_MS;
}

function buildInsightsWithoutAI(data: BillInsightRequest): BillInsights {
  // If we have summary text, produce basic bullet points from it
  const bullets: string[] = [];
  if (data.summaryText) {
    const sentences = data.summaryText
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    if (sentences.length > 0) {
      bullets.push(...sentences.slice(0, 3).map((s) => s + (s.endsWith(".") ? "" : ".")));
    }
  }

  return {
    whatChanges: bullets.length > 0
      ? bullets
      : ["Enable AI insights for a detailed impact analysis of this bill."],
    whoIsImpacted: data.subjects && data.subjects.length > 0
      ? data.subjects.slice(0, 5).map((s) => `People affected by ${s} policy`)
      : ["Enable AI insights for demographic impact analysis."],
    argumentsFor: ["Enable AI insights for detailed arguments analysis."],
    argumentsAgainst: ["Enable AI insights for detailed arguments analysis."],
    generatedAt: Date.now(),
  };
}

async function generateInsightsWithAI(data: BillInsightRequest): Promise<BillInsights> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildInsightsWithoutAI(data);
  }

  const client = new Anthropic({ apiKey });

  const subjectsText = data.subjects?.length
    ? data.subjects.join(", ")
    : "not specified";

  const prompt = `You are a nonpartisan policy analyst writing for a civic transparency tool used by everyday Americans. Analyze this bill and generate plain-English insights.

BILL TITLE: ${data.title}
STATUS: ${data.status}
SUBJECTS/TOPICS: ${subjectsText}
SPONSOR: ${data.sponsor || "not specified"}
COSPONSORS: ${data.cosponsorCount ?? "unknown"} cosponsors
OFFICIAL SUMMARY: ${data.summaryText || "No official summary available yet. Base your analysis on the title and subjects."}

Generate a JSON response with this exact structure:
{
  "whatChanges": [
    "Plain-English bullet explaining a specific way this bill changes things for ordinary people (3-5 bullets)"
  ],
  "whoIsImpacted": [
    "Specific group affected (e.g., 'Small business owners with fewer than 50 employees'). 4-6 groups."
  ],
  "argumentsFor": [
    "Specific argument in favor, with concrete reasoning (3-4 arguments)"
  ],
  "argumentsAgainst": [
    "Specific argument against, with concrete reasoning (3-4 arguments)"
  ]
}

Rules:
- Write for a general audience — no jargon, no legalese
- Be specific and concrete, not vague
- Be nonpartisan — present both sides fairly
- "whatChanges" should focus on tangible effects on daily life
- "whoIsImpacted" should name specific demographics, professions, or groups — not generic labels
- Each argument should be a substantive point, not a restatement of the bill's text
- If the summary is unavailable, infer what you can from the title and subjects, but be honest about limitations`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      whatChanges: (parsed.whatChanges || []).slice(0, 5),
      whoIsImpacted: (parsed.whoIsImpacted || []).slice(0, 6),
      argumentsFor: (parsed.argumentsFor || []).slice(0, 4),
      argumentsAgainst: (parsed.argumentsAgainst || []).slice(0, 4),
      generatedAt: Date.now(),
    };
  } catch (err) {
    console.error("[bill-insights] Claude generation failed:", err);
    return buildInsightsWithoutAI(data);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BillInsightRequest;

    if (!body.billId || !body.title) {
      return NextResponse.json({ error: "billId and title required" }, { status: 400 });
    }

    // Return cached result if fresh
    const cached = cache.get(body.billId);
    if (cached && isCacheValid(cached)) {
      return NextResponse.json({ insights: cached, cached: true });
    }

    const insights = await generateInsightsWithAI(body);
    cache.set(body.billId, insights);

    return NextResponse.json({ insights, cached: false });
  } catch (err) {
    console.error("[bill-insights] Route error:", err);
    return NextResponse.json({ error: "Failed to generate bill insights" }, { status: 500 });
  }
}
