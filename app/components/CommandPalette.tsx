"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCommandPalette } from "../store/command-palette-store";
import { politicians } from "../../data/politicians";
import { bills } from "../../data/bills";
import Chip from "./ui/Chip";
import { track } from "../../lib/analytics";

interface SearchResult {
  id: string;
  type: "politician" | "bill";
  title: string;
  metadata: string;
  url: string;
}

interface MemberSearchResult {
  id: string;
  name: string;
  role: string;
  state: string;
  district: string | null;
  party: string;
  url: string;
}

export default function CommandPalette() {
  const { isOpen, closePalette } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [realMembers, setRealMembers] = useState<MemberSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Search real members when query changes
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setRealMembers([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/members/search?q=${encodeURIComponent(query.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setRealMembers(data.results || []);
        } else {
          setRealMembers([]);
        }
      } catch {
        setRealMembers([]);
      } finally {
        setSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Search logic
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();

    // Use real members if available, otherwise fall back to mock politicians
    const politicianResults: SearchResult[] = realMembers.length > 0
      ? realMembers.map((m) => ({
          id: m.id,
          type: "politician" as const,
          title: m.name,
          metadata: `${m.role} • ${m.state}${m.district ? ` • District ${m.district}` : ""} • ${m.party}`,
          url: m.url,
        }))
      : politicians
          .filter((p) => {
            const nameMatch = p.name.toLowerCase().includes(searchTerm);
            const stateMatch = p.state.toLowerCase().includes(searchTerm);
            const roleMatch = p.role.toLowerCase().includes(searchTerm);
            return nameMatch || stateMatch || roleMatch;
          })
          .map((p) => ({
            id: p.id,
            type: "politician" as const,
            title: p.name,
            metadata: `${p.role} • ${p.state}${p.district ? ` • ${p.district}` : ""}`,
            url: `/politician/${p.id}`,
          }));

    const billResults: SearchResult[] = bills
      .filter((b) => {
        const nameMatch = b.name.toLowerCase().includes(searchTerm);
        const summaryMatch = b.summary.some((s) =>
          s.toLowerCase().includes(searchTerm)
        );
        return nameMatch || summaryMatch;
      })
      .map((b) => ({
        id: b.id,
        type: "bill" as const,
        title: b.name,
        metadata: `${b.status} • ${b.timeline.length} events`,
        url: `/bill/${b.id}`,
      }));

    return [...politicianResults, ...billResults].slice(0, 10); // Limit to 10 results
  }, [query, realMembers]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePalette();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, closePalette]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    track("search_select", { query, result_type: result.type, result_id: result.id });
    router.push(result.url);
    closePalette();
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closePalette}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Command Palette Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 rounded-lg border border-[#C5C6CF] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search Input */}
            <div className="border-b border-[#C5C6CF] p-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search politicians, bills..."
                  className="w-full rounded-md border border-[#C5C6CF] bg-[#F5F6FF] px-4 py-3 pl-10 text-sm text-[#191C1D] placeholder:text-[#75777F] focus:border-[#041534] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#041534]/20"
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#75777F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {query.trim() && searching ? (
                <div className="px-4 py-8 text-center text-sm text-[#75777F]">
                  Searching...
                </div>
              ) : query.trim() && results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#75777F]">
                  No results found
                </div>
              ) : query.trim() && results.length > 0 ? (
                <div ref={resultsRef} className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`w-full rounded-md px-4 py-3 text-left transition-colors duration-150 ${
                        index === selectedIndex
                          ? "bg-[#F5F6FF]"
                          : "hover:bg-[#F5F6FF]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Chip>
                              {result.type === "politician" ? "Politician" : "Bill"}
                            </Chip>
                            <h3 className="font-headline text-sm font-semibold text-[#191C1D] truncate">
                              {result.title}
                            </h3>
                          </div>
                          <p className="text-xs text-[#75777F]">
                            {result.metadata}
                          </p>
                        </div>
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-[#75777F]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-[#75777F]">
                  Start typing to search...
                </div>
              )}
            </div>

            {/* Footer hint */}
            {query.trim() && results.length > 0 && (
              <div className="border-t border-[#C5C6CF] px-4 py-2">
                <div className="flex items-center justify-between text-xs text-[#75777F]">
                  <span>Use arrow keys to navigate</span>
                  <span>Press Enter to select</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

