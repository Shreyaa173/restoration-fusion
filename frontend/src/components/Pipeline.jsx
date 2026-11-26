import { EXPERTS } from "../config.js";

/* The DFFN pipeline. Expert colours are the same ones used for the trust maps everywhere else. */
export default function Pipeline() {
  const ys = [28, 134, 240];
  const stages = [
    ["Align", "1×1 conv per expert → 48 channels", 44],
    ["Pixel-wise Reliability Gate", "two 3×3 convs + softmax → 3 weights per pixel", 124, true],
    ["Fuse and refine", "weighted features → SE → 4 residual blocks", 204],
    ["Blend and correct", "Σ weightᵢ · imageᵢ  +  correction", 284],
  ];
  return (
    <div className="pipeline">
      <svg viewBox="0 0 1000 370" role="img" style={{ minWidth: 840 }}
        aria-label="The blurry input goes through three frozen experts, HINet, SFNet and AdaIR. Their images and features enter the trained fusion module: align, pixel-wise reliability gate, fuse and refine, blend and correct. The module outputs the restored image.">
        <defs>
          <marker id="pl-ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 1L9 5L0 9z" fill="var(--muted)" />
          </marker>
        </defs>

        <rect className="pl-box" x="6" y="140" width="112" height="84" rx="10" />
        <text className="pl-t" x="62" y="176" textAnchor="middle">Blurry</text>
        <text className="pl-t" x="62" y="195" textAnchor="middle">input</text>

        {EXPERTS.map((e, i) => (
          <g key={e.id}>
            <path className="pl-line" d={`M118 182 C 150 182, 152 ${ys[i] + 38}, 184 ${ys[i] + 38}`} markerEnd="url(#pl-ah)" />
            <rect className="pl-box" x="186" y={ys[i]} width="214" height="76" rx="10" />
            <rect x="186" y={ys[i]} width="8" height="76" rx="4" fill={e.color} />
            <text className="pl-t" x="212" y={ys[i] + 30}>{e.name}</text>
            <text className="pl-s" x="212" y={ys[i] + 50}>{e.kind}, frozen</text>
            <text className="pl-s" x="212" y={ys[i] + 66}>tap: {e.ch} channels</text>
            <path className="pl-line" d={`M400 ${ys[i] + 38} C 430 ${ys[i] + 38}, 430 185, 456 185`} markerEnd="url(#pl-ah)" />
          </g>
        ))}

        <rect className="pl-group" x="458" y="14" width="384" height="342" rx="14" />
        <text className="pl-s" x="476" y="36">Fusion module (trained, 0.24M parameters)</text>
        {stages.map(([t, d, y, gate]) => (
          <g key={t}>
            <rect className={gate ? "pl-gate" : "pl-box"} x="476" y={y + 4} width="324" height="58" rx="9" />
            {gate && (
              <g>
                <rect x="476" y={y + 4} width="108" height="5" fill={EXPERTS[0].color} />
                <rect x="584" y={y + 4} width="108" height="5" fill={EXPERTS[1].color} />
                <rect x="692" y={y + 4} width="108" height="5" fill={EXPERTS[2].color} />
              </g>
            )}
            <text className="pl-t" x="638" y={y + 30} textAnchor="middle">{t}</text>
            <text className="pl-s" x="638" y={y + 48} textAnchor="middle">{d}</text>
          </g>
        ))}
        {[106, 186, 266].map((y) => <path key={y} className="pl-line" d={`M638 ${y} L638 ${y + 20}`} markerEnd="url(#pl-ah)" />)}
        <path className="pl-line pl-dash" d="M800 157 C 826 157, 826 317, 804 317" markerEnd="url(#pl-ah)" />
        <text className="pl-s" x="832" y="237" transform="rotate(90 832 237)" textAnchor="middle">same weights</text>

        <path className="pl-line" d="M842 185 L 884 185" markerEnd="url(#pl-ah)" />
        <rect className="pl-box" x="886" y="140" width="110" height="90" rx="10" />
        <text className="pl-t" x="941" y="178" textAnchor="middle">Restored</text>
        <text className="pl-t" x="941" y="197" textAnchor="middle">image</text>
        <text className="pl-s" x="941" y="216" textAnchor="middle">clamped to [0, 1]</text>
      </svg>
    </div>
  );
}
