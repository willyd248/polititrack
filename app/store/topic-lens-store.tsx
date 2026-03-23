"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface TopicLensContextType {
  selectedTopic: string | null;
  setTopic: (topic: string) => void;
  clearTopic: () => void;
}

const TopicLensContext = createContext<TopicLensContextType | undefined>(
  undefined
);

function TopicLensSync({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isUpdatingUrlRef = useRef(false);

  // Initialize from URL on mount
  useEffect(() => {
    const topicFromUrl = searchParams.get("topic");
    if (topicFromUrl) {
      setSelectedTopic(topicFromUrl);
    }
    setIsInitialized(true);
  }, []); // Only run on mount

  // Sync URL when selectedTopic changes (after initialization)
  // Preserves all existing query params (like receipt)
  useEffect(() => {
    if (!isInitialized || isUpdatingUrlRef.current) return;

    // Read current params - using searchParams.toString() preserves all params
    const currentTopic = searchParams.get("topic");
    
    // Only update URL if there's a mismatch between state and URL
    if (selectedTopic && currentTopic !== selectedTopic) {
      isUpdatingUrlRef.current = true;
      // Preserve all existing params by copying current searchParams
      const params = new URLSearchParams(searchParams.toString());
      params.set("topic", selectedTopic);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      // Reset flag after URL update completes
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 50);
    } else if (!selectedTopic && currentTopic) {
      isUpdatingUrlRef.current = true;
      // Preserve all existing params except topic
      const params = new URLSearchParams(searchParams.toString());
      params.delete("topic");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
      // Reset flag after URL update completes
      setTimeout(() => {
        isUpdatingUrlRef.current = false;
      }, 50);
    }
  }, [selectedTopic, isInitialized, pathname, router]); // Don't include searchParams to avoid loops

  const setTopic = (topic: string) => {
    setSelectedTopic(topic);
  };

  const clearTopic = () => {
    setSelectedTopic(null);
  };

  return (
    <TopicLensContext.Provider value={{ selectedTopic, setTopic, clearTopic }}>
      {children}
    </TopicLensContext.Provider>
  );
}

export function TopicLensProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <TopicLensContext.Provider value={{ selectedTopic: null, setTopic: () => {}, clearTopic: () => {} }}>
        {children}
      </TopicLensContext.Provider>
    }>
      <TopicLensSync>{children}</TopicLensSync>
    </Suspense>
  );
}

export function useTopicLens() {
  const context = useContext(TopicLensContext);
  if (context === undefined) {
    throw new Error("useTopicLens must be used within a TopicLensProvider");
  }
  return context;
}

