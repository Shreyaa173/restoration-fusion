import { REPORT, TRUST_COLORS } from "./config.js";

const base = import.meta.env.BASE_URL;
const img = (n) => `${base}report/${n}`;
const COLOR = { hinet: TRUST_COLORS.hinet, sfnet: TRUST_COLORS.sfnet, third: TRUST_COLORS.nafnet };
const fmtPS = (v, d) => (v == null ? "–" : v.toFixed(d));

const Bullets = ({ items }) => (
  <ul className="bul">
    {items.map(([lead, rest]) => <li key={lead}><strong>{lead}.</strong> {rest}</li>)}
  </ul>
);

/* Figure 1: PSNR dot plot per version, axis does not start at zero. */
function DotPlot() {
  const { range: [lo, hi], groups } = REPORT.plot;
  const pos = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
  const ticks = []; for (let t = lo; t <= hi; t += 0.5) ticks.push(t);
  return (
    <figure className="plot" aria-label="GoPro PSNR: best expert, average and DFFN for both versions">
      {groups.map((g) => (
        <div key={g.title} className="plot-group">
          <p className="plot-title mono small">{g.title}</p>
          {g.rows.map(([label, psnr]) => {
            const ours = label === "DFFN";
            return (
              <div className={`plot-row ${ours ? "ours" : ""}`} key={label}>
                <span className="plot-lab">{label}</span>
                <div className="plot-track">
                  {ticks.map((t) => <i key={t} className="gridline" style={{ left: pos(t) }} />)}
                  <i className="dot" style={{ left: pos(psnr) }} />
                  <b className="plot-val mono" style={{ left: pos(psnr) }}>{psnr.toFixed(2)}</b>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div className="plot-row axis">
        <span />
        <div className="plot-track ticks">{ticks.map((t) => <span key={t} className="mono small" style={{ left: pos(t) }}>{t}</span>)}</div>
      </div>
      <figcaption className="cap">Figure 1. GoPro PSNR in dB for the best single expert, the plain average and DFFN. The axis does not start at zero.</figcaption>
    </figure>
  );
}

function Table2() {
  const [vf, vv] = REPORT.versions;
  return (
    <div className="tbl">
      <table>
        <caption className="cap" style={{ captionSide: "top", marginBottom: 8 }}>Table 2. GoPro test results, PSNR dB / SSIM, RGB. Highlighted = DFFN.</caption>
        <thead><tr><th>Method</th><th>{vf}</th><th>{vv}</th></tr></thead>
        <tbody>
          {REPORT.table2.map(([label, free, v5, note]) => {
            const ours = note === "ours";
            const cell = (v, side) => v ? `${fmtPS(v[0], 2)} / ${fmtPS(v[1], 4)}` : (note && !ours && ((side === "free" && v5) || (side === "v5" && free)) ? `– (${note})` : "–");
            return (
              <tr key={label} className={ours ? "ours-row" : ""}>
                <td>{label}</td>
                <td className={ours ? "best" : ""}>{cell(free, "free")}</td>
                <td className={ours ? "best" : ""}>{cell(v5, "v5")}</td>
              </tr>
            );
          })}
          {REPORT.table2Deltas.map(([label, a, b]) => (
            <tr key={label} className="mean-row"><td>{label}</td><td>{a}</td><td>{b}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ value, unit, label, sub }) {
  return (
    <div className="stat">
      <div className="stat-v"><span>{value}</span>{unit && <small>{unit}</small>}</div>
      <div className="stat-l">{label}</div>
      {sub && <div className="muted small">{sub}</div>}
    </div>
  );
}

function WeightBars() {
  return (
    <div className="wbars">
      {REPORT.weights.map((row) => (
        <div key={row.title}>
          <p className="plot-title mono small">{row.title}</p>
          <div className="wbar" role="img" aria-label={row.parts.map(([, n, v]) => `${n} ${v}%`).join(", ")}>
            {row.parts.filter(([, , v]) => v > 0).map(([id, n, v]) => (
              <div key={id} style={{ width: `${v}%`, background: COLOR[id] }}><span>{n} {v}%</span></div>
            ))}
          </div>
          <div className="wlegend small">
            {row.parts.map(([id, n, v]) => <span key={id}><i style={{ background: COLOR[id] }} />{n} <b className="mono">{v}%</b></span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KeyResults() {
  return (
    <section id="key" className="s">
      <h2>Key results</h2>
      <div className="keyres">
        {REPORT.keyResults.map(([t, b]) => <div key={t}><h3>{t}</h3><p>{b}</p></div>)}
      </div>
    </section>
  );
}

export default function Results() {
  const [vf, vv] = REPORT.versions;
  return (
    <>
      <section id="setup" className="s">
        <h2>Setup comparison</h2>
        <div className="tbl setup"><table>
          <caption className="cap" style={{ captionSide: "top", marginBottom: 8 }}>Table 1. Configuration of the two versions.</caption>
          <thead><tr><th /><th>{vf}</th><th>{vv}</th></tr></thead>
          <tbody>
            {REPORT.setup.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}
          </tbody>
        </table></div>
      </section>

      <section id="results" className="s">
        <h2>GoPro results</h2>
        <Table2 />
        <div style={{ marginTop: 28, maxWidth: 640 }}><DotPlot /></div>

        <figure className="paper-fig">
          <div className="pf-row two-up">
            <div><img src={img("gopro_input.jpg")} alt="Blurry GoPro input with a red box marking the zoomed region" /><span className="small">Blurry input</span></div>
            <div><img src={img("gopro_dffn.jpg")} alt="DFFN output for the same frame" /><span className="small">DFFN output</span></div>
            <div><img src={img("gopro_input_zoom.jpg")} alt="Zoom of the input" /><span className="small">Input (zoom)</span></div>
            <div><img src={img("gopro_dffn_zoom.jpg")} alt="Zoom of the DFFN output" /><span className="small">DFFN (zoom)</span></div>
          </div>
          <figcaption className="cap">Figure 2. GoPro example from the first (Free Colab) version; red box = zoomed region.</figcaption>
        </figure>
        <Bullets items={REPORT.analysisBullets} />
      </section>

      <section id="analysis" className="s">
        <h2>Comparative analysis (v5)</h2>
        <div className="stats">
          {REPORT.stats.map(([v, u, l, s]) => <Stat key={l} value={v} unit={u} label={l} sub={s} />)}
        </div>
        <p className="banner" style={{ marginTop: 18 }}>Caveat: in v5, DFFN matches the best fixed blend (+0.003 dB, p = 0.16). The learned gate adds almost nothing beyond a fixed 0.1 / 0.1 / 0.8 weighting.</p>
      </section>

      <section id="weights" className="s">
        <h2>Learned fusion weights</h2>
        <WeightBars />
        <p className="cap">Figure 3. Mean gate weight per expert on GoPro (Free Colab from the first results report; v5 from the training notebook).</p>
        <figure className="paper-fig">
          <img src={img("gopro_trust.jpg")} alt="Free Colab version: GoPro input, HINet trust, SFNet trust, AdaIR trust and DFFN output" />
          <figcaption className="cap">{REPORT.trustFigCaption}</figcaption>
        </figure>
        <Bullets items={REPORT.weightsBullets} />
      </section>

      <section id="cost" className="s">
        <h2>Cost</h2>
        <div className="tbl setup"><table>
          <caption className="cap" style={{ captionSide: "top", marginBottom: 8 }}>Table 3. Model size and speed.</caption>
          <thead><tr>{REPORT.cost.head.map((h, i) => <th key={h} style={i ? undefined : { textAlign: "left" }}>{h}</th>)}</tr></thead>
          <tbody>{REPORT.cost.rows.map(([k, a, b]) => <tr key={k}><th scope="row">{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
        </table></div>
      </section>

      <section id="limits" className="s">
        <h2>Limitations</h2>
        <ul className="bul">{REPORT.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
    </>
  );
}
