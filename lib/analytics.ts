/**
 * Analytics tracking powered by Vercel Analytics
 *
 * Wraps @vercel/analytics `track()` so every call site
 * uses a single import and gets error-safe behaviour.
 */

import { track as vercelTrack } from "@vercel/analytics";

export interface AnalyticsEvent {
  event: string;
  props?: Record<string, string | number | boolean>;
}

/**
 * Track an analytics event via Vercel Analytics.
 *
 * Never throws — analytics failures must not break the app.
 *
 * @param event - Event name (e.g., "receipt_opened", "compare_opened")
 * @param props - Optional event properties
 */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    vercelTrack(event, props);

    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event, props);
    }
  } catch (error) {
    // Never throw - analytics failures should not break the app
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics] Failed to track event:", error);
    }
  }
}
