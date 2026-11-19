import type { loadPyodide } from "pyodide";
import runner from "./runner.py?raw";
import type { JSONValue } from "../data/codingMissions";
import type { CaseExecution, RunEvent, RunRequest } from "./protocol";

const channel = self as unknown as {
  onmessage: (event: MessageEvent<RunRequest>) => void;
  postMessage: (event: RunEvent) => void;
};
const runtimeUrl = new URL("/python-runtime/", self.location.origin);

async function startRuntime() {
  const moduleUrl = new URL("pyodide-loader.js", runtimeUrl).href;
  const runtime: { loadPyodide: typeof loadPyodide } = await import(/* @vite-ignore */ moduleUrl);
  const python = await runtime.loadPyodide({ indexURL: runtimeUrl.href, stdin: () => null });
  python.runPython(runner);
  return python;
}

function ordered(value: JSONValue): JSONValue {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, ordered(value[key])]));
  }
  return value;
}

let runtime: ReturnType<typeof startRuntime> | undefined;
channel.onmessage = async ({ data }) => {
  let ready = false;
  try {
    const python = await (runtime ??= startRuntime());
    ready = true;
    channel.postMessage({ type: "ready" });
    const runCase = python.globals.get("run_case") as ((code: string, input: string) => string) & { destroy: () => void };
    try {
      for (const [index, test] of data.cases.entries()) {
        const result = JSON.parse(runCase(data.source, JSON.stringify(test.input))) as CaseExecution;
        const passed = result.error === null && JSON.stringify(ordered(result.actual)) === JSON.stringify(ordered(test.expected));
        channel.postMessage({ type: "case", index, result, passed });
      }
    } finally {
      runCase.destroy();
    }
    channel.postMessage({ type: "done" });
  } catch {
    channel.postMessage({ type: "error", message: ready
      ? "O ambiente Python foi encerrado antes de concluir. Execute novamente."
      : "Não foi possível carregar o Python. Recarregue a página e tente novamente." });
  }
};
