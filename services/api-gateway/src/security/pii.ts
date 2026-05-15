import { createHash } from "node:crypto";

export function hashPii(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value.trim()).digest("hex");
}
