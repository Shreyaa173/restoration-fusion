import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { getBenchmarks, getHealth, restore } from "./api.js";
import {
  ABSTRACT, AFFILIATION, AUTHORS, BIBTEX, DEFAULT_API, KEY_POINTS, LINKS, METHOD_STEPS, MODELS,
  NOTES, PROJECT_NAME, REFERENCES, TASKS, TITLE, TRAINING,
} from "./config.js";

const LS_KEY = "rf_backend_url";
const THEME_KEY = "rf_theme";
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const fmt = (v, d) => (v == null || Number.isNaN(v) ? "—" : v.toFixed(d));
const EXPERTS = ["hinet", "sfnet", "adair"];
const meanOf = (vals) => { const v = vals.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* ---------- theme ---------- */

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
  return (
    <button className="theme" onClick={onToggle} aria-pressed={theme === "dark"} aria-label="Toggle dark theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {theme === "dark" ? (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        ) : (
          <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
        )}
      </svg>
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}

/* ---------- before / after slider ---------- */

function BeforeAfter({ before, after, beforeLabel, afterLabel, ratio = "16 / 10" }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ba" style={{ aspectRatio: ratio }}>
      <img src={after} alt={afterLabel} draggable={false} />
      <div className="top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={beforeLabel} draggable={false} />
      </div>
      <input className="range" type="range" min="0" max="100" step="0.5" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={`Compare ${beforeLabel} and ${afterLabel}`} />
      <div className="line" style={{ left: `${pos}%` }} />
      <div className="knob" style={{ left: `${pos}%` }} aria-hidden="true">⇄</div>
      <span className="lab l">{beforeLabel}</span>
      <span className="lab r">{afterLabel}</span>
    </div>
  );
}

/* A drawn street scene so the hero has something to compare before the user runs anything. */
function useSample(task) {
  return useMemo(() => {
    const w = 800, h = 500;
    let seed = 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const make = () => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
    const scene = make(); const x = scene.getContext("2d");
    const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#8fb8e0"); sky.addColorStop(1, "#e9dcc0");
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    [[30, 140, 150, "#59616d"], [200, 80, 170, "#7a6f66"], [400, 170, 130, "#4d5a6b"], [550, 60, 120, "#6b5d58"], [690, 130, 110, "#55606a"]].forEach(([bx, top, bw, col]) => {
      x.fillStyle = col; x.fillRect(bx, top, bw, 410 - top);
      x.fillStyle = "rgba(255, 233, 160, 0.85)";
      for (let wy = top + 16; wy < 390; wy += 34) for (let wx = bx + 12; wx < bx + bw - 14; wx += 28) x.fillRect(wx, wy, 14, 18);
    });
    x.fillStyle = "#33363d"; x.fillRect(0, 410, w, 90);
    x.fillStyle = "#e8e2c8"; for (let dx = 10; dx < w; dx += 90) x.fillRect(dx, 452, 50, 6);
    x.fillStyle = "#c2412d"; x.beginPath(); x.roundRect(250, 380, 230, 62, 14); x.fill();
    x.fillStyle = "#a63625"; x.beginPath(); x.roundRect(300, 346, 130, 48, 12); x.fill();
    x.fillStyle = "#cfe3f2"; x.fillRect(312, 354, 50, 30); x.fillRect(368, 354, 50, 30);
    x.fillStyle = "#15171b"; [[300, 442], [430, 442]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill(); });
    x.fillStyle = "#fff"; [[300, 442], [430, 442]].forEach(([cx, cy]) => { x.beginPath(); x.arc(cx, cy, 9, 0, 7); x.fill(); });
    x.fillStyle = "#1c1f26"; x.fillRect(560, 250, 190, 52);
    x.fillStyle = "#ffe08a"; x.font = "700 30px 'Inter', sans-serif"; x.fillText("CAFÉ 24H", 578, 288);

    const input = make(); const ix = input.getContext("2d");
    if (task === "deblur") { ix.filter = "blur(5px)"; ix.drawImage(scene, 0, 0); ix.filter = "none"; }
    else {
      ix.drawImage(scene, 0, 0); ix.fillStyle = "rgba(60, 70, 85, 0.18)"; ix.fillRect(0, 0, w, h);
      ix.strokeStyle = "rgba(235, 242, 255, 0.55)"; ix.lineWidth = 1.3;
      for (let i = 0; i < 380; i++) { const sx = rnd() * (w + 80), sy = rnd() * h, len = 18 + rnd() * 26; ix.beginPath(); ix.moveTo(sx, sy); ix.lineTo(sx - len * 0.28, sy + len); ix.stroke(); }
    }
    return { before: input.toDataURL("image/png"), after: scene.toDataURL("image/png") };
  }, [task]);
}

/* ---------- method figure ---------- */

function MethodFigure() {
  const Arrow = ({ x1, y1, x2, y2 }) => <path className="fg-line" d={`M${x1} ${y1} L${x2} ${y2}`} markerEnd="url(#ah)" />;
  const experts = [["HINet", "spatial CNN", 36], ["SFNet", "frequency CNN", 150], ["AdaIR", "Transformer", 264]];
  const stages = ["Align", "Attention fusion", "Image mix", "Refine"];
  return (
    <div className="fig">
      <svg viewBox="0 0 960 350" role="img" aria-label="Pipeline: the degraded image goes through three frozen experts; their images and features enter the fusion module (align, attention fusion, image mix, refine), which outputs the restored image.">
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="var(--muted)" />
          </marker>
        </defs>
        <rect className="fg-box" x="14" y="140" width="118" height="70" rx="8" />
        <text className="fg-t" x="73" y="171" textAnchor="middle">Degraded</text>
        <text className="fg-t" x="73" y="188" textAnchor="middle">input</text>
        {experts.map(([n, k, y]) => (
          <g key={n}>
            <Arrow x1={132} y1={175} x2={196} y2={y + 25} />
            <rect className="fg-box" x="198" y={y} width="170" height="50" rx="8" />
            <text className="fg-t" x="283" y={y + 22} textAnchor="middle">{n}</text>
            <text className="fg-s" x="283" y={y + 39} textAnchor="middle">{k} · frozen</text>
            <Arrow x1={368} y1={y + 25} x2={428} y2={y + 25 > 175 ? 200 : y + 25 < 175 ? 150 : 175} />
          </g>
        ))}
        <text className="fg-a" x="398" y="108" textAnchor="middle">image</text>
        <text className="fg-a" x="398" y="121" textAnchor="middle">+ features</text>
        <rect className="fg-group" x="430" y="22" width="340" height="306" rx="12" />
        <text className="fg-a" x="446" y="44">FUSION MODULE · trained</text>
        {stages.map((s, i) => (
          <g key={s}>
            <rect className="fg-ours" x="456" y={62 + i * 66} width="288" height="46" rx="8" />
            <text className="fg-t" x="600" y={90 + i * 66} textAnchor="middle">{s}</text>
            {i < 3 && <Arrow x1={600} y1={108 + i * 66} x2={600} y2={128 + i * 66} />}
          </g>
        ))}
        <Arrow x1={770} y1={175} x2={826} y2={175} />
        <rect className="fg-box" x="828" y="130" width="118" height="90" rx="8" />
        <text className="fg-t" x="887" y="168" textAnchor="middle">Restored</text>
        <text className="fg-t" x="887" y="185" textAnchor="middle">image</text>
        <text className="fg-s" x="887" y="204" textAnchor="middle">blend + correction</text>
      </svg>
    </div>
  );
}

/* ---------- demo pieces ---------- */

function Dropzone({ label, hint, file, preview, onFile, optional }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const pick = (f) => f && f.type.startsWith("image/") && onFile(f);
  return (
    <div
      className={`drop ${over ? "over" : ""} ${preview ? "filled" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
      role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      {preview ? (
        <><img src={preview} alt={label} /><button className="chip" onClick={(e) => { e.stopPropagation(); onFile(null); }}>Remove</button></>
      ) : (
        <div className="drop-empty"><span className="mono">{optional ? "OPTIONAL" : "REQUIRED"}</span><strong>{label}</strong><span className="muted small">{hint}</span></div>
      )}
      {file && <span className="drop-name mono small">{file.name}</span>}
    </div>
  );
}

function ResultCard({ title, sub, ours, img, note, metrics, time, onOpen, downloadName }) {
  return (
    <figure className={`card ${ours ? "ours" : ""}`}>
      <div className="card-img">
        {img ? <img src={img} alt={title} onClick={onOpen} /> : <div className="unavailable"><span className="mono small">NO OUTPUT</span><p>{note || "Not available"}</p></div>}
      </div>
      <figcaption>
        <div className="card-head">
          <div><h4>{title}</h4><span className="muted small">{sub}</span></div>
          {img && downloadName && <a className="chip" href={img} download={downloadName}>Save</a>}
        </div>
        {img && note && <p className="muted small">{note}</p>}
        {(metrics || time != null) && (
          <div className="mini">
            {metrics && <><span>PSNR {fmt(metrics.psnr, 2)}</span><span>SSIM {fmt(metrics.ssim, 4)}</span></>}
            {time != null && <span>{time} ms</span>}
          </div>
        )}
      </figcaption>
    </figure>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!item) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <img src={item.src} alt={item.title} />
      <span className="mono small">{item.title} · click or press Esc to close</span>
    </div>
  );
}

function MetricsTable({ data }) {
  const rows = MODELS.map((m) => ({ m, r: data.results.find((x) => x.id === m.id) }));
  const best = (key, dir) => {
    const vals = rows.map(({ r }) => r?.[key]).filter((v) => v != null);
    return vals.length ? (dir > 0 ? Math.max(...vals) : Math.min(...vals)) : null;
  };
  const bp = best("psnr", 1), bs = best("ssim", 1), bt = best("time_ms", -1);
  const get = (id, k) => data.results.find((x) => x.id === id)?.[k];
  const avgP = meanOf(EXPERTS.map((id) => get(id, "psnr")));
  const avgS = meanOf(EXPERTS.map((id) => get(id, "ssim")));
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Model</th><th>PSNR (dB)</th><th>SSIM</th><th>Time</th></tr></thead>
        <tbody>
          {rows.map(({ m, r }) => (
            <Fragment key={m.id}>
              {m.ours && <tr className="mean-row"><td>Mean of the 3 experts</td><td>{fmt(avgP, 2)}</td><td>{fmt(avgS, 4)}</td><td>—</td></tr>}
              <tr className={m.ours ? "ours-row" : ""}>
                <td>{m.name}</td>
                <td className={r?.psnr != null && r.psnr === bp ? "best" : ""}>{fmt(r?.psnr, 2)}</td>
                <td className={r?.ssim != null && r.ssim === bs ? "best" : ""}>{fmt(r?.ssim, 4)}</td>
                <td className={r?.time_ms != null && r.time_ms === bt ? "best" : ""}>{r?.time_ms != null ? `${r.time_ms} ms` : "—"}</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BenchmarkTable({ taskId, bench }) {
  const task = TASKS.find((t) => t.id === taskId);
  const b = bench?.[taskId];
  if (!b) return null;
  const rows = MODELS.map((m) => ({ m, v: b.rows?.[m.id] }));
  const filled = rows.some(({ v }) => v?.psnr != null);
  const bp = Math.max(...rows.map(({ v }) => v?.psnr ?? -Infinity));
  const bs = Math.max(...rows.map(({ v }) => v?.ssim ?? -Infinity));
  const avgP = meanOf(EXPERTS.map((id) => b.rows?.[id]?.psnr));
  const avgS = meanOf(EXPERTS.map((id) => b.rows?.[id]?.ssim));
  return (
    <div className="bench">
      <h4>{task.label} · {b.dataset}{b.n_images ? ` · ${b.n_images} images` : ""}</h4>
      <div className="tbl">
        <table>
          <thead><tr><th>Model</th><th>PSNR (dB)</th><th>SSIM</th></tr></thead>
          <tbody>
            {rows.map(({ m, v }) => (
              <Fragment key={m.id}>
                {m.ours && <tr className="mean-row"><td>Mean of the 3 experts</td><td>{fmt(avgP, 2)}</td><td>{fmt(avgS, 4)}</td></tr>}
                <tr className={m.ours ? "ours-row" : ""}>
                  <td>{m.name}</td>
                  <td className={filled && v?.psnr === bp ? "best" : ""}>{fmt(v?.psnr, 2)}</td>
                  <td className={filled && v?.ssim === bs ? "best" : ""}>{fmt(v?.ssim, 4)}</td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!filled && <p className="muted small" style={{ marginTop: 8 }}>Not measured yet. Fill <code>benchmarks.json</code> on the backend.</p>}
    </div>
  );
}

function BibTex() {
  const [done, setDone] = useState(false);
  const preRef = useRef(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(BIBTEX); }
    catch { const r = document.createRange(); r.selectNodeContents(preRef.current); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    setDone(true); setTimeout(() => setDone(false), 1600);
  };
  return (
    <div className="code">
      <button className="btn" onClick={copy}>{done ? "Copied" : "Copy"}</button>
      <pre ref={preRef}>{BIBTEX}</pre>
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [api, setApi] = useState(() => store.get(LS_KEY) || DEFAULT_API);
  const [conn, setConn] = useState({ state: "idle", info: null });
  const [bench, setBench] = useState(null);
  const [task, setTask] = useState("deblur");
  const [image, setImage] = useState(null);
  const [gt, setGt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gtPreview, setGtPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [pick, setPick] = useState("fusion");
  const [box, setBox] = useState(null);
  const abortRef = useRef(null);
  const sample = useSample(task);

  useEffect(() => { if (!image) { setPreview(null); return; } const u = URL.createObjectURL(image); setPreview(u); return () => URL.revokeObjectURL(u); }, [image]);
  useEffect(() => { if (!gt) { setGtPreview(null); return; } const u = URL.createObjectURL(gt); setGtPreview(u); return () => URL.revokeObjectURL(u); }, [gt]);

  useEffect(() => {
    if (!api.trim()) { setConn({ state: "idle", info: null }); return; }
    setConn({ state: "checking", info: null });
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const info = await getHealth(api, ctl.signal);
        store.set(LS_KEY, api);
        setConn({ state: "ok", info });
        getBenchmarks(api, ctl.signal).then(setBench).catch(() => setBench(null));
      } catch (e) { if (e.name !== "AbortError") setConn({ state: "error", info: null }); }
    }, 500);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [api]);

  useEffect(() => {
    if (!busy) return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [busy]);

  useEffect(() => { setData(null); setError(""); }, [task]);

  const run = async () => {
    if (!image || conn.state !== "ok") return;
    setBusy(true); setElapsed(0); setError(""); setData(null);
    abortRef.current = new AbortController();
    try {
      const d = await restore(api, { image, gt, task }, abortRef.current.signal);
      setData(d); setPick("fusion");
      requestAnimationFrame(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) { if (e.name !== "AbortError") setError(e.message || "Request failed"); }
    finally { setBusy(false); }
  };

  const taskInfo = TASKS.find((t) => t.id === task);
  const connLabel = { idle: "No backend", checking: "Checking…", ok: "Connected", error: "Unreachable" }[conn.state];
  const modelsReady = conn.info?.models?.[task] || {};
  const missing = MODELS.filter((m) => m.id !== "fusion" && conn.state === "ok" && modelsReady[m.id] === false);
  const picked = data?.results.find((r) => r.id === pick);

  return (
    <>
      <div className="bar">
        <nav aria-label="Sections">
          <a href="#abstract">Abstract</a><a href="#method">Method</a><a href="#demo">Demo</a><a href="#results-tables">Metrics</a><a href="#notes">Notes</a><a href="#cite">BibTeX</a>
        </nav>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <main className="page">
        <header className="head">
          <p className="tag">{PROJECT_NAME}</p>
          <h1>{TITLE}</h1>
          <p className="authors">
            {AUTHORS.map((a) => (a.url ? <a key={a.name} href={a.url} target="_blank" rel="noreferrer">{a.name}</a> : <span key={a.name}>{a.name}</span>))}
          </p>
          <p className="affil">{AFFILIATION}</p>
          <div className="links">
            {LINKS.map((l) => l.url ? (
              <a key={l.label} className={`btn ${l.label === "Live demo" ? "solid" : ""}`} href={l.url} {...(l.url.startsWith("#") ? {} : { target: "_blank", rel: "noreferrer" })}>{l.label}</a>
            ) : (
              <span key={l.label} className="btn" aria-disabled="true">{l.label} <span className="mono">SOON</span></span>
            ))}
          </div>
        </header>

        <section className="s" style={{ paddingTop: 8 }}>
          <div className="wide">
            <BeforeAfter before={sample.before} after={sample.after} beforeLabel={task === "deblur" ? "Blurry input" : "Rainy input"} afterLabel="Restored" ratio="8 / 5" />
          </div>
          <p className="cap">Drag the slider. This is a drawn sample for illustration; the demo below runs the real models on your image.</p>
        </section>

        <section id="abstract" className="s">
          <h2>Abstract</h2>
          <p className="prose abstract">{ABSTRACT}</p>
        </section>

        <section className="s">
          <h2>Key points</h2>
          <div className="keys">{KEY_POINTS.map((k) => <div key={k.title} className="key"><h3>{k.title}</h3><p>{k.body}</p></div>)}</div>
        </section>

        <section id="method" className="s">
          <h2>Method</h2>
          <MethodFigure />
          <p className="cap">Three frozen experts feed a trained fusion module. Dashed box: the only part that learns.</p>
          <ul className="steps">{METHOD_STEPS.map(([a, b]) => <li key={a}><strong>{a}</strong><span>{b}</span></li>)}</ul>
          <h3 style={{ fontFamily: "var(--serif)", margin: "28px 0 6px" }}>Training</h3>
          <p className="prose muted">{TRAINING}</p>
        </section>

        <section id="demo" className="s">
          <h2>Interactive demo</h2>
          <p className="muted prose" style={{ marginBottom: 16 }}>Upload one image and see the restoration from all three experts and from the fusion module, side by side.</p>
          <div className="panel">
            <div className="backend">
              <label htmlFor="api">BACKEND URL (COLAB TUNNEL)</label>
              <div className="backend-row">
                <input id="api" type="url" placeholder="https://something.trycloudflare.com" value={api} onChange={(e) => setApi(e.target.value)} spellCheck={false} />
                <span className={`status ${conn.state}`}><i />{connLabel}</span>
              </div>
              {conn.state === "ok" && <p className="muted small">GPU: {conn.info.gpu} · images larger than {conn.info.max_side}px are downscaled</p>}
              {conn.state === "error" && <p className="warn small">Cannot reach the backend. Run the Colab notebook, then paste the printed URL here.</p>}
              {missing.length > 0 && <p className="warn small">Not loaded on the backend for {taskInfo.label.toLowerCase()}: {missing.map((m) => m.name).join(", ")}. Fusion uses the rest.</p>}
            </div>

            <div className="seg" role="tablist" aria-label="Task">
              {TASKS.map((t) => (
                <button key={t.id} role="tab" aria-selected={task === t.id} onClick={() => setTask(t.id)}>{t.label} <span className="mono small">{t.dataset}</span></button>
              ))}
            </div>

            <div className="inputs">
              <Dropzone label={`Drop a ${taskInfo.hint}`} hint="or click to choose · PNG / JPG" file={image} preview={preview} onFile={setImage} />
              <Dropzone label="Ground-truth clean image" hint="adds PSNR and SSIM, same scene as the input" file={gt} preview={gtPreview} onFile={setGt} optional />
            </div>

            <div className="actions">
              {!busy ? (
                <button className="primary" disabled={!image || conn.state !== "ok"} onClick={run}>{task === "deblur" ? "Deblur image" : "Remove rain"}</button>
              ) : (
                <button className="primary" onClick={() => abortRef.current?.abort()}>Cancel · {elapsed}s</button>
              )}
              {!image && <span className="muted small">Choose an image first.</span>}
              {image && conn.state !== "ok" && <span className="muted small">Connect the backend first.</span>}
              {busy && <span className="muted small">Running three models and the fusion module…</span>}
            </div>
            {error && <p className="error">{error}</p>}
          </div>

          <div id="results" className="results">
            {data && (
              <>
                {!data.fusion_trained && <p className="banner">Fusion weights for this task are not trained yet, so the fusion output is a placeholder equal to a plain average of the available models.</p>}
                <div className="tabs" role="group" aria-label="Compare input with">
                  {MODELS.map((m) => {
                    const r = data.results.find((x) => x.id === m.id);
                    return <button key={m.id} aria-pressed={pick === m.id} disabled={!r?.image} onClick={() => setPick(m.id)}>{m.name}</button>;
                  })}
                </div>
                {picked?.image && (
                  <BeforeAfter before={data.input} after={picked.image} beforeLabel="Input" afterLabel={picked.name} ratio={`${data.width} / ${data.height}`} />
                )}
                <div className="grid">
                  <ResultCard title="Input" sub={`${data.width}×${data.height} px`} img={data.input} onOpen={() => setBox({ src: data.input, title: "Input" })} downloadName="input.png" />
                  {MODELS.map((m) => {
                    const r = data.results.find((x) => x.id === m.id);
                    return (
                      <ResultCard key={m.id} title={m.name} sub={m.kind} ours={m.ours} img={r?.image} note={r?.note} time={r?.time_ms}
                        metrics={data.has_gt && r?.psnr != null ? r : null}
                        onOpen={() => setBox({ src: r.image, title: m.name })} downloadName={`${m.id}_${task}.png`} />
                    );
                  })}
                </div>
              </>
            )}
            {busy && <div className="skeleton-grid">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}</div>}
          </div>
        </section>

        <section id="results-tables" className="s">
          <h2>Quantitative comparison</h2>
          <div className="two">
            <div className="panel">
              <h3>Your image</h3>
              {data?.has_gt ? (
                <>
                  <MetricsTable data={data} />
                  <p className="muted small" style={{ marginTop: 8 }}>{data.y_channel ? "PSNR and SSIM on the Y (luma) channel, as in the Rain13k benchmarks." : "PSNR and SSIM on RGB."} Best value is highlighted.</p>
                </>
              ) : (
                <p className="muted">{data ? "Add the ground-truth clean image next to the input to score each output." : "Run the demo with a ground-truth image to see PSNR and SSIM per model here."}</p>
              )}
            </div>
            <div className="panel">
              <h3>Test-set averages</h3>
              {conn.state === "ok" && bench ? <><BenchmarkTable taskId="deblur" bench={bench} /><BenchmarkTable taskId="derain" bench={bench} /></> : <p className="muted">Connect the backend to load the benchmark table.</p>}
            </div>
          </div>
        </section>

        <section id="notes" className="s">
          <h2>Notes</h2>
          <div className="notes">{NOTES.map((n) => <div key={n.title}><h3>{n.title}</h3><p>{n.body}</p></div>)}</div>
        </section>

        <section id="cite" className="s">
          <h2>BibTeX</h2>
          <BibTex />
        </section>

        <footer>
          <div>
            <p className="tag">Built on</p>
            <ul>{REFERENCES.map(([n, t, url]) => <li key={n}>{url ? <a href={url} target="_blank" rel="noreferrer">{n}</a> : <strong>{n}</strong>} <span className="muted">{t}</span></li>)}</ul>
          </div>
          <p className="muted small">{PROJECT_NAME} · the three pretrained models are frozen; only the fusion module is trained.</p>
        </footer>
      </main>

      <Lightbox item={box} onClose={() => setBox(null)} />
    </>
  );
}