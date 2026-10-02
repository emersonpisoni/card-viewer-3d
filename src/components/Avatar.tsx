import { href } from '../lib/route';
import { overall, statsFor, tierFor } from '../lib/rules';
import { useDB } from '../lib/store';
import type { Player } from '../lib/types';

interface Props {
  player: Player;
  size?: number;
  /** Wrap in a link to the player's page. */
  link?: boolean;
}

export function Avatar({ player, size = 36, link = true }: Props) {
  const db = useDB();
  const tier = tierFor(overall(statsFor(db, player.id)));
  const body = (
    <span className={`avatar avatar--${tier}`} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {player.photo ? (
        <img src={player.photo} alt="" style={{ objectPosition: `${player.photoX}% ${player.photoY}%` }} />
      ) : (
        player.name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
  return link ? (
    <a href={href({ name: 'player', id: player.id })} title={player.name} className="avatar-link">
      {body}
    </a>
  ) : (
    body
  );
}
