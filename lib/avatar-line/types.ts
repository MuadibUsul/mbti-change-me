export const AVATAR_LINE_VERSION = "avatar-line-v1" as const;

export type AvatarLineVersion = typeof AVATAR_LINE_VERSION;

export type AvatarAnswerInput = {
  questionId: string;
  option?: string | number;
  choice?: string | number;
  value?: string | number;
};

export type NormalizedAvatarAnswer = {
  questionId: string;
  option: string;
};

export type TraitVector = {
  chibi: number;
  eye_size: number;
  cheek: number;
  smile: number;
  roundness: number;
  stroke_weight: number;
  wobble: number;
  simplicity: number;
  energy: number;
  openness: number;
  calm: number;
  tech: number;
  nature: number;
  mystic: number;
  order: number;
};

export type StyleProfileId =
  | "KawaiiMinimal"
  | "SketchWobble"
  | "GeometricCute"
  | "MangaChibi"
  | "NotebookDoodle"
  | "SoftTechLine";

export type StyleProfile = {
  id: StyleProfileId;
  strokeScale: number;
  wobbleFactor: number;
  eyeBoost: number;
  roundBoost: number;
  simplicityBias: number;
  decorationDensity: number;
};

export type PoseId =
  | "STAND"
  | "WAVE"
  | "THINK_CHIN"
  | "HOLD_BOOK"
  | "JUMP"
  | "SHRUG";

export type PoseTemplate = {
  id: PoseId;
  armL: [number, number][];
  armR: [number, number][];
  legL: [number, number][];
  legR: [number, number][];
  bodyYOffset: number;
};

export type AvatarPalette = {
  stroke: string;
  accent: string;
  bg: string;
};

export type AvatarConfig = {
  version: AvatarLineVersion;
  userId: string;
  mbti: string;
  seed: number;
  variant: number;
  answersSignature: string;
  traitVector: TraitVector;
  styleProfileId: StyleProfileId;
  poseId: PoseId;
  accessories: string[];
  backgroundGlyph: string;
  palette: AvatarPalette;
};

export type AvatarRecord = {
  config: AvatarConfig;
  svg: string;
};

export type AvatarStorageRecord = AvatarRecord & {
  sessionId?: string;
};

export type AvatarStorageAdapter = {
  getBySignature(input: {
    userId: string;
    mbti: string;
    answersSignature: string;
    version: AvatarLineVersion;
    sessionId?: string;
  }): Promise<AvatarStorageRecord | null>;
  save(record: AvatarStorageRecord): Promise<void>;
};

