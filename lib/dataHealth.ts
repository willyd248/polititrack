/**
 * Data Health Tracking System
 * 
 * Lightweight in-memory tracking of API source health.
 * Server runtime only - resets on server restart.
 * 
 * Never throws errors - designed to be safe and non-blocking.
 */

export type DataSource = "congress" | "fec";

export interface SourceStatus {
  source: DataSource;
  ok: boolean;
  lastSuccess: number | null; // Timestamp in milliseconds
  lastError: string | null;
  lastErrorTime: number | null; // Timestamp in milliseconds
  lastErrorStatusCode: number | null; // HTTP status code (e.g., 429, 500, 503)
  lastErrorUrl: string | null; // The endpoint path that failed
}

// In-memory map (server runtime only)
const statusMap = new Map<DataSource, SourceStatus>();

// Initialize default statuses
const initializeSource = (source: DataSource): SourceStatus => {
  return {
    source,
    ok: false, // Unknown until first call
    lastSuccess: null,
    lastError: null,
    lastErrorTime: null,
    lastErrorStatusCode: null,
    lastErrorUrl: null,
  };
};

/**
 * Record the status of a data source call
 * 
 * @param source - The data source name ("congress" or "fec")
 * @param ok - Whether the call succeeded
 * @param message - Optional error message if ok is false
 * @param statusCode - Optional HTTP status code (e.g., 429, 500)
 * @param url - Optional endpoint path that was called
 * 
 * Never throws - safe to call from anywhere
 */
export function recordSourceStatus(
  source: DataSource,
  ok: boolean,
  message?: string,
  statusCode?: number | null,
  url?: string | null
): void {
  try {
    const now = Date.now();
    const current = statusMap.get(source) || initializeSource(source);
    
    const updated: SourceStatus = {
      ...current,
      ok,
      ...(ok
        ? {
            lastSuccess: now,
            // Keep last error info for context
          }
        : {
            lastError: message || "Unknown error",
            lastErrorTime: now,
            lastErrorStatusCode: statusCode ?? null,
            lastErrorUrl: url ?? null,
            // Keep last success info for context
          }),
    };
    
    statusMap.set(source, updated);
  } catch (error) {
    // Silently fail - never crash the app
    console.warn("[DataHealth] Failed to record status:", error);
  }
}

/**
 * Get a read-only snapshot of all source statuses
 * 
 * @returns Array of source status objects
 */
export function getSourceStatuses(): SourceStatus[] {
  try {
    const sources: DataSource[] = ["congress", "fec"];
    return sources.map((source) => {
      const status = statusMap.get(source);
      return status || initializeSource(source);
    });
  } catch (error) {
    // Return empty array on error - never crash
    console.warn("[DataHealth] Failed to get statuses:", error);
    return [];
  }
}

/**
 * Get status for a specific source
 * 
 * @param source - The data source name
 * @returns Source status or null if not found
 */
export function getSourceStatus(source: DataSource): SourceStatus | null {
  try {
    return statusMap.get(source) || initializeSource(source);
  } catch (error) {
    console.warn("[DataHealth] Failed to get status:", error);
    return null;
  }
}

/**
 * Determine if a source has been called at least once
 * 
 * @param status - Source status
 * @returns true if the source has been called (has success or error history)
 */
export function hasSourceBeenCalled(status: SourceStatus | null): boolean {
  if (!status) return false;
  // If we have any history (success or error), the source has been called
  return status.lastSuccess !== null || status.lastErrorTime !== null;
}

/**
 * Determine if a source is "degraded" (has errors but may have succeeded recently)
 * 
 * @param status - Source status
 * @param maxAgeMs - Maximum age in milliseconds for "recent" success (default: 1 hour)
 * @returns true if degraded, false if OK or unknown
 */
export function isSourceDegraded(
  status: SourceStatus | null,
  maxAgeMs: number = 3600000 // 1 hour
): boolean {
  if (!status) return false; // Unknown = not degraded (not called yet)
  
  if (status.ok) return false; // Currently OK
  
  // If source hasn't been called yet, don't consider it degraded
  if (!hasSourceBeenCalled(status)) return false;
  
  // If we have a recent success, consider it degraded (not completely down)
  if (status.lastSuccess) {
    const age = Date.now() - status.lastSuccess;
    return age < maxAgeMs;
  }
  
  // Has been called, has errors, no recent success = degraded
  return true;
}

