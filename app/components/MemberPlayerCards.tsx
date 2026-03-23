"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Member } from "../../data/types-members";
import { useCompare } from "../store/compare-store";
import { memberToPolitician } from "../../lib/mappers/memberToPolitician";

interface MemberPlayerCardsProps {
  members: Member[];
}

// Calculate years in office (placeholder - will be calculated server-side later)
function getYearsInOffice(member: Member): string {
  // TODO: Calculate from term start dates in unitedstates dataset
  // For now, return placeholder
  return "—";
}

// Get party color class
function getPartyColorClass(party: string | null | undefined): string {
  if (!party) return "bg-zinc-400";
  const partyUpper = party.toUpperCase().trim();
  const partyLower = party.toLowerCase().trim();
  
  if (partyUpper === "D" || partyUpper === "DEM" || partyLower.includes("democrat")) {
    return "bg-blue-500";
  } else if (partyUpper === "R" || partyUpper === "REP" || partyLower.includes("republican")) {
    return "bg-red-500";
  }
  return "bg-zinc-400";
}

// Get party border color
function getPartyBorderColor(party: string | null | undefined): string {
  if (!party) return "border-zinc-400";
  const partyUpper = party.toUpperCase().trim();
  const partyLower = party.toLowerCase().trim();
  
  if (partyUpper === "D" || partyUpper === "DEM" || partyLower.includes("democrat")) {
    return "border-blue-600";
  } else if (partyUpper === "R" || partyUpper === "REP" || partyLower.includes("republican")) {
    return "border-red-600";
  }
  return "border-zinc-500";
}

export default function MemberPlayerCards({ members }: MemberPlayerCardsProps) {
  const [selectedChamber, setSelectedChamber] = useState<"House" | "Senate">("House");
  const { addPolitician, removePolitician, isSelected } = useCompare();

  // Filter members by selected chamber
  const chamberMembers = members.filter((m) => m.chamber === selectedChamber);

  // Sort by state, then by district (for House) or name (for Senate)
  const sortedMembers = [...chamberMembers].sort((a, b) => {
    if (a.state !== b.state) {
      return a.state.localeCompare(b.state);
    }
    if (selectedChamber === "House" && a.district && b.district) {
      return parseInt(a.district, 10) - parseInt(b.district, 10);
    }
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <div className="space-y-6">
      {/* Toggle Switch - Vintage Style */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded border-2 border-zinc-900 bg-white p-1 dark:border-zinc-100 dark:bg-zinc-900">
          <button
            onClick={() => setSelectedChamber("House")}
            className={`rounded px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              selectedChamber === "House"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            House
          </button>
          <button
            onClick={() => setSelectedChamber("Senate")}
            className={`rounded px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
              selectedChamber === "Senate"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Senate
          </button>
        </div>
      </div>

      {/* Player Cards Grid - Vintage Blocky Design */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedMembers.map((member) => {
          const politician = memberToPolitician(member);
          const isSelectedMember = isSelected(politician.id);
          const partyColorClass = getPartyColorClass(member.party);
          const partyBorderColor = getPartyBorderColor(member.party);
          const yearsInOffice = getYearsInOffice(member);

          return (
            <Link
              key={member.id}
              href={`/politician/${member.bioguideId}`}
              className="group block"
            >
              <div
                className={`relative overflow-hidden rounded border-4 ${partyBorderColor} bg-white shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:bg-zinc-900`}
              >
                {/* Header Bar with Party Color */}
                <div className={`h-2 ${partyColorClass}`} />

                {/* Card Content */}
                <div className="p-4">
                  {/* Photo */}
                  <div className="mb-3 flex justify-center">
                    {member.imageUrl ? (
                      <div className="relative h-24 w-24 overflow-hidden rounded border-2 border-zinc-900 dark:border-zinc-100">
                        <Image
                          src={member.imageUrl}
                          alt={member.fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-zinc-300 bg-zinc-100 text-xs font-bold uppercase text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                        {member.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Name - Bold, Blocky */}
                  <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    {member.fullName}
                  </h3>

                  {/* Stats - Blocky Design */}
                  <div className="space-y-1.5 border-t-2 border-zinc-900 pt-2 dark:border-zinc-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-zinc-600 dark:text-zinc-400">
                        Party:
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {member.party || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-zinc-600 dark:text-zinc-400">
                        {selectedChamber === "House" ? "District:" : "State:"}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedChamber === "House"
                          ? member.district
                            ? `${member.state}-${member.district}`
                            : member.state
                          : member.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-zinc-600 dark:text-zinc-400">
                        Years:
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {yearsInOffice}
                      </span>
                    </div>
                  </div>

                  {/* Compare Button */}
                  <div className="mt-3 pt-2 border-t border-zinc-300 dark:border-zinc-700">
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
                      className={`w-full rounded border-2 border-zinc-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        isSelectedMember
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-white text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
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

      {sortedMembers.length === 0 && (
        <div className="rounded-lg border-4 border-zinc-900 bg-white p-8 text-center dark:border-zinc-100 dark:bg-zinc-900">
          <p className="text-sm font-bold uppercase text-zinc-600 dark:text-zinc-400">
            No {selectedChamber} members found
          </p>
        </div>
      )}
    </div>
  );
}

