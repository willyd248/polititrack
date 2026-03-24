import type { Metadata } from "next";
import Link from "next/link";
import Card from "../components/ui/Card";

export const metadata: Metadata = {
  title: "Status",
  description: "Polititrack system status and data source health.",
};

export const revalidate = 300; // Re-check every 5 minutes

interface SourceCheckResult {
  name: string;
  status: "OK" | "Down" | "Error";
  message: string;
  responseTimeMs: number;
}

async function checkCongressApi(): Promise<SourceCheckResult> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) {
    return { name: "Congress.gov", status: "Down", message: "API key not configured", responseTimeMs: 0 };
  }
  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.congress.gov/v3/member?api_key=${apiKey}&format=json&limit=1&currentMember=true`,
      { next: { revalidate: 300 } }
    );
    const elapsed = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      return { name: "Congress.gov", status: "Down", message: `HTTP ${res.status}: ${body.slice(0, 100)}`, responseTimeMs: elapsed };
    }
    const data = await res.json();
    const count = data.pagination?.count || data.members?.length || 0;
    return { name: "Congress.gov", status: "OK", message: `${count} current members available`, responseTimeMs: elapsed };
  } catch (err) {
    return { name: "Congress.gov", status: "Error", message: String(err), responseTimeMs: Date.now() - start };
  }
}

async function checkFecApi(): Promise<SourceCheckResult> {
  const apiKey = process.env.FEC_API_KEY;
  if (!apiKey) {
    return { name: "OpenFEC", status: "Down", message: "API key not configured", responseTimeMs: 0 };
  }
  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.open.fec.gov/v1/candidates/?api_key=${apiKey}&per_page=1`,
      { next: { revalidate: 300 } }
    );
    const elapsed = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      return { name: "OpenFEC", status: "Down", message: `HTTP ${res.status}: ${body.slice(0, 100)}`, responseTimeMs: elapsed };
    }
    const data = await res.json();
    const count = data.pagination?.count || 0;
    return { name: "OpenFEC", status: "OK", message: `${count.toLocaleString()} candidates in database`, responseTimeMs: elapsed };
  } catch (err) {
    return { name: "OpenFEC", status: "Error", message: String(err), responseTimeMs: Date.now() - start };
  }
}

export default async function StatusPage() {
  const [congressResult, fecResult] = await Promise.all([
    checkCongressApi(),
    checkFecApi(),
  ]);

  const sources = [congressResult, fecResult];

  return (
    <div className="reading-container space-y-8">
      <div className="space-y-4">
        <h1 className="font-headline text-3xl font-bold text-[#041534]">
          System Status
        </h1>
        <p className="text-sm text-[#75777F]">
          Live health checks of PolitiTrack&apos;s data sources.
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="font-headline text-lg font-semibold text-[#041534] mb-4">
              Data Sources
            </h2>
            <div className="space-y-3">
              {sources.map((source) => {
                const statusColor =
                  source.status === "OK"
                    ? "text-[#1B6B3A]"
                    : "text-[#BA1A1A]";
                const dotColor =
                  source.status === "OK"
                    ? "bg-[#1B6B3A]"
                    : "bg-[#BA1A1A]";

                return (
                  <div
                    key={source.name}
                    className="rounded border border-[#C5C6CF] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                        <span className="font-medium text-[#191C1D]">
                          {source.name}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${statusColor}`}>
                        {source.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#75777F]">
                      {source.message}
                    </p>
                    <p className="mt-1 text-xs text-[#75777F]">
                      Response time: {source.responseTimeMs}ms
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-headline text-lg font-semibold text-[#041534] mb-2">
              Version
            </h2>
            <p className="text-sm text-[#191C1D]">v1.1</p>
          </div>

          <div>
            <h2 className="font-headline text-lg font-semibold text-[#041534] mb-2">
              Congress
            </h2>
            <p className="text-sm text-[#191C1D]">119th Congress (2025-2027)</p>
          </div>

          <div>
            <h2 className="font-headline text-lg font-semibold text-[#041534] mb-2">
              Resources
            </h2>
            <ul className="space-y-1">
              <li>
                <Link href="/methodology" className="text-sm text-[#041534] underline hover:text-[#1B2A4A]">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-[#041534] underline hover:text-[#1B2A4A]">
                  Home
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
