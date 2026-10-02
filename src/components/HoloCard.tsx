import { useEffect, useRef, type CSSProperties } from 'react';
import { CardMotion } from '../lib/motion';
import { textureVars } from '../lib/textures';
import { overall, tierFor } from '../lib/rules';
import { shortDate } from '../lib/format';
import { POSITION_LABELS, RARITIES, STAT_KEYS, STAT_LABELS, type CardView } from '../lib/types';
import './HoloCard.css';
import './effects.css';

interface Props {
  card: CardView;
  /** Play a short light sweep when this turns true (on mount or later). */
  autoplay?: boolean;
  /** Drive the card with the phone's gyroscope instead of the pointer. */
  gyro?: boolean;
  /** Block page scrolling while dragging over the card on touch screens. */
  captureTouch?: boolean;
  /** Show the back of the card. */
  flipped?: boolean;
  /** "pack" is a generic back that doesn't reveal who the card is. */
  back?: 'details' | 'pack';
  /** Ignore the pointer (small thumbnails). */
  still?: boolean;
  onClick?: () => void;
}

const TIER_LABEL = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', elite: 'Elite' };
const SWEEP: [number, number][] = [
  [18, 22],
  [82, 28],
  [76, 82],
  [24, 74],
  [50, 40],
];

export function HoloCard({ card, autoplay, gyro, captureTouch, flipped, back = 'details', still, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const motion = useRef<CardMotion | null>(null);
  const sweepTimers = useRef<number[]>([]);

  const stopSweep = () => {
    sweepTimers.current.forEach(clearTimeout);
    sweepTimers.current = [];
  };

  useEffect(() => {
    const m = new CardMotion(ref.current!);
    motion.current = m;
    return () => {
      stopSweep();
      m.destroy();
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    SWEEP.forEach(([x, y], i) => {
      sweepTimers.current.push(window.setTimeout(() => motion.current?.pointAt(x, y), 250 + i * 320));
    });
    sweepTimers.current.push(
      window.setTimeout(() => motion.current?.reset(), 250 + SWEEP.length * 320 + 200),
    );
    return stopSweep;
  }, [autoplay]);

  useEffect(() => {
    if (!gyro) return;
    let base: { beta: number; gamma: number } | null = null;
    const range = 20;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      base ??= { beta: e.beta, gamma: e.gamma };
      const x = Math.max(-range, Math.min(range, e.gamma - base.gamma));
      const y = Math.max(-range, Math.min(range, e.beta - base.beta));
      motion.current?.pointAt(50 + (x / range) * 50, 50 + (y / range) * 50);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => {
      window.removeEventListener('deviceorientation', onOrient);
      motion.current?.reset();
    };
  }, [gyro]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (gyro || still) return;
    stopSweep();
    const rect = ref.current!.getBoundingClientRect();
    motion.current?.pointAt(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100,
    );
  };

  const onPointerLeave = () => {
    if (!gyro && !still) motion.current?.reset();
  };

  const ovr = overall(card.stats);
  const tier = tierFor(ovr);
  const style = { touchAction: captureTouch ? 'none' : 'pan-y', ...textureVars(card.foil) } as CSSProperties;
  const footerLabel = card.provisional ? 'Provisória' : card.rarity ? RARITIES[card.rarity].name : TIER_LABEL[tier];

  return (
    <div
      ref={ref}
      className={`card${onClick ? ' card--clickable' : ''}`}
      data-effect={card.effect}
      data-foil={card.foil}
      data-tier={tier}
      data-rarity={card.rarity}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerLeave}
      onClick={onClick}
    >
      <div className="card__rotator">
        <div className={`card__flipper${flipped ? ' is-flipped' : ''}`}>
          <div className="card__front">
            <div className="card__inner" />
            <div className="card__emboss" />

            <div className="card__photo">
              <div className="card__photo-layer">
                {card.photo ? (
                  <img
                    src={card.photo}
                    alt=""
                    draggable={false}
                    style={{
                      objectPosition: `${card.photoX}% ${card.photoY}%`,
                      transform: `scale(${card.photoZoom})`,
                      transformOrigin: `${card.photoX}% ${card.photoY}%`,
                    }}
                  />
                ) : (
                  <div className="card__placeholder">{initials(card.name)}</div>
                )}
              </div>
              <div className="card__badge">
                <span className="card__ovr">{ovr ?? '?'}</span>
                <span className="card__pos">{POSITION_LABELS[card.position]}</span>
              </div>
              {card.category && (
                <div className="card__cat">
                  <span>CAT</span>
                  {card.category}
                </div>
              )}
              {card.rookie && <div className="card__rookie">Rookie</div>}
            </div>

            <div className="card__name">
              <h2>{card.name || 'Seu Nome'}</h2>
              {card.nickname && <p>“{card.nickname}”</p>}
            </div>

            {card.stats ? (
              <ul className="card__stats">
                {STAT_KEYS.map((k) => (
                  <li key={k}>
                    <b>{card.stats![k]}</b>
                    <span>{STAT_LABELS[k].short}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card__unrated">
                <b>Sem avaliações</b>
                <span>Os atributos aparecem quando outros jogadores avaliarem</span>
              </div>
            )}

            <div className="card__footer">
              <span className="card__tier">{footerLabel}</span>
              <span className="card__meta">
                {card.capture
                  ? `${shortDate(card.capture.at)} · ${card.capture.score}`
                  : [card.club, card.city].filter(Boolean).join(' · ') || 'Padel Holo'}
              </span>
              <span className="card__hand">{card.hand === 'canhoto' ? 'L' : 'R'}</span>
            </div>

            <div className="card__shine" />
            <div className="card__tint" />
            <div className="card__glare" />
          </div>

          <div className={`card__back${back === 'pack' ? ' card__back--pack' : ''}`}>
            <div className="card__inner" />
            <div className="card__emboss" />
            {back === 'pack' ? (
              <div className="card__back-content card__back-content--pack">
                <span className="card__logo-ball card__logo-ball--big" />
                <div className="card__logo">
                  PADEL<b>HOLO</b>
                </div>
                <p>Toque para revelar</p>
              </div>
            ) : (
              <div className="card__back-content">
                <div className="card__logo">
                  <span className="card__logo-ball" />
                  PADEL<b>HOLO</b>
                </div>
                <h3>{card.name || 'Seu Nome'}</h3>
                <dl>
                  <dt>Posição</dt>
                  <dd>{POSITION_LABELS[card.position]}</dd>
                  <dt>Mão</dt>
                  <dd>{card.hand === 'canhoto' ? 'Canhoto' : 'Destro'}</dd>
                  {card.category && (
                    <>
                      <dt>Categoria</dt>
                      <dd>{card.category}</dd>
                    </>
                  )}
                  {card.racket && (
                    <>
                      <dt>Raquete</dt>
                      <dd>{card.racket}</dd>
                    </>
                  )}
                  {card.club && (
                    <>
                      <dt>Clube</dt>
                      <dd>{card.club}</dd>
                    </>
                  )}
                  {card.capture ? (
                    <>
                      <dt>Capturada</dt>
                      <dd>
                        {shortDate(card.capture.at)} · {card.capture.score}
                      </dd>
                    </>
                  ) : (
                    card.ratingCount != null && (
                      <>
                        <dt>Avaliações</dt>
                        <dd>{card.ratingCount}</dd>
                      </>
                    )
                  )}
                </dl>
                <div className="card__back-ovr">
                  <b>{ovr ?? '?'}</b>
                  <span>OVR · {footerLabel}</span>
                </div>
              </div>
            )}
            <div className="card__glare" />
          </div>
        </div>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
