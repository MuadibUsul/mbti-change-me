import type { Jung16Axis, Jung16ScoreResult } from "@/lib/jung16-style/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isAxis(value: string): value is Jung16Axis {
  return value === "EI" || value === "SN" || value === "TF" || value === "JP" || value === "AT";
}

export function parseJung16Score(input: unknown): Jung16ScoreResult | null {
  if (!isObject(input)) return null;
  if (!isObject(input.axes) || !isObject(input.confidence) || !isObject(input.debug)) return null;
  if (typeof input.type4 !== "string") return null;

  const debug = input.debug as Record<string, unknown>;
  const unreliableAxesRaw = Array.isArray(debug.unreliableAxes) ? debug.unreliableAxes : [];
  const unreliableAxes = unreliableAxesRaw.filter((v): v is Jung16Axis => typeof v === "string" && isAxis(v));

  return {
    ...(input as Jung16ScoreResult),
    debug: {
      ...(input.debug as Jung16ScoreResult["debug"]),
      unreliableAxes,
    },
  };
}

