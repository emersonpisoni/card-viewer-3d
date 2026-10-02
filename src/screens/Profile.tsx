import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { HoloCard } from '../components/HoloCard';
import { Showcase } from '../components/Showcase';
import { firstName, shortDate } from '../lib/format';
import { href } from '../lib/route';
import { liveCard, losers, overall, ratingsFor, scoreText, statsFor, winners } from '../lib/rules';
import { useDB } from '../lib/store';
import { STAT_KEYS, STAT_LABELS } from '../lib/types';

interface Props {
  playerId: string;
  onEdit: () => void;
  onRate: (ids: string[]) => void;
}

export function Profile({ playerId, onEdit, onRate }: Props) {
  const db = useDB();
  const [showcase, setShowcase] = useState(false);
  const [copied, setCopied] = useState(false);
  const player = db.players.find((p) => p.id === playerId);
  if (!player) return <p className="empty">Jogador não encontrado.</p>;

  const me = db.currentUserId;
  const isMe = player.id === me;
  const name = firstName(player.name);
  const card = liveCard(db, player);
  const stats = statsFor(db, player.id);
  const ratingCount = ratingsFor(db, player.id).length;
  const openedPacks = new Set(db.packs.filter((p) => p.openedAt).flatMap((p) => p.copyIds));

  // Who holds copies of this player's card.
  const holders = new Map<string, number>();
  for (const c of db.copies) {
    if (c.playerId === player.id && openedPacks.has(c.id)) holders.set(c.ownerId, (holders.get(c.ownerId) ?? 0) + 1);
  }
  const holderList = [...holders.entries()].sort((a, b) => b[1] - a[1]);
  const owned = db.copies.filter((c) => c.ownerId === player.id && openedPacks.has(c.id));

  const visible = db.copies.filter((c) => openedPacks.has(c.id));
  const theirsWithMe = visible.filter((c) => c.ownerId === me && c.playerId === player.id).length;
  const mineWithThem = visible.filter((c) => c.ownerId === player.id && c.playerId === me).length;

  const matches = db.matches
    .filter((m) => [...m.teamA, ...m.teamB].includes(player.id))
    .sort((a, b) => b.playedAt - a.playedAt);
  const wins = matches.filter((m) => winners(m).includes(player.id)).length;

  const copyInvite = async () => {
    const text = `Você foi capturado no Padel Holo 😈 Entre para ver sua carta e pedir revanche: ${location.origin}/#/jogador/${player.id}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copie o convite:', text);
    }
  };

  return (
    <div className="profile">
      <div className="profile__card">
        <HoloCard card={card} onClick={() => setShowcase(true)} />
      </div>

      <div className="profile__info">
        <header className="profile__header">
          <h1>{player.name}</h1>
          {player.nickname && <p className="profile__nick">“{player.nickname}”</p>}
          <p className="profile__meta">
            {[player.club, player.city].filter(Boolean).join(' · ')}
            {!player.claimed && ' · ainda não entrou no app'}
          </p>
          <div className="profile__buttons">
            {isMe ? (
              <button className="btn btn--ghost" onClick={onEdit}>
                Editar perfil
              </button>
            ) : (
              <button className="btn btn--primary" onClick={() => onRate([player.id])}>
                Avaliar {name}
              </button>
            )}
            {!player.claimed && (
              <button className="btn btn--ghost" onClick={copyInvite}>
                {copied ? 'Convite copiado ✓' : 'Copiar convite'}
              </button>
            )}
          </div>
        </header>

        <div className="profile__numbers">
          <div>
            <b>{matches.length}</b>
            <span>partidas</span>
          </div>
          <div>
            <b>{wins}</b>
            <span>vitórias</span>
          </div>
          <div>
            <b>{owned.length}</b>
            <span>cartas capturadas</span>
          </div>
          <div>
            <b>{ratingCount}</b>
            <span>avaliações</span>
          </div>
        </div>

        {!isMe && (theirsWithMe > 0 || mineWithThem > 0) && (
          <div className="rivalry">
            <div>
              <b>{theirsWithMe}</b>
              <span>cartas de {name} com você</span>
            </div>
            <span className="rivalry__vs">VS</span>
            <div>
              <b>{mineWithThem}</b>
              <span>cartas suas com {name}</span>
            </div>
            {mineWithThem >= 3 && mineWithThem > theirsWithMe && <p className="rivalry__tag">🐔 Você é freguês de {name}</p>}
            {theirsWithMe >= 3 && theirsWithMe > mineWithThem && <p className="rivalry__tag">😈 {name} é seu freguês</p>}
          </div>
        )}

        <section className="panel">
          <h3>
            Atributos <span className="ovr-pill">OVR {overall(stats) ?? '—'}</span>
          </h3>
          {stats ? (
            <>
              <ul className="stat-bars">
                {STAT_KEYS.map((k) => (
                  <li key={k}>
                    <span>{STAT_LABELS[k].long}</span>
                    <div className="stat-bars__track">
                      <div style={{ width: `${stats[k]}%` }} />
                    </div>
                    <b>{stats[k]}</b>
                  </li>
                ))}
              </ul>
              <p className="hint hint--left">
                Média de {ratingCount} {ratingCount === 1 ? 'avaliação' : 'avaliações'} de outros jogadores.
              </p>
            </>
          ) : (
            <p className="hint hint--left">
              {isMe
                ? 'Ninguém te avaliou ainda. Chama a galera!'
                : `Ninguém avaliou ${name} ainda. Seja o primeiro.`}
            </p>
          )}
        </section>

        <section className="panel">
          <h3>Quem tem cartas {isMe ? 'suas' : `de ${name}`}</h3>
          {holderList.length ? (
            <ul className="holders">
              {holderList.map(([ownerId, count]) => {
                const owner = db.players.find((p) => p.id === ownerId)!;
                return (
                  <li key={ownerId}>
                    <Avatar player={owner} size={32} />
                    <a href={href({ name: 'player', id: ownerId })}>{firstName(owner.name)}</a>
                    <b>×{count}</b>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hint hint--left">Ninguém capturou ainda. Invicto!</p>
          )}
        </section>

        <section className="panel">
          <h3>Partidas</h3>
          {matches.length ? (
            <ul className="history">
              {matches.slice(0, 8).map((m) => {
                const won = winners(m).includes(player.id);
                const rivals = (won ? losers(m) : winners(m))
                  .map((id) => firstName(db.players.find((p) => p.id === id)!.name))
                  .join(' e ');
                return (
                  <li key={m.id}>
                    <span className={`history__result history__result--${won ? 'win' : 'loss'}`}>{won ? 'V' : 'D'}</span>
                    <span>vs {rivals}</span>
                    <b>{scoreText(m)}</b>
                    <time>{shortDate(m.playedAt)}</time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hint hint--left">Nenhuma partida registrada.</p>
          )}
        </section>
      </div>

      {showcase && <Showcase card={card} onClose={() => setShowcase(false)} />}
    </div>
  );
}
