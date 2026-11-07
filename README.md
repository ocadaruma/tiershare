# TierShare

A frontend-only tier-meme list. No server, no account — the whole board
lives in the URL, so sharing is just copying a link.

## Features

- S–F tier board with the classic tier-meme colors
- Add / remove items; an item is plain text, or text + link
  (paste a URL into the add box and it becomes a link automatically)
- Reorder within a tier, promote/demote between tiers — all by drag & drop:
  - mouse: grab a chip and drag it anywhere
  - touch: press a chip for ~¼s to lift it, drag, release
  - keyboard: focus a chip (Tab) and use arrow keys / Delete
- State is encoded in the URL hash (`lz-string` compressed + base64url),
  so a board is fully shareable via its URL
- Link-size guardrails:
  - footer shows current link size
  - > 4 KB: warning (may be truncated by some apps)
  - > 10 KB: board is kept in `localStorage` only, and a notice is shown
- Share button uses the native Web Share API on supported phones
- Responsive down to small phones (`100dvh`, safe-area, 40px+ touch targets)

## Develop

```sh
npm install
npm run dev       # dev server
npm run build     # typecheck + production build -> dist/
npm run preview   # serve the production build
npm test          # logic + URL roundtrip tests (esbuild bundle + node)
```

## Deploy

`npm run build` outputs plain static files in `dist/` — host them on any
static host (GitHub Pages, Netlify, S3, or just open `dist/index.html`).
`base: "./"` is set so it also works from a sub-path.

## URL format

`#<base64url(lzstring(JSON({title, items: [{id, text, link?, tier}]})`

- encoded/decoded in `src/url.ts`, validated in `src/model.ts:sanitizeBoard`
- only `http(s)` links are kept from shared URLs
- measured capacity: ~100 items with links ≈ 2.5 KB URL

## Layout

```
index.html          static skeleton
src/
  model.ts          state + add/remove/move logic (pure, no DOM)
  url.ts            encode/decode board <-> URL hash
  render.ts         DOM rendering of the board
  drag.ts           pointer-based drag & drop (mouse + touch long-press)
  main.ts           wiring, URL sync, keyboard move, copy/share
  styles.css
test/
  logic.test.ts     model + URL roundtrip tests
```
