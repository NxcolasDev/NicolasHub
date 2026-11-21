import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, FilePlus, FolderPlus, Link2, NotebookPen } from "lucide-react";
import Markdown from "react-markdown";
import { skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";

type Page = { id: string; title: string; tags: string; body: string };
type Folder = { id: string; name: string; pages: Page[] };
const storageKey = "nicolas-hub-notebooks-v1";
const examples: Folder[] = [
  { id: "aws", name: "AWS Cloud Practitioner", pages: [{ id: "iam", title: "Identidades e acesso na AWS", tags: "AWS, IAM", body: "## Privilégio mínimo\n\nConceda somente as permissões necessárias para a tarefa. Prefira credenciais temporárias para aplicações e revise as permissões de acordo com o uso.\n\n**Para revisar:** qual a diferença entre atribuir permissões a uma função e compartilhar credenciais de um usuário?" }] },
  { id: "gcp", name: "Google Cloud Foundations", pages: [{ id: "pubsub", title: "Tópicos e assinaturas", tags: "GCP, Pub/Sub", body: "## Mensageria assíncrona\n\nUm produtor publica em um tópico. Uma assinatura define como o consumidor recebe as mensagens. Assinaturas distintas podem atender consumidores com responsabilidades diferentes.\n\n**Para revisar:** o que pode fazer o processamento lidar corretamente com uma entrega repetida?" }] },
  { id: "faculdade", name: "Provas UniFAAT", pages: [{ id: "sql", title: "Transações em bancos de dados", tags: "SQL, UniFAAT", body: "## Atomicidade\n\nUma transação reúne operações que precisam ter sucesso ou falhar como uma unidade.\n\n- `COMMIT` confirma as alterações.\n- `ROLLBACK` desfaz as alterações ainda não confirmadas.\n\n**Exercício:** modele uma transferência entre duas contas com uma transação." }] },
  { id: "redes", name: "Redes & Terraform", pages: [{ id: "vpc", title: "Redes, rotas e infraestrutura como código", tags: "VPC, Terraform", body: "## Antes de aplicar\n\n1. Entenda os blocos de endereços das sub-redes.\n2. Confira as rotas e os destinos permitidos.\n3. Revise o plano do Terraform e identifique mudanças que substituem recursos." }] },
];

function isPage(value: unknown): value is Page {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<Page>;
  return typeof item.id === "string" && typeof item.title === "string" && item.title.length <= 120
    && typeof item.tags === "string" && item.tags.length <= 160 && typeof item.body === "string" && item.body.length <= 12000;
}

function loadNotes(): Folder[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!Array.isArray(data)) return examples;
    return data.filter((folder): folder is Folder => folder && typeof folder.id === "string" && typeof folder.name === "string"
      && Array.isArray(folder.pages) && folder.pages.every(isPage));
  } catch { return examples; }
}

function readShared(): Page | null {
  try {
    const data: unknown = JSON.parse(new URLSearchParams(location.hash.slice(1)).get("folha") ?? "null");
    return isPage(data) ? data : null;
  } catch { return null; }
}

export default function Notes({ admin }: { admin: boolean }) {
  const [folders, setFolders] = useState(loadNotes);
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");
  const [pageId, setPageId] = useState(folders[0]?.pages[0]?.id ?? "");
  const [shared, setShared] = useState(readShared);
  const [mode, setMode] = useState<"read" | "folder" | "page" | "edit">("read");
  const [feedback, setFeedback] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const folder = folders.find((item) => item.id === folderId);
  const page = shared ?? folder?.pages.find((item) => item.id === pageId);

  useEffect(() => {
    const sync = () => { setShared(readShared()); setMode("read"); };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function select(nextFolder: string, nextPage = "") {
    if (location.hash) history.replaceState(null, "", location.pathname);
    setShared(null);
    setFolderId(nextFolder);
    setPageId(nextPage);
    setShareUrl("");
    setFeedback("");
    setMode("read");
  }

  function save(next: Folder[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setFeedback("O navegador não conseguiu salvar as alterações."); return false; }
    setFolders(next);
    return true;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin) return;
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    if (!title) { setFeedback("Preencha o título."); return; }
    if (mode === "folder") {
      const id = crypto.randomUUID();
      if (save([...folders, { id, name: title, pages: [] }])) select(id);
      return;
    }
    if (!folder) return;
    const draft: Page = {
      id: mode === "edit" && page ? page.id : crypto.randomUUID(),
      title,
      tags: String(fields.get("tags") ?? "").trim(),
      body: String(fields.get("body") ?? "").trim(),
    };
    if (!draft.body) { setFeedback("Escreva o conteúdo da folha."); return; }
    const pages = mode === "edit" ? folder.pages.map((item) => item.id === draft.id ? draft : item) : [...folder.pages, draft];
    if (save(folders.map((item) => item.id === folder.id ? { ...item, pages } : item))) select(folder.id, draft.id);
  }

  async function share(note: Page) {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({ folha: JSON.stringify(note) }).toString();
    setShareUrl(url.href);
    try { await navigator.clipboard.writeText(url.href); setFeedback("Link copiado."); }
    catch { setFeedback("Selecione o link para copiar."); }
  }

  return <div className="notes-page">
    <header className="workspace-hero">
      <div><div className="eyebrow"><NotebookPen size={18} /> Caderno de estudos</div><h1>Notes</h1>
        <p>Explore as anotações de cloud, dados e faculdade. Crie suas próprias pastas ou compartilhe uma folha para leitura.</p></div>
      <AvatarStage skin={skins.notes} dialogue="Um conceito bem explicado vale uma página." priority />
    </header>
    <div className="notes-layout">
      <aside className="notes-sidebar" aria-label="Pastas e folhas">
        <h2>Pastas</h2>
        {admin && <button type="button" className="button secondary small" onClick={() => { setMode("folder"); setFeedback(""); }}><FolderPlus size={16} /> Nova pasta</button>}
        <nav aria-label="Pastas do caderno">
          {folders.map((item) => <button type="button" key={item.id} aria-pressed={!shared && folderId === item.id} onClick={() => select(item.id, item.pages[0]?.id)}>{item.name}<span>{item.pages.length}</span></button>)}
        </nav>
        {!shared && folder && <><h3>Folhas</h3>
          {admin && <button type="button" className="button secondary small" onClick={() => { setMode("page"); setFeedback(""); }}><FilePlus size={16} /> Nova folha</button>}
          <nav aria-label="Folhas da pasta">
            {folder.pages.map((item) => <button type="button" key={item.id} aria-pressed={pageId === item.id} onClick={() => select(folder.id, item.id)}>{item.title}</button>)}
          </nav></>}
        <p className="muted">As edições ficam neste navegador.</p>
      </aside>
      <section className="notes-sheet">
        {admin && mode !== "read" ? <form key={mode} onSubmit={submit}>
          <h2>{mode === "folder" ? "Nova pasta" : mode === "edit" ? "Editar folha" : "Nova folha"}</h2>
          <label htmlFor="note-title">{mode === "folder" ? "Nome da pasta" : "Título da folha"}</label>
          <input id="note-title" name="title" maxLength={120} defaultValue={mode === "edit" ? page?.title : ""} required />
          {mode !== "folder" && <>
            <label htmlFor="note-tags">Tags separadas por vírgula</label>
            <input id="note-tags" name="tags" maxLength={160} defaultValue={mode === "edit" ? page?.tags : ""} />
            <label htmlFor="note-body">Conteúdo em Markdown</label>
            <textarea id="note-body" name="body" maxLength={12000} rows={12} defaultValue={mode === "edit" ? page?.body : ""} required />
          </>}
          <div className="actions"><button className="button primary" type="submit">Salvar</button><button className="button secondary" type="button" onClick={() => { setMode("read"); setFeedback(""); }}>Cancelar</button></div>
        </form> : page ? <>
          <div className="eyebrow"><BookOpen size={17} /> {shared ? "Folha compartilhada" : folder?.name}</div>
          <h2>{page.title}</h2>
          {page.tags && <ul className="tags">{page.tags.split(",").map((tag, index) => tag.trim() && <li key={index}>{tag.trim()}</li>)}</ul>}
          <div className="note-markdown"><Markdown skipHtml disallowedElements={["img"]}>{page.body}</Markdown></div>
          <div className="actions">
            {admin && !shared && <button type="button" className="button secondary" onClick={() => { setMode("edit"); setFeedback(""); }}>Editar folha</button>}
            <button type="button" className="button secondary" onClick={() => void share(page)}><Link2 size={16} /> Compartilhar folha</button>
          </div>
          {shareUrl && <label className="notes-share">Link de leitura<input value={shareUrl} onFocus={(event) => event.target.select()} readOnly /></label>}
        </> : <><h2>{folder?.name ?? "Caderno"}</h2><p>Crie uma folha para começar a escrever.</p></>}
        {feedback && <p role="status">{feedback}</p>}
      </section>
    </div>
  </div>;
}
