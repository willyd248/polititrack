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
                    <footer className="border-t border-gray-200 py-6 mt-4">
                      <div className="container-content mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
                        <span>© 2025 PolitiTrack</span>
                        <nav className="flex gap-4">
                          <a href="/privacy-policy.html" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
                          <a href="/terms.html" className="hover:text-gray-600 transition-colors">Terms of Service</a>
                        </nav>
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
      </body>
    </html>
  );
}
