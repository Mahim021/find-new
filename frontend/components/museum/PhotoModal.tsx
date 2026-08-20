"use client";

import { useEffect } from "react";
import { useMuseumStore } from "@/lib/store";

export default function PhotoModal() {
  const selectedPhoto = useMuseumStore((s) => s.selectedPhoto);
  const setSelectedPhoto = useMuseumStore((s) => s.setSelectedPhoto);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedPhoto(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedPhoto]);

  if (!selectedPhoto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.25s_ease]"
      onClick={() => setSelectedPhoto(null)}
    >
      <div
        className="relative mx-4 flex max-w-3xl flex-col items-center gap-5 rounded-sm bg-[#12100f] p-6 shadow-2xl ring-1 ring-white/10 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={selectedPhoto.src}
          alt={selectedPhoto.caption}
          className="max-h-[60vh] w-auto rounded-[2px] border-8 border-[#2a2320] object-contain shadow-lg"
        />
        <div className="text-center">
          {selectedPhoto.date && (
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-amber-200/70">{selectedPhoto.date}</p>
          )}
          <p className="max-w-xl font-serif text-lg leading-relaxed text-amber-50/95 sm:text-xl">
            {selectedPhoto.caption}
          </p>
        </div>
        <button
          onClick={() => setSelectedPhoto(null)}
          className="mt-2 rounded-full border border-white/20 px-5 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
}
