// Shared data contract for the museum.
//
// The ML pipeline (backend/) is expected to produce a JSON file matching
// `MuseumData` at public/data/museum.json. The frontend fetches that file at
// runtime; if it's missing, unreachable, or malformed, it falls back to
// `data/fallback-museum.ts` so the museum always works standalone.

export type Wall = "left" | "right" | "back";

export interface PhotoConfig {
  id: string;
  /** Path under /public, e.g. "/photos/beginning/1.svg" */
  src: string;
  /** Which wall to hang on. If omitted, auto-distributed in order. */
  wall?: Wall;
  caption: string;
  /** Optional human-readable date, e.g. "April 2023" */
  date?: string;
  /** Aspect ratio override, meters. Defaults to 1.3 x 1.0 */
  width?: number;
  height?: number;
}

export interface RoomTheme {
  wallColor: string;
  floorColor: string;
  accentColor: string;
  lightColor: string;
  lightIntensity: number;
}

export interface RoomConfig {
  id: string;
  name: string;
  description?: string;
  width: number;
  /** Minimum depth; the gallery room auto-expands this to fit its photos. */
  depth: number;
  height: number;
  /** Optional legacy per-room color override — the world-theme picker (see
   * lib/themes.ts) is the primary visual skin now, so this is unused by the
   * current renderer but kept for backward compatibility with older data. */
  theme?: RoomTheme;
  photos: PhotoConfig[];
  /** Marks the climactic final room (special centerpiece + message, no exit door) */
  isFinal?: boolean;
}

export interface MuseumMeta {
  title: string;
  recipientName: string;
  subtitle: string;
  welcomeMessage: string;
  finalMessage: string;
}

export interface MuseumData {
  meta: MuseumMeta;
  rooms: RoomConfig[];
}
