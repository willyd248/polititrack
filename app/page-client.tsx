"use client";

import { useState } from "react";
import Link from "next/link";
import { Politician } from "../data/politicians";
import { Member } from "../data/types-members";
import { Bill } from "../data/bills";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";
import InlineCitation from "./components/ui/InlineCitation";
import BillsList from "./components/BillsList";
import MemberPlayerCards from "./components/MemberPlayerCards";
import { useCompare } from "./store/compare-store";
import { useSaved } from "./store/saved-store";
import { useReceipts } from "./store/receipts-store";
import { memberToPolitician } from "../lib/mappers/memberToPolitician";
import { lookupDistrictByZip, DistrictInfo } from "../lib/districtLookup";
import { stateNameToCode } from "../lib/stateConverter";

interface HomeProps {
  bills: Bill[];
  useMockData?: boolean;
  members: Member[] | null;
  useMockMembers?: boolean;
  mockPoliticians: Politician[];
  showDataUnavailableIndicator?: boolean;
}

export default function HomeClient({
  bills,
  useMockData = false,
  members,
  useMockMembers = true,
  mockPoliticians,
  showDataUnavailableIndicator = false,
}: HomeProps) {
  const [zipCode, setZipCode] = useState("");
  const [districtInfo, setDistrictInfo] = useState<DistrictInfo | null>(null);
  const [districtMembers, setDistrictMembers] = useState<Member[]>([]);
  const { addPolitician, removePolitician, isSelected } = useCompare();
  const { openReceipts } = useReceipts();
  const {
    savedPoliticians,
    savedBills,
    savedTopics,
    isPoliticianSaved,
    isBillSaved,
    isTopicSaved,
  } = useSaved();

  const displayMembers = members || [];
  const displayPoliticians = useMockMembers ? mockPoliticians : displayMembers.map(memberToPolitician);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lookup = lookupDistrictByZip(zipCode);
    if (!lookup) {
      setDistrictInfo(null);
      setDistrictMembers([]);
      return;
    }
    setDistrictInfo(lookup);
    if (displayMembers.length > 0) {
      const filtered: Member[] = [];
      if (lookup.district) {
        const houseRep = displayMembers.find(
          (m) => m.chamber === "House" && m.state === lookup.state && m.district === lookup.district
        );
        if (houseRep) filtered.push(houseRep);
      }
      const senators = displayMembers.filter(
        (m) => m.chamber === "Senate" && m.state === lookup.state
      );
      filtered.push(...senators);
      setDistrictMembers(filtered);
    } else {
      setDistrictMembers([]);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="card p-8 md:p-12">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-[#041534] mb-4 leading-tight">
          Know where your tax dollars go and how your reps perform
        </h1>
        <p className="text-base text-[#75777F] max-w-2xl mb-6">
          See how your representatives vote, who funds their campaigns, and what legislation they&apos;re pushing.
          Nonpartisan. Source-cited. Built for citizens who want transparency.
        </p>

        {/* Search */}
        <form onSubmit={handleZipSubmit} className="flex gap-3 max-w-md">
          <input
            type="text"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            maxLength={5}
            pattern="[0-9]{5}"
            className="flex-1 rounded border border-[#C5C6CF] bg-white px-4 py-2.5 text-sm text-[#191C1D] placeholder:text-[#75777F] focus:border-[#041534] focus:outline-none focus:ring-2 focus:ring-[#D9E2FF]"
          />
          <Button type="submit" variant="primary" size="md">
            Find My Reps
          </Button>
        </form>

        {/* District Results */}
        {districtInfo && (
          <div className="mt-6 border-t border-[#C5C6CF] pt-6">
            <h3 className="font-headline text-sm font-semibold text-[#191C1D] mb-3">
              {districtInfo.district
                ? `${districtInfo.state} District ${districtInfo.district}`
                : `${districtInfo.state} (At-Large)`}
            </h3>
            {districtMembers.length === 0 && (
              <p className="text-sm text-[#75777F]">
                No representatives found in current dataset.
              </p>
            )}
            {districtMembers.length > 0 && (
              <div className="space-y-2">
                {districtMembers.map((member) => {
                  const politician = memberToPolitician(member);
                  const isSelectedMember = isSelected(politician.id);
                  const partyColor = member.party === "D" ? "#1B2A4A" : member.party === "R" ? "#8B2332" : "#75777F";
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded border border-[#C5C6CF] bg-[#F8F9FA] p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: partyColor }}
                    >
                      <div>
                        <Link
                          href={`/politician/${member.bioguideId}`}
                          className="text-sm font-semibold text-[#041534] hover:text-[#1B2A4A]"
                        >
                          {member.fullName || "Unknown Member"}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#75777F]">
                          {member.chamber === "House"
                            ? `House \u00B7 ${stateNameToCode(member.state || "N/A")}${member.district ? ` \u00B7 D${member.district}` : ""}`
                            : `Senate \u00B7 ${stateNameToCode(member.state || "N/A")}`}
                        </p>
                      </div>
                      <Button
                        variant={isSelectedMember ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => {
                          if (isSelectedMember) {
                            removePolitician(politician.id);
                          } else {
                            addPolitician(politician);
                          }
                        }}
                      >
                        {isSelectedMember ? "Remove" : "Compare"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {zipCode && !districtInfo && (
          <p className="mt-4 text-sm text-[#75777F]">
            ZIP code not found in dataset. This is a starter dataset with limited coverage.
          </p>
        )}
      </div>

      {/* Following Section */}
      {(savedPoliticians.length > 0 || savedBills.length > 0 || savedTopics.length > 0) && (
        <section className="space-y-4">
          <h2 className="font-headline text-xl font-bold text-[#041534]">Following</h2>
          {savedPoliticians.length > 0 && (
            <div className="space-y-2">
              <h3 className="stat-label">Politicians</h3>
              <div className="flex flex-wrap gap-2">
                {savedPoliticians.map((id) => {
                  const politician = displayPoliticians.find((p) => p.id === id) || mockPoliticians.find((p) => p.id === id);
                  if (!politician) return null;
                  return (
                    <Link key={id} href={`/politician/${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#C5C6CF] bg-white px-3 py-1.5 text-sm text-[#191C1D] transition-colors hover:bg-[#EDEEEF]">
                      {politician.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {savedBills.length > 0 && (
            <div className="space-y-2">
              <h3 className="stat-label">Bills</h3>
              <div className="flex flex-wrap gap-2">
                {savedBills.map((id) => {
                  const bill = bills.find((b) => b.id === id);
                  if (!bill) return null;
                  return (
                    <Link key={id} href={`/bill/${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#C5C6CF] bg-white px-3 py-1.5 text-sm text-[#191C1D] transition-colors hover:bg-[#EDEEEF]">
                      {bill.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* This Week */}
      <section className="space-y-4">
        <h2 className="font-headline text-xl font-bold text-[#041534]">This Week</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {bills.length > 0 && bills[0] && (() => {
            const bill = bills[0];
            const latestTimelineEvent = bill.timeline?.[0];
            const latestStatusStep = bill.statusAndNextSteps?.[0];
            const actionDate = latestTimelineEvent?.date || latestStatusStep?.date || "";
            const actionText = latestTimelineEvent?.title || latestStatusStep?.step || bill.status || "Recent action";
            const actionSources = latestTimelineEvent?.sources || bill.summarySources || [];
            const formattedDate = actionDate
              ? new Date(actionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            return (
              <div className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="stat-label">Key Action</span>
                  {actionSources.length > 0 && (
                    <InlineCitation compact data={{ heading: "Key Action Sources", subheading: `${bill.name} - ${actionText}`, sources: actionSources }} />
                  )}
                </div>
                <p className="text-sm font-medium text-[#191C1D] mb-1">{actionText}</p>
                {formattedDate && <p className="text-xs text-[#75777F]">{formattedDate}</p>}
              </div>
            );
          })()}

          {bills.length > 0 && bills[0] && (() => {
            const bill = bills[0];
            const latestTimelineEvent = bill.timeline?.[0];
            const latestStatusStep = bill.statusAndNextSteps?.[0];
            const actionDate = latestTimelineEvent?.date || latestStatusStep?.date || "";
            const formattedDate = actionDate
              ? new Date(actionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            const actionText = latestTimelineEvent?.title || latestStatusStep?.step || bill.status || "Recent update";
            return (
              <div className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="stat-label">Major Bill</span>
                  {bill.summarySources && bill.summarySources.length > 0 && (
                    <InlineCitation compact data={{ heading: "Major Bill Sources", subheading: bill.name, sources: bill.summarySources }} />
                  )}
                </div>
                <p className="text-sm font-medium text-[#191C1D] mb-1">{bill.name}</p>
                <p className="text-xs text-[#75777F]">
                  {actionText}{formattedDate && ` \u00B7 ${formattedDate}`}
                </p>
              </div>
            );
          })()}

          <div className="card p-5">
            <span className="stat-label mb-3 block">Notable Statement</span>
            <p className="text-sm italic text-[#75777F] mb-2">
              Statements feed coming soon — we&apos;ll prioritize primary sources.
            </p>
            <Link href="/methodology" className="text-xs font-medium text-[#041534] hover:text-[#1B2A4A] underline">
              Learn about our data sources
            </Link>
          </div>
        </div>
      </section>

      {/* Representatives */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-[#041534]">Representatives</h2>
          <div className="flex items-center gap-2">
            {showDataUnavailableIndicator && (
              <span className="badge" style={{ background: "#FFF3E0", color: "#E65100" }}>
                Data temporarily unavailable
              </span>
            )}
            {useMockMembers && !showDataUnavailableIndicator && (
              <span className="badge badge-pending">Sample data</span>
            )}
          </div>
        </div>
        <p className="text-sm text-[#75777F]">
          Members of the 119th Congress with recent activity and key metrics
        </p>
        {displayMembers.length > 0 ? (
          <MemberPlayerCards members={displayMembers} />
        ) : (
          <div className="card p-8 text-center">
            <p className="text-sm text-[#75777F]">No members found. Check back later.</p>
          </div>
        )}
      </section>

      {/* Trending Bills */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-xl font-bold text-[#041534]">Trending Bills</h2>
          {useMockData && (
            <span className="badge badge-pending">Sample data</span>
          )}
        </div>
        <p className="text-sm text-[#75777F]">
          Bills with recent activity, high cosponsor counts, or media attention
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {bills.slice(0, 6).map((bill) => (
            <Link key={bill.id} href={`/bill/${bill.id}`} className="card p-5 block hover:border-[#75777F]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-headline text-base font-semibold text-[#041534] flex-1 leading-snug">
                  {bill.name}
                </h3>
                <span
                  className={`badge flex-shrink-0 ${
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
              <p className="text-sm leading-relaxed text-[#191C1D]/80 mb-3">
                {bill.summary[0]}
              </p>
              <div className="flex items-center gap-4">
                <span className="stat-label">{bill.timeline.length} Events</span>
                {bill.timeline.length > 0 && (
                  <span className="stat-label">
                    Updated {bill.timeline[bill.timeline.length - 1]?.date || "N/A"}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        {bills.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-sm text-[#75777F]">No bills available at this time.</p>
          </div>
        )}
      </section>
    </div>
  );
}
