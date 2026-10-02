import { MatchPost } from './MatchPost';
import { firstName } from '../lib/format';
import { useDB, useMe } from '../lib/store';

interface Props {
  onRegister: () => void;
  onOpenPack: (packId: string) => void;
  onRate: (playerIds: string[]) => void;
}

export function Feed({ onRegister, onOpenPack, onRate }: Props) {
  const db = useDB();
  const me = useMe();
  const matches = [...db.matches].sort((a, b) => b.playedAt - a.playedAt);

  return (
    <div className="feed">
      <section className="feed__intro">
        <div>
          <h1>Resenha</h1>
          <p>Ganhou? Registra e captura as cartas da dupla adversária.</p>
        </div>
        <button className="btn btn--primary" onClick={onRegister}>
          + Registrar partida
        </button>
      </section>

      {matches.length === 0 && (
        <p className="empty">Nenhuma partida ainda, {firstName(me.name)}. Registre a primeira!</p>
      )}

      {matches.map((m) => (
        <MatchPost key={m.id} match={m} onOpenPack={onOpenPack} onRate={onRate} />
      ))}
    </div>
  );
}
