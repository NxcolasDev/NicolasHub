import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, GitBranch, Image, Layers3, Network, Video, X } from "lucide-react";
import type { Profile } from "../api";
import { professionalLinks, projectLinks } from "../config/profileLinks";
import { ProjectVideo, readVideoLibrary, videosForProject } from "./ArchitectureVideos";

const projectDetails: Record<string, { cover: string; flow: string; architecture?: string }> = {
  recora: {
    cover: "recora",
    architecture: "/#recora",
    flow: "React + TypeScript → FastAPI + SQLAlchemy → PostgreSQL · Validação de CNPJ pela BrasilAPI",
  },
  "nicolas-hub": {
    cover: "nicolas_hub",
    architecture: "/arquitetura",
    flow: "React → FastAPI → PostgreSQL · Integrações com AWS SQS e Gemini",
  },
  gestoriq: {
    cover: "gestor_aiq",
    flow: "API Node.js + PostgreSQL · Armazenamento S3 · Processamento Lambda e notificações SNS · Infraestrutura em Terraform",
  },
  elan: {
    cover: "elan",
    flow: "React → API Express → PostgreSQL · A API intermedia as chamadas ao LLaMA · Docker Compose organiza os serviços",
  },
  corner: {
    cover: "corner",
    flow: "React → API REST em Express → MongoDB · A plataforma organiza flashcards para revisão espaçada",
  },
  mensageria: {
    cover: "mensageria_multicloud",
    flow: "Produtor Node.js → AWS SQS ou GCP Pub/Sub → consumidor assíncrono · Estudo de tratamento de falhas e filas de mensagens não processadas",
  },
};

function ProjectCard({ project, hasVideos, onArchitecture, onVideos }: {
  project: Profile["projects"][number]; hasVideos: boolean; onArchitecture: () => void; onVideos: () => void;
}) {
  const [run, setRun] = useState(0);
  const [length, setLength] = useState(project.summary.length);
  const details = projectDetails[project.id];
  const links = projectLinks[project.id];
  const [missingCover, setMissingCover] = useState(false);
  const cover = details?.cover ?? project.title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  useEffect(() => {
    if (!run || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let shown = 0;
    setLength(shown);
    const timer = window.setInterval(() => {
      shown = Math.min(project.summary.length, shown + 5);
      setLength(shown);
      if (shown === project.summary.length) window.clearInterval(timer);
    }, 22);
    return () => window.clearInterval(timer);
  }, [run, project.summary]);

  return (
    <article className="panel project showcase-project" onMouseEnter={() => setRun((current) => current + 1)}
      onFocus={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setRun((current) => current + 1); }}>
      <div className="project-cover" aria-hidden="true">
        {missingCover ? <Image size={31} /> : <img src={encodeURI(`/assets/projetos/${cover}.png`)} alt="" loading="lazy" onError={() => setMissingCover(true)} />}
      </div>
      <h4>{project.title}</h4>
      <p className="typewriter">
        <span className="typewriter-reserve" aria-hidden="true">{project.summary}</span>
        <span className="sr-only">{project.summary}</span>
        <span className="typewriter-ink" aria-hidden="true">{project.summary.slice(0, length)}</span>
      </p>
      <ul className="tags" aria-label="Tecnologias">{project.stack.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <div className="project-links">
        {links?.github && <a href={links.github} target="_blank" rel="noopener noreferrer"><GitBranch size={15} /> Repositório GitHub</a>}
        {links?.linkedin && <a href={links.linkedin} target="_blank" rel="noopener noreferrer">Post no LinkedIn <ArrowUpRight size={15} /></a>}
        {!links?.linkedin && professionalLinks.LinkedIn && <a href={professionalLinks.LinkedIn} target="_blank" rel="noopener noreferrer">Perfil no LinkedIn <ArrowUpRight size={15} /></a>}
        {links?.credly && <a href={links.credly} target="_blank" rel="noopener noreferrer">Credly <ArrowUpRight size={15} /></a>}
        {details?.architecture ? <a href={details.architecture}><Network size={15} /> Arquitetura</a>
          : details && <button type="button" className="feature-link" onClick={onArchitecture}><Network size={15} /> Arquitetura</button>}
        {hasVideos ? <button type="button" className="feature-link" onClick={onVideos}><Video size={15} /> Ver vídeos</button>
          : project.id !== "recora" && <a href={`/arquitetura?video=${encodeURIComponent(project.id)}#videos`}><Video size={15} /> Vídeos</a>}
      </div>
    </article>
  );
}

export default function ProjectShowcase({ profile }: { profile: Profile }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<{ project: Profile["projects"][number]; view: "architecture" | "videos" } | null>(null);
  const [library, setLibrary] = useState(readVideoLibrary);
  useEffect(() => {
    const update = () => setLibrary(readVideoLibrary());
    window.addEventListener("storage", update);
    window.addEventListener("pageshow", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("pageshow", update); };
  }, []);
  function show(project: Profile["projects"][number], view: "architecture" | "videos") {
    setSelected({ project, view });
    dialog.current?.showModal();
  }
  return (
    <section id="projetos" className="chapter">
      <div className="shell">
        <div className="chapter-kicker"><Layers3 size={16} /> Portfólio</div>
        <h3 className="extended-subtitle">Projetos</h3>
        <div className="card-grid chapter-cards">
          {profile.projects.map((project) => <ProjectCard key={project.id} project={project}
            hasVideos={videosForProject(library, project.id).length > 0}
            onArchitecture={() => show(project, "architecture")} onVideos={() => show(project, "videos")} />)}
        </div>
      </div>
      <dialog ref={dialog} className="showcase-dialog" aria-labelledby="project-architecture-title" onClose={() => setSelected(null)}>
        <div className="dialog-heading"><h2 id="project-architecture-title">{selected?.project.title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
        {selected?.view === "architecture" && <><div className="eyebrow"><Network size={16} /> Arquitetura</div><p>{projectDetails[selected.project.id]?.flow}</p></>}
        {selected?.view === "videos" && <ProjectVideo title={selected.project.title} ids={videosForProject(library, selected.project.id)} />}
      </dialog>
    </section>
  );
}
