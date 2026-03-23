"use client";

import Link from "next/link";
import { Bill } from "../../data/bills";
import Card from "./ui/Card";

interface BillsListProps {
  bills: Bill[];
}

export default function BillsList({ bills }: BillsListProps) {
  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No bills available at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {bills.map((bill) => (
        <Card key={bill.id} clickable>
          <Link href={`/bill/${bill.id}`} className="block space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {bill.name}
              </h3>
              <span
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  bill.status === "Passed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : bill.status === "Failed"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {bill.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {bill.summary[0]}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {bill.timeline.length} timeline events • Last updated{" "}
              {bill.timeline[bill.timeline.length - 1]?.date || "N/A"}
            </p>
          </Link>
        </Card>
      ))}
    </div>
  );
}

