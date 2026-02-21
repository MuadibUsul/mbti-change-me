"use client";

import { motion } from "framer-motion";
import { AvatarPet3D } from "@/components/AvatarPet3D";
import { Card } from "@/components/Card";
import { AxisBars } from "@/components/jung16/AxisBars";
import { Mentor } from "@/components/Mentor";
import { HeroEnhancement } from "@/components/persona-dashboard/HeroEnhancement";
import { PersonaDashboard } from "@/components/persona-dashboard/PersonaDashboard";
import { RouteButton } from "@/components/RouteButton";
import { buildMbtiDashboardProfile } from "@/lib/mbti-dashboard";
import type { Jung16ScoreResult } from "@/lib/jung16-style";
import type { PetModel } from "@/lib/types";
import { useVisualSystem } from "@/components/visual-system-provider";

type ResultShowcaseProps = {
  mbtiType: string | null;
  tokenIndex?: number;
  archetype?: string;
  traits?: string[];
  petModel?: PetModel | null;
  scores: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
  suggestions: string[];
  reflectionQuestion: string;
  microPlan: string[];
  testId?: string;
  companion?: {
    name: string;
    role: string;
    motto: string;
    tone: "calm" | "warm" | "analytic" | "playful";
  };
  jung16?: Jung16ScoreResult | null;
};

export function ResultShowcase({
  mbtiType,
  tokenIndex,
  archetype,
  traits = [],
  petModel,
  scores,
  suggestions,
  reflectionQuestion,
  microPlan,
  testId,
  companion,
  jung16,
}: ResultShowcaseProps) {
  const { profile } = useVisualSystem();
  const dashboardProfile = buildMbtiDashboardProfile({
    mbtiType: mbtiType ?? "UNKN",
    scores,
    archetype,
    traits,
  });

  const traitMap: Record<string, string> = {
    short: "短发",
    wave: "卷发",
    spike: "刺发",
    bun: "丸子头",
    hood: "兜帽发型",
    round: "圆眼",
    sharp: "锐眼",
    focus: "专注眼",
    jacket: "夹克穿搭",
    hoodie: "卫衣穿搭",
    robe: "长袍穿搭",
    street: "街头穿搭",
    armor: "机甲穿搭",
    pants: "长裤",
    skirt: "裙装",
    tech: "科技下装",
    cargo: "工装下装",
    earring: "耳饰",
    visor: "护目镜",
    badge: "徽章",
    cape: "披风",
    none: "无配件",
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
    dot: "点状眼",
    smile: "弯月眼",
    sparkle: "星光眼",
    social: "社交型",
    introspective: "内省型",
    grounded: "务实型",
    visionary: "理想型",
    logical: "逻辑型",
    empathetic: "共情型",
    structured: "结构型",
    adaptive: "适应型",
    halo: "光环",
    scarf: "围巾",
    headband: "头带",
    glasses: "眼镜",
    leaf: "叶饰",
    orb: "浮球",
  };

  const toneMap: Record<string, string> = {
    calm: "沉静",
    warm: "温暖",
    analytic: "理性",
    playful: "灵动",
  };

  const finalType = jung16?.subtype ?? mbtiType ?? "N/A";
  const speciesLabel = petModel ? traitMap[petModel.species] ?? petModel.species : "未生成";

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-6 md:p-8">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            background:
              "radial-gradient(circle at 50% 26%, color-mix(in oklab, var(--color-glow) 22%, transparent) 0%, transparent 58%)",
          }}
        />

        <div className="relative grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45 / profile.motionSystem.speed }}
            className="space-y-4"
          >
            <div className="rounded-[var(--radius-md)] border border-white/18 bg-black/18 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-surface)]/58">Persona Token</p>
              <p className="mt-1 text-sm text-[var(--color-surface)]/78">#{tokenIndex ?? 0}</p>

              <div className="mt-4 rounded-[var(--radius-md)] border border-white/20 bg-black/24 p-3">
                {petModel ? (
                  <div className="h-64 w-full">
                    <AvatarPet3D petModel={petModel} />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-[var(--color-surface)]/66">暂无形象数据</div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-white/16 bg-white/6 p-4 text-sm text-[var(--color-surface)]/84">
              <p>人格原型：{archetype ?? "待生成"}</p>
              <p className="mt-2">形象特征：{speciesLabel}</p>
              {companion ? <p className="mt-2">AI伙伴：{companion.name}</p> : null}
            </div>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42 }}
              className="rounded-[var(--radius-md)] border border-white/16 bg-white/6 p-5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-surface)]/60">Persona Result</p>
              <h1 className="hero-title mt-2 text-5xl md:text-6xl">{finalType}</h1>

              {tokenIndex === 1 ? (
                <p className="mt-3 rounded-[var(--radius-sm)] border border-amber-200/38 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                  这是你的第一个人格印记（Persona Token #1）。
                </p>
              ) : null}

              {companion ? (
                <div className="mt-4 rounded-[var(--radius-sm)] border border-white/16 bg-white/8 px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-surface)]">
                    AI 伙伴：{companion.name} · {companion.role}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-surface)]/76">“{companion.motto}”</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-surface)]/58">
                    语气：{toneMap[companion.tone] ?? companion.tone}
                  </p>
                </div>
              ) : null}

              {traits.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full border border-white/22 bg-white/10 px-3 py-1 text-xs text-[var(--color-surface)]/84"
                    >
                      {traitMap[trait] ?? trait}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <RouteButton href="/test/new" magnetic>
                  继续测验
                </RouteButton>
                <RouteButton href="/timeline" variant="outline">
                  查看时间轴
                </RouteButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.48 }}
            >
              <AxisBars jung16={jung16 ?? null} fallbackScores={scores} />
            </motion.div>
          </div>
        </div>

        <div className="relative mt-6 border-t border-white/12 pt-6">
          <HeroEnhancement profile={dashboardProfile} />
        </div>
      </Card>

      <PersonaDashboard testId={testId} mbtiType={mbtiType} profile={dashboardProfile} scores={scores} />

      <motion.div
        initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.2, duration: 0.56 }}
      >
        <Mentor actions={suggestions} reflectionQuestion={reflectionQuestion} microPlan={microPlan} />
      </motion.div>
    </div>
  );
}
