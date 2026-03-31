/**
 * Mapper from Congress.gov API v3 bill response to Polititrack Bill type
 *
 * Fetches bill detail + all sub-endpoints (summaries, actions, cosponsors,
 * subjects, related bills, text versions) to build a complete Bill object.
 *
 * Congress.gov API documentation: https://api.congress.gov/
 */

import { TimelineEvent, Source } from "../../data/types";
import { Bill, BillSponsor, RelatedBill } from "../../data/bills";
import { inferTopicFromText } from "../topicTagger";

// Congress.gov API response types
interface CongressBill {
  number: string | number;
  type: string; // "HR", "S", etc.
  congress: number;
  title: string;
  latestAction?: {
    text: string;
    actionDate: string;
  };
  updateDate?: string;
  summary?: {
    text: string;
  };
  actions?: Array<{
    text: string;
    actionDate: string;
    type?: string;
  }> | { count: number; url: string };
  url?: string;
  textVersions?: Array<{
    url: string;
    type: string;
  }> | { count: number; url: string };
  sponsor?: {
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
  };
  sponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    district?: number;
  }>;
  cosponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    cosponsorDate?: string;
  }> | { count: number; url: string };
  policyArea?: { name: string };
  introducedDate?: string;
}

interface CongressBillsResponse {
  bills?: CongressBill[];
  pagination?: {
    count: number;
    next?: string;
  };
}

interface CongressBillResponse {
  bill: CongressBill;
}

// Sub-endpoint response types
interface CongressSummariesResponse {
  summaries?: Array<{
    text: string;
    actionDate?: string;
    actionDesc?: string;
    updateDate?: string;
    versionCode?: string;
  }>;
}

interface CongressActionsResponse {
  actions?: Array<{
    text: string;
    actionDate: string;
    type?: string;
    actionCode?: string;
    sourceSystem?: { code: number; name: string };
  }>;
}

interface CongressCosponsorsResponse {
  cosponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    district?: number;
    sponsorshipDate?: string;
    isOriginalCosponsor?: boolean;
  }>;
  pagination?: { count: number };
}

interface CongressSubjectsResponse {
  subjects?: {
    legislativeSubjects?: Array<{ name: string }>;
    policyArea?: { name: string };
  };
}

interface CongressRelatedBillsResponse {
  relatedBills?: Array<{
    title: string;
    type: string;
    number: number;
    congress: number;
    latestAction?: { text: string; actionDate: string };
    relationshipDetails?: Array<{ type: string }>;
  }>;
}

interface CongressTextResponse {
  textVersions?: Array<{
    type: string;
    date: string;
    formats?: Array<{ type: string; url: string }>;
    url?: string;
  }>;
}

/**
 * Map Congress.gov bill ID format to Polititrack ID
 * Format: {congress}-{type}{number} (e.g., "118-hr123", "118-s1")
 */
export function formatBillId(congress: number, type: string, number: string): string {
  const typeLower = type.toLowerCase();
  return `${congress}-${typeLower}${number}`;
}

/**
 * Parse Polititrack bill ID to Congress.gov format
 * Format: {congress}-{type}{number} (e.g., "118-hr123", "118-s1")
 */
export function parseBillId(id: string): { congress: number; type: string; number: string } | null {
  const match = id.match(/^(\d+)-([a-z]+)(\d+)$/i);
  if (!match) return null;

  return {
    congress: parseInt(match[1], 10),
    type: match[2].toUpperCase(),
    number: match[3],
  };
}

/**
 * Map Congress.gov status to Polititrack status
 */
function mapStatus(bill: CongressBill): Bill["status"] {
  const latestAction = bill.latestAction?.text?.toLowerCase() || "";

  if (latestAction.includes("became public law") || latestAction.includes("signed")) {
    return "Passed";
  }
  if (latestAction.includes("failed") || latestAction.includes("vetoed")) {
    return "Failed";
  }
  if (latestAction.includes("committee") || latestAction.includes("referred")) {
    return "In Committee";
  }

  return "Introduced";
}

/**
 * Map Congress.gov actions to timeline events
 */
function mapTimelineEvents(
  actions: Array<{ text: string; actionDate: string; type?: string }>,
  bill: CongressBill,
  congress: number,
  type: string,
  number: string
): TimelineEvent[] {
  const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;

  if (actions.length > 0) {
    // Sort by date ascending (oldest first)
    const sorted = [...actions].sort(
      (a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime()
    );

    return sorted.map((action, index) => ({
      id: `timeline-${index}`,
      date: action.actionDate || bill.updateDate || "",
      title: action.text || "Action",
      details: action.text,
      topic: undefined,
      sources: [
        {
          title: "Congress.gov Bill Actions",
          publisher: "U.S. Congress",
          date: action.actionDate || "",
          url: `${billUrl}/all-actions`,
          excerpt: `Official record of bill action: ${action.text}`,
        },
      ],
    }));
  }

  // Fallback to latest action
  if (bill.latestAction) {
    return [
      {
        id: "timeline-0",
        date: bill.latestAction.actionDate || bill.updateDate || "",
        title: bill.latestAction.text || "Latest Action",
        details: bill.latestAction.text,
        sources: [
          {
            title: "Congress.gov Latest Action",
            publisher: "U.S. Congress",
            date: bill.latestAction.actionDate || "",
            url: billUrl,
            excerpt: `Latest action: ${bill.latestAction.text}`,
          },
        ],
      },
    ];
  }

  return [];
}

/**
 * Create summary sources from bill data
 */
function createSummarySources(
  congress: number,
  type: string,
  number: string,
  updateDate: string,
  hasSummary: boolean,
  textUrl?: string
): Source[] {
  const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
  const sources: Source[] = [
    {
      title: "Congress.gov Bill Page",
      publisher: "U.S. Congress",
      date: updateDate,
      url: billUrl,
      excerpt: `Official bill page for ${type} ${number} (${congress}th Congress)`,
    },
  ];

  if (hasSummary) {
    sources.unshift({
      title: "Official Bill Summary",
      publisher: "Congress.gov",
      date: updateDate,
      url: `${billUrl}?s=1&r=1`,
      excerpt: `Official summary text for ${type} ${number} from Congress.gov.`,
    });
  }

  if (textUrl) {
    sources.push({
      title: "Full Bill Text",
      publisher: "U.S. Congress",
      date: updateDate,
      url: textUrl,
      excerpt: `Full text of ${type} ${number}`,
    });
  }

  return sources;
}

/**
 * Map Congress.gov sponsor to BillSponsor
 */
function mapSponsor(sponsor?: {
  bioguideId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  party?: string;
  state?: string;
}): BillSponsor | undefined {
  if (!sponsor || !sponsor.bioguideId) return undefined;

  return {
    bioguideId: sponsor.bioguideId,
    name: sponsor.fullName || `${sponsor.firstName || ""} ${sponsor.lastName || ""}`.trim(),
    party: sponsor.party,
    state: sponsor.state,
  };
}

/**
 * Map Congress.gov cosponsors to BillSponsor array (limit 20)
 */
function mapCosponsors(
  cosponsors?: Array<{
    bioguideId: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
  }>
): BillSponsor[] {
  if (!cosponsors || cosponsors.length === 0) return [];

  return cosponsors
    .slice(0, 20)
    .map((cosponsor) => ({
      bioguideId: cosponsor.bioguideId,
      name: cosponsor.fullName || `${cosponsor.firstName || ""} ${cosponsor.lastName || ""}`.trim(),
      party: cosponsor.party,
      state: cosponsor.state,
    }))
    .filter((cosponsor) => cosponsor.bioguideId);
}

/**
 * Create sponsor/cosponsor sources
 */
function createSponsorSources(
  congress: number,
  type: string,
  number: string,
  updateDate: string
): Source[] {
  const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
  return [
    {
      title: "Congress.gov Bill Page - Cosponsors",
      publisher: "Congress.gov",
      date: updateDate,
      url: `${billUrl}/cosponsors`,
      excerpt: `Official cosponsor information for ${type} ${number}.`,
    },
  ];
}

/**
 * Safely fetch a sub-endpoint, returning null on failure
 */
async function safeFetch<T>(
  congressFetch: <R>(path: string, options?: { revalidate?: number }) => Promise<R>,
  path: string,
  revalidate: number = 1800
): Promise<T | null> {
  try {
    return await congressFetch<T>(path, { revalidate });
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags from summary text
 */
function stripHtml(html: string): string {
  let text = html.replace(/<[^>]*>/g, "");
  // Decode common HTML entities left after tag stripping
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ");
  return text.trim();
}

/**
 * Build Congress.gov human-readable URL for a bill
 */
function billPageUrl(congress: number, type: string, number: string): string {
  return `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}-bill/${number}`;
}

/**
 * Map Congress.gov bill to Polititrack Bill type (used for list endpoint — no sub-fetches)
 */
export function mapCongressBillToBill(congressBill: CongressBill): Bill {
  const congress = congressBill.congress;
  const type = congressBill.type;
  const number = String(congressBill.number);
  const id = formatBillId(congress, type, number);
  const updateDate = congressBill.updateDate || "";

  const summaryText = congressBill.summary?.text ? stripHtml(congressBill.summary.text) : undefined;

  const summary = summaryText
    ? summaryText
        .split(/[.\n]/)
        .filter((s) => s.trim().length > 20)
        .slice(0, 6)
        .map((s) => s.trim() + (s.trim().endsWith(".") ? "" : "."))
    : [
        `This bill was introduced in the ${congress}th Congress.`,
        "No official summary available from Congress.gov yet.",
      ];

  const status = mapStatus(congressBill);
  const actionsArray = Array.isArray(congressBill.actions) ? congressBill.actions : [];
  const timeline = mapTimelineEvents(actionsArray, congressBill, congress, type, number);
  const summarySources = createSummarySources(congress, type, number, updateDate, !!summaryText);

  const sponsorData = congressBill.sponsor || (congressBill.sponsors && congressBill.sponsors[0]) || undefined;
  const sponsor = mapSponsor(sponsorData);
  const cosponsors = Array.isArray(congressBill.cosponsors) ? mapCosponsors(congressBill.cosponsors) : [];
  const sponsorSources = (sponsor || cosponsors.length > 0)
    ? createSponsorSources(congress, type, number, updateDate)
    : undefined;

  const statusAndNextSteps = congressBill.latestAction
    ? [{ step: congressBill.latestAction.text, date: congressBill.latestAction.actionDate }]
    : [];

  const topicText = `${congressBill.title} ${congressBill.summary?.text || ""}`;
  const topic = congressBill.policyArea?.name || inferTopicFromText(topicText) || undefined;
  const subjects = congressBill.policyArea ? [congressBill.policyArea.name] : undefined;

  return {
    id,
    name: `${type} ${number}: ${congressBill.title}`,
    status,
    topic,
    summary,
    summaryText,
    sponsor,
    cosponsors: cosponsors.length > 0 ? cosponsors : undefined,
    sponsorSources,
    subjects,
    whatChangesForMostPeople: [
      "Impact analysis will be available once the bill progresses further.",
    ],
    whoIsImpacted: ["Analysis pending"],
    argumentsFor: ["Arguments will be updated as the bill progresses."],
    argumentsAgainst: ["Arguments will be updated as the bill progresses."],
    statusAndNextSteps,
    timeline,
    summarySources,
  };
}

/**
 * Fetch and map a single bill from Congress.gov, including all sub-endpoints
 */
export async function fetchBillById(id: string): Promise<Bill | null> {
  const parsed = parseBillId(id);
  if (!parsed) return null;

  const { congress, type, number } = parsed;
  const typeLower = type.toLowerCase();
  const basePath = `/bill/${congress}/${typeLower}/${number}`;

  try {
    const { congressFetch } = await import("../congress");

    // Fetch bill detail + all sub-endpoints in parallel
    const [billRes, summariesRes, actionsRes, cosponsorsRes, subjectsRes, relatedRes, textRes] =
      await Promise.all([
        congressFetch<CongressBillResponse>(basePath, { revalidate: 1800 }),
        safeFetch<CongressSummariesResponse>(congressFetch, `${basePath}/summaries`, 1800),
        safeFetch<CongressActionsResponse>(congressFetch, `${basePath}/actions`, 1800),
        safeFetch<CongressCosponsorsResponse>(congressFetch, `${basePath}/cosponsors`, 1800),
        safeFetch<CongressSubjectsResponse>(congressFetch, `${basePath}/subjects`, 1800),
        safeFetch<CongressRelatedBillsResponse>(congressFetch, `${basePath}/relatedbills`, 1800),
        safeFetch<CongressTextResponse>(congressFetch, `${basePath}/text`, 1800),
      ]);

    if (!billRes.bill) return null;

    const congressBill = billRes.bill;
    const updateDate = congressBill.updateDate || "";
    const billUrl = billPageUrl(congress, type, number);

    // --- Summary ---
    const rawSummary = summariesRes?.summaries?.[0]?.text || congressBill.summary?.text;
    const summaryText = rawSummary ? stripHtml(rawSummary) : undefined;

    const summary = summaryText
      ? summaryText
          .split(/[.\n]/)
          .filter((s) => s.trim().length > 20)
          .slice(0, 8)
          .map((s) => s.trim() + (s.trim().endsWith(".") ? "" : "."))
      : [
          `This bill was introduced in the ${congress}th Congress.`,
          "No official summary available from Congress.gov yet.",
        ];

    // --- Actions / Timeline ---
    const actionsArray = actionsRes?.actions || (Array.isArray(congressBill.actions) ? congressBill.actions : []);
    const timeline = mapTimelineEvents(actionsArray, congressBill, congress, type, number);

    // Status & Next Steps — use all actions sorted newest first
    const statusAndNextSteps = actionsArray.length > 0
      ? [...actionsArray]
          .sort((a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime())
          .slice(0, 6)
          .map((a) => ({ step: a.text, date: a.actionDate }))
      : congressBill.latestAction
        ? [{ step: congressBill.latestAction.text, date: congressBill.latestAction.actionDate }]
        : [];

    // --- Cosponsors ---
    const cosponsorsArray = cosponsorsRes?.cosponsors || (Array.isArray(congressBill.cosponsors) ? congressBill.cosponsors : []);
    const cosponsors = mapCosponsors(cosponsorsArray);
    const cosponsorCount = cosponsorsRes?.pagination?.count ?? cosponsorsArray.length;

    // --- Subjects ---
    const subjectsList: string[] = [];
    if (subjectsRes?.subjects?.policyArea?.name) {
      subjectsList.push(subjectsRes.subjects.policyArea.name);
    }
    if (subjectsRes?.subjects?.legislativeSubjects) {
      for (const subj of subjectsRes.subjects.legislativeSubjects) {
        if (subj.name && !subjectsList.includes(subj.name)) {
          subjectsList.push(subj.name);
        }
      }
    }
    // Fallback to policyArea from detail endpoint
    if (subjectsList.length === 0 && congressBill.policyArea?.name) {
      subjectsList.push(congressBill.policyArea.name);
    }

    // --- Related Bills ---
    const relatedBills: RelatedBill[] = (relatedRes?.relatedBills || []).slice(0, 10).map((rb) => ({
      id: formatBillId(rb.congress, rb.type, String(rb.number)),
      title: rb.title,
      type: rb.type,
      number: String(rb.number),
      congress: rb.congress,
      latestAction: rb.latestAction?.text,
    }));

    // --- Text URL ---
    let textUrl: string | undefined;
    if (textRes?.textVersions && textRes.textVersions.length > 0) {
      const latest = textRes.textVersions[0];
      // Prefer HTML format
      const htmlFormat = latest.formats?.find((f) => f.type === "Formatted Text" || f.type === "HTML");
      const pdfFormat = latest.formats?.find((f) => f.type === "PDF");
      textUrl = htmlFormat?.url || pdfFormat?.url || latest.url || `${billUrl}/text`;
    } else {
      textUrl = `${billUrl}/text`;
    }

    // --- Sponsor ---
    const sponsorData = congressBill.sponsor || (congressBill.sponsors && congressBill.sponsors[0]) || undefined;
    const sponsor = mapSponsor(sponsorData);
    const sponsorSources = (sponsor || cosponsors.length > 0)
      ? createSponsorSources(congress, type, number, updateDate)
      : undefined;

    // --- Sources ---
    const summarySources = createSummarySources(congress, type, number, updateDate, !!summaryText, textUrl);

    // --- Topic ---
    const topic = subjectsList[0] || congressBill.policyArea?.name || inferTopicFromText(`${congressBill.title} ${summaryText || ""}`) || undefined;

    // --- Status ---
    const status = mapStatus(congressBill);

    return {
      id: formatBillId(congress, type, String(congressBill.number)),
      name: `${type} ${String(congressBill.number)}: ${congressBill.title}`,
      status,
      topic,
      summary,
      summaryText,
      sponsor,
      cosponsors: cosponsors.length > 0 ? cosponsors : undefined,
      cosponsorCount: cosponsorCount > 0 ? cosponsorCount : undefined,
      sponsorSources,
      subjects: subjectsList.length > 0 ? subjectsList : undefined,
      relatedBills: relatedBills.length > 0 ? relatedBills : undefined,
      textUrl,
      whatChangesForMostPeople: [
        "Impact analysis will be available once the bill progresses further.",
      ],
      whoIsImpacted: ["Analysis pending"],
      argumentsFor: ["Arguments will be updated as the bill progresses."],
      argumentsAgainst: ["Arguments will be updated as the bill progresses."],
      statusAndNextSteps,
      timeline,
      summarySources,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch list of bills from Congress.gov
 */
export async function fetchBills(limit: number = 10): Promise<Bill[]> {
  try {
    const { congressFetch } = await import("../congress");
    const response = await congressFetch<CongressBillsResponse>(
      "/bill/119",
      {
        params: {
          limit,
          sort: "updateDate desc",
        },
        revalidate: 1800,
      }
    );

    if (!response.bills || response.bills.length === 0) {
      return [];
    }

    return response.bills.map(mapCongressBillToBill);
  } catch {
    return [];
  }
}
