/**
 * OpenFEC API client
 * 
 * Server-only utilities for fetching data from the Federal Election Commission API.
 * Do not import this in client components.
 * 
 * Documentation: https://api.open.fec.gov/developers/
 */

import { recordSourceStatus } from "./dataHealth";

const FEC_API_BASE_URL = "https://api.open.fec.gov/v1";

interface FecFetchOptions {
  params?: Record<string, string | number | boolean>;
  revalidate?: number; // Cache revalidation time in seconds
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch data from OpenFEC API with retry/backoff and timeout
 * 
 * @param path - API endpoint path (e.g., "/candidates", "/committees")
 * @param options - Fetch options including query params and cache settings
 * @returns Parsed JSON response
 * @throws Error if request fails after retries or returns non-200 status
 */
export async function fecFetch<T = unknown>(
  path: string,
  options: FecFetchOptions = {}
): Promise<T> {
  const apiKey = process.env.FEC_API_KEY;

  if (!apiKey) {
    const errorMessage = "FEC_API_KEY is not set. Add it to your .env.local file.";
    recordSourceStatus("fec", false, errorMessage, null, path);
    throw new Error(errorMessage);
  }

  // Build query string
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    ...Object.fromEntries(
      Object.entries(options.params || {}).map(([key, value]) => [
        key,
        String(value),
      ])
    ),
  });

  const url = `${FEC_API_BASE_URL}${path}?${searchParams.toString()}`;
  const TIMEOUT_MS = 8000; // 8 second timeout
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        next: options.revalidate
          ? { revalidate: options.revalidate }
          : { revalidate: 86400 }, // Default: 24 hour cache (FEC rate limit is 60/hr)
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      // Handle 429 (Rate Limited) with Retry-After header
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : Math.pow(2, attempt); // Exponential backoff if no Retry-After
        
        if (attempt < MAX_RETRIES) {
          await sleep(retrySeconds * 1000);
          continue; // Retry
        }
        
        // Max retries reached
        const errorText = await response.text().catch(() => "");
        const errorMessage = `FEC API rate limited (429): ${errorText || response.statusText}`;
        recordSourceStatus("fec", false, errorMessage, 429, path);
        throw new Error(errorMessage);
      }

      // Handle 5xx errors with retry
      if (response.status >= 500 && response.status < 600) {
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s
          await sleep(Math.pow(2, attempt) * 1000);
          continue; // Retry
        }
        
        // Max retries reached
        const errorText = await response.text().catch(() => "");
        const errorMessage = `FEC API server error (${response.status}): ${errorText || response.statusText}`;
        recordSourceStatus("fec", false, errorMessage, response.status, path);
        throw new Error(errorMessage);
      }

      // Handle other non-200 status codes (don't retry)
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const errorMessage = `FEC API error (${response.status}): ${errorText || response.statusText}`;
        recordSourceStatus("fec", false, errorMessage, response.status, path);
        throw new Error(errorMessage);
      }

      // Success
      const data = await response.json();
      recordSourceStatus("fec", true);
      return data as T;
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue; // Retry
        }
        const errorMessage = `FEC API timeout after ${TIMEOUT_MS}ms`;
        recordSourceStatus("fec", false, errorMessage, null, path);
        throw new Error(errorMessage);
      }

      // Handle other errors (network, etc.)
      if (error instanceof Error) {
        // If it's already a FEC API error, re-throw
        if (error.message.includes("FEC API")) {
          throw error;
        }
        
        // Otherwise, record and retry if attempts remain
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue; // Retry
        }
        
        // Max retries reached
        recordSourceStatus("fec", false, error.message, null, path);
        throw error;
      }

      // Unknown error type
      const errorMessage = `Failed to fetch from FEC API: ${String(error)}`;
      recordSourceStatus("fec", false, errorMessage, null, path);
      throw new Error(errorMessage);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("FEC API fetch failed after retries");
}

/**
 * Example usage:
 * 
 * // Get candidate by ID
 * const candidate = await fecFetch("/candidate/C00000001", {
 *   params: { election_year: 2024 }
 * });
 * 
 * // Get committee contributions with caching
 * const contributions = await fecFetch("/schedules/schedule_a", {
 *   params: { committee_id: "C00000001", limit: 100 },
 *   revalidate: 1800 // 30 minutes
 * });
 */

