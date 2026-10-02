import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { HoloCard } from '../components/HoloCard';
import { addComment, confirmMatch, toggleReaction } from '../lib/db';
import { firstName, timeAgo } from '../lib/format';
import { href } from '../lib/route';
import { isComeback, isPneu, liveCard, losers, rarityFor, scoreText, winners } from '../lib/rules';
import { store, useDB } from '../lib/store';
import { RARITIES, REACTIONS, type Match } from '../lib/types';

interface Props {
  match: Match;
  onOpenPack: (packId: string) => void;
  onRate: (playerIds: string[]) => void;
}

export function MatchPost({ match, onOpenPack, onRate }: Props) {
  const db = useDB();
  const me = db.currentUserId;
  const [text, setText] = useState('');

  const player = (id: string) => db.players.find((p) => p.id === id)!;
  const author = player(match.createdBy);
  const won = winners(match);
  const lost = losers(match);
  const reactions = db.reactions.filter((r) => r.matchId === match.id);
  const comments = db.comments.filter((c) => c.matchId === match.id).sort((a, b) => a.createdAt - b.createdAt);
  const myPack = db.packs.find((p) => p.matchId === match.id && p.ownerId === me && !p.openedAt);
  const rarity = rarityFor(db, match);
  const others = [...match.teamA, ...match.teamB].filter((id) => id !== me);

  const pendingFrom = lost.filter((id) => player(id).claimed).map((id) => firstName(player(id).name));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    store.update((d) => addComment(d, match.id, me, text));
    setText('');
  };

  const teamCards = (ids: string[], captured: boolean) => (
    <div className={`board__team${captured ? ' board__team--captured' : ''}`}>
      {ids.map((id) => {
        const p = player(id);
        return (
          <a key={id} className="board__player" href={href({ name: 'player', id })}>
            <div className="board__card">
              <HoloCard card={liveCard(db, p)} still={captured} />
              {captured && <span className="board__stamp">Capturado</span>}
            </div>
            <span>{firstName(p.name)}</span>
          </a>
        );
      })}
    </div>
  );

  return (
    <article className="post">
      <header className="post__header">
        <Avatar player={author} />
        <div className="post__who">
          <p>
            <a href={href({ name: 'player', id: author.id })}>{firstName(author.name)}</a> registrou uma partida
          </p>
          <span>
            {timeAgo(match.playedAt)} · {match.club}
          </span>
        </div>
        <div className="post__tags">
          {isPneu(match) && <span className="tag tag--pneu">🥖 Pneu</span>}
          {isComeback(match) && <span className="tag tag--virada">↺ Virada</span>}
        </div>
      </header>

      <div className="board">
        {teamCards(won, false)}
        <div className="board__score">
          <span className="board__label">Venceram</span>
          <strong>{scoreText(match)}</strong>
          <span className={`rarity-pill rarity-pill--${match.confirmed ? rarity : 'comum'}`}>
            {match.confirmed ? RARITIES[rarity].name : 'Pendente'}
          </span>
        </div>
        {teamCards(lost, true)}
      </div>

      {!match.confirmed && (
        <div className="post__pending">
          {lost.includes(me) ? (
            <>
              <span>Você precisa confirmar essa derrota 😬</span>
              <button className="btn btn--primary btn--small" onClick={() => store.update((d) => confirmMatch(d, match.id))}>
                Confirmo, perdi ✍️
              </button>
            </>
          ) : (
            <span>
              {pendingFrom.length
                ? `Aguardando ${pendingFrom.join(' ou ')} confirmar a derrota. Até lá, as cartas valem como Comum.`
                : 'Adversários ainda não estão no app: as cartas valem como Comum até eles entrarem e confirmarem.'}
            </span>
          )}
        </div>
      )}

      <div className="post__actions">
        <div className="reactions">
          {REACTIONS.map(({ emoji, label }) => {
            const count = reactions.filter((r) => r.emoji === emoji).length;
            const mine = reactions.some((r) => r.emoji === emoji && r.userId === me);
            return (
              <button
                key={emoji}
                title={label}
                className={`reaction${mine ? ' is-active' : ''}${count ? '' : ' is-empty'}`}
                onClick={() => store.update((d) => toggleReaction(d, match.id, me, emoji))}
              >
                {emoji}
                {count > 0 && <b>{count}</b>}
              </button>
            );
          })}
        </div>
        <div className="post__buttons">
          {myPack && (
            <button className="btn btn--primary btn--small btn--glow" onClick={() => onOpenPack(myPack.id)}>
              🎁 Abrir pacote
            </button>
          )}
          <button className="btn btn--ghost btn--small" onClick={() => onRate(others)}>
            Avaliar jogadores
          </button>
        </div>
      </div>

      {comments.length > 0 && (
        <ul className="comments">
          {comments.map((c) => {
            const p = player(c.userId);
            return (
              <li key={c.id}>
                <Avatar player={p} size={28} />
                <div>
                  <p>
                    <b>{firstName(p.name)}</b> {c.text}
                  </p>
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form className="comment-form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Cornetar…" maxLength={200} />
        <button className="btn btn--ghost btn--small" disabled={!text.trim()}>
          Enviar
        </button>
      </form>
    </article>
  );
}
