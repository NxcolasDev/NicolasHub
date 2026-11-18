import { ArrowRight, ArrowUpRight, Award, Blocks, BriefcaseBusiness, Cloud, GitBranch, GraduationCap, Languages, MapPin, Network, Sparkles } from "lucide-react";
import type { Profile } from "../api";
import assets from "../data/assets.json";

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

export default function Portfolio({ profile }: { profile: Profile | null }) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow"><Cloud size={16} /> Portfólio técnico</div>
          <h1>Nicolas de <span>Jesus Silva</span></h1>
          <p className="hero-role">Cloud, DevOps <span>&</span> Backend</p>
          <p className="hero-summary">{profile?.summary ?? "Estudante de Análise e Desenvolvimento de Sistemas na UniFAAT, com foco em aplicações full-stack, automação e arquitetura em nuvem."}</p>
          <div className="actions">
            <a className="button primary" href="#academia">Explorar academia <ArrowRight size={16} /></a>
            {profile?.links.map((link) => (
              <a className="button secondary" key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label} <ArrowUpRight size={15} />
              </a>
            ))}
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="orbit-core"><Cloud size={59} strokeWidth={1.15} /></div>
          <span className="orbit-node orbit-top"><Network size={21} /></span>
          <span className="orbit-node orbit-left"><GitBranch size={21} /></span>
          <span className="orbit-node orbit-right"><Blocks size={21} /></span>
          <span className="orbit-node orbit-bottom"><Sparkles size={19} /></span>
        </div>
      </section>

      <div className="portfolio-facts">
        <div><GraduationCap size={21} /><span><strong>UniFAAT</strong><small>Análise e Desenvolvimento de Sistemas</small></span></div>
        <div><Cloud size={21} /><span><strong>AWS e Google Cloud</strong><small>Infraestrutura e arquitetura</small></span></div>
        <div><Languages size={21} /><span><strong>5 idiomas</strong><small>Português, inglês, francês, espanhol e italiano</small></span></div>
      </div>

      {profile && (
        <>
          <section className="page-section">
            <div className="section-heading"><Blocks size={23} /><h2>Projetos</h2></div>
            <div className="card-grid">
              {profile.projects.map((project) => (
                <article className="panel project" key={project.id}>
                  <h3>{project.title}</h3>
                  <p>{project.summary}</p>
                  <ul className="tags" aria-label="Tecnologias">{project.stack.map((skill) => <li key={skill}>{skill}</li>)}</ul>
                </article>
              ))}
            </div>
          </section>
          <section className="page-section split">
            <article className="panel">
              <div className="section-heading"><BriefcaseBusiness size={22} /><h2>Formação e experiência</h2></div>
              <ul className="timeline">
                {[...profile.education, ...profile.experience].map((entry) => (
                  <li key={entry.title}><strong>{entry.title}</strong><span>{entry.organization} · {entry.period}</span></li>
                ))}
              </ul>
            </article>
            <article className="panel">
              <div className="section-heading"><Languages size={22} /><h2>Idiomas</h2></div>
              <dl className="language-list">{profile.languages.map((language) => (
                <div key={language.name}><dt>{language.name}</dt><dd>{language.level}</dd></div>
              ))}</dl>
            </article>
          </section>
        </>
      )}

      <section className="page-section">
        <div className="section-heading"><Network size={23} /><h2>Arquitetura</h2></div>
        <Diagram />
      </section>

      <section className="page-section">
        <div className="section-heading"><MapPin size={23} /><h2>Eventos e conquistas</h2></div>
        {["Kiro", "AWS Student Data"].map((event) => {
          const details = profile?.events.find((item) => item.name === event);
          return <div className="event-group" key={event}>
            <h3>{event}</h3>
            {details && <p className="muted">{details.summary}</p>}
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
      </section>

      <section className="page-section">
        <div className="section-heading"><Award size={23} /><h2>Certificações e badges</h2></div>
        <ul className="timeline">
          {profile?.credentials.map((entry) => (
            <li key={entry.id}><strong>{entry.title}</strong><span>{entry.status}</span></li>
          ))}
        </ul>
        <div className="asset-grid">
          {[...assets.badges, ...assets.certificados].map((asset) => (
            <a className="asset-card credential" key={asset.path} href={asset.path} target="_blank" rel="noopener noreferrer">
              {asset.kind === "image" ? <img src={asset.path} alt="" loading="lazy" /> : <Award size={23} />}
              <span><strong>{asset.title}</strong><small>{asset.kind === "pdf" ? "Visualizar PDF" : "Abrir imagem"}</small></span>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
        <div className="actions">
          <a href="https://www.cloudskillsboost.google/" className="button secondary" target="_blank" rel="noopener noreferrer">
            Google Cloud Skills Boost <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </>
  );
}
