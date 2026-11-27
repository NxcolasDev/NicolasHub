import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Award, Plus, X } from "lucide-react";
import type { Profile, ProfileCredential } from "../api";
import assets from "../data/assets.json";
import { importantImage, skins } from "../data/sprites";
import { professionalLinks, referenceLinks } from "../config/profileLinks";
import { AvatarStage } from "./PixelAvatar";

type Certificate = { title: string; issuer: string; link: string; learning: string; image: string };
const storageKey = "nicolas-hub-certificates";
const providerLearning: Record<string, string> = {
  "aws-foundations": "Fundamentos da nuvem AWS, serviços principais, responsabilidade compartilhada e modelos de custo.",
  "aws-architecting": "Como escolher serviços AWS e desenhar soluções com disponibilidade, segurança e operação em mente.",
  "aws-essentials": "Visão geral de computação, armazenamento, redes, segurança e precificação na AWS.",
  "gcp-skills": "Prática de redes, balanceamento de carga, desenvolvimento de aplicações e preparação de dados para APIs de ML.",
  "gcp-foundations": "Trilha em andamento sobre infraestrutura, aplicações, redes e serviços de dados no Google Cloud.",
};
const assetLearning: Record<string, string> = {
  "Comunicação Empresarial": "Organização de mensagens e adaptação da comunicação ao público no ambiente profissional.",
  "Projeto com Interface Gráfica": "Construção de interfaces em Python e ligação dos controles à lógica de uma aplicação.",
  Excel: "Organização de planilhas e análise de dados com fórmulas e recursos do Excel.",
  "Python Basics": "Variáveis, controle de fluxo e funções para resolver problemas com Python.",
  "Python · Programação Orientada a Objetos": "Modelagem de classes e objetos para organizar dados e comportamento em Python.",
  "Lógica em Python": "Decomposição de problemas em algoritmos com condições e laços.",
  "Google Cloud Computing Foundations · 1": "Conceitos de cloud, infraestrutura e serviços do Google Cloud.",
  "Google Cloud Computing Foundations · 2": "Serviços de infraestrutura de nuvem e escolhas de computação e armazenamento.",
  "Google Cloud Computing Foundations · 3": "Fundamentos de redes e segurança no Google Cloud.",
  "Google Cloud Computing Foundations · 4": "Introdução a dados, análise e machine learning no Google Cloud.",
  "Google Cloud · Credencial": providerLearning["gcp-skills"],
};

function isHttps(url: string) {
  try { return new URL(url).protocol === "https:"; }
  catch { return false; }
}

function readCertificates(): Certificate[] {
  try {
    const certificates: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(certificates)) return [];
    return certificates.filter((item): item is Certificate =>
      item && ["title", "issuer", "link", "learning", "image"].every((field) => typeof item[field] === "string")
      && isHttps(item.link) && (!item.image || isHttps(item.image)),
    );
  } catch {
    return [];
  }
}

export function VerifiedCredential({ credential, onPreview }: {
  credential: ProfileCredential;
  onPreview?: () => void;
}) {
  if (!credential.verification_url) return null;

  return (
    <a className="verified-credential" href={credential.verification_url} target="_blank" rel="noopener noreferrer" onPointerEnter={onPreview} onFocus={onPreview}>
      {credential.badge_path && <img src={credential.badge_path} alt="" width={44} height={44} />}
      <span className="verified-credential-copy">
        <strong>{credential.title}</strong>
        <small>{credential.status}</small>
        <span className="verified-credential-link">Verificar no Credly <ArrowUpRight size={14} aria-hidden="true" /></span>
      </span>
    </a>
  );
}

export default function Certificates({ profile, admin }: { profile: Profile | null; admin: boolean }) {
  const [saved, setSaved] = useState(readCertificates);
  const [selection, setSelection] = useState<{ title: string; learning: string } | null>(null);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const linkedIn = professionalLinks.LinkedIn;
  const credly = professionalLinks.Credly;

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admin) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (field: string) => String(fields.get(field) ?? "").trim();
    const certificate = { title: value("title"), issuer: value("issuer"), link: value("link"), learning: value("learning"), image: value("image") };
    if (!certificate.title || !certificate.issuer || !certificate.learning || !isHttps(certificate.link) || (certificate.image && !isHttps(certificate.image))) {
      setError("Preencha título, emissor e aprendizado. Use endereços HTTPS para a credencial e a imagem.");
      return;
    }
    const next = [...saved, certificate];
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setError("O navegador não conseguiu salvar. Verifique o armazenamento local."); return; }
    setSaved(next);
    setSelection(certificate);
    form.reset();
    dialog.current?.close();
  }

  return (
    <section id="certificacoes" className="chapter chapter-dark">
      <div className="shell">
        <div className="chapter-kicker"><Award size={17} /> Formação complementar</div>
        <h2>Certificados e badges</h2>
        <div className="actions">
          <a href={credly || referenceLinks.awsBadges} className="button secondary" target="_blank" rel="noopener noreferrer">{credly ? "Meu Credly" : "Badges AWS no Credly"} <ArrowUpRight size={15} /></a>
          {linkedIn && <a href={linkedIn} className="button secondary" target="_blank" rel="noopener noreferrer">Perfil no LinkedIn <ArrowUpRight size={15} /></a>}
          <a href="https://www.cloudskillsboost.google/" className="button secondary" target="_blank" rel="noopener noreferrer">Google Cloud Skills Boost <ArrowUpRight size={15} /></a>
          {admin && <button type="button" className="button primary" onClick={() => { setError(""); dialog.current?.showModal(); }}><Plus size={17} /> Cadastrar certificado</button>}
        </div>
        <div className="certificate-showcase">
          <div>
            <div className="card-grid chapter-cards">
              {profile?.credentials.map((entry) => {
                const preview = () => setSelection({ title: entry.title, learning: entry.learning ?? providerLearning[entry.id] ?? entry.status });
                if (entry.verification_url) return <VerifiedCredential key={entry.id} credential={entry} onPreview={preview} />;

                const provider = entry.id.startsWith("aws");
                return <button type="button" className="panel certificate-provider" key={entry.id} onPointerEnter={preview} onFocus={preview} onClick={preview} aria-controls="certificate-preview">
                  <img src={importantImage(provider ? "aws.png" : "gcp.png")} alt="" loading="lazy" />
                  <span><strong>{entry.title}</strong><small className="muted">{entry.status}</small></span>
                </button>;
              })}
            </div>
            <div className="asset-grid credential-grid">
              {[...assets.badges, ...assets.certificados].map((asset) => {
                const learning = assetLearning[asset.title]
                  ?? (asset.title.includes("Foundations") ? providerLearning["aws-foundations"] : undefined)
                  ?? (asset.title.includes("Architecting") ? providerLearning["aws-architecting"] : "Aprendizado ainda sem descrição.");
                const preview = () => setSelection({ title: asset.title, learning });
                return <a className="asset-card credential" key={asset.path} href={asset.path} target="_blank" rel="noopener noreferrer" onPointerEnter={preview} onFocus={preview}>
                  {asset.kind === "image" ? <img src={asset.path} alt="" loading="lazy" /> : <Award size={23} />}
                  <span><strong>{asset.title}</strong><small>{asset.kind === "pdf" ? "Visualizar PDF" : "Abrir imagem"}</small></span><ArrowUpRight size={17} />
                </a>;
              })}
              {saved.map((entry, index) => {
                const preview = () => setSelection(entry);
                return <a className="asset-card credential" key={index} href={entry.link} target="_blank" rel="noopener noreferrer" onPointerEnter={preview} onFocus={preview}>
                  {entry.image ? <img src={entry.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Award size={23} />}
                  <span><strong>{entry.title}</strong><small>{entry.issuer}</small></span><ArrowUpRight size={17} />
                </a>;
              })}
            </div>
          </div>
          <aside id="certificate-preview" className="certificate-preview" aria-live="polite">
            <h3>{selection?.title ?? "O que aprendi"}</h3>
            <AvatarStage skin={skins.middle} dialogue={selection?.learning ?? "Passe pelo certificado ou selecione uma credencial para ler sobre o aprendizado."} />
          </aside>
        </div>
        {admin && <dialog className="showcase-dialog" ref={dialog} aria-labelledby="certificate-form-title">
          <div className="dialog-heading"><h2 id="certificate-form-title">Cadastrar certificado</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button></div>
          <p className="muted">As credenciais adicionadas aqui ficam neste navegador.</p>
          <form onSubmit={add}>
            <label htmlFor="certificate-title">Título</label><input id="certificate-title" name="title" maxLength={120} required />
            <label htmlFor="certificate-issuer">Emissor</label><input id="certificate-issuer" name="issuer" maxLength={120} required />
            <label htmlFor="certificate-link">Link da credencial</label><input id="certificate-link" name="link" type="url" maxLength={2048} required />
            <label htmlFor="certificate-learning">O que você aprendeu?</label><textarea id="certificate-learning" name="learning" rows={3} maxLength={600} required />
            <label htmlFor="certificate-image">URL da imagem (opcional)</label><input id="certificate-image" name="image" type="url" maxLength={2048} />
            {error && <p className="error" role="alert">{error}</p>}
            <div className="actions"><button type="submit" className="button primary">Salvar certificado</button></div>
          </form>
        </dialog>}
      </div>
    </section>
  );
}
