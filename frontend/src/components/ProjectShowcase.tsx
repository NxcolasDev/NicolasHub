import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Image, Layers3, Network, Video, X } from "lucide-react";
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

function ProjectCover({ project, revision, decorative = false }: { project: Project; revision?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState<string[]>([]);
  const cover = projectDetails[project.id]?.cover ?? project.title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const sources = [revision ? projectCoverUrl(project.id, revision) : "", encodeURI(`/assets/projetos/${cover}.png`)];
  const src = sources.find((candidate) => candidate && !failed.includes(candidate));
  return <div className="project-cover" aria-hidden={decorative || undefined}>
    {src ? <img key={src} src={src} alt={decorative ? "" : `Capa de ${project.title}`} loading="lazy" onError={() => setFailed((current) => [...current, src])} />
      : <Image size={38} aria-hidden="true" />}
  </div>;
}

function ProjectCard({ project, revision, hasVideo, onArchitecture, onVideo }: {
  project: Project; revision?: string; hasVideo: boolean; onArchitecture: () => void; onVideo: () => void;
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
      <ProjectCover project={project} revision={revision} decorative />
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
        {hasVideo && <button type="button" className="feature-link" onClick={onVideo}><Video size={15} /> Assistir demonstração</button>}
      </div>
    </article>
  );
}

export default function ProjectShowcase({ profile, videos, covers }: { profile: Profile; videos: VideoLibrary; covers: ProjectCovers }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const featureHeading = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [featuredId, setFeaturedId] = useState("nicolas-hub");
  const [slide, setSlide] = useState(0);
  const featured = profile.projects.find((project) => project.id === featuredId) ?? profile.projects[0];
  const featuredVideos = featured ? videos[featured.id] ?? [] : [];
  const slideCount = 1 + featuredVideos.length;
  const activeSlide = Math.min(slide, slideCount - 1);

  function selectProject(project: Project, nextSlide: number) {
    setFeaturedId(project.id);
    setSlide(nextSlide);
  }

  function show(project: Project) {
    setSelected(project);
    dialog.current?.showModal();
  }
  return (
    <section id="projetos" className="chapter">
      <div className="shell">
        <div className="chapter-kicker"><Layers3 size={16} /> Portfólio</div>
        <h3 className="extended-subtitle">Projetos</h3>
        {featured && <section className="project-feature" aria-labelledby="featured-project-title">
          <div className="project-feature-heading">
            <h4 id="featured-project-title" ref={featureHeading} tabIndex={-1}>{featured.title}</h4>
            {projectLinks[featured.id]?.github && <a className="feature-link" href={projectLinks[featured.id]?.github} target="_blank" rel="noopener noreferrer"><ProfessionalIcon label="GitHub" /> Repositório GitHub <ArrowUpRight size={15} /></a>}
          </div>
          <div className="project-feature-media">
            {activeSlide === 0 ? <ProjectCover key={featured.id} project={featured} revision={covers[featured.id]} />
              : <ProjectVideo key={`${featured.id}:${activeSlide}`} title={featured.title} ids={[featuredVideos[activeSlide - 1]]} />}
          </div>
          {slideCount > 1 && <div className="project-feature-controls" role="group" aria-label="Alternar entre capa e vídeos">
            <button className="icon-button" type="button" aria-label="Mídia anterior" onClick={() => setSlide((activeSlide + slideCount - 1) % slideCount)}><ChevronLeft size={20} /></button>
            {Array.from({ length: slideCount }, (_, index) => <button type="button" className="project-media-dot" key={index}
              aria-label={index === 0 ? "Exibir capa" : `Exibir vídeo ${index}`} aria-pressed={activeSlide === index} onClick={() => setSlide(index)} />)}
            <button className="icon-button" type="button" aria-label="Próxima mídia" onClick={() => setSlide((activeSlide + 1) % slideCount)}><ChevronRight size={20} /></button>
            <button type="button" className="feature-link" onClick={() => setSlide(activeSlide === 0 ? 1 : 0)}>
              {activeSlide === 0 ? <><Video size={17} /> Assistir demonstração</> : <><Image size={17} /> Voltar à capa</>}
            </button>
          </div>}
          <div className="project-feature-tabs" role="group" aria-label="Selecionar projeto em destaque">
            {profile.projects.map((project) => <button type="button" key={project.id} className="button secondary small"
              aria-pressed={featured.id === project.id} onClick={() => selectProject(project, 0)}>{project.title}</button>)}
          </div>
        </section>}
        <div className="card-grid chapter-cards">
          {profile.projects.map((project) => <ProjectCard key={project.id} project={project}
            revision={covers[project.id]} hasVideo={Boolean(videos[project.id]?.length)} onArchitecture={() => show(project)}
            onVideo={() => { selectProject(project, 1); featureHeading.current?.focus(); }} />)}
        </div>
      </div>
      <dialog ref={dialog} className="showcase-dialog" aria-labelledby="project-architecture-title" onClose={() => setSelected(null)}>
        <div className="dialog-heading"><h2 id="project-architecture-title">{selected?.title}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
        {selected && <><div className="eyebrow"><Network size={16} /> Arquitetura</div><p>{projectDetails[selected.id]?.flow}</p></>}
      </dialog>
    </section>
  );
}
