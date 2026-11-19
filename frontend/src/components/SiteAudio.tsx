import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";

export type LanguageAudio = { id: string; music: string; voice: string };
export type AudioScene = "ambient" | "quiet" | LanguageAudio;
const formats = ["mp3", "m4a", "wav"];

type AudioControls = {
  enabled: boolean;
  blocked: boolean;
  audible: string | null;
  toggle: () => void;
  reportScene: (scene: AudioScene) => void;
};
const AudioContext = createContext<AudioControls | null>(null);

export function useSiteAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("SiteAudioProvider is required");
  return context;
}

async function startTrack(audio: HTMLAudioElement, basename: string, active: () => boolean, resume = false) {
  const existing = resume && audio.getAttribute("src");
  const sources = formats.map((extension) => `/assets/audios/${basename}.${extension}`);
  if (existing) sources.unshift(existing);
  for (const source of new Set(sources)) {
    if (!active()) return "stopped";
    if (audio.getAttribute("src") !== source) audio.src = source;
    try {
      await audio.play();
      return active() ? "playing" : "stopped";
    } catch (error) {
      if (!active()) return "stopped";
      if (error instanceof DOMException && error.name === "NotAllowedError") return "blocked";
    }
  }
  return "unavailable";
}

export function SiteAudioProvider({ children }: { children: ReactNode }) {
  const ambient = useRef<HTMLAudioElement>(null);
  const music = useRef<HTMLAudioElement>(null);
  const speech = useRef<HTMLAudioElement>(null);
  const target = useRef<AudioScene>("ambient");
  const consent = useRef(false);
  const playing = useRef<{ scene: AudioScene; stop: () => void } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [audible, setAudible] = useState<string | null>(null);

  const sync = useCallback(() => {
    const scene = consent.current && !document.hidden ? target.current : "quiet";
    if (playing.current?.scene === scene) return;
    playing.current?.stop();
    playing.current = null;
    setAudible(null);
    setBlocked(false);
    if (scene === "quiet") return;

    let stopped = false;
    let frame = 0;
    const active = () => !stopped;
    function fade(audio: HTMLAudioElement, volume: number, duration: number) {
      cancelAnimationFrame(frame);
      const initial = audio.volume;
      const start = performance.now();
      function step(now: number) {
        if (stopped) return;
        const progress = Math.max(0, Math.min(1, (now - start) / duration));
        audio.volume = initial + (volume - initial) * progress;
        if (progress < 1) frame = requestAnimationFrame(step);
      }
      frame = requestAnimationFrame(step);
    }
    function report(result: string) {
      if (result === "blocked" && active()) setBlocked(true);
    }

    if (scene === "ambient") {
      const track = ambient.current;
      if (!track) return;
      const resume = track.currentTime > 0;
      track.volume = resume ? 0 : .15;
      playing.current = { scene, stop: () => {
        stopped = true;
        cancelAnimationFrame(frame);
        track.pause();
      } };
      void startTrack(track, "musica_ingles", active, true).then((result) => {
        report(result);
        if (active() && resume && result === "playing") fade(track, .15, 600);
      });
      return;
    }

    const background = music.current;
    const voice = speech.current;
    if (!background || !voice) return;
    const id = scene.id;
    background.volume = .12;
    voice.volume = 1;
    let musicPlaying = false;
    let voicePlaying = false;
    function updateCaption() {
      if (active()) setAudible(musicPlaying || voicePlaying ? id : null);
    }
    function finishVoice() {
      if (!active()) return;
      voicePlaying = false;
      updateCaption();
      if (background) fade(background, .28, 900);
    }
    playing.current = { scene, stop: () => {
      stopped = true;
      cancelAnimationFrame(frame);
      voice.removeEventListener("ended", finishVoice);
      for (const track of [background, voice]) {
        track.pause();
        track.removeAttribute("src");
        track.load();
      }
    } };
    voice.addEventListener("ended", finishVoice, { once: true });
    void startTrack(background, scene.music, active).then((result) => {
      if (!active()) return;
      report(result);
      musicPlaying = result === "playing";
      updateCaption();
    });
    void startTrack(voice, scene.voice, active).then((result) => {
      if (!active()) return;
      report(result);
      voicePlaying = result === "playing" && !voice.ended;
      if (voicePlaying) updateCaption();
      else finishVoice();
    });
  }, []);

  const reportScene = useCallback((scene: AudioScene) => {
    target.current = scene;
    sync();
  }, [sync]);

  function toggle() {
    consent.current = !consent.current;
    setEnabled(consent.current);
    sync();
  }

  useEffect(() => {
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      playing.current?.stop();
      playing.current = null;
    };
  }, [sync]);

  return <AudioContext.Provider value={{ enabled, blocked, audible, toggle, reportScene }}>
    <audio data-site-audio="ambient" ref={ambient} preload="none" loop hidden />
    <audio data-site-audio="music" ref={music} preload="none" loop hidden />
    <audio data-site-audio="voice" ref={speech} preload="none" hidden />
    {children}
  </AudioContext.Provider>;
}

export function AudioToggle({ header = false }: { header?: boolean }) {
  const { enabled, blocked, toggle } = useSiteAudio();
  const title = enabled ? "Desativar música e áudio" : "Ativar música e áudio";
  return <>
    <button className={`button secondary small ${header ? "header-audio" : "language-sound"}`} type="button"
      aria-label={header ? "Música / Áudio" : "Som / Dublagem"} aria-pressed={enabled} title={title} onClick={toggle}>
      {enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
      <span>{header ? "Música / Áudio" : enabled ? "Desativar som / dublagem" : "Ativar som / dublagem"}</span>
    </button>
    {header && blocked && <span className="sr-only" role="status">Reprodução bloqueada. Desative e reative o áudio para tentar novamente.</span>}
  </>;
}
