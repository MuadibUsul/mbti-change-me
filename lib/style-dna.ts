import seedrandom from "seedrandom";
import { shortHash } from "@/lib/hash";
import { clamp, round } from "@/lib/math";
import type {
  BehaviorStats,
  Dimension,
  DimensionScores,
  HSLColor,
  StyleDNA,
} from "@/lib/types";

type StyleDNAInput = {
  userId: string;
  sessionId: string;
  scores: DimensionScores;
  behavior: BehaviorStats;
};

function interpolate(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hueByDimension(dimension: Dimension, score: number) {
  const t = (score + 1) / 2;
  if (dimension === "EI") return interpolate(214, 24, t);
  if (dimension === "SN") return interpolate(294, 42, t);
  if (dimension === "TF") return interpolate(8, 216, t);
  return interpolate(272, 136, t);
}

function colorFromScore(dimension: Dimension, score: number, behavior: BehaviorStats): HSLColor {
  const hue = hueByDimension(dimension, score);
  const saturation = clamp(68 - behavior.neutrality * 28 + behavior.extremity * 16, 24, 86);
  const lightness = clamp(58 + score * 7 + behavior.consistency * 6 - behavior.extremity * 6, 30, 78);
  return {
    h: round(hue, 2),
    s: round(saturation, 2),
    l: round(lightness, 2),
  };
}

function accessoryFromScores(scores: DimensionScores, behavior: BehaviorStats): StyleDNA["accessory"] {
  const entries = Object.entries(scores) as [Dimension, number][];
  const dominant = entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0][0];

  if (behavior.neutrality > 0.6) return "none";
  if (dominant === "EI") return "halo";
  if (dominant === "SN") return "antenna";
  if (dominant === "TF") return "scarf";
  return "cape";
}

function createCompanion(seed: string) {
  const rng = seedrandom(`companion:${seed}`);

  const prefixes = ["澄", "熙", "岚", "曜", "栖", "弦", "璃", "沐", "序", "宁"];
  const suffixes = ["灵", "羽", "镜", "岚", "曜", "音", "屿", "舟", "纹", "芽"];
  const roles = ["共鸣向导", "内在观察者", "情绪翻译官", "成长同伴", "人格镜像师"];
  const mottos = [
    "先理解，再改变。",
    "你的波动不是问题，而是线索。",
    "温柔且持续，比激烈更有力量。",
    "把感受说出来，答案会更清晰。",
    "每一次测试，都是你看见自己的机会。",
  ];
  const tones: Array<"calm" | "warm" | "analytic" | "playful"> = [
    "calm",
    "warm",
    "analytic",
    "playful",
  ];

  return {
    id: shortHash(`companion-${seed}`, 10),
    name: `${prefixes[Math.floor(rng() * prefixes.length)]}${suffixes[Math.floor(rng() * suffixes.length)]}`,
    role: roles[Math.floor(rng() * roles.length)],
    tone: tones[Math.floor(rng() * tones.length)],
    motto: mottos[Math.floor(rng() * mottos.length)],
    wisdomVector: [round(rng(), 4), round(rng(), 4), round(rng(), 4)] as [number, number, number],
  };
}

export function generateStyleDNA(input: StyleDNAInput): StyleDNA {
  const { userId, sessionId, scores, behavior } = input;
  const seed = `${shortHash(`${userId}:${sessionId}`, 16)}:${shortHash(userId, 8)}`;
  const extremity = behavior.extremity;
  const consistency = behavior.consistency;
  const reverse = behavior.reverseSensitivity;

  const silhouette: StyleDNA["silhouette"] =
    extremity < 0.35 ? "round" : extremity > 0.68 ? "sharp" : "balanced";
  const lineWeight = clamp(Math.round(1 + extremity * 2 + reverse), 1, 4) as 1 | 2 | 3 | 4;

  let texture: StyleDNA["texture"] = "none";
  if (reverse > 0.58) texture = "split";
  else if (consistency < 0.35) texture = "gradient";
  else if (consistency < 0.55) texture = "stripes";
  else if (extremity > 0.7 && behavior.neutrality < 0.35) texture = "dots";

  const basePalette: HSLColor[] = (["EI", "SN", "TF", "JP"] as const).map((dimension) =>
    colorFromScore(dimension, scores[dimension], behavior),
  );

  return {
    silhouette,
    lineWeight,
    symmetry: round(clamp(consistency * (1 - reverse * 0.45), 0, 1), 4),
    texture,
    accessory: accessoryFromScores(scores, behavior),
    basePalette,
    regionMap: {
      head: "SN",
      chest: "TF",
      belly: "JP",
      armL: "EI",
      armR: "TF",
      legL: "JP",
      legR: "SN",
      aura: "EI",
    },
    seed,
    companion: createCompanion(seed),
  };
}

export function ensureStyleDNACompanion(styleDNA: StyleDNA): StyleDNA {
  if (styleDNA.companion) return styleDNA;
  return {
    ...styleDNA,
    companion: createCompanion(styleDNA.seed),
  };
}

export function parseStyleDNA(raw: unknown): StyleDNA | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    const value = raw as StyleDNA;
    if (!value.seed || !Array.isArray(value.basePalette)) return null;
    return ensureStyleDNACompanion(value);
  } catch {
    return null;
  }
}
