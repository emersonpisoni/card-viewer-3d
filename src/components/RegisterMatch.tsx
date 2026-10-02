import { useState } from 'react';
import { Modal } from './Modal';
import { addMatch, addProvisionalPlayer } from '../lib/db';
import { firstName } from '../lib/format';
import { rarityFor, winnerOf } from '../lib/rules';
import { store, useDB, useMe } from '../lib/store';
import { RARITIES, type Match, type SetScore } from '../lib/types';

/** An existing player id, or a name for a provisional player to create. */
type Pick = { id: string } | { name: string } | null;

interface Props {
  onClose: () => void;
  onRecorded: (match: Match) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function RegisterMatch({ onClose, onRecorded }: Props) {
  const db = useDB();
  const me = useMe();
  const [partner, setPartner] = useState<Pick>(null);
  const [opp1, setOpp1] = useState<Pick>(null);
  const [opp2, setOpp2] = useState<Pick>(null);
  const [sets, setSets] = useState<SetScore[]>([
    [6, 4],
    [6, 4],
  ]);
  const [date, setDate] = useState(today);
  const [club, setClub] = useState(me.club);
  const [error, setError] = useState('');

  const picks = [partner, opp1, opp2];
  const takenIds = picks.flatMap((p) => (p && 'id' in p ? [p.id] : []));
  const winner = winnerOf(sets);
  const complete = picks.every((p) => p && ('id' in p ? p.id : p.name.trim()));

  // Preview the rarity using existing players only; new ones have no stats.
  const preview = (() => {
    if (!complete || !winner) return null;
    const ids = picks.map((p) => (p && 'id' in p ? p.id : 'new')) as string[];
    const draft: Match = {
      id: 'preview',
      createdBy: me.id,
      createdAt: 0,
      playedAt: 0,
      club,
      teamA: [me.id, ids[0]],
      teamB: [ids[1], ids[2]],
      sets,
      winner,
      confirmed: true,
    };
    return rarityFor(db, draft);
  })();

  const updateSet = (i: number, side: 0 | 1, value: string) => {
    const n = Math.max(0, Math.min(7, Number(value) || 0));
    setSets((s) => s.map((set, j) => (j === i ? (side ? [set[0], n] : [n, set[1]]) : set)));
  };

  const submit = () => {
    if (!complete) return setError('Escolha seu parceiro e os dois adversários.');
    if (!winner) return setError('O placar precisa ter um vencedor.');
    const names = picks.map((p) => (p && 'name' in p ? p.name.trim().toLowerCase() : null)).filter(Boolean);
    if (new Set(takenIds).size !== takenIds.length || new Set(names).size !== names.length) {
      return setError('Cada jogador só pode aparecer uma vez.');
    }

    let recorded = null as Match | null;
    store.update((d) => {
      const ids: string[] = [];
      for (const p of picks) {
        if (p && 'id' in p) ids.push(p.id);
        else if (p) {
          const res = addProvisionalPlayer(d, p.name, me.id);
          d = res.db;
          ids.push(res.player.id);
        }
      }
      const res = addMatch(d, {
        createdBy: me.id,
        playedAt: new Date(`${date}T12:00:00`).getTime(),
        club: club.trim(),
        teamA: [me.id, ids[0]],
        teamB: [ids[1], ids[2]],
        sets,
      });
      recorded = res.match;
      return res.db;
    });
    if (recorded) onRecorded(recorded);
  };

  const footer = (
    <>
      <button className="btn btn--ghost" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn btn--primary" onClick={submit}>
        Registrar partida
      </button>
    </>
  );

  return (
    <Modal title="Registrar partida" onClose={onClose} footer={footer}>
      <div className="register">
        <div className="register__teams">
          <fieldset className="register__team">
            <legend>Sua dupla</legend>
            <div className="register__me">{firstName(me.name)} (você)</div>
            <PlayerPicker value={partner} onChange={setPartner} exclude={[me.id, ...takenIds]} placeholder="Parceiro" />
          </fieldset>
          <span className="register__vs">VS</span>
          <fieldset className="register__team">
            <legend>Adversários</legend>
            <PlayerPicker value={opp1} onChange={setOpp1} exclude={[me.id, ...takenIds]} placeholder="Adversário 1" />
            <PlayerPicker value={opp2} onChange={setOpp2} exclude={[me.id, ...takenIds]} placeholder="Adversário 2" />
          </fieldset>
        </div>

        <div className="register__sets">
          <div className="register__sets-head">
            <span />
            <span>Nós</span>
            <span>Eles</span>
          </div>
          {sets.map(([a, b], i) => (
            <div className="register__set" key={i}>
              <span>{i + 1}º set</span>
              <input type="number" min={0} max={7} value={a} onChange={(e) => updateSet(i, 0, e.target.value)} />
              <input type="number" min={0} max={7} value={b} onChange={(e) => updateSet(i, 1, e.target.value)} />
            </div>
          ))}
          <button
            type="button"
            className="link"
            onClick={() => setSets((s) => (s.length === 3 ? s.slice(0, 2) : [...s, [6, 4]]))}
          >
            {sets.length === 3 ? '− Remover 3º set' : '+ Teve 3º set'}
          </button>
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Data</span>
            <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Local</span>
            <input value={club} onChange={(e) => setClub(e.target.value)} maxLength={40} />
          </label>
        </div>

        {winner && (
          <div className={`register__preview register__preview--${winner === 'A' ? 'win' : 'loss'}`}>
            {winner === 'A' ? (
              <>
                <strong>Vitória 🏆</strong>
                <span>
                  Você ganha um pacote com as cartas dos adversários
                  {preview && preview !== 'comum' && (
                    <>
                      {' '}
                      em <b className={`rarity-text--${preview}`}>{RARITIES[preview].name}</b>
                    </>
                  )}
                  . Raridades valem depois que eles confirmarem.
                </span>
              </>
            ) : (
              <>
                <strong>Derrota 😅</strong>
                <span>Os adversários capturam suas cartas. Como foi você que registrou, já conta como confirmada.</span>
              </>
            )}
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </Modal>
  );
}

function PlayerPicker({
  value,
  onChange,
  exclude,
  placeholder,
}: {
  value: Pick;
  onChange: (p: Pick) => void;
  exclude: string[];
  placeholder: string;
}) {
  const db = useDB();
  const selectedId = value && 'id' in value ? value.id : '';
  const isNew = value != null && 'name' in value;
  const options = db.players
    .filter((p) => p.id === selectedId || !exclude.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="picker">
      <select
        value={isNew ? '__new' : selectedId}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '__new' ? { name: '' } : v ? { id: v } : null);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.nickname ? ` “${p.nickname}”` : ''}
            {p.claimed ? '' : ' (provisório)'}
          </option>
        ))}
        <option value="__new">+ Não está no app…</option>
      </select>
      {isNew && (
        <input
          autoFocus
          placeholder="Nome ou apelido"
          maxLength={24}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      )}
    </div>
  );
}
