import { useEffect, useState, type ReactNode } from 'react';
import { HoloCard } from './HoloCard';
import type { CardView } from '../lib/types';

interface Props {
  card: CardView;
  onClose: () => void;
  /** Extra content under the card (capture info, actions). */
  children?: ReactNode;
}

type OrientationPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };

const hasGyro = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && 'ontouchstart' in window;

export function Showcase({ card, onClose, children }: Props) {
  const [gyro, setGyro] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const toggleGyro = async () => {
    if (gyro) return setGyro(false);
    // iOS Safari only fires orientation events after an explicit permission prompt.
    const DOE = DeviceOrientationEvent as unknown as OrientationPermission;
    if (DOE.requestPermission && (await DOE.requestPermission()) !== 'granted') return;
    setGyro(true);
  };

  return (
    <div className="showcase" onClick={onClose}>
      <div className="showcase__stage" onClick={(e) => e.stopPropagation()}>
        <div className="showcase__card">
          <HoloCard card={card} autoplay gyro={gyro} flipped={flipped} captureTouch onClick={() => setFlipped((f) => !f)} />
        </div>
        {children}
        <div className="showcase__actions">
          <button className="btn btn--ghost" onClick={() => setFlipped((f) => !f)}>
            Virar card
          </button>
          {hasGyro && (
            <button className="btn btn--ghost" onClick={toggleGyro}>
              {gyro ? 'Desligar giroscópio' : 'Mexer com o celular'}
            </button>
          )}
          <button className="btn btn--ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
