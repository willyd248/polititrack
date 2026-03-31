import type { Metadata } from "next";
import { Epilogue, Public_Sans } from "next/font/google";
import "./globals.css";
import { ReceiptsProvider } from "./store/receipts-store";
import { ReadingModeProvider } from "./store/reading-mode-store";
import { CommandPaletteProvider } from "./store/command-palette-store";
import { TopicLensProvider } from "./store/topic-lens-store";
import { CompareProvider } from "./store/compare-store";
import { SavedProvider } from "./store/saved-store";
import CompareTray from "./components/CompareTray";
import TopNav from "./components/TopNav";
import ReceiptsDrawer from "./components/ReceiptsDrawer";
import CommandPalette from "./components/CommandPalette";
import ReadingModeWrapper from "./components/ReadingModeWrapper";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "./components/PostHogProvider";
import { PostHogPageview } from "./components/PostHogPageview";
import { Suspense } from "react";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://polititrack-chi.vercel.app"),
  title: {
    template: "%s • Polititrack",
    default: "Polititrack",
  },
  description:
    "Understand where politicians get money from, how they vote, what they say, and what laws do and why they matter. All information is presented neutrally with sources.",
  openGraph: {
    siteName: "Polititrack",
    title: "Polititrack",
    description:
      "Understand where politicians get money from, how they vote, what they say, and what laws do and why they matter.",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Polititrack",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Polititrack",
    description:
      "Understand where politicians get money from, how they vote, what they say, and what laws do and why they matter.",
    images: ["/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${epilogue.variable} ${publicSans.variable} antialiased`}
        style={{ backgroundColor: "#F8F9FA" }}
      >
        <PostHogProvider>
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        <ReadingModeProvider>
          <TopicLensProvider>
            <CommandPaletteProvider>
              <CompareProvider>
                <SavedProvider>
                  <ReceiptsProvider>
                  <ReadingModeWrapper>
                    <TopNav />
                    <main className="container-content mx-auto px-6 py-12 pb-24">
                      {children}
                    </main>
                    <footer className="border-t border-outline-variant py-8 mt-4">
                      <div className="container-content mx-auto px-6 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#041534]">Support PolitiTrack</p>
                            <p className="text-xs text-[#75777F] mt-0.5">Help keep government data free and accessible.</p>
                          </div>
                          <a
                            href="https://buymeacoffee.com/polititrack"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded border border-[#C5C6CF] bg-white px-4 py-2 text-sm font-medium text-[#041534] hover:bg-[#EDEEEF] transition-colors self-start sm:self-auto"
                          >
                            ☕ Buy me a coffee
                          </a>
                        </div>
                        <div className="border-t border-outline-variant pt-4 flex items-center justify-between text-xs text-outline">
                          <span>© 2026 PolitiTrack</span>
                          <nav className="flex gap-4">
                            <a href="/privacy-policy.html" className="hover:text-on-surface-variant transition-colors">Privacy Policy</a>
                            <a href="/terms.html" className="hover:text-on-surface-variant transition-colors">Terms of Service</a>
                          </nav>
                        </div>
                      </div>
                    </footer>
                    <ReceiptsDrawer />
                    <CommandPalette />
                    <CompareTray />
                  </ReadingModeWrapper>
                </ReceiptsProvider>
                </SavedProvider>
              </CompareProvider>
            </CommandPaletteProvider>
          </TopicLensProvider>
        </ReadingModeProvider>
        <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
