/**
 * Shared competition shape. All competition data comes from the database —
 * there is no hardcoded catalogue on the client any more.
 */
export type Category = string;

export interface Competition {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  image: string;
  thumbUrl?: string;
  letterboxStyle?: "solid" | "gradient" | "blur";
  gallery: string[];
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  cashAlternative: number;
  maxPerPerson: number;
  endsAt: string; // ISO
  hot?: boolean;
  description: string;
  /** DB lifecycle status: "live" while it can still be drawn, "drawn" after. */
  status?: string;
}

