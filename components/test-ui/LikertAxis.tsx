"use client";

type LikertAxisProps = {
  selectedChoice: number | null;
};

function clampChoice(value: number | null) {
  if (!value) return 3;
  return Math.max(1, Math.min(5, value));
}

export function LikertAxis({ selectedChoice }: LikertAxisProps) {
  const choice = clampChoice(selectedChoice);
  const positionPercent = ((choice - 1) / 4) * 100;

  return (
    <div className="mt-3 select-none px-1">
      <div className="relative h-5">
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--color-surface) 18%, transparent), color-mix(in oklab, var(--color-glow) 45%, transparent) 50%, color-mix(in oklab, var(--color-surface) 18%, transparent))",
          }}
        />
        <div className="absolute inset-x-[6px] top-1/2 h-0 -translate-y-1/2">
          <div
            className="relative h-0 will-change-transform"
            style={{
              transform: `translateX(${positionPercent}%)`,
              transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <span
              className="absolute -left-[6px] -top-[6px] block h-3 w-3 rounded-full"
              style={{
                background: "color-mix(in oklab, var(--color-glow) 70%, white 30%)",
                boxShadow:
                  "0 0 0 1px color-mix(in oklab, var(--color-surface) 40%, transparent), 0 0 12px color-mix(in oklab, var(--color-glow) 46%, transparent)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

