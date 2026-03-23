"use client";

import { useState } from "react";
import Link from "next/link";
import { Member } from "../../data/types-members";
import { useCompare } from "../store/compare-store";
import { memberToPolitician } from "../../lib/mappers/memberToPolitician";

interface ChamberFloorProps {
  members: Member[];
}

// State abbreviations for display
const STATE_ABBREVIATIONS: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
  "District of Columbia": "DC",
};

// All 50 states + DC in order
const ALL_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

export default function ChamberFloor({ members }: ChamberFloorProps) {
  const [selectedChamber, setSelectedChamber] = useState<"House" | "Senate">("House");
  const { addPolitician, removePolitician, isSelected } = useCompare();

  // Filter members by selected chamber
  const chamberMembers = members.filter((m) => m.chamber === selectedChamber);

  // For Senate: Create 100 seats (2 per state)
  const getSenateSeats = () => {
    const seats: Array<{ state: string; seatNumber: number; member: Member | null }> = [];
    
    ALL_STATES.forEach((state) => {
      // Each state has 2 Senate seats
      seats.push({ state, seatNumber: 1, member: null });
      seats.push({ state, seatNumber: 2, member: null });
    });

    // Assign members to seats
    chamberMembers.forEach((member) => {
      const stateSeats = seats.filter((s) => s.state === member.state);
      const emptySeat = stateSeats.find((s) => !s.member);
      if (emptySeat) {
        emptySeat.member = member;
      }
    });

    return seats;
  };

  // For House: Create seats organized by state, then by district
  const getHouseSeats = () => {
    const seats: Array<{ state: string; district: string | null; member: Member | null }> = [];
    
    // Group members by state
    const membersByState = new Map<string, Member[]>();
    chamberMembers.forEach((member) => {
      if (!membersByState.has(member.state)) {
        membersByState.set(member.state, []);
      }
      membersByState.get(member.state)!.push(member);
    });

    // For each state, create seats for districts 1-53 (max districts per state)
    // We'll show up to the highest district number we have data for
    ALL_STATES.forEach((state) => {
      const stateMembers = membersByState.get(state) || [];
      const maxDistrict = stateMembers.reduce((max, m) => {
        if (m.district) {
          const districtNum = parseInt(m.district, 10);
          return Math.max(max, districtNum);
        }
        return max;
      }, 0);

      // Create seats for districts 1 to maxDistrict (or at least 1 seat)
      const numSeats = Math.max(maxDistrict, stateMembers.length > 0 ? 1 : 0);
      for (let i = 1; i <= numSeats; i++) {
        const districtStr = i.toString().padStart(2, "0");
        seats.push({ state, district: districtStr, member: null });
      }
    });

    // Assign members to seats
    chamberMembers.forEach((member) => {
      // Normalize district for matching (pad with leading zero if needed)
      // Handle both "1" and "01" formats
      let normalizedDistrict: string | null = null;
      if (member.district) {
        // Remove leading zeros, then pad to 2 digits
        const districtNum = parseInt(member.district, 10);
        normalizedDistrict = districtNum.toString().padStart(2, "0");
      }
      
      const seat = seats.find(
        (s) => s.state === member.state && s.district === normalizedDistrict
      );
      if (seat) {
        seat.member = member;
      } else if (process.env.NODE_ENV === "development") {
        // Debug: log unmatched members
        console.log(`[ChamberFloor] Could not find seat for ${member.fullName} - ${member.state} District ${member.district} (normalized: ${normalizedDistrict})`);
      }
    });

    return seats;
  };

  const senateSeats = selectedChamber === "Senate" ? getSenateSeats() : [];
  const houseSeats = selectedChamber === "House" ? getHouseSeats() : [];

  // Group Senate seats by state for display
  const senateByState = new Map<string, typeof senateSeats>();
  senateSeats.forEach((seat) => {
    if (!senateByState.has(seat.state)) {
      senateByState.set(seat.state, []);
    }
    senateByState.get(seat.state)!.push(seat);
  });

  // Group House seats by state for display
  const houseByState = new Map<string, typeof houseSeats>();
  houseSeats.forEach((seat) => {
    if (!houseByState.has(seat.state)) {
      houseByState.set(seat.state, []);
    }
    houseByState.get(seat.state)!.push(seat);
  });

  return (
    <div className="space-y-6">
      {/* Toggle Switch */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            onClick={() => setSelectedChamber("House")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              selectedChamber === "House"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            House
          </button>
          <button
            onClick={() => setSelectedChamber("Senate")}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
              selectedChamber === "Senate"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Senate
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-blue-500" />
          <span>Democrat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500" />
          <span>Republican</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-400" />
          <span>Other/Independent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-dashed border-zinc-300 bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-800/30" />
          <span>Vacant</span>
        </div>
      </div>

      {/* Chamber Floor Visualization */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
        {selectedChamber === "Senate" ? (
          // Senate: Show 2 seats per state in a grid
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from(senateByState.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([state, seats]) => (
                  <div key={state} className="space-y-2">
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {STATE_ABBREVIATIONS[state] || state}
                    </div>
                    <div className="flex gap-1.5">
                      {seats.map((seat, idx) => (
                        <SenateSeat
                          key={`${state}-${seat.seatNumber}`}
                          seat={seat}
                          isFirst={idx === 0}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          // House: Show seats organized by state
          <div className="space-y-6">
            {Array.from(houseByState.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .filter(([_, seats]) => seats.some((s) => s.member !== null)) // Only show states with members
              .map(([state, seats]) => {
                const seatsWithMembers = seats.filter((seat) => seat.member !== null);
                if (seatsWithMembers.length === 0) return null;
                
                return (
                  <div key={state} className="space-y-2">
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {state} ({STATE_ABBREVIATIONS[state] || state}) - {seatsWithMembers.length} {seatsWithMembers.length === 1 ? "seat" : "seats"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seatsWithMembers
                        .sort((a, b) => {
                          // Sort by district number
                          const distA = parseInt(a.district || "0", 10);
                          const distB = parseInt(b.district || "0", 10);
                          return distA - distB;
                        })
                        .map((seat) => (
                          <HouseSeat
                            key={`${state}-${seat.district}`}
                            seat={seat}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// Senate Seat Component
function SenateSeat({
  seat,
  isFirst,
}: {
  seat: { state: string; seatNumber: number; member: Member | null };
  isFirst: boolean;
}) {
  const { isSelected } = useCompare();

  if (!seat.member) {
    return (
      <div className="h-12 w-12 rounded border border-dashed border-zinc-300 bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-800/30" />
    );
  }

  const politician = memberToPolitician(seat.member);
  const selected = isSelected(politician.id);
  const party = seat.member.party || "";
  const partyUpper = party.toUpperCase().trim();
  const partyLower = party.toLowerCase().trim();
  
  // Determine party color - handle both single-letter codes (D, R, I) and full names
  let partyColor = "bg-zinc-400";
  let backgroundColor = "#a1a1aa"; // zinc-400 default
  
  if (
    partyUpper === "D" || 
    partyUpper === "DEM" ||
    partyLower.includes("democrat")
  ) {
    partyColor = "bg-blue-500";
    backgroundColor = "#3b82f6"; // blue-500
  } else if (
    partyUpper === "R" || 
    partyUpper === "REP" ||
    partyLower.includes("republican")
  ) {
    partyColor = "bg-red-500";
    backgroundColor = "#ef4444"; // red-500
  }
  
  if (process.env.NODE_ENV === "development") {
    if (!party) {
      console.log(`[ChamberFloor] Member ${seat.member.fullName} has no party field`);
    } else {
      console.log(`[ChamberFloor] Member ${seat.member.fullName} - Party: "${party}" (upper: "${partyUpper}", lower: "${partyLower}") - Color: ${backgroundColor}`);
    }
  }

  return (
    <Link
      href={`/politician/${seat.member.bioguideId}`}
      className="group relative block"
      title={`${seat.member.fullName} (${seat.member.party})`}
    >
      <div
        className={`h-12 w-12 rounded border-2 border-zinc-300 transition-all hover:scale-110 hover:shadow-md dark:border-zinc-700 ${
          selected ? "ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-zinc-900" : ""
        }`}
        style={{ backgroundColor }}
      />
      {/* Hover tooltip */}
      <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
        <div className="font-medium">{seat.member.fullName}</div>
        <div className="text-xs opacity-90">{seat.member.party}</div>
      </div>
    </Link>
  );
}

// House Seat Component
function HouseSeat({
  seat,
}: {
  seat: { state: string; district: string | null; member: Member | null };
}) {
  const { isSelected } = useCompare();

  if (!seat.member) {
    return null; // Don't show empty House seats
  }

  const politician = memberToPolitician(seat.member);
  const selected = isSelected(politician.id);
  const party = seat.member.party || "";
  const partyUpper = party.toUpperCase().trim();
  const partyLower = party.toLowerCase().trim();
  
  // Determine party color - handle both single-letter codes (D, R, I) and full names
  let partyColor = "bg-zinc-400";
  let backgroundColor = "#a1a1aa"; // zinc-400 default
  
  if (
    partyUpper === "D" || 
    partyUpper === "DEM" ||
    partyLower.includes("democrat")
  ) {
    partyColor = "bg-blue-500";
    backgroundColor = "#3b82f6"; // blue-500
  } else if (
    partyUpper === "R" || 
    partyUpper === "REP" ||
    partyLower.includes("republican")
  ) {
    partyColor = "bg-red-500";
    backgroundColor = "#ef4444"; // red-500
  }
  
  if (process.env.NODE_ENV === "development") {
    if (!party) {
      console.log(`[ChamberFloor] Member ${seat.member.fullName} has no party field`);
    } else {
      console.log(`[ChamberFloor] Member ${seat.member.fullName} - Party: "${party}" (upper: "${partyUpper}", lower: "${partyLower}") - Color: ${backgroundColor}`);
    }
  }

  return (
    <Link
      href={`/politician/${seat.member.bioguideId}`}
      className="group relative block"
      title={`${seat.member.fullName} - ${seat.state} ${seat.district ? `District ${seat.district}` : ""} (${seat.member.party})`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded border-2 border-zinc-300 text-xs font-medium text-white transition-all hover:scale-110 hover:shadow-md dark:border-zinc-700 ${
          selected ? "ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-zinc-900" : ""
        }`}
        style={{ backgroundColor }}
      >
        {seat.district}
      </div>
      {/* Hover tooltip */}
      <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
        <div className="font-medium">{seat.member.fullName}</div>
        <div className="text-xs opacity-90">
          {seat.state} {seat.district ? `District ${seat.district}` : ""} • {seat.member.party}
        </div>
      </div>
    </Link>
  );
}

