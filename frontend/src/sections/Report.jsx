import { useRef, useState } from "react";
import BeforeAfter from "../components/BeforeAfter.jsx";
import Pipeline from "../components/Pipeline.jsx";
import {
  ABSTRACT, AFFILIATION, ANALYSIS, AUTHORS, BIBTEX, COST_NOTE, EXPERTS, FUSER_M, FUSER_PARAMS, GLANCE, GUIDE,
  KEYWORDS, LIMITATIONS, LINKS, METHOD_STEPS, NOTES, PLOT, REFERENCES, SUBTITLE, TABLE, TABLE_DELTAS, TITLE,
  TRAINING, WEIGHTS,
} from "../config.js";

const base = import.meta.env.BASE_URL;
const img = (n) => `${base}report/${n}`;
const color = (id) => EXPERTS.find((e) => e.id === id)?.color;

/* The tri-colour stripe marks DFFN wherever it appears: it is the mix of the three expert colours. */
export const Tri = ({ className = "" }) => <i className={`tri ${className}`} aria-hidden="true" />;
const Swatch = ({ id }) => <i className="sw" style={{ background: color(id) }} aria-hidden="true" />;

/* ---------------- Hero ---------------- */

export function Hero() {
  return (
    <header className="hero">
      <div className="hero-text">
        <h1 className="focus">{TITLE}</h1>
        <p className="lede">{SUBTITLE}</p>
        <ul className="authors" aria-label="Authors">
          {AUTHORS.map((a) => <li key={a.name}>{a.url ? <a href={a.url} target="_blank" rel="noreferrer">{a.name}</a> : a.name}</li>)}
        </ul>
        <p className="guide">Under the guidance of <strong>{GUIDE}</strong></p>
        <p className="affil">{AFFILIATION}</p>
        <div className="links">
          {LINKS.map((l) => l.url ? (
            <a key={l.label} className={`btn ${l.primary ? "solid" : ""}`} href={l.url} {...(l.url.startsWith("#") ? {} : { target: "_blank", rel: "noreferrer" })}>{l.label}</a>
          ) : (
            <span key={l.label} className="btn" aria-disabled="true">{l.label}<small>soon</small></span>
          ))}
        </div>
      </div>
      <figure className="hero-fig">
        <BeforeAfter before={img("panel_input.jpg")} after={img("panel_dffn.jpg")} beforeLabel="Blurry input" afterLabel="DFFN output" ratio="5 / 3" />
        <figcaption>A frame from the GoPro test set. Drag the handle, or focus it and use the arrow keys.</figcaption>
      </figure>
    </header>
  );
}

/* ---------------- Abstract ---------------- */

export function Abstract() {
  return (
    <section id="abstract" className="s">
      <h2>Abstract</h2>
      <div className="abstract">
        {ABSTRACT.map(([k, v]) => <p key={k}><strong>{k}.</strong> {v}</p>)}
      </div>
      <ul className="kw" aria-label="Keywords">{KEYWORDS.map((k) => <li key={k}>{k}</li>)}</ul>
    </section>
  );
}

/* ---------------- Method ---------------- */

export function Method() {
  return (
    <section id="method" className="s">
      <h2>How DFFN works</h2>
      <p className="prose">
        Networks built on different ideas fail in different places. Rather than train another restorer, DFFN freezes three
        pretrained ones and trains only a small module that decides, pixel by pixel, how much to trust each.
      </p>

      <div className="experts">
        {EXPERTS.map((e) => (
          <div key={e.id} className="expert" style={{ "--c": e.color }}>
            <h3>{e.name}</h3>
            <p>{e.kind}. {e.detail}.</p>
            <dl>
              <div><dt>Feature tap</dt><dd>{e.tap}</dd></div>
              <div><dt>Channels</dt><dd>{e.ch} → 48</dd></div>
              <div><dt>Parameters</dt><dd>{e.params}M, frozen</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <figure className="wide">
        <Pipeline />
        <p className="pipeline-hint">Swipe sideways to see the whole diagram.</p>
        <figcaption>Figure 1. The three experts never change. Only the module inside the box is trained. The gate’s three weights are used twice: on the features and on the restored images.</figcaption>
      </figure>

      <ol className="steps">
        {METHOD_STEPS.map(([a, b]) => <li key={a}><strong>{a}</strong><span>{b}</span></li>)}
      </ol>

      <h3 className="subhead">Training and evaluation</h3>
      <dl className="train">
        {TRAINING.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </section>
  );
}

/* ---------------- Results ---------------- */

function Glance() {
  return (
    <dl className="glance">
      {GLANCE.map((g) => (
        <div key={g.label}>
          <dt>{g.label}</dt>
          <dd><span className="num">{g.value}</span>{g.unit && <small>{g.unit}</small>}</dd>
          <dd className="sub">{g.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

function ResultsTable() {
  const bestP = Math.max(...TABLE.map((r) => r[2][0]));
  const bestS = Math.max(...TABLE.map((r) => r[2][1]));
  return (
    <div className="tbl">
      <table>
        <caption>Table 1. GoPro test set (1,111 images), RGB. The best value in each column is in bold.</caption>
        <thead><tr><th scope="col">Method</th><th scope="col" className="r">PSNR (dB)</th><th scope="col" className="r">SSIM</th></tr></thead>
        <tbody>
          {TABLE.map(([id, label, [p, s]]) => {
            const ours = id === "fusion";
            return (
              <tr key={id} className={ours ? "ours-row" : ""}>
                <th scope="row">
                  {ours ? <Tri /> : color(id) ? <Swatch id={id} /> : <i className="sw hollow" aria-hidden="true" />}
                  {label}
                </th>
                <td className={`r ${p === bestP ? "best" : ""}`}>{p.toFixed(2)}</td>
                <td className={`r ${s === bestS ? "best" : ""}`}>{s.toFixed(4)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {TABLE_DELTAS.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td className="r" colSpan="2">{v}</td></tr>)}
        </tfoot>
      </table>
    </div>
  );
}

function DotPlot() {
  const { range: [lo, hi], ticks } = PLOT;
  const pos = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <figure className="plot">
      <div className="plot-body" role="img" aria-label={`PSNR in dB: ${TABLE.map(([, l, [p]]) => `${l} ${p}`).join(", ")}`}>
        {TABLE.map(([id, label, [p]]) => (
          <div key={id} className={`plot-row ${id === "fusion" ? "ours" : ""}`}>
            <span className="plot-lab">{label}</span>
            <div className="plot-track">
              {ticks.map((t) => <i key={t} className="grid" style={{ left: pos(t) }} />)}
              <i className="stem" style={{ width: pos(p), background: id === "fusion" ? "var(--ink)" : color(id) || "var(--muted)" }} />
              <i className={`dot ${id === "average" ? "hollow" : ""}`} style={{ left: pos(p), background: id === "fusion" ? "var(--ink)" : color(id) }} />
              <b className="val" style={{ left: pos(p) }}>{p.toFixed(2)}</b>
            </div>
          </div>
        ))}
        <div className="plot-row axis">
          <span />
          <div className="plot-track">{ticks.map((t) => <span key={t} className="tick" style={{ left: pos(t) }}>{t}</span>)}</div>
        </div>
      </div>
      <figcaption>Figure 2. PSNR in dB. The axis starts at 28, not zero, so the gaps look larger than they are. DFFN’s lead over SFNet is 0.23 dB.</figcaption>
    </figure>
  );
}

export function Results() {
  return (
    <section id="results" className="s">
      <h2>Results on GoPro</h2>
      <Glance />
      <div className="two">
        <ResultsTable />
        <DotPlot />
      </div>
      <ul className="points">
        {ANALYSIS.map(([a, b]) => <li key={a}><strong>{a}</strong> {b}</li>)}
      </ul>
    </section>
  );
}

/* ---------------- Learned trust ---------------- */

/* Each expert’s grey gate map is tinted with its colour (multiply) and the three are added (screen),
   which approximates the coloured trust map the live demo returns. */
export function Trust() {
  const [on, setOn] = useState({ hinet: true, sfnet: true, adair: true });
  const toggle = (id) => setOn((p) => ({ ...p, [id]: !p[id] }));
  return (
    <section id="trust" className="s">
      <h2>What the gate learned</h2>
      <p className="prose">
        Bright means the gate trusts that expert at that pixel. Nothing told it which expert is best. After training it gives AdaIR
        almost no weight and splits the rest between SFNet, which dominates, and HINet.
      </p>

      <div className="trust">
        <figure className="trust-stage">
          <div className="trust-pair">
            <div>
              <img src={img("panel_input.jpg")} alt="Blurry GoPro input frame" />
              <span>Input</span>
            </div>
            <div>
              <div className="blend" role="img" aria-label="Trust map: each pixel is coloured by the experts the gate trusts there">
                <img className="base" src={img("panel_dffn.jpg")} alt="" />
                <div className="layers">
                  {EXPERTS.map((e) => on[e.id] && (
                    <div key={e.id} className="layer" style={{ background: e.color }}>
                      <img src={img(`panel_${e.id}.jpg`)} alt="" />
                    </div>
                  ))}
                </div>
              </div>
              <span>Trust map</span>
            </div>
            <div>
              <img src={img("panel_dffn.jpg")} alt="DFFN output for the same frame" />
              <span>DFFN output</span>
            </div>
          </div>
          <div className="chips" role="group" aria-label="Show trust of">
            {EXPERTS.map((e) => (
              <button key={e.id} className="chip-toggle" aria-pressed={on[e.id]} onClick={() => toggle(e.id)}>
                <Swatch id={e.id} />{e.name}
              </button>
            ))}
          </div>
          <figcaption>Figure 3. Gate weights on one GoPro test frame. Switch experts on and off to see where each is trusted. Mixed colour means shared trust.</figcaption>
        </figure>

        <div className="weights">
          <h3>Average trust over the test set</h3>
          <div className="wbar" role="img" aria-label={WEIGHTS.map((w) => `${w.name} ${w.value}%`).join(", ")}>
            {WEIGHTS.filter((w) => w.value > 0).map((w) => <div key={w.id} style={{ width: `${w.value}%`, background: color(w.id) }} />)}
          </div>
          <ul>
            {WEIGHTS.map((w) => <li key={w.id}><Swatch id={w.id} /><span>{w.name}</span><b>{w.value}%</b></li>)}
          </ul>
          <p>AdaIR scores 28.11 dB alone, 5 dB below the others. The gate learns to ignore it without being told.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Cost and limits ---------------- */

export function Cost() {
  const total = EXPERTS.reduce((a, e) => a + e.params, 0) + FUSER_M;
  const share = (v) => `${(v / total) * 100}%`;
  return (
    <section id="cost" className="s">
      <h2>Cost</h2>
      <div className="costbar" role="img" aria-label={`Parameters: ${EXPERTS.map((e) => `${e.name} ${e.params} million`).join(", ")}, fusion module ${FUSER_M} million`}>
        {EXPERTS.map((e) => <div key={e.id} style={{ width: share(e.params), background: e.color }}><span>{e.name} {e.params}M</span></div>)}
        <div className="fuser" style={{ width: `max(3px, ${share(FUSER_M)})` }} />
      </div>
      <p className="cap">
        Figure 4. Parameters of the whole pipeline, about {total.toFixed(1)}M. The dark sliver at the right is the fusion module:
        {" "}{FUSER_M}M, or {((FUSER_M / (total - FUSER_M)) * 100).toFixed(2)}% of the frozen experts. Only that sliver is trained.
      </p>
      <div className="two cost-two">
        <div className="tbl">
          <table>
            <caption>Table 2. Trainable parameters in the fusion module.</caption>
            <thead><tr><th scope="col">Part</th><th scope="col" className="r">Parameters</th></tr></thead>
            <tbody>{FUSER_PARAMS.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td className="r">{v}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Total</th><td className="r">241,698</td></tr></tfoot>
          </table>
        </div>
        <p className="prose">{COST_NOTE}</p>
      </div>
    </section>
  );
}

export function Limits() {
  return (
    <section id="limits" className="s">
      <h2>Limitations</h2>
      <ul className="points">{LIMITATIONS.map((l) => <li key={l}>{l}</li>)}</ul>
    </section>
  );
}

export function Notes() {
  return (
    <div className="notes">
      {NOTES.map(([t, b]) => <div key={t}><h3>{t}</h3><p>{b}</p></div>)}
    </div>
  );
}

/* ---------------- Cite + footer ---------------- */

export function Cite() {
  const [done, setDone] = useState(false);
  const preRef = useRef(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(BIBTEX); }
    catch { const r = document.createRange(); r.selectNodeContents(preRef.current); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    setDone(true); setTimeout(() => setDone(false), 1600);
  };
  return (
    <section id="cite" className="s">
      <h2>Cite this work</h2>
      <div className="code">
        <button className="btn" onClick={copy}>{done ? "Copied" : "Copy BibTeX"}</button>
        <pre ref={preRef}>{BIBTEX}</pre>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div>
        <h3>Built on</h3>
        <ul>
          {REFERENCES.map(([n, t, url]) => (
            <li key={n}>{url ? <a href={url} target="_blank" rel="noreferrer">{n}</a> : <strong>{n}</strong>}<span>{t}</span></li>
          ))}
        </ul>
      </div>
      <p>B.Tech project, Department of CSE, IGDTUW, November 2026. The three pretrained models are frozen; only the DFFN fusion module is trained.</p>
    </footer>
  );
}
