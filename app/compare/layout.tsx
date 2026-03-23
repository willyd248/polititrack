import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare",
  description: "Side-by-side comparison of politicians' key metrics, funding sources, and policy positions.",
  openGraph: {
    title: "Compare • Polititrack",
    description: "Side-by-side comparison of politicians' key metrics, funding sources, and policy positions.",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Compare Politicians",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare • Polititrack",
    description: "Side-by-side comparison of politicians' key metrics, funding sources, and policy positions.",
    images: ["/og"],
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

