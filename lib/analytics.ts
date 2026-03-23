/**
 * Analytics tracking stub
 * 
 * This is a no-op implementation that can be replaced with
 * a real analytics service (e.g., Google Analytics, Plausible, etc.)
 * without changing the calling code.
 */

export interface AnalyticsEvent {
  event: string;
  props?: Record<string, string | number | boolean>;
}

/**
 * Track an analytics event
 * 
 * This is a no-op stub that never throws. Replace this implementation
 * with your analytics service of choice.
 * 
 * @param event - Event name (e.g., "topic_selected", "receipt_opened")
 * @param props - Optional event properties
 */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    // No-op implementation - replace with your analytics service
    // Example implementations:
    //
    // Google Analytics 4:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', event, props);
    // }
    //
    // Plausible:
    // if (typeof window !== 'undefined' && window.plausible) {
    //   window.plausible(event, { props });
    // }
    //
    // Custom endpoint:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify({ event, props }),
    // }).catch(() => {}); // Silently fail
    
    // Development logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, props);
    }
  } catch (error) {
    // Never throw - analytics failures should not break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Analytics] Failed to track event:', error);
    }
  }
}

