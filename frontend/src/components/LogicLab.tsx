import { useState } from "react";
import type { FormEvent } from "react";
import { Bot, Play, Terminal } from "lucide-react";
import { askAssistant, runLogic } from "../api";

const example = "average 10,20,30,40 --window 2";
const logs = [
  { severity: "INFO", error_code: "INF_01" },
  { severity: "ERROR", error_code: "ERR_DATABASE_TIMEOUT" },
  { severity: "CRITICAL", error_code: "ERR_AUTH_FAILURE" },
];

export default function LogicLab({
  tool,
  token,
  onSignIn,
}: {
  tool: "terminal" | "assistant";
  token: string;
  onSignIn: () => void;
}) {
  const [command, setCommand] = useState(example);
  const [output, setOutput] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function runCommand(event: FormEvent) {
    event.preventDefault();
    setError("");
    const text = command.trim();
    if (!text || busy) return;
    if (text === "help") {
      setOutput([example, "scan-logs"]);
      return;
    }
    const match = text.match(/^average\s+(.+?)\s+--window\s+(\d+)$/);
    if (text !== "scan-logs" && !match) {
      setError(`Use ${example} ou scan-logs.`);
      return;
    }
    setBusy(true);
    try {
      const values = match?.[1].split(",") ?? [];
      const scores = values.map((value) => Number(value.trim()));
      if (values.some((value) => !value.trim()) || scores.some((score) => !Number.isFinite(score))) {
        throw new Error("Informe somente números separados por vírgula.");
      }
      const result = match
        ? await runLogic({ task: "rolling_average", scores, window_size: Number(match[2]) })
        : await runLogic({ task: "critical_logs", logs });
      setOutput([`nicolas-hub $ ${text}`, JSON.stringify(result.result), result.explanation]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível executar o exercício.");
    } finally {
      setBusy(false);
    }
  }

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
      {tool === "terminal" ? (
        <>
          <div className="section-heading"><Terminal size={22} /><h2>Treino de lógica</h2></div>
          <p className="muted">Calcule médias móveis e encontre códigos críticos em logs pelo terminal.</p>
          <div className="actions">
            <button type="button" className="button secondary" onClick={() => setCommand(example)}>Média móvel</button>
            <button type="button" className="button secondary" onClick={() => setCommand("scan-logs")}>Analisar logs</button>
          </div>
          <form className="input-row" onSubmit={runCommand}>
            <input aria-label="Comando do terminal" value={command} maxLength={4096} onChange={(event) => setCommand(event.target.value)} spellCheck={false} required />
            <button className="button primary" type="submit" disabled={busy}><Play size={16} /> {busy ? "Executando…" : "Executar"}</button>
          </form>
          {output.length > 0 && <pre className="terminal-output" aria-live="polite">{output.join("\n")}</pre>}
        </>
      ) : (
        <>
          <div className="section-heading"><Bot size={22} /><h2>Assistente de estudos</h2></div>
          <p className="muted">Faça perguntas sobre Python, SQL, infraestrutura ou serviços em nuvem.</p>
          {!token ? (
            <button type="button" className="button primary" onClick={onSignIn}>Entrar para conversar</button>
          ) : (
            <form className="input-row" onSubmit={sendQuestion}>
              <input aria-label="Pergunta para o assistente" value={question} maxLength={4000} onChange={(event) => setQuestion(event.target.value)} required />
              <button type="submit" className="button primary" disabled={busy}>{busy ? "Enviando…" : "Enviar"}</button>
            </form>
          )}
          {token && transcript.length > 0 && (
            <div className="transcript" aria-live="polite">{transcript.map((message, index) => (
              <article key={index}><strong>{message.role}</strong><p>{message.text}</p></article>
            ))}</div>
          )}
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
