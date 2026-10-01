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

export interface PlayerCard {
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
  effect: HoloEffect;
  foil: FoilPattern;
  stats: Stats;
  createdAt: number;
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

export const POSITION_LABELS: Record<Position, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
};

export const CATEGORIES = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª', 'Iniciante'];

export const EFFECTS: { id: HoloEffect; name: string; description: string }[] = [
  { id: 'basic', name: 'Básico', description: 'Só o reflexo da luz' },
  { id: 'holo', name: 'Holo', description: 'Arco-íris clássico na foto' },
  { id: 'reverse', name: 'Reverse', description: 'Brilho na moldura, foto limpa' },
  { id: 'radiant', name: 'Radiante', description: 'Trama cruzada metálica' },
  { id: 'glitter', name: 'Glitter', description: 'Purpurina que cintila' },
  { id: 'cosmos', name: 'Cosmos', description: 'Galáxia com estrelas' },
  { id: 'gold', name: 'Ouro', description: 'Folha de ouro + brilho' },
  { id: 'rainbow', name: 'Rainbow', description: 'Secret rare arco-íris' },
];

export const FOILS: { id: FoilPattern; name: string }[] = [
  { id: 'court', name: 'Quadra' },
  { id: 'balls', name: 'Bolinhas' },
  { id: 'diamonds', name: 'Losangos' },
  { id: 'waves', name: 'Ondas' },
  { id: 'stars', name: 'Estrelas' },
  { id: 'none', name: 'Liso' },
];

export function overall(stats: Stats): number {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function tierFor(ovr: number): Tier {
  if (ovr >= 85) return 'elite';
  if (ovr >= 75) return 'ouro';
  if (ovr >= 60) return 'prata';
  return 'bronze';
}

export function newCard(): PlayerCard {
  return {
    id: crypto.randomUUID(),
    name: '',
    nickname: '',
    position: 'drive',
    hand: 'destro',
    category: '4ª',
    club: '',
    city: '',
    racket: '',
    photoX: 50,
    photoY: 30,
    photoZoom: 1,
    effect: 'holo',
    foil: 'court',
    stats: {
      saque: 70,
      voleio: 70,
      bandeja: 70,
      vibora: 70,
      smash: 70,
      lob: 70,
      defesa: 70,
      fisico: 70,
    },
    createdAt: Date.now(),
  };
}
