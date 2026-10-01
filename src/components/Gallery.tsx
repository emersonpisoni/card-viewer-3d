import { HoloCard } from './HoloCard';
import type { PlayerCard } from '../lib/types';

interface Props {
  cards: PlayerCard[];
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function Gallery({ cards, onOpen, onEdit, onDelete, onCreate }: Props) {
  if (!cards.length) {
    return (
      <div className="empty">
        <h2>Nenhum card ainda</h2>
        <p>Crie o seu card de jogador com foto, atributos e efeito holográfico.</p>
        <button className="btn btn--primary" onClick={onCreate}>
          Criar meu card
        </button>
      </div>
    );
  }

  return (
    <div className="gallery">
      {cards.map((card) => (
        <div className="gallery__item" key={card.id}>
          <HoloCard card={card} onClick={() => onOpen(card.id)} />
          <div className="gallery__actions">
            <button className="link" onClick={() => onEdit(card.id)}>
              Editar
            </button>
            <button
              className="link link--danger"
              onClick={() => confirm(`Excluir o card de ${card.name}?`) && onDelete(card.id)}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
