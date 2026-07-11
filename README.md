# viridis

The [**viridis**](https://bids.github.io/colormap/) colormap and its perceptually uniform siblings as a tiny, dependency-free JavaScript library. Viridis — designed for matplotlib by Stéfan van der Walt and Nathaniel Smith — is perceptually uniform, colorblind-friendly, monotonically increasing in lightness, and prints legibly in grayscale, which is why it became the default way to color data.

Eight colormaps are included:

| Map | Source | Notes |
| --- | --- | --- |
| `viridis`, `magma`, `plasma`, `inferno` | matplotlib | the viridis family |
| `cividis` | Nuñez, Anderton & Renslow | optimized for color-vision deficiency |
| `mako`, `rocket` | seaborn | sequential, heatmap-friendly |
| `turbo` | Google | improved rainbow — vivid, but **not** monotonic in lightness |

Each map is defined by its 256 canonical sRGB anchors; this library embeds them and linearly interpolates between adjacent anchors, so `map(i / 255)` reproduces anchor `i` exactly and everything in between is smooth.

A single dependency-free ES module.

## Install

```
npm install @graysonlang/viridis
```

## Usage

Every colormap is a callable sampler carrying the full API as properties:

```js
import { viridis, magma, turbo, colormaps } from '@graysonlang/viridis';

viridis(0.5);      // -> '#21918d' — hex string at t in [0, 1]
magma(0.5);        // -> '#b6377a'
magma.rgb(0.5);    // -> [182, 55, 122] — integers in [0, 255]
magma.rgbf(0.5);   // -> [0.714, 0.214, 0.476] — floats in [0, 1], for WebGL
magma.css(0.5);    // -> 'rgb(182, 55, 122)'

magma.palette(5);          // 5 evenly spaced hex colors
turbo.palette(9, 0.2, 0.8);  // 9 colors over a sub-range
magma.colors;              // the 256 canonical anchors as '#rrggbb' strings
```

To toggle maps at runtime, look one up by name in the `colormaps` registry:

```js
import { colormaps } from '@graysonlang/viridis';

const map = colormaps[settings.colormap] ?? colormaps.viridis;
ctx.fillStyle = map(t);
```

The original viridis-bound exports are unchanged, so existing code keeps working:

```js
import { viridis, rgb, rgbf, css, palette, colors } from '@graysonlang/viridis';

viridis(0.5);      // -> '#21918d'
rgb(0.5);          // -> [33, 145, 141] — same as viridis.rgb(0.5)
palette(5);        // -> ['#440154', '#3b528b', '#21918d', '#5dc863', '#fde725']
```

Input is clamped to `[0, 1]` (non-finite values map to `0`), so the functions are safe to call straight from render loops. For per-pixel work, `rgb` and `rgbf` accept an optional `out` target to avoid allocating:

```js
const c = new Uint8ClampedArray(3);
for (let i = 0; i < data.length; i++) {
  inferno.rgb(data[i], c);
  // ... write c into your ImageData
}
```

## API

```ts
interface Colormap {
  (t: number): string;                              // '#rrggbb'
  readonly name: ColormapName;
  rgb(t: number, out?: IntTarget): [r, g, b];       // integers 0–255
  rgbf(t: number, out?: FloatTarget): [r, g, b];    // floats 0–1
  css(t: number): string;                           // 'rgb(r, g, b)'
  palette(n: number, start = 0, end = 1): string[]; // n evenly spaced colors
  readonly colors: readonly string[];               // the 256 anchors
}

viridis, magma, plasma, inferno, cividis, turbo, mako, rocket: Colormap;
colormaps: Readonly<Record<ColormapName, Colormap>>; // lookup by name

// Viridis-bound conveniences, kept for backward compatibility.
rgb, rgbf, css, palette, colors;

export default viridis;
```

Full TypeScript declarations ship in [src/viridis.d.ts](src/viridis.d.ts).

## Correctness

The [test suite](test/viridis.test.mjs) pins every colormap down three ways:

- **Reference colors** — the published endpoints and midpoint of each map (e.g. viridis `#440154` → `#fde725`, magma `#000004` → `#fcfdbf`).
- **Exact anchors** — all 256 canonical anchor colors of every map round-trip exactly through the sampler.
- **Structure** — relative luminance increases monotonically across each sequential ramp (the property these maps are designed around; turbo, a rainbow map, is intentionally exempt), and no map jumps more than 8/255 in any channel between adjacent anchors.

```
npm test
```

## Demo

An interactive demo — a grid of live visualizations all colored by the map (Voronoi with Lloyd relaxation, a scalar field, ridgelines, a force-directed tree, a streaming histogram) — lives in [demo/](demo/) and deploys to GitHub Pages.

```
npm run dev      # watch + serve + open a browser
npm run build    # one-shot build into www/
```

Open the workspace (`viridis.code-workspace`) in VS Code and use the default build task (`Cmd+Shift+B`) or launch **Debug in Chrome** from the Run and Debug panel — the same esbuild/esp dev flow as the sibling projects. The demo follows your OS light/dark preference and has a sun/moon toggle in the corner to override it.

## License and data attribution

This library's code is dedicated to the public domain under [CC0 1.0](LICENSE.md). The embedded colormap data comes from:

- **viridis, magma, plasma, inferno** — released CC0 by their authors (via matplotlib).
- **cividis** — Nuñez, Anderton & Renslow, [PLOS ONE 2018](https://doi.org/10.1371/journal.pone.0199239) (via matplotlib, CC0).
- **turbo** — Anton Mikhailov, [Google](https://research.google/blog/turbo-an-improved-rainbow-colormap-for-visualization/), Apache License 2.0.
- **mako, rocket** — Michael Waskom, [seaborn](https://seaborn.pydata.org/), BSD 3-Clause License.
