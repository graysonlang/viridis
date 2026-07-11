// @graysonlang/viridis
//
// The viridis colormap as a tiny dependency-free ES module. Viridis is the
// perceptually uniform, colorblind-friendly sequential colormap designed for
// matplotlib by Stéfan van der Walt and Nathaniel Smith (data released CC0).
//
// The canonical map is defined by 256 sRGB anchors, embedded below as a packed
// hex string (256 × "rrggbb"). Sampling linearly interpolates between adjacent
// anchors, so viridis(i / 255) reproduces anchor i exactly and everything in
// between is smooth.

const DATA = [
  '44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447',
  '136548146748166848176948186a481a6c481b6d481c6e481d6f481f7048207148217348237',
  '4482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46',
  '337f463480453581453781453882443983443a83443b84433d84433e85423f8542408642418',
  '64142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c',
  '508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8',
  'd355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e30',
  '6a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758',
  'e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26',
  '828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8',
  'd218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f',
  '998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48',
  '621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2a',
  'b07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb7',
  '53dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954',
  'c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5',
  '870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468e',
  'd64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc3',
  '0b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0',
  'e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51',
  'cf1e51df4e61ef6e620f8e621fbe723fde725',
].join('');

// Decoded once into flat [r0, g0, b0, r1, g1, b1, ...] bytes.
const TABLE = new Uint8Array(768);
for (let i = 0; i < 768; i++) {
  TABLE[i] = parseInt(DATA.slice(i * 2, i * 2 + 2), 16);
}

// Clamp to [0, 1]; non-finite input (NaN, ±Infinity beyond range) maps to 0.
function clamp01(t) {
  t = +t;
  return t > 0 ? (t < 1 ? t : 1) : 0;
}

/**
 * Sample the colormap at t in [0, 1] (clamped) as a '#rrggbb' hex string.
 */
export function viridis(t) {
  const x = clamp01(t) * 255;
  const i = x | 0;
  const f = x - i;
  const a = i * 3;
  const b = (i < 255 ? i + 1 : 255) * 3;
  const r = Math.round(TABLE[a] + (TABLE[b] - TABLE[a]) * f);
  const g = Math.round(TABLE[a + 1] + (TABLE[b + 1] - TABLE[a + 1]) * f);
  const bl = Math.round(TABLE[a + 2] + (TABLE[b + 2] - TABLE[a + 2]) * f);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

/**
 * Sample as [r, g, b] integers in [0, 255]. Pass `out` (any array-like with
 * at least 3 slots) to avoid the allocation in hot loops.
 */
export function rgb(t, out) {
  const x = clamp01(t) * 255;
  const i = x | 0;
  const f = x - i;
  const a = i * 3;
  const b = (i < 255 ? i + 1 : 255) * 3;
  const o = out ?? [0, 0, 0];
  o[0] = Math.round(TABLE[a] + (TABLE[b] - TABLE[a]) * f);
  o[1] = Math.round(TABLE[a + 1] + (TABLE[b + 1] - TABLE[a + 1]) * f);
  o[2] = Math.round(TABLE[a + 2] + (TABLE[b + 2] - TABLE[a + 2]) * f);
  return o;
}

/**
 * Sample as [r, g, b] floats in [0, 1] — handy for WebGL and shaders.
 * Pass `out` to avoid the allocation.
 */
export function rgbf(t, out) {
  const x = clamp01(t) * 255;
  const i = x | 0;
  const f = x - i;
  const a = i * 3;
  const b = (i < 255 ? i + 1 : 255) * 3;
  const o = out ?? [0, 0, 0];
  o[0] = (TABLE[a] + (TABLE[b] - TABLE[a]) * f) / 255;
  o[1] = (TABLE[a + 1] + (TABLE[b + 1] - TABLE[a + 1]) * f) / 255;
  o[2] = (TABLE[a + 2] + (TABLE[b + 2] - TABLE[a + 2]) * f) / 255;
  return o;
}

/**
 * Sample as a CSS 'rgb(r, g, b)' string.
 */
export function css(t) {
  const [r, g, b] = rgb(t);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * n hex colors evenly spaced over [start, end] (inclusive at both ends).
 * palette(5) -> ['#440154', '#3b528b', '#21918d', '#5dc863', '#fde725'].
 */
export function palette(n, start = 0, end = 1) {
  n = Math.floor(n);
  if (!(n >= 1)) return [];
  if (n === 1) return [viridis(start)];
  const out = new Array(n);
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = viridis(start + step * i);
  return out;
}

/**
 * The 256 canonical anchor colors as '#rrggbb' strings (frozen).
 */
export const colors = Object.freeze(Array.from(
  { length: 256 },
  (_, i) => '#' + DATA.slice(i * 6, i * 6 + 6),
));

export default viridis;
