/**
 * API route for fetching member press releases and statements
 *
 * Server-only endpoint that fetches official press releases from member
 * websites via RSS feeds. Falls back to sponsored legislation from the
 * Congress.gov API when RSS is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMemberByBioguideId } from "../../../../lib/congressMembers";
import { Statement } from "../../../../data/types";
import { inferTopicFromText } from "../../../../lib/topicTagger";

/** Parsed RSS item from a member's press feed */
interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

/**
 * Generate candidate RSS feed URLs for a congress member's website.
 *
 * House and Senate member sites commonly expose press releases via RSS
 * at predictable paths. We try multiple patterns and return results from
 * the first that succeeds.
 */
function buildRssCandidateUrls(
  officialWebsite: string,
  lastName: string,
  chamber: "House" | "Senate"
): string[] {
  // Normalise the base URL (strip trailing slash)
  const base = officialWebsite.replace(/\/+$/, "");
  const lowerLast = lastName.toLowerCase().replace(/[^a-z]/g, "");

  const urls: string[] = [];

  // ---- Generic paths that work on many .gov sites ----
  urls.push(`${base}/rss.xml`);
  urls.push(`${base}/feed/`);
  urls.push(`${base}/rss/`);
  urls.push(`${base}/press-releases/feed/`);
  urls.push(`${base}/news/rss.xml`);
  urls.push(`${base}/media-center/press-releases/rss`);
  urls.push(`${base}/newsroom/feed`);

  if (chamber === "House") {
    // House sites often use: https://{lastname}.house.gov/rss.xml
    urls.push(`https://${lowerLast}.house.gov/rss.xml`);
    urls.push(`https://${lowerLast}.house.gov/press-releases/feed/`);
    urls.push(`https://${lowerLast}.house.gov/rss/press-releases.xml`);
  } else {
    // Senate sites
    urls.push(`https://www.${lowerLast}.senate.gov/rss/feeds/?type=press`);
    urls.push(`https://www.${lowerLast}.senate.gov/rss.xml`);
    urls.push(`https://${lowerLast}.senate.gov/rss/feeds/?type=press`);
  }

  // De-duplicate while preserving order
  return [...new Set(urls)];
}

/**
 * Minimal XML text extraction — pulls text content from an XML tag.
 * Handles both <tag>text</tag> and CDATA sections.
 */
function extractTagText(xml: string, tag: string): string {
  // Try with namespace prefix first (e.g., <dc:date>), then plain
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"),
  ];

  for (const re of patterns) {
    const match = xml.match(re);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * Parse RSS/Atom XML into an array of items.
 * Supports both RSS 2.0 (<item>) and Atom (<entry>) feeds.
 */
function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Split by <item> or <entry> tags
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const title = extractTagText(block, "title") || "Untitled";
    const link =
      extractTagText(block, "link") ||
      extractTagText(block, "guid") ||
      "";
    const pubDate =
      extractTagText(block, "pubDate") ||
      extractTagText(block, "published") ||
      extractTagText(block, "dc:date") ||
      extractTagText(block, "updated") ||
      "";
    const description =
      extractTagText(block, "description") ||
      extractTagText(block, "summary") ||
      extractTagText(block, "content") ||
      "";

    // Strip HTML tags from description for plain-text display
    const cleanDescription = description
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    items.push({
      title,
      link: link.replace(/<[^>]*>/g, "").trim(), // Atom <link> can be self-closing with href attr
      pubDate,
      description: cleanDescription.slice(0, 500), // Cap length
    });
  }

  return items;
}

/**
 * Attempt to extract href from Atom-style <link> tags.
 * Atom feeds use <link href="..." /> instead of <link>url</link>.
 */
function fixAtomLinks(xml: string, items: RssItem[]): RssItem[] {
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let idx = 0;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null && idx < items.length) {
    if (!items[idx].link) {
      // Try to find <link href="..."/>
      const linkMatch = match[1].match(/<link[^>]+href=["']([^"']+)["']/i);
      if (linkMatch) {
        items[idx].link = linkMatch[1];
      }
    }
    idx++;
  }

  return items;
}

/**
 * Try to fetch and parse an RSS feed from one of the candidate URLs.
 * Returns parsed items from the first URL that succeeds, or null.
 */
async function tryFetchRss(urls: string[]): Promise<RssItem[] | null> {
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml",
          "User-Agent": "PolitiTrack/1.0 (civic transparency project)",
        },
        next: { revalidate: 3600 }, // Cache RSS for 1 hour
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      // Verify we got XML-ish content (not an HTML error page)
      const isXml =
        contentType.includes("xml") ||
        contentType.includes("rss") ||
        contentType.includes("atom") ||
        text.trimStart().startsWith("<?xml") ||
        text.trimStart().startsWith("<rss") ||
        text.trimStart().startsWith("<feed");

      if (!isXml) continue;

      let items = parseRssItems(text);
      if (items.length === 0) continue;

      // Fix Atom-style links if needed
      items = fixAtomLinks(text, items);

      console.log(`[press] Fetched ${items.length} RSS items from ${url}`);
      return items;
    } catch {
      // Silently continue to next URL
      continue;
    }
  }

  return null;
}

/**
 * Format a date string from RSS into YYYY-MM-DD format.
 */
function formatDate(dateStr: string): string {
  if (!dateStr) {
    return new Date().toISOString().slice(0, 10);
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().slice(0, 10);
    }
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Convert RSS items into Statement objects.
 */
function rssItemsToStatements(
  items: RssItem[],
  memberName: string,
  bioguideId: string,
  officialWebsite: string
): Statement[] {
  // Take up to 10 most recent items
  return items.slice(0, 10).map((item, index) => {
    const statement: Statement = {
      id: `press-${bioguideId}-${index}`,
      title: item.title,
      date: formatDate(item.pubDate),
      text: item.description || `Press release from ${memberName}.`,
      sourceType: "Press Release",
      sources: [
        {
          title: item.title,
          publisher: memberName,
          url: item.link || officialWebsite,
          excerpt: item.description?.slice(0, 200) || undefined,
        },
        {
          title: "Official Website",
          publisher: memberName,
          url: officialWebsite,
          excerpt: `Official website for ${memberName}.`,
        },
      ],
    };

    // Infer topic from title + description
    const topic = inferTopicFromText(`${item.title} ${item.description}`);
    if (topic) {
      statement.topic = topic;
    }

    return statement;
  });
}

/**
 * Fetch recent sponsored legislation from Congress.gov API as fallback
 * press-like content when RSS is unavailable.
 */
async function fetchSponsoredBillsAsStatements(
  bioguideId: string,
  memberName: string,
  officialWebsite: string
): Promise<Statement[]> {
  try {
    const { congressFetch } = await import("../../../../lib/congress");

    interface SponsoredBill {
      number?: string;
      type?: string;
      congress?: number;
      title?: string;
      latestAction?: { text?: string; actionDate?: string };
      introducedDate?: string;
    }
    interface SponsoredResponse {
      sponsoredLegislation?: SponsoredBill[];
    }

    const response = await congressFetch<SponsoredResponse>(
      `/member/${bioguideId}/sponsored-legislation`,
      {
        params: { limit: 10 },
        revalidate: 21600, // 6 hours
      }
    );

    const bills = response.sponsoredLegislation;
    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return [];
    }

    return bills.slice(0, 10).map((bill, index) => {
      const billId = bill.type && bill.number
        ? `${bill.type.toLowerCase()}${bill.number}`
        : `bill-${index}`;
      const congress = bill.congress || 119;
      const chamberPath = bill.type === "S" ? "senate-bill" : "house-bill";
      const billUrl = `https://www.congress.gov/bill/${congress}th-congress/${chamberPath}/${bill.number}`;

      const dateStr =
        bill.latestAction?.actionDate ||
        bill.introducedDate ||
        new Date().toISOString().slice(0, 10);

      const text = bill.latestAction?.text
        ? `${bill.title} — Latest action: ${bill.latestAction.text}`
        : bill.title || "Sponsored legislation";

      const statement: Statement = {
        id: `sponsored-${bioguideId}-${billId}`,
        title: bill.title || `${bill.type || ""} ${bill.number || ""}`,
        date: formatDate(dateStr),
        text,
        sourceType: "Sponsored Bill",
        sources: [
          {
            title: bill.title || `${bill.type} ${bill.number}`,
            publisher: "Congress.gov",
            url: billUrl,
            excerpt: bill.latestAction?.text || undefined,
          },
          {
            title: "Official Website",
            publisher: memberName,
            url: officialWebsite,
            excerpt: `Official website for ${memberName}.`,
          },
        ],
      };

      const topic = inferTopicFromText(text);
      if (topic) {
        statement.topic = topic;
      }

      return statement;
    });
  } catch (error) {
    console.error(`[press] Failed to fetch sponsored bills for ${bioguideId}:`, error);
    return [];
  }
}

/**
 * Fetch statements for a member.
 *
 * Strategy:
 * 1. Try RSS feeds from the member's official website
 * 2. Fall back to sponsored legislation from Congress.gov API
 * 3. Return empty array if both fail
 */
async function fetchMemberStatements(bioguideId: string): Promise<Statement[]> {
  try {
    const member = await fetchMemberByBioguideId(bioguideId);

    if (!member) {
      return [];
    }

    const officialWebsite = member.officialWebsite || `https://www.congress.gov/member/${bioguideId}`;

    // 1. Try RSS feeds
    if (member.officialWebsite) {
      const rssUrls = buildRssCandidateUrls(
        member.officialWebsite,
        member.lastName,
        member.chamber
      );

      const rssItems = await tryFetchRss(rssUrls);
      if (rssItems && rssItems.length > 0) {
        return rssItemsToStatements(
          rssItems,
          member.fullName,
          bioguideId,
          officialWebsite
        );
      }
    }

    // 2. Fall back to sponsored legislation
    const billStatements = await fetchSponsoredBillsAsStatements(
      bioguideId,
      member.fullName,
      officialWebsite
    );

    if (billStatements.length > 0) {
      return billStatements;
    }

    // 3. Nothing available
    return [];
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
