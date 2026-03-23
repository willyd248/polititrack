import type { Metadata } from "next";
import Card from "../components/ui/Card";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
  openGraph: {
    title: "Methodology • Polititrack",
    description:
      "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Methodology",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Methodology • Polititrack",
    description:
      "How Polititrack works, what it shows, and what it means. Learn about our neutral language policy, source citations, and data limitations.",
    images: ["/og"],
  },
};

export default function MethodologyPage() {
  return (
    <div className="reading-container space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Methodology
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          How Polititrack works, what it shows, and what it means.
        </p>
      </div>

      {/* What Polititrack is */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          What Polititrack Is (and Isn't)
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            Polititrack is a civic transparency tool designed to help people
            understand how government works. We present information about
            politicians' funding sources, voting records, and public statements
            in a neutral, fact-based format.
          </p>
          <p>
            Polititrack is not a news site, a political advocacy platform, or a
            scoring system. We don't tell you who to vote for or what to think.
            We provide the facts and sources so you can make informed decisions.
          </p>
        </div>
      </Card>

      {/* How Receipts Work */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          How Receipts Work
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            Every claim and statistic on Polititrack is backed by primary
            sources. When you see a "View receipts" button or citation, you can
            access the original sources that support that information.
          </p>
          <p>
            Receipts include links to official government databases, congressional
            records, campaign finance disclosures, and other primary sources.
            Each receipt shows the source title, publisher, date, and a brief
            excerpt explaining what it contains.
          </p>
          <p>
            You can copy receipts as formatted text to share or verify
            independently. All sources are publicly available and verifiable.
          </p>
        </div>
      </Card>

      {/* Topic Lens */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          What "Topic Lens" Means
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            Topic Lens is a filtering tool that lets you focus on specific policy
            areas across the site. When you select a topic (like Healthcare,
            Environment, or Infrastructure), relevant content is highlighted or
            filtered to show only that topic.
          </p>
          <p>
            Topic Lens helps you understand how politicians engage with specific
            policy areas without changing the underlying data. It's a way to
            organize information, not a judgment about importance or quality.
          </p>
        </div>
      </Card>

      {/* Compare Feature */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          What Compare Does (and Does Not Imply)
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            The Compare feature lets you view two politicians side-by-side to
            see their key metrics, funding sources, and policy positions. This
            is a factual comparison tool, not a ranking or scoring system.
          </p>
          <p>
            Compare shows you the same information that appears on individual
            politician pages, just presented together for easier viewing. It does
            not imply that one politician is "better" or "worse" than another.
            Different metrics matter to different people, and we present the
            facts without judgment.
          </p>
          <p>
            Use Compare to understand differences in voting patterns, funding
            sources, and policy positions. The interpretation and importance of
            these differences is up to you.
          </p>
        </div>
      </Card>

      {/* Neutral Language Policy */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Neutral Language Policy
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            Polititrack uses neutral, factual language throughout. We avoid
            inflammatory terms like "corrupt" or "liar" that make value
            judgments. Instead, we use descriptive terms like:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Alignment:</strong> When a politician's votes or statements
              align with their stated positions or party platform
            </li>
            <li>
              <strong>Mismatch:</strong> When there's a discrepancy between
              stated positions and actions
            </li>
            <li>
              <strong>Unclear:</strong> When information is incomplete or
              ambiguous
            </li>
          </ul>
          <p>
            This language policy ensures that Polititrack remains a tool for
            transparency and understanding, not political advocacy or
            character attacks.
          </p>
        </div>
      </Card>

      {/* Data Limitations */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Data Limitations
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            Currently, Polititrack uses mock data for demonstration purposes.
            This allows us to build and test the interface and user experience
            before integrating real data sources.
          </p>
          <p>
            In future versions, Polititrack will pull data from official sources
            including:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Federal Election Commission (FEC) campaign finance data</li>
            <li>Congressional voting records from GovTrack and Vote Smart</li>
            <li>Official congressional records and statements</li>
            <li>Publicly available bill text and status information</li>
          </ul>
          <p>
            All data will be clearly sourced with receipts, and we'll indicate
            when information is incomplete or unavailable.
          </p>
        </div>
      </Card>

      {/* Contact / Feedback */}
      <Card>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Contact & Feedback
        </h2>
        <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
          <p>
            We're building Polititrack to be a useful tool for civic engagement
            and transparency. Your feedback helps us improve.
          </p>
          <p>
            If you notice errors, have suggestions, or want to report issues with
            data sources, please reach out. We're committed to accuracy and
            continuous improvement.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Contact information will be available in a future version.
          </p>
        </div>
      </Card>
    </div>
  );
}

