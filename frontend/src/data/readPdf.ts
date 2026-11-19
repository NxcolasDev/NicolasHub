import { getDocument, PDFWorker } from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

export async function readPdf(file: File, limit: number) {
  if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 15 * 1024 * 1024) {
    throw new Error("Selecione um PDF de até 15 MB.");
  }
  const data = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(data.subarray(0, 1024)).indexOf("%PDF-") === -1) {
    throw new Error("O arquivo selecionado não é um PDF válido.");
  }
  const port = new PdfWorker();
  const worker = PDFWorker.create({ port });
  const task = getDocument({ data, worker, isEvalSupported: false, stopAtErrors: true });
  try {
    const pdf = await task.promise;
    const pages = Math.min(pdf.numPages, 120);
    let text = "";
    let truncated = pdf.numPages > pages;
    for (let index = 1; index <= pages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      const extracted = content.items.map((item) => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("").trim();
      page.cleanup();
      if (!extracted) continue;
      const candidate = text ? `${text}\n\n${extracted}` : extracted;
      text = candidate.slice(0, limit);
      if (candidate.length > limit) { truncated = true; break; }
    }
    if (!text.trim()) throw new Error("O PDF não tem texto selecionável. Cole o conteúdo ou use um PDF com OCR.");
    return { text, truncated };
  } finally {
    try { await task.destroy(); }
    finally { worker.destroy(); port.terminate(); }
  }
}
