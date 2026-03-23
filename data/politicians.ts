import { Vote, Statement, Source } from "./types";

export interface Politician {
  id: string;
  name: string;
  role: string;
  district?: string;
  state: string;
  committees: string[];
  keyTakeaways: string[];
  whyThisMatters: string;
  metrics: {
    topDonorCategory: string;
    votesThisYear: number;
    billsSponsored: number;
  };
  money: {
    summary: string;
    moduleSummary: string;
    topContributors: Array<{
      name: string;
      amount: string;
    }>;
    sources: Source[];
  };
  votes: {
    moduleSummary: string;
    votes: Vote[];
  };
  statements: {
    moduleSummary: string;
    statements: Statement[];
  };
}

export const politicians: Politician[] = [
  {
    id: "1",
    name: "Senator Jane Smith",
    role: "U.S. Senator",
    state: "California",
    committees: ["Finance", "Judiciary", "Energy"],
    keyTakeaways: [
      "Top recipient of tech industry contributions in 2023",
      "Voted with party 92% of the time on key legislation",
      "Authored 3 major bills on climate policy",
      "Received $2.4M in campaign contributions last cycle",
    ],
    whyThisMatters:
      "Understanding a politician's funding sources and voting patterns helps reveal potential influences on their policy decisions.",
    metrics: {
      topDonorCategory: "Technology",
      votesThisYear: 127,
      billsSponsored: 3,
    },
    money: {
      summary:
        "Senator Smith's campaign received $2.4M in contributions during the 2023-2024 cycle, with technology companies representing the largest sector.",
      moduleSummary:
        "Campaign finance data reveals the sources of funding and potential influences on policy decisions.",
      topContributors: [
        { name: "TechPAC", amount: "$450,000" },
        { name: "Green Energy Fund", amount: "$320,000" },
        { name: "California Business Alliance", amount: "$280,000" },
      ],
      sources: [
        {
          title: "FEC Campaign Finance Report",
          publisher: "Federal Election Commission",
          date: "2024-03-01",
          excerpt:
            "Complete campaign finance disclosure for Senator Jane Smith, including all contributions, expenditures, and top contributors for the 2023-2024 cycle.",
          url: "https://www.fec.gov/data/",
        },
        {
          title: "OpenSecrets Analysis",
          publisher: "Center for Responsive Politics",
          date: "2024-02-15",
          excerpt:
            "Industry breakdown and top contributor analysis for Senator Jane Smith's campaign funding.",
          url: "https://www.opensecrets.org/",
        },
      ],
    },
    votes: {
      moduleSummary:
        "Voting records show how this politician has voted on key legislation across different policy areas.",
      votes: [
        {
          id: "vote-1",
          description: "Infrastructure Investment Act",
          position: "Yes",
          date: "2024-01-15",
          topic: "Infrastructure",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-01-15",
              excerpt: "Official roll call vote record for the Infrastructure Investment Act.",
              url: "https://www.senate.gov/",
            },
          ],
        },
        {
          id: "vote-2",
          description: "Highway Modernization Bill",
          position: "Yes",
          date: "2024-01-22",
          topic: "Infrastructure",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-01-22",
              excerpt: "Official roll call vote record for the Highway Modernization Bill.",
              url: "https://www.senate.gov/",
            },
          ],
        },
        {
          id: "vote-3",
          description: "Healthcare Reform Bill",
          position: "No",
          date: "2024-02-20",
          topic: "Healthcare",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-02-20",
              excerpt: "Official roll call vote record for the Healthcare Reform Bill.",
              url: "https://www.senate.gov/",
            },
          ],
        },
        {
          id: "vote-4",
          description: "Medicare Expansion Act",
          position: "No",
          date: "2024-02-25",
          topic: "Healthcare",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-02-25",
              excerpt: "Official roll call vote record for the Medicare Expansion Act.",
              url: "https://www.senate.gov/",
            },
          ],
        },
        {
          id: "vote-5",
          description: "Climate Action Act",
          position: "Yes",
          date: "2024-03-10",
          topic: "Environment",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-03-10",
              excerpt: "Official roll call vote record for the Climate Action Act.",
              url: "https://www.senate.gov/",
            },
          ],
        },
        {
          id: "vote-6",
          description: "Renewable Energy Tax Credit",
          position: "Yes",
          date: "2024-03-18",
          topic: "Environment",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. Senate",
              date: "2024-03-18",
              excerpt: "Official roll call vote record for the Renewable Energy Tax Credit.",
              url: "https://www.senate.gov/",
            },
          ],
        },
      ],
    },
    statements: {
      moduleSummary:
        "Public statements and speeches provide insight into policy positions and priorities.",
      statements: [
        {
          id: "stmt-1",
          title: "On Climate Policy",
          date: "2024-03-15",
          text:
            "We must take decisive action to address climate change while ensuring economic stability for working families.",
          sourceType: "Senate Floor Speech",
          topic: "Environment",
          sources: [
            {
              title: "Congressional Record",
              publisher: "U.S. Congress",
              date: "2024-03-15",
              excerpt:
                "Official record of Senator Jane Smith's statement on climate policy from the Senate floor.",
              url: "https://www.congress.gov/",
            },
            {
              title: "Press Release",
              publisher: "Senator's Office",
              date: "2024-03-15",
              excerpt: "Official press release with full statement text and context.",
              url: "#",
            },
          ],
        },
        {
          id: "stmt-2",
          title: "Tech Regulation",
          date: "2024-02-28",
          text:
            "Technology companies need responsible oversight, but we must be careful not to stifle innovation.",
          sourceType: "Press Release",
          topic: "Technology",
          sources: [
            {
              title: "Press Release",
              publisher: "Senator's Office",
              date: "2024-02-28",
              excerpt: "Official press release on technology regulation.",
              url: "#",
            },
          ],
        },
        {
          id: "stmt-3",
          title: "Infrastructure Investment",
          date: "2024-01-20",
          text:
            "Investing in our nation's infrastructure is critical for economic growth and competitiveness in the 21st century.",
          sourceType: "Committee Hearing",
          topic: "Infrastructure",
          sources: [
            {
              title: "Committee Hearing Transcript",
              publisher: "U.S. Senate",
              date: "2024-01-20",
              excerpt: "Official transcript of committee hearing on infrastructure investment.",
              url: "https://www.congress.gov/",
            },
          ],
        },
      ],
    },
  },
  {
    id: "2",
    name: "Representative John Doe",
    role: "U.S. Representative",
    district: "TX-05",
    state: "Texas",
    committees: ["Armed Services", "Agriculture"],
    keyTakeaways: [
      "Strong advocate for defense spending",
      "Received significant contributions from defense contractors",
      "Voted against recent healthcare expansion",
      "Serves on two key committees",
    ],
    whyThisMatters:
      "Tracking funding sources and voting records provides transparency into how special interests may shape legislative priorities.",
    metrics: {
      topDonorCategory: "Defense",
      votesThisYear: 98,
      billsSponsored: 2,
    },
    money: {
      summary:
        "Representative Doe's campaign received $1.8M in contributions, with defense and agriculture sectors as primary sources.",
      moduleSummary:
        "Campaign finance data reveals the sources of funding and potential influences on policy decisions.",
      topContributors: [
        { name: "Defense Industry PAC", amount: "$380,000" },
        { name: "Texas Agriculture Fund", amount: "$290,000" },
        { name: "Energy Producers Alliance", amount: "$250,000" },
      ],
      sources: [
        {
          title: "FEC Campaign Finance Report",
          publisher: "Federal Election Commission",
          date: "2024-03-01",
          excerpt:
            "Complete campaign finance disclosure for Representative John Doe, including all contributions, expenditures, and top contributors for the 2023-2024 cycle.",
          url: "https://www.fec.gov/data/",
        },
        {
          title: "OpenSecrets Analysis",
          publisher: "Center for Responsive Politics",
          date: "2024-02-15",
          excerpt:
            "Industry breakdown and top contributor analysis for Representative John Doe's campaign funding.",
          url: "https://www.opensecrets.org/",
        },
      ],
    },
    votes: {
      moduleSummary:
        "Voting records show how this politician has voted on key legislation across different policy areas.",
      votes: [
        {
          id: "vote-7",
          description: "Defense Authorization Act",
          position: "Yes",
          date: "2024-01-10",
          topic: "Defense",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. House",
              date: "2024-01-10",
              excerpt: "Official roll call vote record for the Defense Authorization Act.",
              url: "https://www.house.gov/",
            },
          ],
        },
        {
          id: "vote-8",
          description: "Military Pay Increase Bill",
          position: "Yes",
          date: "2024-01-18",
          topic: "Defense",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. House",
              date: "2024-01-18",
              excerpt: "Official roll call vote record for the Military Pay Increase Bill.",
              url: "https://www.house.gov/",
            },
          ],
        },
        {
          id: "vote-9",
          description: "Healthcare Reform Bill",
          position: "No",
          date: "2024-02-20",
          topic: "Healthcare",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. House",
              date: "2024-02-20",
              excerpt: "Official roll call vote record for the Healthcare Reform Bill.",
              url: "https://www.house.gov/",
            },
          ],
        },
        {
          id: "vote-10",
          description: "Farm Subsidy Bill",
          position: "Yes",
          date: "2024-03-05",
          topic: "Agriculture",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. House",
              date: "2024-03-05",
              excerpt: "Official roll call vote record for the Farm Subsidy Bill.",
              url: "https://www.house.gov/",
            },
          ],
        },
        {
          id: "vote-11",
          description: "Crop Insurance Expansion",
          position: "Yes",
          date: "2024-03-12",
          topic: "Agriculture",
          sources: [
            {
              title: "Roll Call Vote Record",
              publisher: "U.S. House",
              date: "2024-03-12",
              excerpt: "Official roll call vote record for the Crop Insurance Expansion.",
              url: "https://www.house.gov/",
            },
          ],
        },
      ],
    },
    statements: {
      moduleSummary:
        "Public statements and speeches provide insight into policy positions and priorities.",
      statements: [
        {
          id: "stmt-4",
          title: "Defense Priorities",
          date: "2024-03-01",
          text:
            "Maintaining a strong national defense is essential for our security and economic interests.",
          sourceType: "House Floor Speech",
          topic: "Defense",
          sources: [
            {
              title: "Congressional Record",
              publisher: "U.S. Congress",
              date: "2024-03-01",
              excerpt:
                "Official record of Representative John Doe's statement on defense priorities from the House floor.",
              url: "https://www.congress.gov/",
            },
          ],
        },
        {
          id: "stmt-5",
          title: "Agriculture Support",
          date: "2024-02-15",
          text:
            "Our farmers are the backbone of America, and we must ensure they have the support they need to thrive.",
          sourceType: "Press Release",
          topic: "Agriculture",
          sources: [
            {
              title: "Press Release",
              publisher: "Representative's Office",
              date: "2024-02-15",
              excerpt: "Official press release on agriculture support.",
              url: "#",
            },
          ],
        },
      ],
    },
  },
];

