// Mirrors the ids in app/src/data/stylists.ts. The stylist directory itself
// is still static seed data on the frontend (per the design handoff, "Copy
// is final and can ship as demo data") — only claims need a real, shared
// backend, so this is just the id list needed to validate a claim's target.
export const KNOWN_STYLIST_IDS = new Set([
  'tayo-fields',
  'nailah-bryce',
  'simone-achebe',
  'renee-okonjo',
  'adaeze-hill',
  'jolie-marchand',
]);
