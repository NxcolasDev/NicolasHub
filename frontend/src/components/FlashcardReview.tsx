import { useRef, useState } from "react";
import { Check, Layers, RotateCcw, X } from "lucide-react";
import type { StudyMaterial } from "../api";

export default function FlashcardReview({ cards }: { cards: StudyMaterial["flashcards"] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const flipButton = useRef<HTMLButtonElement>(null);
  const summary = useRef<HTMLHeadingElement>(null);
  const [deck, setDeck] = useState(cards);
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [review, setReview] = useState<StudyMaterial["flashcards"]>([]);
  const card = deck[position];
  const hits = deck.length - review.length;

  function rate(correct: boolean) {
    if (!card) return;
    if (!correct) setReview((current) => [...current, card]);
    setPosition(position + 1);
    setFlipped(false);
    requestAnimationFrame(() => (position + 1 < deck.length ? flipButton.current : summary.current)?.focus());
  }

  function restart(next: StudyMaterial["flashcards"]) {
    setDeck(next);
    setPosition(0);
    setReview([]);
    setFlipped(false);
    requestAnimationFrame(() => flipButton.current?.focus());
  }

  if (cards.length === 0) return null;
  return (
    <div className="flashcard-launch">
      <button type="button" className="button primary" onClick={() => dialog.current?.showModal()}><Layers size={17} /> Abrir {cards.length} flashcards</button>
      <dialog className="showcase-dialog flashcard-dialog" ref={dialog} aria-labelledby="flashcard-title">
        <div className="dialog-heading">
          <h2 id="flashcard-title">Revisão com flashcards</h2>
          <button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button>
        </div>
        <div className="flashcard-progress" aria-live="polite">
          <span>{card ? `Cartão ${position + 1} de ${deck.length}` : `${deck.length} de ${deck.length} revisados`}</span>
          <progress value={position} max={deck.length} aria-label="Progresso da revisão" />
        </div>
        {card ? <>
          <button key={position} type="button" ref={flipButton} className="flip-card" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>
            <span className="flip-inner">
              <span className="flip-face flip-front" aria-hidden={flipped}><small>Pergunta</small>{card.front}<small>Virar para ver a resposta</small></span>
              <span className="flip-face flip-back" aria-hidden={!flipped}><small>Resposta</small>{card.back}<small>Virar para ver a pergunta</small></span>
            </span>
          </button>
          <div className="actions flashcard-actions">
            <button className="button primary" type="button" onClick={() => rate(true)} disabled={!flipped}><Check size={17} /> Acertei</button>
            <button className="button secondary" type="button" onClick={() => rate(false)} disabled={!flipped}><RotateCcw size={17} /> Revisar</button>
          </div>
        </> : <div className="flashcard-summary">
          <h3 tabIndex={-1} ref={summary}>Revisão concluída</h3>
          <p>{hits} {hits === 1 ? "acerto" : "acertos"} · {review.length} para revisar</p>
          <div className="actions">
            {review.length > 0 && <button className="button primary" type="button" onClick={() => restart(review)}>Revisar pendentes</button>}
            <button className="button secondary" type="button" onClick={() => restart(cards)}>Reiniciar revisão</button>
          </div>
        </div>}
      </dialog>
    </div>
  );
}
