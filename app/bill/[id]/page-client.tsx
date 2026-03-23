"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Bill } from "../../../data/bills";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Disclosure from "../../components/ui/Disclosure";
import InlineCitation from "../../components/ui/InlineCitation";
import Link from "next/link";
import { useReceipts } from "../../store/receipts-store";
import { useTopicLens } from "../../store/topic-lens-store";
import { useSaved } from "../../store/saved-store";

interface BillPageContentProps {
  bill: Bill;
  useMockData?: boolean;
}

function BillPageContent({ bill, useMockData = false }: BillPageContentProps) {

  const searchParams = useSearchParams();
  const { openReceipts } = useReceipts();
  const { selectedTopic } = useTopicLens();
  const { toggleSaveBill, isBillSaved } = useSaved();

  // Handle receipt deep link on initial page load only
  useEffect(() => {
    const receiptParam = searchParams.get("receipt");
    if (!receiptParam) return;

    if (receiptParam === "summary") {
      handleSummaryReceipts();
    } else if (receiptParam.startsWith("timeline-")) {
      // Support both old format (timeline-0) and new format (timeline-{id})
      const eventIdOrIndex = receiptParam.replace("timeline-", "");
      const event = isNaN(Number(eventIdOrIndex))
        ? bill.timeline.find((e) => e.id === eventIdOrIndex)
        : bill.timeline[Number(eventIdOrIndex)];
      if (event) {
        handleTimelineEventReceipts(event.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleSummaryReceipts = () => {
    openReceipts({
      heading: "Bill Summary Sources",
      subheading: `Sources for ${bill.name}`,
      sources: bill.summarySources,
    });
  };

  const handleTimelineEventReceipts = (eventId: string) => {
    const event = bill.timeline.find((e) => e.id === eventId);
    if (event) {
      openReceipts({
        heading: "Timeline Event Sources",
        subheading: `${event.title} - ${event.date}`,
        sources: event.sources,
      });
    }
  };

  const handleSponsorReceipts = () => {
    if (bill.sponsorSources && bill.sponsorSources.length > 0) {
      openReceipts({
        heading: "Sponsor & Cosponsor Sources",
        subheading: `Sources for sponsor and cosponsor information for ${bill.name}`,
        sources: bill.sponsorSources,
      });
    }
  };

  return (
    <div className="space-y-12">
      {/* Topic Lens Banner */}
      {selectedTopic && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Viewing through topic: <span className="font-semibold">{selectedTopic}</span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {bill.name}
            </h1>
            {useMockData && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                Mock data
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isBillSaved(bill.id) ? "primary" : "secondary"}
              size="sm"
              onClick={() => toggleSaveBill(bill.id)}
              className="flex items-center gap-2"
            >
              <svg
                className={`h-4 w-4 ${isBillSaved(bill.id) ? "fill-current" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {isBillSaved(bill.id) ? "Following" : "Follow"}
            </Button>
            <span
              className={`rounded-full px-4 py-2 text-sm font-medium ${
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
        </div>
      </div>

      {/* Top Section */}
      <div className="space-y-6">
        {/* People (Sponsor & Cosponsors) */}
        {(bill.sponsor || (bill.cosponsors && bill.cosponsors.length > 0)) && (
          <Card>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                People
              </h2>
              {bill.sponsorSources && bill.sponsorSources.length > 0 && (
                <InlineCitation
                  compact
                  data={{
                    heading: "Sponsor & Cosponsor Sources",
                    subheading: `Sources for sponsor and cosponsor information for ${bill.name}`,
                    sources: bill.sponsorSources,
                  }}
                />
              )}
            </div>
            
            <div className="space-y-4">
              {/* Sponsor */}
              {bill.sponsor && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Sponsor
                  </h3>
                  <Link
                    href={`/politician/${bill.sponsor.bioguideId}`}
                    className="block rounded-md p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {bill.sponsor.name}
                        </p>
                        {(bill.sponsor.party || bill.sponsor.state) && (
                          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                            {[bill.sponsor.party, bill.sponsor.state].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                      <svg
                        className="h-4 w-4 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                </div>
              )}

              {/* Cosponsors */}
              {bill.cosponsors && bill.cosponsors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Cosponsors {bill.cosponsors.length > 0 && `(${bill.cosponsors.length})`}
                  </h3>
                  <div className="space-y-2">
                    {bill.cosponsors.map((cosponsor) => (
                      <Link
                        key={cosponsor.bioguideId}
                        href={`/politician/${cosponsor.bioguideId}`}
                        className="block rounded-md p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {cosponsor.name}
                            </p>
                            {(cosponsor.party || cosponsor.state) && (
                              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                                {[cosponsor.party, cosponsor.state].filter(Boolean).join(" • ")}
                              </p>
                            )}
                          </div>
                          <svg
                            className="h-4 w-4 text-zinc-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 1-Minute Summary */}
        <Card>
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              1-Minute Summary
            </h2>
            <Button variant="ghost" size="sm" onClick={handleSummaryReceipts}>
              View receipts
            </Button>
          </div>
          <ul className="space-y-3">
            {bill.summary.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* What Changes for Most People */}
        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              What Changes for Most People
            </h2>
            <InlineCitation
              compact
              data={{
                heading: "Impact Analysis Sources",
                subheading: `Sources for how ${bill.name} affects most people`,
                sources: [
                  {
                    title: "CBO Impact Analysis",
                    publisher: "Congressional Budget Office",
                    date: "2024-02-25",
                    excerpt: `Detailed analysis of how ${bill.name} will affect everyday Americans, including cost estimates and behavioral impacts.`,
                    url: "https://www.cbo.gov/",
                  },
                  {
                    title: "Public Impact Assessment",
                    publisher: "Policy Research Institute",
                    date: "2024-03-01",
                    excerpt: `Comprehensive assessment of the bill's effects on different demographic groups and communities.`,
                    url: "https://example.com/impact",
                  },
                ],
              }}
            />
          </div>
          <ul className="space-y-3">
            {bill.whatChangesForMostPeople.map((change, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Who is Likely Impacted */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Who is Likely Impacted
          </h2>
          <div className="flex flex-wrap gap-2">
            {bill.whoIsImpacted.map((group, index) => (
              <Chip key={index}>{group}</Chip>
            ))}
          </div>
        </Card>
      </div>

      {/* Mid Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Arguments For */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Arguments For
          </h2>
          <ul className="space-y-3">
            {bill.argumentsFor.map((argument, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                <span>{argument}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Arguments Against */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Arguments Against
          </h2>
          <ul className="space-y-3">
            {bill.argumentsAgainst.map((argument, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                <span>{argument}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Status & Next Steps */}
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Status & Next Steps
        </h2>
        <div className="space-y-3">
          {bill.statusAndNextSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 border-b border-zinc-200 pb-3 last:border-b-0 dark:border-zinc-800"
            >
              <div className="flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {step.step}
                </p>
                {step.date && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {step.date}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Timeline
        </h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>

          <div className="space-y-0">
            {bill.timeline.map((event) => {
              const isHighlighted = selectedTopic && event.topic === selectedTopic;
              return (
                <div
                  key={event.id}
                  className={`relative pl-12 pb-6 last:pb-0 ${
                    isHighlighted ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100 pl-10" : ""
                  }`}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-4 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                      isHighlighted
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-zinc-400 dark:bg-zinc-600"
                    }`}
                  ></div>

                  {/* Event content */}
                  <Disclosure
                    title={
                      <div className="flex items-start justify-between gap-4">
                        <div className={`flex-1 ${isHighlighted ? "bg-zinc-50/50 dark:bg-zinc-900/30 -m-2 p-2 rounded" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {event.title}
                            </p>
                            {/* Add citation to first timeline event only */}
                            {bill.timeline[0]?.id === event.id && (
                              <InlineCitation
                                compact
                                data={{
                                  heading: "Timeline Event Sources",
                                  subheading: `${event.title} - ${event.date}`,
                                  sources: event.sources,
                                }}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              {event.date}
                            </p>
                            {isHighlighted && (
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                • {selectedTopic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3 pt-2">
                      {event.details && (
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {event.details}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTimelineEventReceipts(event.id)}
                      >
                        View receipts
                      </Button>
                    </div>
                  </Disclosure>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function BillPageClient({
  bill,
  useMockData = false,
}: {
  bill: Bill;
  useMockData?: boolean;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillPageContent bill={bill} useMockData={useMockData} />
    </Suspense>
  );
}
