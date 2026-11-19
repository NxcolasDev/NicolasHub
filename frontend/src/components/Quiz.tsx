import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, RotateCcw, X } from "lucide-react";
import type { Question } from "../api";
import { skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";

export default function Quiz({ questions, onGenerate, generating }: {
  questions: Question[]; onGenerate?: () => void; generating?: boolean;
}) {
  const [attempt, setAttempt] = useState({ version: 0, questions });
  function restart(next: Question[]) {
    setAttempt((current) => ({ version: current.version + 1, questions: next }));
  }
  return <QuizAttempt key={attempt.version} questions={attempt.questions} onRetryAll={() => restart(questions)}
    onRetryMissed={restart} onGenerate={onGenerate} generating={generating} />;
}

function QuizAttempt({ questions, onRetryAll, onRetryMissed, onGenerate, generating }: {
  questions: Question[]; onRetryAll: () => void; onRetryMissed: (questions: Question[]) => void;
  onGenerate?: () => void; generating?: boolean;
}) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const [position, setPosition] = useState(0);
  const questionLabel = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const focusQuestion = useRef(false);
  const question = questions[position];
  const selected = choices[position];
  const answered = Object.keys(choices).length;
  const correct = questions.filter((item, index) => choices[index] === item.correct_index).length;
  const grade = answered ? correct * 10 / answered : 0;
  const gradeDisplay = grade.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const complete = answered === questions.length;
  const resultSkin = grade === 10 ? skins.perfect : grade < 5 ? skins.low : grade >= 6 ? skins.pass : skins.middle;
  const reaction = grade === 10 ? "Nota 10!" : grade < 5 ? "Revise o raciocínio e tente de novo." : "Confira a explicação e siga praticando.";

  useEffect(() => {
    if (focusQuestion.current) {
      heading.current?.focus();
      focusQuestion.current = false;
    }
  }, [position]);

  function goTo(index: number) {
    if (index === position) return;
    focusQuestion.current = true;
    setPosition(index);
  }

  if (!question) return null;
  return (
    <section className="quiz quiz-deck" aria-label="Simulado interativo">
      <div className="quiz-deck-heading">
        <div className="section-heading"><ClipboardCheck size={22} /><h3>Simulado</h3></div>
        {answered > 0 && <button className="button secondary small" type="button" onClick={() => { setChoices({}); goTo(0); }}><RotateCcw size={14} /> Reiniciar</button>}
      </div>
      <div className="quiz-progress">
        <p aria-live="polite"><strong>{answered}/{questions.length}</strong> respondidas · {correct} {correct === 1 ? "acerto" : "acertos"}</p>
        <progress value={answered} max={questions.length} aria-label="Progresso do simulado" />
      </div>
      {questions.length > 1 && <nav className="quiz-steps" aria-label="Questões do simulado">
        {questions.map((item, index) => {
          const choice = choices[index];
          const status = choice === undefined ? "Pendente" : choice === item.correct_index ? "Correta" : "Incorreta";
          return <button key={index} type="button" aria-current={index === position ? "step" : undefined} aria-label={`Questão ${index + 1} · ${status}`}
            data-status={status} onClick={() => goTo(index)}>{index + 1}</button>;
        })}
      </nav>}
      <article className="quiz-card" aria-labelledby={questionLabel}>
        <p className="quiz-position">Questão {position + 1} de {questions.length}</p>
        <h4 ref={heading} tabIndex={-1} id={questionLabel}>{question.prompt}</h4>
        <div className="quiz-options" role="group" aria-labelledby={questionLabel}>
          {question.options.map((option, index) => {
            const correctOption = selected !== undefined && index === question.correct_index;
            const wrongSelection = index === selected && !correctOption;
            return <button key={index} type="button" aria-disabled={selected !== undefined} aria-pressed={selected === index}
              data-result={correctOption ? "correct" : wrongSelection ? "incorrect" : undefined}
              onClick={() => { if (selected === undefined) setChoices((current) => ({ ...current, [position]: index })); }}>
              <span className="quiz-letter">{String.fromCharCode(65 + index)}</span><span>{option}</span>
              {correctOption && <Check size={19} aria-label="Resposta correta" />}{wrongSelection && <X size={19} aria-label="Resposta incorreta" />}
            </button>;
          })}
        </div>
        {selected !== undefined && <div key={position} className="quiz-response" data-result={selected === question.correct_index ? "correct" : "incorrect"}>
          <div className="quiz-explanation">
            <h5 aria-live="polite">{selected === question.correct_index ? "Resposta correta" : "Resposta incorreta"}</h5>
            <p>{question.explanations[selected]}</p>
            {selected !== question.correct_index && <p><strong>Resposta correta:</strong> {question.options[question.correct_index]}. {question.explanations[question.correct_index]}</p>}
            <details>
              <summary>Ver todas as explicações</summary>
              <ol type="A">{question.explanations.map((explanation, index) => <li key={index}>{explanation}</li>)}</ol>
            </details>
          </div>
          <div className="quiz-reaction">
            <span>{complete ? "Nota final" : "Nota parcial"} · {gradeDisplay}/10</span>
            <AvatarStage skin={resultSkin} dialogue={reaction} />
          </div>
        </div>}
      </article>
      {questions.length > 1 && <div className="quiz-pager">
        <button className="button secondary small" type="button" disabled={position === 0} onClick={() => goTo(position - 1)}><ArrowLeft size={15} /> Anterior</button>
        <button className="button primary small" type="button" disabled={position + 1 === questions.length} onClick={() => goTo(position + 1)}>Próxima <ArrowRight size={15} /></button>
      </div>}
      {complete && <section className="quiz-review" aria-label="Revisão do simulado">
        <h4 className="quiz-complete"><Check size={16} /> Simulado concluído. Nota final {gradeDisplay}/10.</h4>
        <p>{correct} {correct === 1 ? "acerto" : "acertos"} · {answered - correct} {answered - correct === 1 ? "erro" : "erros"}</p>
        <ol>
          {questions.map((item, index) => {
            const choice = choices[index];
            const right = choice === item.correct_index;
            return <li key={index}><details>
              <summary><span className={right ? "case-pass" : "case-fail"}>{right ? "Acerto" : "Erro"}</span> · {item.prompt}</summary>
              <p><strong>Sua resposta:</strong> {item.options[choice]}</p>
              <p><strong>Resposta correta:</strong> {item.options[item.correct_index]}</p>
              <p>{item.explanations[item.correct_index]}</p>
              {!right && <p>{item.explanations[choice]}</p>}
            </details></li>;
          })}
        </ol>
        <div className="actions">
          <button className="button secondary" type="button" onClick={onRetryAll}>Refazer teste completo</button>
          <button className="button secondary" type="button" disabled={correct === questions.length}
            onClick={() => onRetryMissed(questions.filter((item, index) => choices[index] !== item.correct_index))}>Refazer apenas as questões que errei</button>
          {onGenerate && <button className="button primary" type="button" disabled={generating} onClick={onGenerate}>
            {generating ? "Gerando novo simulado…" : "Gerar novo simulado neste tema"}
          </button>}
        </div>
      </section>}
    </section>
  );
}
