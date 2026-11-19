import { useEffect, useId, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import type { Skin } from "../data/sprites";

export function PixelAvatar({ skin, priority = false }: {
  skin: Skin;
  priority?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const playbackId = useId();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"waiting" | "action" | "idle">("waiting");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!viewport.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.24);
    }, { threshold: 0.24 });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "action" || !skin.action) return;
    const timer = window.setTimeout(() => setPhase("idle"), skin.action.duration);
    return () => window.clearTimeout(timer);
  }, [phase, skin.action]);

  useEffect(() => {
    if (!visible || phase !== "idle" || !skin.action) return;
    const timer = window.setTimeout(() => {
      setPhase("waiting");
      setCycle((current) => current + 1);
    }, skin.idleMs ?? 15_000);
    return () => window.clearTimeout(timer);
  }, [visible, phase, skin]);

  const action = phase === "idle" ? undefined : skin.action;
  const playing = visible || phase === "action";
  const clip = action?.src ?? skin.idle;
  const currentGifSrc = `${clip}?play=${encodeURIComponent(playbackId)}-${cycle}-${action ? "action" : "idle"}`;
  return (
    <div ref={viewport} className="sprite" aria-hidden="true" data-motion-phase={skin.action ? phase : "idle"}>
      {playing ? (
        <img
          key={currentGifSrc}
          className={action ? "sprite-action" : "sprite-idle"}
          data-light-matte={action?.lightMatte || undefined}
          src={currentGifSrc}
          alt=""
          onLoad={action ? () => setPhase("action") : undefined}
          onError={action ? () => setPhase("idle") : undefined}
        />
      ) : skin.poster ? (
        <img key={skin.poster} src={skin.poster} alt="" loading={priority ? "eager" : "lazy"} />
      ) : null}
    </div>
  );
}

function TypedDialogue({ text, active }: { text: string; active: boolean }) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(text.length);
      return;
    }
    let shown = 0;
    const timer = window.setInterval(() => {
      shown = Math.min(shown + 1, text.length);
      setLength(shown);
      if (shown === text.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [active, text]);
  return <span className="typewriter avatar-typewriter">
    <span className="sr-only">{text}</span>
    <span className="typewriter-reserve" aria-hidden="true">{text}</span>
    <span className="typewriter-ink" aria-hidden="true">{text.slice(0, length)}</span>
  </span>;
}

export function AvatarStage({ skin, dialogue, priority, typeDialogue, dialogueLanguage }: {
  skin: Skin; dialogue: string; priority?: boolean; typeDialogue?: boolean; dialogueLanguage?: string;
}) {
  return (
    <div className={priority ? "avatar-stage hero-stage" : "avatar-stage"}>
      <PixelAvatar key={skin.action?.src ?? skin.idle} skin={skin} priority={priority} />
      <p className="avatar-dialogue" lang={dialogueLanguage}>
        <Terminal size={15} aria-hidden="true" />
        {typeDialogue === undefined ? <span>{dialogue}</span> : <TypedDialogue text={dialogue} active={typeDialogue} />}
      </p>
    </div>
  );
}
