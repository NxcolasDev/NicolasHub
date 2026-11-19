import type { JSONValue, MissionCase } from "../data/codingMissions";

export type RunRequest = { source: string; cases: MissionCase[] };
export type CaseExecution = {
  actual: JSONValue;
  error: string | null;
  stdout: string;
  stderr: string;
  steps: { line: number; variables: Record<string, string> }[];
};
export type RunEvent =
  | { type: "ready" }
  | { type: "case"; index: number; result: CaseExecution; passed: boolean }
  | { type: "done" }
  | { type: "error"; message: string };
