# data/

Drop her real photos here before running the pipeline:

- `data/photos/` — the photo files (`.jpg`, `.jpeg`, `.png`, `.webp`)
- `data/captions.json` — human-written captions, shaped like:

  ```json
  {
    "photo1.jpg": "The day we met at the coffee shop.",
    "photo2.jpg": "Our first road trip together."
  }
  ```

Captions are written by a person on purpose — the export script never
invents them. If a photo has no entry in `captions.json`, it gets an
"EDIT ME" placeholder caption in the output instead of a fabricated one.

Everything in this folder except this README and `.gitkeep` is gitignored
(see `../.gitignore`) since it's personal, private photo content.
