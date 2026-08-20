# backend (ML stub)

This is a **stub**, not yet run. Nothing here has been executed and no model
weights have been downloaded. The 3D museum frontend works completely
standalone without this ever running — it falls back to
`frontend/data/fallback-museum.ts` (already populated with her real, imported
photos) if `frontend/public/data/museum.json` doesn't exist.

**Note:** the frontend now lets her pick the visual "world" (Grand Palace /
Night Garden / Candlelit Gallery) herself from an in-app picker, rather than
baking colors into room data. Any `theme` field this pipeline writes into a
room is simply ignored by the current frontend — only `id`, `name`,
`description`, `width`/`depth`/`height`, `photos`, and `isFinal` matter.

When real photos exist, this pipeline embeds them with a pretrained CLIP
model (`open_clip`, ViT-B-32 / laion2b), clusters them into thematic rooms,
and writes `frontend/public/data/museum.json` for the frontend to read at
runtime. It can also run as a small FastAPI service for semantic photo
search later ("happy photos", "travel memories").

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

## Add photos

1. Put photo files in `data/photos/`
2. Write captions by hand in `data/captions.json` (see `data/README.md` for
   the format). Captions are never auto-generated — this is a personal gift.

## Regenerate the museum data

```bash
python -m app.export_museum
```

This writes `frontend/public/data/museum.json`. Open the result afterwards
and edit the "EDIT ME" placeholders (titles, descriptions, welcome/final
messages, any auto-filled captions) — those are meant to be written by a
person, not generated.

Optional flags: `--photos-dir`, `--captions`, `--out`, `--n-clusters`
(default 5), `--recipient-name`. Run with `--help` for details.

## Run the semantic search API (optional, later)

```bash
uvicorn app.main:app --reload
```

Exposes `GET /health`, `POST /embed`, `GET /search?q=...`. Uses an
in-process numpy array + JSON sidecar as a simple vector store — swapping in
Postgres + pgvector later is a drop-in upgrade, not built here.

## Notes

- Pretrained CLIP only — nothing is trained.
- If this is never run, the museum still works fine using the frontend's
  built-in placeholder data.
