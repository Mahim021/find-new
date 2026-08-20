# A Little Museum of Us

A personal, walkable 3D museum built as a birthday surprise: a browser-based
first-person gallery of her real photos, ending in a birthday room with one
special photo and a heartfelt message. She can pick which "world" the
gallery looks like (Grand Palace / Night Garden / Candlelit Gallery), and
there are hidden glowing hearts scattered through the hall to find as a
little bonus game.

Her real photos are already imported and live — this isn't placeholder mode.
Personalizing it further (captions, messages) is just editing text — no code
changes required.

## Structure

- `frontend/` — the museum itself (Next.js + React Three Fiber). This is the
  whole experience; it's a complete, self-contained web app.
- `sam/` (repo root) — the original source photos. Only `frontend/public/photos/gallery/`
  is actually used at runtime; `sam/` is kept as the source of truth if you
  want to re-import (e.g. after adding more photos).
- `backend/` — an **optional, not-yet-run** Python ML stub (CLIP embeddings +
  clustering) for auto-organizing a much larger photo library later. The
  museum never depends on this running.

## The experience

1. **Welcome** — a birthday message, then "Choose Tonight's World": Grand
   Palace (reflective marble, gold frames, chandelier), Night Garden (starry
   sky, fairy-light tree, drifting petals), or Candlelit Gallery (warm wood,
   fireplace, embers). Switchable anytime from the in-museum "Change World"
   button.
2. **The gallery hall** — one long salon-style hall (auto-sized to fit
   however many photos you have, two rows per wall) holding all her photos
   except the one reserved for the finale.
3. **Hidden hearts** — 12 glowing collectibles scattered through the hall;
   walking up and clicking one reveals a short bonus note (💛 counter in the
   HUD tracks how many she's found).
4. **The birthday room** — one centerpiece photo (currently the most recent
   photo chronologically) and your final message.

## Personalizing it

Nothing here requires touching 3D/React code — just text and images:

- **Captions.** Every photo's caption is a "✏️ Add a memory…" placeholder in
  [`frontend/data/gallery-photos.json`](frontend/data/gallery-photos.json)
  (generated) — edit the `caption` field per photo. The `id`/`src`/`width`/
  `height` fields are auto-computed; leave those alone.
- **The finale photo + message.** Edit
  [`frontend/data/fallback-museum.ts`](frontend/data/fallback-museum.ts):
  `meta.title`, `meta.subtitle`, `meta.welcomeMessage`, `meta.finalMessage`
  (the birthday letter), and the finale room's `caption`. To pick a
  *different* centerpiece photo than "most recent," swap which photo gets
  popped off `galleryPhotos` at the top of that file.
- **Bonus hearts notes.** Edit the 12 strings in
  [`frontend/data/collectible-notes.json`](frontend/data/collectible-notes.json).
- **Add more/different photos.** Drop new files into `sam/` (repo root) and
  re-run `node scripts/import-photos.mjs` from `frontend/` — it re-reads
  every `.jpg` in `sam/`, copies them into `public/photos/gallery/`, and
  regenerates `gallery-photos.json` with correct aspect ratios. The gallery
  hall automatically resizes to fit however many photos there are.
- **(Optional) Add music.** Drop an mp3 at `frontend/public/audio/ambient.mp3`
  and the museum uses it automatically instead of the built-in procedural
  ambient pad.

## Running locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Controls: **WASD** to walk, **mouse** to look
(click once to enable), **click a photo or heart** to open it.

> Note: `next dev` occasionally leaves a background process holding port
> 3000 after you stop it. If `npm run dev` seems to be serving stale
> content, free the port first (Windows: find and stop the process bound to
> port 3000 in Task Manager or via `Get-NetTCPConnection -LocalPort 3000`).

## Deploying (getting her a real link)

The frontend is a standard Next.js app — deploy it anywhere Next.js runs
(Vercel is the path of least resistance):

```bash
cd frontend
npx vercel login  # your own account — needed for a real, durable deployment
npx vercel --prod
```

## The optional ML pipeline (`backend/`)

If you ever have a much larger, unsorted photo library and want it
auto-organized instead of doing it by hand, see
[`backend/README.md`](backend/README.md). Short version: it uses a
pretrained CLIP model to embed photos, clusters them, and writes
`frontend/public/data/museum.json` — which the frontend prefers over the
built-in data if present. It never trains anything, never writes captions
(you write those), and the museum works perfectly well without it. Note the
frontend's visual "world" (Palace/Garden/Cozy) is chosen by her in-app now,
not baked into room data — any `theme` field the pipeline writes is ignored.

## Why it's built this way

- **Real photos, zero placeholder mode.** The gallery is already populated;
  personalizing further is just writing captions.
- **The ML is plumbing, not the gift.** It's there to help organize a much
  larger photo library later; the captions, the final message, and the
  photos themselves are what make it personal, and those stay human-written.
- **The room auto-sizes.** Add or remove photos and the hall's length (and
  photo rows) adjust automatically — no manual layout tuning.
