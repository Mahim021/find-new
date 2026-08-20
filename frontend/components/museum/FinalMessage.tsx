"use client";

import { useEffect } from "react";
import { useMuseumStore } from "@/lib/store";
import type { RoomBounds } from "@/lib/level";

export default function FinalMessage({
  finalRoom,
  message,
}: {
  finalRoom: RoomBounds | undefined;
  message: string;
}) {
  const currentRoomId = useMuseumStore((s) => s.currentRoomId);
  const finalMessageOpen = useMuseumStore((s) => s.finalMessageOpen);
  const finalMessageSeen = useMuseumStore((s) => s.finalMessageSeen);
  const setFinalMessageOpen = useMuseumStore((s) => s.setFinalMessageOpen);
  const markFinalMessageSeen = useMuseumStore((s) => s.markFinalMessageSeen);
  const selectedPhoto = useMuseumStore((s) => s.selectedPhoto);

  useEffect(() => {
    if (!finalRoom || currentRoomId !== finalRoom.id || finalMessageSeen) return;
    const t = setTimeout(() => {
      markFinalMessageSeen();
      setFinalMessageOpen(true);
      if (document.pointerLockElement) document.exitPointerLock();
    }, 1400);
    return () => clearTimeout(t);
  }, [currentRoomId, finalRoom, finalMessageSeen, markFinalMessageSeen, setFinalMessageOpen]);

  if (!finalMessageOpen || selectedPhoto) return null;

  const paragraphs = message.split("\n\n");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm"
      onClick={() => setFinalMessageOpen(false)}
    >
      <div
        className="relative max-w-lg rounded-sm border border-amber-200/20 bg-[#1c1310] p-8 text-center shadow-2xl sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-5 text-xs uppercase tracking-[0.35em] text-amber-200/60">Happy Birthday</p>
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="font-serif text-lg leading-relaxed text-amber-50/95 sm:text-xl">
              {p}
            </p>
          ))}
        </div>
        <button
          onClick={() => setFinalMessageOpen(false)}
          className="mt-8 rounded-full border border-white/20 px-6 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
