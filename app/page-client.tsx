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

  // Use real members if available, otherwise fall back to mock politicians
  const displayMembers = members || [];
  const displayPoliticians = useMockMembers ? mockPoliticians : displayMembers.map(memberToPolitician);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lookup district by zip
    const lookup = lookupDistrictByZip(zipCode);
    
    if (!lookup) {
      // Zip not found in dataset
      setDistrictInfo(null);
      setDistrictMembers([]);
      return;
    }
    
    setDistrictInfo(lookup);
    
    // Filter members to find House rep and Senators for this district
    if (displayMembers.length > 0) {
      const filtered: Member[] = [];
      
      // Find House representative (matching state and district)
      if (lookup.district) {
        const houseRep = displayMembers.find(
          (m) => m.chamber === "House" && m.state === lookup.state && m.district === lookup.district
        );
        if (houseRep) {
          filtered.push(houseRep);
        }
      }
      
      // Find both Senators (matching state, chamber = Senate)
      const senators = displayMembers.filter(
        (m) => m.chamber === "Senate" && m.state === lookup.state
      );
      filtered.push(...senators);
      
      setDistrictMembers(filtered);
    } else {
      // No real members available
      setDistrictMembers([]);
    }
  };

  const handleDistrictSources = () => {
    openReceipts({
      heading: "District Lookup Sources",
      subheading: "Sources for zip code to congressional district mapping",
      sources: [
        {
          title: "Zip-to-District Dataset",
          publisher: "Polititrack",
          date: new Date().getFullYear().toString(),
          url: "https://github.com/your-repo/polititrack/blob/main/data/zip-to-district.json",
          excerpt: "Starter dataset mapping zip codes to congressional districts. Based on official U.S. Census and congressional district boundaries.",
        },
        {
          title: "U.S. Census Bureau - Congressional Districts",
          publisher: "U.S. Census Bureau",
          url: "https://www.census.gov/programs-surveys/geography/guidance/geo-areas/congressional-dist.html",
          excerpt: "Official source for congressional district boundaries and zip code assignments.",
        },
      ],
    });
  };

  return (
    <div className="space-y-12">
      {/* Hero - Vintage Design */}
      <div className="vintage-card p-8">
        <div className="vintage-header">
          <h1 className="vintage-title text-5xl text-zinc-900 dark:text-zinc-100 mb-4">
            POLITITRACK
          </h1>
          <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
            Understand where politicians get money from, how they vote, what they
            say, and what laws do and why they matter.
          </p>
        </div>
        <div className="vintage-section">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 border-2 border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"></span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All information is presented neutrally with sources</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 border-2 border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100"></span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No inflammatory language, just transparency</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Your District Card - Vintage Design */}
      <div className="vintage-card p-6">
        <div className="vintage-header">
          <div className="flex items-start justify-between">
            <h2 className="vintage-title text-xl text-zinc-900 dark:text-zinc-100">
              Your District
            </h2>
            <InlineCitation
              compact
              data={{
                heading: "District Lookup Sources",
                subheading: "Sources for zip code to congressional district mapping",
                sources: [
                  {
                    title: "Zip-to-District Dataset",
                    publisher: "Polititrack",
                    date: new Date().getFullYear().toString(),
                    url: "https://github.com/your-repo/polititrack/blob/main/data/zip-to-district.json",
                    excerpt: "Starter dataset mapping zip codes to congressional districts. Based on official U.S. Census and congressional district boundaries.",
                  },
                  {
                    title: "U.S. Census Bureau - Congressional Districts",
                    publisher: "U.S. Census Bureau",
                    url: "https://www.census.gov/programs-surveys/geography/guidance/geo-areas/congressional-dist.html",
                    excerpt: "Official source for congressional district boundaries and zip code assignments.",
                  },
                ],
              }}
            />
          </div>
        </div>
        <form onSubmit={handleZipSubmit} className="vintage-section">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
              pattern="[0-9]{5}"
              className="flex-1 border-2 border-zinc-900 bg-white px-4 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-300 dark:focus:ring-zinc-100"
            />
            <Button 
              type="submit" 
              variant="primary" 
              size="md"
              className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
            >
              Find
            </Button>
          </div>
          <p className="vintage-subtitle mt-2">
            We'll show your reps and recent votes
          </p>
        </form>

        {/* District Results - Vintage Styled */}
        {districtInfo && (
          <div className="vintage-section">
            <div className="mb-4">
              <h3 className="vintage-subtitle mb-2">
                {districtInfo.district
                  ? `${districtInfo.state} District ${districtInfo.district}`
                  : `${districtInfo.state} (At-Large)`}
              </h3>
              {districtMembers.length === 0 && (
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  No representatives found in current dataset. Try a different zip code or check back later.
                </p>
              )}
            </div>

            {districtMembers.length > 0 && (
              <div className="space-y-3">
                {districtMembers.map((member) => {
                  const politician = memberToPolitician(member);
                  const isSelectedMember = isSelected(politician.id);
                  
                  return (
                    <div
                      key={member.id}
                      className="border-2 border-zinc-900 bg-zinc-100 p-4 dark:border-zinc-100 dark:bg-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link
                            href={`/politician/${member.bioguideId}`}
                            className="text-sm font-bold uppercase text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                          >
                            {member.fullName || "Unknown Member"}
                          </Link>
                          <p className="mt-1 vintage-subtitle">
                            {member.chamber === "House"
                              ? `H • ${stateNameToCode(member.state || "N/A")}${member.district ? ` • D${member.district}` : ""} • ${member.party || "N/A"}`
                              : `S • ${stateNameToCode(member.state || "N/A")} • ${member.party || "N/A"}`}
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
                          className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                        >
                          {isSelectedMember ? "Remove" : "Compare"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {zipCode && !districtInfo && (
          <div className="vintage-section">
            <p className="vintage-subtitle">
              Zip code not found in dataset. This is a starter dataset with limited coverage.
            </p>
          </div>
        )}
      </div>

      {/* Following Section */}
      {(savedPoliticians.length > 0 ||
        savedBills.length > 0 ||
        savedTopics.length > 0) && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Following
          </h2>

          {/* Saved Politicians */}
          {savedPoliticians.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Politicians
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedPoliticians.map((id) => {
                  // Try to find in display politicians first, then mock politicians
                  const politician = displayPoliticians.find((p) => p.id === id) || 
                                    mockPoliticians.find((p) => p.id === id);
                  if (!politician) return null;
                  return (
                    <Link
                      key={id}
                      href={`/politician/${id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span>{politician.name}</span>
                      <svg
                        className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Bills */}
          {savedBills.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Bills
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedBills.map((id) => {
                  const bill = bills.find((b) => b.id === id);
                  if (!bill) return null;
                  return (
                    <Link
                      key={id}
                      href={`/bill/${id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span>{bill.name}</span>
                      <svg
                        className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saved Topics */}
          {savedTopics.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedTopics.map((topic) => (
                  <Link
                    key={topic}
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span>{topic}</span>
                    <svg
                      className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* This Week Section - Vintage Design */}
      <section className="space-y-6">
        <h2 className="vintage-title text-2xl text-zinc-900 dark:text-zinc-100">
          This Week
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Key Action Card (using latest action from most recent bill) */}
          {bills.length > 0 && bills[0] && (() => {
            const bill = bills[0];
            // Use timeline first (has title, date, sources), then statusAndNextSteps (has step, date)
            const latestTimelineEvent = bill.timeline?.[0];
            const latestStatusStep = bill.statusAndNextSteps?.[0];
            const actionDate = latestTimelineEvent?.date || latestStatusStep?.date || "";
            const actionText = latestTimelineEvent?.title || latestStatusStep?.step || bill.status || "Recent action";
            const actionSources = latestTimelineEvent?.sources || bill.summarySources || [];
            
            // Format date for display
            const formattedDate = actionDate 
              ? new Date(actionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            
            return (
              <div className="vintage-card p-6">
                <div className="vintage-header">
                  <div className="flex items-start justify-between">
                    <h3 className="vintage-title text-lg text-zinc-900 dark:text-zinc-100">
                      Key Action
                    </h3>
                    {actionSources.length > 0 && (
                      <InlineCitation
                        compact
                        data={{
                          heading: "Key Action Sources",
                          subheading: `${bill.name} - ${actionText}`,
                          sources: actionSources,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="vintage-section">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {actionText}
                  </p>
                  {formattedDate && (
                    <p className="vintage-subtitle">
                      {formattedDate}
                    </p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Major Bill Card (most recently updated bill) */}
          {bills.length > 0 && bills[0] && (() => {
            const bill = bills[0];
            // Use timeline first (has title, date), then statusAndNextSteps (has step, date)
            const latestTimelineEvent = bill.timeline?.[0];
            const latestStatusStep = bill.statusAndNextSteps?.[0];
            const actionDate = latestTimelineEvent?.date || latestStatusStep?.date || "";
            
            // Format date for display
            const formattedDate = actionDate 
              ? new Date(actionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            
            // Get action text or status
            const actionText = latestTimelineEvent?.title || latestStatusStep?.step || bill.status || "Recent update";
            
            return (
              <div className="vintage-card p-6">
                <div className="vintage-header">
                  <div className="flex items-start justify-between">
                    <h3 className="vintage-title text-lg text-zinc-900 dark:text-zinc-100">
                      Major Bill
                    </h3>
                    {bill.summarySources && bill.summarySources.length > 0 && (
                      <InlineCitation
                        compact
                        data={{
                          heading: "Major Bill Sources",
                          subheading: bill.name,
                          sources: bill.summarySources,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="vintage-section">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    {bill.name}
                  </p>
                  <p className="vintage-subtitle">
                    {actionText}
                    {formattedDate && ` • ${formattedDate}`}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Notable Statement Card (placeholder for now) */}
          <div className="vintage-card p-6">
            <div className="vintage-header">
              <h3 className="vintage-title text-lg text-zinc-900 dark:text-zinc-100">
                Notable Statement
              </h3>
            </div>
            <div className="vintage-section">
              <p className="text-sm font-semibold italic text-zinc-600 dark:text-zinc-400 mb-2">
                Statements feed coming soon — we'll prioritize primary sources.
              </p>
              <p className="vintage-subtitle">
                <Link href="/methodology" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                  Learn more about our data sources
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Representatives Section - Vintage Design */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="vintage-title text-2xl text-zinc-900 dark:text-zinc-100">
            Representatives
          </h2>
          <div className="flex items-center gap-2">
            {showDataUnavailableIndicator && (
              <span className="vintage-subtitle text-orange-600 dark:text-orange-400">
                Real data temporarily unavailable
              </span>
            )}
            {useMockMembers && !showDataUnavailableIndicator && (
              <span className="vintage-subtitle">
                Mock data
              </span>
            )}
          </div>
        </div>
        <p className="vintage-subtitle text-sm mb-4">
          Members of the 118th Congress with recent activity and key metrics
        </p>
        {displayMembers.length === 0 ? (
          <div className="vintage-card p-8 text-center">
            <p className="vintage-subtitle">
              No members found. Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayMembers.slice(0, 12).map((member) => {
              const politician = memberToPolitician(member);
              const isSelectedMember = isSelected(politician.id);
              const partyColor = member.party === "D" ? "border-blue-600" : member.party === "R" ? "border-red-600" : "border-zinc-500";
              
              return (
                <div key={member.id} className="vintage-card p-6">
                  <Link href={`/politician/${member.bioguideId}`} className="block space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="vintage-title text-base text-zinc-900 dark:text-zinc-100">
                          {member.fullName}
                        </h3>
                        <p className="vintage-subtitle mt-1">
                          {member.chamber === "House" ? "H" : "S"} • {stateNameToCode(member.state)}
                          {member.district ? ` • D${member.district}` : ""} • {member.party || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className={`vintage-section border-t-2 ${partyColor} pt-3`}>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="vintage-stat-box">
                          <div className="vintage-label">Chamber</div>
                          <div className="vintage-value text-sm text-zinc-900 dark:text-zinc-100">
                            {member.chamber === "House" ? "H" : "S"}
                          </div>
                        </div>
                        <div className="vintage-stat-box">
                          <div className="vintage-label">Party</div>
                          <div className="vintage-value text-sm text-zinc-900 dark:text-zinc-100">
                            {member.party || "—"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isSelectedMember ? "primary" : "secondary"}
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isSelectedMember) {
                            removePolitician(politician.id);
                          } else {
                            addPolitician(politician);
                          }
                        }}
                        className="mt-3 w-full border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                      >
                        {isSelectedMember ? "Remove" : "Compare"}
                      </Button>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending Bills Section - Vintage Design */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="vintage-title text-2xl text-zinc-900 dark:text-zinc-100">
            Trending Bills
          </h2>
          {useMockData && (
            <span className="vintage-subtitle text-xs">
              Mock data
            </span>
          )}
        </div>
        <p className="vintage-subtitle text-sm mb-4">
          Bills with recent activity, high cosponsor counts, or media attention
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {bills.slice(0, 6).map((bill) => (
            <div key={bill.id} className="vintage-card p-6">
              <Link href={`/bill/${bill.id}`} className="block space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="vintage-title text-lg text-zinc-900 dark:text-zinc-100 flex-1">
                    {bill.name}
                  </h3>
                  <span
                    className={`flex-shrink-0 border-2 border-zinc-900 bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      bill.status === "Passed"
                        ? "text-green-700 dark:border-green-500 dark:text-green-400"
                        : bill.status === "Failed"
                        ? "text-red-700 dark:border-red-500 dark:text-red-400"
                        : "text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
                <div className="vintage-section border-t-2 border-zinc-900 dark:border-zinc-100 pt-3">
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {bill.summary[0]}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="vintage-label">
                      {bill.timeline.length} Events
                    </span>
                    {bill.timeline.length > 0 && (
                      <span className="vintage-label">
                        Updated {bill.timeline[bill.timeline.length - 1]?.date || "N/A"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        {bills.length === 0 && (
          <div className="vintage-card p-8 text-center">
            <p className="vintage-subtitle">
              No bills available at this time.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
