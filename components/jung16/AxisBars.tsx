"use client";

import { Card } from "@/components/Card";
import type { Jung16ScoreResult } from "@/lib/jung16-style";

type AxisBarsProps = {
  jung16: Jung16ScoreResult | null;
  fallbackScores?: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function fallbackP(value: number) {
  return clamp01((value + 1) / 2);
}

type AxisRow = {
  axis: "EI" | "SN" | "TF" | "JP";
  left: string;
  right: string;
  leftPct: number;
  rightPct: number;
  confidence: number;
  unreliable: boolean;
};

function confidenceLabel(value: number) {
  if (value < 0.2) return "均衡";
  if (value < 0.6) return "轻度偏向";
  return "明显偏向";
}

export function AxisBars({ jung16, fallbackScores }: AxisBarsProps) {
  const rows: AxisRow[] = jung16
    ? [
        {
          axis: "EI",
          left: "E",
          right: "I",
          leftPct: Math.round(jung16.axes.E * 100),
          rightPct: Math.round(jung16.axes.I * 100),
          confidence: jung16.confidence.EI,
          unreliable: jung16.debug.unreliableAxes.includes("EI"),
        },
        {
          axis: "SN",
          left: "S",
          right: "N",
          leftPct: Math.round(jung16.axes.S * 100),
          rightPct: Math.round(jung16.axes.N * 100),
          confidence: jung16.confidence.SN,
          unreliable: jung16.debug.unreliableAxes.includes("SN"),
        },
        {
          axis: "TF",
          left: "T",
          right: "F",
          leftPct: Math.round(jung16.axes.T * 100),
          rightPct: Math.round(jung16.axes.F * 100),
          confidence: jung16.confidence.TF,
          unreliable: jung16.debug.unreliableAxes.includes("TF"),
        },
        {
          axis: "JP",
          left: "J",
          right: "P",
          leftPct: Math.round(jung16.axes.J * 100),
          rightPct: Math.round(jung16.axes.P * 100),
          confidence: jung16.confidence.JP,
          unreliable: jung16.debug.unreliableAxes.includes("JP"),
        },
      ]
    : [
        {
          axis: "EI",
          left: "E",
          right: "I",
          leftPct: Math.round(fallbackP(fallbackScores?.EI ?? 0) * 100),
          rightPct: Math.round((1 - fallbackP(fallbackScores?.EI ?? 0)) * 100),
          confidence: Math.abs(fallbackP(fallbackScores?.EI ?? 0) - 0.5) * 2,
          unreliable: false,
        },
        {
          axis: "SN",
          left: "S",
          right: "N",
          leftPct: Math.round(fallbackP(fallbackScores?.SN ?? 0) * 100),
          rightPct: Math.round((1 - fallbackP(fallbackScores?.SN ?? 0)) * 100),
          confidence: Math.abs(fallbackP(fallbackScores?.SN ?? 0) - 0.5) * 2,
          unreliable: false,
        },
        {
          axis: "TF",
          left: "T",
          right: "F",
          leftPct: Math.round(fallbackP(fallbackScores?.TF ?? 0) * 100),
          rightPct: Math.round((1 - fallbackP(fallbackScores?.TF ?? 0)) * 100),
          confidence: Math.abs(fallbackP(fallbackScores?.TF ?? 0) - 0.5) * 2,
          unreliable: false,
        },
        {
          axis: "JP",
          left: "J",
          right: "P",
          leftPct: Math.round(fallbackP(fallbackScores?.JP ?? 0) * 100),
          rightPct: Math.round((1 - fallbackP(fallbackScores?.JP ?? 0)) * 100),
          confidence: Math.abs(fallbackP(fallbackScores?.JP ?? 0) - 0.5) * 2,
          unreliable: false,
        },
      ];

  return (
    <Card className="space-y-4 p-5" hoverable={false}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-surface)]/62">四维倾向分析</p>
        <p className="text-xs text-[var(--color-surface)]/62">基于本次答题实时计算</p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.axis} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[var(--color-surface)]/86">
              <span className="font-medium">
                {row.left}/{row.right} 维度
              </span>
              <span className="text-xs text-[var(--color-surface)]/68">
                {confidenceLabel(row.confidence)} · 置信度 {Math.round(row.confidence * 100)}%
              </span>
            </div>

            <div className="relative h-2.5 overflow-hidden rounded-full border border-white/18 bg-black/26">
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${row.leftPct}%`,
                  background: "linear-gradient(90deg, #89ff9d, #4cd964)",
                  boxShadow: "0 0 10px color-mix(in oklab, #89ff9d 30%, transparent)",
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--color-surface)]/66">
              <span>
                {row.left} {row.leftPct}%
              </span>
              <span>
                {row.right} {row.rightPct}%
              </span>
            </div>

            {row.unreliable ? (
              <p className="text-xs text-amber-100/90">该维度有效样本不足，建议补答后再看趋势。</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
