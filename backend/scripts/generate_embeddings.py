"""
CLI: embed every photo in a folder and save the result as a .npz file.

Usage:
    python scripts/generate_embeddings.py --photos-dir <dir> --out embeddings.npz

Output .npz contains:
    embeddings: (N, D) float32 array
    paths:      (N,) array of file paths (str), same order as embeddings
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

# Allow running as a plain script (`python scripts/generate_embeddings.py`)
# without having installed the package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.clip_encoder import encode_images  # noqa: E402

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--photos-dir", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("embeddings.npz"))
    args = parser.parse_args()

    photo_paths = sorted(
        p for p in args.photos_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS
    )
    if not photo_paths:
        raise SystemExit(f"No photos found in {args.photos_dir}")

    embeddings = encode_images(photo_paths)
    np.savez(args.out, embeddings=embeddings, paths=[str(p) for p in photo_paths])
    print(f"Saved {len(photo_paths)} embeddings to {args.out}")


if __name__ == "__main__":
    main()
