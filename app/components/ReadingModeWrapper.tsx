"use client";

import { useReadingMode } from "../store/reading-mode-store";
import { ReactNode } from "react";

export default function ReadingModeWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const { isEnabled } = useReadingMode();

  return (
    <div className={isEnabled ? "reading-mode" : ""}>
      {children}
    </div>
  );
}

