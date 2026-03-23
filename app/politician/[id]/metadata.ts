import { Metadata } from "next";
import { fetchMemberByBioguideId } from "../../../lib/congressMembers";
import { politicians } from "../../../data/politicians";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  
  // Try to fetch real member first
  let member = null;
  try {
    member = await fetchMemberByBioguideId(id);
  } catch (error) {
    // Fall back to mock data
  }
  
  // Use member data if available, otherwise fall back to mock politician
  const name = member?.fullName;
  const role = member
    ? member.chamber === "House"
      ? "U.S. Representative"
      : "U.S. Senator"
    : null;
  const state = member?.state;
  const district = member?.district;
  
  // If no member found, try mock politician
  const mockPolitician = !member ? politicians.find((p) => p.id === id) : null;
  const displayName = name || mockPolitician?.name || "Politician";
  const displayRole = role || mockPolitician?.role || "";
  const displayState = state || mockPolitician?.state || "";
  const displayDistrict = district || mockPolitician?.district;

  if (!member && !mockPolitician) {
    return {
      title: "Politician Not Found",
    };
  }

  // Build description based on chamber (Senate has no district)
  const description = member
    ? member.chamber === "House"
      ? `${displayRole || "U.S. Representative"} from ${displayState || "Unknown"}${displayDistrict ? `, District ${displayDistrict}` : ""}. View campaign finance, voting records, and public statements.`
      : `${displayRole || "U.S. Senator"} from ${displayState || "Unknown"}. View campaign finance, voting records, and public statements.`
    : `${displayRole || "Member of Congress"} from ${displayState || "Unknown"}${displayDistrict ? `, District ${displayDistrict}` : ""}. View campaign finance, voting records, and public statements.`;

  return {
    title: displayName,
    description,
    openGraph: {
      title: `${displayName} • Polititrack`,
      description,
      type: "profile",
      images: [
        {
          url: "/og",
          width: 1200,
          height: 630,
          alt: displayName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName} • Polititrack`,
      description,
      images: ["/og"],
    },
  };
}

