import { fetchMembers } from "../../lib/congressMembers";
import { politicians as mockPoliticians } from "../../data/politicians";
import MembersClient from "./page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Members of Congress",
  description:
    "Browse all 535+ members of the 119th U.S. Congress. Search by name, filter by state, party, or chamber.",
};

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([promise, timeout]);
}

export default async function MembersPage() {
  let members = null;
  let useMockData = false;

  try {
    const realMembers = await withTimeout(fetchMembers(119), 10000);
    if (realMembers && realMembers.length >= 5) {
      members = realMembers;
    } else {
      useMockData = true;
    }
  } catch {
    useMockData = true;
  }

  return (
    <MembersClient
      members={members}
      useMockData={useMockData}
      mockPoliticians={mockPoliticians}
    />
  );
}
