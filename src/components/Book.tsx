import { useEffect, useRef, useState, type ReactNode } from 'react';
import './Book.css';

interface Props {
  /** Page renderers. In spread mode an odd count gets a blank page appended. */
  pages: ((side: 'left' | 'right') => ReactNode)[];
  /** Two facing pages (desktop) or one page at a time (phones). */
  spread: boolean;
}

type Flip = { dir: 1 | -1 } | null;

const blank = (side: 'left' | 'right') => <div className={`book-page book-page--${side} book-page--blank`} />;

/**
 * A book whose pages turn in 3D. While a turn is in flight a "leaf" with the
 * outgoing page on its front and the incoming page on its back rotates over
 * the static pages underneath, which already show the destination.
 */
export function Book({ pages, spread }: Props) {
  const all = spread && pages.length % 2 ? [...pages, blank] : pages;
  const step = spread ? 2 : 1;
  const last = Math.max(0, all.length - step);
  const [pos, setPos] = useState(0); // index of the first visible page
  const [flip, setFlip] = useState<Flip>(null);
  const drag = useRef<number | null>(null);

  // Keep the position valid when switching layouts.
  useEffect(() => {
    setFlip(null);
    setPos((p) => Math.min(spread ? p - (p % 2) : p, last));
  }, [spread, last]);

  const go = (dir: 1 | -1) => {
    if (flip) return;
    const next = pos + dir * step;
    if (next < 0 || next > last) return;
    setFlip({ dir });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const page = (i: number, side: 'left' | 'right') => (all[i] ?? blank)(side);

  const finish = (e: React.AnimationEvent) => {
    // Ignore animations bubbling up from inside the pages.
    if (!flip || e.target !== e.currentTarget) return;
    setPos(pos + flip.dir * step);
    setFlip(null);
  };

  let staticPages: ReactNode;
  let leaf: ReactNode = null;

  if (spread) {
    const left = flip?.dir === -1 ? pos - 2 : pos;
    const right = flip?.dir === 1 ? pos + 3 : pos + 1;
    staticPages = (
      <>
        <div className="book__half book__half--left">{page(left, 'left')}</div>
        <div className="book__half book__half--right">{page(right, 'right')}</div>
      </>
    );
    if (flip) {
      const fwd = flip.dir === 1;
      leaf = (
        <div className={`leaf leaf--${fwd ? 'fwd' : 'bwd'}`} onAnimationEnd={finish}>
          <div className="leaf__face leaf__front">{fwd ? page(pos + 1, 'right') : page(pos, 'left')}</div>
          <div className="leaf__face leaf__back">{fwd ? page(pos + 2, 'left') : page(pos - 1, 'right')}</div>
        </div>
      );
    }
  } else {
    const shown = flip?.dir === 1 ? pos + 1 : pos;
    staticPages = <div className="book__half book__half--single">{page(shown, 'right')}</div>;
    if (flip) {
      const fwd = flip.dir === 1;
      leaf = (
        <div className={`leaf leaf--single leaf--${fwd ? 'fwd' : 'in'}`} onAnimationEnd={finish}>
          <div className="leaf__face leaf__front">{page(fwd ? pos : pos - 1, 'right')}</div>
          <div className="leaf__face leaf__back">{blank('left')}</div>
        </div>
      );
    }
  }

  const pageCount = all.length;
  const label = spread
    ? `${pos + 1}–${Math.min(pos + 2, pageCount)} de ${pageCount}`
    : `${pos + 1} de ${pageCount}`;

  return (
    <div className="book-wrap">
      <div
        className={`book${spread ? ' book--spread' : ' book--single'}`}
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => {
          if (drag.current == null) return;
          const dx = e.clientX - drag.current;
          drag.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        {staticPages}
        {leaf}
        {spread && <div className="book__spine" />}
      </div>
      <div className="book__nav">
        <button className="icon-btn" onClick={() => go(-1)} disabled={pos === 0 || !!flip} aria-label="Página anterior">
          ‹
        </button>
        <span>{label}</span>
        <button className="icon-btn" onClick={() => go(1)} disabled={pos >= last || !!flip} aria-label="Próxima página">
          ›
        </button>
      </div>
    </div>
  );
}
