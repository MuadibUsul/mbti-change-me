"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { RadarChartSvg } from "@/components/persona-dashboard/RadarChartSvg";
import { buildMbtiCompare, getMbtiList } from "@/lib/mbti-dashboard";
import type { DimensionScores } from "@/lib/types";

type ComparisonCardProps = {
  currentMbti: string;
  currentScores?: Partial<DimensionScores> | null;
};

function suggestTarget(mbti: string) {
  const chars = mbti.toUpperCase().split("");
  if (chars.length !== 4) return "INTJ";
  chars[0] = chars[0] === "E" ? "I" : "E";
  chars[2] = chars[2] === "T" ? "F" : "T";
  return chars.join("");
}

export function ComparisonCard({ currentMbti, currentScores }: ComparisonCardProps) {
  const allMbti = useMemo(() => getMbtiList(), []);
  const [target, setTarget] = useState(suggestTarget(currentMbti));

  const comparison = useMemo(() => {
    return buildMbtiCompare({
      currentMbti,
      targetMbti: target,
      currentScores,
    });
  }, [currentMbti, currentScores, target]);

  return (
    <Card className="p-5" hoverable={false}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[var(--color-surface)]">增强版人格对比</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-surface)]/66">选择对比类型</span>
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="rounded-[var(--radius-sm)] border border-white/24 bg-black/28 px-3 py-2 text-sm text-[var(--color-surface)]"
          >
            {allMbti.map((type) => (
              <option key={type} value={type} style={{ color: "#111827" }}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-white/14 bg-white/8">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/14 text-[var(--color-surface)]/70">
                <th className="px-3 py-2">维度</th>
                <th className="px-3 py-2">{comparison.currentMbti}</th>
                <th className="px-3 py-2">{comparison.targetMbti}</th>
                <th className="px-3 py-2">差异说明</th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.axis} className="border-b border-white/10 text-[var(--color-surface)]/86">
                  <td className="px-3 py-2">{row.axis}</td>
                  <td className="px-3 py-2">{row.current}</td>
                  <td className="px-3 py-2">{row.target}</td>
                  <td className="px-3 py-2">{row.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-[var(--radius-sm)] border border-white/14 bg-black/24 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/64">雷达叠加对比</p>
          <div className="mt-2 h-56 w-full">
            <RadarChartSvg
              axes={["E", "N", "F", "J"]}
              values={comparison.currentRadar}
              overlayValues={comparison.targetRadar}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-surface)]/78">
            <span className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-[var(--color-glow)]" />
              当前（{comparison.currentMbti}）
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
              对比（{comparison.targetMbti}）
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
