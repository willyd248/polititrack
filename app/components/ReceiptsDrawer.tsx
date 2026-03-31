"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReceipts } from "../store/receipts-store";
import { useTopicLens } from "../store/topic-lens-store";
import Button from "./ui/Button";
import InfoTip from "./ui/InfoTip";

function ReceiptsDrawerContent() {
  const { isOpen, data, closeReceipts } = useReceipts();
  const { selectedTopic } = useTopicLens();
  const drawerRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cardCopied, setCardCopied] = useState(false);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      // Focus the drawer when it opens
      const focusableElement = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, [isOpen]);

  // Keyboard support (Esc key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (shareModalOpen) {
          setShareModalOpen(false);
        } else if (isOpen) {
          closeReceipts();
        }
      }
    };

    if (isOpen || shareModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, shareModalOpen, closeReceipts]);

  // Focus management for share modal
  useEffect(() => {
    if (shareModalOpen && shareModalRef.current) {
      const focusableElement = shareModalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElement) {
        focusableElement.focus();
      }
    }
  }, [shareModalOpen]);

  const copyReceipt = async () => {
    if (!data) return;

    let text = `${data.heading}\n`;
    if (data.subheading) {
      text += `${data.subheading}\n`;
    }
    text += "\n";

    data.sources.forEach((source, index) => {
      text += `${index + 1}. ${source.title}\n`;
      text += `   ${source.publisher} • ${source.date}\n`;
      if (source.url) {
        text += `   ${source.url}\n`;
      }
      text += `   ${source.excerpt}\n`;
      if (index < data.sources.length - 1) {
        text += "\n";
      }
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyCardText = async () => {
    if (!data) return;

    const topSources = data.sources.slice(0, 2);
    let text = `${data.heading}\n`;
    if (data.subheading) {
      text += `${data.subheading}\n`;
    }
    text += "\n";

    topSources.forEach((source, index) => {
      text += `${index + 1}. ${source.title}\n`;
      text += `   ${source.publisher} • ${source.date}\n`;
      if (index < topSources.length - 1) {
        text += "\n";
      }
    });

    text += "\nShared via Polititrack";

    try {
      await navigator.clipboard.writeText(text);
      setCardCopied(true);
      setTimeout(() => setCardCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCardCopied(true);
        setTimeout(() => setCardCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && data && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeReceipts}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:bg-black/40"
          />

          {/* Drawer - Desktop: right side, Mobile: bottom sheet */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%", y: "100%" }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: "100%", y: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-0 right-0 z-50 h-[85vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl md:bottom-auto md:top-0 md:h-full md:w-[480px] md:rounded-none md:rounded-l-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipts-heading"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#C5C6CF] p-6">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h2
                      id="receipts-heading"
                      className="text-xl font-semibold text-[#041534]"
                    >
                      {data.heading}
                    </h2>
                    <InfoTip
                      content="Receipts are source excerpts and links to primary sources. Each receipt shows the original publisher, date, and a link to verify the information independently."
                    />
                  </div>
                  {data.subheading && (
                    <p className="mt-1.5 text-sm text-[#75777F]">
                      {data.subheading}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyReceipt}
                      className="flex items-center gap-2"
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {copied ? (
                        <span className="text-xs text-green-600">
                          Copied
                        </span>
                      ) : (
                        <span className="text-xs">Copy receipt</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareModalOpen(true)}
                      className="flex items-center gap-2"
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
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      <span className="text-xs">Share</span>
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={closeReceipts}
                  className="flex-shrink-0"
                  aria-label="Close drawer"
                >
                  <svg
                    className="h-5 w-5"
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
                </Button>
              </div>

              {/* Sources List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {data.sources.map((source, index) => (
                    <div
                      key={index}
                      className="border-b border-[#C5C6CF] pb-6 last:border-b-0"
                    >
                      <h3 className="font-headline text-base font-semibold text-[#041534]">
                        {source.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#75777F]">
                        <span>{source.publisher}</span>
                        <span>•</span>
                        <span>{source.date}</span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-[#191C1D]/80">
                        {source.excerpt}
                      </p>
                      {source.url && (
                        <div className="mt-4 space-y-2">
                          <span className="text-xs font-medium text-[#75777F]">
                            Primary source
                          </span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium text-[#041534] transition-colors hover:text-[#041534]/70"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {source.url}
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </span>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Share Modal */}
          <AnimatePresence>
            {shareModalOpen && data && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShareModalOpen(false)}
                  className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                  ref={shareModalRef}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#C5C6CF] bg-white shadow-2xl"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="share-modal-heading"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between">
                      <h3
                        id="share-modal-heading"
                        className="text-lg font-semibold text-[#041534]"
                      >
                        Share Receipt Card
                      </h3>
                      <Button
                        variant="ghost"
                        onClick={() => setShareModalOpen(false)}
                        className="flex-shrink-0"
                        aria-label="Close share modal"
                      >
                        <svg
                          className="h-5 w-5"
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
                      </Button>
                    </div>

                    {/* Receipt Card Preview */}
                    <div className="mb-6 rounded-lg border border-[#C5C6CF] bg-[#F5F6FF] p-4">
                      <h4 className="text-base font-semibold text-[#041534]">
                        {data.heading}
                      </h4>
                      {data.subheading && (
                        <p className="mt-1 text-sm text-[#75777F]">
                          {data.subheading}
                        </p>
                      )}
                      <div className="mt-4 space-y-3">
                        {data.sources.slice(0, 2).map((source, index) => (
                          <div key={index}>
                            <p className="text-sm font-medium text-[#191C1D]">
                              {source.title}
                            </p>
                            <p className="mt-0.5 text-xs text-[#75777F]">
                              {source.publisher} • {source.date}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 border-t border-[#C5C6CF] pt-3 text-xs text-[#75777F]">
                        Shared via Polititrack
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2"
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
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                        {linkCopied ? (
                          <span className="text-xs text-green-600">
                            Link copied
                          </span>
                        ) : (
                          <span className="text-xs">Copy link</span>
                        )}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={copyCardText}
                        className="flex items-center justify-center gap-2"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        {cardCopied ? (
                          <span className="text-xs">Card copied</span>
                        ) : (
                          <span className="text-xs">Copy card text</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ReceiptsDrawer() {
  return (
    <Suspense fallback={null}>
      <ReceiptsDrawerContent />
    </Suspense>
  );
}
