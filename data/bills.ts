import { TimelineEvent, Source } from "./types";

export interface BillSponsor {
  bioguideId: string;
  name: string;
  party?: string;
  state?: string;
}

export interface RelatedBill {
  id: string;
  title: string;
  type: string;
  number: string;
  congress: number;
  latestAction?: string;
}

export interface Bill {
  id: string;
  name: string;
  status: "Introduced" | "In Committee" | "Passed" | "Failed";
  topic?: string; // Inferred topic (e.g., "Healthcare", "Environment")
  summary: string[]; // Bullet points (derived from summaryText or mock)
  summaryText?: string; // Official summary text from Congress.gov (if available)
  sponsor?: BillSponsor;
  cosponsors?: BillSponsor[]; // Limited to 10
  cosponsorCount?: number; // Total count (may exceed displayed list)
  sponsorSources?: Source[]; // Sources for sponsor/cosponsor data
  subjects?: string[]; // Policy area and legislative subjects
  relatedBills?: RelatedBill[];
  textUrl?: string; // Link to full bill text on Congress.gov
  whatChangesForMostPeople: string[];
  whoIsImpacted: string[];
  argumentsFor: string[];
  argumentsAgainst: string[];
  statusAndNextSteps: Array<{
    step: string;
    date?: string;
  }>;
  timeline: TimelineEvent[];
  summarySources: Source[];
}

export const bills: Bill[] = [
  {
    id: "1",
    name: "Climate Action Act of 2024",
    status: "In Committee",
    summary: [
      "Establishes a national carbon reduction target of 50% by 2030",
      "Creates a carbon credit trading system for major industries",
      "Allocates $50B for renewable energy infrastructure",
      "Provides tax incentives for electric vehicle adoption",
    ],
    whatChangesForMostPeople: [
      "Electric vehicle tax credits increase to $7,500 for qualifying purchases",
      "Energy bills may increase slightly as utilities transition to renewable sources",
      "New job opportunities in renewable energy and infrastructure sectors",
    ],
    whoIsImpacted: [
      "Electric vehicle buyers",
      "Homeowners with solar panels",
      "Industrial facilities",
      "Energy consumers",
      "Renewable energy workers",
    ],
    argumentsFor: [
      "Addresses urgent climate crisis with measurable reduction targets",
      "Creates economic opportunities in green energy sector",
      "Reduces long-term environmental and health costs",
    ],
    argumentsAgainst: [
      "May increase energy costs for consumers during transition period",
      "Could burden industrial facilities with compliance costs",
      "Implementation timeline may be too aggressive for some sectors",
    ],
    statusAndNextSteps: [
      { step: "Committee review in progress", date: "2024-02-20" },
      { step: "Committee vote scheduled", date: "2024-03-15" },
      { step: "Full Senate vote (if passed)", date: "TBD" },
      { step: "House consideration (if passed)", date: "TBD" },
    ],
    timeline: [
      {
        id: "timeline-1",
        date: "2024-01-15",
        title: "Introduced in Senate",
        details:
          "Senator Jane Smith introduced the bill with 12 co-sponsors. Initial text includes carbon reduction targets and funding mechanisms.",
        topic: "Environment",
        sources: [
          {
            title: "Congressional Record",
            publisher: "U.S. Congress",
            date: "2024-01-15",
            excerpt:
              "Official record of the Climate Action Act introduction in the Senate, including bill text and co-sponsor information.",
            url: "https://www.congress.gov/",
          },
        ],
      },
      {
        id: "timeline-2",
        date: "2024-02-01",
        title: "Referred to Energy Committee",
        details:
          "Bill assigned to Senate Energy and Natural Resources Committee for review and markup. Committee has 60 days to report.",
        topic: "Environment",
        sources: [
          {
            title: "Committee Assignment Record",
            publisher: "U.S. Senate",
            date: "2024-02-01",
            excerpt:
              "Official record of bill referral to Senate Energy and Natural Resources Committee.",
            url: "https://www.senate.gov/",
          },
        ],
      },
      {
        id: "timeline-3",
        date: "2024-02-20",
        title: "Committee hearings begin",
        details:
          "First public hearing held with testimony from environmental groups, industry representatives, and policy experts. Additional hearings scheduled.",
        topic: "Environment",
        sources: [
          {
            title: "Committee Hearing Transcript",
            publisher: "U.S. Senate",
            date: "2024-02-20",
            excerpt:
              "Official transcript of the first committee hearing on the Climate Action Act, including witness testimony and member questions.",
            url: "https://www.senate.gov/",
          },
        ],
      },
      {
        id: "timeline-4",
        date: "2024-03-15",
        title: "Committee vote scheduled",
        details:
          "Committee markup session scheduled. Members will vote on amendments and final committee version before sending to full Senate.",
        topic: "Environment",
        sources: [
          {
            title: "Committee Schedule",
            publisher: "U.S. Senate",
            date: "2024-03-15",
            excerpt:
              "Official committee schedule showing markup session and vote date for the Climate Action Act.",
            url: "https://www.senate.gov/",
          },
        ],
      },
    ],
    summarySources: [
      {
        title: "Congressional Research Service Report",
        publisher: "CRS",
        date: "2024-03-01",
        excerpt:
          "Comprehensive analysis of Climate Action Act of 2024, including legislative history, key provisions, and potential impacts.",
        url: "https://www.crs.gov/",
      },
      {
        title: "Bill Text and Amendments",
        publisher: "Congress.gov",
        date: "2024-02-20",
        excerpt:
          "Full text of Climate Action Act of 2024, including all amendments, committee reports, and related documents.",
        url: "https://www.congress.gov/",
      },
    ],
  },
  {
    id: "2",
    name: "Healthcare Reform Bill",
    status: "Passed",
    summary: [
      "Expands Medicaid coverage to 2 million additional Americans",
      "Caps prescription drug costs for Medicare recipients",
      "Increases funding for rural healthcare facilities",
      "Establishes new mental health services grants",
    ],
    whatChangesForMostPeople: [
      "2 million more Americans eligible for Medicaid coverage",
      "Medicare recipients pay maximum $35/month for insulin",
      "Expanded access to mental health services in underserved areas",
    ],
    whoIsImpacted: [
      "Low-income families",
      "Medicare recipients",
      "Rural communities",
      "Mental health patients",
      "Healthcare providers",
    ],
    argumentsFor: [
      "Expands healthcare access to millions of underserved Americans",
      "Reduces prescription drug costs for seniors on fixed incomes",
      "Addresses critical gaps in rural healthcare infrastructure",
    ],
    argumentsAgainst: [
      "Increases federal spending and potential tax burden",
      "May strain healthcare provider capacity with expanded coverage",
      "Some argue it doesn't go far enough in addressing systemic issues",
    ],
    statusAndNextSteps: [
      { step: "Signed into law", date: "2024-02-15" },
      { step: "Implementation phase begins", date: "2024-03-01" },
      { step: "Medicaid expansion effective", date: "2024-07-01" },
      { step: "Drug price caps effective", date: "2024-09-01" },
    ],
    timeline: [
      {
        id: "timeline-5",
        date: "2023-11-10",
        title: "Introduced in House",
        details:
          "Representative introduced the bill with bipartisan support. Initial focus on Medicaid expansion and prescription drug pricing.",
        topic: "Healthcare",
        sources: [
          {
            title: "Congressional Record",
            publisher: "U.S. Congress",
            date: "2023-11-10",
            excerpt:
              "Official record of the Healthcare Reform Bill introduction in the House, including bill text and co-sponsor information.",
            url: "https://www.congress.gov/",
          },
        ],
      },
      {
        id: "timeline-6",
        date: "2023-12-05",
        title: "Passed House vote",
        details:
          "House passed the bill with 245-190 vote. Several amendments added during floor debate, including rural healthcare provisions.",
        topic: "Healthcare",
        sources: [
          {
            title: "Roll Call Vote Record",
            publisher: "U.S. House",
            date: "2023-12-05",
            excerpt:
              "Official roll call vote record for the Healthcare Reform Bill in the House, showing 245-190 vote.",
            url: "https://www.house.gov/",
          },
        ],
      },
      {
        id: "timeline-7",
        date: "2024-01-20",
        title: "Passed Senate vote",
        details:
          "Senate passed the bill with 52-48 vote. Compromise reached on Medicaid expansion timeline and funding mechanisms.",
        topic: "Healthcare",
        sources: [
          {
            title: "Roll Call Vote Record",
            publisher: "U.S. Senate",
            date: "2024-01-20",
            excerpt:
              "Official roll call vote record for the Healthcare Reform Bill in the Senate, showing 52-48 vote.",
            url: "https://www.senate.gov/",
          },
        ],
      },
      {
        id: "timeline-8",
        date: "2024-02-15",
        title: "Signed into law",
        details:
          "President signed the bill into law at White House ceremony. Implementation timeline set for various provisions over next 12 months.",
        topic: "Healthcare",
        sources: [
          {
            title: "Presidential Signing Statement",
            publisher: "White House",
            date: "2024-02-15",
            excerpt:
              "Official record of the Healthcare Reform Bill signing ceremony and presidential statement.",
            url: "https://www.whitehouse.gov/",
          },
        ],
      },
    ],
    summarySources: [
      {
        title: "Congressional Research Service Report",
        publisher: "CRS",
        date: "2024-03-01",
        excerpt:
          "Comprehensive analysis of Healthcare Reform Bill, including legislative history, key provisions, and potential impacts.",
        url: "https://www.crs.gov/",
      },
      {
        title: "Bill Text and Amendments",
        publisher: "Congress.gov",
        date: "2024-02-20",
        excerpt:
          "Full text of Healthcare Reform Bill, including all amendments, committee reports, and related documents.",
        url: "https://www.congress.gov/",
      },
    ],
  },
];

