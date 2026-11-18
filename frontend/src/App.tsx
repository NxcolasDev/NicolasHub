import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, BriefcaseBusiness, Cloud, LayoutGrid, LogIn, LogOut, Orbit, X } from "lucide-react";
import { authenticate, getHealth, getProfile } from "./api";
import type { Profile } from "./api";
import Academy from "./components/Academy";
import type { AcademyView } from "./components/Academy";
import Career from "./components/Career";
import Portfolio from "./components/Portfolio";

const tokenKey = "nicolas-hub-token";
const legacyTokenKey = "pylogic-token";

function loadToken() {
  const current = sessionStorage.getItem(tokenKey);
  const legacy = sessionStorage.getItem(legacyTokenKey);
  if (!current && legacy) sessionStorage.setItem(tokenKey, legacy);
  if (legacy !== null) sessionStorage.removeItem(legacyTokenKey);
  return current || legacy || "";
}

const academyViews: Record<string, AcademyView> = {
  "#academia": "tracks",
  "#provas": "college",
  "#terminal": "terminal",
  "#assistente": "assistant",
  "#assistant": "assistant",
};

function AccountDialog({
  dialog,
  onConnect,
}: {
  dialog: React.RefObject<HTMLDialogElement>;
  onConnect: (token: string) => void;
}) {
  const [create, setCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const token = await authenticate(String(fields.get("email")), String(fields.get("password")), create);
      onConnect(token);
      dialog.current?.close();
      form.reset();
      setCreate(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível conectar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} onClose={() => { setError(""); dialog.current?.querySelector("form")?.reset(); }} aria-labelledby="account-title">
      <div className="dialog-heading">
        <h2 id="account-title">{create ? "Criar conta" : "Entrar no Nicolas Hub"}</h2>
        <button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="account-email">E-mail</label>
        <input id="account-email" name="email" type="email" autoComplete="email" maxLength={254} required />
        <label htmlFor="account-password">Senha</label>
        <input id="account-password" name="password" type="password" autoComplete={create ? "new-password" : "current-password"} minLength={create ? 12 : 1} maxLength={128} required />
        {create && <p className="muted">Use pelo menos 12 caracteres.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button primary" disabled={busy}>{busy ? "Conectando…" : create ? "Criar conta" : "Entrar"}</button>
          <button type="button" className="button secondary" disabled={busy} onClick={() => { setCreate((current) => !current); setError(""); }}>{create ? "Já tenho conta" : "Criar conta"}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [token, setToken] = useState(loadToken);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash);
      if (window.location.hash !== "#analisar-vaga") window.scrollTo(0, 0);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setProfileError(false);
    getProfile(controller.signal).then(setProfile).catch(() => {
      if (!controller.signal.aborted) setProfileError(true);
    });
    return () => controller.abort();
  }, [loadAttempt]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      getHealth().then((result) => {
        if (active) setHealth(result.status === "ok" ? "online" : "offline");
      }).catch(() => {
        if (active) setHealth("offline");
      });
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  function disconnect() {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(legacyTokenKey);
    setToken("");
    setWorkspaceVersion((current) => current + 1);
  }

  function signIn() {
    dialog.current?.showModal();
  }

  const academy = Object.hasOwn(academyViews, hash) ? academyViews[hash] : undefined;
  const career = hash === "#carreira" || hash === "#analisar-vaga";
  const portfolio = !academy && !career;

  return (
    <>
      <header className="topbar no-print">
        <div className="shell header-inner">
          <a href="#portfolio" className="brand" aria-label="Nicolas Hub — página inicial"><span className="brand-icon"><Orbit size={24} /></span><strong>Nicolas<span>Hub</span></strong></a>
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="#portfolio" aria-current={portfolio ? "page" : undefined}><LayoutGrid size={17} /> Portfólio</a>
            <a href="#academia" aria-current={academy ? "page" : undefined}><Cloud size={18} /> Academia</a>
            <a href="#carreira" aria-current={career ? "page" : undefined}><BriefcaseBusiness size={17} /> Carreira</a>
          </nav>
          <button type="button" className="button secondary account-button" onClick={token ? disconnect : signIn}>
            {token ? <LogOut size={17} /> : <LogIn size={17} />}
            {token ? "Sair" : "Entrar"}
          </button>
        </div>
      </header>
      <main className="shell main-content">
        {portfolio && <Portfolio profile={profile} />}
        {academy && <Academy key={workspaceVersion} view={academy} token={token} onSignIn={signIn} />}
        {career && <Career key={workspaceVersion} profile={profile} token={token} onSignIn={signIn} />}
        {profileError && (portfolio || career) && (
          <div className="actions no-print" role="status"><p className="muted">Dados do perfil indisponíveis.</p>
            <button type="button" className="button secondary" onClick={() => setLoadAttempt((current) => current + 1)}>Recarregar perfil</button>
          </div>
        )}
      </main>
      <footer className="footer no-print">
        <div className="shell footer-inner">
          <a href="#portfolio">Nicolas Hub <ArrowUpRight size={15} /></a>
          <span className={`api-status ${health}`}><i />{health === "online" ? "API disponível" : health === "offline" ? "API indisponível" : "Conectando à API"}</span>
        </div>
      </footer>
      <AccountDialog dialog={dialog} onConnect={(accessToken) => { sessionStorage.setItem(tokenKey, accessToken); setToken(accessToken); }} />
    </>
  );
}
