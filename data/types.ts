export interface Source {
  id?: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  excerpt?: string;
}

export interface ReceiptPayload {
  key: string;
  heading: string;
  subheading?: string;
  sources: Source[];
}

export interface Vote {
  id: string;
  topic: string;
  date: string;
  description: string;
  position: "Yes" | "No" | "Abstain";
  /** How the majority of the member's party voted (if available) */
  partyMajorityPosition?: "Yes" | "No" | "Abstain";
  sources: Source[];
}

export interface Statement {
  id: string;
  title: string;
  topic?: string;
  date: string;
  text: string;
  sourceType: string;
  sources: Source[];
}

export interface TimelineEvent {
  id: string;
  topic?: string;
  date: string;
  title: string;
  details?: string;
  sources: Source[];
}

