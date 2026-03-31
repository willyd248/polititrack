"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MemberPhoto } from "../components/MemberPhoto";
import { Member } from "../../data/types-members";
import { Politician } from "../../data/politicians";
import { useCompare } from "../store/compare-store";
import { memberToPolitician } from "../../lib/mappers/memberToPolitician";
import { stateNameToCode } from "../../lib/stateConverter";

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const PAGE_SIZE = 48;

function partyColor(party: string): string {
  if (party === "D") return "#1B2A4A";
  if (party === "R") return "#8B2332";
  return "#75777F";
}

function partyLabel(party: string): string {
  if (party === "D") return "Democrat";
  if (party === "R") return "Republican";
  if (party === "I") return "Independent";
  return party || "N/A";
}

interface MembersClientProps {
  members: Member[] | null;
  useMockData: boolean;
  mockPoliticians: Politician[];
}

export default function MembersClient({
  members,
  useMockData,
  mockPoliticians,
}: MembersClientProps) {
  const [search, setSearch] = useState("");
  const [chamber, setChamber] = useState<"All" | "House" | "Senate">("All");
  const [party, setParty] = useState<"All" | "D" | "R" | "I">("All");
  const [state, setState] = useState("All");
  const [sortBy, setSortBy] = useState<"name" | "state">("name");
  const [page, setPage] = useState(1);

  const { addPolitician, removePolitician, isSelected } = useCompare();

  const allMembers = members || [];

  const filtered = useMemo(() => {
    let result = allMembers;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.fullName || "").toLowerCase().includes(q) ||
          (m.firstName || "").toLowerCase().includes(q) ||
          (m.lastName || "").toLowerCase().includes(q)
      );
    }

    if (chamber !== "All") {
      result = result.filter((m) => m.chamber === chamber);
    }

    if (party !== "All") {
      result = result.filter((m) => m.party === party);
    }

    if (state !== "All") {
      result = result.filter(
        (m) => stateNameToCode(m.state || "") === state || m.state === state
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "state") {
        const stateA = stateNameToCode(a.state || "");
        const stateB = stateNameToCode(b.state || "");
        const cmp = stateA.localeCompare(stateB);
        if (cmp !== 0) return cmp;
      }
      return (a.lastName || "").localeCompare(b.lastName || "");
    });

    return result;
  }, [allMembers, search, chamber, party, state, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageMembers = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Reset to page 1 when filters change
  const updateFilter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setPage(1);
  };

  if (allMembers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Members of Congress</h1>
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">
            {useMockData
              ? "Member data is temporarily unavailable. Please try again later."
              : "Loading members..."}
          </p>
        </div>
      </div>
    );
  }

  const senateCount = allMembers.filter((m) => m.chamber === "Senate").length;
  const houseCount = allMembers.filter((m) => m.chamber === "House").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
          119th Congress
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          Members of Congress
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {allMembers.length} members — {senateCount} Senators, {houseCount} Representatives
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#041534] focus:outline-none focus:ring-1 focus:ring-[#041534]"
          />
        </div>

        {/* Chamber */}
        <select
          value={chamber}
          onChange={(e) =>
            updateFilter(setChamber, e.target.value as "All" | "House" | "Senate")
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#041534] focus:outline-none focus:ring-1 focus:ring-[#041534]"
        >
          <option value="All">All Chambers</option>
          <option value="Senate">Senate</option>
          <option value="House">House</option>
        </select>

        {/* Party */}
        <select
          value={party}
          onChange={(e) =>
            updateFilter(setParty, e.target.value as "All" | "D" | "R" | "I")
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#041534] focus:outline-none focus:ring-1 focus:ring-[#041534]"
        >
          <option value="All">All Parties</option>
          <option value="D">Democrat</option>
          <option value="R">Republican</option>
          <option value="I">Independent</option>
        </select>

        {/* State */}
        <select
          value={state}
          onChange={(e) => updateFilter(setState, e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#041534] focus:outline-none focus:ring-1 focus:ring-[#041534]"
        >
          <option value="All">All States</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) =>
            updateFilter(setSortBy, e.target.value as "name" | "state")
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#041534] focus:outline-none focus:ring-1 focus:ring-[#041534]"
        >
          <option value="name">Sort: Name</option>
          <option value="state">Sort: State</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">
        Showing {(safePage - 1) * PAGE_SIZE + 1}–
        {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
        members
      </p>

      {/* Member Grid */}
      {pageMembers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageMembers.map((m) => {
            const pol = memberToPolitician(m);
            const mParty = m.party ?? "";
            const compared = isSelected(pol.id);
            return (
              <div
                key={m.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <MemberPhoto
                    bioguideId={m.bioguideId}
                    name={m.fullName || "?"}
                    size={40}
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                    fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    fallbackStyle={{ background: partyColor(mParty) }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/politician/${m.bioguideId}`}
                      className="block text-sm font-semibold text-gray-900 hover:text-[#041534] truncate"
                    >
                      {m.fullName || "Unknown"}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.chamber} · {stateNameToCode(m.state || "")}
                      {m.district ? ` D-${m.district}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: partyColor(mParty) }}
                  >
                    {partyLabel(mParty)}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() =>
                      compared ? removePolitician(pol.id) : addPolitician(pol)
                    }
                    className={`rounded px-2 py-1 text-[10px] font-semibold transition-all ${
                      compared
                        ? "bg-[#A63744] text-white"
                        : "border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {compared ? "~" : "Compare"}
                  </button>
                  <Link
                    href={`/politician/${m.bioguideId}`}
                    className="rounded px-2 py-1 text-[10px] font-semibold border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-500">
            No members match your filters. Try adjusting your search.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {/* Page numbers */}
          {(() => {
            const pages: (number | "...")[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (safePage > 3) pages.push("...");
              for (
                let i = Math.max(2, safePage - 1);
                i <= Math.min(totalPages - 1, safePage + 1);
                i++
              ) {
                pages.push(i);
              }
              if (safePage < totalPages - 2) pages.push("...");
              pages.push(totalPages);
            }

            return pages.map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-2 text-sm text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    p === safePage
                      ? "bg-[#041534] text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            );
          })()}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
