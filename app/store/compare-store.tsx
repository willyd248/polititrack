"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Politician } from "../../data/politicians";
import { track } from "../../lib/analytics";

interface CompareContextType {
  selected: Politician[];
  addPolitician: (politician: Politician) => void;
  removePolitician: (id: string) => void;
  clearCompare: () => void;
  isSelected: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Politician[]>([]);

  // Track when compare opens (2 politicians selected)
  useEffect(() => {
    if (selected.length === 2) {
      track("compare_opened", {
        politician1: selected[0].id,
        politician2: selected[1].id,
      });
    }
  }, [selected]);

  const addPolitician = (politician: Politician) => {
    setSelected((prev) => {
      // Don't add if already selected
      if (prev.some((p) => p.id === politician.id)) {
        return prev;
      }
      // Max 2 politicians
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, politician];
    });
  };

  const removePolitician = (id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCompare = () => {
    setSelected([]);
  };

  const isSelected = (id: string) => {
    return selected.some((p) => p.id === id);
  };

  return (
    <CompareContext.Provider
      value={{ selected, addPolitician, removePolitician, clearCompare, isSelected }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}

