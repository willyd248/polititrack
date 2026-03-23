"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { track } from "../../lib/analytics";

interface SavedContextType {
  savedPoliticians: string[];
  savedBills: string[];
  savedTopics: string[];
  toggleSavePolitician: (id: string) => void;
  toggleSaveBill: (id: string) => void;
  toggleSaveTopic: (topic: string) => void;
  isPoliticianSaved: (id: string) => boolean;
  isBillSaved: (id: string) => boolean;
  isTopicSaved: (topic: string) => boolean;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

const STORAGE_KEY = "polititrack-saved";

function loadFromStorage() {
  if (typeof window === "undefined") {
    return { savedPoliticians: [], savedBills: [], savedTopics: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load saved items from localStorage:", err);
  }

  return { savedPoliticians: [], savedBills: [], savedTopics: [] };
}

function saveToStorage(data: {
  savedPoliticians: string[];
  savedBills: string[];
  savedTopics: string[];
}) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedPoliticians, setSavedPoliticians] = useState<string[]>([]);
  const [savedBills, setSavedBills] = useState<string[]>([]);
  const [savedTopics, setSavedTopics] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setSavedPoliticians(loaded.savedPoliticians || []);
    setSavedBills(loaded.savedBills || []);
    setSavedTopics(loaded.savedTopics || []);
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isHydrated) {
      saveToStorage({
        savedPoliticians,
        savedBills,
        savedTopics,
      });
    }
  }, [savedPoliticians, savedBills, savedTopics, isHydrated]);

  const toggleSavePolitician = (id: string) => {
    setSavedPoliticians((prev) => {
      const isAdding = !prev.includes(id);
      track("follow_toggled", { type: "politician", id, action: isAdding ? "follow" : "unfollow" });
      return isAdding ? [...prev, id] : prev.filter((item) => item !== id);
    });
  };

  const toggleSaveBill = (id: string) => {
    setSavedBills((prev) => {
      const isAdding = !prev.includes(id);
      track("follow_toggled", { type: "bill", id, action: isAdding ? "follow" : "unfollow" });
      return isAdding ? [...prev, id] : prev.filter((item) => item !== id);
    });
  };

  const toggleSaveTopic = (topic: string) => {
    setSavedTopics((prev) => {
      const isAdding = !prev.includes(topic);
      track("follow_toggled", { type: "topic", topic, action: isAdding ? "follow" : "unfollow" });
      return isAdding ? [...prev, topic] : prev.filter((item) => item !== topic);
    });
  };

  const isPoliticianSaved = (id: string) => savedPoliticians.includes(id);
  const isBillSaved = (id: string) => savedBills.includes(id);
  const isTopicSaved = (topic: string) => savedTopics.includes(topic);

  return (
    <SavedContext.Provider
      value={{
        savedPoliticians,
        savedBills,
        savedTopics,
        toggleSavePolitician,
        toggleSaveBill,
        toggleSaveTopic,
        isPoliticianSaved,
        isBillSaved,
        isTopicSaved,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (context === undefined) {
    throw new Error("useSaved must be used within a SavedProvider");
  }
  return context;
}

