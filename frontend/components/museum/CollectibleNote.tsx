"use client";

import { useEffect } from "react";
import { useMuseumStore } from "@/lib/store";

export default function CollectibleNote() {
  const openNote = useMuseumStore((s) => s.openNote);
  const closeNote = useMuseumStore((s) => s.closeNote);
  const collectedCount = useMuseumStore((s) => s.collectedHearts.size);
  const totalHearts = useMuseumStore((s) => s.totalHearts);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeNote();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeNote]);

  if (!openNote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm" onClick={closeNote}>
      <div
        className="relative max-w-sm rounded-sm border border-amber-200/20 bg-[#1c1310] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 text-2xl">💛</p>
        <p className="font-serif text-lg leading-relaxed text-amber-50/95">{openNote.text}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-amber-200/50">
          {collectedCount} / {totalHearts} found
        </p>
        <button
          onClick={closeNote}
          className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
