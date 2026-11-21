import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Cloud, Database, Dumbbell, Gamepad2, Terminal } from "lucide-react";
import type { Profile } from "../api";
import assets from "../data/assets.json";
import { importantImage, skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";
import { professionalLinks, publicProfessionalLinks, referenceLinks } from "../config/profileLinks";
import Certificates from "./Certificates";
import ProjectShowcase from "./ProjectShowcase";
import LanguageSection from "./LanguageSection";

const awsLogo = importantImage("aws.png");
const cloudLogo = importantImage("gcp.png");
const universityLogo = importantImage("unifaat.png");

export function Diagram() {
  return (
    <div className="asset-grid single">
      {assets.arquitetura.map((asset) => (
        <a className="asset-card" key={asset.path} href={asset.path} target="_blank" rel="noopener noreferrer">
          <img src={asset.path} alt="Diagrama de arquitetura VPC para estudo de redes" loading="lazy" />
          <span>{asset.title} <ArrowUpRight size={16} /></span>
        </a>
      ))}
    </div>
  );
}

const bonusModes = [
  ["kiro", "Mascote Kiro"],
  ["jett", "Jett"],
  ["trainer", "Treinador Pokémon"],
  ["builder", "Builder"],
  ["music", "Música"],
  ["special", "Transformação especial"],
] as const;
const welcomeModes = [
  ["welcome", "BEM-VINDO AO NICOLAS HUB!"],
  ["wave", "Aceno do lobby"],
  ["react", "Toque e reação"],
  ...bonusModes,
] as const;
type LobbySkin = (typeof welcomeModes)[number][0];
const rotation: readonly LobbySkin[] = ["welcome", "trainer", "jett", "kiro"];
const rotationDelays = [5_000, 10_000, 15_000, 20_000];

function Lobby() {
  const menu = useRef<HTMLDetailsElement>(null);
  const [avatar, setAvatar] = useState<{ mode: LobbySkin; version: number; step: number }>({ mode: "welcome", version: 0, step: 0 });

  function chooseSkin(mode: LobbySkin) {
    if (menu.current?.open) {
      menu.current.querySelector("summary")?.focus();
      menu.current.open = false;
    }
    setAvatar((current) => ({ ...current, mode, version: current.version + 1 }));
  }

  useEffect(() => {
    let timer: number;
    function schedule() {
      window.clearTimeout(timer);
      if (document.hidden) return;
      timer = window.setTimeout(() => {
        if (menu.current?.open) {
          schedule();
          return;
        }
        setAvatar((current) => {
          const index = rotation.indexOf(current.mode);
          const mode = rotation[index === -1 ? 1 : (index + 1) % rotation.length];
          return { mode, version: current.version + 1, step: Math.min(current.step + 1, rotationDelays.length - 1) };
        });
      }, rotationDelays[avatar.step]);
    }
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [avatar.version, avatar.step]);

  return (
    <div className="lobby">
      <AvatarStage
        key={avatar.version}
        skin={avatar.mode === "welcome" && avatar.version > 0 ? skins.middle : skins[avatar.mode]}
        dialogue={welcomeModes.find(([mode]) => mode === avatar.mode)![1]}
        priority
      />
      <div className="lobby-controls">
        <button type="button" aria-pressed={avatar.mode === "wave"} onClick={() => chooseSkin("wave")}>Acenar</button>
        <button type="button" aria-pressed={avatar.mode === "react"} onClick={() => chooseSkin("react")}>Reagir</button>
        <details ref={menu} onKeyDown={(event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}>
          <summary><Gamepad2 size={16} /> Modos do avatar</summary>
          <div className="avatar-menu">
            {bonusModes.map(([mode, label]) => (
              <button key={mode} type="button" aria-pressed={avatar.mode === mode} onClick={() => chooseSkin(mode)}>{label}</button>
            ))}
            <button type="button" aria-pressed={avatar.mode === "welcome"} onClick={() => chooseSkin("welcome")}>Padrão</button>
          </div>
        </details>
      </div>
    </div>
  );
}

function Block({ id, side, children, tone = "dark" }: {
  id: string;
  side: ReactNode;
  children: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <section id={id} className={`chapter chapter-${tone}`}>
      <div className="scene-frame chapter-layout">
        <div className="chapter-aside">{side}</div>
        <div className="chapter-body">{children}</div>
      </div>
    </section>
  );
}

function ExtendedLook({ profile }: { profile: Profile | null }) {
  const banner = assets.eventos.find((asset) => asset.path.endsWith("/aws-student-day-pt2.jpeg"));
  const linkedIn = professionalLinks.LinkedIn;
  return (
    <section id="olhar-estendido" className="extended-look" aria-labelledby="extended-title">
      <div className="scene-frame extended-banner">
        {banner && <img src={banner.path} alt="" loading="lazy" />}
          <div className="extended-banner-copy">
          <div className="chapter-kicker">AWS Student Data · Comunidade e projetos</div>
          <h2 id="extended-title">Um Olhar<br />Estendido.</h2>
          <div className="actions">
            <a className="button primary" href="#eventos">Ver eventos <ArrowDown size={16} /></a>
            <a className="button secondary" href="/arquitetura">Explorar arquitetura <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </div>

      <div className="shell extended-grid">
        <article id="formacao" className="extended-feature">
          <AvatarStage skin={skins.college} dialogue="Do conteúdo da faculdade à prática." />
          <div className="extended-copy">
            <img className="university-logo" src={universityLogo} alt="UniFAAT" loading="lazy" />
            <h3>Sobre mim e formação</h3>
            <p>Estudo Análise e Desenvolvimento de Sistemas na UniFAAT e aplico o conteúdo das aulas em projetos de APIs, bancos de dados e infraestrutura.</p>
            {profile && <ul className="timeline">
              {[...profile.education, ...profile.experience].map((entry) => (
                <li key={entry.title}><strong>{entry.title}</strong><span>{entry.organization} · {entry.period}</span></li>
              ))}
            </ul>}
            <div className="actions">
              <a className="button primary" href="/academia#provas">Revisar para provas <ArrowRight size={16} /></a>
              {linkedIn && <a className="button secondary" href={linkedIn} target="_blank" rel="noopener noreferrer">Perfil e publicações no LinkedIn <ArrowUpRight size={16} /></a>}
            </div>
          </div>
        </article>
        <article className="extended-feature">
          <AvatarStage skin={skins.kiro} dialogue="O Kiro também veio explorar." />
          <div className="extended-copy">
            <div className="chapter-kicker"><Gamepad2 size={17} /> Easter egg</div>
            <h3>Mascote Kiro</h3>
            <a className="feature-link" href="#eventos">Ver registros do evento <ArrowDown size={15} /></a>
          </div>
        </article>
      </div>

      <section id="eventos" className="chapter">
        <div className="shell">
          <h3 className="extended-subtitle">Eventos e conquistas</h3>
          {["Kiro", "AWS Student Data"].map((event) => {
            const details = profile?.events.find((item) => item.name === event);
            return <div className="event-group" key={event}>
              <h4>{event}</h4>
              {details && <p className="muted">{details.summary}</p>}
              {event === "Kiro" && <div className="event-debrief">
                <p>No cenário de recuperação da TechNova, trabalhei camada por camada: corrigi o build Docker e os healthchecks do Compose, investiguei a conexão entre a API e o banco e revisei rede, permissões e estado remoto no Terraform.</p>
                <p>Usei o Kiro para investigar cada fase e validei as mudanças com verificações locais e GitHub Actions. O exercício foi uma prática de diagnóstico de incidentes, isolamento de problemas e verificação de mudanças de infraestrutura.</p>
                <a className="feature-link" href={referenceLinks.kiro} target="_blank" rel="noopener noreferrer">Relatório do desafio <ArrowUpRight size={16} /></a>
              </div>}
              <div className="asset-grid">
                {assets.eventos.filter((asset) => asset.collection === event).map((asset) => (
                  <a className="asset-card event" key={asset.path} href={asset.path} target="_blank" rel="noopener noreferrer">
                    <img src={asset.path} alt={asset.title} loading="lazy" />
                    <span>{asset.title} <ArrowUpRight size={16} /></span>
                  </a>
                ))}
              </div>
            </div>;
          })}
        </div>
      </section>
      <Block id="calistenia" side={<AvatarStage skin={skins.workout} dialogue="Uma repetição de cada vez." />}>
        <div className="chapter-kicker"><Dumbbell size={17} /> Hobbies</div>
        <h3 className="extended-subtitle">Calistenia e academia</h3>
        <p>Treino de força e movimento fora dos estudos e do trabalho.</p>
      </Block>
    </section>
  );
}

export default function Portfolio({ profile, admin }: { profile: Profile | null; admin: boolean }) {
  const recora = profile?.projects.find((project) => project.id === "recora");
  return (
    <>
      <section className="hub-hero" aria-labelledby="hero-title">
        <div className="scene-frame hub-hero-layout">
          <Lobby />
          <div className="hero-copy">
            <div className="chapter-kicker"><span /> Portfólio de Nicolas de Jesus Silva</div>
            <h1 id="hero-title">Nicolas <em>Hub</em></h1>
            <p className="hero-brief">Cloud, DevOps &amp; Backend</p>
            <p>{profile?.summary ?? "Estudante de Análise e Desenvolvimento de Sistemas na UniFAAT, com foco em aplicações full-stack, automação e arquitetura em nuvem."}</p>
            <div className="actions">
              <a className="button primary" href="/arquitetura">Explorar arquitetura <ArrowRight size={17} /></a>
              <a className="button secondary" href="/academia#terminal"><Terminal size={17} /> Abrir Coding Gym</a>
            </div>
            <div className="profile-links">{publicProfessionalLinks.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <ArrowUpRight size={15} /></a>
            ))}</div>
          </div>
        </div>
      </section>

      <Block id="arquitetura" tone="light" side={<AvatarStage skin={skins.cloud} dialogue="Vamos seguir o caminho de um evento." />}>
        <div className="chapter-kicker"><Cloud size={17} /> Cloud Architecture</div>
        <h2>Da API à fila.</h2>
        <p>O desenho coloca a API FastAPI no Cloud Run, com PostgreSQL no Neon e telemetria na Amazon SQS. O Terraform define a infraestrutura e o AWS STS fornece credenciais temporárias para publicar na fila.</p>
        <div className="cloud-flow" aria-label="Caminho do evento na arquitetura proposta">
          <div><img src={cloudLogo} alt="Google Cloud" loading="lazy" /><strong>Cloud Run</strong><small>FastAPI</small></div>
          <ArrowRight aria-hidden="true" size={17} />
          <div><img src={awsLogo} alt="AWS" loading="lazy" /><strong>Amazon SQS</strong><small>Telemetria</small></div>
        </div>
        <div className="actions">
          <a className="button primary" href="/arquitetura">Explorar topologia interativa <ArrowRight size={16} /></a>
        </div>
        <details className="cloud-diagram">
          <summary>Ver diagrama VPC de estudo</summary>
          <Diagram />
        </details>
      </Block>

      {profile && <ProjectShowcase profile={profile} />}

      <Block id="recora" side={<AvatarStage skin={skins.recora} dialogue="Do primeiro contato à reativação, cada lead importa." />}>
        <div className="chapter-kicker"><Database size={17} /> Trabalho de Conclusão de Curso · UniFAAT</div>
        <h2>RECORA</h2>
        <p className="recora-status">Em desenvolvimento ativo — MVP TCC 2026</p>
        <p>{recora?.summary ?? "Plataforma para organizar o processo comercial de empresas que vendem planos de saúde. Centraliza cadastro de leads, funil, histórico de interações, follow-ups e reativação de oportunidades, com validação de CNPJ via BrasilAPI."}</p>
        <ul className="tags recora-stack" aria-label="Tecnologias do RECORA">
          {(recora?.stack ?? ["React", "TypeScript", "Vite", "Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker", "AWS S3", "Amazon ECR", "Amazon ECS / Fargate", "Terraform", "Prometheus", "Grafana", "Ollama", "BrasilAPI"]).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </Block>

      <LanguageSection profile={profile} />

      <Block id="coding" side={<AvatarStage skin={skins.laptop} dialogue="Escreva sua solução e rode os testes." />}>
        <div className="chapter-kicker"><Terminal size={16} /> Coding Gym</div>
        <h2>Pratique no terminal.</h2>
        <p>Resolva missões em Python e acompanhe o que seu código fez com cada entrada no console.</p>
        <div className="actions">
          <a className="button primary" href="/academia#terminal"><Terminal size={16} /> Treino de lógica</a>
        </div>
      </Block>
      <Block id="coding-dados" side={<AvatarStage skin={skins.databases} dialogue="SQL ou NoSQL? A consulta começa aqui." />}>
        <div className="chapter-kicker"><Database size={16} /> Coding Gym</div>
        <h2>Bancos de dados.</h2>
        <p>Revise consultas SQL, consistência de transações e quando escolher um banco relacional ou NoSQL.</p>
        <div className="actions">
          <a className="button primary" href="/academia#bancos">Abrir trilha de bancos <ArrowRight size={16} /></a>
        </div>
      </Block>

      <ExtendedLook profile={profile} />

      <Certificates profile={profile} admin={admin} />

      <Block id="planos-2027" side={<AvatarStage skin={skins.future} dialogue="Próxima parada: 2027." />}>
        <div className="chapter-kicker">Visão de futuro</div>
        <h2>Planos para 2027</h2>
        <ol className="future-roadmap">
          <li><strong>Primeira oportunidade efetiva</strong><p>Conquistar uma vaga em Cloud, DevOps ou Engenharia de Backend.</p></li>
          <li><strong>Certificações e idiomas</strong><p>Obter AWS Certified Cloud Practitioner e Google Cloud Associate Cloud Engineer. Buscar IELTS em inglês e DELF em francês.</p></li>
          <li><strong>Carreira internacional</strong><p>Expandir o portfólio com projetos de arquitetura distribuída e IA e trabalhar com equipes internacionais.</p></li>
        </ol>
        <details className="roadmap-detail">
          <summary className="button secondary">Ver cronograma detalhado de 2027</summary>
          <ol className="future-roadmap roadmap-quarters">
            <li><strong>1º trimestre · janeiro a março</strong><p>Fazer a prova AWS Cloud Practitioner e atualizar currículo, LinkedIn e portfólio para candidaturas em Cloud, DevOps e Backend.</p></li>
            <li><strong>2º trimestre · abril a junho</strong><p>Preparar e fazer a prova Google Cloud Associate Cloud Engineer, praticar com um projeto multicloud e fazer um simulado IELTS.</p></li>
            <li><strong>3º trimestre · julho a setembro</strong><p>Fazer a prova IELTS, intensificar a preparação para o DELF e publicar um projeto de arquitetura distribuída com IA.</p></li>
            <li><strong>4º trimestre · outubro a dezembro</strong><p>Fazer a prova DELF, consolidar o portfólio técnico e dar continuidade à busca pelo primeiro emprego tech e por equipes internacionais.</p></li>
          </ol>
        </details>
      </Block>
    </>
  );
}
