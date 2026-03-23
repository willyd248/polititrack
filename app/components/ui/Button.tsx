import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const baseStyles =
    "inline-flex items-center justify-center rounded font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B2A4A]";

  const variants = {
    primary:
      "bg-[#041534] text-white hover:bg-[#1B2A4A]",
    secondary:
      "bg-[#EDEEEF] text-[#191C1D] hover:bg-[#E7E8E9]",
    ghost:
      "text-[#75777F] hover:bg-[#EDEEEF] hover:text-[#191C1D]",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
