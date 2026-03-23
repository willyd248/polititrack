import type { Metadata } from "next";
import Link from "next/link";
import Card from "../components/ui/Card";
import { getSourceStatuses, isSourceDegraded } from "../../lib/dataHealth";

export const metadata: Metadata = {
  title: "Status",
  description: "Polititrack system status and version information.",
};

export default async function StatusPage() {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || "Not available";
  
  // Get health data directly from data health system
  let healthData = null;
  try {
    const statuses = getSourceStatuses();
    healthData = {
      sources: statuses.map((status) => {
        const degraded = isSourceDegraded(status);
        return {
          name: status.source === "congress" ? "Congress.gov" : "OpenFEC",
          status: status.ok ? "OK" : degraded ? "Degraded" : "Down",
          lastSuccess: status.lastSuccess
            ? new Date(status.lastSuccess).toISOString()
            : null,
          lastError: status.lastError || null,
          lastErrorTime: status.lastErrorTime
            ? new Date(status.lastErrorTime).toISOString()
            : null,
          lastErrorStatusCode: status.lastErrorStatusCode || null,
          lastErrorUrl: status.lastErrorUrl || null,
        };
      }),
    };
  } catch (error) {
    console.warn("Failed to get health data:", error);
  }

  return (
    <div className="reading-container space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Status
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          System information and deployment details.
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Version
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">v0.1</span>
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Build Information
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">Build time:</span> {buildTime}
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Data Sources
            </h2>
            {healthData && healthData.sources ? (
              <div className="space-y-4">
                {healthData.sources.map((source: any) => {
                  const statusColor =
                    source.status === "OK"
                      ? "text-green-600 dark:text-green-400"
                      : source.status === "Degraded"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400";
                  
                  return (
                    <div
                      key={source.name}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {source.name}
                        </span>
                        <span className={`font-medium ${statusColor}`}>
                          {source.status}
                        </span>
                      </div>
                      {source.lastSuccess && (
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                          Last success: {new Date(source.lastSuccess).toLocaleString()}
                        </p>
                      )}
                      {source.lastError && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Last error: {source.lastError}
                          </p>
                          {source.lastErrorStatusCode && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              Status code: {source.lastErrorStatusCode}
                            </p>
                          )}
                          {source.lastErrorUrl && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              Endpoint: {source.lastErrorUrl}
                            </p>
                          )}
                          {source.lastErrorTime && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              Time: {new Date(source.lastErrorTime).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">Status:</span> Unable to fetch health data
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Health monitoring is active but status is unavailable.
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Resources
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/methodology"
                  className="text-zinc-700 underline transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  Methodology
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-zinc-700 underline transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
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

