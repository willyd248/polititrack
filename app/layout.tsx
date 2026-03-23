import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950`}
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
      </body>
    </html>
  );
}
