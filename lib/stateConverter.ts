/**
 * State name to code converter
 * 
 * Converts full state names to two-letter state codes (and vice versa)
 * for use with APIs that require specific formats.
 */

const STATE_NAME_TO_CODE: Record<string, string> = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY",
  "District of Columbia": "DC",
};

/**
 * Convert state name to two-letter code
 * 
 * @param state - Full state name (e.g., "California") or already a code (e.g., "CA")
 * @returns Two-letter state code (e.g., "CA") or original if already a code or not found
 */
export function stateNameToCode(state: string): string {
  if (!state) return state;
  
  // If it's already a 2-letter code, return as-is
  if (state.length === 2) {
    return state.toUpperCase();
  }
  
  // Look up full name
  const code = STATE_NAME_TO_CODE[state];
  if (code) {
    return code;
  }
  
  // Try case-insensitive lookup
  const normalizedState = state.trim();
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (name.toLowerCase() === normalizedState.toLowerCase()) {
      return code;
    }
  }
  
  // If not found, return original (might already be a code or unknown format)
  return state;
}

