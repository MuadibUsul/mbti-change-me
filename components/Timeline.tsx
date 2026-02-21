"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AvatarPet3D } from "@/components/AvatarPet3D";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { RouteButton } from "@/components/RouteButton";
import { parsePetModel } from "@/lib/pet-model";

type ChartPoint = {
  id: string;
  date: string;
  EI: number;
  SN: number;
  TF: number;
  JP: number;
  mbti?: string | null;
};

type TokenItem = {
  id: string;
  sessionId: string;
  tokenIndex: number;
  mbti?: string | null;
  generatedAt: string;
  derivedStats: {
    contrast?: number;
    harmony?: number;
    volatility?: number;
    archetype?: string;
    traits?: string[];
    petModel?: unknown;
  };
};

type TimelineProps = {
  tokens: TokenItem[];
  chartData: ChartPoint[];
  totalCount?: number;
  mode?: "latest" | "all";
};

const fixedFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Shanghai",
});

function formatTokenTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return fixedFormatter.format(date);
}

function buildPath(values: number[], width: number, height: number, pad: number) {
  if (!values.length) return "";
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  return values
    .map((value, idx) => {
      const x = pad + (values.length === 1 ? innerW / 2 : (idx / (values.length - 1)) * innerW);
      const y = pad + (1 - (value + 1) / 2) * innerH;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function GlowTrajectoryChart({ chartData }: { chartData: ChartPoint[] }) {
  const width = 980;
  const height = 280;
  const pad = 28;

  const series = useMemo(
    () => ({
      EI: chartData.map((d) => d.EI),
      SN: chartData.map((d) => d.SN),
      TF: chartData.map((d) => d.TF),
      JP: chartData.map((d) => d.JP),
    }),
    [chartData],
  );

  const xForIndex = (idx: number) => {
    const innerW = width - pad * 2;
    return pad + (chartData.length === 1 ? innerW / 2 : (idx / (chartData.length - 1)) * innerW);
  };

  const yForValue = (value: number) => {
    const innerH = height - pad * 2;
    return pad + (1 - (value + 1) / 2) * innerH;
  };

  const tickY = [-1, -0.5, 0, 0.5, 1];
  const dateTicks = [0, Math.floor((chartData.length - 1) / 2), chartData.length - 1]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((idx) => ({ idx, label: chartData[idx]?.date ?? "" }));

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-[var(--radius-md)] border border-white/18 bg-black/24 p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {tickY.map((v) => {
          const y = yForValue(v);
          return (
            <line
              key={v}
              x1={pad}
              y1={y}
              x2={width - pad}
              y2={y}
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="4 4"
            />
          );
        })}

        {dateTicks.map((t) => (
          <text key={t.idx} x={xForIndex(t.idx)} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.82)" fontSize="11">
            {t.label}
          </text>
        ))}

        <path d={buildPath(series.EI, width, height, pad)} fill="none" stroke="var(--color-primary)" strokeWidth="3.2" filter="url(#glow-strong)" />
        <path d={buildPath(series.SN, width, height, pad)} fill="none" stroke="var(--color-secondary)" strokeWidth="3.2" filter="url(#glow-strong)" />
        <path d={buildPath(series.TF, width, height, pad)} fill="none" stroke="var(--color-accent)" strokeWidth="3.2" filter="url(#glow-strong)" />
        <path d={buildPath(series.JP, width, height, pad)} fill="none" stroke="var(--color-glow)" strokeWidth="3.2" filter="url(#glow-strong)" />

        {chartData.map((point, idx) => (
          <g key={point.id}>
            <circle cx={xForIndex(idx)} cy={yForValue(point.EI)} r="3.2" fill="var(--color-primary)" />
            <circle cx={xForIndex(idx)} cy={yForValue(point.SN)} r="3.2" fill="var(--color-secondary)" />
            <circle cx={xForIndex(idx)} cy={yForValue(point.TF)} r="3.2" fill="var(--color-accent)" />
            <circle cx={xForIndex(idx)} cy={yForValue(point.JP)} r="3.2" fill="var(--color-glow)" />
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-3 px-1 text-xs text-[var(--color-surface)]/84">
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full" style={{ background: "var(--color-primary)" }} />EI
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full" style={{ background: "var(--color-secondary)" }} />SN
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full" style={{ background: "var(--color-accent)" }} />TF
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full" style={{ background: "var(--color-glow)" }} />JP
        </span>
      </div>
    </div>
  );
}

export function Timeline({ tokens, chartData, totalCount = 0, mode = "latest" }: TimelineProps) {
  const [activeId, setActiveId] = useState(tokens[0]?.id ?? "");
  const active = useMemo(() => tokens.find((t) => t.id === activeId) ?? tokens[0], [tokens, activeId]);
  const activePetModel = useMemo(() => parsePetModel(active?.derivedStats?.petModel), [active]);
  const latestPoint = chartData.at(-1);

  if (!tokens.length) {
    return (
      <Card className="p-8">
        <p className="text-sm text-[var(--color-surface)]/88">
          暂无人格轨迹。先完成一次测试，即可生成 Persona Token #1 与四维变化轨迹。
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--color-surface)]">人格时间长廊</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/64">
              显示 {tokens.length} / {Math.max(totalCount, tokens.length)}
            </span>
            {mode === "latest" ? (
              <RouteButton href="/timeline/all" variant="outline" className="px-3 py-1.5 text-xs">
                查看全部记录
              </RouteButton>
            ) : (
              <RouteButton href="/timeline" variant="outline" className="px-3 py-1.5 text-xs">
                返回最新6次
              </RouteButton>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => {
            const selected = token.id === active?.id;
            const petModel = parsePetModel(token.derivedStats?.petModel);
            return (
              <div key={token.id} className="space-y-2">
                <motion.button
                  type="button"
                  onMouseEnter={() => setActiveId(token.id)}
                  onFocus={() => setActiveId(token.id)}
                  onClick={() => setActiveId(token.id)}
                  className="w-full text-left"
                  whileHover={{ y: -4, scale: 1.01 }}
                >
                  <div
                    className="relative rounded-[var(--radius-md)] border p-3 backdrop-blur-md"
                    style={{
                      borderColor: selected
                        ? "color-mix(in oklab, var(--color-glow) 60%, transparent)"
                        : "color-mix(in oklab, var(--color-surface) 34%, transparent)",
                      background: selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
                      boxShadow: selected ? "var(--shadow-strong)" : "none",
                    }}
                  >
                    <div
                      className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-full"
                      style={{ background: selected ? "var(--color-glow)" : "rgba(255,255,255,0.42)" }}
                    />
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-surface)]/58">Token #{token.tokenIndex}</p>
                    <div className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded border border-white/20 bg-black/20">
                      {petModel ? (
                        <AvatarPet3D petModel={petModel} compact className="h-20 w-20" />
                      ) : (
                        <span className="text-[10px] text-[var(--color-surface)]/65">暂无形象</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-surface)]">{token.mbti ?? "-"}</p>
                    <p className="mt-1 text-xs text-[var(--color-surface)]/62">{formatTokenTime(token.generatedAt)}</p>
                  </div>
                </motion.button>

                <RouteButton href={`/test/${token.sessionId}/result`} variant="outline" className="w-full justify-center py-2 text-xs">
                  查看当次结果页
                </RouteButton>
              </div>
            );
          })}
        </div>

        {active ? (
          <div className="mt-4 rounded-[var(--radius-md)] border border-white/16 bg-white/8 p-3 text-sm text-[var(--color-surface)]/86">
            {activePetModel ? (
              <div className="mb-2 h-36 w-36">
                <AvatarPet3D petModel={activePetModel} compact />
              </div>
            ) : null}
            <p className="font-medium text-[var(--color-surface)]">
              当前聚焦：Token #{active.tokenIndex}（{active.mbti ?? "-"}）
            </p>
            <p className="mt-1">
              变化摘要：对比度 {Number(active.derivedStats?.contrast ?? 0).toFixed(2)}，协调度 {Number(active.derivedStats?.harmony ?? 0).toFixed(2)}，波动度 {Number(active.derivedStats?.volatility ?? 0).toFixed(2)}
            </p>
            {active.derivedStats?.archetype ? <p className="mt-1">人格原型：{active.derivedStats.archetype}</p> : null}
            <div className="mt-3">
              <RouteButton href={`/test/${active.sessionId}/result`} variant="outline" className="px-3 py-2 text-xs">
                进入该次测试结果页
              </RouteButton>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-4 md:p-5">
        <h3 className="mb-3 text-lg font-semibold tracking-[var(--tracking-heading)] text-[var(--color-surface)]">四维发光轨迹</h3>
        {chartData.length ? <GlowTrajectoryChart chartData={chartData} /> : <p className="text-sm text-[var(--color-surface)]/78">当前筛选范围暂无轨迹数据。</p>}
      </Card>

      {latestPoint ? (
        <Card className="p-4 md:p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-surface)]/58">最新维度快照</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <ProgressBar label="EI" value={latestPoint.EI} />
            <ProgressBar label="SN" value={latestPoint.SN} />
            <ProgressBar label="TF" value={latestPoint.TF} />
            <ProgressBar label="JP" value={latestPoint.JP} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
