import { useEffect, useMemo, useState } from 'react';
import { Book } from '../components/Book';
import { HoloCard } from '../components/HoloCard';
import { Showcase } from '../components/Showcase';
import { firstName, shortDate } from '../lib/format';
import { href } from '../lib/route';
import { copyCard, effectiveRarity, overall } from '../lib/rules';
import { useDB, useMe } from '../lib/store';
import { RARITIES, type CardCopy, type DB, type Player, type Rarity } from '../lib/types';
import './Collection.css';

type View = 'album' | 'grid' | 'list' | 'vitrine';
const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'album', label: 'Álbum', icon: '📖' },
  { id: 'grid', label: 'Grade', icon: '▦' },
  { id: 'list', label: 'Lista', icon: '☰' },
  { id: 'vitrine', label: 'Vitrine', icon: '✦' },
];
const VIEW_KEY = 'padel-holo:collection-view';
// 2×2 per page keeps the cards big enough to show off the holo.
const SLOTS_PER_PAGE = 4;

function savedView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY) as View | null;
    if (v && VIEWS.some((x) => x.id === v)) return v;
  } catch {
    // storage unavailable: use the default
  }
  return 'album';
}

function useWide(query = '(min-width: 900px)') {
  const [wide, setWide] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return wide;
}

const rank = (db: DB, c: CardCopy) => RARITIES[effectiveRarity(db, c)].rank;

export function Collection() {
  const db = useDB();
  const me = useMe();
  const [view, setView] = useState<View>(savedView);
  const [selected, setSelected] = useState<CardCopy | null>(null);
  const wide = useWide();

  const chooseView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // not critical
    }
  };

  const opened = useMemo(() => new Set(db.packs.filter((p) => p.openedAt).flatMap((p) => p.copyIds)), [db.packs]);
  const mine = db.copies.filter((c) => c.ownerId === me.id && opened.has(c.id));

  // Album order is the order players joined, so slot numbers stay stable.
  const albumPlayers = db.players
    .filter((p) => p.id !== me.id)
    .sort((a, b) => a.createdAt - b.createdAt || a.name.localeCompare(b.name));
  const byPlayer = new Map<string, CardCopy[]>();
  for (const c of mine) byPlayer.set(c.playerId, [...(byPlayer.get(c.playerId) ?? []), c]);
  const best = (copies: CardCopy[]) =>
    [...copies].sort((a, b) => rank(db, b) - rank(db, a) || Number(b.rookie) - Number(a.rookie) || b.capturedAt - a.capturedAt)[0];

  const unique = byPlayer.size;
  const progress = albumPlayers.length ? Math.round((unique / albumPlayers.length) * 100) : 0;

  return (
    <div className="collection">
      <header className="collection__header">
        <div>
          <h1>Minha coleção</h1>
          <p>
            {unique} de {albumPlayers.length} jogadores · {mine.length} {mine.length === 1 ? 'carta' : 'cartas'}
          </p>
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="segmented" role="tablist">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'is-active' : ''} onClick={() => chooseView(v.id)}>
              <span aria-hidden>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
      </header>

      {view === 'album' && (
        <AlbumView
          me={me}
          players={albumPlayers}
          byPlayer={byPlayer}
          best={best}
          unique={unique}
          total={mine.length}
          spread={wide}
          onSelect={setSelected}
        />
      )}
      {view !== 'album' && mine.length === 0 && (
        <p className="empty">Nenhuma carta ainda. Ganhe uma partida para capturar as primeiras!</p>
      )}
      {view === 'grid' && mine.length > 0 && <GridView copies={mine} onSelect={setSelected} />}
      {view === 'list' && mine.length > 0 && <ListView copies={mine} onSelect={setSelected} />}
      {view === 'vitrine' && mine.length > 0 && <VitrineView copies={mine} onSelect={setSelected} />}

      {selected && (
        <Showcase card={copyCard(db, selected)} onClose={() => setSelected(null)}>
          <CopyInfo copy={selected} count={byPlayer.get(selected.playerId)?.length ?? 1} />
        </Showcase>
      )}
    </div>
  );
}

function CopyInfo({ copy, count }: { copy: CardCopy; count: number }) {
  const db = useDB();
  const player = db.players.find((p) => p.id === copy.playerId)!;
  const match = db.matches.find((m) => m.id === copy.matchId);
  const rarity = effectiveRarity(db, copy);
  return (
    <div className="copy-info">
      <span className={`rarity-pill rarity-pill--${rarity}`}>{RARITIES[rarity].name}</span>
      <p>
        Capturada {match && `em ${shortDate(match.playedAt)} · ${match.club}`}
        {copy.rookie && ' · Rookie'}
      </p>
      <p>
        Você tem {count} {count === 1 ? 'carta' : 'cartas'} de{' '}
        <a href={href({ name: 'player', id: player.id })}>{firstName(player.name)}</a>
      </p>
    </div>
  );
}

/* ---------------- Álbum ---------------- */

function AlbumView(props: {
  me: Player;
  players: Player[];
  byPlayer: Map<string, CardCopy[]>;
  best: (copies: CardCopy[]) => CardCopy;
  unique: number;
  total: number;
  spread: boolean;
  onSelect: (c: CardCopy) => void;
}) {
  const db = useDB();
  const { players, byPlayer, best, onSelect } = props;

  const chunks: Player[][] = [];
  for (let i = 0; i < players.length; i += SLOTS_PER_PAGE) chunks.push(players.slice(i, i + SLOTS_PER_PAGE));
  if (!chunks.length) chunks.push([]);

  const pages = [
    (side: 'left' | 'right') => (
      <div className={`book-page book-page--${side} album-cover`}>
        <div className="album-cover__shine" />
        <span className="album-cover__ball" />
        <p className="album-cover__season">Temporada 2026</p>
        <h2>
          Álbum de
          <br />
          capturas
        </h2>
        <p className="album-cover__owner">{props.me.name}</p>
        <p className="album-cover__stats">
          {props.unique}/{players.length} jogadores · {props.total} cartas
        </p>
        <p className="album-cover__hint">Arraste ou use as setas para folhear</p>
      </div>
    ),
    ...chunks.map((chunk, pageIndex) => (side: 'left' | 'right') => (
      <div className={`book-page book-page--${side} album-page`}>
        <span className="album-page__number">{pageIndex + 1}</span>
        <div className="album-page__grid">
          {chunk.map((player, i) => {
            const number = pageIndex * SLOTS_PER_PAGE + i + 1;
            const copies = byPlayer.get(player.id);
            if (!copies) {
              return (
                <div key={player.id} className="slot slot--empty">
                  <b>#{String(number).padStart(2, '0')}</b>
                  <span className="slot__name">{firstName(player.name)}</span>
                  <span className="slot__hint">{player.claimed ? 'Vença para capturar' : 'Provisório'}</span>
                </div>
              );
            }
            const top = best(copies);
            return (
              <div key={player.id} className="slot">
                <div className="slot__card">
                  <HoloCard card={copyCard(db, top)} onClick={() => onSelect(top)} />
                  {copies.length > 1 && <span className="slot__count">×{copies.length}</span>}
                  <span className="slot__number">#{String(number).padStart(2, '0')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )),
  ];

  return <Book pages={pages} spread={props.spread} />;
}

/* ---------------- Grade ---------------- */

type Sort = 'recent' | 'ovr' | 'rarity';
const RARITY_FILTERS: (Rarity | 'all')[] = ['all', 'comum', 'holo', 'radiante', 'pneu'];

function useSorted(copies: CardCopy[], sort: Sort, filter: Rarity | 'all') {
  const db = useDB();
  return copies
    .filter((c) => filter === 'all' || effectiveRarity(db, c) === filter)
    .sort((a, b) => {
      if (sort === 'ovr') return (overall(b.stats) ?? 0) - (overall(a.stats) ?? 0);
      if (sort === 'rarity') return rank(db, b) - rank(db, a) || b.capturedAt - a.capturedAt;
      return b.capturedAt - a.capturedAt;
    });
}

function Filters(props: {
  sort: Sort;
  setSort: (s: Sort) => void;
  filter: Rarity | 'all';
  setFilter: (f: Rarity | 'all') => void;
}) {
  return (
    <div className="filters">
      <div className="filters__chips">
        {RARITY_FILTERS.map((r) => (
          <button
            key={r}
            className={`chip chip--small${props.filter === r ? ' is-active' : ''}`}
            onClick={() => props.setFilter(r)}
          >
            {r === 'all' ? 'Todas' : RARITIES[r].name}
          </button>
        ))}
      </div>
      <select className="filters__sort" value={props.sort} onChange={(e) => props.setSort(e.target.value as Sort)}>
        <option value="recent">Mais recentes</option>
        <option value="rarity">Mais raras</option>
        <option value="ovr">Maior OVR</option>
      </select>
    </div>
  );
}

function GridView({ copies, onSelect }: { copies: CardCopy[]; onSelect: (c: CardCopy) => void }) {
  const db = useDB();
  const [sort, setSort] = useState<Sort>('recent');
  const [filter, setFilter] = useState<Rarity | 'all'>('all');
  const list = useSorted(copies, sort, filter);
  return (
    <>
      <Filters sort={sort} setSort={setSort} filter={filter} setFilter={setFilter} />
      <div className="card-grid">
        {list.map((c) => {
          const match = db.matches.find((m) => m.id === c.matchId);
          return (
            <div key={c.id} className="card-grid__item">
              <HoloCard card={copyCard(db, c)} onClick={() => onSelect(c)} />
              <span>{match ? shortDate(match.playedAt) : ''}</span>
            </div>
          );
        })}
      </div>
      {!list.length && <p className="empty">Nenhuma carta com esse filtro.</p>}
    </>
  );
}

/* ---------------- Lista ---------------- */

function ListView({ copies, onSelect }: { copies: CardCopy[]; onSelect: (c: CardCopy) => void }) {
  const db = useDB();
  const [sort, setSort] = useState<Sort>('rarity');
  const [filter, setFilter] = useState<Rarity | 'all'>('all');
  const list = useSorted(copies, sort, filter);
  return (
    <>
      <Filters sort={sort} setSort={setSort} filter={filter} setFilter={setFilter} />
      <ul className="card-list">
        {list.map((c) => {
          const player = db.players.find((p) => p.id === c.playerId)!;
          const view = copyCard(db, c);
          const r = effectiveRarity(db, c);
          return (
            <li key={c.id}>
              <button onClick={() => onSelect(c)}>
                <div className="card-list__thumb">
                  <HoloCard card={view} still />
                </div>
                <div className="card-list__name">
                  <b>{player.name}</b>
                  <span>
                    {view.capture ? `${shortDate(view.capture.at)} · ${view.capture.score}` : ''}
                    {c.rookie && ' · Rookie'}
                  </span>
                </div>
                <span className={`rarity-pill rarity-pill--${r}`}>{RARITIES[r].name}</span>
                <b className="card-list__ovr">{overall(c.stats) ?? '?'}</b>
              </button>
            </li>
          );
        })}
      </ul>
      {!list.length && <p className="empty">Nenhuma carta com esse filtro.</p>}
    </>
  );
}

/* ---------------- Vitrine ---------------- */

function VitrineView({ copies, onSelect }: { copies: CardCopy[]; onSelect: (c: CardCopy) => void }) {
  const db = useDB();
  const list = [...copies].sort((a, b) => rank(db, b) - rank(db, a) || b.capturedAt - a.capturedAt);
  return (
    <div className="vitrine">
      {list.map((c) => {
        const player = db.players.find((p) => p.id === c.playerId)!;
        const r = effectiveRarity(db, c);
        return (
          <div key={c.id} className="vitrine__item">
            <div className="vitrine__card">
              <HoloCard card={copyCard(db, c)} onClick={() => onSelect(c)} />
            </div>
            <div className="vitrine__caption">
              <b>{player.name}</b>
              <span className={`rarity-pill rarity-pill--${r}`}>{RARITIES[r].name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
