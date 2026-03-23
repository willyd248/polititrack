"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Source, ReceiptPayload } from "../../data/types";
import { track } from "../../lib/analytics";

export type { Source, ReceiptPayload };

export interface ReceiptsData {
  heading: string;
  subheading?: string;
  sources: Source[];
}

interface ReceiptsContextType {
  isOpen: boolean;
  data: ReceiptsData | null;
  triggerElement: HTMLElement | null;
  openReceipts: (data: ReceiptsData, triggerElement?: HTMLElement | null) => void;
  closeReceipts: () => void;
}

const ReceiptsContext = createContext<ReceiptsContextType | undefined>(
  undefined
);

export function ReceiptsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ReceiptsData | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const openReceipts = (receiptsData: ReceiptsData, element?: HTMLElement | null) => {
    setData(receiptsData);
    setTriggerElement(element || null);
    setIsOpen(true);
    track("receipt_opened", { heading: receiptsData.heading });
  };

  const closeReceipts = () => {
    setIsOpen(false);
    // Keep data briefly for exit animation
    setTimeout(() => {
      setData(null);
      // Return focus to trigger element if it exists
      if (triggerElement && document.contains(triggerElement)) {
        triggerElement.focus();
      }
      setTriggerElement(null);
    }, 300);
  };

  return (
    <ReceiptsContext.Provider value={{ isOpen, data, triggerElement, openReceipts, closeReceipts }}>
      {children}
    </ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const context = useContext(ReceiptsContext);
  if (context === undefined) {
    throw new Error("useReceipts must be used within a ReceiptsProvider");
  }
  return context;
}

