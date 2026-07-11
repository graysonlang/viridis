// Verification suite for @graysonlang/viridis.
//
// Every colormap is pinned down three ways:
//   1. Known reference colors (published endpoints and the anchor-128 midpoint).
//   2. Exact round-trip of all 256 canonical anchors through the sampler.
//   3. Structural properties the maps are designed to have — monotonically
//      increasing luminance for the sequential maps (all but turbo), and
//      smoothness (small adjacent-anchor steps) for every map.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import viridisDefault, {
  viridis, magma, plasma, inferno, cividis, turbo, mako, rocket,
  colormaps, rgb, rgbf, css, palette, colors,
} from '../src/viridis.js';

// Endpoints and the anchor-128 midpoint of each map, from the canonical data
// (matplotlib for the viridis family, cividis, and turbo; seaborn for mako
// and rocket).
const REFERENCE = {
  viridis: ['#440154', '#21918c', '#fde725'],
  magma: ['#000004', '#b73779', '#fcfdbf'],
  plasma: ['#0d0887', '#cc4778', '#f0f921'],
  inferno: ['#000004', '#bc3754', '#fcffa4'],
  cividis: ['#00224e', '#7d7c78', '#fee838'],
  turbo: ['#30123b', '#a4fc3c', '#7a0403'],
  mako: ['#0b0405', '#357ba3', '#def5e5'],
  rocket: ['#03051a', '#cb1b4f', '#faebdd'],
};

test('registry: colormaps holds every map under its name', () => {
  assert.ok(Object.isFrozen(colormaps));
  assert.deepEqual(Object.keys(colormaps), Object.keys(REFERENCE));
  const maps = { viridis, magma, plasma, inferno, cividis, turbo, mako, rocket };
  for (const [name, map] of Object.entries(maps)) {
    assert.equal(colormaps[name], map);
    assert.equal(map.name, name);
  }
});

test('reference colors', () => {
  for (const [name, [start, mid, end]] of Object.entries(REFERENCE)) {
    const map = colormaps[name];
    assert.equal(map(0), start, `${name}(0)`);
    assert.equal(map(128 / 255), mid, `${name} midpoint`);
    assert.equal(map(1), end, `${name}(1)`);
  }
});

test('default export is viridis', () => {
  assert.equal(viridisDefault, viridis);
});

test('viridis-bound exports are kept for backward compatibility', () => {
  assert.equal(rgb, viridis.rgb);
  assert.equal(rgbf, viridis.rgbf);
  assert.equal(css, viridis.css);
  assert.equal(palette, viridis.palette);
  assert.equal(colors, viridis.colors);
});

test('all 256 anchors round-trip exactly', () => {
  for (const map of Object.values(colormaps)) {
    assert.equal(map.colors.length, 256);
    for (let i = 0; i < 256; i++) {
      assert.equal(map(i / 255), map.colors[i], `${map.name} anchor ${i}`);
    }
  }
});

test('interpolation between anchors', () => {
  // Halfway between anchors 0 and 1 must be the channel-wise midpoint.
  for (const map of Object.values(colormaps)) {
    const t = 0.5 / 255;
    const a = map.colors[0];
    const b = map.colors[1];
    const mid = map.rgb(t);
    for (let c = 0; c < 3; c++) {
      const av = parseInt(a.slice(1 + c * 2, 3 + c * 2), 16);
      const bv = parseInt(b.slice(1 + c * 2, 3 + c * 2), 16);
      assert.equal(mid[c], Math.round(av + (bv - av) * 0.5), `${map.name} channel ${c}`);
    }
  }
});

test('clamping and non-finite input', () => {
  for (const map of Object.values(colormaps)) {
    assert.equal(map(-1), map(0));
    assert.equal(map(2), map(1));
    assert.equal(map(NaN), map(0));
    assert.equal(map(Infinity), map(1));
    assert.equal(map(-Infinity), map(0));
  }
});

test('rgb / rgbf / css agree', () => {
  for (const map of Object.values(colormaps)) {
    for (const t of [0, 0.123, 0.5, 0.987, 1]) {
      const bytes = map.rgb(t);
      const floats = map.rgbf(t);
      for (let c = 0; c < 3; c++) {
        assert.ok(bytes[c] >= 0 && bytes[c] <= 255 && Number.isInteger(bytes[c]));
        assert.ok(floats[c] >= 0 && floats[c] <= 1);
        assert.ok(Math.abs(floats[c] * 255 - bytes[c]) <= 0.5, `${map.name} channel ${c} at t=${t}`);
      }
      assert.equal(map.css(t), `rgb(${bytes[0]}, ${bytes[1]}, ${bytes[2]})`);
      const hex = '#' + bytes.map(v => v.toString(16).padStart(2, '0')).join('');
      assert.equal(map(t), hex);
    }
  }
});

test('rgb / rgbf write into a provided target', () => {
  for (const map of Object.values(colormaps)) {
    const target = new Float64Array(3);
    assert.equal(map.rgb(0.5, target), target);
    assert.deepEqual(Array.from(target), map.rgb(0.5));
    assert.equal(map.rgbf(0.5, target), target);
    assert.deepEqual(Array.from(target), map.rgbf(0.5));
  }
});

test('palette', () => {
  for (const map of Object.values(colormaps)) {
    assert.deepEqual(map.palette(1), [map(0)]);
    assert.deepEqual(map.palette(2), [map(0), map(1)]);
    const p = map.palette(11);
    assert.equal(p.length, 11);
    assert.equal(p[0], map(0));
    assert.equal(p[5], map(0.5));
    assert.equal(p[10], map(1));
    // Sub-range and degenerate counts.
    assert.deepEqual(map.palette(3, 0.25, 0.75), [map(0.25), map(0.5), map(0.75)]);
    assert.deepEqual(map.palette(0), []);
    assert.deepEqual(map.palette(-2), []);
  }
});

test('colors tables are frozen and well-formed', () => {
  for (const map of Object.values(colormaps)) {
    assert.ok(Object.isFrozen(map.colors));
    for (const c of map.colors) {
      assert.match(c, /^#[0-9a-f]{6}$/);
    }
  }
});

const linear = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const luminance = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

test('luminance increases monotonically across each sequential ramp', () => {
  // The sequential maps are designed with monotonically increasing lightness;
  // check relative luminance over the anchors with a tiny tolerance for 8-bit
  // quantization. Turbo is a rainbow map and is intentionally excluded.
  for (const map of Object.values(colormaps)) {
    if (map === turbo) continue;
    let prev = -1;
    for (let i = 0; i < 256; i++) {
      const lum = luminance(map.colors[i]);
      assert.ok(lum > prev - 1e-3, `${map.name}: luminance dipped at anchor ${i}`);
      prev = Math.max(prev, lum);
    }
  }
});

test('every ramp is smooth', () => {
  // No channel jumps more than 8/255 between adjacent anchors (the canonical
  // data's worst case is 8, in turbo).
  for (const map of Object.values(colormaps)) {
    for (let i = 1; i < 256; i++) {
      const a = map.rgb((i - 1) / 255);
      const b = map.rgb(i / 255);
      for (let c = 0; c < 3; c++) {
        assert.ok(Math.abs(b[c] - a[c]) <= 8, `${map.name}: channel ${c} jumps at anchor ${i}`);
      }
    }
  }
});
