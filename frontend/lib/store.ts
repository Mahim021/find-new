import { create } from "zustand";
import type { Object3D } from "three";
import type { PlacedPhoto } from "./level";
import type { WorldThemeId } from "./themes";

const COLLECTED_STORAGE_KEY = "museum-collected-hearts";

function loadCollected(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COLLECTED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCollected(ids: Set<string>) {
  try {
    window.localStorage.setItem(COLLECTED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // best-effort only
  }
}

/** Registered raycast targets, keyed by `${kind}:${id}`, for both photos and collectibles. */
interface MuseumState {
  hasEntered: boolean;
  worldTheme: WorldThemeId | null;
  isLocked: boolean;
  currentRoomId: string | null;
  selectedPhoto: PlacedPhoto | null;
  hoveredKey: string | null;
  musicOn: boolean;
  interactables: Map<string, Object3D>;
  finalMessageOpen: boolean;
  finalMessageSeen: boolean;
  collectedHearts: Set<string>;
  totalHearts: number;
  openNote: { id: string; text: string } | null;
  setHasEntered: (v: boolean) => void;
  setWorldTheme: (t: WorldThemeId) => void;
  setLocked: (v: boolean) => void;
  setCurrentRoomId: (id: string | null) => void;
  setSelectedPhoto: (p: PlacedPhoto | null) => void;
  setHoveredKey: (key: string | null) => void;
  toggleMusic: () => void;
  registerInteractable: (key: string, obj: Object3D) => void;
  unregisterInteractable: (key: string) => void;
  setFinalMessageOpen: (v: boolean) => void;
  markFinalMessageSeen: () => void;
  setTotalHearts: (n: number) => void;
  collectHeart: (id: string, text: string) => void;
  closeNote: () => void;
}

export const useMuseumStore = create<MuseumState>((set, get) => ({
  hasEntered: false,
  worldTheme: null,
  isLocked: false,
  currentRoomId: null,
  selectedPhoto: null,
  hoveredKey: null,
  musicOn: true,
  interactables: new Map(),
  finalMessageOpen: false,
  finalMessageSeen: false,
  collectedHearts: loadCollected(),
  totalHearts: 0,
  openNote: null,
  setHasEntered: (v) => set({ hasEntered: v }),
  setWorldTheme: (t) => set({ worldTheme: t }),
  setLocked: (v) => set({ isLocked: v }),
  setCurrentRoomId: (id) => set({ currentRoomId: id }),
  setSelectedPhoto: (p) => set({ selectedPhoto: p }),
  setHoveredKey: (key) => set({ hoveredKey: key }),
  toggleMusic: () => set((s) => ({ musicOn: !s.musicOn })),
  registerInteractable: (key, obj) => {
    get().interactables.set(key, obj);
  },
  unregisterInteractable: (key) => {
    get().interactables.delete(key);
  },
  setFinalMessageOpen: (v) => set({ finalMessageOpen: v }),
  markFinalMessageSeen: () => set({ finalMessageSeen: true }),
  setTotalHearts: (n) => set({ totalHearts: n }),
  collectHeart: (id, text) => {
    if (get().collectedHearts.has(id)) return;
    const next = new Set(get().collectedHearts);
    next.add(id);
    saveCollected(next);
    set({ collectedHearts: next, openNote: { id, text } });
  },
  closeNote: () => set({ openNote: null }),
}));
