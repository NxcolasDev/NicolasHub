import { useState } from "react";
import type { FormEvent } from "react";
import { Bot } from "lucide-react";
import { askAssistant } from "../api";

export default function LogicLab({ token, onSignIn }: { token: string; onSignIn: () => void }) {
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendQuestion(event: FormEvent) {
    event.preventDefault();
    if (!token || !question.trim() || busy) return;
    const prompt = question.trim();
    setError("");
    setBusy(true);
    setTranscript((current) => [...current, { role: "Você", text: prompt }]);
    setQuestion("");
    try {
      const response = await askAssistant(prompt, token);
      setTranscript((current) => [...current, { role: "Nicolas Hub IA", text: response.answer }]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "O assistente está indisponível.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel page-section lab">
      <div className="section-heading"><Bot size={22} /><h2>Assistente de estudos</h2></div>
      <p className="muted">Faça perguntas sobre Python, SQL, infraestrutura ou serviços em nuvem.</p>
      {!token ? (
        <button type="button" className="button primary" onClick={onSignIn}>Entrar para conversar</button>
      ) : (
        <form className="input-row" onSubmit={sendQuestion}>
          <input aria-label="Pergunta para o assistente" value={question} maxLength={4000} onChange={(event) => setQuestion(event.target.value)} required />
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar"}</button>
        </form>
      )}
      {token && transcript.length > 0 && (
        <div className="transcript" aria-live="polite">
          {transcript.map((message, index) => (
            <article key={index}><strong>{message.role}</strong><p>{message.text}</p></article>
          ))}
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
