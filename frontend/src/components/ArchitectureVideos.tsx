import { useState } from "react";
import type { FormEvent } from "react";
import { Video } from "lucide-react";

const projects = {
  "nicolas-hub": "Nicolas Hub",
  gestoriq: "Gestor AIQ",
  elan: "Élan",
  corner: "Corner",
  mensageria: "Mensageria Multi-Cloud",
  ia: "Uso de IA no dia a dia",
};
type VideoProject = keyof typeof projects;
type Library = Partial<Record<VideoProject, string[]>>;
const projectIds = Object.keys(projects) as VideoProject[];
const storageKey = "nicolas-hub-project-videos";
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;

function isProject(value: string | null): value is VideoProject {
  return value !== null && Object.hasOwn(projects, value);
}

export function readVideoLibrary(): Library {
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

export function videosForProject(library: Library, project: string) {
  return isProject(project) ? library[project] ?? [] : [];
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
  </div>;
}

export default function ArchitectureVideos({ admin }: { admin: boolean }) {
  const [selected, setSelected] = useState<VideoProject>(() => {
    const project = new URLSearchParams(location.search).get("video");
    return isProject(project) ? project : "nicolas-hub";
  });
  const [library, setLibrary] = useState(readVideoLibrary);
  const [feedback, setFeedback] = useState("");
  const ids = library[selected] ?? [];

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin) return;
    const form = event.currentTarget;
    const value = String(new FormData(form).get("video-url") ?? "").trim();
    const id = extractVideoId(value);
    if (!id) { setFeedback("Cole uma URL HTTPS válida de um vídeo do YouTube."); return; }
    if (ids.includes(id)) { setFeedback("Esse vídeo já está cadastrado no projeto."); return; }
    const next = { ...library, [selected]: [...ids, id] };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setLibrary(next);
      setFeedback(`Vídeo salvo para ${projects[selected]} neste navegador.`);
      form.reset();
    } catch { setFeedback("O navegador não conseguiu salvar o vídeo."); }
  }

  return <section id="videos" className="page-section panel architecture-videos" aria-labelledby="video-heading">
    <div className="section-heading"><Video size={21} /><h2 id="video-heading">Vídeos de arquitetura e projetos</h2></div>
    <div className="video-filters" role="group" aria-label="Filtrar vídeos por projeto">
      {projectIds.map((id) => <button type="button" key={id} className="button secondary small" aria-pressed={selected === id}
        onClick={() => { setSelected(id); setFeedback(""); }}>{projects[id]}</button>)}
    </div>
    {ids.length > 0 ? <ProjectVideo key={`${selected}:${ids.length}`} title={projects[selected]} ids={ids} />
      : <p className="muted">Nenhum vídeo disponível para {projects[selected]}.</p>}
    {admin && <details className="video-form">
      <summary>Cadastrar vídeo em {projects[selected]}</summary>
      <form onSubmit={save}>
        <label htmlFor="video-url">URL do vídeo no YouTube</label>
        <input id="video-url" name="video-url" type="url" maxLength={1000} placeholder="https://youtu.be/…" required />
        <button type="submit" className="button primary small">Salvar vídeo</button>
      </form>
      <p className="muted">Os vídeos cadastrados ficam neste navegador.</p>
    </details>}
    {feedback && <p role="status">{feedback}</p>}
  </section>;
}
