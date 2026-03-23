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
    <nav className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
      <div className="container-content mx-auto px-6">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-zinc-900 no-underline transition-colors duration-200 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              Polititrack
            </Link>
            <Link
              href="/methodology"
              className="hidden md:block text-sm font-medium text-zinc-600 no-underline transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Methodology
            </Link>
            <Link
              href="/status"
              className="hidden md:block text-sm font-medium text-zinc-600 no-underline transition-colors duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
                className="w-full cursor-pointer rounded-md border border-zinc-200 bg-zinc-50/50 px-4 py-2 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-700 dark:focus:bg-zinc-900 dark:focus:ring-zinc-800"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
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

          {/* Reading Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReadingMode}
            className="flex items-center gap-2"
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

        {/* Topic Chips */}
        <div className="border-t border-zinc-200/80 px-6 py-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mr-1">
              Topic Lens
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
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
                      ? "text-yellow-500"
                      : selectedTopic === topic
                      ? "text-white/70 hover:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
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
                className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
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

