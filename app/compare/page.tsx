"use client";

import { useEffect } from "react";
import { useCompare } from "../store/compare-store";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComparePage() {
  const { selected, clearCompare } = useCompare();
  const router = useRouter();

  // Redirect if not 2 politicians selected
  useEffect(() => {
    if (selected.length !== 2) {
      router.push("/");
    }
  }, [selected.length, router]);

  if (selected.length !== 2) {
    return null;
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

