"use client";

type RadarChartSvgProps = {
  axes: string[];
  values: number[];
  overlayValues?: number[];
  size?: number;
  primaryColor?: string;
  overlayColor?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toPoint(index: number, total: number, value: number, center: number, radius: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const scale = clamp(value, 0, 100) / 100;
  const r = radius * scale;
  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r,
  };
}

function toPolygon(values: number[], total: number, center: number, radius: number) {
  return values
    .map((value, index) => {
      const point = toPoint(index, total, value, center, radius);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

export function RadarChartSvg({
  axes,
  values,
  overlayValues,
  size = 220,
  primaryColor = "var(--color-glow)",
  overlayColor = "var(--color-accent)",
}: RadarChartSvgProps) {
  const total = axes.length;
  const center = size / 2;
  const radius = size * 0.35;
  const poly = toPolygon(values, total, center, radius);
  const overlayPoly = overlayValues ? toPolygon(overlayValues, total, center, radius) : null;
  const rings = [1, 0.75, 0.5, 0.25];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {rings.map((ring) => (
        <circle
          key={ring}
          cx={center}
          cy={center}
          r={radius * ring}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeDasharray="4 4"
        />
      ))}

      {axes.map((axis, index) => {
        const end = toPoint(index, total, 100, center, radius);
        const text = toPoint(index, total, 112, center, radius);
        return (
          <g key={axis}>
            <line
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.22)"
            />
            <text
              x={text.x}
              y={text.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="rgba(255,255,255,0.92)"
            >
              {axis}
            </text>
          </g>
        );
      })}

      {overlayPoly ? (
        <polygon
          points={overlayPoly}
          fill="color-mix(in oklab, var(--color-accent) 26%, transparent)"
          stroke={overlayColor}
          strokeWidth="2"
        />
      ) : null}
      <polygon
        points={poly}
        fill="color-mix(in oklab, var(--color-glow) 30%, transparent)"
        stroke={primaryColor}
        strokeWidth="2.4"
      />
    </svg>
  );
}
