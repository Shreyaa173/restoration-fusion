import { useState } from "react";

/* Drag-to-compare slider. The range input sits on top, so mouse, touch and keyboard all work. */
export default function BeforeAfter({ before, after, beforeLabel, afterLabel, ratio = "3 / 2", pixelated = false }) {
  const [pos, setPos] = useState(50);
  const cls = pixelated ? "px" : undefined;
  return (
    <div className="ba" style={{ aspectRatio: ratio }}>
      <img className={cls} src={after} alt={afterLabel} draggable={false} />
      <div className="ba-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img className={cls} src={before} alt={beforeLabel} draggable={false} />
      </div>
      <input
        className="ba-range" type="range" min="0" max="100" step="0.5" value={pos}
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
  );
}
