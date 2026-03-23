/**
 * Congress.gov API v3 client
 * 
 * Server-only utilities for fetching data from the Congress.gov API.
 * Do not import this in client components.
 * 
 * Documentation: https://api.congress.gov/
 */

import { recordSourceStatus } from "./dataHealth";

const CONGRESS_API_BASE_URL = "https://api.congress.gov/v3";

interface CongressFetchOptions {
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
 * Fetch data from Congress.gov API v3 with retry/backoff and timeout
 * 
 * @param path - API endpoint path (e.g., "/member", "/bill")
 * @param options - Fetch options including query params and cache settings
 * @returns Parsed JSON response
 * @throws Error if request fails after retries or returns non-200 status
 */
export async function congressFetch<T = unknown>(
  path: string,
  options: CongressFetchOptions = {}
): Promise<T> {
  const apiKey = process.env.CONGRESS_API_KEY;

  if (!apiKey) {
    const errorMessage = "CONGRESS_API_KEY is not set. Add it to your .env.local file.";
    recordSourceStatus("congress", false, errorMessage, null, path);
    throw new Error(errorMessage);
  }

  // Build query string
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    format: "json",
    ...Object.fromEntries(
      Object.entries(options.params || {}).map(([key, value]) => [
        key,
        String(value),
      ])
    ),
  });

  const url = `${CONGRESS_API_BASE_URL}${path}?${searchParams.toString()}`;
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
          : { revalidate: 3600 }, // Default: 1 hour cache
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
        const errorMessage = `Congress API rate limited (429): ${errorText || response.statusText}`;
        recordSourceStatus("congress", false, errorMessage, 429, path);
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
        const errorMessage = `Congress API server error (${response.status}): ${errorText || response.statusText}`;
        recordSourceStatus("congress", false, errorMessage, response.status, path);
        throw new Error(errorMessage);
      }

      // Handle other non-200 status codes (don't retry)
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const errorMessage = `Congress API error (${response.status}): ${errorText || response.statusText}`;
        recordSourceStatus("congress", false, errorMessage, response.status, path);
        throw new Error(errorMessage);
      }

      // Success
      const data = await response.json();
      recordSourceStatus("congress", true);
      return data as T;
    } catch (error) {
      // Handle timeout
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue; // Retry
        }
        const errorMessage = `Congress API timeout after ${TIMEOUT_MS}ms`;
        recordSourceStatus("congress", false, errorMessage, null, path);
        throw new Error(errorMessage);
      }

      // Handle other errors (network, etc.)
      if (error instanceof Error) {
        // If it's already a Congress API error, re-throw
        if (error.message.includes("Congress API")) {
          throw error;
        }
        
        // Otherwise, record and retry if attempts remain
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue; // Retry
        }
        
        // Max retries reached
        recordSourceStatus("congress", false, error.message, null, path);
        throw error;
      }

      // Unknown error type
      const errorMessage = `Failed to fetch from Congress API: ${String(error)}`;
      recordSourceStatus("congress", false, errorMessage, null, path);
      throw new Error(errorMessage);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("Congress API fetch failed after retries");
}

/**
 * Example usage:
 * 
 * // Get a specific member
 * const member = await congressFetch("/member/S000148", {
 *   params: { limit: 1 }
 * });
 * 
 * // Get bills with caching
 * const bills = await congressFetch("/bill", {
 *   params: { limit: 20 },
 *   revalidate: 1800 // 30 minutes
 * });
 */

