import { clamp, round } from "@/lib/math";
import { getPoseById } from "@/lib/avatar-line/poses";
import { mulberry32, randRange } from "@/lib/avatar-line/seed";
import { getStyleProfileById } from "@/lib/avatar-line/styles";
import type { AvatarConfig, PoseTemplate, StyleProfile } from "@/lib/avatar-line/types";

const VIEWBOX = "0 0 200 200";

function num(v: number) {
  return round(v, 2).toFixed(2);
}

function clampCanvas(value: number) {
  return clamp(value, 8, 192);
}

function wobblePoint(
  x: number,
  y: number,
  traitWobble: number,
  style: StyleProfile,
  rng: () => number,
) {
  const factor = traitWobble * style.wobbleFactor * 3.2;
  return {
    x: clampCanvas(x + randRange(rng, -factor, factor)),
    y: clampCanvas(y + randRange(rng, -factor, factor)),
  };
}

function qCurve(
  points: [number, number][],
  traitWobble: number,
  style: StyleProfile,
  rng: () => number,
) {
  const [p0, p1, p2] = points;
  const a = wobblePoint(p0[0], p0[1], traitWobble, style, rng);
  const b = wobblePoint(p1[0], p1[1], traitWobble, style, rng);
  const c = wobblePoint(p2[0], p2[1], traitWobble, style, rng);
  return `M ${num(a.x)} ${num(a.y)} Q ${num(b.x)} ${num(b.y)} ${num(c.x)} ${num(c.y)}`;
}

function drawGlyph(glyph: string, stroke: string, accent: string) {
  if (glyph === "stars") {
    return `
      <path d="M22 32 l4 0 l2 -4 l2 4 l4 0 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 z" fill="none" stroke="${accent}"/>
      <path d="M168 38 l3 0 l1.5 -3 l1.5 3 l3 0 l-2.2 2.2 l0.8 3 l-3.1 -1.6 l-3.1 1.6 l0.8 -3 z" fill="none" stroke="${accent}"/>
    `;
  }
  if (glyph === "ripples") {
    return `
      <path d="M18 30 Q 30 22 42 30" fill="none" stroke="${accent}" opacity="0.55"/>
      <path d="M158 40 Q 170 32 182 40" fill="none" stroke="${accent}" opacity="0.55"/>
    `;
  }
  if (glyph === "grid") {
    return `
      <path d="M18 24 h26 M18 30 h26 M18 36 h26 M18 24 v12 M26 24 v12 M34 24 v12 M42 24 v12" fill="none" stroke="${accent}" opacity="0.46"/>
    `;
  }
  if (glyph === "triangles") {
    return `
      <path d="M24 34 l8 -10 l8 10 z M170 40 l7 -9 l7 9 z" fill="none" stroke="${accent}" opacity="0.6"/>
    `;
  }
  if (glyph === "sparkles") {
    return `
      <path d="M28 28 v10 M23 33 h10 M174 28 v10 M169 33 h10" fill="none" stroke="${accent}" opacity="0.7"/>
    `;
  }
  return `
    <path d="M18 30 h24 M166 36 h16 M176 36 l-4 -4" fill="none" stroke="${accent}" opacity="0.6"/>
  `;
}

function drawAccessory(id: string, stroke: string, accent: string) {
  if (id === "glasses") {
    return `<g><circle cx="92" cy="85" r="6" fill="none"/><circle cx="108" cy="85" r="6" fill="none"/><path d="M98 85 h4" /></g>`;
  }
  if (id === "scarf") {
    return `<g><path d="M82 118 q18 8 36 0" /><path d="M100 118 v18" /></g>`;
  }
  if (id === "headphones") {
    return `<g><path d="M84 69 q16 -12 32 0" /><rect x="79" y="74" width="6" height="10" rx="2"/><rect x="115" y="74" width="6" height="10" rx="2"/></g>`;
  }
  if (id === "book") {
    return `<g><rect x="88" y="138" width="24" height="14" rx="2" fill="none"/><path d="M100 138 v14"/></g>`;
  }
  if (id === "coffee") {
    return `<g><rect x="120" y="132" width="12" height="12" rx="2" fill="none"/><path d="M132 136 q4 0 4 4 q0 4 -4 4"/><path d="M123 129 q1 -3 0 -5" /></g>`;
  }
  if (id === "star_hairpin") {
    return `<path d="M120 70 l3 0 l1.5 -3 l1.5 3 l3 0 l-2.2 2.2 l0.8 3 l-3.1 -1.6 l-3.1 1.6 l0.8 -3 z" fill="none" stroke="${accent}" />`;
  }
  if (id === "leaf_pin") {
    return `<path d="M78 72 q7 -8 14 0 q-7 8 -14 0 z" fill="none" stroke="${accent}" />`;
  }
  if (id === "moon_badge") {
    return `<path d="M130 120 a6 6 0 1 1 -4 -10 a5 5 0 1 0 4 10 z" fill="none" stroke="${accent}" />`;
  }
  if (id === "ruler") {
    return `<g><path d="M68 134 h20"/><path d="M72 131 v6 M76 132 v4 M80 131 v6 M84 132 v4"/></g>`;
  }
  if (id === "mini_keyboard") {
    return `<g><rect x="80" y="144" width="40" height="10" rx="2" fill="none"/><path d="M84 148 h2 M88 148 h2 M92 148 h2 M100 148 h2 M108 148 h2 M116 148 h2"/></g>`;
  }
  if (id === "cat_plush") {
    return `<g><circle cx="136" cy="145" r="7" fill="none"/><path d="M131 139 l2 -3 l2 3 M137 139 l2 -3 l2 3" /><circle cx="133.5" cy="145" r="1"/><circle cx="138.5" cy="145" r="1"/></g>`;
  }
  if (id === "speech_bubble") {
    return `<g><rect x="126" y="70" width="22" height="13" rx="5" fill="none"/><path d="M132 83 l-3 5 l7 -3"/></g>`;
  }
  if (id === "tiny_satchel") {
    return `<g><rect x="70" y="136" width="14" height="12" rx="2" fill="none"/><path d="M70 136 q7 -6 14 0"/></g>`;
  }
  if (id === "spark_orb") {
    return `<g><circle cx="64" cy="84" r="4" fill="none" stroke="${accent}"/><path d="M64 78 v-3 M64 90 v3 M58 84 h-3 M70 84 h3" stroke="${accent}"/></g>`;
  }
  return "";
}

function drawPoseLimbs(
  pose: PoseTemplate,
  strokeWeight: number,
  traitWobble: number,
  style: StyleProfile,
  rng: () => number,
) {
  return `
    <path d="${qCurve(pose.armL, traitWobble, style, rng)}" stroke-width="${num(strokeWeight)}" fill="none"/>
    <path d="${qCurve(pose.armR, traitWobble, style, rng)}" stroke-width="${num(strokeWeight)}" fill="none"/>
    <path d="${qCurve(pose.legL, traitWobble, style, rng)}" stroke-width="${num(strokeWeight)}" fill="none"/>
    <path d="${qCurve(pose.legR, traitWobble, style, rng)}" stroke-width="${num(strokeWeight)}" fill="none"/>
  `;
}

export function renderAvatarSVG(config: AvatarConfig): string {
  const rng = mulberry32(config.seed);
  const style = getStyleProfileById(config.styleProfileId);
  const pose = getPoseById(config.poseId);

  const traits = config.traitVector;
  const headRatio = 0.45 + 0.2 * traits.chibi;
  const totalHeight = 138;
  const headHeight = totalHeight * headRatio;
  const bodyHeight = totalHeight - headHeight;

  const centerX = 100;
  const topY = 24 + pose.bodyYOffset;
  const headW = clamp(58 + traits.roundness * 22 + style.roundBoost * 12, 50, 78);
  const headH = clamp(headHeight, 64, 92);
  const bodyW = clamp(42 + traits.roundness * 18 - traits.simplicity * 6, 36, 62);
  const bodyH = clamp(bodyHeight + 10, 56, 86);
  const faceSafeLeft = centerX - headW * 0.28;
  const faceSafeRight = centerX + headW * 0.28;
  const faceY = topY + headH * 0.58;

  const strokeWeight = clamp(1.8 + traits.stroke_weight * 2.2, 1.3, 4.2) * style.strokeScale;
  const eyeRadius = clamp(2.2 + traits.eye_size * 3.6 + style.eyeBoost * 2.2, 2.2, 7);
  const mouthCurve = clamp((traits.smile - 0.5) * 18, -6, 8);

  const eyeLX = clamp(faceSafeLeft + headW * 0.08, faceSafeLeft, faceSafeRight);
  const eyeRX = clamp(faceSafeRight - headW * 0.08, faceSafeLeft, faceSafeRight);
  const eyeY = clamp(faceY - 2, topY + headH * 0.48, topY + headH * 0.72);
  const mouthY = eyeY + 14;

  const bodyX = centerX - bodyW / 2;
  const bodyY = topY + headH - 10;
  const bodyR = clamp(10 + traits.roundness * 14 + style.roundBoost * 8, 8, 24);

  const headPath = `
    <rect x="${num(centerX - headW / 2)}" y="${num(topY)}" width="${num(headW)}" height="${num(
      headH,
    )}" rx="${num(bodyR + 6)}" ry="${num(bodyR + 6)}" fill="none" stroke-width="${num(strokeWeight)}"/>
  `;
  const bodyPath = `
    <rect x="${num(bodyX)}" y="${num(bodyY)}" width="${num(bodyW)}" height="${num(bodyH)}" rx="${num(bodyR)}" ry="${num(
      bodyR,
    )}" fill="none" stroke-width="${num(strokeWeight)}"/>
  `;

  const cheekOpacity = clamp(0.15 + traits.cheek * 0.45, 0.12, 0.62);
  const cheeks = `
    <circle cx="${num(eyeLX - 7)}" cy="${num(eyeY + 9)}" r="${num(2 + traits.cheek * 2.6)}" fill="${config.palette.accent}" opacity="${num(
      cheekOpacity,
    )}" stroke="none"/>
    <circle cx="${num(eyeRX + 7)}" cy="${num(eyeY + 9)}" r="${num(2 + traits.cheek * 2.6)}" fill="${config.palette.accent}" opacity="${num(
      cheekOpacity,
    )}" stroke="none"/>
  `;

  const eyes = `
    <circle cx="${num(eyeLX)}" cy="${num(eyeY)}" r="${num(eyeRadius)}" fill="${config.palette.stroke}" stroke="none"/>
    <circle cx="${num(eyeRX)}" cy="${num(eyeY)}" r="${num(eyeRadius)}" fill="${config.palette.stroke}" stroke="none"/>
  `;
  const mouth = `
    <path d="M ${num(centerX - 10)} ${num(mouthY)} Q ${num(centerX)} ${num(mouthY + mouthCurve)} ${num(centerX + 10)} ${num(
      mouthY,
    )}" stroke-width="${num(strokeWeight * 0.78)}" fill="none"/>
  `;

  const accessoryMarkup = config.accessories
    .map((id) => drawAccessory(id, config.palette.stroke, config.palette.accent))
    .join("");

  const glyphMarkup = drawGlyph(config.backgroundGlyph, config.palette.stroke, config.palette.accent);

  const limbsMarkup = drawPoseLimbs(
    pose,
    clamp(strokeWeight * 0.92, 1.2, 3.8),
    traits.wobble,
    style,
    rng,
  );

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" fill="none">
  <rect x="0" y="0" width="200" height="200" fill="${config.palette.bg}" />
  <g stroke="${config.palette.stroke}" stroke-linecap="round" stroke-linejoin="round">
    ${glyphMarkup}
    ${limbsMarkup}
    ${bodyPath}
    ${headPath}
    ${eyes}
    ${cheeks}
    ${mouth}
    ${accessoryMarkup}
  </g>
</svg>`.trim();
}

