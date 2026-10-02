import { useEffect, useState } from 'react';
import { Avatar } from './components/Avatar';
import { EditProfile } from './components/EditProfile';
import { PackOpening } from './components/PackOpening';
import { RateModal } from './components/RateModal';
import { RegisterMatch } from './components/RegisterMatch';
import { firstName } from './lib/format';
import { href, navigate, useRoute } from './lib/route';
import { winners } from './lib/rules';
import { store, useDB, useMe } from './lib/store';
import type { Match } from './lib/types';
import { Collection } from './screens/Collection';
import { Feed } from './screens/Feed';
import { Profile } from './screens/Profile';

type Overlay =
  | { name: 'register' }
  | { name: 'pack'; packId: string }
  | { name: 'rate'; playerIds: string[] }
  | { name: 'edit' }
  | null;

export default function App() {
  const db = useDB();
  const me = useMe();
  const route = useRoute();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState('');

  const unopened = db.packs.filter((p) => p.ownerId === me.id && !p.openedAt);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const close = () => setOverlay(null);

  const onRecorded = (match: Match) => {
    if (winners(match).includes(me.id)) {
      const pack = store.get().packs.find((p) => p.matchId === match.id && p.ownerId === me.id);
      setOverlay(pack ? { name: 'pack', packId: pack.id } : null);
    } else {
      const names = winners(match).map((id) => firstName(store.get().players.find((p) => p.id === id)!.name));
      setOverlay(null);
      setToast(`${names.join(' e ')} capturaram sua carta 😅`);
    }
    navigate({ name: 'feed' });
  };

  const tabs = [
    { route: { name: 'feed' } as const, label: 'Resenha', icon: '💬' },
    { route: { name: 'collection' } as const, label: 'Coleção', icon: '📖' },
    { route: { name: 'player', id: me.id } as const, label: 'Perfil', icon: '👤' },
  ];
  const isActive = (t: (typeof tabs)[number]) =>
    t.route.name === route.name && (t.route.name !== 'player' || (route.name === 'player' && route.id === me.id));

  return (
    <div className="app">
      <header className="topbar">
        <a className="logo" href={href({ name: 'feed' })}>
          <span className="logo__ball" />
          PADEL<span>HOLO</span>
        </a>
        <nav className="topbar__tabs">
          {tabs.map((t) => (
            <a key={t.label} href={href(t.route)} className={`nav-btn${isActive(t) ? ' is-active' : ''}`}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="topbar__right">
          {unopened.length > 0 && (
            <button className="pack-btn" onClick={() => setOverlay({ name: 'pack', packId: unopened[0].id })}>
              🎁 <span>{unopened.length}</span>
            </button>
          )}
          <button className="btn btn--primary topbar__register" onClick={() => setOverlay({ name: 'register' })}>
            + Partida
          </button>
          <a href={href({ name: 'player', id: me.id })} className="topbar__me">
            <Avatar player={me} size={34} link={false} />
          </a>
        </div>
      </header>

      <div className="demo-bar">
        <span>Modo demo · entrar como</span>
        <select value={me.id} onChange={(e) => store.update((d) => ({ ...d, currentUserId: e.target.value }))}>
          {db.players
            .filter((p) => p.claimed)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <button
          className="link"
          onClick={() => confirm('Voltar os dados de demonstração ao início?') && store.reset()}
        >
          Resetar demo
        </button>
      </div>

      <main>
        {route.name === 'feed' && (
          <Feed
            onRegister={() => setOverlay({ name: 'register' })}
            onOpenPack={(packId) => setOverlay({ name: 'pack', packId })}
            onRate={(playerIds) => setOverlay({ name: 'rate', playerIds })}
          />
        )}
        {route.name === 'collection' && <Collection />}
        {route.name === 'player' && (
          <Profile
            key={route.id}
            playerId={route.id}
            onEdit={() => setOverlay({ name: 'edit' })}
            onRate={(playerIds) => setOverlay({ name: 'rate', playerIds })}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {tabs.slice(0, 2).map((t) => (
          <a key={t.label} href={href(t.route)} className={isActive(t) ? 'is-active' : ''}>
            <span>{t.icon}</span>
            {t.label}
          </a>
        ))}
        <button className="bottom-nav__add" onClick={() => setOverlay({ name: 'register' })} aria-label="Registrar partida">
          +
        </button>
        <button
          className={unopened.length ? 'has-packs' : ''}
          onClick={() => unopened.length && setOverlay({ name: 'pack', packId: unopened[0].id })}
          disabled={!unopened.length}
        >
          <span>🎁</span>
          Pacotes{unopened.length > 0 && <b>{unopened.length}</b>}
        </button>
        <a href={href(tabs[2].route)} className={isActive(tabs[2]) ? 'is-active' : ''}>
          <span>{tabs[2].icon}</span>
          Perfil
        </a>
      </nav>

      {overlay?.name === 'register' && <RegisterMatch onClose={close} onRecorded={onRecorded} />}
      {overlay?.name === 'pack' && (
        <PackOpening
          key={overlay.packId}
          packId={overlay.packId}
          onClose={close}
          onViewCollection={() => {
            close();
            navigate({ name: 'collection' });
          }}
        />
      )}
      {overlay?.name === 'rate' && <RateModal playerIds={overlay.playerIds} onClose={close} />}
      {overlay?.name === 'edit' && <EditProfile onClose={close} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
