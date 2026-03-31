"use client";

import { useState } from "react";
import Link from "next/link";
import { Member } from "../../data/types-members";
import { MemberPhoto } from "./MemberPhoto";
import { useCompare } from "../store/compare-store";
import { memberToPolitician } from "../../lib/mappers/memberToPolitician";

interface MemberPlayerCardsProps {
  members: Member[];
}

const PAGE_SIZE = 24;

function formatYearsInOffice(member: Member): string {
  if (member.yearsInOffice != null) {
    return member.yearsInOffice < 1 ? "<1 yr" : `${member.yearsInOffice} yr${member.yearsInOffice !== 1 ? "s" : ""}`;
  }
  return "—";
}

function getPartyLabel(party: string | null | undefined): string {
  if (!party) return "—";
  const p = party.toUpperCase().trim();
  if (p === "D" || p === "DEM") return "Democrat";
  if (p === "R" || p === "REP") return "Republican";
  if (p === "I" || p === "IND") return "Independent";
  return party;
}

function getPartyAccentColor(party: string | null | undefined): string {
  if (!party) return "#75777F";
  const p = party.toUpperCase().trim();
  if (p === "D" || p === "DEM") return "#1B2A4A";
  if (p === "R" || p === "REP") return "#8B2332";
  return "#75777F";
}

export default function MemberPlayerCards({ members }: MemberPlayerCardsProps) {
  const [selectedChamber, setSelectedChamber] = useState<"House" | "Senate">("House");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { addPolitician, removePolitician, isSelected } = useCompare();

  const chamberMembers = members.filter((m) => m.chamber === selectedChamber);

  const sortedMembers = [...chamberMembers].sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    if (selectedChamber === "House" && a.district && b.district) {
      return parseInt(a.district, 10) - parseInt(b.district, 10);
    }
    return a.fullName.localeCompare(b.fullName);
  });

  const visibleMembers = sortedMembers.slice(0, visibleCount);
  const hasMore = visibleCount < sortedMembers.length;

  const handleChamberChange = (chamber: "House" | "Senate") => {
    setSelectedChamber(chamber);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-6">
      {/* Chamber Toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center rounded bg-[#EDEEEF] p-0.5">
          <button
            onClick={() => handleChamberChange("House")}
            className={`rounded px-5 py-2 text-sm font-semibold transition-all ${
              selectedChamber === "House"
                ? "bg-[#041534] text-white shadow-sm"
                : "text-[#75777F] hover:text-[#191C1D]"
            }`}
          >
            House
          </button>
          <button
            onClick={() => handleChamberChange("Senate")}
            className={`rounded px-5 py-2 text-sm font-semibold transition-all ${
              selectedChamber === "Senate"
                ? "bg-[#041534] text-white shadow-sm"
                : "text-[#75777F] hover:text-[#191C1D]"
            }`}
          >
            Senate
          </button>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleMembers.map((member) => {
          const politician = memberToPolitician(member);
          const isSelectedMember = isSelected(politician.id);
          const accentColor = getPartyAccentColor(member.party);

          return (
            <Link
              key={member.id}
              href={`/politician/${member.bioguideId}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded bg-white border border-[#C5C6CF] shadow-editorial transition-all hover:shadow-editorial-hover hover:border-[#75777F]">
                {/* Party accent bar */}
                <div className="h-1" style={{ backgroundColor: accentColor }} />

                <div className="p-4">
                  {/* Photo */}
                  <div className="mb-3 flex justify-center">
                    <MemberPhoto
                      bioguideId={member.bioguideId}
                      name={member.fullName}
                      size={80}
                      className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-[#C5C6CF]"
                      fallbackClassName="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#C5C6CF] bg-[#EDEEEF] text-sm font-bold text-[#75777F]"
                    />
                  </div>

                  {/* Name */}
                  <h3 className="font-headline mb-1 text-center text-sm font-bold text-[#191C1D] leading-tight">
                    {member.fullName}
                  </h3>

                  {/* Party badge */}
                  <p className="text-center text-xs font-medium mb-3" style={{ color: accentColor }}>
                    {getPartyLabel(member.party)} &middot;{" "}
                    {selectedChamber === "House"
                      ? member.district
                        ? `${member.state}-${member.district}`
                        : member.state
                      : member.state}
                  </p>

                  {/* Stats */}
                  <div className="space-y-1 border-t border-[#C5C6CF] pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="stat-label">In Office</span>
                      <span className="font-semibold text-[#191C1D]">
                        {formatYearsInOffice(member)}
                      </span>
                    </div>
                  </div>

                  {/* Compare Button */}
                  <div className="mt-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isSelectedMember) {
                          removePolitician(politician.id);
                        } else {
                          addPolitician(politician);
                        }
                      }}
                      className={`w-full rounded px-3 py-1.5 text-xs font-semibold transition-all ${
                        isSelectedMember
                          ? "bg-[#041534] text-white"
                          : "border border-[#C5C6CF] bg-white text-[#191C1D] hover:bg-[#EDEEEF]"
                      }`}
                    >
                      {isSelectedMember ? "Remove" : "Compare"}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {sortedMembers.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <p className="stat-label">
            Showing {Math.min(visibleCount, sortedMembers.length)} of {sortedMembers.length}
          </p>
          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="rounded bg-[#041534] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1B2A4A]"
            >
              Load More
            </button>
          )}
        </div>
      )}

      {sortedMembers.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm font-medium text-[#75777F]">
            No {selectedChamber} members found
          </p>
        </div>
      )}
    </div>
  );
}
