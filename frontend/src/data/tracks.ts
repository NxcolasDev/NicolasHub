import type { Question, Topic } from "../api";

export interface Track {
  id: Topic;
  title: string;
  description: string;
  question: Question;
}

export const tracks: Track[] = [
  {
    id: "cloud",
    title: "AWS e Google Cloud",
    description: "Compare computação, armazenamento de objetos, mensageria e serviços gerenciados.",
    question: {
      prompt: "Qual par representa armazenamento de objetos gerenciado?",
      options: ["Amazon EC2 e Compute Engine", "Amazon S3 e Cloud Storage", "Amazon RDS e Cloud SQL", "AWS Lambda e Cloud Run functions"],
      correct_index: 1,
      explanations: [
        "EC2 e Compute Engine fornecem máquinas virtuais.",
        "S3 e Cloud Storage armazenam objetos em buckets. Políticas, classes de armazenamento e integrações variam entre os provedores.",
        "RDS e Cloud SQL gerenciam bancos relacionais.",
        "Lambda e Cloud Run functions executam código em resposta a eventos.",
      ],
    },
  },
  {
    id: "data",
    title: "Engenharia de Dados",
    description: "Escolha entre Spark, BigQuery, Athena e Glue conforme o pipeline e a carga.",
    question: {
      prompt: "Na AWS, qual serviço consulta arquivos Parquet diretamente no S3 usando SQL, sem provisionar um cluster?",
      options: ["AWS Glue Data Catalog", "Amazon EC2", "Google BigQuery", "Amazon Athena"],
      correct_index: 3,
      explanations: [
        "O catálogo guarda metadados das tabelas e pode ser consultado pelo Athena.",
        "EC2 oferece máquinas virtuais e exige instalar e administrar um mecanismo de consulta.",
        "BigQuery é a plataforma analítica do Google Cloud. A pergunta pede o serviço da AWS.",
        "Athena executa SQL sobre dados no S3. Jobs Spark do Glue podem transformar os arquivos, e o Glue Data Catalog pode registrar seu esquema.",
      ],
    },
  },
  {
    id: "docker",
    title: "Docker e DevOps",
    description: "Explore imagens, contêineres, Compose, volumes e integração contínua.",
    question: {
      prompt: "Como manter os dados de um PostgreSQL criado com Docker Compose ao recriar o contêiner?",
      options: ["Montar um volume no diretório de dados", "Manter a mesma tag da imagem", "Expor a porta 5432", "Aumentar o intervalo do healthcheck"],
      correct_index: 0,
      explanations: [
        "O volume possui ciclo de vida separado do contêiner. A nova instância pode montá-lo e reutilizar os dados.",
        "A tag identifica a imagem. As gravações feitas durante a execução ficam fora dela.",
        "Expor a porta altera a conectividade. A persistência depende de onde os dados são gravados.",
        "O healthcheck observa a saúde do processo. Ele não persiste arquivos.",
      ],
    },
  },
  {
    id: "databases",
    title: "Bancos de Dados",
    description: "Pratique SQL, índices, transações, modelagem relacional e NoSQL.",
    question: {
      prompt: "Qual propriedade garante que os dois lançamentos de uma transferência ocorram juntos?",
      options: ["Durabilidade", "Consistência", "Atomicidade", "Isolamento"],
      correct_index: 2,
      explanations: [
        "Durabilidade preserva alterações confirmadas após falhas.",
        "Consistência mantém as restrições e invariantes do banco.",
        "Atomicidade faz com que todos os passos da transação sejam confirmados ou desfeitos em conjunto.",
        "Isolamento regula o efeito de transações concorrentes umas sobre as outras.",
      ],
    },
  },
  {
    id: "network",
    title: "Redes, TCP e VPC",
    description: "Revise sub-redes, CIDR, rotas, NAT e a abertura de conexões TCP.",
    question: {
      prompt: "Qual é a ordem dos três segmentos que iniciam uma conexão TCP típica?",
      options: ["ACK, SYN, FIN", "SYN, SYN-ACK, ACK", "SYN, FIN, ACK", "SYN-ACK, ACK, SYN"],
      correct_index: 1,
      explanations: [
        "Uma abertura normal começa com SYN. FIN participa do encerramento.",
        "O cliente envia SYN, o servidor responde SYN-ACK e o cliente confirma com ACK.",
        "O servidor responde com SYN-ACK para sincronizar os dois lados.",
        "SYN-ACK é a resposta ao pedido inicial de sincronização, SYN.",
      ],
    },
  },
  {
    id: "security",
    title: "Segurança em Nuvem",
    description: "Pratique identidade, menor privilégio e proteção de credenciais.",
    question: {
      prompt: "Qual estratégia aplica menor privilégio a uma API que só publica eventos em uma fila?",
      options: ["Usar uma conta administradora", "Conceder acesso do ambiente a todas as filas", "Configurar uma chave permanente do titular", "Autorizar apenas a publicação na fila usada pela API"],
      correct_index: 3,
      explanations: [
        "Uma conta administradora concede permissões muito além do envio de eventos.",
        "O acesso a todas as filas excede os recursos que a API precisa alcançar.",
        "Uma chave permanente aumenta o impacto de uma exposição e não define o escopo do acesso.",
        "Dar à identidade da aplicação apenas a ação de publicação na fila necessária reduz o impacto de uma falha.",
      ],
    },
  },
  {
    id: "college",
    title: "Provas da Faculdade",
    description: "Transforme resumos de Big Data, Arquitetura de Software e Front-end em revisões.",
    question: {
      prompt: "Numa arquitetura em camadas, onde fica uma regra de desconto que vale para a interface web e a API?",
      options: ["No componente visual", "No endpoint HTTP de cadastro", "No domínio ou serviço de aplicação compartilhado", "No tema CSS"],
      correct_index: 2,
      explanations: [
        "Um componente de interface resolve apresentação. Centralizar nele a regra limitaria o reúso.",
        "A camada HTTP adapta a entrada. A regra precisa ser acessível a outros fluxos.",
        "Uma regra compartilhada pode ser aplicada pela camada de domínio ou de aplicação, com testes independentes da interface.",
        "CSS controla apresentação e não é responsável pela política de desconto.",
      ],
    },
  },
];

export const publicPracticeQuestions: Question[] = [
  ...tracks.map((track) => track.question),
  {
    prompt: "Que método HTTP costuma ser usado para consultar um recurso sem pedir alterações no servidor?",
    options: ["POST", "DELETE", "GET", "PUT"],
    correct_index: 2,
    explanations: [
      "POST envia dados para processamento, como a criação de um registro.",
      "DELETE solicita a remoção de um recurso.",
      "GET solicita uma representação do recurso, como os dados de um projeto.",
      "PUT solicita a criação ou substituição do recurso identificado pela URL.",
    ],
  },
  {
    prompt: "Qual comando do Terraform mostra as mudanças propostas antes de aplicar a infraestrutura?",
    options: ["terraform plan", "terraform apply", "terraform fmt", "terraform init"],
    correct_index: 0,
    explanations: [
      "O plano mostra quais recursos seriam criados, alterados ou excluídos.",
      "Esse comando aplica as mudanças do plano.",
      "Esse comando padroniza a formatação dos arquivos do Terraform.",
      "Esse comando inicializa o diretório e prepara os provedores e módulos.",
    ],
  },
  {
    prompt: "Em SQL, qual cláusula filtra linhas antes de uma agregação com GROUP BY?",
    options: ["ORDER BY", "HAVING", "LIMIT", "WHERE"],
    correct_index: 3,
    explanations: [
      "ORDER BY ordena o resultado.",
      "HAVING filtra os grupos depois da agregação.",
      "LIMIT determina quantas linhas do resultado serão retornadas.",
      "WHERE seleciona as linhas que entram na agregação.",
    ],
  },
];
