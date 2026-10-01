import { useEffect, useState } from 'react';
import { HoloCard } from './HoloCard';
import { EFFECTS, type HoloEffect, type PlayerCard } from '../lib/types';

interface Props {
  card: PlayerCard;
  onChangeEffect: (effect: HoloEffect) => void;
  onClose: () => void;
}

type OrientationPermission = { requestPermission?: () => Promise<'granted' | 'denied'> };

const hasGyro = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window && 'ontouchstart' in window;

export function Showcase({ card, onChangeEffect, onClose }: Props) {
  const [gyro, setGyro] = useState(false);

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
          <HoloCard card={card} autoplay gyro={gyro} captureTouch />
        </div>
        <div className="showcase__effects">
          {EFFECTS.map((fx) => (
            <button
              key={fx.id}
              className={`chip${card.effect === fx.id ? ' is-active' : ''}`}
              onClick={() => onChangeEffect(fx.id)}
            >
              {fx.name}
            </button>
          ))}
        </div>
        <div className="showcase__actions">
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
