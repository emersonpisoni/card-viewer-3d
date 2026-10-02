export type HoloEffect =
  | 'basic'
  | 'holo'
  | 'reverse'
  | 'cosmos'
  | 'radiant'
  | 'glitter'
  | 'gold'
  | 'rainbow';

export type FoilPattern = 'none' | 'court' | 'balls' | 'diamonds' | 'waves' | 'stars';

export type Position = 'drive' | 'reves' | 'ambos';
export type Hand = 'destro' | 'canhoto';
export type Tier = 'bronze' | 'prata' | 'ouro' | 'elite';

/** How a captured copy was won. Drives the holo effect of the copy. */
export type Rarity = 'comum' | 'holo' | 'radiante' | 'pneu';

export interface Stats {
  saque: number;
  voleio: number;
  bandeja: number;
  vibora: number;
  smash: number;
  lob: number;
  defesa: number;
  fisico: number;
}

/** A person. Their stats are never stored here: they come from Ratings. */
export interface Player {
  id: string;
  name: string;
  nickname: string;
  position: Position;
  hand: Hand;
  category: string;
  club: string;
  city: string;
  racket: string;
  photo?: string;
  photoX: number;
  photoY: number;
  photoZoom: number;
  foil: FoilPattern;
  /** False for provisional players created by someone else until they join. */
  claimed: boolean;
  createdBy?: string;
  createdAt: number;
}

/** One user's evaluation of another player. Only the latest per (from, to) counts. */
export interface Rating {
  id: string;
  from: string;
  to: string;
  stats: Stats;
  createdAt: number;
}

export type Team = [string, string];
export type SetScore = [number, number];

export interface Match {
  id: string;
  createdBy: string;
  createdAt: number;
  playedAt: number;
  club: string;
  teamA: Team;
  teamB: Team;
  /** Games per set, [teamA, teamB]. */
  sets: SetScore[];
  winner: 'A' | 'B';
  /** A loser has acknowledged the result (or a loser registered it). */
  confirmed: boolean;
}

/** A card one player captured from another by beating them. */
export interface CardCopy {
  id: string;
  ownerId: string;
  playerId: string;
  matchId: string;
  capturedAt: number;
  /** The player's stats on the day of the match; null if nobody had rated them yet. */
  stats: Stats | null;
  rarity: Rarity;
  /** First copy of this player ever captured by anyone. */
  rookie: boolean;
}

export interface Pack {
  id: string;
  ownerId: string;
  matchId: string;
  copyIds: string[];
  openedAt?: number;
}

export interface Reaction {
  matchId: string;
  userId: string;
  emoji: string;
}

export interface Comment {
  id: string;
  matchId: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface DB {
  version: 2;
  currentUserId: string;
  players: Player[];
  ratings: Rating[];
  matches: Match[];
  copies: CardCopy[];
  packs: Pack[];
  reactions: Reaction[];
  comments: Comment[];
}

/** Everything HoloCard needs to draw one card face. */
export interface CardView {
  name: string;
  nickname: string;
  position: Position;
  hand: Hand;
  category: string;
  club: string;
  city: string;
  racket: string;
  photo?: string;
  photoX: number;
  photoY: number;
  photoZoom: number;
  foil: FoilPattern;
  effect: HoloEffect;
  stats: Stats | null;
  ratingCount?: number;
  provisional?: boolean;
  rookie?: boolean;
  rarity?: Rarity;
  capture?: { at: number; score: string };
}

export const STAT_LABELS: Record<keyof Stats, { short: string; long: string }> = {
  saque: { short: 'SAQ', long: 'Saque' },
  voleio: { short: 'VOL', long: 'Voleio' },
  bandeja: { short: 'BAN', long: 'Bandeja' },
  vibora: { short: 'VIB', long: 'Víbora' },
  smash: { short: 'SMA', long: 'Smash' },
  lob: { short: 'LOB', long: 'Lob' },
  defesa: { short: 'DEF', long: 'Defesa / parede' },
  fisico: { short: 'FIS', long: 'Físico' },
};

export const STAT_KEYS = Object.keys(STAT_LABELS) as (keyof Stats)[];

export const POSITION_LABELS: Record<Position, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
};

export const CATEGORIES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª', 'Iniciante'];

export const FOILS: { id: FoilPattern; name: string }[] = [
  { id: 'court', name: 'Quadra' },
  { id: 'balls', name: 'Bolinhas' },
  { id: 'diamonds', name: 'Losangos' },
  { id: 'waves', name: 'Ondas' },
  { id: 'stars', name: 'Estrelas' },
  { id: 'none', name: 'Liso' },
];

export const RARITIES: Record<Rarity, { name: string; effect: HoloEffect; rank: number; hint: string }> = {
  comum: { name: 'Comum', effect: 'basic', rank: 0, hint: 'Vitória' },
  holo: { name: 'Holo', effect: 'holo', rank: 1, hint: 'Venceu uma dupla mais forte' },
  radiante: { name: 'Radiante', effect: 'radiant', rank: 2, hint: 'Vitória de virada' },
  pneu: { name: 'Edição Pneu', effect: 'rainbow', rank: 3, hint: 'Teve set 6/0' },
};

export const REACTIONS = [
  { emoji: '🧱', label: 'Paredão' },
  { emoji: '🥖', label: 'Pneu' },
  { emoji: '🐔', label: 'Amarelou' },
  { emoji: '🎯', label: 'Víbora' },
  { emoji: '🔥', label: 'Jogão' },
  { emoji: '😂', label: 'Kkkk' },
];
