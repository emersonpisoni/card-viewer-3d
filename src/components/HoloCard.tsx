import { useEffect, useRef, type CSSProperties } from 'react';
import { CardMotion } from '../lib/motion';
import { textureVars } from '../lib/textures';
import {
  POSITION_LABELS,
  STAT_LABELS,
  overall,
  tierFor,
  type PlayerCard,
  type Stats,
} from '../lib/types';
import './HoloCard.css';
import './effects.css';

interface Props {
  card: PlayerCard;
  /** Play a short light sweep when the card mounts. */
  autoplay?: boolean;
  /** Drive the card with the phone's gyroscope instead of the pointer. */
  gyro?: boolean;
  /** Block page scrolling while dragging over the card on touch screens. */
  captureTouch?: boolean;
  /** Show the back of the card. */
  flipped?: boolean;
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

export function HoloCard({ card, autoplay, gyro, captureTouch, flipped, onClick }: Props) {
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
    if (gyro) return;
    stopSweep();
    const rect = ref.current!.getBoundingClientRect();
    motion.current?.pointAt(
      ((e.clientX - rect.left) / rect.width) * 100,
      ((e.clientY - rect.top) / rect.height) * 100,
    );
  };

  const onPointerLeave = () => {
    if (!gyro) motion.current?.reset();
  };

  const ovr = overall(card.stats);
  const tier = tierFor(ovr);
  const statKeys = Object.keys(STAT_LABELS) as (keyof Stats)[];
  const style = { touchAction: captureTouch ? 'none' : 'pan-y', ...textureVars(card.foil) } as CSSProperties;

  return (
    <div
      ref={ref}
      className="card"
      data-effect={card.effect}
      data-foil={card.foil}
      data-tier={tier}
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
                <span className="card__ovr">{ovr}</span>
                <span className="card__pos">{POSITION_LABELS[card.position]}</span>
              </div>
              <div className="card__cat">
                <span>CAT</span>
                {card.category}
              </div>
            </div>

            <div className="card__name">
              <h2>{card.name || 'Seu Nome'}</h2>
              {card.nickname && <p>“{card.nickname}”</p>}
            </div>

            <ul className="card__stats">
              {statKeys.map((k) => (
                <li key={k}>
                  <b>{card.stats[k]}</b>
                  <span>{STAT_LABELS[k].short}</span>
                </li>
              ))}
            </ul>

            <div className="card__footer">
              <span className="card__tier">{TIER_LABEL[tier]}</span>
              <span className="card__meta">
                {[card.club, card.city].filter(Boolean).join(' · ') || 'Padel Holo'}
              </span>
              <span className="card__hand">{card.hand === 'canhoto' ? 'L' : 'R'}</span>
            </div>

            <div className="card__shine" />
            <div className="card__tint" />
            <div className="card__glare" />
          </div>

          <div className="card__back">
            <div className="card__inner" />
            <div className="card__emboss" />
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
                <dt>Categoria</dt>
                <dd>{card.category}</dd>
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
                {card.city && (
                  <>
                    <dt>Cidade</dt>
                    <dd>{card.city}</dd>
                  </>
                )}
              </dl>
              <div className="card__back-ovr">
                <b>{ovr}</b>
                <span>OVR · {TIER_LABEL[tier]}</span>
              </div>
            </div>
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
