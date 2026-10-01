import { useState } from 'react';
import { HoloCard } from './HoloCard';
import { resizeImage } from '../lib/storage';
import {
  CATEGORIES,
  EFFECTS,
  POSITION_LABELS,
  STAT_LABELS,
  overall,
  type PlayerCard,
  type Position,
  type Stats,
} from '../lib/types';

interface Props {
  initial: PlayerCard;
  onSave: (card: PlayerCard) => void;
  onCancel: () => void;
}

export function CardEditor({ initial, onSave, onCancel }: Props) {
  const [card, setCard] = useState(initial);
  const [error, setError] = useState('');

  const set = <K extends keyof PlayerCard>(key: K, value: PlayerCard[K]) =>
    setCard((c) => ({ ...c, [key]: value }));
  const setStat = (key: keyof Stats, value: number) =>
    setCard((c) => ({ ...c, stats: { ...c.stats, [key]: value } }));

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!card.name.trim()) {
      setError('Coloque pelo menos o seu nome.');
      return;
    }
    onSave({ ...card, name: card.name.trim() });
  };

  return (
    <div className="editor">
      <form className="editor__form" onSubmit={onSubmit}>
        <section className="panel">
          <h3>Foto</h3>
          <label className="upload">
            <input type="file" accept="image/*" onChange={onPhoto} />
            {card.photo ? 'Trocar foto' : 'Enviar foto'}
          </label>
          {card.photo && (
            <div className="grid-3">
              <Range label="Horizontal" min={0} max={100} value={card.photoX} onChange={(v) => set('photoX', v)} />
              <Range label="Vertical" min={0} max={100} value={card.photoY} onChange={(v) => set('photoY', v)} />
              <Range
                label="Zoom"
                min={1}
                max={2.5}
                step={0.05}
                value={card.photoZoom}
                onChange={(v) => set('photoZoom', v)}
              />
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Jogador</h3>
          <div className="grid-2">
            <Field label="Nome">
              <input value={card.name} maxLength={24} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Ana Souza" />
            </Field>
            <Field label="Apelido">
              <input value={card.nickname} maxLength={24} onChange={(e) => set('nickname', e.target.value)} placeholder="Ex.: A Muralha" />
            </Field>
            <Field label="Posição">
              <select value={card.position} onChange={(e) => set('position', e.target.value as Position)}>
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Mão">
              <select value={card.hand} onChange={(e) => set('hand', e.target.value as PlayerCard['hand'])}>
                <option value="destro">Destro</option>
                <option value="canhoto">Canhoto</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select value={card.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Raquete">
              <input value={card.racket} maxLength={32} onChange={(e) => set('racket', e.target.value)} placeholder="Ex.: Adidas Metalbone" />
            </Field>
            <Field label="Clube">
              <input value={card.club} maxLength={28} onChange={(e) => set('club', e.target.value)} />
            </Field>
            <Field label="Cidade">
              <input value={card.city} maxLength={24} onChange={(e) => set('city', e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="panel">
          <h3>
            Proficiência <span className="ovr-pill">OVR {overall(card.stats)}</span>
          </h3>
          <div className="grid-2">
            {(Object.keys(STAT_LABELS) as (keyof Stats)[]).map((k) => (
              <Range key={k} label={STAT_LABELS[k].long} min={1} max={99} value={card.stats[k]} onChange={(v) => setStat(k, v)} />
            ))}
          </div>
          <p className="hint">Bronze até 59 · Prata 60–74 · Ouro 75–84 · Elite 85+</p>
        </section>

        <section className="panel">
          <h3>Efeito holo</h3>
          <div className="effects">
            {EFFECTS.map((fx) => (
              <button
                type="button"
                key={fx.id}
                className={`effect-chip effect-chip--${fx.id}${card.effect === fx.id ? ' is-active' : ''}`}
                onClick={() => set('effect', fx.id)}
              >
                <strong>{fx.name}</strong>
                <span>{fx.description}</span>
              </button>
            ))}
          </div>
        </section>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            Salvar card
          </button>
        </div>
      </form>

      <aside className="editor__preview">
        <div className="preview-card">
          <HoloCard card={card} />
        </div>
        <p className="hint">Passe o mouse (ou o dedo) sobre o card</p>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Range(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
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
