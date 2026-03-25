/**
 * Generate FEC candidate ID mapping from unitedstates/congress-legislators dataset.
 *
 * Usage: node scripts/generate-fec-mapping.js
 *
 * Fetches the YAML dataset, extracts bioguide -> FEC ID mappings for all current
 * Congress members, and writes data/fec-mapping.ts.
 *
 * Requires: js-yaml (npm install js-yaml --save-dev)
 */

const fs = require("fs");
const https = require("https");
const path = require("path");

const DATASET_URL =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml";

const OUTPUT_PATH = path.join(__dirname, "../data/fec-mapping.ts");

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Fetching legislators dataset...");
  const yamlContent = await fetchUrl(DATASET_URL);

  let yaml;
  try {
    yaml = require("js-yaml");
  } catch {
    console.error("ERROR: js-yaml not found. Run: npm install js-yaml --save-dev");
    process.exit(1);
  }

  const data = yaml.load(yamlContent);
  console.log(`Parsed ${data.length} legislators`);

  const entries = [];
  for (const m of data) {
    const bioguide = m.id?.bioguide;
    const fecIds = m.id?.fec;
    if (bioguide && fecIds?.length > 0) {
      const name =
        m.name?.official_full || `${m.name?.first} ${m.name?.last}`;
      entries.push({ bioguide, fecId: fecIds[0], name });
    }
  }
  entries.sort((a, b) => a.bioguide.localeCompare(b.bioguide));

  const withoutFec = data.filter((m) => !m.id?.fec?.length);
  if (withoutFec.length > 0) {
    console.warn(
      `WARNING: ${withoutFec.length} members have no FEC ID in dataset:`
    );
    withoutFec.forEach((m) =>
      console.warn(`  ${m.id?.bioguide} — ${m.name?.official_full}`)
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const lines = entries.map(
    (e) => `  ${JSON.stringify(e.bioguide)}: ${JSON.stringify(e.fecId)}, // ${e.name}`
  );

  const output = `/**
 * FEC Candidate ID mapping by Bioguide ID
 *
 * This table maps Bioguide IDs to their corresponding FEC candidate IDs
 * for campaign finance data lookups.
 *
 * FEC candidate IDs are used to query the OpenFEC API for campaign finance data.
 *
 * AUTO-GENERATED from unitedstates/congress-legislators dataset.
 * Source: https://github.com/unitedstates/congress-legislators
 * Generated: ${today}
 * Coverage: ${entries.length} / ${data.length} current Congress members
 *
 * To regenerate: node scripts/generate-fec-mapping.js
 */

export const FEC_CANDIDATE_BY_BIOGUIDE: Record<string, string> = {
${lines.join("\\n")}
};

/**
 * FEC Candidate ID format validation pattern.
 * Real format: H/S/P followed by 8 alphanumeric characters (e.g., "H6AL04098", "S8WA00194")
 */
const FEC_CANDIDATE_ID_PATTERN = /^[HSP][A-Z0-9]{8}$/;

/**
 * Validate FEC candidate ID format
 */
function isValidFecCandidateIdFormat(fecId: string): boolean {
  return FEC_CANDIDATE_ID_PATTERN.test(fecId);
}

/**
 * Validate all FEC candidate IDs in the mapping table
 */
function validateFecMappings(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  for (const [bioguideId, fecId] of Object.entries(FEC_CANDIDATE_BY_BIOGUIDE)) {
    if (!isValidFecCandidateIdFormat(fecId)) {
      console.warn(
        \\\`[FEC Mapping Validation] Invalid FEC candidate ID format for bioguideId "\\\${bioguideId}": "\\\${fecId}". \\\` +
        \\\`Expected format: H/S/P followed by 8 alphanumeric characters (e.g., "H6AL04098", "S8WA00194").\\\`
      );
    }
  }
}

/**
 * Get FEC candidate ID for a given bioguideId
 */
export function getFecCandidateIdForBioguide(bioguideId: string): string | null {
  const fecId = FEC_CANDIDATE_BY_BIOGUIDE[bioguideId];

  if (!fecId) {
    return null;
  }

  if (process.env.NODE_ENV === "development" && !isValidFecCandidateIdFormat(fecId)) {
    console.warn(
      \\\`[FEC Mapping Validation] Invalid FEC candidate ID format for bioguideId "\\\${bioguideId}": "\\\${fecId}". \\\` +
      \\\`Expected format: H/S/P followed by 8 alphanumeric characters (e.g., "H6AL04098", "S8WA00194").\\\`
    );
  }

  return fecId;
}

// Validate mappings on module load (development only)
validateFecMappings();
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(\`\\nWrote \${entries.length} entries to \${OUTPUT_PATH}\`);
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
