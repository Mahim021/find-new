"""
The key script: turns a folder of photos + human-written captions into
frontend/public/data/museum.json, matching the MuseumData contract defined
in frontend/lib/types.ts exactly.

Pipeline: embed photos with CLIP -> cluster into rooms -> map clusters to
room names/themes (hardcoded ordered list below, edit freely) -> write JSON.

Run as: python -m app.export_museum --photos-dir data/photos --captions data/captions.json

Captions are human-written on purpose (see data/captions.json) — this script
never invents caption text. Personal fields in `meta` (title, subtitle,
welcomeMessage, finalMessage) are left as clearly marked EDIT ME placeholders
for the same reason: this gift's words should be written by a person.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from app.clip_encoder import encode_images
from app.cluster import cluster_embeddings

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_PHOTOS_DIR = BACKEND_DIR / "data" / "photos"
DEFAULT_CAPTIONS_PATH = BACKEND_DIR / "data" / "captions.json"
DEFAULT_OUT_PATH = BACKEND_DIR.parent / "frontend" / "public" / "data" / "museum.json"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

# Ordered cluster -> room mapping. Cluster 0 (by size, largest first) gets
# ROOM_TEMPLATES[0], and so on. Edit names/themes/descriptions freely — this
# is just a starting point in the spirit of the frontend's built-in rooms.
# The last entry is treated as the final/climactic room.
ROOM_TEMPLATES = [
    {
        "id": "the-beginning",
        "name": "The Beginning",
        "description": "EDIT ME — a line about where it all started.",
        "theme": {
            "wallColor": "#f5e6d3",
            "floorColor": "#d8c3a5",
            "accentColor": "#e8b4a0",
            "lightColor": "#fff1e0",
            "lightIntensity": 1.0,
        },
    },
    {
        "id": "adventures",
        "name": "Adventures",
        "description": "EDIT ME — a line about the trips and adventures.",
        "theme": {
            "wallColor": "#2f3e46",
            "floorColor": "#354f52",
            "accentColor": "#84a98c",
            "lightColor": "#cad2c5",
            "lightIntensity": 0.9,
        },
    },
    {
        "id": "favorite-moments",
        "name": "Favorite Moments",
        "description": "EDIT ME — a line about the best memories together.",
        "theme": {
            "wallColor": "#3d2b3d",
            "floorColor": "#5a3e5a",
            "accentColor": "#d4a5c9",
            "lightColor": "#f2d9e6",
            "lightIntensity": 1.0,
        },
    },
    {
        "id": "little-things",
        "name": "Little Things",
        "description": "EDIT ME — a line about the small everyday moments.",
        "theme": {
            "wallColor": "#e8e4d9",
            "floorColor": "#c9c2ab",
            "accentColor": "#a3b18a",
            "lightColor": "#fdfbf6",
            "lightIntensity": 1.0,
        },
    },
    {
        "id": "final-room",
        "name": "EDIT ME",
        "description": "EDIT ME — the climactic final room.",
        "theme": {
            "wallColor": "#3a1f1f",
            "floorColor": "#5c2a2a",
            "accentColor": "#d4af37",
            "lightColor": "#ffe9c7",
            "lightIntensity": 1.2,
        },
        "isFinal": True,
    },
]


def _load_captions(captions_path: Path) -> dict:
    if not captions_path.exists():
        return {}
    with open(captions_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _find_photos(photos_dir: Path) -> list[Path]:
    if not photos_dir.exists():
        return []
    return sorted(p for p in photos_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)


def build_museum_data(
    photos_dir: Path,
    captions_path: Path,
    n_clusters: int,
    recipient_name: str,
) -> dict:
    photo_paths = _find_photos(photos_dir)
    if not photo_paths:
        raise SystemExit(
            f"No photos found in {photos_dir}. Add photos there before running this script."
        )

    captions = _load_captions(captions_path)
    embeddings = encode_images(photo_paths)
    labels = cluster_embeddings(embeddings, n_clusters=n_clusters)

    # Order clusters largest-first so the mapping to ROOM_TEMPLATES is stable
    # and predictable regardless of KMeans' internal label ordering.
    unique_labels, counts = np.unique(labels, return_counts=True)
    ordered_labels = [lbl for lbl, _ in sorted(zip(unique_labels, counts), key=lambda x: -x[1])]

    templates = ROOM_TEMPLATES[: len(ordered_labels)]
    # Make sure the last room used is still marked isFinal, even if fewer
    # clusters than templates were produced.
    if templates and not templates[-1].get("isFinal"):
        templates = templates[:-1] + [ROOM_TEMPLATES[-1]]

    rooms = []
    for cluster_label, template in zip(ordered_labels, templates):
        member_indices = [i for i, lbl in enumerate(labels) if lbl == cluster_label]
        is_final = bool(template.get("isFinal"))

        if is_final and len(member_indices) > 1:
            # Pick the single photo closest to the cluster centroid as the
            # centerpiece — matches the frontend's "one climactic photo"
            # final room. Edit museum.json afterwards to pick a different one.
            centroid = embeddings[member_indices].mean(axis=0)
            dists = [np.linalg.norm(embeddings[i] - centroid) for i in member_indices]
            member_indices = [member_indices[int(np.argmin(dists))]]

        photos = []
        for i in member_indices:
            path = photo_paths[i]
            caption = captions.get(path.name, "EDIT ME — add a caption")
            photos.append(
                {
                    "id": path.stem,
                    "src": f"/photos/{path.name}",
                    "caption": caption,
                }
            )

        room = {
            "id": template["id"],
            "name": template["name"],
            "description": template["description"],
            "width": 10 if is_final else 8,
            "depth": 8 if is_final else 6,
            "height": 5 if is_final else 4,
            "theme": template["theme"],
            "photos": photos,
        }
        if is_final:
            room["isFinal"] = True
        rooms.append(room)

    return {
        "meta": {
            "title": "EDIT ME — museum title",
            "recipientName": recipient_name,
            "subtitle": "EDIT ME — subtitle",
            "welcomeMessage": "EDIT ME — welcome message",
            "finalMessage": "EDIT ME — final, most personal message",
        },
        "rooms": rooms,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos-dir", type=Path, default=DEFAULT_PHOTOS_DIR)
    parser.add_argument("--captions", type=Path, default=DEFAULT_CAPTIONS_PATH)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT_PATH)
    parser.add_argument("--n-clusters", type=int, default=5)
    parser.add_argument("--recipient-name", type=str, default="EDIT ME")
    args = parser.parse_args()

    data = build_museum_data(
        photos_dir=args.photos_dir,
        captions_path=args.captions,
        n_clusters=args.n_clusters,
        recipient_name=args.recipient_name,
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
