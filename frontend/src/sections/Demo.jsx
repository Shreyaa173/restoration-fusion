import { useEffect, useRef, useState } from "react";
import BeforeAfter from "../components/BeforeAfter.jsx";
import { Tri, Notes } from "./Report.jsx";
import { getHealth, restore } from "../api.js";
import { DEFAULT_API, EXPERTS, MODELS, TASK, TRUST_COLORS } from "../config.js";

const LS_KEY = "rf_backend_url";
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
const fmt = (v, d) => (v == null || Number.isNaN(v) ? "–" : v.toFixed(d));

/* ---------- canvas helpers ---------- */

const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
const pixels = (im, w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };

/* Absolute difference to the ground truth as a heatmap. 64/255 or more is full scale. */
async function errorMapURL(outSrc, gtSrc) {
  const [o, g] = await Promise.all([loadImage(outSrc), loadImage(gtSrc)]);
  const w = o.naturalWidth, h = o.naturalHeight;
  const A = pixels(o, w, h), B = pixels(g, w, h);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const cx = c.getContext("2d"); const out = cx.createImageData(w, h);
  let sum = 0;
  for (let i = 0; i < A.length; i += 4) {
    const d = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3;
    sum += d;
    const e = Math.min(1, d / 64);
    out.data[i] = 255 * Math.min(1, e * 1.7);
    out.data[i + 1] = 255 * Math.max(0, Math.min(1, (e - 0.4) * 2));
    out.data[i + 2] = 255 * 0.18 * (1 - e);
    out.data[i + 3] = 255;
  }
  cx.putImageData(out, 0, 0);
  return { url: c.toDataURL("image/png"), mean: sum / (A.length / 4) };
}

/* ---------- small parts ---------- */

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
      role="button" tabIndex={0} aria-label={`${label}. ${hint}`}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files[0])} />
      {preview ? (
        <>
          <img src={preview} alt={label} />
          <div className="drop-bar">
            <span>{file?.name}</span>
            <button className="chip" onClick={(e) => { e.stopPropagation(); onFile(null); }}>Remove</button>
          </div>
        </>
      ) : (
        <div className="drop-empty">
          <strong>{label}</strong>
          <span>{hint}</span>
          <em>{optional ? "Optional" : "Required"}</em>
        </div>
      )}
    </div>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [item, onClose]);
  if (!item) return null;
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={item.title}>
      <img src={item.src} alt={item.title} />
      <span>{item.title}. Click or press Esc to close.</span>
    </div>
  );
}

function ModelMark({ m }) {
  return m.ours ? <Tri /> : m.color ? <i className="sw" style={{ background: m.color }} aria-hidden="true" /> : <i className="sw hollow" aria-hidden="true" />;
}

/* ---------- views ---------- */

function CompareView({ data, pick, setPick, onOpen }) {
  const rows = MODELS.map((m) => ({ m, r: data.results.find((x) => x.id === m.id) }));
  const bestP = data.has_gt ? Math.max(...rows.map(({ r }) => r?.psnr ?? -Infinity)) : null;
  const picked = rows.find(({ m }) => m.id === pick);
  return (
    <div className="bench">
      <div className="bench-stage">
        {picked?.r?.image ? (
          <BeforeAfter before={data.input} after={picked.r.image} beforeLabel="Input" afterLabel={picked.m.name} ratio={`${data.width} / ${data.height}`} />
        ) : <div className="unavailable"><p>{picked?.r?.note || "No output for this method."}</p></div>}
        <div className="stage-actions">
          <span>{picked?.m.name}: {picked?.m.kind}</span>
          {picked?.r?.image && (
            <span>
              <button className="chip" onClick={() => onOpen({ src: picked.r.image, title: picked.m.name })}>Full size</button>
              <a className="chip" href={picked.r.image} download={`${picked.m.id}_${TASK}.png`}>Save</a>
            </span>
          )}
        </div>
        {picked?.r?.image && picked.r.note && <p className="note">{picked.r.note}</p>}
      </div>

      <ul className="bench-list" aria-label="Outputs">
        {rows.map(({ m, r }) => (
          <li key={m.id}>
            <button className={m.ours ? "ours" : ""} aria-pressed={pick === m.id} disabled={!r?.image} onClick={() => setPick(m.id)}>
              {r?.image ? <img src={r.image} alt="" /> : <span className="thumb-empty" />}
              <span className="who"><b><ModelMark m={m} />{m.name}</b><small>{r?.image ? m.kind : (r?.note || "Not available")}</small></span>
              <span className="what">
                {data.has_gt && r?.psnr != null ? (
                  <>
                    <b className={r.psnr === bestP ? "best" : ""}>{fmt(r.psnr, 2)} dB</b>
                    <small>SSIM {fmt(r.ssim, 4)}</small>
                  </>
                ) : r?.time_ms != null ? <small>{r.time_ms} ms</small> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!data.has_gt && <p className="muted-note">Add the sharp version of the same image to score every output with PSNR and SSIM.</p>}
    </div>
  );
}

function ZoomCrop({ src, label, fx, fy, size }) {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    loadImage(src).then((im) => {
      if (!live || !ref.current) return;
      const W = im.naturalWidth, H = im.naturalHeight;
      const sw = Math.max(8, Math.round(W * size)), sh = Math.max(8, Math.round(H * size));
      const sx = Math.min(W - sw, Math.max(0, Math.round(fx * W - sw / 2)));
      const sy = Math.min(H - sh, Math.max(0, Math.round(fy * H - sh / 2)));
      const cv = ref.current; cv.width = 320; cv.height = Math.round((320 * sh) / sw);
      const x = cv.getContext("2d"); x.imageSmoothingEnabled = false;
      x.drawImage(im, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    }).catch(() => {});
    return () => { live = false; };
  }, [src, fx, fy, size]);
  return <figure className="zoom-cell"><canvas ref={ref} role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

function ZoomView({ data, gtSrc }) {
  const [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [size, setSize] = useState(0.12);
  const onPick = (e) => { const r = e.currentTarget.getBoundingClientRect(); setFocus({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }); };
  const items = [
    { label: "Input", src: data.input },
    ...MODELS.map((m) => ({ label: m.name, src: data.results.find((r) => r.id === m.id)?.image })).filter((i) => i.src),
    ...(gtSrc ? [{ label: "Sharp reference", src: gtSrc }] : []),
  ];
  const left = Math.min(1 - size, Math.max(0, focus.x - size / 2)), top = Math.min(1 - size, Math.max(0, focus.y - size / 2));
  return (
    <>
      <p className="hint">Click the image to choose a region. Every output is cropped to the same spot and enlarged without smoothing.</p>
      <div className="zoom-pick" onClick={onPick} style={{ aspectRatio: `${data.width} / ${data.height}` }}>
        <img src={data.input} alt="Click to choose a region" draggable={false} />
        <div className="zoom-box" style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${size * 100}%`, height: `${size * 100}%` }} />
      </div>
      <div className="zoom-ctl">
        <label htmlFor="zoom-size">Region size</label>
        <input id="zoom-size" type="range" min="0.04" max="0.3" step="0.01" value={size} onChange={(e) => setSize(Number(e.target.value))} />
      </div>
      <div className="zoom-grid">{items.map((i) => <ZoomCrop key={i.label} {...i} fx={focus.x} fy={focus.y} size={size} />)}</div>
    </>
  );
}

function ErrorView({ data, gtSrc, onOpen }) {
  const [maps, setMaps] = useState({});
  useEffect(() => {
    let live = true;
    setMaps({});
    if (!gtSrc) return;
    (async () => {
      for (const r of data.results) {
        if (!r.image) continue;
        try { const m = await errorMapURL(r.image, gtSrc); if (live) setMaps((p) => ({ ...p, [r.id]: m })); } catch {}
      }
    })();
    return () => { live = false; };
  }, [data, gtSrc]);
  if (!gtSrc) return <p className="hint">Error maps need the sharp version of the image. Add it in the form above and run again.</p>;
  return (
    <>
      <div className="legend"><span>Low error</span><i className="ramp" /><span>High error</span></div>
      <div className="grid">
        {MODELS.map((m) => {
          const r = data.results.find((x) => x.id === m.id);
          const e = maps[m.id];
          return (
            <figure key={m.id} className={`card ${m.ours ? "ours" : ""}`}>
              <div className="card-img">
                {e ? <img src={e.url} alt={`${m.name} error map`} onClick={() => onOpen({ src: e.url, title: `${m.name} error map` })} />
                  : <div className="unavailable"><p>{r?.image ? "Computing…" : (r?.note || "Not available")}</p></div>}
              </div>
              <figcaption><b><ModelMark m={m} />{m.name}</b><small>{e ? `mean error ${e.mean.toFixed(2)} / 255` : m.kind}</small></figcaption>
            </figure>
          );
        })}
      </div>
      <p className="hint">Darker is better. Mean error is the average difference per pixel from the sharp image, on a 0 to 255 scale.</p>
    </>
  );
}

function TrustView({ data }) {
  const fusion = data.results.find((r) => r.id === "fusion");
  const t = data.trust;
  if (!t || !fusion?.image) return <p className="hint">The backend did not return a trust map for this run.</p>;
  return (
    <>
      {!data.fusion_trained && <p className="banner">DFFN weights are not loaded on the backend, so every available expert gets equal trust and the map is flat.</p>}
      <BeforeAfter before={fusion.image} after={t.image} beforeLabel="DFFN output" afterLabel="Trust map" ratio={`${data.width} / ${data.height}`} />
      <ul className="shares">
        {EXPERTS.map((e) => (
          <li key={e.id}>
            <i className="sw" style={{ background: TRUST_COLORS[e.id] }} aria-hidden="true" />
            <span>{e.name}</span>
            <div className="track"><div style={{ width: `${t.share?.[e.id] ?? 0}%`, background: TRUST_COLORS[e.id] }} /></div>
            <b>{fmt(t.share?.[e.id], 1)}%</b>
          </li>
        ))}
      </ul>
      <p className="hint">Each pixel is coloured by the experts the gate trusts there. Mixed colours mean shared trust. The bars show each expert’s average share over this image.</p>
    </>
  );
}

const VIEWS = [["compare", "Compare"], ["zoom", "Zoom"], ["error", "Error maps"], ["trust", "Trust map"]];

/* ---------- demo ---------- */

export default function Demo() {
  const [api, setApi] = useState(() => store.get(LS_KEY) || DEFAULT_API);
  const [conn, setConn] = useState({ state: "idle", info: null });
  const [image, setImage] = useState(null);
  const [gt, setGt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gtPreview, setGtPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [pick, setPick] = useState("fusion");
  const [view, setView] = useState("compare");
  const [box, setBox] = useState(null);
  const abortRef = useRef(null);

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

  const run = async () => {
    if (!image || conn.state !== "ok") return;
    setBusy(true); setElapsed(0); setError(""); setData(null);
    abortRef.current = new AbortController();
    try {
      const d = await restore(api, { image, gt }, abortRef.current.signal);
      setData(d); setPick("fusion"); setView("compare");
      requestAnimationFrame(() => document.getElementById("demo-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) { if (e.name !== "AbortError") setError(e.message || "Request failed"); }
    finally { setBusy(false); }
  };

  const connLabel = { idle: "Not connected", checking: "Checking", ok: "Connected", error: "Unreachable" }[conn.state];
  const loaded = conn.info?.models?.[TASK] || {};
  const trained = conn.info?.fusion_trained?.[TASK];
  const missing = EXPERTS.filter((e) => conn.state === "ok" && loaded[e.id] === false);
  const scored = gt && data?.has_gt;

  return (
    <section id="demo" className="s">
      <h2>Try it on your own image</h2>
      <p className="prose">
        Upload a motion-blurred photo. A GPU backend running in Google Colab restores it with each frozen expert, with plain averaging and with DFFN,
        so you can compare them side by side.
      </p>

      <div className="panel">
        <div className="backend">
          <label htmlFor="api">Backend URL</label>
          <div className="backend-row">
            <input id="api" type="url" placeholder="https://your-tunnel.trycloudflare.com" value={api} onChange={(e) => setApi(e.target.value)} spellCheck={false} autoComplete="off" />
            <span className={`status ${conn.state}`} role="status"><i />{connLabel}</span>
          </div>
          {conn.state === "idle" && <p className="hint">Run the Colab notebook, then paste the <code>trycloudflare.com</code> address it prints.</p>}
          {conn.state === "error" && <p className="warn">Cannot reach the backend. Check that the notebook is still running and that the URL is the newest one it printed.</p>}
          {conn.state === "ok" && (
            <ul className="loaded" aria-label="Backend status">
              <li>{conn.info.gpu}</li>
              {EXPERTS.map((e) => <li key={e.id} className={loaded[e.id] === false ? "off" : ""}><i style={{ background: e.color }} />{e.name} {loaded[e.id] === false ? "missing" : "loaded"}</li>)}
              <li className={trained === false ? "off" : ""}>{trained === false ? "DFFN weights missing" : "DFFN weights loaded"}</li>
              <li>Images over {conn.info.max_side}px are downscaled</li>
            </ul>
          )}
          {missing.length > 0 && <p className="warn">Not loaded on the backend: {missing.map((m) => m.name).join(", ")}. DFFN uses the rest.</p>}
        </div>

        <div className="inputs">
          <Dropzone label="Blurry photo" hint="Drop an image here or click to choose. PNG or JPG." file={image} preview={preview} onFile={setImage} />
          <Dropzone label="Sharp reference" hint="The same scene, sharp. Adds PSNR and SSIM." file={gt} preview={gtPreview} onFile={setGt} optional />
        </div>

        <div className="actions">
          {!busy ? (
            <button className="primary" disabled={!image || conn.state !== "ok"} onClick={run}>Deblur image</button>
          ) : (
            <button className="primary" onClick={() => abortRef.current?.abort()}>Cancel ({elapsed}s)</button>
          )}
          {!busy && !image && <span className="hint">Choose a blurry photo first.</span>}
          {!busy && image && conn.state !== "ok" && <span className="hint">Connect the backend first.</span>}
          {busy && <span className="hint" role="status">Running three experts and the fusion module. This usually takes a few seconds.</span>}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </div>

      <div id="demo-results" className="results">
        {busy && <div className="skeleton"><div /><div /></div>}
        {data && (
          <>
            <div className="results-head">
              <div className="seg" role="tablist" aria-label="Result view">
                {VIEWS.map(([id, l]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}>{l}</button>)}
              </div>
              <span className="meta">{data.width}×{data.height} px, {(data.elapsed_ms / 1000).toFixed(1)} s total{scored ? ", scored against your reference" : ""}</span>
            </div>
            {!data.fusion_trained && view !== "trust" && <p className="banner">DFFN weights are not loaded on the backend, so the DFFN output is a placeholder equal to a plain average of the available experts.</p>}
            {view === "compare" && <CompareView data={data} pick={pick} setPick={setPick} onOpen={setBox} />}
            {view === "zoom" && <ZoomView data={data} gtSrc={gt ? gtPreview : null} />}
            {view === "error" && <ErrorView data={data} gtSrc={gt ? gtPreview : null} onOpen={setBox} />}
            {view === "trust" && <TrustView data={data} />}
          </>
        )}
      </div>

      <Notes />
      <Lightbox item={box} onClose={() => setBox(null)} />
    </section>
  );
}
