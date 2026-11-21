import type { Company } from "../api";
import { Terminal } from "lucide-react";
import { skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";

const contribution: Record<string, { work: string; delivery: string; skills: string[] }> = {
  adecco: { work: "jornadas de candidatura e integrações entre sistemas de recrutamento", delivery: "rastrear falhas sem colocar dados de candidatos nos logs", skills: ["APIs para recrutamento", "Privacidade e rastreabilidade", "Comunicação com RH e tecnologia"] },
  almaviva: { work: "integrações e modernização gradual de serviços públicos e privados", delivery: "versionar infraestrutura e acompanhar a estabilidade de cada entrega", skills: ["Integração full-stack", "Infraestrutura versionada", "Entrega incremental"] },
  autenticare: { work: "fluxos digitais reutilizáveis para operações de educação, saúde e varejo", delivery: "isolar regras por domínio e documentar interfaces para a equipe", skills: ["Modelagem por domínio", "APIs e interfaces reutilizáveis", "Colaboração entre áreas"] },
  datalakers: { work: "APIs de ingestão e interfaces para acompanhar a qualidade de dados", delivery: "medir falhas de ingestão e registrar mudanças em contratos de dados", skills: ["Ingestão com FastAPI", "Observabilidade para DataOps", "Validação de saídas de IA"] },
  calriz: { work: "integrações com infraestrutura digital para empresas e governo", delivery: "acompanhar consumo, falhas e permissões em ambientes de nuvem", skills: ["Infraestrutura reproduzível", "Telemetria operacional", "Privilégio mínimo"] },
  ingram: { work: "integrações de catálogo, pedidos e automação para parceiros", delivery: "rastrear integrações entre sistemas sem duplicar operações", skills: ["APIs orientadas a parceiros", "Telemetria de integrações", "Documentação operacional"] },
  ipnet: { work: "serviços backend e integrações em projetos de adoção do Google Cloud", delivery: "entregar ambientes reproduzíveis e compartilhar aprendizados com o time", skills: ["Google Cloud e Terraform", "CI/CD com entregas pequenas", "Comunicação técnica em equipe"] },
  leega: { work: "serviços de consulta e interfaces que aproximam engenharia de dados do negócio", delivery: "acompanhar latência, validação e qualidade em cada entrega", skills: ["APIs e PostgreSQL", "Métricas de qualidade", "Revisão humana de IA"] },
  movti: { work: "modernização de aplicações e integração de serviços Google Cloud", delivery: "documentar decisões, automatizar ambientes e apoiar a operação remota", skills: ["Backend para modernização", "Terraform e CI/CD", "Documentação para times remotos"] },
  qi: { work: "automação de infraestrutura e interfaces de acompanhamento operacional", delivery: "medir utilização e incidentes para apoiar decisões de segurança e FinOps", skills: ["IaC e automação", "Observabilidade para FinOps", "Comunicação distribuída"] },
  santo: { work: "APIs para agentes e interfaces onde usuários possam revisar resultados", delivery: "medir falhas e manter revisão humana nas etapas com impacto real", skills: ["Integração de agentes", "Revisão humana", "Métricas e validação de resultados"] },
  servinformacion: { work: "APIs e interfaces de consulta para produtos orientados a localização", delivery: "validar dados de entrada e registrar qualidade e desempenho", skills: ["Backend para produtos de dados", "Validação e rastreabilidade", "Comunicação em espanhol"] },
  softwareone: { work: "modernização de aplicações e integrações para ambientes de clientes", delivery: "planejar migrações incrementais e registrar decisões para equipes em diferentes países", skills: ["Modernização full-stack", "Automação multicloud", "Inglês e francês profissionais em evolução"] },
  venha: { work: "automação de processos e integração de aplicações em nuvem híbrida", delivery: "isolar permissões, testar mudanças e acompanhar falhas com telemetria", skills: ["Automação em nuvem híbrida", "Segurança e CI/CD", "Validação humana em fluxos de IA"] },
  xertica: { work: "prototipagem de aplicações de IA com APIs e interfaces para clientes latino-americanos", delivery: "validar resultados antes de automatizar decisões e discutir limites com o cliente", skills: ["Prototipagem com FastAPI e React", "IA com revisão humana", "Comunicação na América Latina"] },
};

export default function CompanyFit({ company }: { company: Company }) {
  const focus = contribution[company.id];
  if (!focus) return null;
  return <section className="panel company-fit" aria-labelledby="company-fit-title">
    <div>
      <h3 id="company-fit-title">Por que contratar o Nicolas para {company.name}?</h3>
      <p>Minha formação em Análise e Desenvolvimento de Sistemas na UniFAAT e a prática com React, TypeScript, Python/FastAPI e PostgreSQL me dão base para contribuir com {focus.work}. Como profissional em início de carreira, posso assumir entregas com escopo claro e evoluir com revisão do time.</p>
      <p>Com Docker, Terraform, AWS, GCP, CI/CD e observabilidade, eu ajudaria a {focus.delivery}. Para {company.name}, conectaria esse trabalho à cultura descrita no guia da feira. {company.culture}</p>
      <p>Uso IA para explorar alternativas e acelerar tarefas, mantendo testes, revisão humana e cuidado com dados. Inglês e francês no nível intermediário/avançado, além de espanhol e italiano intermediários, ajudam a consultar documentação e colaborar com equipes internacionais.</p>
    </div>
    <aside>
      <AvatarStage skin={skins.cloud} dialogue={`Três diferenciais para ${company.name}.`} />
      <ul className="company-fit-skills">{focus.skills.map((skill) => <li key={skill}><Terminal size={15} aria-hidden="true" /> {skill}</li>)}</ul>
    </aside>
  </section>;
}
