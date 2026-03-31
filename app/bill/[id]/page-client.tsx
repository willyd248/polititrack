"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Bill } from "../../../data/bills";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Disclosure from "../../components/ui/Disclosure";
import InlineCitation from "../../components/ui/InlineCitation";
import Link from "next/link";
import { MemberPhoto } from "../../components/MemberPhoto";
import { useReceipts } from "../../store/receipts-store";
import { useTopicLens } from "../../store/topic-lens-store";
import { useSaved } from "../../store/saved-store";

interface BillInsights {
  whatChanges: string[];
  whoIsImpacted: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  generatedAt: number;
}

interface BillPageContentProps {
  bill: Bill;
  useMockData?: boolean;
}

function BillPageContent({ bill, useMockData = false }: BillPageContentProps) {
  const searchParams = useSearchParams();
  const { openReceipts } = useReceipts();
  const { selectedTopic } = useTopicLens();
  const { toggleSaveBill, isBillSaved } = useSaved();

  const [insights, setInsights] = useState<BillInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Fetch AI insights on mount
  useEffect(() => {
    const fetchInsights = async () => {
      setInsightsLoading(true);
      try {
        const res = await fetch("/api/bill-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billId: bill.id,
            title: bill.name,
            summaryText: bill.summaryText,
            subjects: bill.subjects,
            status: bill.status,
            sponsor: bill.sponsor?.name,
            cosponsorCount: bill.cosponsorCount,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights);
        }
      } catch {
        // Silently fail — placeholders remain
      } finally {
        setInsightsLoading(false);
      }
    };

    fetchInsights();
  }, [bill.id, bill.name, bill.summaryText, bill.subjects, bill.status, bill.sponsor?.name, bill.cosponsorCount]);

  // Handle receipt deep link on initial page load only
  useEffect(() => {
    const receiptParam = searchParams.get("receipt");
    if (!receiptParam) return;

    if (receiptParam === "summary") {
      handleSummaryReceipts();
    } else if (receiptParam.startsWith("timeline-")) {
      const eventIdOrIndex = receiptParam.replace("timeline-", "");
      const event = isNaN(Number(eventIdOrIndex))
        ? bill.timeline.find((e) => e.id === eventIdOrIndex)
        : bill.timeline[Number(eventIdOrIndex)];
      if (event) {
        handleTimelineEventReceipts(event.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSummaryReceipts = useCallback(() => {
    openReceipts({
      heading: "Bill Summary Sources",
      subheading: `Sources for ${bill.name}`,
      sources: bill.summarySources,
    });
  }, [openReceipts, bill.name, bill.summarySources]);

  const handleTimelineEventReceipts = useCallback(
    (eventId: string) => {
      const event = bill.timeline.find((e) => e.id === eventId);
      if (event) {
        openReceipts({
          heading: "Timeline Event Sources",
          subheading: `${event.title} - ${event.date}`,
          sources: event.sources,
        });
      }
    },
    [openReceipts, bill.timeline]
  );

  // Determine displayed values — AI insights override placeholders
  const whatChanges = insights?.whatChanges || bill.whatChangesForMostPeople;
  const whoImpacted = insights?.whoIsImpacted || bill.whoIsImpacted;
  const argsFor = insights?.argumentsFor || bill.argumentsFor;
  const argsAgainst = insights?.argumentsAgainst || bill.argumentsAgainst;

  const isPlaceholder = (items: string[]) =>
    items.length === 1 &&
    (items[0].includes("pending") ||
      items[0].includes("will be available") ||
      items[0].includes("will be updated") ||
      items[0].includes("Enable AI"));

  return (
    <div className="space-y-12">
      {/* Topic Lens Banner */}
      {selectedTopic && (
        <div className="rounded border border-[#C5C6CF] bg-[#F8F9FA] px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#191C1D]/80">
              Viewing through topic:{" "}
              <span className="font-semibold text-[#041534]">{selectedTopic}</span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#041534] leading-tight">
              {bill.name}
            </h1>
            {bill.topic && (
              <p className="mt-2 text-sm text-[#75777F]">
                {bill.topic}
              </p>
            )}
            {useMockData && (
              <p className="mt-2 text-xs text-[#75777F]">Sample data</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {bill.textUrl && (
              <a
                href={bill.textUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-[#C5C6CF] px-3 py-1.5 text-xs font-medium text-[#041534] transition-colors hover:bg-[#F8F9FA]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Full Text
              </a>
            )}
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
              className={`badge ${
                bill.status === "Passed"
                  ? "badge-passed"
                  : bill.status === "Failed"
                  ? "badge-failed"
                  : "badge-pending"
              }`}
            >
              {bill.status}
            </span>
          </div>
        </div>

        {/* Subjects / Topics Tags */}
        {bill.subjects && bill.subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bill.subjects.map((subject) => (
              <Chip key={subject}>{subject}</Chip>
            ))}
          </div>
        )}
      </div>

      {/* Top Section */}
      <div className="space-y-6">
        {/* People (Sponsor & Cosponsors) */}
        {(bill.sponsor || (bill.cosponsors && bill.cosponsors.length > 0)) && (
          <Card>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="font-headline text-xl font-bold text-[#041534]">People</h2>
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
                  <h3 className="font-headline mb-2 stat-label">Sponsor</h3>
                  <Link
                    href={`/politician/${bill.sponsor.bioguideId}`}
                    className="block rounded-lg border border-[#EDEEEF] p-4 transition-colors hover:bg-[#F8F9FA] hover:border-[#C5C6CF]"
                  >
                    <div className="flex items-center gap-3">
                      <MemberPhoto
                        bioguideId={bill.sponsor.bioguideId}
                        name={bill.sponsor.name}
                        size={36}
                        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full"
                        fallbackClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDEEEF] text-xs font-bold text-[#75777F]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#041534]">
                          {bill.sponsor.name}
                        </p>
                        {(bill.sponsor.party || bill.sponsor.state) && (
                          <p className="mt-0.5 text-xs text-[#75777F]">
                            {[bill.sponsor.party, bill.sponsor.state].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <svg
                        className="h-4 w-4 shrink-0 text-[#C5C6CF]"
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
                  <h3 className="font-headline mb-2 stat-label">
                    Cosponsors
                    {bill.cosponsorCount
                      ? ` (${bill.cosponsorCount}${bill.cosponsorCount > bill.cosponsors.length ? `, showing ${bill.cosponsors.length}` : ""})`
                      : bill.cosponsors.length > 0 ? ` (${bill.cosponsors.length})` : ""}
                  </h3>
                  <div className="space-y-1">
                    {bill.cosponsors.map((cosponsor) => (
                      <Link
                        key={cosponsor.bioguideId}
                        href={`/politician/${cosponsor.bioguideId}`}
                        className="block rounded p-2.5 transition-colors hover:bg-[#F8F9FA]"
                      >
                        <div className="flex items-center gap-3">
                          <MemberPhoto
                            bioguideId={cosponsor.bioguideId}
                            name={cosponsor.name}
                            size={36}
                            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full"
                            fallbackClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDEEEF] text-xs font-bold text-[#75777F]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#041534]">
                              {cosponsor.name}
                            </p>
                            {(cosponsor.party || cosponsor.state) && (
                              <p className="mt-0.5 text-xs text-[#75777F]">
                                {[cosponsor.party, cosponsor.state].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          <svg
                            className="h-4 w-4 shrink-0 text-[#C5C6CF]"
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
            <h2 className="font-headline text-xl font-bold text-[#041534]">1-Minute Summary</h2>
            <Button variant="ghost" size="sm" onClick={handleSummaryReceipts}>
              View receipts
            </Button>
          </div>
          <ul className="space-y-3">
            {bill.summary.map((point, index) => (
              <li key={index} className="flex items-start gap-3 text-[#191C1D]/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C5C6CF]"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* What Changes for Most People — AI-powered */}
        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-xl font-bold text-[#041534]">
                What Changes for Most People
              </h2>
              {insights && (
                <span className="rounded bg-[#EDEEEF] px-1.5 py-0.5 text-[10px] font-medium text-[#75777F]">
                  AI
                </span>
              )}
            </div>
            <InlineCitation
              compact
              data={{
                heading: "Impact Analysis Sources",
                subheading: `Sources for how ${bill.name} affects most people`,
                sources: bill.summarySources,
              }}
            />
          </div>
          {insightsLoading && !insights ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-full rounded bg-[#EDEEEF]" />
              <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
              <div className="h-4 w-4/6 rounded bg-[#EDEEEF]" />
            </div>
          ) : (
            <ul className="space-y-3">
              {whatChanges.map((change, index) => (
                <li key={index} className="flex items-start gap-3 text-[#191C1D]/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#C5C6CF]"></span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Who is Likely Impacted — AI-powered */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-headline text-xl font-bold text-[#041534]">
              Who is Likely Impacted
            </h2>
            {insights && (
              <span className="rounded bg-[#EDEEEF] px-1.5 py-0.5 text-[10px] font-medium text-[#75777F]">
                AI
              </span>
            )}
          </div>
          {insightsLoading && !insights ? (
            <div className="flex flex-wrap gap-2 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 w-32 rounded-full bg-[#EDEEEF]" />
              ))}
            </div>
          ) : isPlaceholder(whoImpacted) ? (
            <p className="text-sm text-[#75777F]">{whoImpacted[0]}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {whoImpacted.map((group, index) => (
                <Chip key={index}>{group}</Chip>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Arguments For / Against — AI-powered */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-headline text-xl font-bold text-[#041534]">Arguments For</h2>
            {insights && (
              <span className="rounded bg-[#EDEEEF] px-1.5 py-0.5 text-[10px] font-medium text-[#75777F]">
                AI
              </span>
            )}
          </div>
          {insightsLoading && !insights ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-full rounded bg-[#EDEEEF]" />
              <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
            </div>
          ) : (
            <ul className="space-y-3">
              {argsFor.map((argument, index) => (
                <li key={index} className="flex items-start gap-3 text-[#191C1D]/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  <span>{argument}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-headline text-xl font-bold text-[#041534]">Arguments Against</h2>
            {insights && (
              <span className="rounded bg-[#EDEEEF] px-1.5 py-0.5 text-[10px] font-medium text-[#75777F]">
                AI
              </span>
            )}
          </div>
          {insightsLoading && !insights ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-full rounded bg-[#EDEEEF]" />
              <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
            </div>
          ) : (
            <ul className="space-y-3">
              {argsAgainst.map((argument, index) => (
                <li key={index} className="flex items-start gap-3 text-[#191C1D]/80">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span>{argument}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Status & Next Steps */}
      <Card>
        <h2 className="font-headline mb-4 font-headline text-xl font-bold text-[#041534]">
          Status & Next Steps
        </h2>
        {bill.statusAndNextSteps.length === 0 ? (
          <p className="text-sm text-[#75777F]">No action history available yet.</p>
        ) : (
          <div className="space-y-3">
            {bill.statusAndNextSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-[#C5C6CF] pb-3 last:border-b-0"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EDEEEF] text-xs font-semibold text-[#041534]">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#191C1D]">{step.step}</p>
                  {step.date && (
                    <p className="mt-1 text-xs text-[#75777F]">{step.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Timeline */}
      {bill.timeline.length > 0 && (
        <Card>
          <h2 className="font-headline mb-6 font-headline text-xl font-bold text-[#041534]">
            Timeline ({bill.timeline.length} event{bill.timeline.length !== 1 ? "s" : ""})
          </h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#C5C6CF]"></div>

            <div className="space-y-0">
              {bill.timeline.map((event) => {
                const isHighlighted = selectedTopic && event.topic === selectedTopic;
                return (
                  <div
                    key={event.id}
                    className={`relative pl-12 pb-6 last:pb-0 ${
                      isHighlighted ? "border-l-4 border-l-[#041534] pl-10" : ""
                    }`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-4 top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                        isHighlighted ? "bg-[#041534]" : "bg-[#C5C6CF]"
                      }`}
                    ></div>

                    {/* Event content */}
                    <Disclosure
                      title={
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={`flex-1 ${isHighlighted ? "bg-[#F8F9FA] -m-2 p-2 rounded" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[#191C1D]">
                                {event.title}
                              </p>
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
                              <p className="text-xs text-[#75777F]">{event.date}</p>
                              {isHighlighted && (
                                <span className="text-xs font-medium text-[#191C1D]/80">
                                  &bull; {selectedTopic}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div className="space-y-3 pt-2">
                        {event.details && (
                          <p className="text-sm leading-relaxed text-[#191C1D]/80">
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
      )}

      {/* Related Bills */}
      {bill.relatedBills && bill.relatedBills.length > 0 && (
        <Card>
          <h2 className="font-headline mb-4 font-headline text-xl font-bold text-[#041534]">
            Related Bills ({bill.relatedBills.length})
          </h2>
          <div className="space-y-2">
            {bill.relatedBills.map((rb) => (
              <Link
                key={rb.id}
                href={`/bill/${rb.id}`}
                className="block rounded-lg border border-[#EDEEEF] p-3 transition-colors hover:bg-[#F8F9FA] hover:border-[#C5C6CF]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#041534] truncate">
                      {rb.type} {rb.number}: {rb.title}
                    </p>
                    {rb.latestAction && (
                      <p className="mt-1 text-xs text-[#75777F] truncate">
                        {rb.latestAction}
                      </p>
                    )}
                  </div>
                  <svg className="h-4 w-4 flex-shrink-0 text-[#C5C6CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
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
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-2/3 rounded bg-[#EDEEEF]" />
          <div className="h-4 w-1/3 rounded bg-[#EDEEEF]" />
          <div className="card p-6 space-y-3">
            <div className="h-4 w-full rounded bg-[#EDEEEF]" />
            <div className="h-4 w-5/6 rounded bg-[#EDEEEF]" />
          </div>
        </div>
      }
    >
      <BillPageContent bill={bill} useMockData={useMockData} />
    </Suspense>
  );
}
