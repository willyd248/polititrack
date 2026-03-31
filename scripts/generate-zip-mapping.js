/**
 * Generate ZIP-to-congressional-district mapping from Census Bureau ZCTA relationship file.
 *
 * Usage: node scripts/generate-zip-mapping.js
 *
 * Source: Census Bureau ZCTA-to-CD relationship file (111th Congress baseline).
 * Covers ~33K US ZIP Code Tabulation Areas.
 *
 * Note: Uses 2010 census ZCTA-to-CD data as a comprehensive baseline.
 * State assignments are accurate; district boundaries may reflect 2010 lines.
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Census Bureau ZCTA-to-CD111 relationship file (CSV, ~5.5MB, freely available)
const CENSUS_URL =
  "https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_cd111_rel_10.txt";

// FIPS state codes → postal abbreviations
const STATE_FIPS = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR", "78": "VI",
};

// At-large and non-voting district codes → null district
const NULL_DISTRICT_CODES = new Set(["00", "98", "99"]);

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchUrl(res.headers.location, redirectCount + 1)
            .then(resolve)
            .catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Downloading Census ZCTA-to-CD111 relationship file…");
  const text = await fetchUrl(CENSUS_URL);
  const lines = text.trim().split("\n");
  console.log(`Downloaded ${lines.length} lines`);

  // Format: ZCTA5,STATE,CD,POPPT,...
  // Header is line 0
  const result = {};
  let skipped = 0;

  // Track which ZIPs we've assigned — pick the row with the highest population overlap
  // (ZPOPPCT column, index 15) so split ZIPs go to their primary district
  const zipScore = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 4) continue;

    const zcta = parts[0]?.trim();
    const stateFips = parts[1]?.trim();
    const cdCode = parts[2]?.trim();
    const zpoppct = parseFloat(parts[15] || "0"); // Population overlap %

    if (!zcta || zcta.length !== 5 || !/^\d{5}$/.test(zcta)) {
      skipped++;
      continue;
    }

    const state = STATE_FIPS[stateFips];
    if (!state) {
      skipped++;
      continue;
    }

    const district = NULL_DISTRICT_CODES.has(cdCode) ? null : cdCode.padStart(2, "0");

    // Only assign if this overlap is bigger than what we've seen for this ZIP
    const prevScore = zipScore[zcta] ?? -1;
    if (zpoppct >= prevScore) {
      result[zcta] = { state, district };
      zipScore[zcta] = zpoppct;
    }
  }

  const count = Object.keys(result).length;
  console.log(`Mapped ${count} ZIP codes (skipped ${skipped} rows)`);

  const outputPath = path.join(__dirname, "../data/zip-to-district.json");
  fs.writeFileSync(outputPath, JSON.stringify(result));
  console.log(`Written to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
