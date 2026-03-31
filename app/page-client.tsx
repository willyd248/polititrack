"use client";

import { useState } from "react";
import Link from "next/link";
import { MemberPhoto } from "./components/MemberPhoto";
import { Politician } from "../data/politicians";
import { Member } from "../data/types-members";
import { Bill } from "../data/bills";
import { useCompare } from "./store/compare-store";
import { useSaved } from "./store/saved-store";
import { memberToPolitician } from "../lib/mappers/memberToPolitician";
import { lookupDistrictByZip, DistrictInfo } from "../lib/districtLookup";
import { stateNameToCode } from "../lib/stateConverter";

interface HomeProps {
  bills: Bill[];
  useMockData?: boolean;
  members: Member[] | null;
  useMockMembers?: boolean;
  mockPoliticians: Politician[];
  showDataUnavailableIndicator?: boolean;
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

function billStatusStyle(status: string): string {
  if (status === "Passed") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Failed") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export default function HomeClient({
  bills,
  useMockData = false,
  members,
  useMockMembers = true,
  mockPoliticians,
  showDataUnavailableIndicator = false,
}: HomeProps) {
  const [zipCode, setZipCode]                     = useState("");
  const [districtInfo, setDistrictInfo]           = useState<DistrictInfo | null>(null);
  const [districtMembers, setDistrictMembers]     = useState<Member[]>([]);
  const [zipError, setZipError]                   = useState(false);
  const [newsletterEmail, setNewsletterEmail]     = useState("");
  const [newsletterStatus, setNewsletterStatus]   = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const { addPolitician, removePolitician, isSelected } = useCompare();
  const { savedPoliticians, savedBills, isPoliticianSaved } = useSaved();

  const displayMembers     = members || [];
  const displayPoliticians = useMockMembers ? mockPoliticians : displayMembers.map(memberToPolitician);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: newsletterEmail }),
      });
      setNewsletterStatus(res.ok ? "success" : "error");
      if (res.ok) setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
    }
  };

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setZipError(false);
    const lookup = lookupDistrictByZip(zipCode);
    if (!lookup) {
      setDistrictInfo(null);
      setDistrictMembers([]);
      setZipError(true);
      return;
    }
    setDistrictInfo(lookup);
    if (displayMembers.length > 0) {
      const filtered: Member[] = [];
      if (lookup.district) {
        const rep = displayMembers.find(
          (m) =>
            m.chamber === "House" && m.state === lookup.state && m.district === lookup.district
        );
        if (rep) filtered.push(rep);
      }
      filtered.push(
        ...displayMembers.filter((m) => m.chamber === "Senate" && m.state === lookup.state)
      );
      setDistrictMembers(filtered);
    }
  };

  return (
    <div>
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div style={{ background: "#041534" }} className="px-4 py-12 sm:py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/50 mb-4">
            119th Congress · Nonpartisan · Source-cited
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
            What are your representatives<br className="hidden sm:block" /> doing right now?
          </h1>
          <p className="text-base sm:text-lg text-blue-100/70 max-w-2xl mb-8 leading-relaxed">
            See how your reps vote, who funds their campaigns, and connect the dots between money and legislation.
            Investigative-quality transparency, built for citizens.
          </p>

          {/* ZIP Search */}
          <form onSubmit={handleZipSubmit} className="flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Enter your ZIP code"
              value={zipCode}
              onChange={(e) => { setZipCode(e.target.value); setZipError(false); }}
              maxLength={5}
              pattern="[0-9]{5}"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-blue-200/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#A63744] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8B2332] transition-colors"
            >
              Find My Reps
            </button>
          </form>

          {zipError && (
            <p className="mt-3 text-sm text-amber-300">
              ZIP code not found. Try a different ZIP or browse all representatives below.
            </p>
          )}

          {/* ZIP Results */}
          {districtInfo && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/40 mb-3">
                Your Representatives ·{" "}
                {districtInfo.district
                  ? `${districtInfo.state} District ${districtInfo.district}`
                  : `${districtInfo.state} (At-Large)`}
              </p>
              {districtMembers.length === 0 ? (
                <p className="text-sm text-blue-100/60">
                  No representatives found in current dataset for this ZIP.
                </p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  {districtMembers.map((m) => {
                    const party = m.party ?? "";
                    return (
                      <Link
                        key={m.id}
                        href={`/politician/${m.bioguideId}`}
                        className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 hover:bg-white/15 transition-all flex-1"
                      >
                        <MemberPhoto
                          bioguideId={m.bioguideId}
                          name={m.fullName || "?"}
                          size={40}
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                          fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          fallbackStyle={{ background: partyColor(party) }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{m.fullName}</p>
                          <p className="text-xs text-blue-100/60">
                            {m.chamber} · {partyLabel(party)} · {stateNameToCode(m.state || "")}
                          </p>
                        </div>
                        <span className="ml-auto text-blue-100/40 text-sm">→</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── PAGE CONTENT ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12">

        {/* ── FOLLOWING ─────────────────────────────────────────────────── */}
        {(savedPoliticians.length > 0 || savedBills.length > 0) && (
          <section>
            <SectionHeader label="Your Feed" title="Following" />
            <div className="flex flex-wrap gap-2">
              {savedPoliticians.map((id) => {
                // Search all members (not just displayed 12), then mock politicians
                const memberMatch = displayMembers.find((m) => m.bioguideId === id);
                const polMatch =
                  displayPoliticians.find((p) => p.id === id) ||
                  mockPoliticians.find((p) => p.id === id);
                const name = memberMatch?.fullName || polMatch?.name || id;
                return (
                  <Link
                    key={id}
                    href={`/politician/${id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#041534]" />
                    {name}
                  </Link>
                );
              })}
              {savedBills.map((id) => {
                const bill = bills.find((b) => b.id === id);
                if (!bill) return null;
                return (
                  <Link
                    key={id}
                    href={`/bill/${id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#A63744]" />
                    {bill.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── TRENDING BILLS ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <SectionHeader label="Legislation" title="Trending Bills" />
              <p className="text-sm text-gray-500 -mt-3">
                Bills with recent action in the 119th Congress
              </p>
            </div>
            {(useMockData || showDataUnavailableIndicator) && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shrink-0 mt-1">
                {showDataUnavailableIndicator ? "Data unavailable" : "Sample data"}
              </span>
            )}
          </div>

          {bills.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {bills.slice(0, 6).map((bill) => (
                <Link
                  key={bill.id}
                  href={`/bill/${bill.id}`}
                  className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all block"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-[#041534] transition-colors flex-1">
                      {bill.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${billStatusStyle(bill.status)}`}
                    >
                      {bill.status}
                    </span>
                  </div>
                  {bill.summary[0] && (
                    <p className="text-xs leading-relaxed text-gray-500 mb-3 line-clamp-2">
                      {bill.summary[0]}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    <span>{bill.timeline.length} events</span>
                    {bill.timeline.length > 0 && (
                      <span>
                        Updated {bill.timeline[bill.timeline.length - 1]?.date || "N/A"}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No bills available at this time.</p>
            </div>
          )}
        </section>

        {/* ── REPRESENTATIVES ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-start justify-between mb-5">
            <div>
              <SectionHeader label="119th Congress" title="Members" />
              <p className="text-sm text-gray-500 -mt-3">
                Browse representatives and senators
              </p>
            </div>
            {useMockMembers && !showDataUnavailableIndicator && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shrink-0 mt-1">
                Sample data
              </span>
            )}
          </div>

          {displayMembers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayMembers.slice(0, 12).map((m) => {
                const pol    = memberToPolitician(m);
                const party  = m.party ?? "";
                const compared = isSelected(pol.id);
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <MemberPhoto
                        bioguideId={m.bioguideId}
                        name={m.fullName || "?"}
                        size={40}
                        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                        fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        fallbackStyle={{ background: partyColor(party) }}
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/politician/${m.bioguideId}`}
                          className="block text-sm font-semibold text-gray-900 hover:text-[#041534] truncate"
                        >
                          {m.fullName || "Unknown"}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.chamber} · {stateNameToCode(m.state || "")}
                          {m.district ? ` D-${m.district}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: partyColor(party) }}
                      >
                        {partyLabel(party)}
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => (compared ? removePolitician(pol.id) : addPolitician(pol))}
                        className={`rounded px-2 py-1 text-[10px] font-semibold transition-all ${
                          compared
                            ? "bg-[#A63744] text-white"
                            : "border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                        }`}
                      >
                        {compared ? "✓" : "Compare"}
                      </button>
                      <Link
                        href={`/politician/${m.bioguideId}`}
                        className="rounded px-2 py-1 text-[10px] font-semibold border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">No members available. Check back soon.</p>
            </div>
          )}
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section>
          <SectionHeader label="About" title="How PolitiTrack Works" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon:  "🔍",
                title: "Follow the Money",
                body:  "We cross-reference FEC campaign finance filings with voting records to connect donor money to legislative outcomes.",
              },
              {
                icon:  "📊",
                title: "Real Data, Real Sources",
                body:  "Every fact is source-cited. Congress.gov voting records, FEC filings, and official press releases — all public record.",
              },
              {
                icon:  "🤖",
                title: "AI-Powered Insights",
                body:  "Claude AI analyzes donor patterns and voting behavior to surface plain-English summaries citizens can actually understand.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEWSLETTER ─────────────────────────────────────────────────── */}
        <section className="rounded-xl p-8 sm:p-10" style={{ background: "#041534" }}>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/50 mb-3">
            Stay Informed
          </p>
          <h2 className="text-2xl font-bold text-white mb-2">Weekly transparency briefing</h2>
          <p className="text-sm text-blue-100/70 mb-6 max-w-lg leading-relaxed">
            Get a weekly breakdown of the votes that matter, who funded them, and what it means for
            you. No spin. No ads.
          </p>
          {newsletterStatus === "success" ? (
            <p className="text-sm font-medium text-green-300">
              You&apos;re in — we&apos;ll be in touch.
            </p>
          ) : (
            <>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={newsletterStatus === "loading"}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:border-white/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="rounded-lg bg-[#A63744] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8B2332] transition-colors disabled:opacity-50"
                >
                  {newsletterStatus === "loading" ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
              {newsletterStatus === "error" && (
                <p className="mt-2 text-xs text-red-300">Something went wrong. Please try again.</p>
              )}
            </>
          )}
        </section>

        <div className="pb-4" />
      </div>
    </div>
  );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}
