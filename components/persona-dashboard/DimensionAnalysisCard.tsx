"use client";

import { Card } from "@/components/Card";
import type { TraitPairBreakdown } from "@/lib/mbti-dashboard";

type DimensionAnalysisCardProps = {
  pairs: TraitPairBreakdown[];
};

function colorByDimension(dimension: TraitPairBreakdown["dimension"]) {
  if (dimension === "EI") return "#2f9ac7";
  if (dimension === "SN") return "#d8a12e";
  if (dimension === "TF") return "#2ea577";
  return "#9060ad";
}

export function DimensionAnalysisCard({ pairs }: DimensionAnalysisCardProps) {
  return (
    <Card className="p-5" hoverable={false}>
      <h3 className="text-lg font-semibold text-[var(--color-surface)]">测试数据分析</h3>
      <p className="mt-1 text-sm text-[var(--color-surface)]/74">以下百分比用于解释你当前的倾向强度，不代表固定标签。</p>

      <div className="mt-4 space-y-4">
        {pairs.map((pair) => {
          const color = colorByDimension(pair.dimension);
          return (
            <div key={pair.dimension} className="rounded-[var(--radius-sm)] border border-white/14 bg-white/8 p-3">
              <p className="text-sm font-semibold" style={{ color }}>
                {pair.leftPercent}% {pair.leftLabel}
              </p>
              <div className="relative mt-2 h-2 rounded-full bg-black/25">
                <div
                  className="h-2 rounded-full"
                  style={{
                    background: color,
                    width: `${pair.leftPercent}%`,
                  }}
                />
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{
                    left: `calc(${pair.leftPercent}% - 7px)`,
                    background: color,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-[var(--color-surface)]/74">
                <span>{pair.leftLabel}</span>
                <span>{pair.rightLabel}</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-surface)]/76">{pair.note}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
