import audi from "@/assets/prize-audi.jpg";
import tech from "@/assets/prize-tech.jpg";
import cash from "@/assets/prize-cash.jpg";
import holiday from "@/assets/prize-holiday.jpg";
import ps5 from "@/assets/prize-ps5.jpg";
import watch from "@/assets/prize-watch.jpg";

export type Category = "Cars" | "Tech" | "Cash" | "Holidays" | "£1 Instant Wins";

export interface Competition {
  slug: string;
  title: string;
  subtitle: string;
  category: Category;
  image: string;
  gallery: string[];
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  cashAlternative: number;
  maxPerPerson: number;
  endsAt: string; // ISO
  instantWin: boolean;
  hot?: boolean;
  description: string;
  skillQuestion: {
    q: string;
    options: string[];
    correct: number;
  };
}

const inHours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();

export const COMPETITIONS: Competition[] = [
  {
    slug: "audi-rs3-25k-cash",
    title: "Audi RS3 (or £45,000 cash)",
    subtitle: "400bhp of German silliness. Yours if you're the lucky git.",
    category: "Cars",
    image: audi,
    gallery: [audi],
    pricePerTicket: 4.99,
    totalTickets: 15000,
    ticketsSold: 11342,
    cashAlternative: 45000,
    maxPerPerson: 200,
    endsAt: inHours(38),
    instantWin: false,
    hot: true,
    description:
      "A brand new Audi RS3 in Tango Red with the Vorsprung pack. If a car isn't your thing, or you'd rather not explain a new Audi to your accountant, take £45,000 in cash instead. We won't judge. Much.",
    skillQuestion: {
      q: "Which of these is a German car manufacturer?",
      options: ["Ferrari", "Toyota", "Audi", "Rolls-Royce"],
      correct: 2,
    },
  },
  {
    slug: "apple-tech-bundle",
    title: "Full Apple Tech Bundle",
    subtitle: "iPhone 17 Pro, MacBook Pro, AirPods Pro. The lot.",
    category: "Tech",
    image: tech,
    gallery: [tech],
    pricePerTicket: 1.99,
    totalTickets: 5000,
    ticketsSold: 4210,
    cashAlternative: 4500,
    maxPerPerson: 150,
    endsAt: inHours(11),
    instantWin: true,
    hot: true,
    description:
      "The whole shiny lot: iPhone 17 Pro Max, 16\" MacBook Pro M-something, AirPods Pro. Plus 20 instant win tickets worth £50 each hidden inside. Yes, really.",
    skillQuestion: {
      q: "AirPods are made by which company?",
      options: ["Samsung", "Sony", "Apple", "Google"],
      correct: 2,
    },
  },
  {
    slug: "10k-cash",
    title: "£10,000 Tax-Free Cash",
    subtitle: "Ten grand. Straight in your bank. No strings, no cars.",
    category: "Cash",
    image: cash,
    gallery: [cash],
    pricePerTicket: 2.5,
    totalTickets: 8000,
    ticketsSold: 3120,
    cashAlternative: 10000,
    maxPerPerson: 100,
    endsAt: inHours(72),
    instantWin: false,
    description:
      "Ten grand. In your bank. Within 48 hours of the draw. Do what you like with it — we'd suggest not the horses.",
    skillQuestion: {
      q: "How many pounds in a thousand?",
      options: ["10", "100", "1,000", "10,000"],
      correct: 2,
    },
  },
  {
    slug: "maldives-getaway",
    title: "Maldives Getaway for Two",
    subtitle: "7 nights, overwater villa, flights included.",
    category: "Holidays",
    image: holiday,
    gallery: [holiday],
    pricePerTicket: 9.99,
    totalTickets: 2000,
    ticketsSold: 812,
    cashAlternative: 8500,
    maxPerPerson: 50,
    endsAt: inHours(120),
    instantWin: false,
    description:
      "A week of pretending you're the sort of person who deserves this. Business class flights, overwater bungalow, all inclusive. Bring someone you actually like.",
    skillQuestion: {
      q: "The Maldives are in which ocean?",
      options: ["Atlantic", "Indian", "Pacific", "Arctic"],
      correct: 1,
    },
  },
  {
    slug: "ps5-pro-instant",
    title: "PS5 Pro + Games Bundle",
    subtitle: "Console, extra pad, three top games. £1 a pop.",
    category: "£1 Instant Wins",
    image: ps5,
    gallery: [ps5],
    pricePerTicket: 1,
    totalTickets: 1500,
    ticketsSold: 1103,
    cashAlternative: 700,
    maxPerPerson: 250,
    endsAt: inHours(4),
    instantWin: true,
    hot: true,
    description:
      "A quid a ticket, 25 instant-win prizes hidden throughout (£10 credits, wireless pads, an OLED telly), and one absolute champion walks off with the console bundle.",
    skillQuestion: {
      q: "PlayStation is made by which company?",
      options: ["Microsoft", "Nintendo", "Sony", "Sega"],
      correct: 2,
    },
  },
  {
    slug: "rolex-submariner",
    title: "Rolex Submariner",
    subtitle: "Or £11,000 cash if you're not a watch person.",
    category: "Tech",
    image: watch,
    gallery: [watch],
    pricePerTicket: 3.99,
    totalTickets: 6000,
    ticketsSold: 2140,
    cashAlternative: 11000,
    maxPerPerson: 100,
    endsAt: inHours(60),
    instantWin: false,
    description:
      "Genuine, boxed, papered. The watch that says 'I've done alright.' Or take the eleven grand and just tell people you did.",
    skillQuestion: {
      q: "Rolex was founded in which country?",
      options: ["Italy", "Switzerland", "Germany", "France"],
      correct: 1,
    },
  },
];

export const CATEGORIES: Category[] = ["Cars", "Tech", "Cash", "Holidays", "£1 Instant Wins"];

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