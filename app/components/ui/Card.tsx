import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  clickable?: boolean;
}

export default function Card({
  children,
  className = "",
  clickable = false,
}: CardProps) {
  const baseStyles =
    "rounded-lg border border-zinc-200 bg-white p-6 shadow-card transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900";
  
  const clickableStyles = clickable
    ? "cursor-pointer hover:shadow-card-hover hover:border-zinc-300 dark:hover:border-zinc-700"
    : "";

  return (
    <div className={`${baseStyles} ${clickableStyles} ${className}`}>
      {children}
    </div>
  );
}

