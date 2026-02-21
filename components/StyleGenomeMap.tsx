"use client";

import { Card } from "@/components/Card";
import type { Dimension, DimensionScores, StyleDNA } from "@/lib/types";

type StyleGenomeMapProps = {
  styleDNA: StyleDNA | null;
  latestScores?: DimensionScores | null;
};

type DimensionRow = {
  key: Dimension;
  color: string;
  positiveLabel: string;
  negativeLabel: string;
  leftHint: string;
  rightHint: string;
};

const DIMENSION_ROWS: DimensionRow[] = [
  {
    key: "EI",
    color: "#2f9ac7",
    positiveLabel: "外向",
    negativeLabel: "内向",
    leftHint: "外向",
    rightHint: "内向",
  },
  {
    key: "SN",
    color: "#d8a12e",
    positiveLabel: "求真务实",
    negativeLabel: "天马行空",
    leftHint: "求真务实",
    rightHint: "天马行空",
  },
  {
    key: "TF",
    color: "#2ea577",
    positiveLabel: "理性思考",
    negativeLabel: "情感细腻",
    leftHint: "理性思考",
    rightHint: "情感细腻",
  },
  {
    key: "JP",
    color: "#9060ad",
    positiveLabel: "运筹帷幄",
    negativeLabel: "随机应变",
    leftHint: "运筹帷幄",
    rightHint: "随机应变",
  },
];

const DIMENSION_DESC: Record<Dimension, string> = {
  EI: "你更容易在互动中获得能量，适合通过讨论和协作推动事情前进。",
  SN: "你倾向从想象与可能性出发看问题，善于跳出固定路径找新解法。",
  TF: "你在判断时更重视关系和感受，能敏锐识别情绪与团队氛围。",
  JP: "你更偏好规划和秩序，擅长把复杂任务拆解为可执行步骤。",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function paletteSpread(colors: StyleDNA["basePalette"]) {
  if (!colors.length) return 0;
  const hues = colors.map((c) => c.h);
  return Math.min(180, Math.max(...hues) - Math.min(...hues)) / 180;
}

function textureComplexity(texture: StyleDNA["texture"]) {
  const map: Record<StyleDNA["texture"], number> = {
    none: 0.2,
    dots: 0.45,
    stripes: 0.6,
    gradient: 0.72,
    split: 0.9,
  };
  return map[texture] ?? 0.5;
}

function silhouetteSharpness(silhouette: StyleDNA["silhouette"]) {
  if (silhouette === "round") return 0.25;
  if (silhouette === "balanced") return 0.55;
  return 0.86;
}

function normalizeScores(input?: DimensionScores | null) {
  return {
    EI: clamp(input?.EI ?? 0, -1, 1),
    SN: clamp(input?.SN ?? 0, -1, 1),
    TF: clamp(input?.TF ?? 0, -1, 1),
    JP: clamp(input?.JP ?? 0, -1, 1),
  };
}

function markerPosition(score: number) {
  return clamp(Math.round((score + 1) * 50), 0, 100);
}

function traitLabel(row: DimensionRow, score: number) {
  const strength = Math.round(50 + Math.abs(score) * 50);
  return `${strength}% ${score >= 0 ? row.positiveLabel : row.negativeLabel}`;
}

export function StyleGenomeMap({ styleDNA, latestScores }: StyleGenomeMapProps) {
  if (!styleDNA) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[var(--color-surface)]/82">完成首次测验后，这里会生成你的视觉基因图谱与人格分析。</p>
      </Card>
    );
  }

  const scoreMap = normalizeScores(latestScores);
  const toneMap: Record<string, string> = {
    calm: "沉静",
    warm: "温暖",
    analytic: "理性",
    playful: "灵动",
  };

  const radar = [
    { label: "对称", value: styleDNA.symmetry },
    { label: "线条", value: styleDNA.lineWeight / 4 },
    { label: "纹理", value: textureComplexity(styleDNA.texture) },
    { label: "锐度", value: silhouetteSharpness(styleDNA.silhouette) },
    { label: "饱和", value: avg(styleDNA.basePalette.map((c) => c.s)) / 100 },
    { label: "跨度", value: paletteSpread(styleDNA.basePalette) },
  ];

  const dominant = [...DIMENSION_ROWS]
    .map((row) => ({ ...row, score: scoreMap[row.key], strength: Math.abs(scoreMap[row.key]) }))
    .sort((a, b) => b.strength - a.strength)[0];

  const cx = 150;
  const cy = 120;
  const radius = 78;
  const radarPoints = radar
    .map((item, i) => {
      const angle = (-Math.PI / 2) + (i / radar.length) * Math.PI * 2;
      const r = radius * item.value;
      return `${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-surface)]">视觉基因图谱</h3>
        <div className="mt-4 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[var(--radius-md)] border border-white/20 bg-black/18 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/68">基因雷达图</p>
            <svg viewBox="0 0 300 240" className="mt-2 h-64 w-full">
              {radar.map((item, i) => {
                const angle = (-Math.PI / 2) + (i / radar.length) * Math.PI * 2;
                const tx = cx + Math.cos(angle) * (radius + 14);
                const ty = cy + Math.sin(angle) * (radius + 14);
                return (
                  <g key={item.label}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx + Math.cos(angle) * radius}
                      y2={cy + Math.sin(angle) * radius}
                      stroke="rgba(255,255,255,0.28)"
                      strokeDasharray="3 3"
                    />
                    <text x={tx} y={ty} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.9)">
                      {item.label}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.24)" />
              <circle cx={cx} cy={cy} r={radius * 0.66} fill="none" stroke="rgba(255,255,255,0.18)" />
              <circle cx={cx} cy={cy} r={radius * 0.33} fill="none" stroke="rgba(255,255,255,0.14)" />
              <polygon
                points={radarPoints}
                fill="color-mix(in oklab, var(--color-glow) 35%, transparent)"
                stroke="var(--color-glow)"
                strokeWidth="2"
              />
            </svg>
            <div className="grid gap-2 sm:grid-cols-2 text-xs text-[var(--color-surface)]/84">
              <p>轮廓：{styleDNA.silhouette}</p>
              <p>纹理：{styleDNA.texture}</p>
              <p>配饰偏好：{styleDNA.accessory}</p>
              <p>种子：{styleDNA.seed}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[var(--radius-md)] border border-white/20 bg-black/18 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/68">四维人格分布</p>
            <div className="space-y-3">
              {DIMENSION_ROWS.map((row) => {
                const score = scoreMap[row.key];
                return (
                  <div key={row.key} className="rounded-md border border-white/12 bg-white/6 p-2.5">
                    <p className="text-sm font-semibold" style={{ color: row.color }}>
                      {traitLabel(row, score)}
                    </p>
                    <div className="relative mt-1.5 h-2 rounded-full bg-black/30">
                      <div className="h-2 rounded-full" style={{ background: row.color }} />
                      <span
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow"
                        style={{
                          left: `calc(${markerPosition(score)}% - 7px)`,
                          background: row.color,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-surface)]/72">
                      <span>{row.leftHint}</span>
                      <span>{row.rightHint}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-md border border-white/14 bg-white/8 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/66">能量主导解读</p>
              <p className="mt-1 text-xl font-semibold text-[var(--color-surface)]">
                {traitLabel(dominant, dominant.score)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-surface)]/84">
                {DIMENSION_DESC[dominant.key]}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-surface)]">区域映射与AI伙伴</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-white/20 bg-black/18 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/68">Region Map</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--color-surface)]/84">
              <p>Head → {styleDNA.regionMap.head}</p>
              <p>Chest → {styleDNA.regionMap.chest}</p>
              <p>Belly → {styleDNA.regionMap.belly}</p>
              <p>ArmL → {styleDNA.regionMap.armL}</p>
              <p>ArmR → {styleDNA.regionMap.armR}</p>
              <p>LegL → {styleDNA.regionMap.legL}</p>
              <p>LegR → {styleDNA.regionMap.legR}</p>
              <p>Aura → {styleDNA.regionMap.aura}</p>
            </div>
          </div>

          {styleDNA.companion ? (
            <div className="rounded-[var(--radius-md)] border border-white/20 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/68">AI Companion</p>
              <p className="mt-2 text-sm text-[var(--color-surface)]/92">
                {styleDNA.companion.name} · {styleDNA.companion.role}
              </p>
              <p className="mt-1 text-sm text-[var(--color-surface)]/82">&quot;{styleDNA.companion.motto}&quot;</p>
              <p className="mt-2 text-xs text-[var(--color-surface)]/72">
                语气：{toneMap[styleDNA.companion.tone] ?? styleDNA.companion.tone}
              </p>
              <p className="mt-1 text-xs text-[var(--color-surface)]/72">
                智慧向量：[{styleDNA.companion.wisdomVector.join(", ")}]
              </p>
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-white/20 bg-black/18 p-4">
              <p className="text-sm text-[var(--color-surface)]/82">首次测验后将自动生成 AI 伙伴档案。</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
