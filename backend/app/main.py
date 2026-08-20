"""
Minimal FastAPI stub exposing CLIP embedding + semantic text search.

Vector store: an in-process numpy array (embeddings) + a parallel JSON
sidecar (paths/captions), loaded from / saved to `store.json` +
`store.npz` next to this file. This is intentionally simple — a drop-in
upgrade path later would be Postgres + pgvector, but that's out of scope
for this stub.

Run with: uvicorn app.main:app --reload
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.clip_encoder import encode_images, encode_text

app = FastAPI(title="Museum ML Stub", version="0.1.0")

STORE_DIR = Path(__file__).resolve().parent.parent / "data"
EMBEDDINGS_PATH = STORE_DIR / "store_embeddings.npz"
METADATA_PATH = STORE_DIR / "store_metadata.json"


class EmbedRequest(BaseModel):
    path: Optional[str] = None  # server-side path, alternative to file upload


class SearchResult(BaseModel):
    path: str
    caption: Optional[str] = None
    score: float


def _load_store() -> tuple[np.ndarray, list[dict]]:
    """Load the in-process vector store from disk, if present."""
    if EMBEDDINGS_PATH.exists() and METADATA_PATH.exists():
        embeddings = np.load(EMBEDDINGS_PATH)["embeddings"]
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        return embeddings, metadata
    return np.zeros((0, 512), dtype=np.float32), []


def _save_store(embeddings: np.ndarray, metadata: list[dict]) -> None:
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(EMBEDDINGS_PATH, embeddings=embeddings)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/embed")
async def embed(file: Optional[UploadFile] = File(None), path: Optional[str] = None) -> dict:
    """Embed an image, either uploaded directly or referenced by server-side
    path, and add it to the vector store."""
    if file is None and not path:
        raise HTTPException(status_code=400, detail="Provide either a file upload or a path")

    if file is not None:
        tmp_path = STORE_DIR / f"_tmp_{file.filename}"
        STORE_DIR.mkdir(parents=True, exist_ok=True)
        contents = await file.read()
        tmp_path.write_bytes(contents)
        target_path = tmp_path
    else:
        target_path = Path(path)
        if not target_path.exists():
            raise HTTPException(status_code=404, detail=f"No such file: {path}")

    new_embedding = encode_images([target_path])

    embeddings, metadata = _load_store()
    embeddings = np.vstack([embeddings, new_embedding]) if embeddings.size else new_embedding
    metadata.append({"path": str(target_path)})
    _save_store(embeddings, metadata)

    return {"path": str(target_path), "dim": int(new_embedding.shape[1])}


@app.get("/search", response_model=list[SearchResult])
def search(q: str, top_k: int = 5) -> list[SearchResult]:
    """Semantic text search over stored image embeddings using cosine
    similarity in CLIP's joint text-image space."""
    embeddings, metadata = _load_store()
    if embeddings.shape[0] == 0:
        return []

    query_embedding = encode_text(q)
    # Embeddings are already L2-normalized, so dot product == cosine similarity.
    scores = embeddings @ query_embedding

    top_indices = np.argsort(-scores)[:top_k]
    return [
        SearchResult(
            path=metadata[i]["path"],
            caption=metadata[i].get("caption"),
            score=float(scores[i]),
        )
        for i in top_indices
    ]
