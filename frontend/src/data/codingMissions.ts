export type Level = "basico" | "intermediario" | "avancado";
export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };
export type MissionCase = { label: string; input: JSONValue; expected: JSONValue };
export type Mission = {
  id: string;
  title: string;
  task: string;
  input: string;
  strategy: string;
  complexity: string;
  cases: MissionCase[];
};

export const levels: Record<Level, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };

export const missions: Record<Level, Mission[]> = {
  basico: [
    {
      id: "soma-pares", title: "Soma dos pares",
      task: "Some os números pares de uma lista. Retorne 0 para uma lista vazia ou sem pares.",
      input: "Lista de números inteiros, inclusive zero e negativos. Retorne um inteiro.",
      strategy: "Percorra a lista e use o resto da divisão por 2 para identificar os pares.",
      complexity: "O(n) de tempo e O(1) de espaço adicional.",
      cases: [
        { label: "Valores misturados", input: [1, 2, 3, 4, 5, 6], expected: 12 },
        { label: "Negativos e zero", input: [-4, -3, 0, 2], expected: -2 },
        { label: "Sem elementos", input: [], expected: 0 },
      ],
    },
    {
      id: "conta-palavras", title: "Contagem de palavras",
      task: "Conte quantas vezes cada palavra aparece, ignorando maiúsculas e minúsculas.",
      input: "Texto com palavras separadas por espaços, sem pontuação. Retorne um dicionário palavra → contagem.",
      strategy: "Converta o texto em minúsculas, divida em palavras e incremente a contagem de cada uma.",
      complexity: "O(n) de tempo em relação aos caracteres e O(k) de contagens para k palavras únicas.",
      cases: [
        { label: "Repetição e caixa", input: "Cloud dados CLOUD", expected: { cloud: 2, dados: 1 } },
        { label: "Espaços extras", input: "  aws    gcp aws ", expected: { aws: 2, gcp: 1 } },
        { label: "Texto vazio", input: "", expected: {} },
      ],
    },
  ],
  intermediario: [
    {
      id: "media-movel", title: "Média móvel",
      task: "Calcule a média para cada janela consecutiva completa. Retorne uma lista vazia se a janela for maior que a série.",
      input: 'Objeto com "values" (lista de inteiros) e "window" (inteiro positivo). Retorne uma lista de médias na ordem de chegada.',
      strategy: "Some a primeira janela. Depois some o valor que entra e subtraia o que sai ao deslocá-la.",
      complexity: "O(n) de tempo e O(1) de espaço adicional, excluindo a saída.",
      cases: [
        { label: "Janelas deslizantes", input: { values: [10, 20, 30, 40], window: 2 }, expected: [15, 25, 35] },
        { label: "Média fracionária", input: { values: [-2, 1, 2], window: 2 }, expected: [-.5, 1.5] },
        { label: "Janela maior que a série", input: { values: [3], window: 2 }, expected: [] },
      ],
    },
    {
      id: "logs-criticos", title: "Triagem de logs",
      task: 'Liste, sem repetir e na ordem da primeira ocorrência, os códigos com severidade "CRITICAL".',
      input: 'Lista de objetos com "severity" e "code". Retorne uma lista de códigos.',
      strategy: "Use um conjunto para lembrar códigos já selecionados e uma lista para preservar a ordem.",
      complexity: "O(n) de tempo médio e O(k) de espaço para k códigos críticos únicos.",
      cases: [
        { label: "Duplicatas e severidades", input: [{ severity: "CRITICAL", code: "A" }, { severity: "INFO", code: "X" }, { severity: "CRITICAL", code: "A" }, { severity: "CRITICAL", code: "B" }], expected: ["A", "B"] },
        { label: "Sem críticos", input: [{ severity: "WARN", code: "C" }], expected: [] },
        { label: "Ordem de ocorrência", input: [{ severity: "INFO", code: "C" }, { severity: "CRITICAL", code: "Z" }, { severity: "CRITICAL", code: "C" }], expected: ["Z", "C"] },
      ],
    },
  ],
  avancado: [
    {
      id: "mescla-intervalos", title: "Consolidação de intervalos",
      task: "Mescle intervalos fechados sobrepostos ou com um extremo em comum. Devolva-os em ordem crescente de início.",
      input: "Lista de pares [início, fim], com início ≤ fim. Retorne uma lista de pares mesclados.",
      strategy: "Ordene por início. Compare cada início ao fim do último intervalo mesclado.",
      complexity: "O(n log n) de tempo para ordenar e O(n) de espaço para a lista de saída.",
      cases: [
        { label: "Sobreposição e ordem", input: [[5, 8], [1, 4], [3, 6], [10, 11]], expected: [[1, 8], [10, 11]] },
        { label: "Extremo em comum", input: [[1, 2], [2, 3], [1, 2]], expected: [[1, 3]] },
        { label: "Lista vazia", input: [], expected: [] },
      ],
    },
    {
      id: "menor-caminho", title: "Menor caminho em uma rede",
      task: "Encontre o menor número de conexões entre origem e destino. Retorne -1 quando não houver caminho, ou 0 se forem iguais.",
      input: 'Objeto com "graph" (adjacências de um grafo direcionado), "start" e "target". Retorne um inteiro.',
      strategy: "Use busca em largura, uma fila e um conjunto de visitados. Cada conexão aumenta a distância em uma unidade.",
      complexity: "O(V + E) de tempo e O(V) de espaço para a fila e visitados.",
      cases: [
        { label: "Rotas de comprimentos diferentes", input: { graph: { A: ["B", "C"], B: ["E"], C: ["D"], E: ["D"] }, start: "A", target: "D" }, expected: 2 },
        { label: "Ciclo sem caminho", input: { graph: { A: ["B"], B: ["A"] }, start: "A", target: "C" }, expected: -1 },
        { label: "Origem igual ao destino", input: { graph: {}, start: "A", target: "A" }, expected: 0 },
      ],
    },
  ],
};
