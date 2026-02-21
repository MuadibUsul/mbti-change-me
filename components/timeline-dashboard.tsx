"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import { Timeline } from "@/components/Timeline";
import { useVisualSystem } from "@/components/visual-system-provider";
import { parsePetModel } from "@/lib/pet-model";

type TimelineResponse = {
  range: string;
  total: number;
  chartData: {
    id: string;
    date: string;
    EI: number;
    SN: number;
    TF: number;
    JP: number;
    mbti?: string | null;
  }[];
  tokens: {
    id: string;
    sessionId: string;
    tokenIndex: number;
    mbti?: string | null;
    generatedAt: string;
    derivedStats: {
      contrast?: number;
      harmony?: number;
      volatility?: number;
      mbti?: string;
      archetype?: string;
      traits?: string[];
      petModel?: unknown;
    };
  }[];
};

const RANGES = [
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
  { value: "180d", label: "近180天" },
  { value: "all", label: "全部" },
];

type TimelineDashboardProps = {
  mode?: "latest" | "all";
  initialRange?: "30d" | "90d" | "180d" | "all";
};

type FeatureOption = {
  id: string;
  label: string;
  keys: string[];
};

function collectFeatureKeys(token: TimelineResponse["tokens"][number]) {
  const petModel = parsePetModel(token.derivedStats?.petModel);
  const set = new Set<string>();
  if (petModel) {
    set.add(`species:${petModel.species}`);
    set.add(`mood:${petModel.mood}`);
    set.add(`feature:${petModel.featureTag}`);
    set.add(`eye:${petModel.eyeStyle}`);
    set.add(`accessory:${petModel.accessory}`);
  }
  (token.derivedStats?.traits ?? []).forEach((item) => set.add(`trait:${item}`));
  return [...set];
}

function featureLabel(key: string) {
  const [category, rawValue] = key.split(":");
  const value = rawValue ?? "";
  const map: Record<string, string> = {
    cat: "猫系",
    bunny: "兔系",
    fox: "狐系",
    bear: "熊系",
    sprite: "精灵系",
    blob: "团子系",
    calm: "平静",
    curious: "好奇",
    bold: "果敢",
    gentle: "温柔",
    focused: "专注",
    mysterious: "神秘",
    social: "社交型",
    introspective: "内省型",
    grounded: "务实型",
    visionary: "理想型",
    logical: "逻辑型",
    empathetic: "共情型",
    structured: "结构型",
    adaptive: "适应型",
    dot: "点状眼",
    smile: "弯月眼",
    sparkle: "星光眼",
    focus: "专注眼",
    none: "无配件",
    halo: "光环",
    scarf: "围巾",
    headband: "头带",
    glasses: "眼镜",
    leaf: "叶饰",
    orb: "浮球",
  };
  const categoryName: Record<string, string> = {
    species: "物种",
    mood: "状态",
    feature: "人格特征",
    eye: "眼型",
    accessory: "配饰",
    trait: "标签",
  };

  const finalLabel = map[value] ?? value;
  return finalLabel || (categoryName[category] ?? "特征");
}

export function TimelineDashboard({ mode = "latest", initialRange = "90d" }: TimelineDashboardProps) {
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mbtiFilter, setMbtiFilter] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("all");
  const { profile } = useVisualSystem();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/timeline?range=${range}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "加载时间轴失败");
        setData(payload);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "加载时间轴失败");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [range]);

  const mbtiOptions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.tokens.map((t) => t.mbti).filter((value): value is string => Boolean(value)))].sort();
  }, [data]);

  const featureOptions = useMemo(() => {
    if (!data) return [];
    const optionMap = new Map<string, FeatureOption>();
    data.tokens.forEach((token) => {
      collectFeatureKeys(token).forEach((key) => {
        const label = featureLabel(key);
        if (!label) return;
        const id = label;
        const existing = optionMap.get(id);
        if (!existing) {
          optionMap.set(id, { id, label, keys: [key] });
          return;
        }
        if (!existing.keys.includes(key)) {
          existing.keys.push(key);
        }
      });
    });
    return [...optionMap.values()].sort((a, b) => a.label.localeCompare(b.label, "zh-Hans-CN"));
  }, [data]);

  const featureOptionMap = useMemo(() => {
    return new Map(featureOptions.map((item) => [item.id, item]));
  }, [featureOptions]);

  const filtered = useMemo(() => {
    if (!data) return null;
    const byToken = [...data.tokens]
      .sort((a, b) => b.tokenIndex - a.tokenIndex)
      .filter((token) => {
        if (mbtiFilter !== "all" && token.mbti !== mbtiFilter) return false;
        if (featureFilter !== "all") {
          const keys = collectFeatureKeys(token);
          const selected = featureOptionMap.get(featureFilter);
          if (!selected) return false;
          if (!selected.keys.some((item) => keys.includes(item))) return false;
        }
        return true;
      });

    const displayTokens = mode === "latest" ? byToken.slice(0, 6) : byToken;
    const sessionSet = new Set(displayTokens.map((t) => t.sessionId));
    const chartData = data.chartData.filter((item) => sessionSet.has(item.id));

    return {
      tokens: displayTokens,
      chartData,
      totalFiltered: byToken.length,
      totalRaw: data.tokens.length,
    };
  }, [data, featureFilter, mbtiFilter, mode, featureOptionMap]);

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-[var(--radius-md)] border border-white/16 bg-white/8 p-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <Button
              key={item.value}
              variant={range === item.value ? "solid" : "ghost"}
              onClick={() => setRange(item.value as typeof initialRange)}
              className="min-w-24"
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/66">类型筛选</span>
            <select
              value={mbtiFilter}
              onChange={(event) => setMbtiFilter(event.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-white/30 bg-black/35 px-3 py-2 text-sm font-medium text-[var(--color-surface)]"
            >
              <option value="all" style={{ color: "#111827" }}>全部类型</option>
              {mbtiOptions.map((item) => (
                <option key={item} value={item} style={{ color: "#111827" }}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-surface)]/66">特征筛选</span>
            <select
              value={featureFilter}
              onChange={(event) => setFeatureFilter(event.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-white/30 bg-black/35 px-3 py-2 text-sm font-medium text-[var(--color-surface)]"
            >
              <option value="all" style={{ color: "#111827" }}>全部特征</option>
              {featureOptions.map((item) => (
                <option key={item.id} value={item.id} style={{ color: "#111827" }}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <motion.p
          className="text-sm text-[var(--color-surface)]/72"
          animate={profile.motionSystem.reducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
        >
          正在加载人格轨迹...
        </motion.p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-md)] border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {filtered ? (
        <Timeline
          mode={mode}
          totalCount={filtered.totalFiltered}
          tokens={filtered.tokens}
          chartData={filtered.chartData}
        />
      ) : null}
    </div>
  );
}
