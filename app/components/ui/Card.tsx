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
    "rounded bg-white border border-[#C5C6CF] p-6 shadow-editorial transition-all duration-200";

  const clickableStyles = clickable
    ? "cursor-pointer hover:shadow-editorial-hover hover:border-[#75777F]"
    : "";

  return (
    <div className={`${baseStyles} ${clickableStyles} ${className}`}>
      {children}
    </div>
  );
}
