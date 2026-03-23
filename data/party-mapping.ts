/**
 * Party affiliation mapping for Congress members
 * 
 * This is a fallback mapping when Congress.gov API and dataset lookups fail.
 * Maps bioguideId -> party code (D, R, I)
 * 
 * NOTE: House members are matched dynamically via data/house-party-list.ts
 * This file contains only Senate members and known House member overrides.
 */

export const PARTY_BY_BIOGUIDE: Record<string, string> = {
  // Senate - 118th Congress (2024-2025)
  // Only verified bioguideIds are included here
  
  // Alabama
  "B001314": "R", // Katie Boyd Britt
  "T000278": "R", // Tommy Tuberville
  
  // Alaska
  "M001153": "R", // Lisa Murkowski
  // Note: Dan Sullivan needs correct bioguideId
  
  // Arizona
  "G001091": "D", // Ruben Gallego
  "K000377": "D", // Mark Kelly
  
  // Arkansas
  "B001236": "R", // John Boozman
  "C001095": "R", // Tom Cotton
  
  // California
  "P000603": "D", // Alex Padilla
  "S001181": "D", // Adam B. Schiff
  
  // Colorado
  "B001275": "D", // Michael F. Bennet
  "H001095": "D", // John W. Hickenlooper
  
  // Connecticut
  "B000944": "D", // Richard Blumenthal
  "M001169": "D", // Christopher Murphy
  
  // Delaware
  "B001313": "D", // Lisa Blunt Rochester
  "C001088": "D", // Christopher A. Coons
  
  // Florida
  "M001243": "R", // Ashley Moody
  // Note: Rick Scott needs correct bioguideId
  
  // Georgia
  "O000172": "D", // Jon Ossoff
  // Note: Raphael Warnock needs correct bioguideId
  
  // Hawaii
  "H001042": "D", // Mazie K. Hirono
  "S001194": "D", // Brian Schatz
  
  // Idaho
  "C000880": "R", // Mike Crapo
  "R000584": "R", // James E. Risch
  
  // Illinois
  "D000563": "D", // Tammy Duckworth
  "D000622": "D", // Richard J. Durbin
  
  // Indiana
  "B001310": "R", // Jim Banks
  "Y000064": "R", // Todd Young
  
  // Iowa
  "E000295": "R", // Joni Ernst
  "G000386": "R", // Chuck Grassley
  
  // Kansas
  "M000934": "R", // Roger Marshall
  // Note: Jerry Moran needs correct bioguideId
  
  // Kentucky
  "M000355": "R", // Mitch McConnell
  // Note: Rand Paul needs correct bioguideId
  
  // Louisiana
  "K000383": "R", // John Kennedy
  // Note: Bill Cassidy needs correct bioguideId
  
  // Maine
  "C001035": "R", // Susan M. Collins
  "K000367": "I", // Angus S. King, Jr.
  
  // Maryland
  "A000377": "D", // Angela D. Alsobrooks
  
  // Massachusetts
  "M000133": "D", // Edward J. Markey
  "W000817": "D", // Elizabeth Warren
  
  // Michigan
  "P000595": "D", // Gary C. Peters
  "S001227": "D", // Elissa Slotkin
  
  // Minnesota
  "S001203": "D", // Tina Smith
  // Note: Amy Klobuchar needs correct bioguideId
  
  // Mississippi
  // Note: Cindy Hyde-Smith and Roger Wicker need correct bioguideIds
  
  // Missouri
  "H001089": "R", // Josh Hawley
  "S001217": "R", // Eric Schmitt
  
  // Montana
  "D000618": "R", // Steve Daines
  "S001198": "R", // Tim Sheehy
  
  // Nebraska
  "F000463": "R", // Deb Fischer
  "R000605": "R", // Pete Ricketts
  
  // Nevada
  "C001113": "D", // Catherine Cortez Masto
  "R000575": "D", // Jacky Rosen
  
  // New Hampshire
  "H001046": "D", // Margaret Wood Hassan
  "S001150": "D", // Jeanne Shaheen
  
  // New Jersey
  "K000394": "D", // Andy Kim
  // Note: Cory Booker needs correct bioguideId
  
  // New Mexico
  "H001041": "D", // Martin Heinrich
  "L000570": "D", // Ben Ray Luján
  
  // New York
  "G000555": "D", // Kirsten E. Gillibrand
  // Note: Chuck Schumer needs correct bioguideId
  
  // North Carolina
  "B001305": "R", // Ted Budd
  "T000461": "R", // Thom Tillis
  
  // North Dakota
  "C001096": "R", // Kevin Cramer
  "H001061": "R", // John Hoeven
  
  // Ohio
  "H000601": "R", // Jon Husted
  "M001242": "R", // Bernie Moreno
  
  // Oklahoma
  "M001176": "R", // Markwayne Mullin
  // Note: James Lankford needs correct bioguideId
  
  // Oregon
  "M001111": "D", // Jeff Merkley
  "W000779": "D", // Ron Wyden
  
  // Pennsylvania
  "F000479": "D", // John Fetterman
  "M001190": "R", // David McCormick
  
  // Rhode Island
  "R000122": "D", // Jack Reed
  "W000802": "D", // Sheldon Whitehouse
  
  // South Carolina
  "G000359": "R", // Lindsey Graham
  "S001184": "R", // Tim Scott
  
  // South Dakota
  "T000250": "R", // John Thune
  // Note: Mike Rounds needs correct bioguideId
  
  // Tennessee
  "B001243": "R", // Marsha Blackburn
  "H001076": "R", // Bill Hagerty
  
  // Texas
  "C001056": "R", // John Cornyn
  "C001098": "R", // Ted Cruz
  
  // Utah
  "C001114": "R", // John R. Curtis
  "L000577": "R", // Mike Lee
  
  // Vermont
  "S000033": "I", // Bernard Sanders
  "W000437": "D", // Peter Welch
  
  // Virginia
  "W000805": "D", // Mark R. Warner
  // Note: Tim Kaine needs correct bioguideId
  
  // Washington
  "C000127": "D", // Maria Cantwell
  "M000303": "D", // Patty Murray
  
  // West Virginia
  "C001075": "R", // Shelley Moore Capito
  "J000312": "R", // James C. Justice
  
  // Wisconsin
  "B001230": "D", // Tammy Baldwin
  "J000293": "R", // Ron Johnson
  
  // Wyoming
  "B001261": "R", // John Barrasso
  "L000571": "R", // Cynthia M. Lummis
  
  // House members are matched dynamically via data/house-party-list.ts
  // No need to list them here - they're matched by name+state+district
};

/**
 * Get party affiliation for a member by bioguideId
 * 
 * @param bioguideId - Bioguide ID (e.g., "S000148")
 * @returns Party code ("D", "R", "I") or null if not found
 */
export function getPartyForBioguideFromMapping(bioguideId: string): string | null {
  return PARTY_BY_BIOGUIDE[bioguideId] || null;
}
