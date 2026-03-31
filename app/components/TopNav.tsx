"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReadingMode } from "../store/reading-mode-store";
import { useCommandPalette } from "../store/command-palette-store";
import { useTopicLens } from "../store/topic-lens-store";
import { useSaved } from "../store/saved-store";
import { track } from "../../lib/analytics";
import Button from "./ui/Button";
import Chip from "./ui/Chip";
import InfoTip from "./ui/InfoTip";

const TOPICS = ["Healthcare", "Environment", "Infrastructure", "Defense", "Agriculture"];

export default function TopNav() {
  const { isEnabled, toggleReadingMode } = useReadingMode();
  const { openPalette } = useCommandPalette();
  const { selectedTopic, setTopic, clearTopic } = useTopicLens();
  const { toggleSaveTopic, isTopicSaved } = useSaved();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ensure client-side only rendering for links to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cmd+K / Ctrl+K to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  return (
    <nav className="sticky top-0 z-40" style={{ backgroundColor: "#041534" }}>
      <div className="container-content mx-auto px-6">
        <div className="flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="font-headline text-lg font-bold tracking-tight text-white no-underline transition-opacity duration-200 hover:opacity-80"
            >
              PolitiTrack
            </Link>
            <Link
              href="/members"
              className="hidden md:block text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white"
            >
              Members
            </Link>
            <Link
              href="/compare"
              className="hidden md:block text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white"
            >
              Compare
            </Link>
            <Link
              href="/methodology"
              className="hidden md:block text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white"
            >
              Methodology
            </Link>
            <Link
              href="/status"
              className="hidden md:block text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white"
              suppressHydrationWarning
            >
              Status
            </Link>
          </div>

          {/* Search Input */}
          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search politicians, bills... (Cmd+K)"
                onFocus={openPalette}
                readOnly
                className="w-full cursor-pointer rounded border border-white/20 bg-white/10 px-4 py-1.5 pl-10 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15 focus:outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
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

          <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 text-white/70 hover:text-white"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Search (mobile) */}
          <button
            onClick={openPalette}
            className="md:hidden flex items-center justify-center p-2 text-white/70 hover:text-white"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Reading Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReadingMode}
            className="flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10"
            aria-label={isEnabled ? "Disable reading mode" : "Enable reading mode"}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="hidden sm:inline">
              {isEnabled ? "Reading" : "Reading mode"}
            </span>
          </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-2">
            <div className="flex flex-col gap-1">
              <Link
                href="/members"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white hover:bg-white/10 rounded"
              >
                Members
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white hover:bg-white/10 rounded"
              >
                Compare
              </Link>
              <Link
                href="/methodology"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white hover:bg-white/10 rounded"
              >
                Methodology
              </Link>
              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-white/70 no-underline transition-colors duration-200 hover:text-white hover:bg-white/10 rounded"
              >
                Status
              </Link>
            </div>
          </div>
        )}

        {/* Topic Chips */}
        <div className="border-t border-white/10 px-6 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-white/60 mr-1">
              Topics
            </span>
            <InfoTip
              content="Topic Lens filters content by policy area. Select a topic to see relevant votes, statements, and timeline events highlighted across the site."
              className="mr-1"
            />
            {TOPICS.map((topic) => (
              <div
                key={topic}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setTopic(topic);
                  track("topic_selected", { topic });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setTopic(topic);
                    track("topic_selected", { topic });
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 cursor-pointer ${
                  selectedTopic === topic
                    ? "bg-white text-[#041534]"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {topic}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveTopic(topic);
                  }}
                  className={`transition-colors duration-200 ${
                    isTopicSaved(topic)
                      ? "text-yellow-400"
                      : selectedTopic === topic
                      ? "text-[#041534]/50 hover:text-[#041534]/80"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  aria-label={isTopicSaved(topic) ? `Unsave ${topic}` : `Save ${topic}`}
                >
                  <svg
                    className={`h-3 w-3 ${isTopicSaved(topic) ? "fill-current" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {selectedTopic && (
              <button
                onClick={() => {
                  clearTopic();
                  track("topic_cleared");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white/80 transition-colors duration-200 hover:bg-white/30"
              >
                <span>Clear</span>
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

