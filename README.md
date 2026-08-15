# Pokémon SV 151 — Master Set Binder Index

A self-contained, mobile-first lookup tool for a 360-pocket (40 page × 9) binder
holding the Scarlet & Violet 151 master set.

Open `index.html` in any browser, or use the hosted artifact link.

## Ordering model

| Segment | Rule |
| --- | --- |
| `#001`–`#165` | Collector order; each card is immediately followed by its Reverse Holo |
| 12 Double Rare `ex` | No Reverse Holo printing, so one pocket each |
| `#166`–`#207` | Illustration / ultra / hyper rares, one pocket each |

165 base + 153 reverse holos + 42 secrets = 360 pockets.

```
page = ceil(slot / 9)
spot = ((slot - 1) mod 9) + 1
```

## Rebuilding

`index.html` is generated. Edit `template.html`, then:

```sh
node build.mjs
```

The script inlines the card data and the three woff2 faces as data URIs, then
asserts the slot math (360 total, no gaps, plus known fixtures such as
`#067 Machoke` → page 14 spot 9 / page 15 spot 1) before writing output.

## Sources

- Card names, numbers and rarities: Pokémon TCG API, set `sv3pt5` (`151.json`).
- Fonts: Archivo and IBM Plex Mono, both SIL Open Font License 1.1. Inlined
  because the artifact host blocks external font requests.
