import type { AvatarPalette, StyleProfile, TraitVector } from "@/lib/avatar-line/types";

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

export function buildPalette(mbti: string, traits: TraitVector, style: StyleProfile): AvatarPalette {
  const upper = mbti.toUpperCase();
  const hueBase = upper[1] === "N" ? 260 : upper[1] === "S" ? 36 : 210;
  const hueShift = upper[2] === "F" ? 24 : -14;
  const strokeHue = (hueBase + hueShift + traits.tech * 18) % 360;
  const accentHue = (strokeHue + 60 + traits.mystic * 34) % 360;

  const stroke = hsl(strokeHue, 24 + traits.order * 24, 18 + (1 - traits.energy) * 20);
  const accent = hsl(accentHue, 58 + traits.energy * 18, 58 + traits.cheek * 12);
  const bg = hsl(
    (strokeHue + 180 + traits.nature * 20) % 360,
    26 - traits.simplicity * 14 + style.decorationDensity * 7,
    94 - traits.energy * 8,
  );

  return { stroke, accent, bg };
}

