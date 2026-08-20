"""
Thin wrapper around a pretrained CLIP model (open_clip, ViT-B-32 / laion2b_s34b_b79k).

No training happens here — pretrained weights only. The model is loaded once
(lazily, on first use) and reused for both image and text encoding so image
and text embeddings land in the same joint space (needed for semantic search).

This module intentionally does nothing at import time: weights are only
downloaded/loaded the first time `encode_images` or `encode_text` is called,
so importing this file (e.g. for tests or tooling) never triggers a network
call or a slow model load.
"""
from __future__ import annotations

from pathlib import Path
from typing import Sequence

import numpy as np

_MODEL_NAME = "ViT-B-32"
_PRETRAINED = "laion2b_s34b_b79k"

# Lazily-populated globals. Kept module-level so the (slow) model load
# happens once per process, not once per call.
_model = None
_preprocess = None
_tokenizer = None
_device = "cpu"


def _load():
    """Load the CLIP model + preprocess + tokenizer on first use."""
    global _model, _preprocess, _tokenizer, _device

    if _model is not None:
        return

    import torch
    import open_clip

    _device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(
        _MODEL_NAME, pretrained=_PRETRAINED
    )
    model.eval().to(_device)

    _model = model
    _preprocess = preprocess
    _tokenizer = open_clip.get_tokenizer(_MODEL_NAME)


def encode_images(paths: Sequence[str | Path]) -> np.ndarray:
    """Embed a list of image file paths.

    Returns an (N, D) float32 numpy array of L2-normalized embeddings, where
    N = len(paths) and D is the CLIP embedding dimension (512 for ViT-B-32).
    """
    _load()

    import torch
    from PIL import Image

    images = [_preprocess(Image.open(p).convert("RGB")) for p in paths]
    batch = torch.stack(images).to(_device)

    with torch.no_grad():
        features = _model.encode_image(batch)
        features = features / features.norm(dim=-1, keepdim=True)

    return features.cpu().numpy().astype(np.float32)


def encode_text(query: str) -> np.ndarray:
    """Embed a single text query into the same space as `encode_images`.

    Returns a (D,) float32 numpy array, L2-normalized.
    """
    _load()

    import torch

    tokens = _tokenizer([query]).to(_device)

    with torch.no_grad():
        features = _model.encode_text(tokens)
        features = features / features.norm(dim=-1, keepdim=True)

    return features.cpu().numpy().astype(np.float32)[0]
