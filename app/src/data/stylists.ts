// Seed data ported from Her Crown Stylists.dc.html's logic class (the
// canonical stylist collection — the review flow's own hard-coded list in
// Her Crown Review.dc.html was a smaller, differently-shaped duplicate of
// the same people, which the README resolves by pointing the review flow's
// service chips at "the same chip set... as the directory"; we go further
// and point its stylist picker at this same collection too, since that's
// what lets "Rate her" hand off a real stylist id). In production this
// comes from a stylist collection API instead of a static module.

export type Chair = 'travels' | 'salon';

export interface Stylist {
  id: string;
  name: string;
  area: string;
  chair: Chair;
  score: number;
  verified: number;
  price: string;
  specialty: string;
  services: string[];
  tags: string[];
  quote: string;
}

export const SERVICES = [
  'Knotless braids',
  'Boho braids',
  'Locs / retwist',
  'Silk press',
  'Natural cut',
  'Color',
  'Wash-and-go',
  'Wig install',
  'Kid-friendly',
];

export const STYLISTS: Stylist[] = [
  {
    id: 'tayo-fields',
    name: 'Tayo Fields',
    area: 'Old Fourth Ward',
    chair: 'salon',
    score: 4.8,
    verified: 210,
    price: '$95–$180',
    specialty: 'Locs, retwist and scalp health. Fifteen years, one chair, no rush.',
    services: ['Locs / retwist', 'Natural cut'],
    tags: ['Scalp-first', 'Books 3 weeks out', 'Replies to reviews'],
    quote: 'She talked me out of the style I wanted and she was right. My hairline is thanking her.',
  },
  {
    id: 'nailah-bryce',
    name: 'Nailah Bryce',
    area: 'West End · travels to you',
    chair: 'travels',
    score: 4.9,
    verified: 128,
    price: '$180–$320',
    specialty: 'Knotless and boho braids, kid-friendly, comes to your kitchen.',
    services: ['Knotless braids', 'Boho braids', 'Kid-friendly'],
    tags: ['Gentle tension', 'On time', 'Kids welcome'],
    quote: 'Six hours and my scalp never once stung. She braided my daughter after me for half price.',
  },
  {
    id: 'simone-achebe',
    name: 'Simone Achebe',
    area: 'Decatur · home studio',
    chair: 'salon',
    score: 4.7,
    verified: 84,
    price: '$85–$140',
    specialty: 'Silk press, trims and heat-damage repair. Will tell you the truth about your ends.',
    services: ['Silk press', 'Natural cut'],
    tags: ['Honest trims', 'Low heat', 'Detailed consult'],
    quote: 'She cut two inches I did not want to lose and my curls came back for it.',
  },
  {
    id: 'renee-okonjo',
    name: 'Renée Okonjo',
    area: 'East Point · travels to you',
    chair: 'travels',
    score: 4.5,
    verified: 41,
    price: '$70–$210',
    specialty: 'Natural cuts, color and wash-and-go shaping for looser to tighter coils.',
    services: ['Natural cut', 'Color', 'Wash-and-go'],
    tags: ['Color-safe', 'Newer to the app', 'Weekend slots'],
    quote: 'The shape grew out beautifully. Color took two visits, which she said up front.',
  },
  {
    id: 'adaeze-hill',
    name: 'Adaeze Hill',
    area: 'Kirkwood',
    chair: 'salon',
    score: 4.6,
    verified: 67,
    price: '$150–$260',
    specialty: 'Wig installs and lace work, plus braid takedowns that keep your length.',
    services: ['Wig install', 'Knotless braids'],
    tags: ['Melted lace', 'Takedowns', 'Studio parking'],
    quote: 'Flat install, no glue on my skin, and she washed my own hair underneath first.',
  },
  {
    id: 'jolie-marchand',
    name: 'Jolie Marchand',
    area: 'College Park · travels to you',
    chair: 'travels',
    score: 4.4,
    verified: 33,
    price: '$200–$380',
    specialty: 'Boho braids and long-term protective sets. Brings her own chair and lighting.',
    services: ['Boho braids', 'Knotless braids'],
    tags: ['Long sets', 'Late appointments', 'Cash or Zelle'],
    quote: 'Started an hour late but stayed until 11pm to finish clean. Curls still bouncing at week five.',
  },
];

export function getStylist(id: string): Stylist | undefined {
  return STYLISTS.find((st) => st.id === id);
}
