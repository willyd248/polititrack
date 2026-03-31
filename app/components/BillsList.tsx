"use client";

import Link from "next/link";
import { Bill } from "../../data/bills";
import Card from "./ui/Card";
import { BipartisanGauge } from "./BipartisanGauge";

interface BillsListProps {
  bills: Bill[];
}

export default function BillsList({ bills }: BillsListProps) {
  if (bills.length === 0) {
    return (
      <div className="rounded-lg border border-[#C5C6CF] bg-[#F5F6FF] p-8 text-center">
        <p className="text-sm text-[#75777F]">
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
              <h3 className="font-headline text-xl font-semibold text-[#041534]">
                {bill.name}
              </h3>
              <div className="flex flex-shrink-0 items-center gap-2">
                <BipartisanGauge cosponsors={bill.cosponsors} size="compact" />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    bill.status === "Passed"
                      ? "bg-green-100 text-green-800"
                      : bill.status === "Failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-[#EDEEEF] text-[#75777F]"
                  }`}
                >
                  {bill.status}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#75777F]">
              {bill.summary[0]}
            </p>
            <p className="text-xs text-[#75777F]">
              {bill.timeline.length} timeline events • Last updated{" "}
              {bill.timeline[bill.timeline.length - 1]?.date || "N/A"}
            </p>
          </Link>
        </Card>
      ))}
    </div>
  );
}

