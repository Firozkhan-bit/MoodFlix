"use client";
/**
 * MoodFlix — MatchRing
 * A compact circular SVG that visualizes the compatibility score 0..100.
 */
import { matchPercent } from "./movie-helpers";

export function MatchRing({
  score,
  size = 56,
  showLabel = true,
}: {
  score: number;
  size?: number;
  showLabel?: boolean;
}) {
  const pct = matchPercent(score);
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  // Color the arc by score band for quick scanning.
  const color =
    pct >= 75 ? "oklch(0.84 0.15 78)" : pct >= 55 ? "oklch(0.78 0.16 55)" : "oklch(0.66 0.21 18)";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${pct}% match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="mf-ring-track" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={color}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold leading-none" style={{ color }}>
            {pct}
            <span className="text-[10px]">%</span>
          </span>
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground">match</span>
        </div>
      )}
    </div>
  );
}
