import { useEffect, useRef, useState } from "react";
import type { Profile } from "../api";
import { importantImage, skins } from "../data/sprites";
import { AvatarStage } from "./PixelAvatar";
import { Pause, Play } from "lucide-react";

const languages = {
  us: {
    name: "Inglês", lang: "en", country: "Estados Unidos", level: "Intermediário / Avançado", skin: "english",
    voice: "ingles", greeting: "Hey! Welcome to Nicolas Hub.",
    transcript: "Hey! Welcome to Nicolas Hub. I use English every day to read cloud documentation, build full-stack projects, and prepare to collaborate with global teams in the future.",
    translation: "Ei! Bem-vindo ao Nicolas Hub. Uso o inglês todos os dias para ler documentações de nuvem, criar projetos full-stack e me preparar para colaborar com equipes globais no futuro.",
    motivation: "Acompanhar documentação de cloud, talks e comunidades de código aberto.",
    goal: "Usar inglês técnico com fluência em entrevistas e equipes internacionais.",
  },
  fr: {
    name: "Francês", lang: "fr", country: "França", level: "Intermediário / avançado", skin: "french",
    voice: "frances", greeting: "Salut ! Bienvenue sur Nicolas Hub.",
    transcript: "Salut ! Bienvenue sur Nicolas Hub. J’étudie le français tous les jours parce que je suis passionné par la culture francophone et que je souhaite faire une carrière internationale dans la tech.",
    translation: "Oi! Bem-vindo ao Nicolas Hub. Estudo francês todos os dias porque sou apaixonado pela cultura e busco uma carreira internacional em tecnologia.",
    motivation: "Explorar a cultura francófona e conversar com falantes de diferentes países.",
    goal: "Ganhar autonomia em conversação e me preparar para um intercâmbio acadêmico.",
  },
  es: {
    name: "Espanhol", lang: "es", country: "Espanha", level: "Intermediário", skin: "spanish",
    voice: "espanhol", greeting: "¡Hola! Te doy la bienvenida a Nicolas Hub.",
    transcript: "¡Hola! Te doy la bienvenida a Nicolas Hub. Practico español constantemente para conectar con comunidades de desarrollo y ampliar mis horizontes profesionales.",
    translation: "Olá! Bem-vindo ao Nicolas Hub. Pratico espanhol constantemente para me conectar com comunidades de desenvolvimento e ampliar meus horizontes profissionais.",
    motivation: "Me conectar com comunidades de tecnologia da América Latina e da Espanha.",
    goal: "Participar de conversas de trabalho e explicar decisões técnicas em espanhol.",
  },
  it: {
    name: "Italiano", lang: "it", country: "Itália", level: "Intermediário", skin: "italian",
    voice: "italiano", greeting: "Ciao! Ti do il benvenuto su Nicolas Hub.",
    transcript: "Ciao! Ti do il benvenuto su Nicolas Hub. Studio l’italiano con molto entusiasmo: imparare nuove lingue allena la mente quanto progettare architetture cloud.",
    translation: "Oi! Bem-vindo ao Nicolas Hub. Estudo italiano com muito entusiasmo; aprender novos idiomas treina a mente tanto quanto projetar arquiteturas cloud.",
    motivation: "Conhecer mais da cultura italiana por meio de conteúdos no idioma original.",
    goal: "Evoluir na compreensão oral e manter conversas do cotidiano com confiança.",
  },
} as const;

type Language = keyof typeof languages;
const codes = Object.keys(languages) as Language[];
const formats = ["mp3", "m4a", "wav"];

function LanguageScene({ code, level, audible, message, onToggle }: {
  code: Language; level: string; audible: boolean; message: string; onToggle: () => void;
}) {
  const { name, lang, country, skin, greeting, transcript, translation, motivation, goal } = languages[code];
  const element = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!element.current || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < .18) return;
      setRevealed(true);
      observer.disconnect();
    }, { threshold: .18 });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return <section ref={element} className={`scene-frame language-scene language-${code}`} data-audio-language={code}
    data-revealed={revealed} aria-labelledby={`language-${code}`}>
    <div className="language-figure">
      <div className="language-heading">
        <span className="chapter-kicker">{country}</span>
        <h3 id={`language-${code}`}>{name}</h3>
      </div>
      <AvatarStage skin={skins[skin]} dialogue={audible ? transcript : greeting} typeDialogue={audible ? undefined : revealed} dialogueLanguage={lang} />
      <button className="button secondary small language-sound" type="button" aria-pressed={audible} onClick={onToggle}>
        {audible ? <Pause size={16} /> : <Play size={16} />}{audible ? "Pausar fala" : `Ouvir em ${name}`}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
    <div className="language-flag">
      <img src={importantImage(`flag_${code}.svg`)} alt={`Bandeira: ${country}`} loading="lazy" />
    </div>
    <dl className="language-context">
      <div><dt>Nível atual</dt><dd>{level}</dd></div>
      <div><dt>Motivação para estudar</dt><dd>{motivation}</dd></div>
      <div><dt>Objetivo de prática</dt><dd>{goal}</dd></div>
      {audible && <div className="language-caption" lang="pt-BR"><dt>Tradução · Português</dt><dd>{translation}</dd></div>}
    </dl>
  </section>;
}

export default function LanguageSection({ profile }: { profile: Profile | null }) {
  const section = useRef<HTMLElement>(null);
  const player = useRef<HTMLAudioElement>(null);
  const selected = useRef<Language | null>(null);
  const request = useRef(0);
  const [audible, setAudible] = useState<Language | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const audio = player.current;
    return () => { request.current += 1; audio?.pause(); };
  }, []);

  async function toggleVoice(code: Language) {
    const audio = player.current;
    if (!audio) return;
    const attempt = ++request.current;
    setMessage("");
    if (selected.current === code && !audio.paused) {
      audio.pause();
      setAudible(null);
      return;
    }
    const previous = selected.current === code ? audio.getAttribute("src") : null;
    const paths = formats.map((ext) => `/assets/audios/${languages[code].voice}.${ext}`);
    if (previous && !audio.error) paths.unshift(previous);
    audio.pause();
    setAudible(null);
    selected.current = code;
    for (const path of new Set(paths)) {
      if (attempt !== request.current) return;
      if (audio.getAttribute("src") !== path) audio.src = path;
      try {
        await audio.play();
        if (attempt === request.current) setAudible(code);
        return;
      } catch (error) {
        if (attempt !== request.current) return;
        if (error instanceof DOMException && error.name === "NotAllowedError") break;
      }
    }
    if (attempt === request.current) setMessage("A gravação não pôde ser reproduzida.");
  }

  const levelFor = (name: string) => profile?.languages.find((item) => item.name === name)?.level;
  return <section ref={section} id="idiomas" className="language-story" aria-labelledby="language-title">
    <div className="shell language-intro">
      <h2 id="language-title">Idiomas</h2>
      <p>Português · {levelFor("Português") ?? "Nativo"}</p>
      <div className="language-selections" role="group" aria-label="Selecionar idioma">
        {codes.map((code) => <button key={code} className="button secondary small" type="button" onClick={() => {
          section.current?.querySelector(`[data-audio-language="${code}"]`)?.scrollIntoView({ block: "center" });
        }}>{languages[code].name}</button>)}
      </div>
    </div>
    <audio ref={player} preload="none" hidden onEnded={() => setAudible(null)} />
    {codes.map((code) => <LanguageScene key={code} code={code} level={levelFor(languages[code].name) ?? languages[code].level}
      audible={audible === code} message={selected.current === code ? message : ""} onToggle={() => void toggleVoice(code)} />)}
  </section>;
}
