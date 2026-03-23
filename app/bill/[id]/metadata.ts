import { Metadata } from "next";
import { bills } from "../../../data/bills";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bill = bills.find((b) => b.id === id);

  if (!bill) {
    return {
      title: "Bill Not Found",
    };
  }

  const description = `${bill.name} - ${bill.status}. ${bill.summary[0] || "View bill details, timeline, and impacts."}`;

  return {
    title: `${bill.name} (${bill.status})`,
    description,
    openGraph: {
      title: `${bill.name} • Polititrack`,
      description,
      type: "article",
      images: [
        {
          url: "/og",
          width: 1200,
          height: 630,
          alt: bill.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${bill.name} • Polititrack`,
      description,
      images: ["/og"],
    },
  };
}

