import { pickOne } from "@/lib/avatar-line/seed";
import type { PoseId, PoseTemplate, TraitVector } from "@/lib/avatar-line/types";

export const POSE_TEMPLATES: PoseTemplate[] = [
  {
    id: "STAND",
    armL: [[76, 118], [64, 136], [70, 154]],
    armR: [[124, 118], [136, 136], [130, 154]],
    legL: [[90, 158], [88, 176], [86, 188]],
    legR: [[110, 158], [112, 176], [114, 188]],
    bodyYOffset: 0,
  },
  {
    id: "WAVE",
    armL: [[76, 118], [60, 104], [62, 88]],
    armR: [[124, 118], [136, 136], [132, 152]],
    legL: [[92, 158], [90, 176], [90, 188]],
    legR: [[110, 158], [114, 176], [116, 188]],
    bodyYOffset: -1,
  },
  {
    id: "THINK_CHIN",
    armL: [[76, 118], [86, 136], [92, 146]],
    armR: [[124, 118], [116, 108], [107, 102]],
    legL: [[90, 158], [90, 176], [90, 188]],
    legR: [[110, 158], [110, 176], [110, 188]],
    bodyYOffset: 0,
  },
  {
    id: "HOLD_BOOK",
    armL: [[76, 118], [84, 130], [90, 140]],
    armR: [[124, 118], [116, 130], [110, 140]],
    legL: [[92, 158], [90, 176], [88, 188]],
    legR: [[108, 158], [110, 176], [112, 188]],
    bodyYOffset: 1,
  },
  {
    id: "JUMP",
    armL: [[76, 116], [62, 104], [56, 92]],
    armR: [[124, 116], [138, 104], [144, 92]],
    legL: [[92, 156], [82, 170], [74, 180]],
    legR: [[108, 156], [118, 170], [126, 180]],
    bodyYOffset: -6,
  },
  {
    id: "SHRUG",
    armL: [[76, 118], [66, 122], [60, 128]],
    armR: [[124, 118], [134, 122], [140, 128]],
    legL: [[90, 158], [90, 176], [88, 188]],
    legR: [[110, 158], [110, 176], [112, 188]],
    bodyYOffset: -1,
  },
];

export function selectPose(traits: TraitVector, rng: () => number): PoseTemplate {
  const pool: PoseId[] = [];

  if (traits.energy > 0.7) pool.push("JUMP", "WAVE");
  if (traits.calm > 0.65) pool.push("THINK_CHIN", "HOLD_BOOK");
  if (traits.openness > 0.6) pool.push("WAVE", "SHRUG");
  if (traits.order > 0.6) pool.push("STAND", "HOLD_BOOK");
  if (!pool.length) pool.push("STAND", "WAVE", "THINK_CHIN", "HOLD_BOOK", "JUMP", "SHRUG");

  const picked = pickOne(rng, pool);
  return POSE_TEMPLATES.find((item) => item.id === picked) ?? POSE_TEMPLATES[0];
}

export function getPoseById(id: PoseId) {
  return POSE_TEMPLATES.find((item) => item.id === id) ?? POSE_TEMPLATES[0];
}

