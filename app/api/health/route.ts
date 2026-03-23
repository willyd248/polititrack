/**
 * Health check API route
 * 
 * Returns the current status of data sources (Congress.gov and OpenFEC).
 * Server-only endpoint.
 */

import { NextResponse } from "next/server";
import { getSourceStatuses, isSourceDegraded, hasSourceBeenCalled } from "../../../lib/dataHealth";

export async function GET() {
  try {
    const statuses = getSourceStatuses();
    
    const health = {
      sources: statuses.map((status) => {
        // Determine status: OK, Degraded, Down, or Unknown
        let statusLabel: "OK" | "Degraded" | "Down" | "Unknown";
        
        if (status.ok) {
          statusLabel = "OK";
        } else if (!hasSourceBeenCalled(status)) {
          // Source hasn't been called yet - show as Unknown
          statusLabel = "Unknown";
        } else {
          // Source has been called but failed
          const degraded = isSourceDegraded(status);
          statusLabel = degraded ? "Degraded" : "Down";
        }
        
        return {
          name: status.source === "congress" ? "Congress.gov" : "OpenFEC",
          status: statusLabel,
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
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(health);
  } catch (error) {
    // Never crash - return safe error response
    console.error("Error fetching health status:", error);
    return NextResponse.json(
      {
        sources: [
          {
            name: "Congress.gov",
            status: "Unknown",
            lastSuccess: null,
            lastError: "Failed to fetch health status",
            lastErrorTime: null,
          },
          {
            name: "OpenFEC",
            status: "Unknown",
            lastSuccess: null,
            lastError: "Failed to fetch health status",
            lastErrorTime: null,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

