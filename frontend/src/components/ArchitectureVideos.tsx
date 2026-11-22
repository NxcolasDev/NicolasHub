import { useState } from "react";
import type { FormEvent } from "react";
import { Video } from "lucide-react";
import type { VideoLibrary } from "../api";

const projects = {
  "nicolas-hub": "Nicolas Hub",
  gestoriq: "Gestor AIQ",
  elan: "Élan",
  corner: "Corner",
  mensageria: "Mensageria Multi-Cloud",
  ia: "Uso de IA no dia a dia",
};
type VideoProject = keyof typeof projects;
const projectIds = Object.keys(projects) as VideoProject[];
const storageKey = "nicolas-hub-project-videos";
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

function isProject(value: string | null): value is VideoProject {
  return value !== null && Object.hasOwn(projects, value);
}

function readLocalVideos(): VideoLibrary {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    if (typeof raw !== "object" || raw === null) return {};
    const entries = raw as Record<string, unknown>;
    return Object.fromEntries(projectIds.flatMap((id) => {
      const value = entries[id];
      return Array.isArray(value) ? [[id, value.filter((video) => typeof video === "string" && videoIdPattern.test(video))]] : [];
    }));
  } catch { return {}; }
}

function extractVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const [path, segment] = url.pathname.split("/").filter(Boolean);
    const youtube = host === "youtube.com" || host === "m.youtube.com";
    let id: string | null = null;
    if (host === "youtu.be") id = path ?? null;
    else if (youtube && path === "watch") id = url.searchParams.get("v");
    else if ((youtube || host === "youtube-nocookie.com") && path === "embed") id = segment ?? null;
    else if (youtube && (path === "shorts" || path === "live")) id = segment ?? null;
    return id && videoIdPattern.test(id) ? id : null;
  } catch { return null; }
}

export function ProjectVideo({ title, ids }: { title: string; ids: string[] }) {
  const [selected, setSelected] = useState(ids[ids.length - 1]);
  const video = ids.includes(selected) ? selected : ids[ids.length - 1];
  if (!video) return null;
  return <div className="project-player">
    {ids.length > 1 && <label>Vídeo de {title} <select value={video} onChange={(event) => setSelected(event.target.value)}>
      {ids.map((id, index) => <option key={id} value={id}>Vídeo {index + 1}</option>)}
    </select></label>}
    <iframe key={video} src={`https://www.youtube-nocookie.com/embed/${video}`} title={`Vídeo de ${title}`}
      loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture" allowFullScreen />
    <a className="feature-link" href={`https://www.youtube.com/watch?v=${video}`} target="_blank" rel="noreferrer">Abrir no YouTube</a>
  </div>;
}

export interface ArchitectureVideosProps {
  library: VideoLibrary;
  status: "loading" | "ready" | "error";
  onPublish?: (project: string, id: string) => Promise<void>;
  onRetry: () => void;
}

export default function ArchitectureVideos({ library, status, onPublish, onRetry }: ArchitectureVideosProps) {
  const [selected, setSelected] = useState<VideoProject>(() => {
    const project = new URLSearchParams(location.search).get("video");
    return isProject(project) ? project : "nicolas-hub";
  });
  const [localVideos] = useState(readLocalVideos);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const ids = library[selected] ?? [];
  const unpublished = [...new Set(localVideos[selected] ?? [])].filter((id) => !ids.includes(id));

  async function publish(videoIds: string[], onSuccess?: () => void) {
    if (!onPublish || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      for (const id of videoIds) await onPublish(selected, id);
      setFeedback(`Vídeos de ${projects[selected]} atualizados no Portfólio e em Arquitetura.`);
      onSuccess?.();
    } catch (failure) {
      setFeedback(failure instanceof Error ? failure.message : "Não foi possível publicar o vídeo.");
    } finally { setBusy(false); }
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("video-url") ?? "").trim();
    const id = extractVideoId(value);
    if (!id) { setFeedback("Cole uma URL HTTPS válida de um vídeo do YouTube."); return; }
    if (ids.includes(id)) { setFeedback("Esse vídeo já está cadastrado no projeto."); return; }
    void publish([id], () => form.reset());
  }

  return <section id="videos" className="page-section panel architecture-videos" aria-labelledby="video-heading">
    <div className="section-heading"><Video size={21} /><h2 id="video-heading">Vídeos de arquitetura e projetos</h2></div>
    <div className="video-filters" role="group" aria-label="Filtrar vídeos por projeto">
      {projectIds.map((id) => <button type="button" key={id} className="button secondary small" aria-pressed={selected === id} disabled={busy}
        onClick={() => { setSelected(id); setFeedback(""); }}>{projects[id]}</button>)}
    </div>
    {status === "loading" && <p role="status" className="muted">Carregando vídeos…</p>}
    {status === "error" && <div className="actions"><p className="muted">Não foi possível carregar os vídeos.</p>
      <button type="button" className="button secondary small" onClick={onRetry}>Tentar novamente</button></div>}
    {ids.length > 0 ? <ProjectVideo key={`${selected}:${ids.length}`} title={projects[selected]} ids={ids} />
      : status === "ready" && <p className="muted">Nenhum vídeo disponível para {projects[selected]}.</p>}
    {onPublish && <details className="video-form">
      <summary>Cadastrar vídeo em {projects[selected]}</summary>
      <form onSubmit={save}>
        <label htmlFor="video-url">URL do vídeo no YouTube</label>
        <input id="video-url" name="video-url" type="url" maxLength={1000} placeholder="https://youtu.be/…" required />
        <button type="submit" className="button primary small" disabled={busy || status !== "ready"}>{busy ? "Publicando…" : "Publicar vídeo"}</button>
      </form>
      <p className="muted">O vídeo ficará visível para visitantes no Portfólio e em Arquitetura.</p>
      {unpublished.length > 0 && <button type="button" className="button secondary small" disabled={busy || status !== "ready"}
        onClick={() => void publish(unpublished)}>Publicar vídeos salvos neste navegador ({unpublished.length})</button>}
    </details>}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
