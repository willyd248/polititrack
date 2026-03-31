"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Member } from "../../../data/types-members";
import { Politician } from "../../../data/politicians";
import { MoneyModule } from "../../../lib/mappers/fecToMoney";
import { LegislativeActivityItem } from "../../../lib/congressSponsorship";
import { Statement, Vote } from "../../../data/types";
import Link from "next/link";
import { MemberPhoto } from "../../components/MemberPhoto";
import { useReceipts } from "../../store/receipts-store";
import { useCompare } from "../../store/compare-store";
import { useSaved } from "../../store/saved-store";
import { stateNameToCode } from "../../../lib/stateConverter";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  smallDonorPct?: string | null;
  generatedAt: number;
}

interface PoliticianPageClientProps {
  member: Member | null;
  useMockData: boolean;
  politicianForCompare: Politician;
  moneyData?: MoneyModule | null;
  sponsoredBills?: LegislativeActivityItem[] | null;
  cosponsoredBills?: LegislativeActivityItem[] | null;
  memberVotes?: Vote[];
  fecCandidateId?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function partyColor(party: string): string {
  if (party === "D") return "#1B2A4A";
  if (party === "R") return "#8B2332";
  return "#75777F";
}

function partyLabel(party: string): string {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  if (party === "I") return "Independent";
  return party || "N/A";
}

function alignmentBg(a: InsightConnection["alignment"]): string {
  if (a === "High") return "bg-red-50 border-red-200";
  if (a === "Moderate") return "bg-amber-50 border-amber-200";
  if (a === "Low") return "bg-green-50 border-green-200";
  return "bg-surface-container-low border-outline-variant";
}

function alignmentColor(a: InsightConnection["alignment"]): string {
  if (a === "High") return "#A63744";
  if (a === "Moderate") return "#D97706";
  if (a === "Low") return "#1B6B3A";
  return "#75777F";
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: "follow-money", label: "Follow the Money" },
  { id: "finance",      label: "Campaign Finance" },
  { id: "votes",        label: "How They Vote" },
  { id: "legislation",  label: "Legislation" },
  { id: "statements",   label: "Statements" },
];

// ─── Side Nav ─────────────────────────────────────────────────────────────────

function SideNav({ activeSection }: { activeSection: string }) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-44 flex-col border-r border-outline-variant bg-white z-10">
      <nav className="flex-1 px-3 py-6 space-y-0.5">
        {NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className={`block w-full text-left px-3 py-2 rounded text-sm font-medium transition-all duration-150 ${
              activeSection === s.id
                ? "bg-[#041534] text-white"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <div className="h-px bg-surface-container mb-3" />
        <p className="text-[10px] text-outline leading-relaxed">
          Congress.gov · OpenFEC · Claude AI
        </p>
      </div>
    </aside>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PoliticianPageClient({
  member,
  useMockData,
  politicianForCompare,
  moneyData: initialMoneyData,
  sponsoredBills,
  cosponsoredBills,
  memberVotes = [],
  fecCandidateId,
}: PoliticianPageClientProps) {
  const politician = politicianForCompare;

  const [moneyData, setMoneyData] = useState<MoneyModule | null>(initialMoneyData || null);
  const [moneyLoading, setMoneyLoading] = useState(false);
  const [moneyError, setMoneyError] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [realStatements, setRealStatements] = useState<Statement[] | null>(null);
  const [statementsLoading, setStatementsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("follow-money");

  const searchParams = useSearchParams();
  const { openReceipts }                               = useReceipts();
  const { addPolitician, removePolitician, isSelected } = useCompare();
  const { toggleSavePolitician, isPoliticianSaved }     = useSaved();

  // Display values
  const displayName    = member?.fullName || politician.name || "Unknown Member";
  const displayState   = stateNameToCode(member?.state || politician.state || "N/A");
  const displayParty   = member?.party || politician.role || "N/A";
  const displayChamber = member
    ? member.chamber === "House" ? "House" : "Senate"
    : politician.role?.toUpperCase().startsWith("H") ? "House" : "Senate";
  const displayDistrict = member?.district;

  const billsSponsored = sponsoredBills?.length ?? politician.metrics.billsSponsored;
  const votesCount     = memberVotes?.length ?? politician.metrics.votesThisYear;
  const topDonor       = moneyData?.industryBreakdown?.[0]?.industry ?? (moneyLoading ? "Loading…" : fecCandidateId ? "–" : "N/A");

  const isSaved    = member?.bioguideId ? isPoliticianSaved(member.bioguideId) : false;
  const isCompared = isSelected(politician.id);

  // Lazy-load FEC money
  useEffect(() => {
    if (initialMoneyData || !fecCandidateId) return;
    let cancelled = false;
    setMoneyLoading(true);
    fetch(`/api/fec/money?fecId=${encodeURIComponent(fecCandidateId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.moneyData) setMoneyData(d.moneyData);
        if (d.error) setMoneyError(true);
      })
      .catch(() => { if (!cancelled) setMoneyError(true); })
      .finally(() => { if (!cancelled) setMoneyLoading(false); });
    return () => { cancelled = true; };
  }, [fecCandidateId, initialMoneyData]);

  // Generate AI insights once money + votes data is ready
  useEffect(() => {
    if (!member?.bioguideId || insightsLoading || insights) return;
    const hasData = moneyData !== null || memberVotes.length > 0 || (sponsoredBills?.length ?? 0) > 0;
    if (!hasData) return;

    setInsightsLoading(true);
    fetch("/api/insights", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        bioguideId:        member.bioguideId,
        memberName:        displayName,
        chamber:           displayChamber,
        state:             displayState,
        party:             displayParty,
        totalRaised:       moneyData?.totals.raised,
        topContributors:   moneyData?.topContributors ?? [],
        industryBreakdown: moneyData?.industryBreakdown ?? [],
        recentVotes: memberVotes.slice(0, 8).map((v) => ({
          description: v.description,
          position:    v.position,
          topic:       v.topic,
          date:        v.date,
        })),
        sponsoredBills:   (sponsoredBills ?? []).slice(0, 5).map((b) => ({ title: b.title, topic: b.topic })),
        cosponsoredBills: (cosponsoredBills ?? []).slice(0, 5).map((b) => ({ title: b.title, topic: b.topic })),
      }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.insights) setInsights(d.insights); })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.bioguideId, moneyData, memberVotes.length, sponsoredBills?.length]);

  // Fetch press statements
  useEffect(() => {
    if (!member?.bioguideId) return;
    setStatementsLoading(true);
    fetch(`/api/member/press?bioguideId=${encodeURIComponent(member.bioguideId)}`)
      .then((r) => r.json())
      .then((d) => setRealStatements(Array.isArray(d.statements) ? d.statements : []))
      .catch(() => setRealStatements([]))
      .finally(() => setStatementsLoading(false));
  }, [member?.bioguideId]);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    NAV_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Receipt deep-link
  useEffect(() => {
    const param = searchParams.get("receipt");
    if (param === "money" && moneyData) {
      openReceipts({ heading: "Campaign Finance Sources", subheading: displayName, sources: moneyData.sources });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show actual press releases — filter out sponsored bill fallbacks
  // which display poorly as "Sponsored legislation" repeated entries
  const pressReleases = (realStatements ?? []).filter(
    (s) => s.sourceType === "Press Release"
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <SideNav activeSection={activeSection} />

      <div className="lg:ml-44">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div style={{ background: "#041534" }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 pb-0">

            {/* Breadcrumb */}
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-200/50">
              {displayChamber} · {displayState}
              {displayDistrict ? ` · District ${displayDistrict}` : ""}
            </p>

            {/* Identity row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Photo */}
                <MemberPhoto
                  bioguideId={member?.bioguideId || ""}
                  name={displayName}
                  size={64}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20"
                  fallbackClassName="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ring-2 ring-white/20"
                  fallbackStyle={{ background: partyColor(displayParty) }}
                />

                <div>
                  <h1 className="font-headline text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
                      style={{ background: partyColor(displayParty) }}
                    >
                      {partyLabel(displayParty)}
                    </span>
                    <span className="text-sm text-blue-100/70">
                      {displayChamber} · {displayState}
                      {displayDistrict ? ` D-${displayDistrict}` : ""}
                    </span>
                    {useMockData && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Sample Data
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  onClick={() => isCompared ? removePolitician(politician.id) : addPolitician(politician)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                    isCompared
                      ? "bg-[#A63744] text-white"
                      : "border border-white/30 text-white/80 hover:border-white hover:text-white"
                  }`}
                >
                  {isCompared ? "✓ Comparing" : "Compare"}
                </button>
                <button
                  onClick={() => member && toggleSavePolitician(member.bioguideId)}
                  className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSaved
                      ? "bg-white/20 text-white"
                      : "border border-white/30 text-white/80 hover:border-white hover:text-white"
                  }`}
                >
                  {isSaved ? "✓ Following" : "Follow"}
                </button>
                {member && (
                  <button
                    onClick={() =>
                      openReceipts({
                        heading:    "Profile Sources",
                        subheading: displayName,
                        sources: [
                          {
                            title:     "Official Profile",
                            publisher: "Congress.gov",
                            url:       `https://www.congress.gov/member/${member.bioguideId}`,
                            excerpt:   `Official profile for ${displayName}.`,
                          },
                        ],
                      })
                    }
                    className="rounded px-3 py-1.5 text-xs font-semibold border border-white/20 text-white/60 hover:border-white/50 hover:text-white/90 transition-all"
                  >
                    Sources
                  </button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
              <div className="py-4 pr-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">
                  Bills Sponsored
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{billsSponsored}</p>
              </div>
              <div className="px-6 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">
                  Votes Recorded
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{votesCount}</p>
              </div>
              <div className="pl-6 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200/40">
                  Top Donor Sector
                </p>
                <p className="mt-1 text-base font-bold text-white leading-tight">{topDonor}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE CONTENT ─────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-10">

          {/* ── FOLLOW THE MONEY ──────────────────────────────────────────── */}
          <section id="follow-money" className="scroll-mt-20">
            <SectionLabel label="Investigation" accent />
            <h2 className="font-headline text-2xl font-bold text-primary mb-1">Follow the Money</h2>
            <p className="text-sm text-on-surface-variant mb-5">
              AI-generated analysis connecting campaign donors to voting patterns
            </p>

            {insightsLoading && <LoadingCard text="Analyzing campaign finance and voting patterns…" />}

            {!insightsLoading && insights && (
              <div className="space-y-4">
                {/* Headline */}
                <div className="rounded-xl p-5 sm:p-6" style={{ background: "#041534" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">🔍</span>
                    <div>
                      <p className="text-lg font-bold text-white leading-snug">
                        {insights.headline}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                        {insights.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connections */}
                {insights.connections.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {insights.connections.map((conn, i) => (
                      <div key={i} className={`rounded-lg border p-4 ${alignmentBg(conn.alignment)}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-primary">{conn.industry}</span>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                            style={{ background: alignmentColor(conn.alignment) }}
                          >
                            {conn.alignment}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-on-surface-variant mb-1.5">{conn.amount}</p>
                        <p className="text-xs leading-relaxed text-on-surface-variant">{conn.votingPattern}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notable facts */}
                {insights.notable.length > 0 && (
                  <div className="rounded-lg border border-surface-container bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-3">
                      Notable
                    </p>
                    <ul className="space-y-2.5">
                      {insights.notable.map((fact, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A63744]" />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] text-outline">
                  AI-generated by Claude · Cross-references OpenFEC + Congress.gov data
                </p>
              </div>
            )}

            {!insightsLoading && !insights && (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
                <p className="text-sm text-outline">
                  {!member
                    ? "AI insights are available for real Congress members."
                    : moneyLoading
                    ? "Loading campaign finance data to generate insights…"
                    : !moneyData && !sponsoredBills?.length && memberVotes.length === 0
                    ? "Insufficient data available to generate insights for this member."
                    : "AI insights unavailable — try refreshing the page."}
                </p>
              </div>
            )}
          </section>

          {/* ── CAMPAIGN FINANCE ─────────────────────────────────────────── */}
          <section id="finance" className="scroll-mt-20">
            <div className="flex items-start justify-between mb-5">
              <div>
                <SectionLabel label="Transparency" />
                <h2 className="font-headline text-2xl font-bold text-primary">Where the Money Comes From</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">Federal Election Commission campaign finance data</p>
              </div>
              {moneyData && (
                <button
                  onClick={() =>
                    openReceipts({
                      heading:    "Campaign Finance Sources",
                      subheading: displayName,
                      sources:    moneyData.sources,
                    })
                  }
                  className="shrink-0 text-xs font-medium text-outline hover:text-on-surface underline underline-offset-2 mt-1"
                >
                  Sources
                </button>
              )}
            </div>

            {moneyLoading && <LoadingCard text="Loading campaign finance data…" />}
            {moneyError && !moneyLoading && !moneyData && (
              <AlertCard text="Campaign finance data unavailable — FEC API may be rate-limited. Try refreshing." />
            )}
            {!fecCandidateId && !moneyData && !moneyLoading && !moneyError && (
              <AlertCard text="FEC candidate ID not yet linked for this member." variant="info" />
            )}

            {moneyData && (
              <div className="space-y-4">
                {/* Totals */}
                <div className="grid grid-cols-3 rounded-xl border border-surface-container bg-white shadow-sm divide-x divide-surface-container overflow-hidden">
                  {[
                    { label: "Total Raised",  value: formatMoney(moneyData.totals.raised) },
                    { label: "Total Spent",    value: formatMoney(moneyData.totals.spent) },
                    { label: "Cash on Hand",   value: formatMoney(moneyData.totals.cashOnHand) },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 sm:p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-outline">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 text-2xl font-bold text-primary sm:text-3xl">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Top Contributors */}
                  <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
                      Top Contributors
                    </p>
                    {moneyData.topContributors.length > 0 ? (
                      <ul className="space-y-2.5">
                        {moneyData.topContributors.slice(0, 8).map((c, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-on-surface min-w-0">
                              <span className="shrink-0 w-5 text-center text-xs font-bold text-outline-variant">
                                {i + 1}
                              </span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className="ml-3 shrink-0 text-sm font-bold text-primary">
                              {c.amount}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-outline">
                        Detailed contributor data not available via FEC API.
                      </p>
                    )}
                  </div>

                  {/* Industry Breakdown */}
                  <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
                      Industry Breakdown
                    </p>
                    {moneyData.industryBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        {moneyData.industryBreakdown.slice(0, 6).map((ind, i) => {
                          const pct = Math.min(ind.percentage, 100);
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-on-surface">{ind.industry}</span>
                                <span className="text-sm font-bold text-primary">{pct}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width:      `${pct}%`,
                                    background: i === 0 ? "#A63744" : "#041534",
                                    opacity:    Math.max(0.3, 1 - i * 0.14),
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-outline">
                        Industry breakdown not available via FEC API.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mock fallback when no real data */}
            {!moneyData && !moneyLoading && !moneyError && fecCandidateId && (
              <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                <p className="text-sm text-on-surface-variant mb-4">{politician.money.moduleSummary}</p>
                <ul className="space-y-2">
                  {politician.money.topContributors.slice(0, 5).map((c, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-on-surface">{c.name}</span>
                      <span className="font-bold text-primary">{c.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ── HOW THEY VOTE ─────────────────────────────────────────────── */}
          <section id="votes" className="scroll-mt-20">
            <div className="flex items-start justify-between mb-5">
              <div>
                <SectionLabel label="Accountability" />
                <h2 className="font-headline text-2xl font-bold text-primary">How They Vote</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">Party loyalty and voting patterns in the 119th Congress</p>
              </div>
              {memberVotes.length > 0 && (
                <button
                  onClick={() =>
                    openReceipts({
                      heading:    "Vote Record Sources",
                      subheading: displayName,
                      sources:    memberVotes.flatMap((v) => v.sources),
                    })
                  }
                  className="shrink-0 text-xs font-medium text-outline hover:text-on-surface underline underline-offset-2 mt-1"
                >
                  Sources
                </button>
              )}
            </div>

            {memberVotes.length > 0 ? (
              <div className="space-y-4">
                <HowTheyVote votes={memberVotes} party={displayParty} />

                {/* Recent votes table */}
                <div className="rounded-xl border border-surface-container bg-white shadow-sm overflow-hidden">
                  <p className="px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-outline">
                    Recent Votes
                  </p>
                  {/* Mobile: card list */}
                  <div className="sm:hidden divide-y divide-surface-container-low">
                    {memberVotes.slice(0, 10).map((vote, i) => (
                      <div key={i} className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface line-clamp-2">{vote.description}</p>
                          <p className="mt-0.5 text-xs text-outline">{vote.date}</p>
                        </div>
                        <VoteBadge position={vote.position} />
                      </div>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <table className="hidden sm:table w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-container bg-surface-container-low/50">
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-outline">
                          Bill / Description
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-outline">
                          Topic
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-outline">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-outline">
                          Vote
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                      {memberVotes.slice(0, 10).map((vote, i) => (
                        <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-4 py-3 text-on-surface max-w-xs">
                            <span className="line-clamp-2">{vote.description}</span>
                          </td>
                          <td className="px-4 py-3">
                            {vote.topic && (
                              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
                                {vote.topic}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-outline whitespace-nowrap">{vote.date}</td>
                          <td className="px-4 py-3 text-right">
                            <VoteBadge position={vote.position} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : member && !useMockData ? (
              <EmptyCard text="No roll-call votes found in the current dataset for this member." />
            ) : (
              <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                <p className="text-sm text-on-surface-variant mb-4">{politician.votes.moduleSummary}</p>
                <div className="divide-y divide-surface-container-low">
                  {politician.votes.votes.slice(0, 6).map((vote, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-on-surface flex-1 mr-4 line-clamp-1">
                        {vote.description}
                      </span>
                      <VoteBadge position={vote.position} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── LEGISLATION ──────────────────────────────────────────────── */}
          <section id="legislation" className="scroll-mt-20">
            <SectionLabel label="Legislative Activity" />
            <h2 className="font-headline text-2xl font-bold text-primary mb-1">Bills & Cosponsorship</h2>
            <p className="text-sm text-on-surface-variant mb-5">
              Legislation sponsored and cosponsored in the 119th Congress
            </p>

            {(sponsoredBills?.length || cosponsoredBills?.length) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {sponsoredBills && sponsoredBills.length > 0 && (
                  <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
                      Sponsored Bills ({sponsoredBills.length})
                    </p>
                    <div className="space-y-3">
                      {sponsoredBills.map((bill, i) => (
                        <div key={i} className="border-b border-surface-container-low pb-3 last:border-0 last:pb-0">
                          <Link
                            href={`/bill/${bill.id}`}
                            className="text-sm font-medium text-[#041534] hover:text-[#1B2A4A] hover:underline leading-snug block"
                          >
                            {bill.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-outline">
                            {bill.type} {bill.number}
                            {bill.latestAction && ` · ${bill.latestAction}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cosponsoredBills && cosponsoredBills.length > 0 && (
                  <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
                      Cosponsored Bills ({cosponsoredBills.length})
                    </p>
                    <div className="space-y-3">
                      {cosponsoredBills.map((bill, i) => (
                        <div key={i} className="border-b border-surface-container-low pb-3 last:border-0 last:pb-0">
                          <Link
                            href={`/bill/${bill.id}`}
                            className="text-sm font-medium text-[#041534] hover:text-[#1B2A4A] hover:underline leading-snug block"
                          >
                            {bill.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-outline">
                            {bill.type} {bill.number}
                            {bill.latestAction && ` · ${bill.latestAction}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyCard text={`${displayName} has not sponsored or cosponsored any bills in the current (119th) Congress session.`} />
            )}
          </section>

          {/* ── STATEMENTS ────────────────────────────────────────────────── */}
          <section id="statements" className="scroll-mt-20">
            <div className="flex items-start justify-between mb-5">
              <div>
                <SectionLabel label="Public Record" />
                <h2 className="font-headline text-2xl font-bold text-primary">Statements & Press Releases</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">Official statements from the member&apos;s office</p>
              </div>
              {pressReleases.length > 0 && (
                <button
                  onClick={() =>
                    openReceipts({
                      heading:    "Statement Sources",
                      subheading: displayName,
                      sources:    pressReleases.flatMap((s) => s.sources),
                    })
                  }
                  className="shrink-0 text-xs font-medium text-outline hover:text-on-surface underline underline-offset-2 mt-1"
                >
                  Sources
                </button>
              )}
            </div>

            {statementsLoading && <LoadingCard text="Loading statements…" />}

            {!statementsLoading && pressReleases.length > 0 && (
              <div className="rounded-xl border border-surface-container bg-white shadow-sm divide-y divide-surface-container-low">
                {pressReleases.slice(0, 6).map((stmt, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary leading-snug">{stmt.title}</p>
                        {stmt.text && (
                          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant line-clamp-2">{stmt.text}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {stmt.topic && (
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant block mb-1">
                            {stmt.topic}
                          </span>
                        )}
                        <p className="text-xs text-outline">{stmt.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!statementsLoading && pressReleases.length === 0 && (
              <EmptyCard text="No public press releases available for this member. RSS feeds from their official website were not accessible." />
            )}
          </section>

          {/* Footer */}
          <div className="border-t border-surface-container pt-6 pb-10">
            <p className="text-xs text-outline leading-relaxed">
              Data from{" "}
              <a href="https://congress.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-on-surface-variant">Congress.gov</a>
              {" "}(119th Congress) and the{" "}
              <a href="https://www.fec.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-on-surface-variant">Federal Election Commission</a>.
              AI insights by Claude (Anthropic). All data is public record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusable components ───────────────────────────────────────────────

function SectionLabel({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-1"
      style={{ color: accent ? "#A63744" : "#75777F" }}
    >
      {label}
    </p>
  );
}

function VoteBadge({ position }: { position: string }) {
  if (position === "Yes") {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">Yes</span>
    );
  }
  if (position === "No") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">No</span>
    );
  }
  return (
    <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
      {position || "Abstain"}
    </span>
  );
}

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-surface-container bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-outline">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-outline" />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  );
}

function AlertCard({ text, variant = "warn" }: { text: string; variant?: "warn" | "info" }) {
  const cls =
    variant === "info"
      ? "border-blue-100 bg-blue-50 text-blue-700"
      : "border-amber-100 bg-amber-50 text-amber-700";
  return <div className={`rounded-xl border p-4 text-sm ${cls}`}>{text}</div>;
}

function HowTheyVote({ votes, party }: { votes: Vote[]; party: string }) {
  // Compute party loyalty — % of votes matching party majority
  const votesWithPartyData = votes.filter((v) => v.partyMajorityPosition && v.position !== "Abstain");
  const loyalVotes = votesWithPartyData.filter((v) => v.position === v.partyMajorityPosition);
  const loyaltyPct = votesWithPartyData.length > 0
    ? Math.round((loyalVotes.length / votesWithPartyData.length) * 100)
    : null;

  // Compute topic breakdown — Yes/No counts per topic
  const topicMap = new Map<string, { yes: number; no: number; abstain: number; total: number }>();
  for (const v of votes) {
    const topic = v.topic || "Other";
    const entry = topicMap.get(topic) || { yes: 0, no: 0, abstain: 0, total: 0 };
    entry.total++;
    if (v.position === "Yes") entry.yes++;
    else if (v.position === "No") entry.no++;
    else entry.abstain++;
    topicMap.set(topic, entry);
  }
  const topicBreakdown = Array.from(topicMap.entries())
    .filter(([t]) => t !== "Other")
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  const loyaltyColor = loyaltyPct === null ? "#75777F"
    : loyaltyPct >= 90 ? "#A63744"
    : loyaltyPct >= 70 ? "#D97706"
    : "#1B6B3A";

  const loyaltyLabel = loyaltyPct === null ? "Insufficient data"
    : loyaltyPct >= 90 ? "Strong party loyalist"
    : loyaltyPct >= 70 ? "Moderate party loyalist"
    : loyaltyPct >= 50 ? "Independent-leaning"
    : "Frequent party dissenter";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Party Loyalty */}
      <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
          Party Loyalty
        </p>
        {loyaltyPct !== null ? (
          <div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold" style={{ color: loyaltyColor }}>
                {loyaltyPct}%
              </span>
              <span className="text-sm text-on-surface-variant pb-1">
                votes with {partyLabel(party)} majority
              </span>
            </div>
            {/* Gauge bar */}
            <div className="relative h-2.5 w-full rounded-full bg-surface-container overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${loyaltyPct}%`, background: loyaltyColor }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: loyaltyColor }}
              >
                {loyaltyLabel}
              </span>
              <span className="text-[10px] text-outline">
                {votesWithPartyData.length} votes analyzed
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-outline">
            Party majority data not yet available for these votes.
          </p>
        )}
      </div>

      {/* Voting by Topic */}
      <div className="rounded-xl border border-surface-container bg-white p-5 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-4">
          Votes by Topic
        </p>
        {topicBreakdown.length > 0 ? (
          <div className="space-y-3">
            {topicBreakdown.map(([topic, data]) => {
              const yesPct = Math.round((data.yes / data.total) * 100);
              const noPct = Math.round((data.no / data.total) * 100);
              return (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-on-surface">{topic}</span>
                    <span className="text-xs text-outline">{data.total} vote{data.total !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    {yesPct > 0 && (
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${yesPct}%` }}
                        title={`${yesPct}% Yes`}
                      />
                    )}
                    {noPct > 0 && (
                      <div
                        className="h-full bg-red-400 transition-all duration-500"
                        style={{ width: `${noPct}%` }}
                        title={`${noPct}% No`}
                      />
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-outline">
                    <span>{yesPct}% Yea</span>
                    <span>{noPct}% Nay</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-outline">
            Topic breakdown requires votes on categorizable legislation.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center">
      <p className="text-sm text-outline">{text}</p>
    </div>
  );
}
