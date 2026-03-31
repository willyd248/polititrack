"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCompare } from "../store/compare-store";
import Button from "./ui/Button";
import InfoTip from "./ui/InfoTip";

export default function CompareTray() {
  const { selected, removePolitician, clearCompare } = useCompare();

  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#C5C6CF] bg-white shadow-lg"
        >
          <div className="container-content mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-4 overflow-x-auto">
                <span className="text-sm font-medium text-[#191C1D] whitespace-nowrap">
                  Comparing:
                </span>
                {selected.map((politician) => (
                  <div
                    key={politician.id}
                    className="flex items-center gap-2 rounded-lg border border-[#C5C6CF] bg-[#F5F6FF] px-3 py-2"
                  >
                    <span className="text-sm font-medium text-[#191C1D] whitespace-nowrap">
                      {politician.name || "Unknown Member"}
                    </span>
                    <button
                      onClick={() => removePolitician(politician.id)}
                      className="text-[#75777F] hover:text-[#041534]"
                      aria-label={`Remove ${politician.name || "politician"} from comparison`}
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selected.length === 2 && (
                  <div className="flex items-center gap-2">
                    <Link href="/compare">
                      <Button variant="primary" size="sm">
                        Compare
                      </Button>
                    </Link>
                    <InfoTip
                      content="Compare shows side-by-side facts and metrics. It does not score or rank politicians—you interpret the differences."
                    />
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={clearCompare}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
