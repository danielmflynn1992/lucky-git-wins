# CompCard visual regression

Guardrail so future CSS tweaks don't silently break the CTA layout again
(see the "Enter Now" overflow saga).

## What it does

- `/dev/compcard` renders `CompCard` at the container widths the real
  grid uses (mobile 2-col, tight 2-col, tablet 3-col, desktop 3-col)
  with worst-case content (short title, wrapping title, almost-sold).
- `tests/visual/compcard.py` opens that page in headless Chromium and
  asserts every `<a>` / `<button>` CTA inside each card has
  `scrollWidth <= clientWidth` (i.e. no horizontal overflow, no clipped
  labels). Also saves per-width screenshots to `/tmp/browser/compcard/`.

## Run

With the dev server on `localhost:8080`:

```bash
python3 tests/visual/compcard.py
```

Exit code `0` = pass, `1` = fail with the offending width + card + label
printed. Screenshots always land in `/tmp/browser/compcard/`.

## When to run

Any time you change:
- `src/components/CompCard.tsx`
- Button / typography tokens in `src/styles.css`
- The competition grid column counts

## Adding cases

Extend `WIDTHS` or `VARIANTS` in `src/routes/dev.compcard.tsx`. Anything
with `data-vr-card` / `data-vr-width` is picked up automatically.