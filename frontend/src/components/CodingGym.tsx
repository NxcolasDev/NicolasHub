import { useCallback, useEffect, useRef, useState } from "react";
import { basicSetup, EditorView } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { BookOpen, Code2, Play, Sparkles, Square, Terminal } from "lucide-react";
import { getCodingGuidance } from "../api";
import type { CodingGuidance } from "../api";
import { levels, missions } from "../data/codingMissions";
import type { Level, Mission } from "../data/codingMissions";
import type { CaseExecution, RunEvent, RunRequest } from "../coding/protocol";

const starter = "def solve(data):\n    # Escreva sua solução aqui.\n    return None\n";
type TestResult = { index: number; result: CaseExecution; passed: boolean };

function MissionWorkspace({ mission, initialDraft, saveDraft, token, onSignIn }: {
  mission: Mission; initialDraft: string; saveDraft: (id: string, source: string) => void; token: string; onSignIn: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const draft = useRef(initialDraft);
  const editor = useRef<EditorView | null>(null);
  const execution = useRef<{ worker: Worker; timer: number } | null>(null);
  const [guidance, setGuidance] = useState<CodingGuidance | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "done" | "stopped" | "error">("idle");
  const [runError, setRunError] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [sourceLines, setSourceLines] = useState<string[]>([]);
  const running = status === "loading" || status === "running";
  const passed = results.filter((test) => test.passed).length;

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      doc: draft.current,
      extensions: [
        basicSetup, python(), oneDark, EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": "Editor de código Python", spellcheck: "false" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) saveDraft(mission.id, update.state.doc.toString());
        }),
      ],
    });
    editor.current = view;
    return () => { view.destroy(); editor.current = null; };
  }, [mission.id, saveDraft]);

  useEffect(() => () => {
    if (!execution.current) return;
    window.clearTimeout(execution.current.timer);
    execution.current.worker.terminate();
    execution.current = null;
  }, []);

  async function generate() {
    if (!token) { onSignIn(); return; }
    setGenerating(true);
    setAiError("");
    try {
      setGuidance(await getCodingGuidance(mission.id, token));
    } catch (failure) {
      setAiError(failure instanceof Error ? failure.message : "Não foi possível gerar a trilha.");
    } finally {
      setGenerating(false);
    }
  }

  function finish(next: "done" | "stopped" | "error", message = "") {
    if (execution.current) {
      window.clearTimeout(execution.current.timer);
      execution.current.worker.terminate();
      execution.current = null;
    }
    setRunError(message);
    setStatus(next);
  }

  function run() {
    const source = editor.current?.state.doc.toString().trimEnd() ?? "";
    if (execution.current) return;
    if (!source.trim() || source.length > 16000) {
      setRunError("Escreva uma solução de até 16.000 caracteres.");
      return;
    }
    setSourceLines(source.split("\n"));
    setResults([]);
    setRunError("");
    setStatus("loading");

    try {
      const worker = new Worker(new URL("../coding/python.worker.ts", import.meta.url), { type: "module" });
      execution.current = {
        worker,
        timer: window.setTimeout(() => finish("error", "O carregamento do Python demorou demais. Tente novamente."), 30_000),
      };
      worker.onerror = () => finish("error", "Não foi possível iniciar o ambiente Python. Tente novamente.");
      worker.onmessage = ({ data }: MessageEvent<RunEvent>) => {
        if (execution.current?.worker !== worker) return;
        switch (data.type) {
          case "ready":
            setStatus("running");
            window.clearTimeout(execution.current.timer);
            execution.current.timer = window.setTimeout(() => finish("error", "Execução interrompida após 6 segundos. Verifique se há um laço sem condição de saída."), 6_000);
            break;
          case "case":
            setResults((current) => [...current, data]);
            break;
          case "done":
            finish("done");
            break;
          case "error":
            finish("error", data.message);
        }
      };
      worker.postMessage({ source, cases: mission.cases } satisfies RunRequest);
    } catch {
      finish("error", "Não foi possível abrir o ambiente Python neste navegador.");
    }
  }

  return (
    <div className="gym-workspace">
      <article className="gym-mission">
        <div className="eyebrow"><BookOpen size={16} /> Missão guiada</div>
        <h3>{mission.title}</h3>
        <p>{mission.task}</p>
        {guidance && <p className="gym-scenario">{guidance.scenario}</p>}
        <dl className="gym-hints">
          <div><dt>Entrada esperada</dt><dd>{mission.input}</dd>{guidance && <dd>{guidance.input_hint}</dd>}</div>
          <div><dt>Lógica sugerida</dt><dd>{guidance?.strategy_hint ?? mission.strategy}</dd></div>
          <div><dt>Complexidade de referência</dt><dd>{mission.complexity}</dd>{guidance && <dd>{guidance.complexity_hint}</dd>}</div>
        </dl>
        <button type="button" className="button secondary" onClick={generate} disabled={generating}>
          <Sparkles size={17} /> {generating ? "Gerando trilha…" : "Gerar Trilha com Gemini"}
        </button>
        {!token && <p className="gym-note">Entre para gerar dicas com Gemini. A execução local está disponível para visitantes.</p>}
        {aiError && <p className="error" role="alert">{aiError}</p>}
      </article>
      <div className="gym-ide">
        <div className="gym-toolbar"><span><Code2 size={16} /> solucao.py</span><span>Python</span></div>
        <div ref={host} className="gym-editor" />
        <div className="gym-run">
          <p>Implemente <code>solve(data)</code> e devolva o resultado com <code>return</code>.</p>
          {running ? <button type="button" className="button secondary" onClick={() => finish("stopped")}><Square size={15} /> Interromper</button>
            : <button type="button" className="button primary" onClick={run}><Play size={16} /> Executar testes</button>}
        </div>
        <section className="gym-console" aria-label="Console de execução">
          <div className="gym-toolbar"><span><Terminal size={16} /> Console</span><span>{results.length}/{mission.cases.length} casos</span></div>
          <p className="gym-console-status" role="status">
            {status === "idle" && "> Execute os testes para acompanhar a saída."}
            {status === "loading" && "> Carregando o Python no navegador…"}
            {status === "running" && "> Executando sua solução…"}
            {status === "done" && `> ${passed}/${mission.cases.length} testes aprovados`}
            {status === "stopped" && "> Execução interrompida."}
          </p>
          {runError && <p className="error" role="alert">{runError}</p>}
          {results.map(({ index, result, passed: testPassed }) => {
            const test = mission.cases[index];
            return <details className="gym-case" key={index} open={index === 0 || !testPassed}>
              <summary><span className={testPassed ? "case-pass" : "case-fail"}>{testPassed ? "Passou" : "Falhou"}</span> {test.label}</summary>
              <p><strong>Entrada em solve(data):</strong> <code>{JSON.stringify(test.input)}</code></p>
              {result.stdout && <pre aria-label="Saída do print">{result.stdout}</pre>}
              {result.stderr && <pre aria-label="Saída de erro">{result.stderr}</pre>}
              {result.error ? <p className="case-fail">{result.error}</p>
                : <p><strong>Retorno:</strong> <code>{JSON.stringify(result.actual)}</code> · <strong>Esperado:</strong> <code>{JSON.stringify(test.expected)}</code></p>}
              <p>{testPassed ? "O valor retornado coincide com a saída esperada." : result.error ? "Corrija o erro indicado e execute novamente." : "O retorno difere do esperado. Confira os valores antes da linha de return."}</p>
              {result.steps.length > 0 && <div className="gym-trace">
                <h4>Passo a passo · valores antes de cada linha</h4>
                <ol>
                  {result.steps.map(({ line, variables }, step) => (
                    <li key={step}><span>L{line}</span> <code>{sourceLines[line - 1]?.trim()}</code>
                      {Object.keys(variables).length > 0 && <small>{Object.entries(variables).map(([key, value]) => `${key} = ${value}`).join(" · ")}</small>}</li>
                  ))}
                </ol>
                {result.steps.length === 24 && <p>A prévia mostra até 24 passos.</p>}
              </div>}
            </details>;
          })}
        </section>
      </div>
    </div>
  );
}

export default function CodingGym({ token, onSignIn }: { token: string; onSignIn: () => void }) {
  const [level, setLevel] = useState<Level>("basico");
  const [index, setIndex] = useState(0);
  const drafts = useRef<Record<string, string>>({});
  const saveDraft = useCallback((id: string, source: string) => { drafts.current[id] = source; }, []);
  const mission = missions[level][index];

  return (
    <section className="coding-gym page-section" aria-labelledby="gym-title">
      <div className="gym-heading">
        <div><div className="eyebrow"><Terminal size={17} /> Coding Gym</div><h2 id="gym-title">Treino de lógica em Python</h2></div>
        <div className="gym-selects">
          <label>Nível <select value={level} onChange={(event) => { setLevel(event.target.value as Level); setIndex(0); }}>
            {Object.entries(levels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select></label>
          <label>Exercício <select value={index} onChange={(event) => setIndex(Number(event.target.value))}>
            {missions[level].map((item, position) => <option value={position} key={item.id}>{item.title}</option>)}
          </select></label>
        </div>
      </div>
      <MissionWorkspace key={mission.id} mission={mission} initialDraft={drafts.current[mission.id] ?? starter}
        saveDraft={saveDraft} token={token} onSignIn={onSignIn} />
    </section>
  );
}
