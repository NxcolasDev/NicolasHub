import type { Topic } from "../api";

const publicAsset = (folder: string, file: string) => encodeURI(`/assets/${folder}/${file}`);

export const importantImage = (file: string) => publicAsset("Imagens Importantes", file);
const animation = (file: string) => publicAsset("Animacoes", file);

export type Skin = {
  idle: string;
  idleMs?: number;
  poster?: string;
  action?: { src: string; duration: number; lightMatte?: boolean };
};

function loop(file: string, hasPoster = true): Skin {
  const filename = file.replace(/\.gif$/, ".png");
  return { idle: animation(file), poster: hasPoster ? publicAsset("Animacoes/Still", filename) : undefined };
}

function skin(action: string, duration: number, idle: string, lightMatte = false, hasPoster = true): Skin {
  return { ...loop(idle, hasPoster), action: { src: animation(action), duration, lightMatte } };
}

const lobbyIdle = "Animação de respiração suave em pixel art.gif";
const codingIdle = "Garoto Pixelado Digitando no Ar.gif";

export const smile = animation("Animação do sorriso de Nicolas.gif");

export const skins = {
  welcome: skin("Animação em pixel art de saudação.gif", 1920, lobbyIdle),
  wave: skin("Animação de aceno em pixel art.gif", 1560, lobbyIdle),
  react: skin("Garoto Pixelado Toca e Reage.gif", 3600, lobbyIdle),
  english: skin("Animação de Hip-Hop com Pose NY.gif", 2070, "Loop de Rap em Pixel Art.gif"),
  french: skin("Animação do bigode charmoso.gif", 2880, "Animação de Respiração do Personagem Francês.gif"),
  spanish: skin("Animação de embaixadinhas no futebol.gif", 3520, "Animação de jogador de futebol em pixel art.gif"),
  italian: skin("Animação do Herói Romano com Espada.gif", 2080, "Guerreiro romano em animação pixel art.gif"),
  cloud: skin("Animação do nerd explicador_PIXEL.gif", 1320, "Cientista pixelado em animação de respiração.gif", true),
  laptop: { ...skin("Animação de Jovem Digitando no Laptop.gif", 20_000, codingIdle), idleMs: 5_000 },
  databases: skin("Programador Pixel com Logos de Banco de Dados.gif", 3600, "Programador Pixel com Logos de Banco de Dados.gif"),
  college: skin("Animação Pixel Art do UNIFAAT.gif", 2070, "Animação do personagem UNIFAAT respirando calmamente.gif"),
  workout: skin("Animação de supino e recuperação no treino.gif", 2880, "Animação de Respiração na Academia.gif"),
  low: skin("Animação_ Decepção com a Nota 4,5.gif", 3120, lobbyIdle),
  middle: loop(lobbyIdle),
  pass: skin("Animação pixel art_ avaliação 6,7.gif", 3120, lobbyIdle),
  perfect: skin("Animação_ Nota 10 com Estilo.gif", 2880, "Animação de Pose com Óculos e Brilhos.gif"),
  kiro: skin("Garoto e fantasma em movimento.gif", 2760, "Garoto e fantasma em animação pixel art.gif"),
  jett: skin("Transformação Pixelada do Jet Inspirado.gif", 2640, "Animação idle do kunai ciano.gif"),
  trainer: skin("Transformação em treinador Pokémon animada.gif", 2760, "Menino Pixel Art em Animação de Idle.gif"),
  builder: skin("Transformação do Jonesy com Picareta Brilhante.gif", 2640, "Animação de espera com picareta.gif"),
  music: skin("Animação pixel art_ ouvindo música (1).gif", 1920, "Animação pixel art_ ouvindo música.gif"),
  special: skin("Transformação Energética do Garoto Cheerful.gif", 2160, lobbyIdle),
  recora: skin("Animação pixel art_ giro da camisa 10.gif", 1710, "Animação pixelada do garoto RECORA.gif", false, false),
  notes: loop("Animação de personagem escrevendo no bloco.gif", false),
  future: skin("Nicolas e o DeLorean Neon.gif", 1560, "Garoto e DeLorean em Animação Retro.gif", false, false),
  cloudTrack: loop("Menino triunfante entre AWS e GCP.gif", false),
  dataTrack: skin("Engenheiro de Dados em Ação.gif", 1080, "Animação do engenheiro de dados pixelado.gif", false, false),
  dockerTrack: skin("Animação Pixel Art DevOps no Docker.gif", 1080, "Animação Pixel Art do Docker.gif", false, false),
  networkTrack: skin("Garoto Engenheiro e Holograma VPC Animado.gif", 1080, "Encanador Pixel em Loop de Afirmativo.gif", false, false),
  securityTrack: loop("Hacker ajusta os óculos na chuva de código.gif", false),
  engineeringAi: loop("Ciborgue hacker em animação pixel art.gif", false),
} satisfies Record<string, Skin>;


export const academyTrackSkins: Partial<Record<Topic | "aws" | "gcp" | "ai", { skin: Skin; dialogue: string }>> = {
  cloud: { skin: skins.cloudTrack, dialogue: "Compare AWS e Google Cloud para cada cenário." },
  data: { skin: skins.dataTrack, dialogue: "Dos dados de entrada ao pipeline." },
  docker: { skin: skins.dockerTrack, dialogue: "Da imagem ao ambiente de execução." },
  network: { skin: skins.networkTrack, dialogue: "Siga o pacote pela VPC." },
  security: { skin: skins.securityTrack, dialogue: "Comece pelo princípio do menor privilégio." },
  databases: { skin: skins.databases, dialogue: "SQL ou NoSQL? A consulta começa aqui." },
  college: { skin: skins.college, dialogue: "Inicie a revisão para sua próxima prova." },
};
