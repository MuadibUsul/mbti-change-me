import crypto from "node:crypto";

export function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function shortHash(input: string, length = 12) {
  return sha256(input).slice(0, length);
}
