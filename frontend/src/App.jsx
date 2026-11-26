import { useEffect, useState } from "react";
import { Abstract, Cite, Cost, Footer, Hero, 
  // Limits, 
  Method, Results, Tri, Trust } from "./sections/Report.jsx";
import Demo from "./sections/Demo.jsx";
import { EXPERTS, PROJECT_NAME } from "./config.js";

const THEME_KEY = "rf_theme";
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

const SECTIONS = [
  ["abstract", "Abstract"],
  ["method", "Method"],
  ["results", "Results"],
  ["trust", "Learned trust"],
  ["demo", "Demo"],
  ["cost", "Cost"],
  // ["limits", "Limitations"],
  ["cite", "Cite"],
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = store.get(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggle = () => setTheme((t) => { const n = t === "dark" ? "light" : "dark"; store.set(THEME_KEY, n); return n; });
  return [theme, toggle];
}

function ThemeToggle({ theme, onToggle }) {
  const dark = theme === "dark";
  return (
    <button className="theme" onClick={onToggle} aria-pressed={dark} aria-label="Dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {dark ? <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
          : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
      </svg>
      {dark ? "Dark" : "Light"}
    </button>
  );
}

/* Highlights the section that is currently under the top third of the viewport. */
function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((i) => document.getElementById(i)).filter(Boolean);
    if (!("IntersectionObserver" in window) || !els.length) return;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
      const first = ids.find((i) => seen.get(i));
      if (first) setActive(first);
    }, { rootMargin: "-18% 0px -62% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const IDS = SECTIONS.map(([id]) => id);

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const active = useScrollSpy(IDS);
  // Expert colours are defined once in config.js and exposed to CSS as variables.
  const vars = Object.fromEntries(EXPERTS.map((e) => [`--c-${e.id}`, e.color]));

  return (
    <div style={vars}>
      <a className="skip" href="#abstract">Skip to content</a>
      <div className="topbar">
        <a className="brand" href="#top" aria-label={`${PROJECT_NAME}, back to top`}><Tri />{PROJECT_NAME}</a>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div id="top" className="shell">
        <Hero />
        <div className="layout">
          <nav className="rail" aria-label="Sections">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}>{label}</a>
            ))}
          </nav>
          <main className="main">
            <Abstract />
            <Method />
            <Results />
            <Trust />
            <Demo />
            <Cost />
            {/* <Limits /> */}
            <Cite />
          </main>
        </div>
        <Footer />
      </div>
    </div>
  );
}
