import "server-only";
import fs from "node:fs";
import path from "node:path";

export function readDemoJson<T>(file: string): T | undefined {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_DEMO_DATA === "false") return undefined;
  const target = path.join(process.cwd(), "data", file);
  if (!fs.existsSync(target)) return undefined;
  return JSON.parse(fs.readFileSync(target, "utf8")) as T;
}
