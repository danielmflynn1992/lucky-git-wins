import audi from "@/assets/prize-audi.jpg";
import tech from "@/assets/prize-tech.jpg";
import cash from "@/assets/prize-cash.jpg";
import holiday from "@/assets/prize-holiday.jpg";
import ps5 from "@/assets/prize-ps5.jpg";
import watch from "@/assets/prize-watch.jpg";

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
}

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const COMPETITIONS: Competition[] = [
  {
    slug: "audi-rs3-45k-cash",
    title: "Audi RS3 (or £45,000 cash)",
    subtitle: "400bhp of German silliness. Yours if you're the lucky git.",
    category: "Motors",
    image: audi,
    gallery: [audi],
    pricePerTicket: 14.99,
    totalTickets: 499,
    ticketsSold: 377,
    cashAlternative: 45000,
    maxPerPerson: 200,
    endsAt: inHours(38),
    hot: true,
    description:
      "A brand new Audi RS3 in Tango Red with the Vorsprung pack. If a car isn't your thing, or you'd rather not explain a new Audi to your accountant, take £45,000 in cash instead. We won't judge. Much.",
  },
  {
    slug: "apple-tech-bundle",
    title: "Full Apple Tech Bundle",
    subtitle: "iPhone 17 Pro, MacBook Pro, AirPods Pro. The lot.",
    category: "Gadgets",
    image: tech,
    gallery: [tech],
    pricePerTicket: 4.99,
    totalTickets: 299,
    ticketsSold: 252,
    cashAlternative: 4500,
    maxPerPerson: 150,
    endsAt: inHours(11),
    hot: true,
    description:
      "The whole shiny lot: iPhone 17 Pro Max, 16\" MacBook Pro M-something, AirPods Pro. Answer the skill question correctly to be entered in the draw.",
  },
  {
    slug: "10k-cash",
    title: "£10,000 Tax-Free Cash",
    subtitle: "Ten grand. Straight in your bank. No strings, no cars.",
    category: "Readies",
    image: cash,
    gallery: [cash],
    pricePerTicket: 24.99,
    totalTickets: 499,
    ticketsSold: 195,
    cashAlternative: 10000,
    maxPerPerson: 100,
    endsAt: inHours(72),
    description:
      "Ten grand. In your bank. Within 48 hours of the draw. Do what you like with it — we'd suggest not the horses.",
  },
  {
    slug: "maldives-getaway",
    title: "Maldives Getaway for Two",
    subtitle: "7 nights, overwater villa, flights included.",
    category: "Getaways",
    image: holiday,
    gallery: [holiday],
    pricePerTicket: 14.99,
    totalTickets: 249,
    ticketsSold: 101,
    cashAlternative: 8500,
    maxPerPerson: 50,
    endsAt: inHours(120),
    description:
      "A week of pretending you're the sort of person who deserves this. Business class flights, overwater bungalow, all inclusive. Bring someone you actually like.",
  },
  {
    slug: "ps5-pro-bundle",
    title: "PS5 Pro + Games Bundle",
    subtitle: "Console, extra pad, three top games. Answer to enter.",
    category: "Gadgets",
    image: ps5,
    gallery: [ps5],
    pricePerTicket: 4.99,
    totalTickets: 199,
    ticketsSold: 146,
    cashAlternative: 700,
    maxPerPerson: 250,
    endsAt: inHours(4),
    hot: true,
    description:
      "Console, extra controller and three top games. Answer the skill question correctly to be entered in the draw.",
  },
  {
    slug: "rolex-submariner",
    title: "Rolex Submariner",
    subtitle: "Or £11,000 cash if you're not a watch person.",
    category: "Timepieces",
    image: watch,
    gallery: [watch],
    pricePerTicket: 9.99,
    totalTickets: 399,
    ticketsSold: 142,
    cashAlternative: 11000,
    maxPerPerson: 100,
    endsAt: inHours(60),
    description:
      "Genuine, boxed, papered. The watch that says 'I've done alright.' Or take the eleven grand and just tell people you did.",
  },
];

export const CATEGORIES: Category[] = ["Motors", "Gadgets", "Timepieces", "Readies", "Getaways"];

export const WINNERS = [
  { name: "Dave", town: "Cardiff", prize: "Land Rover Defender", quote: "I actually cried. Ask my wife.", when: "2 weeks ago" },
  { name: "Priya", town: "Manchester", prize: "£5,000 Cash", quote: "Paying off the credit card and getting a takeaway.", when: "3 weeks ago" },
  { name: "Marcus", town: "Bristol", prize: "PS5 Bundle", quote: "Told my kids I bought it. Definitely didn't.", when: "1 month ago" },
  { name: "Sian", town: "Swansea", prize: "MacBook Pro", quote: "My old laptop was held together with tape.", when: "1 month ago" },
  { name: "Kev", town: "Newcastle", prize: "£1,000 Cash", quote: "Nice one, Gary.", when: "5 weeks ago" },
];

export function getComp(slug: string) {
  return COMPETITIONS.find((c) => c.slug === slug);
}