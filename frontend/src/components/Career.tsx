import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowDown, ArrowUpRight, BriefcaseBusiness, CalendarDays, Copy, Download, FileText, Printer, Sparkles, X } from "lucide-react";
import { getJobFair, tailorCareer } from "../api";
import type { CareerAdvice, JobFair, Profile } from "../api";
import { importantImage, skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";
import { publicProfessionalLinks } from "../config/profileLinks";

const areaFilters = {
  Cloud: /\b(cloud|nuvem|infraestrutura)\b/,
  Dados: /\b(dados|data|dataops|analytics)\b/,
  IA: /\b(ia|ml|machine learning|inteligencia artificial|agentes)\b/,
  Dev: /\b(devops|desenvolvimento|software|aplicac\w*|ti|automac\w*)\b/,
};
type Area = keyof typeof areaFilters;
const areas = Object.keys(areaFilters) as Area[];
const normalize = (value: string) => value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");

function CompanyLogo({ name, id }: { name: string; id: string }) {
  const [failed, setFailed] = useState(false);
  const filename = id === "almaviva" ? id : normalize(name).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return <div className="company-logo">
    {failed ? <span aria-hidden="true">{name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span>
      : <img src={importantImage(`${filename}.png`)} alt="" loading="lazy" onError={() => setFailed(true)} />}
  </div>;
}

function Resume({ profile, advice }: { profile: Profile; advice: CareerAdvice }) {
  const resume = useRef<HTMLElement>(null);
  const [status, setStatus] = useState("");
  const projects = [...new Set(advice.project_ids)].flatMap((id) => profile.projects.filter((item) => item.id === id));
  const credentials = [...new Set(advice.credential_ids)].flatMap((id) => profile.credentials.filter((item) => item.id === id));
  const skills = [...new Set(advice.skills)];

  function download() {
    const article = resume.current;
    if (!article) return;
    const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Currículo · Nicolas Hub</title><style>body{font:15px/1.5 Arial,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#18202a}h2,h3,p{margin:.4em 0}section{margin-top:1.2rem}h3{border-bottom:1px solid #bac3cf}mark{color:inherit;background:#e6eef8}a{color:#223b56}.resume-links{display:flex;gap:.7rem;flex-wrap:wrap}@media print{body{margin:0;padding:0}h3{break-after:avoid}.resume-entry{break-inside:avoid}}</style><body>${article.outerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nicolas-curriculo.html";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copy() {
    const article = resume.current;
    if (!article) return;
    try {
      if (typeof ClipboardItem === "undefined") throw new Error();
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([article.outerHTML], { type: "text/html" }),
        "text/plain": new Blob([article.innerText], { type: "text/plain" }),
      })]);
      setStatus("Currículo formatado copiado.");
    } catch {
      try {
        await navigator.clipboard.writeText(article.innerText);
        setStatus("Currículo copiado em texto. Use o download para obter o HTML formatado.");
      } catch { setStatus("A cópia está indisponível neste navegador. Use o download em HTML."); }
    }
  }
  return (
    <section className="resume-section">
      <div className="resume-top no-print">
        <h2><FileText size={21} /> Currículo sob medida</h2>
        <div className="resume-tools">
          <button className="button secondary" type="button" onClick={() => void copy()}><Copy size={16} /> Copiar currículo</button>
          <button className="button secondary" type="button" onClick={download}><Download size={16} /> Baixar HTML</button>
          <button className="button primary" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir / Salvar PDF</button>
        </div>
      </div>
      {status && <p className="no-print" role="status">{status}</p>}
      <article ref={resume} className="resume">
        <header>
          <h2>{profile.name}</h2>
          <p>{profile.headline}</p>
          <p className="resume-target">Objetivo: {advice.role}</p>
          <div className="resume-links">{publicProfessionalLinks.map((link) => (
            <a href={link.url} key={link.label} target="_blank" rel="noopener noreferrer">{link.url.replace(/^https:\/\//, "").replace(/\/$/, "")}</a>
          ))}</div>
        </header>
        <section><h3>Perfil profissional</h3><p>{profile.summary}</p></section>
        {skills.length > 0 && <section><h3>Competências em destaque para a vaga</h3>
          <p>{skills.map((skill, index) => <span key={skill}>{index > 0 && " · "}<mark>{skill}</mark></span>)}</p>
        </section>}
        {projects.length > 0 && <section><h3>Projetos selecionados</h3>{projects.map((project) => (
          <div className="resume-entry" key={project.id}><strong>{project.title}</strong><p>{project.summary}</p><small>{project.stack.join(" · ")}</small></div>
        ))}</section>}
        <section><h3>Formação</h3>{profile.education.map((entry) => (
          <div className="resume-entry" key={entry.title}><strong>{entry.title}</strong><p>{entry.organization} · {entry.period}</p></div>
        ))}</section>
        <section><h3>Experiência</h3>{profile.experience.map((entry) => (
          <div className="resume-entry" key={entry.title}><strong>{entry.title}</strong><p>{entry.organization} · {entry.period}</p>
            <ul>{entry.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
          </div>
        ))}</section>
        {credentials.length > 0 && <section><h3>Certificações e formação complementar</h3><ul>{credentials.map((item) => <li key={item.id}>{item.title} · {item.status}</li>)}</ul></section>}
        <section><h3>Idiomas</h3><p>{profile.languages.map((language) => `${language.name} (${language.level})`).join(" · ")}</p></section>
      </article>
    </section>
  );
}

export default function Career({ profile, token, onSignIn, openAnalysis }: { profile: Profile | null; token: string; onSignIn: () => void; openAnalysis: boolean }) {
  const [fair, setFair] = useState<JobFair | null>(null);
  const [fairError, setFairError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [filter, setFilter] = useState("");
  const [area, setArea] = useState<Area | "">("");
  const [companyId, setCompanyId] = useState("");
  const [description, setDescription] = useState("");
  const [advice, setAdvice] = useState<CareerAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fitDialog = useRef<HTMLDialogElement>(null);
  const resume = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openAnalysis && !fitDialog.current?.open) fitDialog.current?.showModal();
  }, [openAnalysis]);

  useEffect(() => {
    const controller = new AbortController();
    setFairError("");
    getJobFair(controller.signal).then(setFair).catch(() => {
      if (!controller.signal.aborted) setFairError("Não foi possível carregar o guia da feira.");
    });
    return () => controller.abort();
  }, [loadAttempt]);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!token || description.trim().length < 30 || busy) return;
    setBusy(true);
    setAdvice(null);
    setError("");
    try {
      setAdvice(await tailorCareer(description, companyId, token));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível analisar a vaga.");
    } finally {
      setBusy(false);
    }
  }

  const matchingCompanies = fair?.companies.filter((company) =>
    normalize(`${company.name} ${company.areas}`).includes(normalize(filter.trim()))
      && (!area || areaFilters[area].test(normalize(company.areas))),
  );

  return (
    <div className="career-page">
      <div className="no-print">
        <section className="workspace-hero career-hero">
          <div>
            <div className="eyebrow"><BriefcaseBusiness size={17} /> Preparação de carreira</div>
            <h1>Carreira e fit cultural</h1>
            <p>Conheça as empresas da feira, compare os requisitos de uma vaga com meu perfil e gere um currículo sob medida.</p>
            <div className="actions">
              <button type="button" className="button primary" onClick={() => fitDialog.current?.showModal()}><Sparkles size={16} /> Gerar currículo sob medida</button>
              <span className="feature-version">Em breve — v2.0</span>
              <a className="button secondary" href="/#planos-2027">Ver planos para 2027 <ArrowUpRight size={16} /></a>
            </div>
          </div>
          <AvatarStage skin={skins.wave} dialogue="Vamos conectar projetos, competências e oportunidades." priority />
        </section>
        <section className="page-section">
          <div className="section-heading"><CalendarDays size={23} /><h2>Job Fair Google Cloud · 02/12/2026</h2></div>
          <p className="muted">Áreas, contatos profissionais e links publicados no guia da 12ª edição.</p>
          {fairError && <div className="actions"><p role="alert" className="error">{fairError}</p><button className="button secondary" type="button" onClick={() => setLoadAttempt((current) => current + 1)}>Tentar novamente</button></div>}
          {!fair && !fairError && <p role="status" className="muted">Carregando empresas…</p>}
          {fair && (
            <>
              <label className="field-label" htmlFor="company-search">Buscar empresa ou área ({fair.companies.length} empresas)</label>
              <input id="company-search" className="search" type="search" placeholder="Ex.: dados, cloud ou IPNET" value={filter} onChange={(event) => setFilter(event.target.value)} />
              <div className="company-filters" role="group" aria-label="Filtrar por área">
                <button type="button" aria-pressed={area === ""} onClick={() => setArea("")}>Todas</button>
                {areas.map((item) => <button type="button" key={item} aria-pressed={area === item} onClick={() => setArea(item)}>{item}</button>)}
              </div>
              <p className="muted company-count" role="status">{matchingCompanies?.length} de {fair.companies.length} empresas</p>
            </>
          )}
          {matchingCompanies?.length === 0 && <p role="status" className="muted">Nenhuma empresa encontrada.</p>}
          <div className="card-grid company-grid">
            {matchingCompanies?.map((company) => (
              <article className="panel company" key={company.id}>
                <CompanyLogo id={company.id} name={company.name} />
                <h3>{company.name}</h3><p>{company.areas}</p>
                <details><summary>Cultura e contatos</summary>
                  <p>{company.culture}</p>
                  <ul>{company.contacts.map((email) => <li key={email}><a href={`mailto:${email}`}>{email}</a></li>)}</ul>
                </details>
                <div className="actions">
                  {company.jobs && <a href={company.jobs} target="_blank" rel="noopener noreferrer">Vagas <ArrowUpRight size={14} /></a>}
                  {company.linkedin && <a href={company.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>}
                  <button className="feature-link" type="button" onClick={() => { setCompanyId(company.id); fitDialog.current?.showModal(); }}>Analisar vaga <ArrowUpRight size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <dialog ref={fitDialog} className="showcase-dialog fit-dialog" aria-labelledby="fit-title">
          <div className="dialog-heading"><h2 id="fit-title">Analisar vaga com Gemini</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => fitDialog.current?.close()}><X size={20} /></button></div>
          <form onSubmit={generate}>
            <label htmlFor="company">Empresa da feira (opcional)</label>
            <select id="company" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
              <option value="">Outra empresa ou sem seleção</option>
              {fair?.companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}
            </select>
            <label htmlFor="description">Descrição da vaga</label>
            <textarea id="description" rows={6} placeholder="Cole a descrição, com requisitos, responsabilidades e informações sobre a equipe." minLength={30} maxLength={14000} value={description} onChange={(event) => setDescription(event.target.value)} required />
            <div className="actions">
              {token
                ? <button className="button primary" type="submit" disabled={busy || !profile || description.trim().length < 30}><Sparkles size={16} /> {busy ? "Analisando vaga…" : "Gerar análise e currículo"}</button>
                : <button className="button primary" type="button" onClick={onSignIn}>Entrar para analisar</button>}
            </div>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
          {advice && (
          <section className="fit-result" aria-live="polite">
            <div className="section-heading"><BriefcaseBusiness size={23} /><h2>Análise de fit · {advice.role}</h2></div>
            <p className="multiline">{advice.fit_summary}</p>
            <div className="card-grid fit-grid">
              {([["Aderência", advice.matches], ["Lacunas", advice.gaps], ["Perguntas para a entrevista", advice.questions]] as const).map(([title, entries]) => (
                <div key={title}><h3>{title}</h3>{entries.length
                  ? <ul>{entries.map((entry, index) => <li key={index}>{entry}</li>)}</ul>
                  : <p className="muted">Sem itens identificados.</p>}</div>
              ))}
            </div>
            {profile && <div className="actions"><button type="button" className="button secondary" onClick={() => { fitDialog.current?.close(); resume.current?.scrollIntoView({ block: "start" }); }}><ArrowDown size={17} /> Ver currículo</button></div>}
          </section>
          )}
        </dialog>
      </div>
      {profile && advice && <div ref={resume} className="career-resume"><Resume profile={profile} advice={advice} /></div>}
    </div>
  );
}
