// The three selectable "worlds" she can walk the same gallery in. Room
// layout/photos never change — only this visual skin does (colors,
// materials, ceiling style, ambient particles, and the centerpiece).

export type WorldThemeId = "palace" | "garden" | "cozy";

export type CeilingStyle = "flat" | "starry";
export type ParticleStyle = "dust" | "petals" | "embers";
export type FrameStyle = "gold" | "driftwood" | "darkwood";
export type CenterpieceStyle = "chandelier" | "tree" | "fireplace";

export interface WorldTheme {
  id: WorldThemeId;
  label: string;
  tagline: string;
  swatch: [string, string]; // gradient stops for the picker card
  wallColor: string;
  floorColor: string;
  accentColor: string;
  lightColor: string;
  lightIntensity: number;
  ceiling: CeilingStyle;
  particles: ParticleStyle;
  frame: FrameStyle;
  centerpiece: CenterpieceStyle;
  floorReflective: boolean;
  fog: string;
  background: string;
}

export const WORLD_THEMES: Record<WorldThemeId, WorldTheme> = {
  palace: {
    id: "palace",
    label: "Grand Palace",
    tagline: "Polished marble, gold frames, a glowing chandelier",
    swatch: ["#3a2f1e", "#d4af37"],
    wallColor: "#efe4cf",
    floorColor: "#2b2a2e",
    accentColor: "#d4af37",
    lightColor: "#ffe9c2",
    lightIntensity: 1.15,
    ceiling: "flat",
    particles: "dust",
    frame: "gold",
    centerpiece: "chandelier",
    floorReflective: true,
    fog: "#151217",
    background: "#0d0b0e",
  },
  garden: {
    id: "garden",
    label: "Night Garden",
    tagline: "Starlit sky, fairy lights, drifting petals",
    swatch: ["#0e2a24", "#7fd9c4"],
    wallColor: "#1c3a33",
    floorColor: "#213b2f",
    accentColor: "#a8d8b9",
    lightColor: "#cdeee0",
    lightIntensity: 0.95,
    ceiling: "starry",
    particles: "petals",
    frame: "driftwood",
    centerpiece: "tree",
    floorReflective: false,
    fog: "#07120f",
    background: "#050d0a",
  },
  cozy: {
    id: "cozy",
    label: "Candlelit Gallery",
    tagline: "Warm wood, velvet, soft flickering candlelight",
    swatch: ["#2a1512", "#e0955a"],
    wallColor: "#3d241c",
    floorColor: "#2a180f",
    accentColor: "#e0955a",
    lightColor: "#ffb877",
    lightIntensity: 1.0,
    ceiling: "flat",
    particles: "embers",
    frame: "darkwood",
    centerpiece: "fireplace",
    floorReflective: false,
    fog: "#140d09",
    background: "#0c0705",
  },
};

export const DEFAULT_THEME: WorldThemeId = "palace";

export interface FrameMaterial {
  color: string;
  metalness: number;
  roughness: number;
  matColor: string;
}

const FRAME_MATERIALS: Record<FrameStyle, FrameMaterial> = {
  gold: { color: "#c9a54a", metalness: 0.75, roughness: 0.28, matColor: "#f4f1ea" },
  driftwood: { color: "#a98f6e", metalness: 0.05, roughness: 0.85, matColor: "#eef2e8" },
  darkwood: { color: "#4a2f22", metalness: 0.1, roughness: 0.6, matColor: "#e8d9c8" },
};

export function frameMaterialFor(style: FrameStyle): FrameMaterial {
  return FRAME_MATERIALS[style];
}
