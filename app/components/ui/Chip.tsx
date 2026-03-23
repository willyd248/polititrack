import { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  className?: string;
}

export default function Chip({ children, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center h-6 rounded-full bg-zinc-100 px-3 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}

