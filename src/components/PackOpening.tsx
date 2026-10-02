import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { HoloCard } from './HoloCard';
import { CardMotion } from '../lib/motion';
import { openPack } from '../lib/db';
import { copyCard, effectiveRarity, scoreText } from '../lib/rules';
import { shortDate } from '../lib/format';
import { store, useDB } from '../lib/store';
import { RARITIES } from '../lib/types';
import './PackOpening.css';

interface Props {
  packId: string;
  onClose: () => void;
  onViewCollection: () => void;
}

type Phase = 'sealed' | 'shake' | 'tear' | 'drop' | 'reveal' | 'summary';

/** Zigzag crimp along one edge, as a clip-path polygon. */
function crimp(edge: 'top' | 'bottom', teeth = 18, depth = 3) {
  const pts: string[] = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const x = (i / (teeth * 2)) * 100;
    const y = i % 2 ? depth : 0;
    pts.push(edge === 'top' ? `${x}% ${y}%` : `${x}% ${100 - y}%`);
  }
  return edge === 'top'
    ? `polygon(${pts.join(',')}, 100% 100%, 0% 100%)`
    : `polygon(0% 0%, 100% 0%, ${pts.reverse().join(',')})`;
}
const TOP_CLIP = crimp('top', 18, 18);
const BODY_CLIP = crimp('bottom', 18, 3);

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  '--x': `${Math.cos((i / 40) * Math.PI * 2) * (140 + (i % 5) * 40)}px`,
  '--y': `${Math.sin((i / 40) * Math.PI * 2) * (140 + (i % 7) * 30) - 60}px`,
  '--r': `${(i * 47) % 360}deg`,
  '--c': `hsl(${(i * 37) % 360} 95% 65%)`,
  '--d': `${(i % 6) * 40}ms`,
})) as CSSProperties[];

export function PackOpening({ packId, onClose, onViewCollection }: Props) {
  const db = useDB();
  const pack = db.packs.find((p) => p.id === packId)!;
  const match = db.matches.find((m) => m.id === pack.matchId)!;
  const copies = useMemo(
    () => pack.copyIds.map((id) => db.copies.find((c) => c.id === id)!),
    [pack, db.copies],
  );

  const [phase, setPhase] = useState<Phase>('sealed');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const packRef = useRef<HTMLDivElement>(null);
  const motion = useRef<CardMotion | null>(null);

  useEffect(() => {
    const m = new CardMotion(packRef.current!);
    motion.current = m;
    return () => m.destroy();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const tear = () => {
    if (phase !== 'sealed') return;
    // Counted as opened as soon as it's torn, even if closed midway.
    store.update((d) => openPack(d, packId));
    navigator.vibrate?.(20);
    setPhase('shake');
    setTimeout(() => setPhase('tear'), 520);
    setTimeout(() => setPhase('drop'), 1100);
    setTimeout(() => setPhase('reveal'), 1750);
  };

  const current = copies[index];
  const rarity = current ? effectiveRarity(db, current) : 'comum';
  const pendingRarity = current && !match.confirmed && current.rarity !== 'comum' ? current.rarity : null;

  const tapCard = () => {
    if (phase !== 'reveal' || leaving) return;
    if (!revealed) {
      setRevealed(true);
      if (RARITIES[rarity].rank > 0) navigator.vibrate?.([30, 40, 60]);
      return;
    }
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      setRevealed(false);
      if (index + 1 < copies.length) setIndex(index + 1);
      else setPhase('summary');
    }, 420);
  };

  const onPackMove = (e: React.PointerEvent) => {
    const rect = packRef.current!.getBoundingClientRect();
    motion.current?.pointAt(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  };

  const showCards = phase === 'drop' || phase === 'reveal';

  return (
    <div className="opening" data-phase={phase} data-rarity={revealed ? rarity : undefined}>
      <div className="opening__rays" />
      <button className="opening__close icon-btn" onClick={onClose} aria-label="Fechar">
        ✕
      </button>

      {phase !== 'summary' && (
        <div className="opening__stage">
          {showCards && (
            <div className="opening__stack">
              {copies.map((copy, i) => {
                if (i < index) return null;
                const depth = i - index;
                return (
                  <div
                    key={copy.id}
                    className={`opening__card${depth === 0 && leaving ? ' is-leaving' : ''}`}
                    style={{ '--depth': depth, zIndex: copies.length - depth } as CSSProperties}
                  >
                    <HoloCard
                      card={copyCard(db, copy)}
                      back="pack"
                      flipped={!(depth === 0 && revealed)}
                      autoplay={depth === 0 && revealed}
                      captureTouch
                      still={depth > 0}
                      onClick={depth === 0 ? tapCard : undefined}
                    />
                  </div>
                );
              })}
              {revealed && <div className="opening__burst" key={`burst-${index}`} />}
              {revealed && rarity === 'pneu' && (
                <div className="opening__confetti" key={`confetti-${index}`}>
                  {CONFETTI.map((style, i) => (
                    <i key={i} style={style} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div
            ref={packRef}
            className="pack"
            onPointerMove={onPackMove}
            onPointerLeave={() => motion.current?.reset()}
            onClick={tear}
          >
            <div className="pack__rotator">
              <div className="pack__top" style={{ clipPath: TOP_CLIP }}>
                <span>✂ abra aqui</span>
              </div>
              <div className="pack__body" style={{ clipPath: BODY_CLIP }}>
                <div className="pack__seam" />
                <span className="pack__ball" />
                <div className="pack__logo">
                  PADEL<b>HOLO</b>
                </div>
                <div className="pack__title">Pacote da vitória</div>
                <div className="pack__score">{scoreText(match)}</div>
                <div className="pack__meta">
                  {copies.length} cartas · {shortDate(match.playedAt)}
                </div>
                <div className="pack__shine" />
                <div className="pack__glare" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="opening__caption">
        {phase === 'sealed' && <p className="opening__hint">Toque no pacote para abrir</p>}
        {phase === 'reveal' && !revealed && (
          <p className="opening__hint">
            Carta {index + 1} de {copies.length} · toque para revelar
          </p>
        )}
        {phase === 'reveal' && revealed && current && (
          <div className="opening__result" key={current.id}>
            <strong className="opening__rarity">{RARITIES[rarity].name}</strong>
            <span>{RARITIES[rarity].hint}</span>
            {current.rookie && <span className="tag tag--rookie">Rookie · primeira carta dele capturada</span>}
            {pendingRarity && (
              <span className="tag">
                {RARITIES[pendingRarity].name} liberada quando confirmarem a derrota
              </span>
            )}
            <p className="opening__hint">{index + 1 < copies.length ? 'Toque para a próxima' : 'Toque para terminar'}</p>
          </div>
        )}
      </div>

      {phase === 'summary' && (
        <div className="opening__summary">
          <h2>Cartas capturadas!</h2>
          <div className="opening__row">
            {copies.map((copy) => {
              const r = effectiveRarity(db, copy);
              return (
                <div key={copy.id} className="opening__summary-card">
                  <HoloCard card={copyCard(db, copy)} />
                  <span className={`rarity-pill rarity-pill--${r}`}>{RARITIES[r].name}</span>
                </div>
              );
            })}
          </div>
          <div className="opening__actions">
            <button className="btn btn--ghost" onClick={onClose}>
              Fechar
            </button>
            <button className="btn btn--primary" onClick={onViewCollection}>
              Ver no álbum
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
