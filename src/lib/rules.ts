// Pure game rules: how ratings become stats, how a match result becomes a
// rarity, and how players and copies are turned into drawable cards.

import {
  RARITIES,
  STAT_KEYS,
  type CardCopy,
  type CardView,
  type DB,
  type HoloEffect,
  type Match,
  type Player,
  type Rarity,
  type Rating,
  type Stats,
  type Tier,
} from './types';

export function overall(stats: Stats | null): number | null {
  if (!stats) return null;
  return Math.round(STAT_KEYS.reduce((sum, k) => sum + stats[k], 0) / STAT_KEYS.length);
}

export function tierFor(ovr: number | null): Tier {
  if (ovr == null || ovr < 60) return 'bronze';
  if (ovr < 75) return 'prata';
  if (ovr < 85) return 'ouro';
  return 'elite';
}

/** The holo a player's own card earns from their level. */
const TIER_EFFECT: Record<Tier, HoloEffect> = {
  bronze: 'basic',
  prata: 'holo',
  ouro: 'gold',
  elite: 'cosmos',
};

/** Latest rating from each rater. */
export function ratingsFor(db: DB, playerId: string): Rating[] {
  const latest = new Map<string, Rating>();
  for (const r of db.ratings) {
    if (r.to !== playerId) continue;
    const prev = latest.get(r.from);
    if (!prev || prev.createdAt < r.createdAt) latest.set(r.from, r);
  }
  return [...latest.values()];
}

export function statsFor(db: DB, playerId: string): Stats | null {
  const ratings = ratingsFor(db, playerId);
  if (!ratings.length) return null;
  const avg = {} as Stats;
  for (const k of STAT_KEYS) {
    avg[k] = Math.round(ratings.reduce((sum, r) => sum + r.stats[k], 0) / ratings.length);
  }
  return avg;
}

export function setsWon(match: Match) {
  let a = 0;
  let b = 0;
  for (const [ga, gb] of match.sets) {
    if (ga > gb) a++;
    else if (gb > ga) b++;
  }
  return { a, b };
}

export function winnerOf(sets: [number, number][]): 'A' | 'B' | null {
  let a = 0;
  let b = 0;
  for (const [ga, gb] of sets) {
    if (ga > gb) a++;
    else if (gb > ga) b++;
  }
  if (a === b) return null;
  return a > b ? 'A' : 'B';
}

export function winners(match: Match) {
  return match.winner === 'A' ? match.teamA : match.teamB;
}
export function losers(match: Match) {
  return match.winner === 'A' ? match.teamB : match.teamA;
}

/** Score from the winners' point of view, e.g. "6/0 6/3". */
export function scoreText(match: Match) {
  return match.sets
    .map(([a, b]) => (match.winner === 'A' ? `${a}/${b}` : `${b}/${a}`))
    .join('  ');
}

export function isPneu(match: Match) {
  return match.sets.some(([a, b]) => (match.winner === 'A' ? a === 6 && b === 0 : b === 6 && a === 0));
}

export function isComeback(match: Match) {
  const [a, b] = match.sets[0] ?? [0, 0];
  return match.sets.length > 2 && (match.winner === 'A' ? a < b : b < a);
}

const teamOvr = (db: DB, team: string[]) => {
  const values = team.map((id) => overall(statsFor(db, id))).filter((v): v is number => v != null);
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
};

/** Rarity of the cards the winners capture. Best applicable rule wins. */
export function rarityFor(db: DB, match: Match): Rarity {
  if (isPneu(match)) return 'pneu';
  if (isComeback(match)) return 'radiante';
  const w = teamOvr(db, winners(match));
  const l = teamOvr(db, losers(match));
  if (w != null && l != null && l > w) return 'holo';
  return 'comum';
}

/** Rarity only counts once a loser confirms; until then the copy shows as common. */
export function effectiveRarity(db: DB, copy: CardCopy): Rarity {
  const match = db.matches.find((m) => m.id === copy.matchId);
  return match?.confirmed ? copy.rarity : 'comum';
}

function baseView(p: Player) {
  return {
    name: p.name,
    nickname: p.nickname,
    position: p.position,
    hand: p.hand,
    category: p.category,
    club: p.club,
    city: p.city,
    racket: p.racket,
    photo: p.photo,
    photoX: p.photoX,
    photoY: p.photoY,
    photoZoom: p.photoZoom,
    foil: p.foil,
    provisional: !p.claimed,
  };
}

/** A player's current card, built from everyone's ratings. */
export function liveCard(db: DB, player: Player): CardView {
  const stats = statsFor(db, player.id);
  return {
    ...baseView(player),
    stats,
    ratingCount: ratingsFor(db, player.id).length,
    effect: TIER_EFFECT[tierFor(overall(stats))],
  };
}

/** A captured copy: stats frozen at the match, effect from how it was won. */
export function copyCard(db: DB, copy: CardCopy): CardView {
  const player = db.players.find((p) => p.id === copy.playerId)!;
  const match = db.matches.find((m) => m.id === copy.matchId);
  const rarity = effectiveRarity(db, copy);
  return {
    ...baseView(player),
    stats: copy.stats,
    effect: RARITIES[rarity].effect,
    rarity,
    rookie: copy.rookie,
    capture: match ? { at: match.playedAt, score: scoreText(match) } : undefined,
  };
}
