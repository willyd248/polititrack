"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Member } from "../../../data/types-members";
import { Politician } from "../../../data/politicians";
import { MoneyModule } from "../../../lib/mappers/fecToMoney";
import { LegislativeActivityItem } from "../../../lib/congressSponsorship";
import { Statement, Vote } from "../../../data/types";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Chip from "../../components/ui/Chip";
import Disclosure from "../../components/ui/Disclosure";
import InlineCitation from "../../components/ui/InlineCitation";
import Link from "next/link";
import { useReceipts } from "../../store/receipts-store";
import { useTopicLens } from "../../store/topic-lens-store";
import { useCompare } from "../../store/compare-store";
import { useSaved } from "../../store/saved-store";
import { stateNameToCode } from "../../../lib/stateConverter";

interface CandidateSearchResult {
  candidate_id: string;
  name: string;
  office: string | null;
  state: string | null;
  party: string | null;
  election_years: number[];
}

interface PoliticianPageClientProps {
  member: Member | null;
  useMockData: boolean;
  politicianForCompare: Politician;
  moneyData?: MoneyModule | null;
  sponsoredBills?: LegislativeActivityItem[] | null;
  cosponsoredBills?: LegislativeActivityItem[] | null;
  memberVotes?: Vote[];
  fecCandidateId?: string | null;
}

export default function PoliticianPageClient({
  member,
  useMockData,
  politicianForCompare,
  moneyData: initialMoneyData,
  sponsoredBills,
  cosponsoredBills,
  memberVotes = [],
  fecCandidateId,
}: PoliticianPageClientProps) {
  // Use politicianForCompare for all modules (Money/Votes remain mock for now)
  const politician = politicianForCompare;

  // Lazy-load FEC financial data client-side
  const [moneyData, setMoneyData] = useState<MoneyModule | null>(initialMoneyData || null);
  const [moneyLoading, setMoneyLoading] = useState(false);
  const [moneyError, setMoneyError] = useState(false);

  useEffect(() => {
    if (initialMoneyData || !fecCandidateId) return;
    let cancelled = false;
    setMoneyLoading(true);
    fetch(`/api/fec/money?fecId=${encodeURIComponent(fecCandidateId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.moneyData) {
          setMoneyData(data.moneyData);
        }
        if (data.error) setMoneyError(true);
      })
      .catch(() => {
        if (!cancelled) setMoneyError(true);
      })
      .finally(() => {
        if (!cancelled) setMoneyLoading(false);
      });
    return () => { cancelled = true; };
  }, [fecCandidateId, initialMoneyData]);

  // Use real money data if available, otherwise use mock data
  const displayMoneyData = moneyData || {
    totals: {
      raised: 0,
      spent: 0,
      cashOnHand: 0,
    },
    topContributors: politician.money.topContributors,
    industryBreakdown: [],
    sources: politician.money.sources,
  };
  
  // Get display values from member if available, otherwise from politician
  // For real members, always use member data; politicianForCompare is only for mock modules
  const displayName = member?.fullName || politician.name || "Unknown Member";
  const displayRole = member
    ? member.chamber === "House"
      ? "H"
      : "S"
    : politician.role;
  const displayState = member?.state || politician.state || "N/A";
  const displayDistrict = member?.district || politician.district;
  const displayParty = member?.party ?? "N/A";
  const displayCommittees = politician.committees; // Committees remain from mock data for now
  
  // Generate Key Takeaways from member data for real members
  const keyTakeaways = member && !useMockData
    ? [
        `${member.fullName || "This member"} represents ${stateNameToCode(member.state || "N/A")}${member.chamber === "House" && member.district ? `, D${member.district}` : ""}`,
        `Party: ${member.party || "N/A"}`,
        member.chamber === "House" 
          ? "H"
          : "S",
      ]
    : politician.keyTakeaways;

  const searchParams = useSearchParams();
  const { openReceipts } = useReceipts();
  const { selectedTopic } = useTopicLens();
  const { addPolitician, removePolitician, isSelected } = useCompare();
  const { toggleSavePolitician, isPoliticianSaved } = useSaved();
  
  // State for real statements from API
  const [realStatements, setRealStatements] = useState<Statement[] | null>(null);
  const [statementsLoading, setStatementsLoading] = useState(false);
  
  // State for health status
  const [healthStatus, setHealthStatus] = useState<{
    congress: "OK" | "Degraded" | "Down" | "Unknown";
    openfec: "OK" | "Degraded" | "Down" | "Unknown";
  } | null>(null);

  // Fetch real statements if member exists
  useEffect(() => {
    if (!member || !member.bioguideId) {
      setRealStatements(null);
      return;
    }
    
    setStatementsLoading(true);
    fetch(`/api/member/press?bioguideId=${encodeURIComponent(member.bioguideId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.statements && Array.isArray(data.statements)) {
          setRealStatements(data.statements);
        } else {
          setRealStatements([]);
        }
      })
      .catch((error) => {
        console.warn("Failed to fetch statements:", error);
        setRealStatements([]);
      })
      .finally(() => {
        setStatementsLoading(false);
      });
  }, [member]);
  
  // Fetch health status
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.sources && Array.isArray(data.sources)) {
          const congress = data.sources.find((s: any) => 
            s.name === "Congress.gov" || s.name?.toLowerCase().includes("congress")
          );
          const openfec = data.sources.find((s: any) => 
            s.name === "OpenFEC" || s.name?.toLowerCase().includes("fec")
          );
          setHealthStatus({
            congress: (congress?.status as "OK" | "Degraded" | "Down" | "Unknown") || "Unknown",
            openfec: (openfec?.status as "OK" | "Degraded" | "Down" | "Unknown") || "Unknown",
          });
        } else {
          setHealthStatus({
            congress: "Unknown",
            openfec: "Unknown",
          });
        }
      })
      .catch((error) => {
        console.warn("Failed to fetch health status:", error);
        setHealthStatus({
          congress: "Unknown",
          openfec: "Unknown",
        });
      });
  }, []);

  // Handle receipt deep link on initial page load only
  useEffect(() => {
    const receiptParam = searchParams.get("receipt");
    if (!receiptParam) return;

    if (receiptParam === "profile") {
      handleProfileReceipts();
    } else if (receiptParam === "money") {
      handleMoneyReceipts();
    } else if (receiptParam.startsWith("votes-")) {
      const topic = receiptParam.split("-")[1];
      if (topic) {
        handleVoteTopicReceipts(topic);
      }
    } else if (receiptParam === "statements") {
      handleStatementsReceipts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Create profile sources for real members
  const createProfileSources = (): Array<{
    title: string;
    publisher?: string;
    date?: string;
    excerpt?: string;
    url: string;
  }> => {
    if (!member) return [];
    
    const sources = [
      {
        title: "Member Profile",
        publisher: "Congress.gov",
        date: new Date().getFullYear().toString(),
        excerpt: `Official member profile and biographical information for ${member.fullName}.`,
        url: `https://www.congress.gov/member/${member.bioguideId}/${member.bioguideId}`,
      },
    ];
    
    // Add FEC-ID linkage source if fecCandidateId exists
    if (member.fecCandidateId) {
      sources.push({
        title: "FEC Candidate ID Linkage",
        publisher: "United States Congress Legislators Dataset",
        url: "https://github.com/unitedstates/congress-legislators",
        excerpt: `FEC candidate ID ${member.fecCandidateId} linked via the public unitedstates/congress-legislators dataset.`,
        date: new Date().getFullYear().toString(),
      });
    }
    
    // Add official biography URL if available (Congress.gov structure)
    if (member.bioguideId) {
      sources.push({
        title: "Official Biography",
        publisher: "U.S. Congress",
        date: new Date().getFullYear().toString(),
        excerpt: `Official biographical information and background for ${member.fullName}.`,
        url: `https://www.congress.gov/member/${member.bioguideId}/${member.bioguideId}`,
      });
    }
    
    return sources;
  };

  const handleProfileReceipts = () => {
    if (!member) return;
    openReceipts({
      heading: "Profile Sources",
      subheading: `Sources for ${member.fullName}`,
      sources: createProfileSources(),
    });
  };

  const handleMoneyReceipts = () => {
    openReceipts({
      heading: "Campaign Finance Sources",
      subheading: `Financial data for ${displayName}`,
      sources: displayMoneyData.sources,
    });
  };

  const handleIndustryBreakdownReceipts = () => {
    openReceipts({
      heading: "Industry Breakdown Sources",
      subheading: `Industry contribution analysis for ${politician.name}`,
      sources: politician.money.sources,
    });
  };

  const handleVoteTopicReceipts = (topic: string) => {
    const topicVotes = politician.votes.votes.filter((v) => v.topic === topic);
    const topicSources = topicVotes.flatMap((v) => v.sources);
    const uniqueSources = Array.from(
      new Map(topicSources.map((s) => [s.title, s])).values()
    );
    openReceipts({
      heading: "Voting Record Sources",
      subheading: `${topic} votes for ${politician.name}`,
      sources: uniqueSources,
    });
  };

  const handleStatementReceipts = (statementId: string) => {
    // Check real statements first, then mock statements
    const statementsToUse = realStatements && realStatements.length > 0 
      ? realStatements 
      : politician.statements.statements;
    
    const statement = statementsToUse.find((s) => s.id === statementId);
    if (statement) {
      openReceipts({
        heading: "Statement Sources",
        subheading: `Sources for: ${statement.title}`,
        sources: statement.sources,
      });
    }
  };

  const handleVotesReceipts = () => {
    // If we have real legislative activity data, use those sources
    if (sponsoredBills || cosponsoredBills) {
      const allSources: Array<{ title: string; publisher?: string; date?: string; url?: string; excerpt?: string }> = [];
      
      if (sponsoredBills) {
        sponsoredBills.forEach((bill) => {
          allSources.push(...bill.sources);
        });
      }
      
      if (cosponsoredBills) {
        cosponsoredBills.forEach((bill) => {
          allSources.push(...bill.sources);
        });
      }
      
      // Deduplicate sources by URL
      const uniqueSources = Array.from(
        new Map(allSources.filter(s => s.url).map((s) => [s.url, s])).values()
      );
      
      // Add Congress.gov API endpoint sources
      uniqueSources.push({
        title: "Congress.gov API - Member Bills",
        publisher: "Congress.gov",
        excerpt: `API endpoint for bills sponsored and cosponsored by ${displayName}.`,
        url: `https://api.congress.gov/v3/bill?sponsorBioguideId=${member?.bioguideId || ""}`,
      });
      
      openReceipts({
        heading: "Legislative Activity Sources",
        subheading: `Sponsored and cosponsored bills for ${displayName}`,
        sources: uniqueSources,
      });
    } else {
      // Fall back to mock vote sources
      openReceipts({
        heading: "Voting Record Sources",
        subheading: `Vote history for ${politician.name}`,
        sources: uniqueVoteSources,
      });
    }
  };

  const handleRollCallVotesReceipts = () => {
    if (memberVotes && memberVotes.length > 0) {
      const allVoteSources = memberVotes.flatMap((vote) => vote.sources);
      const uniqueSources = Array.from(
        new Map(allVoteSources.filter(s => s.url).map((s) => [s.url, s])).values()
      );
      
      openReceipts({
        heading: "Roll-Call Vote Sources",
        subheading: `Roll-call vote records for ${displayName}`,
        sources: uniqueSources,
      });
    }
  };

  const handleStatementsReceipts = () => {
    // Use real statements if available, otherwise use mock statements
    const statementsToUse = realStatements && realStatements.length > 0 
      ? realStatements 
      : politician.statements.statements;
    
    const allStatementSources = statementsToUse.flatMap((s) => s.sources);
    const uniqueStatementSources = Array.from(
      new Map(allStatementSources.map((s) => [s.title || s.url, s])).values()
    );
    openReceipts({
      heading: "Public Statements Sources",
      subheading: `Statements and speeches by ${displayName}`,
      sources: uniqueStatementSources,
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Group votes by topic, filter if topic lens is active
  const votesByTopic = politician.votes.votes
    .filter((vote) => !selectedTopic || vote.topic === selectedTopic)
    .reduce(
      (acc, vote) => {
        if (!acc[vote.topic]) {
          acc[vote.topic] = [];
        }
        acc[vote.topic].push(vote);
        return acc;
      },
      {} as Record<string, typeof politician.votes.votes>
    );

  // Aggregate all vote sources for the votes module
  const allVoteSources = politician.votes.votes.flatMap((vote) => vote.sources);
  const uniqueVoteSources = Array.from(
    new Map(allVoteSources.map((s) => [s.title, s])).values()
  );

  return (
    <div className="relative">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] w-40 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
        <nav className="sticky top-24 p-4 space-y-1">
          <button
            onClick={() => scrollToSection("overview")}
            className="block w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all duration-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection("money")}
            className="block w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all duration-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Money
          </button>
          <button
            onClick={() => scrollToSection("votes")}
            className="block w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all duration-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Votes
          </button>
          <button
            onClick={() => scrollToSection("statements")}
            className="block w-full text-left px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-all duration-200 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Statements
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-40 space-y-12">
        {/* Dev-only Data Debug Section */}
        {process.env.NODE_ENV === "development" && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Data Debug (Dev Only)
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-300">
                <div>
                  <span className="font-medium">useMockData:</span> {useMockData ? "true" : "false"}
                </div>
                <div>
                  <span className="font-medium">bioguideId:</span> {member?.bioguideId || "N/A"}
                </div>
                <div>
                  <span className="font-medium">fecCandidateId:</span> {member?.fecCandidateId ? "✓" : "✗"}
                </div>
                <div>
                  <span className="font-medium">lisId:</span> {member?.lisId ? "✓" : "✗"}
                </div>
                <div>
                  <span className="font-medium">sponsoredBills:</span> {sponsoredBills?.length || 0}
                </div>
                <div>
                  <span className="font-medium">cosponsoredBills:</span> {cosponsoredBills?.length || 0}
                </div>
                <div>
                  <span className="font-medium">memberVotes:</span> {memberVotes?.length || 0}
                </div>
                <div>
                  <span className="font-medium">realStatements:</span> {realStatements?.length || 0}
                </div>
              </div>
            </div>
          </Card>
        )}

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

        {/* Header - Vintage Blocky Design */}
        <div className="vintage-card p-6">
          <div className="vintage-header">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="vintage-title text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </h1>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="vintage-stat-box">
                    <div className="vintage-label">Role</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {member && !useMockData
                        ? member.chamber === "House"
                          ? "H"
                          : "S"
                        : displayRole?.toUpperCase().slice(0, 1) || "N/A"}
                    </div>
                  </div>
                  <div className="vintage-stat-box">
                    <div className="vintage-label">State</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {stateNameToCode(member?.state || displayState || "N/A")}
                    </div>
                  </div>
                  {member?.district && (
                    <div className="vintage-stat-box">
                      <div className="vintage-label">District</div>
                      <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                        {member.district}
                      </div>
                    </div>
                  )}
                  <div className="vintage-stat-box">
                    <div className="vintage-label">Party</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {member?.party || displayParty || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
              {member && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleProfileReceipts}
                  className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                >
                  Sources
                </Button>
              )}
            </div>
          </div>
          
          {displayCommittees.length > 0 && (
            <div className="vintage-section">
              <div className="vintage-subtitle mb-2">Committee Assignments</div>
              <div className="flex flex-wrap gap-2">
                {displayCommittees.map((committee) => (
                  <span
                    key={committee}
                    className="border-2 border-zinc-900 bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:border-zinc-100 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    {committee}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {useMockData && (
            <div className="vintage-section border-orange-500 dark:border-orange-400">
              <div className="border-2 border-orange-500 bg-orange-50 px-4 py-2 dark:border-orange-400 dark:bg-orange-900/50">
                <p className="text-sm font-bold uppercase text-orange-700 dark:text-orange-300">
                  Mock Data Enabled
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Layer A: Key Takeaways - Vintage Design */}
        <section id="overview">
          <div className="vintage-card p-6">
            <div className="vintage-header">
              <h2 className="vintage-title text-zinc-900 dark:text-zinc-100">
                Key Takeaways
              </h2>
            </div>
            <ul className="mb-6 space-y-2">
              {keyTakeaways.map((takeaway, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                  <span className="flex-1">{takeaway}</span>
                  {/* Add citation to first 2 takeaways only */}
                  {index < 2 && (
                    <span className="ml-2 flex-shrink-0">
                      <InlineCitation
                        compact
                        data={{
                          heading: "Key Takeaway Sources",
                          subheading: `Sources for: ${takeaway}`,
                          sources: [
                            {
                              title: "Congressional Research Service Analysis",
                              publisher: "CRS",
                              date: "2024-03-01",
                              excerpt: `Supporting data and analysis for this key takeaway about ${politician.name}.`,
                              url: "https://www.crs.gov/",
                            },
                            {
                              title: "Official Records",
                              publisher: "U.S. Congress",
                              date: "2024-02-15",
                              excerpt: `Official records and documentation supporting this claim.`,
                              url: "https://www.congress.gov/",
                            },
                          ],
                        }}
                      />
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mb-6 flex items-start justify-between gap-3">
              <p className="flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {politician.whyThisMatters}
              </p>
              <InlineCitation
                compact
                data={{
                  heading: "Why This Matters Sources",
                  subheading: `Context and sources for understanding ${politician.name}'s significance`,
                  sources: [
                    {
                      title: "Civic Engagement Research",
                      publisher: "Nonpartisan Research Institute",
                      date: "2024-02-20",
                      excerpt: `Research on the importance of transparency in political funding and voting records for democratic accountability.`,
                      url: "https://example.com/research",
                    },
                    {
                      title: "Transparency Best Practices",
                      publisher: "Good Governance Foundation",
                      date: "2024-01-10",
                      excerpt: `Best practices for understanding how campaign finance and voting records inform policy decisions.`,
                      url: "https://example.com/best-practices",
                    },
                  ],
                }}
              />
            </div>
            <div className="vintage-section">
              <div className="vintage-subtitle mb-3">Key Metrics</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="vintage-stat-box">
                  <div className="vintage-label">Top Donor</div>
                  <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                    {politician.metrics.topDonorCategory}
                  </div>
                </div>
                <div className="vintage-stat-box">
                  <div className="vintage-label">Votes</div>
                  <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                    {politician.metrics.votesThisYear}
                  </div>
                </div>
                <div className="vintage-stat-box">
                  <div className="vintage-label">Bills</div>
                  <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                    {politician.metrics.billsSponsored}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Layer B: Money Module - Vintage Design */}
        <section id="money">
          <div className="vintage-card p-6">
            <div className="vintage-header">
              <div className="flex items-start justify-between">
                <h2 className="vintage-title text-zinc-900 dark:text-zinc-100">
                  Campaign Finance
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMoneyReceipts}
                  className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                >
                  Sources
                </Button>
              </div>
            </div>
            
            {/* Health Status Banner for OpenFEC */}
            {healthStatus && (healthStatus.openfec === "Down" || healthStatus.openfec === "Degraded") && (
              <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/50">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <span className="font-semibold">OpenFEC currently unavailable.</span> Campaign finance data may not be up to date.
                </p>
              </div>
            )}
            
            {/* Real Money Totals - Vintage Stat Boxes */}
            {moneyData && (
              <div className="vintage-section">
                <div className="vintage-subtitle mb-3">Financial Totals</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="vintage-stat-box">
                    <div className="vintage-label">Raised</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {moneyData.totals.raised >= 1000000
                        ? `$${(moneyData.totals.raised / 1000000).toFixed(2)}M`
                        : moneyData.totals.raised >= 1000
                        ? `$${(moneyData.totals.raised / 1000).toFixed(0)}K`
                        : `$${moneyData.totals.raised.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="vintage-stat-box">
                    <div className="vintage-label">Spent</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {moneyData.totals.spent >= 1000000
                        ? `$${(moneyData.totals.spent / 1000000).toFixed(2)}M`
                        : moneyData.totals.spent >= 1000
                        ? `$${(moneyData.totals.spent / 1000).toFixed(0)}K`
                        : `$${moneyData.totals.spent.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="vintage-stat-box">
                    <div className="vintage-label">Cash on Hand</div>
                    <div className="vintage-value text-zinc-900 dark:text-zinc-100">
                      {moneyData.totals.cashOnHand >= 1000000
                        ? `$${(moneyData.totals.cashOnHand / 1000000).toFixed(2)}M`
                        : moneyData.totals.cashOnHand >= 1000
                        ? `$${(moneyData.totals.cashOnHand / 1000).toFixed(0)}K`
                        : `$${moneyData.totals.cashOnHand.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Finance not available messages */}
            {member && !member.fecCandidateId && !moneyData && (
              <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Finance data not linked yet. FEC candidate ID mapping needed.
                </p>
              </div>
            )}
            {member && member.fecCandidateId && !moneyData && (
              <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  FEC totals not available yet. Campaign finance data may still be processing or the candidate may not have filed reports for the current cycle.
                </p>
              </div>
            )}
            
            {/* Dev-only helper: Link FEC Candidate ID */}
            {process.env.NODE_ENV === "development" && member && !member.fecCandidateId && (
              <FecCandidateSearchHelper member={member} />
            )}
            
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {moneyData 
                ? "Campaign finance data from the Federal Election Commission."
                : politician.money.moduleSummary
              }
            </p>

            {/* Layer C: Detailed Content in Disclosure - Vintage Styled */}
            <div className="vintage-section">
              <div className="border-2 border-zinc-900 dark:border-zinc-100">
              <Disclosure title="Top Contributors" defaultOpen={true}>
                {moneyData && moneyData.topContributors.length > 0 ? (
                  <ul className="space-y-2">
                    {moneyData.topContributors.map((contributor, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800"
                      >
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {contributor.name}
                        </span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {contributor.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : moneyData ? (
                  <div className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <p>Contributor data not available through the OpenFEC API.</p>
                    <p className="mt-1 text-xs">The FEC releases this data, but detailed contributor aggregations may not be accessible via API endpoints yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {displayMoneyData.topContributors.map((contributor, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800"
                      >
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {contributor.name}
                        </span>
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {contributor.amount}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Disclosure>

              <Disclosure title="Industry Breakdown">
                {moneyData && moneyData.industryBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {moneyData.industryBreakdown.map((industry, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">
                            {industry.industry}
                          </span>
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {industry.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full bg-zinc-600 dark:bg-zinc-400 transition-all duration-300"
                            style={{ width: `${industry.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMoneyReceipts}
                      >
                        View receipts
                      </Button>
                    </div>
                  </div>
                ) : moneyData ? (
                  <div className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    <p>Industry breakdown data not available through the OpenFEC API.</p>
                    <p className="mt-1 text-xs">The FEC releases this data, but detailed industry aggregations may not be accessible via API endpoints yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayMoneyData.industryBreakdown.length > 0 ? (
                      <>
                        {displayMoneyData.industryBreakdown.map((industry, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {industry.industry}
                              </span>
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {industry.percentage}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className="h-full bg-zinc-400 dark:bg-zinc-600"
                                style={{ width: `${industry.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleIndustryBreakdownReceipts}
                          >
                            View receipts
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        Industry breakdown data not available.
                      </div>
                    )}
                  </div>
                )}
              </Disclosure>
              </div>
            </div>
          </div>
        </section>

        {/* Layer B: Legislative Activity Module (Votes/Legislative Activity) - Vintage Design */}
        <section id="votes">
          <div className="vintage-card p-6">
            <div className="vintage-header">
              <div className="flex items-start justify-between">
                <h2 className="vintage-title text-zinc-900 dark:text-zinc-100">
                  {sponsoredBills || cosponsoredBills ? "Legislative Activity" : "Voting Record"}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleVotesReceipts}
                  className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                >
                  Sources
                </Button>
              </div>
            </div>
            
            {/* Health Status Banner for Congress.gov */}
            {healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") && (
              <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/50">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <span className="font-semibold">Congress.gov currently unavailable.</span> Legislative activity data may not be up to date.
                </p>
              </div>
            )}
            
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {sponsoredBills || cosponsoredBills
                ? `Bills sponsored and cosponsored by ${displayName} in the 118th Congress.`
                : politician.votes.moduleSummary
              }
            </p>

            {/* Real Legislative Activity (Sponsored/Cosponsored Bills) */}
            {member && !useMockData ? (
              (sponsoredBills && sponsoredBills.length > 0) || (cosponsoredBills && cosponsoredBills.length > 0) ? (
                <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {/* Sponsored Bills */}
                  {sponsoredBills && sponsoredBills.length > 0 && (
                    <Disclosure title="Sponsored Bills" defaultOpen={true}>
                      <div className="space-y-2">
                        {sponsoredBills.map((bill) => {
                          const isHighlighted = selectedTopic && bill.topic === selectedTopic;
                          return (
                            <div
                              key={bill.id}
                              className={`flex items-start justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800 ${
                                isHighlighted ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 -ml-2 pl-2 rounded" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/bill/${bill.id}`}
                                  className="text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                                >
                                  {bill.title}
                                </Link>
                                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                                  {bill.type} {bill.number} • {bill.latestAction || "No recent action"}
                                  {bill.updateDate && ` • ${bill.updateDate}`}
                                  {isHighlighted && (
                                    <>
                                      {" • "}
                                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                        {selectedTopic}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Disclosure>
                  )}

                  {/* Cosponsored Bills */}
                  {cosponsoredBills && cosponsoredBills.length > 0 && (
                    <Disclosure title="Cosponsored Bills">
                      <div className="space-y-2">
                        {cosponsoredBills.map((bill) => {
                          const isHighlighted = selectedTopic && bill.topic === selectedTopic;
                          return (
                            <div
                              key={bill.id}
                              className={`flex items-start justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800 ${
                                isHighlighted ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 -ml-2 pl-2 rounded" : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/bill/${bill.id}`}
                                  className="text-sm font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                                >
                                  {bill.title}
                                </Link>
                                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                                  {bill.type} {bill.number} • {bill.latestAction || "No recent action"}
                                  {bill.updateDate && ` • ${bill.updateDate}`}
                                  {isHighlighted && (
                                    <>
                                      {" • "}
                                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                        {selectedTopic}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Disclosure>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                        {healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") ? (
                          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            <span className="font-semibold">Congress.gov data temporarily unavailable.</span> Legislative activity data may not be up to date.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                              No legislative activity found for this member in the current dataset.
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              {sponsoredBills === null && cosponsoredBills === null
                                ? "Data fetch may have failed. Check server logs for details."
                                : "The member may not have sponsored or cosponsored bills in the 118th Congress, or the data may still be processing."}
                            </p>
                          </div>
                        )}
                      </div>
                    )
            ) : (
              // Mock votes fallback for non-real members
              <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {Object.entries(votesByTopic).map(([topic, votes]) => (
                  <Disclosure key={topic} title={topic}>
                    <div className="space-y-2">
                      {votes.map((vote, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {vote.description}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                              {vote.date}
                            </p>
                          </div>
                          <span
                            className={`ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
                              vote.position === "Yes"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : vote.position === "No"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {vote.position}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteTopicReceipts(topic)}
                        >
                          View receipts
                        </Button>
                      </div>
                    </div>
                  </Disclosure>
                ))}
              </div>
            )}

            {/* Mock Votes (fallback when no real legislative activity - only for mock data) */}
            {(!member || useMockData) && !sponsoredBills && !cosponsoredBills && (
              <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {Object.entries(votesByTopic).map(([topic, votes]) => (
                  <Disclosure key={topic} title={topic}>
                    <div className="space-y-2">
                      {votes.map((vote, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between border-b border-zinc-100 pb-2 last:border-b-0 dark:border-zinc-800"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {vote.description}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                              {vote.date}
                            </p>
                          </div>
                          <span
                            className={`ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
                              vote.position === "Yes"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : vote.position === "No"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {vote.position}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoteTopicReceipts(topic)}
                        >
                          View receipts
                        </Button>
                      </div>
                    </div>
                  </Disclosure>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Roll-Call Votes Module (for real members) - Vintage Design */}
        {member && !useMockData && (
          <section id="roll-call-votes">
            <div className="vintage-card p-6">
              <div className="vintage-header">
                <div className="flex items-start justify-between">
                  <h2 className="vintage-title text-zinc-900 dark:text-zinc-100">
                    Roll-Call Votes
                  </h2>
                  {memberVotes && memberVotes.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRollCallVotesReceipts}
                      className="border-2 border-zinc-900 font-bold uppercase tracking-wider dark:border-zinc-100"
                    >
                      Sources
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Health Status Banner for Congress.gov */}
              {healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") && (
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/50">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <span className="font-semibold">Congress.gov currently unavailable.</span> Roll-call vote data may not be up to date.
                  </p>
                </div>
              )}
              
              <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Recent roll-call votes cast by {displayName} in the 118th Congress.
              </p>

              {memberVotes && memberVotes.length > 0 ? (
                <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {memberVotes.slice(0, 10).map((vote) => {
                    const isHighlighted = selectedTopic && vote.topic === selectedTopic;
                    return (
                      <div
                        key={vote.id}
                        className={`flex items-start justify-between border-b border-zinc-100 pb-3 pt-3 first:pt-0 last:border-b-0 dark:border-zinc-800 ${
                          isHighlighted
                            ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30 -ml-2 pl-2 rounded"
                            : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {vote.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <span>{vote.date}</span>
                            {isHighlighted && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {selectedTopic}
                                </span>
                              </>
                            )}
                          </div>
                          {vote.sources && vote.sources.length > 0 && (
                            <div className="mt-2">
                              <InlineCitation
                                compact
                                data={{
                                  heading: "Vote Sources",
                                  subheading: vote.description,
                                  sources: vote.sources,
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <span
                          className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            vote.position === "Yes"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : vote.position === "No"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {vote.position}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") ? (
                <div className="py-8 text-center">
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold">Congress.gov data temporarily unavailable.</span> Roll-call vote data may not be up to date.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    No roll-call votes found for this member in the current dataset.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Layer B: Statements Module - Vintage Design */}
        <section id="statements">
          <div className="vintage-card p-6">
            <div className="vintage-header">
              <div className="flex items-start justify-between">
                <h2 className="vintage-title text-zinc-900 dark:text-zinc-100">
                  Public Statements
                </h2>
              {(realStatements && realStatements.length > 0) || politician.statements.statements.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStatementsReceipts}
                >
                  View receipts
                </Button>
              ) : null}
              </div>
            </div>
            
            {/* Health Status Banner for Congress.gov */}
            {healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") && (
              <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800 dark:bg-orange-900/50">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <span className="font-semibold">Congress.gov currently unavailable.</span> Statement data may not be up to date.
                </p>
              </div>
            )}
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {politician.statements.moduleSummary}
            </p>

            {/* Layer C: Detailed Content in Disclosure */}
            {statementsLoading ? (
              <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading statements...
              </div>
            ) : realStatements && realStatements.length > 0 ? (
              // Show real statements if available
              <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {realStatements.map((statement) => {
                  const isHighlighted = selectedTopic && statement.topic === selectedTopic;
                  return (
                    <div
                      key={statement.id}
                      className={isHighlighted ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100" : ""}
                    >
                      <Disclosure title={statement.title}>
                        <div className={`space-y-3 ${isHighlighted ? "bg-zinc-50/50 dark:bg-zinc-900/30 -m-2 p-2 rounded" : ""}`}>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                            <span>{statement.date}</span>
                            {statement.sourceType && (
                              <>
                                <span>•</span>
                                <span>{statement.sourceType}</span>
                              </>
                            )}
                            {isHighlighted && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {selectedTopic}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {statement.text}
                          </p>
                          {statement.sources && statement.sources.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatementReceipts(statement.id)}
                            >
                              View receipts
                            </Button>
                          )}
                        </div>
                      </Disclosure>
                    </div>
                  );
                })}
              </div>
            ) : member && !useMockData ? (
              // Show calm message for real members without statements
              <div className="py-8 text-center">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {healthStatus && (healthStatus.congress === "Down" || healthStatus.congress === "Degraded") ? (
                    <>
                      <span className="font-semibold">Congress.gov data temporarily unavailable.</span> Official statements feed may not be up to date.
                    </>
                  ) : (
                    "Official statements feed coming soon — we'll prioritize primary sources."
                  )}
                </p>
              </div>
            ) : (
              // Fall back to mock statements for mock data
              <div className="space-y-0 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {politician.statements.statements.map((statement) => {
                  const isHighlighted = selectedTopic && statement.topic === selectedTopic;
                  return (
                    <div
                      key={statement.id}
                      className={isHighlighted ? "border-l-4 border-l-zinc-900 dark:border-l-zinc-100" : ""}
                    >
                      <Disclosure title={statement.title}>
                        <div className={`space-y-3 ${isHighlighted ? "bg-zinc-50/50 dark:bg-zinc-900/30 -m-2 p-2 rounded" : ""}`}>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                            <span>{statement.date}</span>
                            {statement.sourceType && (
                              <>
                                <span>•</span>
                                <span>{statement.sourceType}</span>
                              </>
                            )}
                            {isHighlighted && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                  {selectedTopic}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {statement.text}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatementReceipts(statement.id)}
                          >
                            View receipts
                          </Button>
                        </div>
                      </Disclosure>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Dev-only helper component for searching and linking FEC candidate IDs
 */
function FecCandidateSearchHelper({ member }: { member: Member }) {
  const [searchResults, setSearchResults] = useState<CandidateSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Pre-fill search values from member data
  const office = member.chamber === "House" ? "H" : "S"; // H = House, S = Senate
  
  // Convert state to code if needed (e.g., "California" -> "CA")
  // Note: member.state should already be a code, but convert just in case
  const stateCode = member.state.length === 2 
    ? member.state.toUpperCase() 
    : member.state; // If not 2 chars, might already be a code or full name - API will handle it
  
  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const params = new URLSearchParams({
        q: member.fullName,
        state: stateCode,
        office: office,
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[FEC Search] Searching for:`, {
          name: member.fullName,
          state: member.state,
          chamber: member.chamber,
          office: office,
        });
      }
      
      const response = await fetch(`/api/fec/search-candidates?${params.toString()}`);
      const data = await response.json();
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[FEC Search] Results:`, data.results?.length || 0, "candidates found");
      }
      
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Failed to search FEC candidates:", error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleCopyId = async (candidateId: string) => {
    try {
      await navigator.clipboard.writeText(candidateId);
      setCopiedId(candidateId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy candidate ID:", error);
    }
  };
  
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
      <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
        Link FEC Candidate ID
      </h3>
      <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
        No FEC ID found from automatic sources. Use search below to find and add a manual override.
      </p>
      
      {/* Search UI */}
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={member.fullName}
            readOnly
            className="flex-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-blue-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Searching: {member.fullName} ({member.state}, {member.chamber})
        </p>
      </div>
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-2 space-y-2">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
            Results ({searchResults.length}):
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.candidate_id}
                className="flex items-center justify-between rounded border border-blue-200 bg-white px-2 py-1.5 text-xs dark:border-blue-700 dark:bg-zinc-900"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {result.name}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {result.candidate_id} • {result.office || "N/A"} • {result.state || "N/A"}
                    {result.party && ` • ${result.party}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyId(result.candidate_id)}
                  className="ml-2 flex-shrink-0 text-xs"
                >
                  {copiedId === result.candidate_id ? "Copied!" : "Copy ID"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <p className="text-xs text-blue-600 dark:text-blue-400">
        No FEC ID found from automatic sources. Use search above to find and add a manual override in <code className="rounded bg-blue-100 px-1 py-0.5 text-xs dark:bg-blue-900/50">data/fec-mapping.ts</code>
      </p>
    </div>
  );
}

