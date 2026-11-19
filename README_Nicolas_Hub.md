<div align="center">

<img src="docs/midias/Banner%20Pixel%20Art%20Nicolas%20Hub%20Neon.png" alt="Banner pixel art do Nicolas Hub" width="100%" />

# Nicolas Hub

**Portfólio interativo · Cloud · DevOps · Backend · Dados**

Um universo em pixel art que conecta projetos reais, arquitetura multicloud, estudos e preparação de carreira.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonwebservices&logoColor=FF9900) ![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white) ![Terraform](https://img.shields.io/badge/Terraform-844FBA?style=for-the-badge&logo=terraform&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

[**Explorar funcionalidades**](#-explore-o-hub) · [**Arquitetura**](#-arquitetura-multicloud) · [**Executar localmente**](#-executar-localmente) · [**Documentação**](#-documentação-e-qualidade)

<!-- Coloque a URL pública do Hub aqui quando estiver disponível. -->

</div>

---

## 👾 Bem-vindo ao Nicolas Hub

Sou **Nicolas de Jesus Silva**, estudante de Análise e Desenvolvimento de Sistemas na UniFAAT, com foco em **Cloud, DevOps e Backend**. O Nicolas Hub reúne meus projetos, certificações, notas, experiências de aprendizagem e uma demonstração interativa de arquitetura multicloud.

**A proposta:** transformar um portfólio técnico em uma experiência explorável, com personagens animados, exercícios, documentação e funcionalidades reais.

> [!NOTE]
> Portfólio, conteúdos introdutórios e Coding Gym podem ser explorados sem login. Recursos de geração com Gemini dependem de conta e chave de API configurada. Edições de Notes, vídeos cadastrados e certificados adicionados pela interface ficam no navegador atual.

## 🧭 Explore o Hub

| Seção | O que você encontra | Prévia |
|:--|:--|:--|
| **Portfólio** | Projetos, TCC RECORA, idiomas com dublagem, eventos, certificações e planos para 2027 | [Ver](#-portfólio-e-projetos) |
| **Arquitetura** | Topologia interativa, telemetria GCP → AWS, Gemini e vídeos por projeto | [Ver](#-arquitetura-multicloud) |
| **Academia** | Trilhas, provas com PDFs selecionáveis, simulados e flashcards | [Ver](#-academia-e-coding-gym) |
| **Coding Gym** | Python no navegador, testes e rastreamento por linha | [Ver](#-academia-e-coding-gym) |
| **Notes** | Pastas, folhas Markdown e compartilhamento de leitura | [Ver](#-notes) |
| **Carreira** | Job Fair Google Cloud, comparação de vagas e currículo sob medida | [Ver](#-carreira-e-futuro) |

## 🖼️ Tour visual

<details open><summary><strong>🎮 Portfólio e projetos</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121658.png" alt="Página inicial do Nicolas Hub" width="100%" />

Projetos com capas e vídeos, certificações, idiomas, eventos e roadmap de 2027.

### RECORA — TCC

<img src="docs/midias/Screenshot%202026-11-19%20121202.png" alt="Projeto RECORA" width="100%" />

Sistema inteligente de gestão de estoque desenvolvido em equipe na UniFAAT, em desenvolvimento ativo. Propõe controle de entradas e saídas, rastreamento de movimentações e redução de perdas, com **React, Vite, Tailwind CSS, Node.js, Express, PostgreSQL, Docker, Amazon ECR e ECS**.

</details>

<details><summary><strong>☁️ Arquitetura multicloud</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121604.png" alt="Seção de arquitetura multicloud" width="100%" />

Demonstração do fluxo entre GCP e AWS, topologia de serviços e integração com Gemini. O Terraform define **Amazon SQS** para telemetria; **Pub/Sub** aparece como alternativa de referência na interface.

</details>

<details><summary><strong>📚 Academia e Coding Gym</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121626.png" alt="Academia Cloud e Dados" width="100%" />

Trilhas técnicas, simulados de **15, 25 ou 30 questões**, provas com anotações ou PDFs com texto selecionável e flashcards.

<img src="docs/midias/Screenshot%202026-11-19%20121452.png" alt="Coding Gym" width="100%" />

Editor Python com execução no navegador, casos de teste e acompanhamento de valores por linha.

</details>

<details><summary><strong>📝 Notes</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121641.png" alt="Caderno de estudos" width="100%" />

Organização de pastas e folhas em Markdown, exemplos de leitura pública e links compartilháveis.

</details>

<details><summary><strong>💼 Carreira e futuro</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121508.png" alt="Preparação de carreira" width="100%" />

Guia de **15 empresas** da Job Fair Google Cloud de **02/12/2026**, análise de vagas e currículo copiável, exportável em HTML ou imprimível em PDF.

<img src="docs/midias/Screenshot%202026-11-19%20121523.png" alt="Planos para 2027" width="100%" />

Metas de carreira, certificações, idiomas e experiência internacional.

</details>

<details><summary><strong>🏅 Certificações e idiomas</strong></summary>

<br />

<img src="docs/midias/Screenshot%202026-11-19%20121345.png" alt="Certificados e badges" width="100%" />

<img src="docs/midias/Screenshot%202026-11-19%20121325.png" alt="Página de idiomas" width="100%" />

</details>

## 🏗️ Arquitetura multicloud

```mermaid
flowchart LR
  U["Navegador"] --> UI["React + Vite"]
  UI -->|HTTPS| API["FastAPI · Cloud Run"]
  API -->|TLS| DB[("Neon · PostgreSQL")]
  API -->|Geração estruturada| AI["Gemini API"]
  API -->|Identidade OIDC do GCP| STS["AWS STS"]
  STS -->|Credenciais temporárias| API
  API -->|Telemetria| SQS["Amazon SQS"]
  SQS -.->|Redrive quando houver consumidor| DLQ["SQS · DLQ"]
  JOB["Cloud Run Job · Alembic"] -->|Migrações| DB
  SM["Secret Manager"] --> API
  SM --> JOB
```

- **Cloud Run:** hospeda a API FastAPI em imagem publicada no Artifact Registry; um Cloud Run Job executa migrações antes da liberação de tráfego.
- **Neon PostgreSQL:** persiste usuários, eventos e cotas compartilhadas; Alembic versiona o esquema.
- **AWS SQS:** recebe telemetria usando federação OIDC GCP → AWS STS e credenciais temporárias. A DLQ está disponível para redrive quando houver consumidor conectado.
- **Gemini:** gera material de estudo e análises de vagas via backend; FastAPI valida respostas estruturadas e seleções para o currículo.
- **Terraform:** define serviço e job no GCP, filas SQS e DLQ, e federação de identidade. O frontend pode ser publicado na Vercel.

**Importante:** o Pub/Sub exibido na topologia interativa é uma alternativa de referência; o Terraform define SQS como caminho de telemetria. Veja o [guia completo de arquitetura](docs/arquitetura-multicloud.md).

> [!NOTE]
> A arquitetura e os arquivos Terraform podem ser revisados e validados localmente sem uma conta de nuvem. Isso confirma a consistência estática da configuração, mas não comprova que IAM, federação OIDC, segredos, rede, migrações e serviços funcionarão na conta real. Essa confirmação exige provisionar o ambiente e executar o fluxo de ponta a ponta após o deploy.

## 🐳 Executar localmente

### Docker Compose (recomendado)

**Requisito:** Docker com Compose v2. Na raiz do repositório, em PowerShell:

```powershell
Copy-Item .env.example .env
```

Defina valores locais fortes para `POSTGRES_PASSWORD` e `JWT_SECRET_KEY`. Para gerar uma chave JWT:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Depois:

```powershell
docker compose up --build
```

| Serviço | Endereço local |
|---|---|
| Hub | http://localhost:3000 |
| Swagger | http://localhost:8000/docs |
| Saúde da API | http://localhost:8000/health |

O Compose inicia PostgreSQL, aplica as migrações Alembic e sobe API e frontend. Para parar: `docker compose down`. O volume nomeado preserva os dados.

<details><summary><strong>⚙️ Variáveis de ambiente</strong></summary>

| Configuração | Uso |
|---|---|
| `GEMINI_API_KEY` ou `AI_API_KEY` | Geração de material, assistência e análise de vagas |
| `AI_MODEL`, `AI_TIMEOUT_SECONDS` | Modelo Gemini e timeout |
| `AWS_REGION`, `SQS_QUEUE_URL` | Publicação de telemetria |
| `FRONTEND_ORIGINS` | CORS com API em domínio separado |
| `DATABASE_URL` | Conexão da API fora do Compose |

O `.env.example` usa valores de demonstração. **Nunca publique `.env` ou credenciais.** Em produção, use Secret Manager e identidade federada.

</details>

<details><summary><strong>💻 Desenvolvimento sem Docker</strong></summary>

Requisitos: **Python 3.12+**, **Node.js 22** e PostgreSQL acessível. Configure `DATABASE_URL` com `postgresql+psycopg://` e `JWT_SECRET_KEY`.

**Terminal 1 — API:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic -c backend/alembic.ini upgrade head
uvicorn app.main:app --app-dir backend --reload
```

**Terminal 2 — frontend:**

```powershell
cd frontend
npm ci
npm run dev
```

Vite usa a porta **3000** e encaminha `/api` e `/health` para a API na porta **8000**. `npm run build` gera `frontend/dist`.

</details>

<details><summary><strong>🚀 Publicação (GCP + AWS + Vercel)</strong></summary>

1. Configure Neon com TLS e cadastre `DATABASE_URL`, `JWT_SECRET_KEY` e `GEMINI_API_KEY` no Secret Manager.
2. Siga o [guia Terraform AWS e GCP](docs/arquitetura-multicloud.md) e revise os planos em `terraform/` e `terraform/gcp/` antes de aplicar.
3. Publique a imagem de `backend/Dockerfile` no Artifact Registry, execute o job de migração e configure as origens HTTPS.
4. Na Vercel, configure `frontend` como raiz, `npm run build` como build e `dist` como saída; defina `VITE_API_BASE_URL` com a URL do Cloud Run.
5. Verifique `/health`, publique um evento autenticado e confirme a mensagem no SQS. Cadastros públicos ficam fechados por padrão em produção.

</details>

## 📁 Estrutura do repositório

```text
backend/app/        API, perfil mestre, rotas e integrações
backend/migrations/ Migrações PostgreSQL com Alembic
frontend/src/       React, estilos, páginas e console interativo
frontend/public/    GIFs, imagens e áudio
src/                Motor Python e CLI de exercícios
terraform/          AWS SQS, DLQ e federação de identidade
terraform/gcp/      Cloud Run, Artifact Registry e Secret Manager
docs/               Arquitetura, mídia e guias de estudo
tests/              Testes de contrato da API e motor Python
```

## 📖 Documentação e qualidade

**Guias:** [Arquitetura multicloud](docs/arquitetura-multicloud.md) · [Estudos](docs/STUDY_GUIDE.md) · [SQL e NoSQL](docs/databases_guide.md) · [Cloud e Terraform](docs/cloud_and_terraform.md) · [Python](docs/python_mastery.md)

**Configuração:** [Links profissionais](frontend/src/config/profileLinks.ts) · [Perfil mestre](backend/app/data/profile.json) · [Empresas da Job Fair](backend/app/data/job_fair.json)

**Mídia:** capas em `frontend/public/assets/projetos/`, animações em `frontend/public/assets/Animacoes/` e áudios em `frontend/public/assets/audios/`. O botão **Música / Áudio** começa desligado; após ativação, acompanha a navegação interna. A trilha global pausa durante Idiomas e as falas acompanham as legendas. O painel `/arquitetura#videos` aceita links YouTube por projeto; vídeos cadastrados ficam no navegador atual.

**Testes e lint:**

```powershell
pytest -q
python -m black --check backend/app src tests
python -m flake8 backend/app src tests
```

A suíte usa SQLite temporário e substitui o provedor Gemini nos testes de contrato. O GitHub Actions também valida infraestrutura e títulos de commits em PRs. Padrão: **Conventional Commits**, como `feat(academy): add PDF study notes` e `docs: update deployment guide`.

## 🎬 Demonstração

> O vídeo de demonstração será adicionado aqui quando estiver disponível.

---

<div align="center">

**Construído com código, nuvem e um pouco de pixel art.** 👾

*Nicolas de Jesus Silva · Nicolas Hub*

</div>
