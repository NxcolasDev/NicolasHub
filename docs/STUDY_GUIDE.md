# Nicolas Hub — guia mestre de estudos

Este manual organiza uma demonstração prática para a Feira de Empregabilidade.
Comece pela interface em `http://localhost:3000`, experimente o terminal e
depois siga os links para a implementação. A regra de ouro é observar o
contrato, executar um caso, testar uma borda e explicar o trade-off.

## 1. Subir o laboratório

1. Copie `.env.example` para `.env`; substitua os valores `MOCK_ONLY` por
   segredos locais aleatórios. Para usar o assistente, configure
   `GEMINI_API_KEY` com uma chave própria do Google AI Studio. Não mostre nem
   versione o arquivo `.env`.
2. Na raiz:

   ```bash
   docker compose up --build
   ```

3. Abra o frontend em <http://localhost:3000>, a API em
   <http://localhost:8000/docs> e a saúde em <http://localhost:8000/health>.
4. No terminal da interface, tente `average 10,20,30,40 --window 2` e
   `scan-logs`. O backend executa o mesmo domínio Python da CLI.
5. Para testar o chat, crie uma conta no painel *Learner Access*. O browser
   recebe somente JWT de curta duração; a chave Gemini permanece no backend.

## 2. Python Mastery

### Orientação a Objetos (POO)

Em [src/domain/challenge.py](../src/domain/challenge.py), `AnalyticsEngine`
agrupa operações de analytics como métodos estáticos. É uma classe sem estado
que dá um namespace claro às regras do motor. Para objetos com dados e
comportamento próprios, veja as dataclasses imutáveis `Lesson` e o enum
`LearningTrack` em [src/domain/curriculum.py](../src/domain/curriculum.py).

**Prática:** acrescente uma regra pura de pontuação, sem importar FastAPI,
SQLAlchemy ou SDK de IA. Teste-a com pytest.

### Decorators

Decorators aplicam comportamento ou registram funções. As rotas decoradas com
`@router.post` em [backend/app/routers/learning.py](../backend/app/routers/learning.py)
e `@app.get` em [backend/app/main.py](../backend/app/main.py) são registrados
pelo FastAPI durante a composição do app. `@lru_cache` em
[backend/app/config.py](../backend/app/config.py) memoriza a configuração para
não recriá-la em cada dependência.

**Prática:** explique que o decorator recebe a função original e a integra ao
framework; a validação do request acontece na fronteira HTTP, não no domínio.

### Type Hinting

As assinaturas `list[float]`, `Literal` e modelos Pydantic delimitam contratos:
[src/domain/challenge.py](../src/domain/challenge.py),
[backend/app/routers/learning.py](../backend/app/routers/learning.py) e
[frontend/src/api.ts](../frontend/src/api.ts). Type hints ajudam IDE, revisão e
ferramentas estáticas, mas não validam automaticamente dados recebidos pela
rede; Pydantic valida os requests Python e TypeScript valida em build.

**Prática:** mude `window_size` para zero no request e observe o `422` do
FastAPI. Explique a diferença entre tipagem estática e validação runtime.

### Fatiamento (slicing)

Em [src/domain/challenge.py](../src/domain/challenge.py), o cálculo de média
móvel usa `scores[i : i + window_size]` para formar uma janela contígua. O
limite final do slice é exclusivo. Para `[10, 20, 30, 40]` com janela `2`, as
sublistas são `[10, 20]`, `[20, 30]`, `[30, 40]`.

**Prática:** experimente janela igual ao tamanho da lista, maior que a lista e
zero; discuta a política de retorno em cada caso.

### Async/await e separação de responsabilidades

`GeminiAssistant.answer` em
[backend/app/services/assistant.py](../backend/app/services/assistant.py)
aguarda HTTP assíncrono com timeout. A rota em
[backend/app/routers/learning.py](../backend/app/routers/learning.py) autentica
e converte falhas upstream em respostas HTTP explícitas. A interface em
[frontend/src/App.tsx](../frontend/src/App.tsx) mantém estado React e chama um
client tipado em `api.ts`. Nunca coloque a chave do modelo no bundle do browser.

## 3. Docker e Compose

### Comandos essenciais

```bash
docker compose up --build          # constrói imagens e inicia os serviços
docker compose ps                  # mostra estado e healthchecks
docker compose logs -f api         # acompanha logs da API
docker compose logs -f frontend    # acompanha logs do frontend/Nginx
docker compose exec api alembic current  # executa comando dentro da API ativa
docker compose down                # para e remove containers/rede, preserva volume
docker compose down --volumes       # remove também dados do PostgreSQL (destrutivo)
docker system prune                # remove recursos Docker não usados; revisar antes
```

`prune` pode remover imagens, cache e recursos compartilhados que outros
projetos usam. Inspecione o que será removido e nunca rode `docker volume prune`
sem confirmar a política de retenção dos dados.

### Papel dos blocos de `docker-compose.yml`

- `db`: PostgreSQL; o healthcheck `pg_isready` garante prontidão antes da API.
- `api`: constrói `backend/Dockerfile`, injeta configuração e segredos por
  ambiente, aplica Alembic e expõe a porta `8000`. Healthcheck valida `/health`.
- `frontend`: constrói React/Vite e serve o build estático por Nginx na porta
  `3000`; Nginx encaminha `/api` e `/health` pela rede interna para a API.
- `depends_on`: coordena readiness — API espera o banco saudável e frontend
  espera a API saudável.
- `networks.nicolas-hub`: rede bridge privada para comunicação por nomes de serviço;
  o banco não publica porta no host.
- `volumes.postgres_data`: volume nomeado persiste o banco entre reinicializações.

Frontend Vite local sem container:

```bash
cd frontend
npm ci
npm run dev
```

O proxy Vite envia `/api` e `/health` a `localhost:8000`; inicie a API conforme
o [README](../README.md).

## 4. Git e CI/CD

### Branches e commits

- `main`: integração protegida; mudanças entram por Pull Request.
- `feature/<assunto>`: trabalho de funcionalidade, por exemplo
  `feature/gemini-study-chat`.
- `hotfix/<assunto>`: correção urgente e pequena para produção, também revisada.

Formato Conventional Commits:

```text
feat(frontend): add learning terminal
fix(api): report database readiness
docs: add study guide
chore(ci): enforce formatting
test: cover logic exercise endpoint
```

Use tipo em minúsculo, escopo opcional e resumo curto no imperativo. Não inclua
tokens, emails de clientes ou segredos na mensagem, branch ou logs.

### O que faz `.github/workflows/ci.yml`

1. Aciona em Pull Request direcionado à branch `main`.
2. Faz checkout com histórico suficiente para conferir commits.
3. Instala Python e dependências declaradas.
4. Executa `pytest`, incluindo contratos da API.
5. Confere estilo com `black --check` e `flake8`.
6. Valida Conventional Commit de cada título dentro do intervalo da PR.
7. Usa `permissions: contents: read` para reduzir permissões do token da ação.

CI não substitui revisão humana, análise de dependências, scan de segredos,
build da imagem, deployment com aprovação nem teste de infraestrutura. Em um
fluxo de produção, adicione essas etapas e proteja ambientes/credenciais com
OIDC e permissões mínimas.

## 5. Terraform cheat sheet

| Conceito/comando | Uso |
|---|---|
| `provider` | Configura o plugin/cloud, região e autenticação via chain de credenciais |
| `variable` | Entrada tipada e validada; segredo deve vir de secret manager/ambiente |
| `module` | Pacote reutilizável de recursos com inputs e outputs |
| `state` | Mapeia recursos declarados para objetos reais; pode conter dados sensíveis |
| `terraform init` | Inicializa provider e backend |
| `terraform fmt -recursive` | Formata HCL em módulos |
| `terraform validate` | Valida sintaxe e tipos localmente |
| `terraform plan` | Mostra mudanças propostas; revisar antes de aplicar |
| `terraform apply` | Cria/altera recursos após aprovação |
| `terraform destroy` | Remove recursos gerenciados; operação destrutiva e sujeita a revisão |

O root em [terraform/main.tf](../terraform/main.tf) chama
[terraform/modules/sqs](../terraform/modules/sqs), que cria fila principal e
DLQ. Para provisionar várias filas, repita uma instância do módulo com nome e
ambiente próprios; não duplique o bloco de recursos. State de produção deve
usar backend remoto com locking, criptografia e acesso restrito; separe state
por ambiente. Nunca versione `terraform.tfstate`, arquivos de plano, `.tfvars`
com segredos ou access keys.

## 6. SQL analítico e índices

O modelo do projeto relaciona `events.user_id` a `users.id`. Consulta de
detalhes:

```sql
SELECT u.email, e.severity, e.message, e.created_at
FROM users AS u
JOIN events AS e ON e.user_id = u.id
WHERE u.id = :user_id
  AND e.created_at >= :since
ORDER BY e.created_at DESC
LIMIT :limit;
```

O `JOIN` combina linhas pela chave estrangeira. O filtro por `user_id` limita
resultados ao tenant autenticado; os parâmetros vinculados evitam concatenação
de entrada em SQL.

Contagem analítica:

```sql
SELECT e.severity,
       COUNT(*) AS total,
       MIN(e.created_at) AS first_seen,
       MAX(e.created_at) AS last_seen
FROM events AS e
WHERE e.user_id = :user_id
GROUP BY e.severity
ORDER BY total DESC;
```

`GROUP BY` forma um grupo por severidade. `COUNT`, `MIN`, `MAX`, `SUM` e `AVG`
são agregadores; `WHERE` filtra linhas antes da agregação e `HAVING` filtra
grupos depois dela.

### Índices

- B-Tree é a escolha geral para igualdade, ordenação e intervalos de datas.
- Índice composto `(user_id, created_at)` serve consultas por usuário e faixa
  de data respeitando a ordem dos campos.
- `severity` ajuda filtros por categoria; cardinalidade baixa pode limitar o
  benefício de um índice isolado.
- Índices aceleram leitura seletiva, mas aumentam armazenamento e custo de
  escrita. Verifique com `EXPLAIN ANALYZE` em dados representativos.

No código, índices ORM e a migration inicial estão em
[backend/app/models/domain.py](../backend/app/models/domain.py) e
[backend/migrations/versions/0001_initial_schema.py](../backend/migrations/versions/0001_initial_schema.py).

## 7. Demonstração sugerida (5 minutos)

1. Mostre o dashboard e explique healthcheck, PostgreSQL e SQS opcional.
2. Execute o comando de média móvel; acompanhe request e resposta do backend.
3. Execute `scan-logs` e explique filtragem, conjunto de códigos únicos e
   resultado ordenado.
4. Crie conta e faça uma pergunta sobre slicing ou SQL ao assistente Gemini.
5. Mostre que a chave está apenas no `.env`/ambiente backend; inspecione o
   estado `503` quando a chave estiver ausente.
6. Conclua com CI, módulo Terraform, isolamento de state e limites de segurança.

## Referências oficiais

- [Python](https://docs.python.org/3/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/learn)
- [Vite](https://vite.dev/guide/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Terraform](https://developer.hashicorp.com/terraform/docs)
- [Google AI Gemini API](https://ai.google.dev/gemini-api/docs)
