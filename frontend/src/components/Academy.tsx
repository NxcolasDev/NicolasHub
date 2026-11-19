import { lazy, Suspense, useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, Box, Cloud, Database, GraduationCap, Layers, Network, Shield, Sparkles, Terminal } from "lucide-react";
import { getStudyMaterial } from "../api";
import { referenceLinks } from "../config/profileLinks";
import type { StudyMaterial, Topic } from "../api";
import { tracks } from "../data/tracks";
import { academyTrackSkins, importantImage, skins } from "../data/sprites";
import LogicLab from "./LogicLab";
import { Diagram } from "./Portfolio";
import { AvatarStage } from "./PixelAvatar";
import FlashcardReview from "./FlashcardReview";
import Quiz from "./Quiz";

const CodingGym = lazy(() => import("./CodingGym"));
const universityLogo = importantImage("unifaat.png");

const topicIcons = { cloud: Cloud, data: Layers, docker: Box, databases: Database, network: Network, security: Shield, college: GraduationCap };
export type AcademyView = "tracks" | "databases" | "college" | "terminal" | "assistant";

function StudyTrack({ topic, token, onSignIn }: { topic: Topic; token: string; onSignIn: () => void }) {
  const track = tracks.find((item) => item.id === topic)!;
  const visualTopics = topic === "cloud" ? ["cloud", "aws", "gcp"] as const : [topic];
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(25);
  const [material, setMaterial] = useState<{ version: number; result: StudyMaterial; notes: string; count: number; history: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryError, setRetryError] = useState("");
  const [reading, setReading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  async function importPdf(file: File) {
    setPdfMessage("");
    setError("");
    const existing = notes.trim();
    const budget = 14000 - existing.length - (existing ? 2 : 0);
    if (budget < 1) { setError("Reduza as anotações para liberar espaço para o PDF."); return; }
    setReading(true);
    try {
      const { readPdf } = await import("../data/readPdf");
      const { text, truncated } = await readPdf(file, budget);
      setNotes(existing ? `${existing}\n\n${text}` : text);
      setPdfMessage(`${file.name} incorporado às anotações.${truncated ? " A extração foi limitada a 120 páginas e ao espaço restante no campo." : ""}`);
    } catch (failure) {
      setError(failure instanceof Error && /PDF/.test(failure.message)
        ? failure.message : "Não foi possível ler o PDF. Verifique se o arquivo está íntegro e sem senha.");
    } finally { setReading(false); }
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    await requestMaterial(notes, count);
  }

  async function requestMaterial(source: string, quantity: number, history: string[] = []) {
    if (!token) { onSignIn(); return; }
    if (busy || reading) return;
    if (topic === "college" && !source.trim()) { setError("Cole suas anotações ou adicione um PDF com texto."); return; }
    setError("");
    setRetryError("");
    setBusy(true);
    try {
      const result = await getStudyMaterial(topic, source, quantity, token, history);
      setMaterial((current) => ({
        version: (current?.version ?? 0) + 1, result, notes: source, count: quantity,
        history: [...history, ...result.questions.map((question) => question.prompt)].slice(-60),
      }));
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Não foi possível gerar a revisão.";
      if (history.length) setRetryError(message);
      else setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel page-section">
      <div className="section-heading"><BookOpen size={22} /><h2>{track.title}</h2></div>
      <p className="muted">{track.description}</p>
      {topic === "data" && <a className="feature-link" href={referenceLinks.bigData} target="_blank" rel="noopener noreferrer">Exercícios de Big Data no GitHub</a>}
      {topic !== "college" && visualTopics.map((key) => {
        const visual = academyTrackSkins[key];
        return visual && <div className="study-avatar" key={key}><AvatarStage skin={visual.skin} dialogue={visual.dialogue} /></div>;
      })}
      <Quiz questions={[track.question]} />
      {topic === "network" && <div className="diagram"><h3>Diagrama de arquitetura VPC</h3><Diagram /></div>}
      <div className="generator">
        <div className="section-heading"><Sparkles size={22} /><h3>Gerar material com Gemini</h3></div>
        <form onSubmit={generate}>
          <label htmlFor="notes">{topic === "college" ? "Cole suas anotações ou o conteúdo da prova" : "Tópicos e anotações adicionais (opcional)"}</label>
          <textarea id="notes" placeholder={topic === "college" ? "Ex.: anotações sobre Spark, arquitetura em camadas ou React." : "Ex.: diferenças entre Pub/Sub e SQS para processamento assíncrono."} value={notes} maxLength={14000} rows={4} onChange={(event) => setNotes(event.target.value)} disabled={reading} />
          {topic === "college" && <>
            <label htmlFor="study-pdf">Adicionar PDF com texto (até 15 MB)</label>
            <input id="study-pdf" type="file" accept=".pdf,application/pdf" disabled={reading || busy} onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (file) void importPdf(file);
            }} />
            {reading ? <p role="status">Extraindo texto no navegador…</p> : pdfMessage && <p role="status">{pdfMessage}</p>}
          </>}
          <div className="actions form-actions">
            <label>Questões <select value={count} onChange={(event) => setCount(Number(event.target.value))}>{[15, 25, 30].map((quantity) => <option key={quantity}>{quantity}</option>)}</select></label>
            {token
              ? <button className="button primary" type="submit" disabled={busy || reading}><Sparkles size={16} /> {busy ? "Gerando revisão…" : "Gerar simulado e flashcards"}</button>
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
          <FlashcardReview key={material.version} cards={material.result.flashcards} />
          <Quiz key={material.version} questions={material.result.questions} generating={busy}
            onGenerate={() => void requestMaterial(material.notes, material.count, material.history)} />
          {retryError && <p className="error" role="alert">{retryError}</p>}
        </div>
      )}
    </section>
  );
}

export default function Academy({ view, token, onSignIn }: { view: AcademyView; token: string; onSignIn: () => void }) {
  const [topic, setTopic] = useState<Topic>("cloud");
  const showTracks = view === "tracks" || view === "databases";
  const activeTopic = view === "databases" ? "databases" : topic;
  const collegeVisual = academyTrackSkins.college;
  const assistantVisual = academyTrackSkins.ai;
  return (
    <div className="academy-page">
      <section className="workspace-hero academy-hero">
        <div>
          <div className="eyebrow"><Cloud size={17} /> Preparação técnica</div>
          <h1>Academia Cloud, Arquitetura e Dados</h1>
          <p>Prepare-se para a Job Fair Google Cloud de 02/12/2026 e revise conteúdos da faculdade.</p>
          <div className="provider-marks">
            <img src={importantImage("aws.png")} alt="AWS" />
            <img src={importantImage("gcp.png")} alt="Google Cloud" />
          </div>
        </div>
        <AvatarStage skin={view === "terminal" ? skins.laptop : skins.workout}
          dialogue={view === "terminal" ? "Escreva sua solução e rode os testes." : "Uma repetição de cada vez."} priority />
      </section>
      <nav className="section-nav" aria-label="Ferramentas da academia">
        <a className={showTracks ? "selected" : ""} href="#academia"><Cloud size={17} /> Trilhas Cloud</a>
        <a className={view === "college" ? "selected" : ""} href="#provas"><GraduationCap size={17} /> Provas da Faculdade</a>
        <a className={view === "terminal" ? "selected" : ""} href="#terminal"><Terminal size={17} /> Coding Gym</a>
        <a className={view === "assistant" ? "selected" : ""} href="#assistente"><Sparkles size={17} /> Assistente</a>
      </nav>
      {showTracks && (
        <div className="track-grid" aria-label="Trilhas de estudo">
          {tracks.filter((track) => track.id !== "college").map((track) => {
            const Icon = topicIcons[track.id];
            return (
              <button className={activeTopic === track.id ? "track active" : "track"} key={track.id} type="button" aria-pressed={activeTopic === track.id} onClick={() => {
                setTopic(track.id);
                if (view === "databases") window.location.hash = "academia";
              }}>
                <Icon size={22} /><strong>{track.title}</strong><span>{track.description}</span>
              </button>
            );
          })}
        </div>
      )}
      {showTracks && <StudyTrack key={activeTopic} topic={activeTopic} token={token} onSignIn={onSignIn} />}
      {view === "college" && <>
        <div className="academic-banner">
          {collegeVisual && <AvatarStage skin={collegeVisual.skin} dialogue={collegeVisual.dialogue} />}
          <img className="university-logo" src={universityLogo} alt="UniFAAT" />
        </div>
        <StudyTrack key="college" topic="college" token={token} onSignIn={onSignIn} />
      </>}
      {view === "terminal" && <Suspense fallback={<p role="status">Carregando editor…</p>}><CodingGym token={token} onSignIn={onSignIn} /></Suspense>}
      {view === "assistant" && <>
        {assistantVisual && <div className="study-avatar"><AvatarStage skin={assistantVisual.skin} dialogue={assistantVisual.dialogue} /></div>}
        <LogicLab token={token} onSignIn={onSignIn} />
      </>}
    </div>
  );
}
