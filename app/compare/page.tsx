"use client";

import { useCompare } from "../store/compare-store";
import Link from "next/link";
import Button from "../components/ui/Button";

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();

  if (selected.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="h-16 w-16 mb-6"
          style={{ color: "#C5C6CF" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h1 className="font-headline text-2xl font-bold text-[#041534] mb-2">
          Compare Politicians
        </h1>
        <p className="text-sm text-[#75777F] max-w-md mb-6">
          {selected.length === 0
            ? "Select two politicians to compare them side-by-side. Use the Compare button on any politician card from the homepage."
            : "You've selected 1 politician. Pick one more to start comparing."}
        </p>
        <Link href="/">
          <Button variant="primary" size="md">Browse Politicians</Button>
        </Link>
      </div>
    );
  }

  const [politician1, politician2] = selected;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-[#041534]">
            Compare Politicians
          </h1>
          <p className="mt-1 text-sm text-[#75777F]">
            Side-by-side comparison of key metrics and positions
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          Clear
        </Button>
      </div>

      {/* Comparison Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {[politician1, politician2].map((politician) => (
          <div key={politician.id} className="card p-6 space-y-6">
            {/* Identity */}
            <div className="card-header">
              <h2 className="font-headline text-xl font-bold text-[#041534]">
                {politician.name || "Unknown Member"}
              </h2>
              <p className="mt-1 text-sm text-[#75777F]">
                {politician.role || "Member of Congress"}
                {politician.state && ` · ${politician.state}`}
                {politician.district && ` · District ${politician.district}`}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="vintage-stat-box">
                <p className="vintage-label">Donor Category</p>
                <p className="mt-1 text-sm font-semibold text-[#191C1D] leading-tight">
                  {politician.metrics.topDonorCategory}
                </p>
              </div>
              <div className="vintage-stat-box">
                <p className="vintage-label">Votes</p>
                <p className="vintage-value text-xl">{politician.metrics.votesThisYear}</p>
              </div>
              <div className="vintage-stat-box">
                <p className="vintage-label">Bills</p>
                <p className="vintage-value text-xl">{politician.metrics.billsSponsored}</p>
              </div>
            </div>

            {/* Module Summaries */}
            <div className="space-y-3 border-t border-[#C5C6CF] pt-4">
              {[
                { label: "Money", summary: politician.money.moduleSummary },
                { label: "Votes", summary: politician.votes.moduleSummary },
                { label: "Statements", summary: politician.statements.moduleSummary },
              ].map(({ label, summary }) => (
                <div key={label}>
                  <p className="stat-label mb-1">{label}</p>
                  <p className="text-sm text-[#191C1D]/80">{summary}</p>
                </div>
              ))}
            </div>

            <Link href={`/politician/${politician.id}`}>
              <Button variant="secondary" size="sm" className="w-full">
                View Full Profile
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
