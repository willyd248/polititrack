import { fetchBills } from "../lib/mappers/congressToBill";
import { fetchMembers } from "../lib/congressMembers";
import { bills as mockBills } from "../data/bills";
import { politicians as mockPoliticians } from "../data/politicians";
import { getYearsInOffice } from "../lib/yearsInOffice";
import HomeClient from "./page-client";

/**
 * Server component wrapper that fetches bills and members, passes them to client component
 */
export default async function Home() {
  // Try to fetch real bills, fallback to mock data if API is unavailable
  let bills = mockBills;
  let useMockData = true;
  
  try {
    const realBills = await fetchBills(10);
    if (realBills.length > 0) {
      bills = realBills;
      useMockData = false;
    }
  } catch (error) {
    // Silently fall back to mock data
    console.warn("Failed to fetch real bills, using mock data:", error);
  }

  // Try to fetch real members, fallback to mock politicians if API is unavailable
  // Resilient fallback: if fetch fails OR returns < 5 members, use mock data
  let members = null;
  let useMockMembers = true;
  let showDataUnavailableIndicator = false;
  
  try {
    const realMembers = await fetchMembers(119); // 119th Congress
    if (realMembers.length >= 5) {
      // Enrich members with years in office data
      const enrichedMembers = await Promise.all(
        realMembers.map(async (member) => {
          const years = await getYearsInOffice(member.bioguideId);
          return { ...member, yearsInOffice: years };
        })
      );
      members = enrichedMembers;
      useMockMembers = false;
    } else {
      // Got some data but not enough - mark as unavailable
      showDataUnavailableIndicator = true;
      console.warn(`Only received ${realMembers.length} members, falling back to mock data`);
    }
  } catch (error) {
    // Fetch failed - mark as unavailable
    showDataUnavailableIndicator = true;
    console.warn("Failed to fetch real members, using mock data:", error);
  }
  
  return (
    <HomeClient 
      bills={bills} 
      useMockData={useMockData}
      members={members}
      useMockMembers={useMockMembers}
      mockPoliticians={mockPoliticians}
      showDataUnavailableIndicator={showDataUnavailableIndicator}
    />
  );
}

