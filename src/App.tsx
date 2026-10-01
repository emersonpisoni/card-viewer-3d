import { useEffect, useState } from 'react';
import { CardEditor } from './components/CardEditor';
import { Gallery } from './components/Gallery';
import { Showcase } from './components/Showcase';
import { loadCards, saveCards } from './lib/storage';
import { newCard, type PlayerCard } from './lib/types';

type View = { name: 'gallery' } | { name: 'editor'; card: PlayerCard };

export default function App() {
  const [cards, setCards] = useState<PlayerCard[]>(loadCards);
  const [view, setView] = useState<View>({ name: 'gallery' });
  const [openId, setOpenId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setStorageError(!saveCards(cards));
  }, [cards]);

  const upsert = (card: PlayerCard) =>
    setCards((list) =>
      list.some((c) => c.id === card.id) ? list.map((c) => (c.id === card.id ? card : c)) : [card, ...list],
    );

  const openCard = cards.find((c) => c.id === openId);

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => setView({ name: 'gallery' })}>
          <span className="logo__ball" />
          PADEL<span>HOLO</span>
        </button>
        <nav>
          <button
            className={`nav-btn${view.name === 'gallery' ? ' is-active' : ''}`}
            onClick={() => setView({ name: 'gallery' })}
          >
            Meus cards
          </button>
          <button className="btn btn--primary" onClick={() => setView({ name: 'editor', card: newCard() })}>
            + Criar card
          </button>
        </nav>
      </header>

      {storageError && (
        <p className="error banner">
          O navegador não tem mais espaço para salvar. Exclua um card ou use fotos menores.
        </p>
      )}

      <main>
        {view.name === 'gallery' ? (
          <Gallery
            cards={cards}
            onOpen={setOpenId}
            onCreate={() => setView({ name: 'editor', card: newCard() })}
            onEdit={(id) => setView({ name: 'editor', card: cards.find((c) => c.id === id)! })}
            onDelete={(id) => setCards((list) => list.filter((c) => c.id !== id))}
          />
        ) : (
          <CardEditor
            key={view.card.id}
            initial={view.card}
            onCancel={() => setView({ name: 'gallery' })}
            onSave={(card) => {
              upsert(card);
              setView({ name: 'gallery' });
              setOpenId(card.id);
            }}
          />
        )}
      </main>

      {openCard && (
        <Showcase
          card={openCard}
          onChangeEffect={(effect) => upsert({ ...openCard, effect })}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}
