import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, BriefcaseBusiness, Cloud, LayoutGrid, LogIn, LogOut, Network, NotebookPen, X } from "lucide-react";
import { authenticate, getHealth, getProfile, verifyAdminSession } from "./api";
import type { Profile } from "./api";
import Academy from "./components/Academy";
import type { AcademyView } from "./components/Academy";
import Career from "./components/Career";
import Architecture from "./components/Architecture";
import Portfolio from "./components/Portfolio";
import { smile } from "./data/sprites";

const Notes = lazy(() => import("./components/Notes"));

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
  "#bancos": "databases",
  "#provas": "college",
  "#terminal": "terminal",
  "#assistente": "assistant",
  "#assistant": "assistant",
};
const sectionAnchors = new Set(["#arquitetura", "#idiomas", "#coding", "#coding-dados", "#olhar-estendido", "#projetos", "#formacao", "#calistenia", "#eventos", "#certificacoes", "#analisar-vaga", "#recora", "#planos-2027", "#videos"]);
const siteRoutes = new Set(["/", "/arquitetura", "/academia", "/carreira", "/notes"]);
const routePath = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

function AccountDialog({
  dialog,
  onConnect,
}: {
  dialog: React.RefObject<HTMLDialogElement>;
  onConnect: (token: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const token = await authenticate(String(fields.get("email")), String(fields.get("password")), String(fields.get("admin-key")));
      onConnect(token);
      dialog.current?.close();
      form.reset();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível conectar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} onClose={() => { setError(""); dialog.current?.querySelector("form")?.reset(); }} aria-labelledby="account-title">
      <div className="dialog-heading">
        <h2 id="account-title">Acesso administrativo</h2>
        <button type="button" className="icon-button" aria-label="Fechar" onClick={() => dialog.current?.close()}><X size={20} /></button>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="account-email">E-mail</label>
        <input id="account-email" name="email" type="email" autoComplete="email" maxLength={254} required />
        <label htmlFor="account-password">Senha</label>
        <input id="account-password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
        <label htmlFor="account-admin-key">Chave administrativa</label>
        <input id="account-admin-key" name="admin-key" type="password" autoComplete="off" minLength={32} maxLength={256} required />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button primary" disabled={busy}>{busy ? "Conectando…" : "Entrar"}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function App() {
  const [address, setAddress] = useState(window.location.href);
  const { pathname, search, hash } = new URL(address);
  const [token, setToken] = useState("");
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    function restoreSession() {
      const saved = loadToken();
      if (!saved) return;
      void verifyAdminSession(saved, controller.signal).then((session) => {
        if (!controller.signal.aborted && sessionStorage.getItem(tokenKey) === saved) {
          setToken(session.admin ? saved : "");
        }
      }).catch(() => {
        if (!controller.signal.aborted && sessionStorage.getItem(tokenKey) === saved) setToken("");
      });
    }
    restoreSession();
    const timer = window.setInterval(restoreSession, 30_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const syncAddress = () => setAddress(window.location.href);
    function navigate(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || !siteRoutes.has(routePath(url.pathname))) return;
      if (url.href === window.location.href) {
        event.preventDefault();
        if (!url.hash) window.scrollTo(0, 0);
        return;
      }
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      window.history.pushState(null, "", url);
      syncAddress();
    }
    document.addEventListener("click", navigate);
    window.addEventListener("hashchange", syncAddress);
    window.addEventListener("popstate", syncAddress);
    return () => {
      document.removeEventListener("click", navigate);
      window.removeEventListener("hashchange", syncAddress);
      window.removeEventListener("popstate", syncAddress);
    };
  }, []);

  useEffect(() => {
    const target = sectionAnchors.has(hash) ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, search, hash]);

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

  const path = routePath(pathname);
  const architecture = path === "/arquitetura";
  const academyTab = Object.hasOwn(academyViews, hash) ? academyViews[hash] : undefined;
  const academy = path === "/academia" ? academyTab ?? "tracks" : path === "/" ? academyTab : undefined;
  const career = path === "/carreira" || (path === "/" && (hash === "#carreira" || hash === "#analisar-vaga"));
  const notes = path === "/notes";
  const portfolio = !architecture && !academy && !career && !notes;

  return (
    <>
      <svg width="0" height="0" className="sprite-filters" aria-hidden="true">
        <defs>
          <filter id="sprite-light-matte" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -21.25 -21.25 -21.25 0 62.5" result="matte" />
            <feComposite in="SourceGraphic" in2="matte" operator="in" />
          </filter>
        </defs>
      </svg>
      <header className="topbar no-print">
        <div className="shell header-inner flex items-center justify-between">
          <a href="/" className="brand" aria-label="Nicolas Hub — página inicial">
            <img className="brand-sprite" src={smile} alt="" />
            <strong>Nicolas<span>Hub</span></strong>
          </a>
          <nav className="main-nav" aria-label="Navegação principal">
            <a href="/" aria-current={portfolio ? "page" : undefined}><LayoutGrid size={16} /> Portfólio</a>
            <a href="/arquitetura" aria-current={architecture ? "page" : undefined}><Network size={16} /> Arquitetura</a>
            <a href="/academia" aria-current={academy ? "page" : undefined}><Cloud size={16} /> Academia</a>
            <a href="/notes" aria-current={notes ? "page" : undefined}><NotebookPen size={16} /> Notes</a>
            <a href="/carreira" aria-current={career ? "page" : undefined}><BriefcaseBusiness size={16} /> Carreira</a>
          </nav>
          <div className="header-tools flex items-center">
            <button type="button" className="button secondary account-button" onClick={token ? disconnect : signIn}>
              {token ? <LogOut size={17} /> : <LogIn size={17} />}
              {token ? "Sair" : "Admin"}
            </button>
          </div>
        </div>
      </header>
      <main className={portfolio ? "portfolio-main" : "shell main-content"}>
        {portfolio && <Portfolio profile={profile} admin={Boolean(token)} />}
        {architecture && <Architecture key={search} admin={Boolean(token)} />}
        {academy && <Academy key={workspaceVersion} view={academy} token={token} onSignIn={signIn} />}
        {career && <Career key={workspaceVersion} profile={profile} token={token} openAnalysis={hash === "#analisar-vaga"} />}
        {notes && <Suspense fallback={<p role="status">Abrindo o caderno…</p>}><Notes admin={Boolean(token)} /></Suspense>}
        {profileError && (portfolio || career) && (
          <div className={portfolio ? "shell actions profile-retry no-print" : "actions no-print"} role="status"><p className="muted">Dados do perfil indisponíveis.</p>
            <button type="button" className="button secondary" onClick={() => setLoadAttempt((current) => current + 1)}>Recarregar perfil</button>
          </div>
        )}
      </main>
      <footer className="footer no-print">
        <div className="shell footer-inner">
          <a href="/">Nicolas Hub <ArrowUpRight size={15} /></a>
          <span className={`api-status ${health}`}><i />{health === "online" ? "API disponível" : health === "offline" ? "API indisponível" : "Conectando à API"}</span>
        </div>
      </footer>
      <AccountDialog dialog={dialog} onConnect={(accessToken) => { sessionStorage.setItem(tokenKey, accessToken); setToken(accessToken); }} />
    </>
  );
}
