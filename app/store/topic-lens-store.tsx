"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, Suspense } from "react";
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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(
    () => searchParams.get("topic")
  );

  // Sync state from URL when searchParams change (e.g. browser back/forward)
  useEffect(() => {
    const topicFromUrl = searchParams.get("topic");
    setSelectedTopic(topicFromUrl);
  }, [searchParams]);

  const updateUrl = useCallback(
    (topic: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (topic) {
        params.set("topic", topic);
      } else {
        params.delete("topic");
      }
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setTopic = useCallback(
    (topic: string) => {
      updateUrl(topic);
    },
    [updateUrl]
  );

  const clearTopic = useCallback(() => {
    updateUrl(null);
  }, [updateUrl]);

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
