/**
 * District lookup utilities
 * 
 * Maps zip codes to congressional districts using a static dataset.
 * This is a starter implementation - can be extended with a full dataset or API.
 */

import zipToDistrictData from "../data/zip-to-district.json";

export interface DistrictInfo {
  state: string; // Two-letter state code (e.g., "CA")
  district: string | null; // House district number (e.g., "33") or null for at-large/Senate-only
}

/**
 * Lookup congressional district by zip code
 * 
 * @param zip - 5-digit zip code (string)
 * @returns DistrictInfo with state and district, or null if not found
 */
export function lookupDistrictByZip(zip: string): DistrictInfo | null {
  // Normalize zip code (remove spaces, ensure 5 digits)
  const normalizedZip = zip.trim().replace(/\s+/g, "");
  
  if (!/^\d{5}$/.test(normalizedZip)) {
    return null;
  }
  
  // Type assertion for JSON import
  const data = zipToDistrictData as Record<string, { state: string; district: string | null }>;
  
  const result = data[normalizedZip];
  if (!result) {
    return null;
  }
  
  return {
    state: result.state,
    district: result.district,
  };
}

/**
 * Get all available zip codes in the dataset (for testing/debugging)
 */
export function getAvailableZips(): string[] {
  const data = zipToDistrictData as Record<string, unknown>;
  return Object.keys(data);
}

