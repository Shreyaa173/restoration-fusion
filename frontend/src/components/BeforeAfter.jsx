import { useState, useRef } from "react";

export default function BeforeAfter({ before, after, beforeLabel, afterLabel, ratio = "16 / 9", pixelated = false }) {
  const [pos, setPos] = useState(50);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const box = useRef(null);
  const cls = pixelated ? "px" : undefined;

  const onMove = (e) => {
    if (!zoomed || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="ba-wrap">
      <div className="ba" ref={box} style={{ aspectRatio: ratio }} onMouseMove={onMove}>
        <div className="ba-inner" style={{ transform: zoomed ? "scale(3)" : "none", transformOrigin: origin }}>
          <img className={cls} src={after} alt={afterLabel} draggable={false} decoding="async" />
          <div className="ba-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <img className={cls} src={before} alt={beforeLabel} draggable={false} decoding="async" />
          </div>
        </div>
        <input
          className="ba-range" type="range" min="0" max="100" step="0.1" value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Slide between ${beforeLabel} and ${afterLabel}`}
        />
        <div className="ba-line" style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="ba-knob">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
            </svg>
          </span>
        </div>
        <span className="ba-tag l">{beforeLabel}</span>
        <span className="ba-tag r">{afterLabel}</span>
      </div>
      <button className="ba-zoom" onClick={() => setZoomed((z) => !z)}>
        {zoomed ? "Reset zoom" : "Zoom 3× (move mouse to pan)"}
      </button>
    </div>
  );
}