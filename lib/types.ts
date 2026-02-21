export const DIMENSIONS = ["EI", "SN", "TF", "JP"] as const;

export type Dimension = (typeof DIMENSIONS)[number];
export type DimensionScores = Record<Dimension, number>;
export type DimensionLetters = Record<Dimension, string>;

export type QuestionChoice = {
  label: string;
  value: number;
};

export type GeneratedQuestion = {
  id: string;
  text: string;
  dimension: Dimension;
  direction: 1 | -1;
  choices: QuestionChoice[];
  reverseScoring: boolean;
};

export type AnswerInput = {
  questionId: string;
  choice: number;
  elapsedMs?: number;
};

export type BehaviorStats = {
  extremity: number;
  consistency: number;
  neutrality: number;
  reverseSensitivity: number;
  completionPace?: number;
};

export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export type StyleDNA = {
  silhouette: "round" | "balanced" | "sharp";
  lineWeight: 1 | 2 | 3 | 4;
  symmetry: number;
  texture: "none" | "dots" | "stripes" | "gradient" | "split";
  accessory: "none" | "cape" | "halo" | "backpack" | "antenna" | "scarf";
  basePalette: HSLColor[];
  regionMap: {
    head: Dimension;
    chest: Dimension;
    belly: Dimension;
    armL: Dimension;
    armR: Dimension;
    legL: Dimension;
    legR: Dimension;
    aura: Dimension;
  };
  seed: string;
  companion?: {
    id: string;
    name: string;
    role: string;
    tone: "calm" | "warm" | "analytic" | "playful";
    motto: string;
    wisdomVector: [number, number, number];
  };
};

export type AvatarRegions = {
  head: number;
  chest: number;
  belly: number;
  armL: number;
  armR: number;
  legL: number;
  legR: number;
  aura: number;
};

export type PetModel = {
  seed: string;
  species: "cat" | "bunny" | "fox" | "bear" | "sprite" | "blob";
  mood: "calm" | "curious" | "bold" | "gentle" | "focused" | "mysterious";
  featureTag: "social" | "introspective" | "grounded" | "visionary" | "logical" | "empathetic" | "structured" | "adaptive";
  eyeStyle: "dot" | "smile" | "sparkle" | "focus";
  eyeScale: number;
  headScale: number;
  bodyScale: number;
  limbScale: number;
  accessory: "none" | "halo" | "scarf" | "headband" | "glasses" | "leaf" | "orb";
  auraStyle: "none" | "soft" | "ring" | "sparkle" | "flame";
  palette: {
    skin: string;
    body: string;
    accent: string;
    aura: string;
    line: string;
  };
};

export type AvatarTokenPayload = {
  regions: AvatarRegions;
  regionColors: Record<keyof AvatarRegions, string>;
  textureOverlay: StyleDNA["texture"];
  derivedStats: {
    mbti: string;
    contrast: number;
    harmony: number;
    volatility: number;
    archetype?: string;
    traits?: string[];
    petModel?: PetModel;
  };
  generatedAt: string;
  svg: string;
  seed: string;
};

export type TrendInsight = {
  label: string;
  value: number;
  level: "low" | "medium" | "high";
  summary: string;
};
