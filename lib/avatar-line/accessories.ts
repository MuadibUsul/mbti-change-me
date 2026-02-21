import { pickOne } from "@/lib/avatar-line/seed";
import type { TraitVector } from "@/lib/avatar-line/types";

type AccessoryDefinition = {
  id: string;
  tags: Array<"tech" | "nature" | "mystic" | "order" | "social">;
};

const ACCESSORIES: AccessoryDefinition[] = [
  { id: "glasses", tags: ["tech", "order"] },
  { id: "scarf", tags: ["social", "nature"] },
  { id: "headphones", tags: ["tech", "social"] },
  { id: "book", tags: ["order", "mystic"] },
  { id: "coffee", tags: ["social", "order"] },
  { id: "star_hairpin", tags: ["mystic"] },
  { id: "leaf_pin", tags: ["nature"] },
  { id: "moon_badge", tags: ["mystic", "order"] },
  { id: "ruler", tags: ["order", "tech"] },
  { id: "mini_keyboard", tags: ["tech"] },
  { id: "cat_plush", tags: ["social", "nature"] },
  { id: "speech_bubble", tags: ["social"] },
  { id: "tiny_satchel", tags: ["order", "nature"] },
  { id: "spark_orb", tags: ["mystic", "tech"] },
];

const GLYPHS = ["stars", "ripples", "grid", "triangles", "sparkles", "annotation"] as const;

function tagScore(tag: AccessoryDefinition["tags"][number], traits: TraitVector, mbti: string) {
  const upper = mbti.toUpperCase();
  if (tag === "tech") return traits.tech + (upper.includes("T") ? 0.2 : 0);
  if (tag === "nature") return traits.nature + (upper.includes("F") ? 0.12 : 0);
  if (tag === "mystic") return traits.mystic + (upper.includes("N") ? 0.2 : 0);
  if (tag === "order") return traits.order + (upper.includes("J") ? 0.18 : 0);
  return traits.openness + traits.energy * 0.2;
}

function scoreAccessory(item: AccessoryDefinition, traits: TraitVector, mbti: string) {
  const base = 0.18;
  return base + item.tags.reduce((acc, tag) => acc + tagScore(tag, traits, mbti), 0) / item.tags.length;
}

export function selectAccessories(traits: TraitVector, mbti: string, rng: () => number): string[] {
  const sorted = ACCESSORIES.map((item) => ({
    id: item.id,
    score: scoreAccessory(item, traits, mbti),
  })).sort((a, b) => b.score - a.score);

  const countBase = traits.simplicity > 0.7 ? 1 : traits.simplicity < 0.35 ? 3 : 2;
  const count = Math.max(1, Math.min(4, countBase + (traits.energy > 0.78 ? 1 : 0)));

  const picked = new Set<string>();
  let guard = 0;
  while (picked.size < count && guard < 30) {
    guard += 1;
    const topWindow = sorted.slice(0, Math.min(7 + guard, sorted.length));
    const next = pickOne(rng, topWindow);
    picked.add(next.id);
  }
  return [...picked];
}

export function selectBackgroundGlyph(traits: TraitVector, rng: () => number) {
  if (traits.tech > 0.7) return "grid";
  if (traits.nature > 0.7) return "ripples";
  if (traits.mystic > 0.66) return "sparkles";
  if (traits.energy > 0.72) return pickOne(rng, ["triangles", "stars"]);
  if (traits.simplicity > 0.68) return "annotation";
  return pickOne(rng, [...GLYPHS]);
}

export function getAccessoryCatalog() {
  return ACCESSORIES.map((item) => item.id);
}

export function getBackgroundGlyphCatalog() {
  return [...GLYPHS];
}

