"use client";

import { useEffect, useMemo } from "react";
import { buildLevel } from "@/lib/level";
import { WORLD_THEMES } from "@/lib/themes";
import { useMuseumStore } from "@/lib/store";
import type { MuseumData } from "@/lib/types";
import collectibleNotes from "@/data/collectible-notes.json";
import Scene from "./Scene";
import Hud from "./Hud";
import LoadingScreen from "./LoadingScreen";
import PhotoModal from "./PhotoModal";
import CollectibleNote from "./CollectibleNote";
import WelcomeOverlay from "./WelcomeOverlay";
import MusicPlayer from "./MusicPlayer";
import FinalMessage from "./FinalMessage";

export default function MuseumApp({ data }: { data: MuseumData }) {
  const level = useMemo(() => buildLevel(data.rooms, collectibleNotes), [data.rooms]);
  const finalRoom = level.rooms.find((r) => r.isFinal);
  const worldThemeId = useMuseumStore((s) => s.worldTheme);
  const hasEntered = useMuseumStore((s) => s.hasEntered);
  const setTotalHearts = useMuseumStore((s) => s.setTotalHearts);

  useEffect(() => {
    setTotalHearts(level.hearts.length);
  }, [level.hearts.length, setTotalHearts]);

  const theme = worldThemeId ? WORLD_THEMES[worldThemeId] : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {theme && hasEntered && <Scene level={level} theme={theme} />}
      {theme && hasEntered && <LoadingScreen />}
      <Hud level={level} />
      <WelcomeOverlay meta={data.meta} />
      <PhotoModal />
      <CollectibleNote />
      <FinalMessage finalRoom={finalRoom} message={data.meta.finalMessage} />
      <MusicPlayer />
    </div>
  );
}
