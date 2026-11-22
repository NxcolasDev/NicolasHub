import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Image, Layers3, Network, X } from "lucide-react";
import { projectCoverUrl } from "../api";
import type { Profile, ProjectCovers, VideoLibrary } from "../api";
import { professionalLinks, projectLinks } from "../config/profileLinks";
import { ProjectVideo } from "./ArchitectureVideos";
import ProfessionalIcon from "./ProfessionalIcon";

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

type Project = Profile["projects"][number];

function ProjectCover({ project, revision }: { project: Project; revision?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const cover = projectDetails[project.id]?.cover ?? project.title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const sources = [revision ? projectCoverUrl(project.id, revision) : "", encodeURI(`/assets/projetos/${cover}.png`)];
  const src = sources.find((candidate) => candidate && !failed.includes(candidate));
  return <div className="project-cover" aria-hidden="true">
    {src ? <img key={src} src={src} alt="" loading="lazy" onError={() => setFailed((current) => [...current, src])} />
      : <Image size={38} />}
  </div>;
}

function ProjectCard({ project, revision, onArchitecture }: {
  project: Project; revision?: string; onArchitecture: () => void;
}) {
  const [run, setRun] = useState(0);
  const [length, setLength] = useState(project.summary.length);
  const details = projectDetails[project.id];
  const links = projectLinks[project.id];

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
      <ProjectCover project={project} revision={revision} />
      <h4>{project.title}</h4>
      <p className="typewriter">
        <span className="typewriter-reserve" aria-hidden="true">{project.summary}</span>
        <span className="sr-only">{project.summary}</span>
        <span className="typewriter-ink" aria-hidden="true">{project.summary.slice(0, length)}</span>
      </p>
      <ul className="tags" aria-label="Tecnologias">{project.stack.map((skill) => <li key={skill}>{skill}</li>)}</ul>
      <div className="project-links">
        {links?.github && <a href={links.github} target="_blank" rel="noopener noreferrer"><ProfessionalIcon label="GitHub" /> Repositório GitHub</a>}
        {(links?.linkedin || professionalLinks.LinkedIn) && <a href={links?.linkedin || professionalLinks.LinkedIn} target="_blank" rel="noopener noreferrer"><ProfessionalIcon label="LinkedIn" /> {links?.linkedin ? "Post no LinkedIn" : "Perfil no LinkedIn"} <ArrowUpRight size={15} /></a>}
        {links?.credly && <a href={links.credly} target="_blank" rel="noopener noreferrer">Credly <ArrowUpRight size={15} /></a>}
        {details?.architecture ? <a href={details.architecture}><Network size={15} /> Arquitetura</a>
          : details && <button type="button" className="feature-link" onClick={onArchitecture}><Network size={15} /> Arquitetura</button>}
      </div>
    </article>
  );
}

export default function ProjectShowcase({ profile, videos, covers }: { profile: Profile; videos: VideoLibrary; covers: ProjectCovers }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const introVideo = videos["nicolas-hub"]?.at(-1);

  function show(project: Project) {
    setSelected(project);
    dialog.current?.showModal();
  }
  return (
    <section id="projetos" className="chapter">
      <div className="shell">
        <div className="chapter-kicker"><Layers3 size={16} /> Portfólio</div>
        <h3 className="extended-subtitle">Projetos</h3>
        {introVideo && <section className="project-intro" aria-labelledby="project-intro-title">
          <h4 id="project-intro-title">Nicolas Hub</h4>
          <ProjectVideo title="Nicolas Hub" ids={[introVideo]} />
        </section>}
        <div className="card-grid chapter-cards">
          {profile.projects.map((project) => <ProjectCard key={project.id} project={project}
            revision={covers[project.id]} onArchitecture={() => show(project)} />)}
        </div>
      </div>
      <dialog ref={dialog} className="showcase-dialog" aria-labelledby="project-architecture-title" onClose={() => setSelected(null)}>
        <div className="dialog-heading"><h2 id="project-architecture-title">{selected?.title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
        {selected && <><div className="eyebrow"><Network size={16} /> Arquitetura</div><p>{projectDetails[selected.id]?.flow}</p></>}
      </dialog>
    </section>
  );
}
