"use client";

import { useEffect, useState } from "react";
import { useCompare } from "../store/compare-store";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Link from "next/link";

interface PoliticianStats {
  bioguideId: string;
  billsSponsored: number;
  votesThisYear: number;
  topDonorCategory: string | null;
  raised: number | null;
  spent: number | null;
  chamber: string | null;
  party: string | null;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function usePoliticianStats(bioguideId: string | null) {
  const [stats, setStats] = useState<PoliticianStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bioguideId || !/^[A-Z]\d{6}$/i.test(bioguideId)) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/politician/stats?bioguideId=${encodeURIComponent(bioguideId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {/* silently ignore */})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bioguideId]);

  return { stats, loading };
}

function PoliticianCard({
  politician,
  stats,
  loading,
}: {
  politician: ReturnType<typeof useCompare>["selected"][0];
  stats: PoliticianStats | null;
  loading: boolean;
}) {
  const isMock = !/^[A-Z]\d{6}$/i.test(politician.id);

  const billsSponsored = stats?.billsSponsored ?? (isMock ? politician.metrics.billsSponsored : null);
  const votesThisYear = stats?.votesThisYear ?? (isMock ? politician.metrics.votesThisYear : null);
  const topDonorCategory =
    stats?.topDonorCategory ??
    (isMock ? politician.metrics.topDonorCategory : null);
  const raised = stats?.raised ?? null;
  const spent = stats?.spent ?? null;

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {politician.name || "Unknown Member"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {stats?.chamber
              ? stats.chamber === "House"
                ? "U.S. Representative"
                : "U.S. Senator"
              : politician.role || "Member of Congress"}{" "}
            • {politician.state || "Unknown"}
            {politician.district && ` • District ${politician.district}`}
          </p>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
              Top Donor Category
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {loading
                ? "Loading…"
                : topDonorCategory ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
              Votes This Year
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {loading ? "Loading…" : votesThisYear !== null ? votesThisYear : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
              Bills Sponsored (119th Congress)
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {loading ? "Loading…" : billsSponsored !== null ? billsSponsored : "—"}
            </p>
          </div>
        </div>

        {/* Finance Summary */}
        <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
              Campaign Finance
            </p>
            {loading ? (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">Loading…</p>
            ) : raised !== null ? (
              <div className="space-y-1">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">Raised:</span> {formatCurrency(raised)}
                </p>
                {spent !== null && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-medium">Spent:</span> {formatCurrency(spent)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {isMock ? politician.money.moduleSummary : "FEC data unavailable"}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
              Statements
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {politician.statements.moduleSummary}
            </p>
          </div>
        </div>

        <Link href={`/politician/${politician.id}`}>
          <Button variant="secondary" size="sm" className="w-full">
            View Full Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();

  const { stats: stats1, loading: loading1 } = usePoliticianStats(
    selected[0]?.id ?? null
  );
  const { stats: stats2, loading: loading2 } = usePoliticianStats(
    selected[1]?.id ?? null
  );

  if (selected.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="h-16 w-16 text-zinc-300 dark:text-zinc-600 mb-6"
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
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Compare Politicians
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">
          {selected.length === 0
            ? "Select two politicians to compare them side-by-side. Use the Compare button on any politician card from the homepage."
            : `You've selected 1 politician. Pick one more to start comparing.`}
        </p>
        <Link href="/">
          <Button variant="primary" size="md">
            Browse Politicians
          </Button>
        </Link>
      </div>
    );
  }

  const [politician1, politician2] = selected;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Compare Politicians
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Side-by-side comparison of key metrics and positions
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          Clear
        </Button>
      </div>

      {/* Comparison Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <PoliticianCard politician={politician1} stats={stats1} loading={loading1} />
        <PoliticianCard politician={politician2} stats={stats2} loading={loading2} />
      </div>
    </div>
  );
}
