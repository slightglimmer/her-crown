// Real stylist data now lives in the backend (server/) — no seed data here.
// A stylist with no reviews yet genuinely has score: null and verified: 0;
// nothing on this page is invented.

export type Chair = 'travels' | 'salon';

export interface Stylist {
  id: string; // slug, e.g. "nailah-bryce"
  name: string;
  area: string;
  chair: Chair;
  specialty: string;
  price: string | null;
  services: string[];
  score: number | null;
  verified: number;
  quote: string | null;
  reply: string | null;
  hasPhoto: boolean;
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
