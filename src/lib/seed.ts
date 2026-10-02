// Demo world: the four real starter players plus a few fictional ones, a
// couple of weeks of matches, and one unopened pack waiting for the demo user.

import seedCards from '../data/seed.json';
import { addMatch, addComment, openPack, ratePlayer, toggleReaction, type MatchInput } from './db';
import type { DB, FoilPattern, Player, Stats } from './types';

const DAY = 24 * 60 * 60 * 1000;

// Shape of src/data/seed.json (exported from the first version of the app).
type SeedCard = Omit<Player, 'claimed' | 'createdAt' | 'foil'> & {
  foil?: FoilPattern;
  stats?: unknown;
  effect?: unknown;
};

const fictional = (id: string, name: string, nickname: string, extra: Partial<Player>): Player => ({
  id,
  name,
  nickname,
  position: 'drive',
  hand: 'destro',
  category: '4ª',
  club: 'Chakra Paddle',
  city: 'Gravataí',
  racket: '',
  photoX: 50,
  photoY: 30,
  photoZoom: 1,
  foil: 'court',
  claimed: true,
  createdAt: 0,
  ...extra,
});

// How the group sees each player; individual ratings are noisy around this.
const PROFILES: Record<string, number[]> = {
  'seed-1': [72, 78, 80, 70, 66, 74, 84, 76],
  'seed-2': [75, 82, 64, 79, 84, 68, 70, 72],
  'seed-3': [80, 86, 83, 81, 85, 77, 82, 62],
  'seed-4': [70, 64, 78, 66, 72, 63, 74, 66],
  rafa: [88, 86, 90, 87, 89, 84, 88, 85],
  ju: [66, 70, 62, 60, 72, 64, 68, 74],
  tiago: [58, 55, 52, 50, 60, 57, 59, 63],
  marina: [78, 80, 76, 74, 70, 79, 81, 77],
};

// Deterministic noise so every fresh demo looks the same.
let state = 7;
const rand = () => ((state = (state * 16807) % 2147483647) / 2147483647);

function profileStats(base: number[]): Stats {
  const v = base.map((n) => Math.max(1, Math.min(99, Math.round(n + (rand() - 0.5) * 12))));
  return { saque: v[0], voleio: v[1], bandeja: v[2], vibora: v[3], smash: v[4], lob: v[5], defesa: v[6], fisico: v[7] };
}

export function buildSeed(now = Date.now()): DB {
  state = 7;
  const real: Player[] = (seedCards as SeedCard[]).map(({ stats: _s, effect: _e, ...c }) => ({
    ...c,
    foil: c.foil ?? 'court',
    claimed: true,
    createdAt: 0,
  }));

  const players: Player[] = [
    ...real,
    fictional('rafa', 'Rafael Monteiro', 'Rafinha', { category: '2ª', racket: 'Nox AT10' }),
    fictional('ju', 'Juliana Prates', 'Ju Smash', { position: 'reves', category: '5ª' }),
    fictional('tiago', 'Tiago Kuhn', 'Alemão', { position: 'reves', club: 'Corneteiros', category: '6ª' }),
    fictional('marina', 'Marina Lopes', 'Mari', { category: '3ª', hand: 'canhoto' }),
    { ...fictional('gordo', 'Gordo do Saque', '', { position: 'ambos', category: '' }), claimed: false, createdBy: 'seed-1' },
  ];

  let db: DB = {
    version: 2,
    currentUserId: 'seed-4',
    players,
    ratings: [],
    matches: [],
    copies: [],
    packs: [],
    reactions: [],
    comments: [],
  };

  const raters = players.filter((p) => p.claimed).map((p) => p.id);
  for (const [id, base] of Object.entries(PROFILES)) {
    for (const from of raters.filter((r) => r !== id).slice(0, 4)) {
      db = ratePlayer(db, from, id, profileStats(base), now - 20 * DAY);
    }
  }

  const play = (daysAgo: number, input: Omit<MatchInput, 'playedAt' | 'club'>, confirmed = true) => {
    const at = now - daysAgo * DAY;
    const res = addMatch(db, { ...input, playedAt: at, club: 'Chakra Paddle' }, at);
    db = res.db;
    if (confirmed && !res.match.confirmed) {
      db = { ...db, matches: db.matches.map((m) => (m.id === res.match.id ? { ...m, confirmed: true } : m)) };
    }
    return res.match;
  };

  play(12, { createdBy: 'seed-4', teamA: ['seed-4', 'seed-3'], teamB: ['seed-1', 'seed-2'], sets: [[6, 4], [3, 6], [6, 3]] });
  play(10, { createdBy: 'seed-1', teamA: ['seed-1', 'seed-2'], teamB: ['tiago', 'ju'], sets: [[6, 0], [6, 2]] });
  play(8, { createdBy: 'seed-4', teamA: ['seed-4', 'ju'], teamB: ['rafa', 'marina'], sets: [[2, 6], [6, 4], [7, 5]] });
  const freguesia = play(6, { createdBy: 'seed-3', teamA: ['seed-3', 'rafa'], teamB: ['seed-4', 'seed-1'], sets: [[6, 2], [6, 1]] });
  play(4, { createdBy: 'seed-1', teamA: ['seed-2', 'tiago'], teamB: ['seed-1', 'gordo'], sets: [[6, 3], [6, 4]] });
  const pneu = play(2, { createdBy: 'seed-4', teamA: ['seed-4', 'seed-2'], teamB: ['marina', 'seed-3'], sets: [[6, 0], [6, 4]] });
  play(0.12, { createdBy: 'ju', teamA: ['ju', 'marina'], teamB: ['seed-4', 'seed-3'], sets: [[6, 4], [6, 4]] }, false);

  // Everything is opened except the demo user's pneu pack.
  for (const pack of db.packs) {
    if (!(pack.matchId === pneu.id && pack.ownerId === 'seed-4')) db = openPack(db, pack.id, pack.openedAt ?? now);
  }

  db = toggleReaction(db, pneu.id, 'seed-1', '🥖');
  db = toggleReaction(db, pneu.id, 'rafa', '🥖');
  db = toggleReaction(db, pneu.id, 'ju', '😂');
  db = toggleReaction(db, pneu.id, 'seed-2', '🔥');
  db = addComment(db, pneu.id, 'seed-1', 'Pneu no Bona e na Mari? Print tirado 📸😂', now - 1.9 * DAY);
  db = addComment(db, pneu.id, 'seed-3', 'Quadra molhada, não conta', now - 1.8 * DAY);
  db = toggleReaction(db, freguesia.id, 'rafa', '🐔');
  db = toggleReaction(db, freguesia.id, 'seed-3', '🐔');
  db = addComment(db, freguesia.id, 'seed-3', 'Freguês é freguês 🐔', now - 5.9 * DAY);

  return db;
}
