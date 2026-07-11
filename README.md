# viridis

The [**viridis**](https://bids.github.io/colormap/) colormap as a tiny, dependency-free JavaScript library. Viridis — designed for matplotlib by Stéfan van der Walt and Nathaniel Smith — is perceptually uniform, colorblind-friendly, monotonically increasing in lightness, and prints legibly in grayscale, which is why it became the default way to color data.

The canonical map is defined by 256 sRGB anchors; this library embeds them (the data is CC0) and linearly interpolates between adjacent anchors, so `viridis(i / 255)` reproduces anchor `i` exactly and everything in between is smooth.

A single dependency-free ES module.

## Install

```
npm install @graysonlang/viridis
```

## Usage

```js
import { viridis, rgb, rgbf, css, palette, colors } from '@graysonlang/viridis';

viridis(0.5);      // -> '#21918d' — hex string at t in [0, 1]
rgb(0.5);          // -> [33, 145, 141] — integers in [0, 255]
rgbf(0.5);         // -> [0.129, 0.569, 0.553] — floats in [0, 1], for WebGL
css(0.5);          // -> 'rgb(33, 145, 141)'

palette(5);        // -> ['#440154', '#3b528b', '#21918d', '#5dc863', '#fde725']
palette(9, 0.2, 0.8);  // 9 colors over a sub-range

colors;            // the 256 canonical anchors as '#rrggbb' strings
```

Input is clamped to `[0, 1]` (non-finite values map to `0`), so the functions are safe to call straight from render loops. For per-pixel work, `rgb` and `rgbf` accept an optional `out` target to avoid allocating:

```js
const c = new Uint8ClampedArray(3);
for (let i = 0; i < data.length; i++) {
  rgb(data[i], c);
  // ... write c into your ImageData
}
```

## API

```ts
viridis(t: number): string;                       // '#rrggbb'
rgb(t: number, out?: IntTarget): [r, g, b];       // integers 0–255
rgbf(t: number, out?: FloatTarget): [r, g, b];    // floats 0–1
css(t: number): string;                           // 'rgb(r, g, b)'
palette(n: number, start = 0, end = 1): string[]; // n evenly spaced colors
colors: readonly string[];                        // the 256 anchors

export default viridis;
```

Full TypeScript declarations ship in [src/viridis.d.ts](src/viridis.d.ts).

## Correctness

The [test suite](test/viridis.test.mjs) pins the colormap down three ways:

- **Reference colors** — the published viridis endpoints (`#440154`, `#fde725`) and midpoint.
- **Exact anchors** — all 256 canonical anchor colors round-trip exactly through the sampler.
- **Structure** — relative luminance increases monotonically across the whole ramp, the property viridis is designed around.

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

## License

Dedicated to the public domain under [CC0 1.0](LICENSE.md), matching the license of the viridis colormap data itself.
