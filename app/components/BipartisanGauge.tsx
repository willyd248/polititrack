"use client";

import { BillSponsor } from "../../data/bills";

interface BipartisanGaugeProps {
  cosponsors?: BillSponsor[];
  cosponsorCount?: number;
  size?: "full" | "compact";
}

interface BipartisanScore {
  score: number; // 0 = totally partisan, 1 = perfectly bipartisan
  label: string;
  demCount: number;
  repCount: number;
  otherCount: number;
}

function computeBipartisanScore(cosponsors: BillSponsor[]): BipartisanScore {
  let demCount = 0;
  let repCount = 0;
  let otherCount = 0;

  for (const c of cosponsors) {
    const p = c.party?.toUpperCase();
    if (p === "D" || p === "DEMOCRAT" || p === "DEMOCRATIC") demCount++;
    else if (p === "R" || p === "REPUBLICAN") repCount++;
    else otherCount++;
  }

  const total = demCount + repCount;
  if (total === 0) {
    return { score: 0, label: "Unknown", demCount, repCount, otherCount };
  }

  const minParty = Math.min(demCount, repCount);
  const maxParty = Math.max(demCount, repCount);
  const score = maxParty > 0 ? minParty / maxParty : 0;

  let label: string;
  if (score >= 0.7) label = "Strongly Bipartisan";
  else if (score >= 0.4) label = "Leaning Bipartisan";
  else if (score >= 0.15) label = "Mixed";
  else if (score > 0) label = "Leaning Partisan";
  else label = "Strongly Partisan";

  return { score, label, demCount, repCount, otherCount };
}

function gaugeColor(score: number): string {
  if (score >= 0.7) return "#1B6B3A";
  if (score >= 0.4) return "#4D8B31";
  if (score >= 0.15) return "#D97706";
  if (score > 0) return "#C2553A";
  return "#A63744";
}

export function BipartisanGauge({ cosponsors, cosponsorCount, size = "full" }: BipartisanGaugeProps) {
  if (!cosponsors || cosponsors.length === 0) return null;

  const result = computeBipartisanScore(cosponsors);
  const color = gaugeColor(result.score);
  const pct = Math.round(result.score * 100);
  // Position the marker on the gauge (0% = left/partisan, 100% = right/bipartisan)
  const markerPct = Math.max(2, Math.min(98, pct));

  if (size === "compact") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
        style={{ background: color }}
        title={`${result.label} — ${result.demCount}D / ${result.repCount}R cosponsors`}
      >
        <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="5" cy="5" r="2" fill="currentColor" />
        </svg>
        {result.label}
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-[#C5C6CF] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#75777F]">
          Bipartisan Score
        </p>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
          style={{ background: color }}
        >
          {result.label}
        </span>
      </div>

      {/* Gauge bar */}
      <div className="relative mt-3 mb-2">
        {/* Gradient background */}
        <div
          className="h-3 w-full rounded-full"
          style={{
            background: "linear-gradient(to right, #A63744, #C2553A, #D97706, #4D8B31, #1B6B3A)",
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${markerPct}%` }}
        >
          <div className="h-5 w-5 rounded-full border-[3px] border-white bg-[#041534] shadow-md" />
        </div>
      </div>

      {/* Labels under gauge */}
      <div className="flex justify-between text-[10px] text-[#75777F] mb-3">
        <span>Partisan</span>
        <span>Mixed</span>
        <span>Bipartisan</span>
      </div>

      {/* Party breakdown */}
      <div className="flex items-center gap-4 text-xs text-[#191C1D]/80">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#1B2A4A" }} />
          {result.demCount} Democrat{result.demCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#8B2332" }} />
          {result.repCount} Republican{result.repCount !== 1 ? "s" : ""}
        </span>
        {result.otherCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#75777F]" />
            {result.otherCount} Other
          </span>
        )}
      </div>
    </div>
  );
}

export { computeBipartisanScore, gaugeColor };
export type { BipartisanScore };
