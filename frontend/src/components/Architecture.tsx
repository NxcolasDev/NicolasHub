import { useState } from "react";
import { ArrowUpRight, BrainCircuit, Cloud, Database, GitBranch, Laptop, Network, Workflow } from "lucide-react";
import { importantImage, skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";
import ArchitectureVideos from "./ArchitectureVideos";
import type { ArchitectureVideosProps } from "./ArchitectureVideos";
import { referenceLinks } from "../config/profileLinks";
import { Diagram } from "./Portfolio";

const nodes = {
  client: { title: "Client", service: "React / Vite", icon: Laptop, detail: "O navegador envia requisições HTTPS ao backend para carregar o portfólio e executar os fluxos de aprendizagem e carreira." },
  api: { title: "FastAPI", service: "Google Cloud Run", icon: Cloud, detail: "A API valida as entradas e coordena autenticação, persistência e integrações. O Cloud Run é o destino previsto no Terraform." },
  sqs: { title: "AWS SQS", service: "Fila de telemetria", icon: Workflow, detail: "A API publica eventos de telemetria na fila Amazon SQS e usa credenciais temporárias via AWS STS. A persistência principal ocorre diretamente pela API." },
  pubsub: { title: "GCP Pub/Sub", service: "Alternativa em estudo", icon: Network, detail: "No cenário de referência no Google Cloud, um tópico entrega mensagens para assinaturas. Um consumidor poderia gravar uma projeção no PostgreSQL." },
  neon: { title: "PostgreSQL", service: "Neon", icon: Database, detail: "A API grava contas e resultados no PostgreSQL. A ingestão a partir das filas exigiria um consumidor separado, representado no fluxo de referência." },
  cicd: { title: "CI/CD", service: "GitHub Actions + Terraform", icon: GitBranch, detail: "O GitHub Actions executa as verificações do repositório. O Terraform descreve Cloud Run, a fila SQS e as permissões de integração entre provedores." },
  gemini: { title: "Gemini", service: "Geração de material e fit", icon: BrainCircuit, detail: "A API faz chamadas ao Gemini para gerar simulados, flashcards e análise de vagas. A chave da API fica no backend." },
};
type Node = keyof typeof nodes;

const routes: { from: Node; to: Node; path: string; reference?: boolean }[] = [
  { from: "client", to: "api", path: "M205 206 H270" },
  { from: "api", to: "sqs", path: "M465 206 C510 206 490 106 545 106" },
  { from: "api", to: "pubsub", path: "M465 206 C510 206 490 306 545 306", reference: true },
  { from: "sqs", to: "neon", path: "M740 106 C780 106 765 185 795 185", reference: true },
  { from: "pubsub", to: "neon", path: "M740 306 C780 306 765 228 795 228", reference: true },
  { from: "api", to: "neon", path: "M465 206 H795" },
  { from: "cicd", to: "api", path: "M367 94 V165" },
  { from: "api", to: "gemini", path: "M367 246 V318" },
];

export default function Architecture({ videos }: { videos: ArchitectureVideosProps }) {
  const [selected, setSelected] = useState<Node>("api");
  const detail = nodes[selected];
  return (
    <div className="architecture-page">
      <header className="workspace-hero architecture-hero">
        <div>
          <div className="eyebrow"><Network size={18} /> Arquitetura multicloud</div>
          <h1>Da requisição ao evento.</h1>
          <p>Explore o caminho dos dados pelo Nicolas Hub e compare as opções de mensageria na AWS e no Google Cloud.</p>
          <p>Na demonstração sem credenciais de nuvem, a telemetria é persistida no PostgreSQL em modo simulado.</p>
          <div className="provider-marks">
            <img src={importantImage("aws.png")} alt="AWS" />
            <img src={importantImage("gcp.png")} alt="Google Cloud" />
          </div>
        </div>
        <AvatarStage skin={skins.cloud} dialogue="Selecione um serviço para inspecionar o fluxo." priority />
      </header>
      <section className="topology" aria-labelledby="topology-title">
        <div className="section-heading"><Network size={22} /><h2 id="topology-title">Topologia interativa</h2></div>
        <p className="topology-pan muted">Deslize o diagrama para explorar os serviços.</p>
        <div className="topology-scroll" role="region" aria-label="Diagrama de fluxo">
        <div className="topology-map">
          <svg aria-hidden="true" viewBox="0 0 1000 406" preserveAspectRatio="none">
            <defs><marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#81bcb1" /></marker></defs>
            {routes.map(({ from, to, path, reference }, index) => {
              const active = selected === from || selected === to;
              return <g key={path} className={active ? "edge active" : "edge"}>
                <path d={path} strokeDasharray={reference ? "5 6" : undefined} markerEnd="url(#flow-arrow)" />
                <circle r={active ? 4 : 2.5}><animateMotion path={path} dur={`${2.2 + index * .22}s`} repeatCount="indefinite" /></circle>
              </g>;
            })}
          </svg>
          {(Object.entries(nodes) as [Node, typeof nodes[Node]][]).map(([id, node]) => (
            <button key={id} type="button" className={`topology-node node-${id}`} onClick={() => setSelected(id)} aria-pressed={selected === id} aria-controls="topology-detail">
              <node.icon size={19} /><strong>{node.title}</strong><span>{node.service}</span>
            </button>
          ))}
        </div>
        </div>
        <ul className="topology-legend"><li>Fluxos da arquitetura do Hub</li><li>Pub/Sub e consumidores das filas · cenário de referência</li></ul>
        <div className="topology-detail" id="topology-detail" aria-live="polite">
          <detail.icon size={24} /><div><h3>{detail.title} · {detail.service}</h3><p>{detail.detail}</p></div>
        </div>
        <div className="actions"><a className="button secondary" href={referenceLinks.architecture} target="_blank" rel="noopener noreferrer">Documentação e Terraform <ArrowUpRight size={16} /></a></div>
      </section>
      <ArchitectureVideos {...videos} />
      <section className="page-section">
        <div className="section-heading"><Network size={22} /><h2>Estudo de redes VPC</h2></div>
        <Diagram />
      </section>
      <section className="workspace-hero page-section ai-engineering" aria-labelledby="ai-engineering-title">
        <div>
          <div className="eyebrow"><BrainCircuit size={17} /> Integração com Gemini</div>
          <h2 id="ai-engineering-title">Engenharia de IA</h2>
          <p>A API FastAPI prepara o contexto, envia a solicitação ao Gemini e valida a resposta estruturada antes de entregá-la à interface.</p>
          <div className="actions">
            <a className="button secondary" href="/academia#provas">Ver geração de material</a>
            <a className="button secondary" href="/carreira#analisar-vaga">Ver análise de vagas</a>
          </div>
        </div>
        <AvatarStage skin={skins.engineeringAi} dialogue="Da entrada à resposta validada." priority />
      </section>
    </div>
  );
}
