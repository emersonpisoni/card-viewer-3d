import { useState } from 'react';
import { Avatar } from './Avatar';
import { Modal } from './Modal';
import { ratePlayer } from '../lib/db';
import { firstName } from '../lib/format';
import { overall, statsFor } from '../lib/rules';
import { store, useDB } from '../lib/store';
import { STAT_KEYS, STAT_LABELS, type Stats } from '../lib/types';

interface Props {
  playerIds: string[];
  onClose: () => void;
}

const DEFAULT_STATS = Object.fromEntries(STAT_KEYS.map((k) => [k, 60])) as unknown as Stats;

/** Steps through the given players; anyone can rate anyone except themselves. */
export function RateModal({ playerIds, onClose }: Props) {
  const db = useDB();
  const me = db.currentUserId;
  const queue = playerIds.filter((id) => id !== me);
  const [step, setStep] = useState(0);

  const startingStats = (id: string): Stats => {
    const mine = db.ratings.filter((r) => r.from === me && r.to === id).sort((a, b) => b.createdAt - a.createdAt)[0];
    return { ...(mine?.stats ?? statsFor(db, id) ?? DEFAULT_STATS) };
  };

  const [stats, setStats] = useState<Stats>(() => startingStats(queue[0]));
  const id = queue[step];
  const player = db.players.find((p) => p.id === id);
  if (!player) return null;

  const next = () => {
    if (step + 1 >= queue.length) return onClose();
    setStats(startingStats(queue[step + 1]));
    setStep(step + 1);
  };

  const save = () => {
    store.update((d) => ratePlayer(d, me, id, stats));
    next();
  };

  const current = overall(statsFor(db, id));
  const yours = overall(stats);

  const footer = (
    <>
      <button className="btn btn--ghost" onClick={next}>
        Pular
      </button>
      <button className="btn btn--primary" onClick={save}>
        {step + 1 < queue.length ? 'Salvar e próximo' : 'Salvar avaliação'}
      </button>
    </>
  );

  return (
    <Modal title={`Avaliar ${firstName(player.name)}`} onClose={onClose} footer={footer}>
      <div className="rate">
        <div className="rate__who">
          <Avatar player={player} size={52} link={false} />
          <div>
            <strong>{player.name}</strong>
            <span>
              OVR atual {current ?? '—'} · sua nota {yours}
              {queue.length > 1 && ` · ${step + 1} de ${queue.length}`}
            </span>
          </div>
        </div>
        <p className="hint hint--left">
          A carta de cada jogador é a média das notas de todo mundo. Seja justo… ou não 😏
        </p>
        <div className="grid-2">
          {STAT_KEYS.map((k) => (
            <label className="range" key={k}>
              <span>
                {STAT_LABELS[k].long}
                <b>{stats[k]}</b>
              </span>
              <input
                type="range"
                min={1}
                max={99}
                value={stats[k]}
                onChange={(e) => setStats((s) => ({ ...s, [k]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
