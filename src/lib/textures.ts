// Procedural foil textures. Each "etch" is a tiling SVG of white strokes on
// transparent: it's used as a mask so the holo lights up more strongly along
// the stamped pattern, and as a height map for the embossed relief layer.

import type { FoilPattern } from './types';

const svg = (w: number, h: number, body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`,
  )}")`;

const stroke = `fill='none' stroke='white' stroke-linecap='round'`;

// Four-point sparkle centred on (x, y).
const star = (x: number, y: number, s: number) =>
  `<path fill='white' d='M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z'/>`;

const ball = (x: number, y: number) =>
  `<g transform='translate(${x} ${y})' ${stroke} stroke-width='1.3'>` +
  `<circle r='7'/><path d='M-6 -3.5C-2.5 -1.5 -2.5 1.5 -6 3.5M6 -3.5C2.5 -1.5 2.5 1.5 6 3.5'/></g>`;

export const ETCHES: Record<Exclude<FoilPattern, 'none'>, { image: string; size: string }> = {
  court: {
    // Padel court seen from above: 10m × 20m, service lines 6.95m from the net.
    image: svg(
      50,
      100,
      `<g ${stroke} stroke-width='1.2'><rect x='5' y='5' width='40' height='90'/>` +
        `<path d='M5 50H45M5 19H45M5 81H45M25 19V81'/></g>`,
    ),
    size: '22cqw 44cqw',
  },
  balls: {
    image: svg(40, 40, ball(10, 10) + ball(30, 30)),
    size: '15cqw 15cqw',
  },
  diamonds: {
    image: svg(
      20,
      20,
      `<g ${stroke} stroke-width='0.9'><path d='M10 0L20 10L10 20L0 10Z'/><path d='M10 6L14 10L10 14L6 10Z'/></g>`,
    ),
    size: '9cqw 9cqw',
  },
  waves: {
    image: svg(40, 10, `<path ${stroke} stroke-width='1.1' d='M0 5Q10 0 20 5T40 5'/>`),
    size: '16cqw 4cqw',
  },
  stars: {
    image: svg(60, 60, star(10, 12, 5) + star(42, 8, 3) + star(30, 34, 7) + star(8, 48, 3) + star(50, 50, 4)),
    size: '24cqw 24cqw',
  },
};

/** Brushed-metal grain: noise stretched along x so it reads as fine lines. */
export const GRAIN = svg(
  320,
  320,
  `<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.006 0.9' numOctaves='2' seed='4'/>` +
    `<feColorMatrix values='1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#g)'/>`,
);

export function textureVars(foil: FoilPattern): Record<string, string> {
  if (foil === 'none') return { '--grain': GRAIN, '--etch': 'none', '--etch-size': 'auto' };
  const etch = ETCHES[foil];
  return { '--grain': GRAIN, '--etch': etch.image, '--etch-size': etch.size };
}
