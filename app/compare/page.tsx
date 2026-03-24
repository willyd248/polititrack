"use client";

import { useCompare } from "../store/compare-store";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Link from "next/link";

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();

  // Show empty state if not 2 politicians selected
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
        {/* Politician 1 */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {politician1.name || "Unknown Member"}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {politician1.role || "Member of Congress"} • {politician1.state || "Unknown"}
                {politician1.district && ` • District ${politician1.district}`}
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Top Donor Category
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician1.metrics.topDonorCategory}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Votes This Year
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician1.metrics.votesThisYear}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Bills Sponsored
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician1.metrics.billsSponsored}
                </p>
              </div>
            </div>

            {/* Module Summaries */}
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Money
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician1.money.moduleSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Votes
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician1.votes.moduleSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Statements
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician1.statements.moduleSummary}
                </p>
              </div>
            </div>

            <Link href={`/politician/${politician1.id}`}>
              <Button variant="secondary" size="sm" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>
        </Card>

        {/* Politician 2 */}
        <Card>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {politician2.name || "Unknown Member"}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {politician2.role || "Member of Congress"} • {politician2.state || "Unknown"}
                {politician2.district && ` • District ${politician2.district}`}
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Top Donor Category
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician2.metrics.topDonorCategory}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Votes This Year
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician2.metrics.votesThisYear}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                  Bills Sponsored
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {politician2.metrics.billsSponsored}
                </p>
              </div>
            </div>

            {/* Module Summaries */}
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Money
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician2.money.moduleSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Votes
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician2.votes.moduleSummary}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
                  Statements
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {politician2.statements.moduleSummary}
                </p>
              </div>
            </div>

            <Link href={`/politician/${politician2.id}`}>
              <Button variant="secondary" size="sm" className="w-full">
                View Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

