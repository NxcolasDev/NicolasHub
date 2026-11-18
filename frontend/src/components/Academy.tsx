import { useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, Box, Cloud, Database, GraduationCap, Layers, Network, RotateCcw, Shield, Sparkles, Terminal } from "lucide-react";
import { getStudyMaterial } from "../api";
import type { Question, StudyMaterial, Topic } from "../api";
import { tracks } from "../data/tracks";
import LogicLab from "./LogicLab";
import { Diagram } from "./Portfolio";

const topicIcons = { cloud: Cloud, data: Layers, docker: Box, databases: Database, network: Network, security: Shield, college: GraduationCap };
export type AcademyView = "tracks" | "college" | "terminal" | "assistant";

function Quiz({ questions }: { questions: Question[] }) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const answered = Object.keys(choices).length;
  const correct = questions.filter((question, index) => choices[index] === question.correct_index).length;
  return (
    <section className="quiz" aria-label="Simulado interativo">
      <div className="quiz-heading">
        <h3>Simulado</h3>
        <p aria-live="polite">{answered}/{questions.length} respondidas · {correct} acerto{correct !== 1 ? "s" : ""}</p>
        {answered > 0 && <button className="button secondary small" onClick={() => setChoices({})} type="button"><RotateCcw size={14} /> Reiniciar</button>}
      </div>
      {questions.map((question, index) => {
        const selected = choices[index];
        return (
          <fieldset className="question" key={index}>
            <legend><span>{index + 1}.</span> {question.prompt}</legend>
            <div className="options">
              {question.options.map((option, optionIndex) => (
                <button
                  type="button"
                  key={option}
                  disabled={selected !== undefined}
                  onClick={() => setChoices((current) => ({ ...current, [index]: optionIndex }))}
                  className={selected === undefined ? "" : optionIndex === question.correct_index ? "correct" : selected === optionIndex ? "incorrect" : ""}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                </button>
              ))}
            </div>
            {selected !== undefined && (
              <div className="answer-feedback" aria-live="polite">
                <strong>{selected === question.correct_index ? "Resposta correta" : "Resposta incorreta"}</strong>
                <p>{question.explanations[selected]}</p>
                {selected !== question.correct_index && <p><strong>Resposta correta:</strong> {question.options[question.correct_index]}. {question.explanations[question.correct_index]}</p>}
                <details>
                  <summary>Ver todas as explicações</summary>
                  <ol type="A">{question.explanations.map((explanation, letter) => <li key={letter}>{explanation}</li>)}</ol>
                </details>
              </div>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}

function StudyTrack({ topic, token, onSignIn }: { topic: Topic; token: string; onSignIn: () => void }) {
  const track = tracks.find((item) => item.id === topic)!;
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(5);
  const [material, setMaterial] = useState<{ version: number; result: StudyMaterial } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!token || busy) return;
    setError("");
    setBusy(true);
    try {
      const result = await getStudyMaterial(topic, notes, count, token);
      setMaterial((current) => ({ version: (current?.version ?? 0) + 1, result }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível gerar a revisão.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel page-section">
      <div className="section-heading"><BookOpen size={22} /><h2>{track.title}</h2></div>
      <p className="muted">{track.description}</p>
      <Quiz questions={[track.question]} />
      {topic === "network" && <div className="diagram"><h3>Diagrama de arquitetura VPC</h3><Diagram /></div>}
      <div className="generator">
        <div className="section-heading"><Sparkles size={22} /><h3>Gerar material com Gemini</h3></div>
        <form onSubmit={generate}>
          <label htmlFor="notes">{topic === "college" ? "Cole suas anotações ou o conteúdo da prova" : "Tópicos e anotações adicionais (opcional)"}</label>
          <textarea id="notes" placeholder={topic === "college" ? "Ex.: anotações sobre Spark, arquitetura em camadas ou React." : "Ex.: diferenças entre Pub/Sub e SQS para processamento assíncrono."} value={notes} maxLength={14000} rows={4} onChange={(event) => setNotes(event.target.value)} />
          <div className="actions form-actions">
            <label>Questões <select value={count} onChange={(event) => setCount(Number(event.target.value))}>{[3, 4, 5, 6, 7, 8].map((quantity) => <option key={quantity}>{quantity}</option>)}</select></label>
            {token
              ? <button className="button primary" type="submit" disabled={busy}><Sparkles size={16} /> {busy ? "Gerando revisão…" : "Gerar revisão"}</button>
              : <button className="button primary" type="button" onClick={onSignIn}>Entrar para gerar</button>}
          </div>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      {material && (
        <div className="generated-study" aria-live="polite">
          <h3>Resumo de revisão</h3>
          <p className="multiline">{material.result.summary}</p>
          <h3>Flashcards</h3>
          <div className="card-grid">{material.result.flashcards.map((card, index) => (
            <details className="flashcard" key={`${material.version}-${index}`}>
              <summary>{card.front}</summary>
              <p>{card.back}</p>
            </details>
          ))}</div>
          <Quiz key={material.version} questions={material.result.questions} />
        </div>
      )}
    </section>
  );
}

export default function Academy({ view, token, onSignIn }: { view: AcademyView; token: string; onSignIn: () => void }) {
  const [topic, setTopic] = useState<Topic>("cloud");
  return (
    <>
      <section className="page-intro">
        <div className="eyebrow"><Cloud size={17} /> Preparação técnica</div>
        <h1>Academia Cloud, Arquitetura e Dados</h1>
        <p>Prepare-se para a Job Fair Google Cloud de 02/12/2026 e revise conteúdos da faculdade.</p>
      </section>
      <nav className="section-nav" aria-label="Ferramentas da academia">
        <a className={view === "tracks" ? "selected" : ""} href="#academia"><Cloud size={17} /> Trilhas Cloud</a>
        <a className={view === "college" ? "selected" : ""} href="#provas"><GraduationCap size={17} /> Provas da Faculdade</a>
        <a className={view === "terminal" ? "selected" : ""} href="#terminal"><Terminal size={17} /> Treino de lógica</a>
        <a className={view === "assistant" ? "selected" : ""} href="#assistente"><Sparkles size={17} /> Assistente</a>
      </nav>
      {view === "tracks" && (
        <div className="track-grid" aria-label="Trilhas de estudo">
          {tracks.filter((track) => track.id !== "college").map((track) => {
            const Icon = topicIcons[track.id];
            return (
              <button className={topic === track.id ? "track active" : "track"} key={track.id} type="button" aria-pressed={topic === track.id} onClick={() => setTopic(track.id)}>
                <Icon size={22} /><strong>{track.title}</strong><span>{track.description}</span>
              </button>
            );
          })}
        </div>
      )}
      {view === "tracks" && <StudyTrack key={topic} topic={topic} token={token} onSignIn={onSignIn} />}
      {view === "college" && <StudyTrack key="college" topic="college" token={token} onSignIn={onSignIn} />}
      {(view === "terminal" || view === "assistant") && <LogicLab key={view} tool={view} token={token} onSignIn={onSignIn} />}
    </>
  );
}
