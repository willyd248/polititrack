"use client";

import { useCompare } from "../store/compare-store";
import Link from "next/link";

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

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();

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
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: partyColor(selected[0].role || "") }}
              >
                {initials(selected[0].name || "?")}
              </div>
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

        {/* ── Identity Cards ────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[p1, p2].map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: partyColor(p.role || "") }}
                >
                  {initials(p.name || "?")}
                </div>
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
                  { label: "Bills",     value: p.metrics.billsSponsored, small: false },
                  { label: "Votes",     value: p.metrics.votesThisYear,  small: false },
                  { label: "Top Donor", value: p.metrics.topDonorCategory, small: true },
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
              left:   p1.metrics.topDonorCategory,
              right:  p2.metrics.topDonorCategory,
            },
            {
              aspect: "Finance Overview",
              left:   p1.money.moduleSummary,
              right:  p2.money.moduleSummary,
            },
          ]}
        />

        {/* ── Voting ────────────────────────────────────────────────────────── */}
        <CompareSection
          title="Voting Record"
          label="Legislative Behavior"
          rows={[
            {
              aspect: "Votes This Session",
              left:   String(p1.metrics.votesThisYear),
              right:  String(p2.metrics.votesThisYear),
            },
            {
              aspect: "Voting Summary",
              left:   p1.votes.moduleSummary,
              right:  p2.votes.moduleSummary,
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
              left:   String(p1.metrics.billsSponsored),
              right:  String(p2.metrics.billsSponsored),
            },
          ]}
        />

        {/* ── Statements ────────────────────────────────────────────────────── */}
        <CompareSection
          title="Public Statements"
          label="Stated Positions"
          rows={[
            {
              aspect: "Overview",
              left:   p1.statements.moduleSummary,
              right:  p2.statements.moduleSummary,
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
