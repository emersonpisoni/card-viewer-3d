import { newCard, type PlayerCard } from './types';
import seed from '../data/seed.json';

const KEY = 'padel-holo:cards:v1';

/** Starter cards for first-time visitors; regenerate with scripts/import-seed.mjs. */
export function loadCards(): PlayerCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to the starter cards
  }
  return seed.length ? (seed as PlayerCard[]) : [demoCard()];
}

/** Returns false when the browser refuses to store (usually quota exceeded). */
export function saveCards(cards: PlayerCard[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(cards));
    return true;
  } catch {
    return false;
  }
}

function demoCard(): PlayerCard {
  return {
    ...newCard(),
    name: 'Jogador Demo',
    nickname: 'O Paredão',
    position: 'reves',
    category: '3ª',
    club: 'Arena Padel Club',
    city: 'Porto Alegre',
    racket: 'Bullpadel Vertex',
    effect: 'cosmos',
    stats: { saque: 78, voleio: 84, bandeja: 88, vibora: 81, smash: 86, lob: 79, defesa: 90, fisico: 83 },
  };
}

/** Downscale an uploaded photo so a handful of cards fit in localStorage. */
export function resizeImage(file: File, maxSide = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}
