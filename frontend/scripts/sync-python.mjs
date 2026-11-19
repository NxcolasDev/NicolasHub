import { copyFile, mkdir } from "node:fs/promises";

const source = new URL("../node_modules/pyodide/", import.meta.url);
const destination = new URL("../public/python-runtime/", import.meta.url);
await mkdir(destination, { recursive: true });
await Promise.all([
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "pyodide-lock.json",
  "python_stdlib.zip",
].map((file) => copyFile(new URL(file, source), new URL(file, destination))));
await copyFile(new URL("pyodide.mjs", source), new URL("pyodide-loader.js", destination));
