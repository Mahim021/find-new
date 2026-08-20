import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import type { MuseumData } from "./types";
import { fallbackMuseum } from "@/data/fallback-museum";

/**
 * Server-side loader. Reads public/data/museum.json (written by the ML
 * pipeline in backend/) if it exists and is valid; otherwise returns the
 * built-in fallback so the museum always renders.
 */
export async function getMuseumData(): Promise<MuseumData> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "museum.json");
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.rooms?.length && parsed?.meta) {
      return parsed as MuseumData;
    }
    return fallbackMuseum;
  } catch {
    return fallbackMuseum;
  }
}
