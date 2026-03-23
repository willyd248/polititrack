import { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  className?: string;
}

export default function Chip({ children, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center h-6 rounded-full bg-[#EDEEEF] px-3 text-xs font-semibold text-[#191C1D] ${className}`}
    >
      {children}
    </span>
  );
}
