"use client";

import { useEffect, useState } from "react";
import { useCompare } from "../store/compare-store";
import Link from "next/link";
import { MemberPhoto } from "../components/MemberPhoto";

function partyColor(role: string): string {
  if (role === "D") return "#1B2A4A";
  if (role === "R") return "#8B2332";
  return "#75777F";
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface RealStats {
  billsSponsored: number;
  votesThisYear: number;
  topDonorCategory: string | null;
  raised: number | null;
  spent: number | null;
}

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();
  const [stats, setStats] = useState<Record<string, RealStats>>({});
  const [loading, setLoading] = useState(false);

  // Fetch real stats for each selected politician
  useEffect(() => {
    if (selected.length < 2) return;

    const idsToFetch = selected
      .filter((p) => /^[A-Z]\d{6}$/i.test(p.id))
      .filter((p) => !stats[p.id]);

    if (idsToFetch.length === 0) return;

    setLoading(true);
    Promise.all(
      idsToFetch.map((p) =>
        fetch(`/api/politician/stats?bioguideId=${encodeURIComponent(p.id)}`)
          .then((r) => r.json())
          .then((data) => ({ id: p.id, data }))
          .catch(() => ({ id: p.id, data: null }))
      )
    ).then((results) => {
      const newStats: Record<string, RealStats> = { ...stats };
      for (const { id, data } of results) {
        if (data && !data.error) {
          newStats[id] = {
            billsSponsored: data.billsSponsored ?? 0,
            votesThisYear: data.votesThisYear ?? 0,
            topDonorCategory: data.topDonorCategory ?? null,
            raised: data.raised ?? null,
            spent: data.spent ?? null,
          };
        }
      }
      setStats(newStats);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.length]);

  // ── Empty / partial state ──────────────────────────────────────────────────
  if (selected.length < 2) {
    return (
      <div style={{ background: "#041534" }} className="min-h-[calc(100vh-4rem)]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/40 mb-6">
            Transparency Tool
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Understand Your Representation
          </h1>
          <p className="text-base text-blue-100/70 max-w-lg mb-8 leading-relaxed">
            {selected.length === 0
              ? "Select two representatives to compare their campaign finance, voting records, and legislative activity side by side."
              : "You've selected 1 representative. Pick one more to start the comparison."}
          </p>

          {selected.length === 1 && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-4">
              <MemberPhoto
                bioguideId={selected[0].id}
                name={selected[0].name || "?"}
                size={40}
                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                fallbackStyle={{ background: partyColor(selected[0].role || "") }}
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{selected[0].name}</p>
                <p className="text-xs text-blue-100/60">
                  {selected[0].role} · {selected[0].state}
                </p>
              </div>
              <span className="ml-auto text-blue-200/40 text-sm">Selected</span>
            </div>
          )}

          <Link
            href="/"
            className="rounded-lg bg-[#A63744] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8B2332] transition-colors"
          >
            Browse Representatives
          </Link>

          <p className="mt-6 text-xs text-blue-200/30">
            Tip: Use the &ldquo;Compare&rdquo; button on any member card to add them here.
          </p>
        </div>
      </div>
    );
  }

  const [p1, p2] = selected;

  const getStats = (id: string): RealStats | null => stats[id] ?? null;
  const s1 = getStats(p1.id);
  const s2 = getStats(p2.id);

  const billsLeft = s1 ? String(s1.billsSponsored) : String(p1.metrics.billsSponsored);
  const billsRight = s2 ? String(s2.billsSponsored) : String(p2.metrics.billsSponsored);
  const votesLeft = s1 ? String(s1.votesThisYear) : String(p1.metrics.votesThisYear);
  const votesRight = s2 ? String(s2.votesThisYear) : String(p2.metrics.votesThisYear);
  const donorLeft = s1?.topDonorCategory || p1.metrics.topDonorCategory;
  const donorRight = s2?.topDonorCategory || p2.metrics.topDonorCategory;
  const raisedLeft = s1?.raised != null ? formatMoney(s1.raised) : null;
  const raisedRight = s2?.raised != null ? formatMoney(s2.raised) : null;
  const spentLeft = s1?.spent != null ? formatMoney(s1.spent) : null;
  const spentRight = s2?.spent != null ? formatMoney(s2.spent) : null;

  // ── Comparison view ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ background: "#041534" }} className="px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/40 mb-3">
            Side-by-Side · Understanding Your Representation
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {p1.name} vs. {p2.name}
            </h1>
            <button
              onClick={clearCompare}
              className="rounded px-3 py-1.5 text-xs font-semibold border border-white/20 text-white/60 hover:border-white/40 hover:text-white/90 transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">

        {loading && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
              <span className="text-sm">Loading real-time data from Congress.gov and FEC…</span>
            </div>
          </div>
        )}

        {/* ── Identity Cards ────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { p: p1, s: s1 },
            { p: p2, s: s2 },
          ].map(({ p, s }) => (
            <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MemberPhoto
                  bioguideId={p.id}
                  name={p.name || "?"}
                  size={48}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full"
                  fallbackClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  fallbackStyle={{ background: partyColor(p.role || "") }}
                />
                <div>
                  <h2 className="text-base font-bold text-gray-900">{p.name || "Unknown"}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.role} · {p.state}
                    {p.district ? ` · D-${p.district}` : ""}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Bills", value: s ? String(s.billsSponsored) : String(p.metrics.billsSponsored), small: false },
                  { label: "Votes", value: s ? String(s.votesThisYear) : String(p.metrics.votesThisYear), small: false },
                  { label: "Top Donor", value: s?.topDonorCategory || p.metrics.topDonorCategory, small: true },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
                      {stat.label}
                    </p>
                    <p
                      className={`font-bold text-gray-900 leading-tight ${
                        stat.small ? "text-xs" : "text-xl"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={`/politician/${p.id}`}
                className="block w-full rounded-lg border border-gray-200 py-2 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                View Full Profile →
              </Link>
            </div>
          ))}
        </div>

        {/* ── Money ─────────────────────────────────────────────────────────── */}
        <CompareSection
          title="Campaign Finance"
          label="Where the Money Comes From"
          rows={[
            {
              aspect: "Top Donor Sector",
              left: donorLeft,
              right: donorRight,
            },
            ...(raisedLeft || raisedRight
              ? [
                  {
                    aspect: "Total Raised",
                    left: raisedLeft || "N/A",
                    right: raisedRight || "N/A",
                  },
                  {
                    aspect: "Total Spent",
                    left: spentLeft || "N/A",
                    right: spentRight || "N/A",
                  },
                ]
              : [
                  {
                    aspect: "Finance Overview",
                    left: p1.money.moduleSummary,
                    right: p2.money.moduleSummary,
                  },
                ]),
          ]}
        />

        {/* ── Voting ────────────────────────────────────────────────────────── */}
        <CompareSection
          title="Voting Record"
          label="Legislative Behavior"
          rows={[
            {
              aspect: "Votes This Session",
              left: votesLeft,
              right: votesRight,
            },
          ]}
        />

        {/* ── Legislation ───────────────────────────────────────────────────── */}
        <CompareSection
          title="Legislative Activity"
          label="Bills & Sponsorship"
          rows={[
            {
              aspect: "Bills Sponsored",
              left: billsLeft,
              right: billsRight,
            },
          ]}
        />

        {/* CTA */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            For deeper analysis
          </p>
          <p className="text-sm text-gray-600 mb-4">
            View individual profiles to see the AI-generated &ldquo;Follow the Money&rdquo;
            analysis connecting donor industries to voting patterns.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/politician/${p1.id}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              {p1.name.split(" ").slice(-1)[0]}&apos;s Profile
            </Link>
            <Link
              href={`/politician/${p2.id}`}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              {p2.name.split(" ").slice(-1)[0]}&apos;s Profile
            </Link>
          </div>
        </div>

        <div className="pb-4" />
      </div>
    </div>
  );
}

// ─── Compare Section component ────────────────────────────────────────────────

function CompareSection({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: Array<{ aspect: string; left: string; right: string }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {rows.map((row, i) => {
          const same = row.left === row.right;
          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_auto_1fr] gap-4 px-4 py-4 items-start ${
                i > 0 ? "border-t border-gray-50" : ""
              }`}
            >
              <p className="text-sm text-gray-700">{row.left}</p>
              <div className="flex flex-col items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                  {row.aspect}
                </span>
                <div
                  className={`h-2 w-2 rounded-full ${same ? "bg-gray-300" : "bg-amber-400"}`}
                  title={same ? "Same" : "Differs"}
                />
              </div>
              <p className="text-sm text-gray-700 text-right">{row.right}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
