import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, Printer, Sparkles } from "lucide-react";
import { getJobFair, tailorCareer } from "../api";
import type { CareerAdvice, JobFair, Profile } from "../api";

function Resume({ profile, advice }: { profile: Profile; advice: CareerAdvice }) {
  const projects = [...new Set(advice.project_ids)].flatMap((id) => profile.projects.filter((item) => item.id === id));
  const credentials = [...new Set(advice.credential_ids)].flatMap((id) => profile.credentials.filter((item) => item.id === id));
  return (
    <section className="resume-section">
      <div className="resume-top no-print">
        <h2><FileText size={21} /> Currículo sob medida</h2>
        <button className="button primary" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir / Salvar PDF</button>
      </div>
      <article className="resume">
        <header>
          <h2>{profile.name}</h2>
          <p>{profile.headline}</p>
          <p className="resume-target">Objetivo: {advice.role}</p>
          <div className="resume-links">{profile.links.map((link) => (
            <a href={link.url} key={link.label} target="_blank" rel="noopener noreferrer">{link.url.replace(/^https:\/\//, "").replace(/\/$/, "")}</a>
          ))}</div>
        </header>
        <section><h3>Perfil profissional</h3><p>{profile.summary}</p></section>
        {advice.skills.length > 0 && <section><h3>Competências</h3><p>{[...new Set(advice.skills)].join(" · ")}</p></section>}
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

export default function Career({ profile, token, onSignIn }: { profile: Profile | null; token: string; onSignIn: () => void }) {
  const [fair, setFair] = useState<JobFair | null>(null);
  const [fairError, setFairError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [filter, setFilter] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [description, setDescription] = useState("");
  const [advice, setAdvice] = useState<CareerAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    `${company.name} ${company.areas}`.toLocaleLowerCase("pt-BR").includes(filter.trim().toLocaleLowerCase("pt-BR")),
  );

  return (
    <>
      <div className="no-print">
        <section className="page-intro">
          <div className="eyebrow"><BriefcaseBusiness size={17} /> Preparação de carreira</div>
          <h1>Carreira e Fit Cultural</h1>
          <p>Conheça as empresas da feira, analise uma vaga e monte um currículo a partir do perfil mestre.</p>
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
            </>
          )}
          {matchingCompanies?.length === 0 && <p role="status" className="muted">Nenhuma empresa encontrada.</p>}
          <div className="card-grid company-grid">
            {matchingCompanies?.map((company) => (
              <article className="panel company" key={company.id}>
                <h3>{company.name}</h3><p>{company.areas}</p>
                <details><summary>Cultura e contatos</summary>
                  <p>{company.culture}</p>
                  <ul>{company.contacts.map((email) => <li key={email}><a href={`mailto:${email}`}>{email}</a></li>)}</ul>
                </details>
                <div className="actions">
                  {company.jobs && <a href={company.jobs} target="_blank" rel="noopener noreferrer">Vagas <ArrowUpRight size={14} /></a>}
                  {company.linkedin && <a href={company.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>}
                  <a href="#analisar-vaga" onClick={() => setCompanyId(company.id)}>Analisar vaga <ArrowUpRight size={14} /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="analisar-vaga" className="panel page-section">
          <div className="section-heading"><Sparkles size={23} /><h2>Analisar vaga com Gemini</h2></div>
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
        </section>
        {advice && (
          <section className="panel page-section" aria-live="polite">
            <div className="section-heading"><BriefcaseBusiness size={23} /><h2>Análise de fit · {advice.role}</h2></div>
            <p className="multiline">{advice.fit_summary}</p>
            <div className="card-grid fit-grid">
              {([["Aderência", advice.matches], ["Lacunas", advice.gaps], ["Perguntas para a entrevista", advice.questions]] as const).map(([title, entries]) => (
                <div key={title}><h3>{title}</h3>{entries.length
                  ? <ul>{entries.map((entry, index) => <li key={index}>{entry}</li>)}</ul>
                  : <p className="muted">Sem itens identificados.</p>}</div>
              ))}
            </div>
          </section>
        )}
      </div>
      {profile && advice && <Resume profile={profile} advice={advice} />}
    </>
  );
}
