import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
  openGraph: {
    title: "Methodology • Polititrack",
    description:
      "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
    type: "website",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Methodology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Methodology • Polititrack",
    description:
      "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
    images: ["/og"],
  },
};

export default function MethodologyPage() {
  return (
    <div className="reading-container space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="font-headline text-4xl font-bold text-[#041534] leading-tight">
          Methodology
        </h1>
        <p className="mt-3 text-base text-[#75777F] leading-relaxed">
          How PolitiTrack works, what it shows, and what it doesn&apos;t.
        </p>
      </div>

      {/* What PolitiTrack Is */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">
          What PolitiTrack Is (and Isn&apos;t)
        </h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            PolitiTrack is a civic transparency tool that helps people understand how
            government works. We surface how politicians vote, who funds their campaigns,
            and what legislation they&apos;re sponsoring — all from official primary sources,
            presented neutrally.
          </p>
          <p>
            PolitiTrack is not a news site, a political scoring system, or an advocacy
            platform. We don&apos;t tell you who to vote for. We provide facts and
            citations so you can decide for yourself.
          </p>
        </div>
      </div>

      {/* Data Sources */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">Data Sources</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>All data is pulled live from official government APIs and databases:</p>
          <ul className="space-y-2 ml-4">
            {[
              {
                name: "Congress.gov API",
                desc: "Member profiles, sponsored bills, voting records, and bill status for the 119th Congress.",
              },
              {
                name: "OpenFEC (Federal Election Commission)",
                desc: "Campaign finance data including fundraising totals and top donor categories.",
              },
              {
                name: "Senate.gov XML feeds",
                desc: "Senate roll-call vote results.",
              },
              {
                name: "United States Project bioguide dataset",
                desc: "FEC candidate ID cross-reference for matching Congress members to FEC records.",
              },
            ].map(({ name, desc }) => (
              <li key={name} className="flex gap-2">
                <span className="text-[#041534] font-semibold shrink-0">·</span>
                <span>
                  <strong className="text-[#041534]">{name}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#75777F] border-t border-[#C5C6CF] pt-3 mt-3">
            Member and bill data is cached for 30 minutes. FEC financial data is cached for
            24 hours due to API rate limits (60 requests/hour).
          </p>
        </div>
      </div>

      {/* How Receipts Work */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">How Receipts Work</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            Every claim and statistic is backed by a primary source. When you see a
            citation icon or &ldquo;View receipts&rdquo; button, clicking it shows the original
            source — title, publisher, date, and a brief note on what it contains.
          </p>
          <p>
            You can copy receipts as formatted text to share or verify independently.
            All sources are publicly accessible government records.
          </p>
        </div>
      </div>

      {/* Topic Lens */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">What &ldquo;Topic Lens&rdquo; Means</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            Topic Lens is a filter that lets you focus on a policy area (Healthcare,
            Environment, Infrastructure, etc.) across the whole site. It highlights relevant
            votes, bills, and statements without hiding anything — it&apos;s a way to organize
            the information, not a judgment on what matters.
          </p>
        </div>
      </div>

      {/* Compare Feature */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">What Compare Does</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            Compare places two politicians side-by-side so you can see their funding
            sources, vote counts, and bill activity at a glance. It is a factual display
            tool, not a ranking or endorsement. The same data that appears on individual
            profiles is shown together — nothing more, nothing less.
          </p>
        </div>
      </div>

      {/* Neutral Language */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">Neutral Language Policy</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            PolitiTrack avoids loaded language. Instead of words like &ldquo;corrupt&rdquo; or
            &ldquo;liar&rdquo;, we use descriptive terms:
          </p>
          <ul className="space-y-2 ml-4">
            {[
              { term: "Alignment", def: "A politician's votes or statements match their stated positions." },
              { term: "Mismatch", def: "A discrepancy exists between stated positions and recorded actions." },
              { term: "Unclear", def: "Information is incomplete, ambiguous, or unavailable." },
            ].map(({ term, def }) => (
              <li key={term} className="flex gap-2">
                <span className="text-[#041534] font-semibold shrink-0">·</span>
                <span>
                  <strong className="text-[#041534]">{term}:</strong> {def}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Known Limitations */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">Known Limitations</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <ul className="space-y-2 ml-4">
            {[
              "House roll-call votes are not yet available — the Congress.gov v3 API does not expose a House votes endpoint. Senate votes work via Senate.gov XML.",
              "FEC financial data is rate-limited (60 req/hr). Profiles without a cached FEC ID show $0 until data loads client-side.",
              "ZIP code district lookup uses a starter dataset with limited coverage. Expansion is planned.",
              "Member press/statements are pulled from RSS feeds when available; most profiles show sponsored bills as a proxy.",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#041534] font-semibold shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6 space-y-3">
        <h2 className="font-headline text-xl font-bold text-[#041534]">Contact & Feedback</h2>
        <div className="space-y-3 text-sm text-[#191C1D]/80 leading-relaxed">
          <p>
            Found an error or have a suggestion? Reach out on X{" "}
            <a
              href="https://x.com/dimaiowill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#041534] font-semibold underline hover:text-[#1B2A4A]"
            >
              @dimaiowill
            </a>
            . All data accuracy issues are taken seriously — PolitiTrack is only
            useful if it&apos;s correct.
          </p>
        </div>
      </div>
    </div>
  );
}
