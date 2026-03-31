"use client";

import { useReceipts, ReceiptsData } from "../../store/receipts-store";

interface InlineCitationProps {
  data: ReceiptsData;
  compact?: boolean;
  className?: string;
}

export default function InlineCitation({
  data,
  compact = false,
  className = "",
}: InlineCitationProps) {
  const { openReceipts } = useReceipts();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    openReceipts(data, e.currentTarget);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 text-xs font-medium text-[#75777F] hover:text-[#041534] transition-colors duration-200 ${className}`}
        aria-label="View sources"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Sources</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-[#75777F] hover:text-[#041534] transition-colors duration-200 ${className}`}
      aria-label="View sources"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Sources</span>
    </button>
  );
}

