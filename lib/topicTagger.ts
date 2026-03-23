/**
 * Simple topic inference from text using keyword matching
 * 
 * No ML, no external APIs - just basic keyword matching.
 * Returns the first matching topic or null.
 */

// Topic keywords map (case-insensitive matching)
const TOPIC_KEYWORDS: Record<string, string[]> = {
  Healthcare: [
    "health", "medical", "medicare", "medicaid", "hospital", "doctor", "patient",
    "prescription", "drug", "pharmaceutical", "insurance", "coverage", "treatment",
    "disease", "cancer", "mental health", "public health", "healthcare", "clinic",
  ],
  Environment: [
    "climate", "environment", "environmental", "carbon", "emission", "pollution",
    "renewable", "solar", "wind", "energy", "green", "clean energy", "sustainability",
    "conservation", "wildlife", "forest", "ocean", "water quality", "air quality",
    "epa", "environmental protection",
  ],
  Infrastructure: [
    "infrastructure", "transportation", "highway", "bridge", "road", "railway",
    "airport", "port", "transit", "public transit", "construction", "building",
    "broadband", "internet", "telecommunications", "water system", "sewer",
    "electric grid", "power grid",
  ],
  Defense: [
    "defense", "military", "armed forces", "navy", "army", "air force", "marines",
    "national security", "veteran", "veterans", "pentagon", "defense spending",
    "weapon", "defense contractor", "military base", "defense authorization",
  ],
  Agriculture: [
    "agriculture", "agricultural", "farm", "farming", "farmer", "crop", "livestock",
    "rural", "usda", "food security", "subsidy", "agricultural policy", "farm bill",
    "dairy", "wheat", "corn", "soybean", "agricultural export",
  ],
};

/**
 * Infer topic from text using keyword matching
 * 
 * @param text - Text to analyze (bill title, summary, etc.)
 * @returns Topic name if match found, null otherwise
 */
export function inferTopicFromText(text: string): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }
  
  const lowerText = text.toLowerCase();
  
  // Check each topic's keywords
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return topic;
      }
    }
  }
  
  return null;
}

/**
 * Example mappings:
 * 
 * "Climate Action Act of 2024" -> "Environment" (matches "climate")
 * "Healthcare Reform Bill" -> "Healthcare" (matches "healthcare")
 * "Infrastructure Investment Act" -> "Infrastructure" (matches "infrastructure")
 * "National Defense Authorization Act" -> "Defense" (matches "defense")
 * "Farm Bill 2024" -> "Agriculture" (matches "farm")
 * "Tax Reform Act" -> null (no matching keywords)
 */

