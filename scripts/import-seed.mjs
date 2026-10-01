// Turns a localStorage export into the starter cards every new visitor sees.
// Photos are written to public/seed/ so they're served as files instead of
// bloating the JS bundle with base64.
//
//   node scripts/import-seed.mjs ~/Downloads/cards.json

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
if (!input) {
  console.error('Uso: node scripts/import-seed.mjs <cards.json>');
  process.exit(1);
}

const cards = JSON.parse(readFileSync(input, 'utf8'));
rmSync('public/seed', { recursive: true, force: true });
mkdirSync('public/seed', { recursive: true });
mkdirSync('src/data', { recursive: true });

const seed = cards.map((card, i) => {
  const id = `seed-${i + 1}`;
  const match = card.photo?.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return { ...card, id };
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  writeFileSync(`public/seed/${id}.${ext}`, Buffer.from(match[2], 'base64'));
  return { ...card, id, photo: `/seed/${id}.${ext}` };
});

writeFileSync('src/data/seed.json', JSON.stringify(seed, null, 2) + '\n');
console.log(`${seed.length} cards importados → src/data/seed.json + public/seed/`);
