"use client";

type Dimension = "EI" | "SN" | "TF" | "JP";

const DIMENSION_COPY: Record<Dimension, { pair: string; desc: string }> = {
  EI: { pair: "E vs I", desc: "Extraversion vs Introversion" },
  SN: { pair: "S vs N", desc: "Sensing vs Intuition" },
  TF: { pair: "T vs F", desc: "Thinking vs Feeling" },
  JP: { pair: "J vs P", desc: "Judging vs Perceiving" },
};

export function DimensionHint({ dimension }: { dimension: Dimension }) {
  const copy = DIMENSION_COPY[dimension];

  return (
    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-surface)]/72">
      Current Dimension: {copy.pair} ({copy.desc})
    </p>
  );
}
