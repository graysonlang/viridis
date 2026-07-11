// Verification suite for @graysonlang/viridis.
//
// The colormap is pinned down three ways:
//   1. Known reference colors (the published viridis endpoints and midpoint).
//   2. Exact round-trip of all 256 canonical anchors through the sampler.
//   3. Structural properties viridis is designed to have — monotonically
//      increasing luminance across the whole ramp.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import viridisDefault, { viridis, rgb, rgbf, css, palette, colors } from '../src/viridis.js';

test('reference colors', () => {
  assert.equal(viridis(0), '#440154');
  assert.equal(viridis(1), '#fde725');
  assert.equal(viridis(128 / 255), '#21918c');
});

test('default export is viridis', () => {
  assert.equal(viridisDefault, viridis);
});

test('all 256 anchors round-trip exactly', () => {
  assert.equal(colors.length, 256);
  for (let i = 0; i < 256; i++) {
    assert.equal(viridis(i / 255), colors[i], `anchor ${i}`);
  }
});

test('interpolation between anchors', () => {
  // Halfway between anchors 0 and 1 must be the channel-wise midpoint.
  const t = 0.5 / 255;
  const a = colors[0];
  const b = colors[1];
  const mid = rgb(t);
  for (let c = 0; c < 3; c++) {
    const av = parseInt(a.slice(1 + c * 2, 3 + c * 2), 16);
    const bv = parseInt(b.slice(1 + c * 2, 3 + c * 2), 16);
    assert.equal(mid[c], Math.round(av + (bv - av) * 0.5));
  }
});

test('clamping and non-finite input', () => {
  assert.equal(viridis(-1), viridis(0));
  assert.equal(viridis(2), viridis(1));
  assert.equal(viridis(NaN), viridis(0));
  assert.equal(viridis(Infinity), viridis(1));
  assert.equal(viridis(-Infinity), viridis(0));
});

test('rgb / rgbf / css agree', () => {
  for (const t of [0, 0.123, 0.5, 0.987, 1]) {
    const bytes = rgb(t);
    const floats = rgbf(t);
    for (let c = 0; c < 3; c++) {
      assert.ok(bytes[c] >= 0 && bytes[c] <= 255 && Number.isInteger(bytes[c]));
      assert.ok(floats[c] >= 0 && floats[c] <= 1);
      assert.ok(Math.abs(floats[c] * 255 - bytes[c]) <= 0.5, `channel ${c} at t=${t}`);
    }
    assert.equal(css(t), `rgb(${bytes[0]}, ${bytes[1]}, ${bytes[2]})`);
    const hex = '#' + bytes.map(v => v.toString(16).padStart(2, '0')).join('');
    assert.equal(viridis(t), hex);
  }
});

test('rgb / rgbf write into a provided target', () => {
  const target = new Float64Array(3);
  assert.equal(rgb(0.5, target), target);
  assert.deepEqual(Array.from(target), rgb(0.5));
  assert.equal(rgbf(0.5, target), target);
  assert.deepEqual(Array.from(target), rgbf(0.5));
});

test('palette', () => {
  assert.deepEqual(palette(1), [viridis(0)]);
  assert.deepEqual(palette(2), [viridis(0), viridis(1)]);
  const p = palette(11);
  assert.equal(p.length, 11);
  assert.equal(p[0], viridis(0));
  assert.equal(p[5], viridis(0.5));
  assert.equal(p[10], viridis(1));
  // Sub-range and degenerate counts.
  assert.deepEqual(palette(3, 0.25, 0.75), [viridis(0.25), viridis(0.5), viridis(0.75)]);
  assert.deepEqual(palette(0), []);
  assert.deepEqual(palette(-2), []);
});

test('colors table is frozen and well-formed', () => {
  assert.ok(Object.isFrozen(colors));
  for (const c of colors) {
    assert.match(c, /^#[0-9a-f]{6}$/);
  }
});

test('luminance increases monotonically across the ramp', () => {
  // Viridis is designed with linearly increasing lightness; check relative
  // luminance over the anchors with a tiny tolerance for 8-bit quantization.
  const linear = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const luminance = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  let prev = -1;
  for (let i = 0; i < 256; i++) {
    const lum = luminance(colors[i]);
    assert.ok(lum > prev - 1e-3, `luminance dipped at anchor ${i}`);
    prev = Math.max(prev, lum);
  }
});
