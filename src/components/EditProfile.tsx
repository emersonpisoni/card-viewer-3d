import { useState } from 'react';
import { HoloCard } from './HoloCard';
import { Modal } from './Modal';
import { updatePlayer, type ProfilePatch } from '../lib/db';
import { resizeImage } from '../lib/format';
import { liveCard } from '../lib/rules';
import { store, useDB, useMe } from '../lib/store';
import { CATEGORIES, FOILS, POSITION_LABELS, type Player, type Position } from '../lib/types';

/** Personal details and looks only. Stats come from other players' ratings. */
export function EditProfile({ onClose }: { onClose: () => void }) {
  const db = useDB();
  const me = useMe();
  const [draft, setDraft] = useState<Player>(me);
  const [error, setError] = useState('');

  const set = <K extends keyof Player>(key: K, value: Player[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      set('photo', await resizeImage(file));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const save = () => {
    if (!draft.name.trim()) return setError('Coloque seu nome.');
    const { id: _id, claimed: _c, createdBy: _b, createdAt: _a, ...patch } = draft;
    store.update((d) => updatePlayer(d, me.id, { ...patch, name: patch.name.trim() } satisfies ProfilePatch));
    onClose();
  };

  const footer = (
    <>
      <button className="btn btn--ghost" onClick={onClose}>
        Cancelar
      </button>
      <button className="btn btn--primary" onClick={save}>
        Salvar
      </button>
    </>
  );

  return (
    <Modal title="Editar perfil" onClose={onClose} footer={footer}>
      <div className="edit-profile">
        <div className="edit-profile__preview">
          <HoloCard card={liveCard(db, draft)} />
          <p className="hint">Seus atributos vêm das avaliações de outros jogadores. Você não pode editá-los.</p>
        </div>
        <div className="edit-profile__form">
          <label className="upload">
            <input type="file" accept="image/*" onChange={onPhoto} />
            {draft.photo ? 'Trocar foto' : 'Enviar foto'}
          </label>
          {draft.photo && (
            <div className="grid-3">
              <Range label="Horizontal" min={0} max={100} value={draft.photoX} onChange={(v) => set('photoX', v)} />
              <Range label="Vertical" min={0} max={100} value={draft.photoY} onChange={(v) => set('photoY', v)} />
              <Range label="Zoom" min={1} max={2.5} step={0.05} value={draft.photoZoom} onChange={(v) => set('photoZoom', v)} />
            </div>
          )}
          <div className="grid-2">
            <label className="field">
              <span>Nome</span>
              <input value={draft.name} maxLength={24} onChange={(e) => set('name', e.target.value)} />
            </label>
            <label className="field">
              <span>Apelido</span>
              <input value={draft.nickname} maxLength={24} onChange={(e) => set('nickname', e.target.value)} />
            </label>
            <label className="field">
              <span>Posição</span>
              <select value={draft.position} onChange={(e) => set('position', e.target.value as Position)}>
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Mão</span>
              <select value={draft.hand} onChange={(e) => set('hand', e.target.value as Player['hand'])}>
                <option value="destro">Destro</option>
                <option value="canhoto">Canhoto</option>
              </select>
            </label>
            <label className="field">
              <span>Categoria</span>
              <select value={draft.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">—</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Raquete</span>
              <input value={draft.racket} maxLength={32} onChange={(e) => set('racket', e.target.value)} />
            </label>
            <label className="field">
              <span>Clube</span>
              <input value={draft.club} maxLength={28} onChange={(e) => set('club', e.target.value)} />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input value={draft.city} maxLength={24} onChange={(e) => set('city', e.target.value)} />
            </label>
          </div>
          <div className="field">
            <span>Textura do foil</span>
            <div className="foils">
              {FOILS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  className={`chip${draft.foil === f.id ? ' is-active' : ''}`}
                  onClick={() => set('foil', f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}

function Range(props: { label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="range">
      <span>
        {props.label}
        <b>{props.step ? props.value.toFixed(2) : props.value}</b>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}
