// Pure DB transforms. This is the "backend" contract: every function takes the
// current DB and returns the next one, so it can be swapped for API calls later.

import { losers, rarityFor, statsFor, winnerOf, winners } from './rules';
import type { CardCopy, DB, Match, Pack, Player, SetScore, Stats, Team } from './types';

const uid = () => crypto.randomUUID();

export interface MatchInput {
  createdBy: string;
  playedAt: number;
  club: string;
  teamA: Team;
  teamB: Team;
  sets: SetScore[];
}

/**
 * Records a match. Each winner gets a pack with a copy of each loser's card,
 * stats frozen as they are today. A loser registering it counts as confirmation.
 */
export function addMatch(db: DB, input: MatchInput, now = Date.now()): { db: DB; match: Match } {
  const winner = winnerOf(input.sets);
  if (!winner) throw new Error('A partida precisa ter um vencedor');

  const draft: Match = { id: uid(), createdAt: now, winner, confirmed: false, ...input };
  const match: Match = { ...draft, confirmed: losers(draft).includes(input.createdBy) };
  const rarity = rarityFor(db, match);

  const copies: CardCopy[] = [];
  const packs: Pack[] = [];
  const captured = new Set(db.copies.map((c) => c.playerId));

  for (const owner of winners(match)) {
    const pack: Pack = { id: uid(), ownerId: owner, matchId: match.id, copyIds: [] };
    for (const playerId of losers(match)) {
      const copy: CardCopy = {
        id: uid(),
        ownerId: owner,
        playerId,
        matchId: match.id,
        capturedAt: now,
        stats: statsFor(db, playerId),
        rarity,
        rookie: !captured.has(playerId),
      };
      captured.add(playerId);
      copies.push(copy);
      pack.copyIds.push(copy.id);
    }
    packs.push(pack);
  }

  return {
    match,
    db: {
      ...db,
      matches: [...db.matches, match],
      copies: [...db.copies, ...copies],
      packs: [...db.packs, ...packs],
    },
  };
}

export function confirmMatch(db: DB, matchId: string): DB {
  return { ...db, matches: db.matches.map((m) => (m.id === matchId ? { ...m, confirmed: true } : m)) };
}

export function openPack(db: DB, packId: string, now = Date.now()): DB {
  return { ...db, packs: db.packs.map((p) => (p.id === packId ? { ...p, openedAt: now } : p)) };
}

/** Anyone can rate anyone but themselves; a new rating replaces their previous one. */
export function ratePlayer(db: DB, from: string, to: string, stats: Stats, now = Date.now()): DB {
  if (from === to) throw new Error('Você não pode avaliar a si mesmo');
  return {
    ...db,
    ratings: [...db.ratings.filter((r) => !(r.from === from && r.to === to)), { id: uid(), from, to, stats, createdAt: now }],
  };
}

export function addProvisionalPlayer(db: DB, name: string, createdBy: string, now = Date.now()) {
  const creator = db.players.find((p) => p.id === createdBy);
  const player: Player = {
    id: uid(),
    name: name.trim(),
    nickname: '',
    position: 'ambos',
    hand: 'destro',
    category: '',
    club: creator?.club ?? '',
    city: creator?.city ?? '',
    racket: '',
    photoX: 50,
    photoY: 30,
    photoZoom: 1,
    foil: 'court',
    claimed: false,
    createdBy,
    createdAt: now,
  };
  return { db: { ...db, players: [...db.players, player] }, player };
}

/** Profile fields only: stats can't be edited, they come from ratings. */
export type ProfilePatch = Partial<Omit<Player, 'id' | 'claimed' | 'createdBy' | 'createdAt'>>;

export function updatePlayer(db: DB, id: string, patch: ProfilePatch): DB {
  return { ...db, players: db.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

export function toggleReaction(db: DB, matchId: string, userId: string, emoji: string): DB {
  const has = db.reactions.some((r) => r.matchId === matchId && r.userId === userId && r.emoji === emoji);
  return {
    ...db,
    reactions: has
      ? db.reactions.filter((r) => !(r.matchId === matchId && r.userId === userId && r.emoji === emoji))
      : [...db.reactions, { matchId, userId, emoji }],
  };
}

export function addComment(db: DB, matchId: string, userId: string, text: string, now = Date.now()): DB {
  return { ...db, comments: [...db.comments, { id: uid(), matchId, userId, text: text.trim(), createdAt: now }] };
}
