// Importing index.html (and re-exporting it) makes esbuild emit the page next to
// the bundle and keeps the import from being tree-shaken away.
import index from './index.html';
export function getFilePaths() {
  return { index };
}

// A real consumer would `import ... from '@graysonlang/viridis'`; the demo
// imports the local source directly so it always tracks src/.
import { viridis, rgb } from '../src/viridis.js';
import { Delaunay } from 'd3-delaunay';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Theme — the canvas tiles paint with colors read live off the page's CSS
// custom properties, so they follow the light/dark toggle. `tile` is the gap
// color drawn between shapes (it matches the tile background); `ink`/`muted`
// are text and axes. inkA() gives a translucent ink for cursors and hairlines.
// ---------------------------------------------------------------------------

const theme = { tile: '#fffefb', ink: '#1b1a20', muted: '#78746a', inkRGB: [27, 26, 32] };

function parseHex(hex) {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const get = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  theme.tile = get('--tile', '#fffefb');
  theme.ink = get('--ink', '#1b1a20');
  theme.muted = get('--muted', '#78746a');
  theme.inkRGB = parseHex(theme.ink);
}

function inkA(alpha) {
  const [r, g, b] = theme.inkRGB;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Two-state toggle: an explicit choice is stored and wins over the OS setting;
// with nothing stored we follow prefers-color-scheme (and live OS changes).
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return darkQuery.matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('viridis-theme', mode);
  } catch { /* private mode, etc. */ }
  readTheme();
}

function setupTheme() {
  readTheme();
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    applyTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
  });
  darkQuery.addEventListener('change', () => {
    let stored = null;
    try {
      stored = localStorage.getItem('viridis-theme');
    } catch { /* ignore */ }
    if (stored !== 'light' && stored !== 'dark') readTheme();
  });
}

// ---------------------------------------------------------------------------
// Small utilities — a seeded RNG (mulberry32) and smooth 1D value noise, so
// every tile is deterministic per seed and reseedable on click.
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let reseedCounter = 1;
function freshSeed() {
  return (Math.random() * 0xffffffff) ^ (reseedCounter++ * 0x9e3779b9);
}

// Smooth 1D value noise in [0, 1] with two octaves.
function makeNoise(rng) {
  const vals = Float64Array.from({ length: 256 }, () => rng());
  const base = (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = vals[i & 255];
    const b = vals[(i + 1) & 255];
    return a + (b - a) * u;
  };
  return x => 0.65 * base(x) + 0.35 * base(x * 2.7 + 91.7);
}

function clamp01(v) {
  return v < 0 ? 0 : (v > 1 ? 1 : v);
}

// ---------------------------------------------------------------------------
// Tile harness — each tile gets a DPR-aware canvas, pointer state, and a
// frame(time, dt) callback driven by one shared rAF loop. Offscreen tiles are
// paused via IntersectionObserver.
// ---------------------------------------------------------------------------

const tiles = [];

const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const t = tiles.find(t => t.fig === entry.target);
    if (t) t.visible = entry.isIntersecting;
  }
});

function makeTile(id, setup) {
  const fig = document.getElementById(id);
  const canvas = fig.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const t = { fig, canvas, ctx, w: 0, h: 0, pointer: null, visible: true, api: null };

  new ResizeObserver(() => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    t.w = w;
    t.h = h;
    t.api?.resize?.();
  }).observe(canvas);

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    t.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  canvas.addEventListener('pointerleave', () => {
    t.pointer = null;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    t.api?.click?.(e.clientX - r.left, e.clientY - r.top);
  });

  io.observe(fig);
  t.api = setup(t);
  tiles.push(t);
}

// ---------------------------------------------------------------------------
// Header strip — the full ramp, painted per device pixel.
// ---------------------------------------------------------------------------

function setupStrip() {
  const strip = document.getElementById('strip');
  const ctx = strip.getContext('2d');
  const paint = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(strip.clientWidth * dpr);
    const h = Math.round(strip.clientHeight * dpr);
    if (!w || !h) return;
    strip.width = w;
    strip.height = h;
    for (let x = 0; x < w; x++) {
      ctx.fillStyle = viridis(x / (w - 1));
      ctx.fillRect(x, 0, 1, h);
    }
  };
  new ResizeObserver(paint).observe(strip);
}

// ---------------------------------------------------------------------------
// Tile: the colormap — ramp band, RGB channel curves, lightness curve, and a
// sampling cursor that follows the pointer (or sweeps on its own).
// ---------------------------------------------------------------------------

function setupRamp(t) {
  const { ctx } = t;
  let band = null; // cached offscreen ramp band

  const luminance = (c) => {
    const lin = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  };

  const resize = () => {
    if (!t.w) return;
    band = document.createElement('canvas');
    band.width = Math.max(2, Math.round(t.w));
    band.height = 1;
    const bctx = band.getContext('2d');
    for (let x = 0; x < band.width; x++) {
      bctx.fillStyle = viridis(x / (band.width - 1));
      bctx.fillRect(x, 0, 1, 1);
    }
  };

  const frame = (time) => {
    const { w, h } = t;
    ctx.clearRect(0, 0, w, h);
    if (!band) resize();

    const bandH = 26;
    const plotTop = bandH + 18;
    const plotBottom = h - 40;
    const plotH = plotBottom - plotTop;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(band, 0, 0, w, bandH);

    // Channel + lightness curves.
    const series = [
      { color: '#c05d55', pick: c => c[0] / 255 },
      { color: '#3f8f57', pick: c => c[1] / 255 },
      { color: '#5470bd', pick: c => c[2] / 255 },
      { color: theme.muted, pick: c => luminance(c), dash: [4, 4] },
    ];
    const sample = [0, 0, 0];
    for (const s of series) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const v = s.pick(rgb(x / w, sample));
        const y = plotBottom - v * plotH;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(s.dash ?? []);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sampling cursor — pointer position, or a slow ping-pong sweep.
    let tv;
    if (t.pointer) {
      tv = clamp01(t.pointer.x / w);
    } else {
      const cycle = (time * 0.09) % 2;
      tv = cycle < 1 ? cycle : 2 - cycle;
    }
    const cx = tv * w;
    const c = rgb(tv);
    ctx.strokeStyle = inkA(0.55);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, plotBottom);
    ctx.stroke();
    for (const s of series) {
      ctx.beginPath();
      ctx.arc(cx, plotBottom - s.pick(c) * plotH, 3, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }

    // Readout.
    const hex = viridis(tv);
    ctx.fillStyle = hex;
    ctx.strokeStyle = inkA(0.2);
    ctx.beginPath();
    ctx.roundRect(0, h - 24, 24, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.font = `12px ${MONO}`;
    ctx.fillStyle = theme.ink;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(
      `t = ${tv.toFixed(3)}   ${hex}   rgb(${c[0]}, ${c[1]}, ${c[2]})`,
      34, h - 11,
    );
  };

  return { frame, resize };
}

// ---------------------------------------------------------------------------
// Tile: Voronoi relaxation — seeded points Lloyd-relax toward their cell
// centroids while the pointer stirs them; cells are colored by area.
// ---------------------------------------------------------------------------

function setupVoronoi(t) {
  const { ctx } = t;
  const N = 130;
  let pts = null;
  let phases = null;

  const reseed = () => {
    const rng = mulberry32(freshSeed());
    pts = new Float64Array(N * 2);
    phases = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      pts[i * 2] = rng() * t.w;
      pts[i * 2 + 1] = rng() * t.h;
      phases[i] = rng() * Math.PI * 2;
    }
  };

  const frame = (time) => {
    const { w, h } = t;
    if (!pts) {
      if (!w) return;
      reseed();
    }

    // Pointer stir — push nearby points away.
    if (t.pointer) {
      const { x, y } = t.pointer;
      for (let i = 0; i < N; i++) {
        const dx = pts[i * 2] - x;
        const dy = pts[i * 2 + 1] - y;
        const d2 = dx * dx + dy * dy;
        const r = 90;
        if (d2 < r * r && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const f = (1 - d / r) * 6;
          pts[i * 2] += (dx / d) * f;
          pts[i * 2 + 1] += (dy / d) * f;
        }
      }
    }

    // Gentle ambient drift keeps the mosaic alive after convergence.
    for (let i = 0; i < N; i++) {
      pts[i * 2] += Math.sin(time * 0.7 + phases[i]) * 0.18;
      pts[i * 2 + 1] += Math.cos(time * 0.6 + phases[i] * 1.7) * 0.18;
      pts[i * 2] = Math.min(w - 2, Math.max(2, pts[i * 2]));
      pts[i * 2 + 1] = Math.min(h - 2, Math.max(2, pts[i * 2 + 1]));
    }

    const voronoi = new Delaunay(pts).voronoi([0.5, 0.5, w - 0.5, h - 0.5]);

    // Measure every cell first so color can normalize across the frame.
    const cells = [];
    let minA = Infinity;
    let maxA = -Infinity;
    for (let i = 0; i < N; i++) {
      const poly = voronoi.cellPolygon(i);
      if (!poly || poly.length < 4) continue;
      let area = 0;
      let cx = 0;
      let cy = 0;
      for (let j = 0; j < poly.length - 1; j++) {
        const [x0, y0] = poly[j];
        const [x1, y1] = poly[j + 1];
        const cross = x0 * y1 - x1 * y0;
        area += cross;
        cx += (x0 + x1) * cross;
        cy += (y0 + y1) * cross;
      }
      area /= 2;
      if (Math.abs(area) > 1e-9) {
        cx /= 6 * area;
        cy /= 6 * area;
      } else {
        [cx, cy] = poly[0];
      }
      area = Math.abs(area);
      minA = Math.min(minA, area);
      maxA = Math.max(maxA, area);
      cells.push({ i, poly, area, cx, cy });
    }

    ctx.clearRect(0, 0, w, h);
    const span = Math.max(1e-9, maxA - minA);
    for (const cell of cells) {
      ctx.beginPath();
      ctx.moveTo(cell.poly[0][0], cell.poly[0][1]);
      for (let j = 1; j < cell.poly.length; j++) ctx.lineTo(cell.poly[j][0], cell.poly[j][1]);
      ctx.closePath();
      ctx.fillStyle = viridis((cell.area - minA) / span);
      ctx.fill();
      ctx.strokeStyle = theme.tile;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Lloyd step — ease each point toward its cell centroid.
      pts[cell.i * 2] += (cell.cx - pts[cell.i * 2]) * 0.08;
      pts[cell.i * 2 + 1] += (cell.cy - pts[cell.i * 2 + 1]) * 0.08;
    }
  };

  return { frame, click: reseed };
}

// ---------------------------------------------------------------------------
// Tile: scalar field — a moving interference field rendered per pixel through
// a precomputed viridis lookup table; the pointer drops a ripple into it.
// ---------------------------------------------------------------------------

function setupField(t) {
  const { ctx } = t;
  const RES = 128;
  const off = document.createElement('canvas');
  off.width = RES;
  off.height = RES;
  const offCtx = off.getContext('2d');
  const img = offCtx.createImageData(RES, RES);
  const px = new Uint32Array(img.data.buffer);

  // 256-entry ABGR lookup so the inner loop is table math only.
  const lut = new Uint32Array(256);
  const c = [0, 0, 0];
  for (let i = 0; i < 256; i++) {
    rgb(i / 255, c);
    lut[i] = (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
  }

  let freq = null;
  const reseed = () => {
    const rng = mulberry32(freshSeed());
    freq = {
      a: 2.2 + rng() * 2.8,
      b: 2.0 + rng() * 2.6,
      d: 1.6 + rng() * 2.2,
      pa: rng() * 6.28,
      pb: rng() * 6.28,
    };
  };
  reseed();

  const frame = (time) => {
    const { w, h } = t;
    const { a, b, d, pa, pb } = freq;

    // Drifting interference center.
    const ox = 0.5 + 0.35 * Math.sin(time * 0.23 + pa);
    const oy = 0.5 + 0.35 * Math.cos(time * 0.17 + pb);
    const p = t.pointer ? { x: t.pointer.x / w, y: t.pointer.y / h } : null;

    for (let y = 0; y < RES; y++) {
      const v = y / RES;
      for (let x = 0; x < RES; x++) {
        const u = x / RES;
        const dx = u - ox;
        const dy = v - oy;
        let s = Math.sin(u * a * 6.28 + time * 0.7 + pa)
          + Math.sin(v * b * 6.28 - time * 0.53 + pb)
          + Math.sin((u + v) * d * 6.28 + time * 0.31)
          + Math.sin(Math.sqrt(dx * dx + dy * dy) * 22 - time * 1.3);
        if (p) {
          const rx = u - p.x;
          const ry = v - p.y;
          const dist = Math.sqrt(rx * rx + ry * ry);
          s += 2.4 * Math.sin(dist * 34 - time * 5) * Math.exp(-dist * 5);
        }
        const level = clamp01(s / 8 + 0.5) * 255;
        px[y * RES + x] = lut[level | 0];
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, w, h);
  };

  return { frame, click: reseed };
}

// ---------------------------------------------------------------------------
// Tile: ridgeline — stacked scrolling noise series (one color per row); the
// pointer pulls the nearby terrain upward.
// ---------------------------------------------------------------------------

function setupRidge(t) {
  const { ctx } = t;
  const ROWS = 15;
  const STEPS = 120;
  let rows = null;

  const reseed = () => {
    const rng = mulberry32(freshSeed());
    rows = Array.from({ length: ROWS }, () => makeNoise(rng));
  };
  reseed();

  const frame = (time) => {
    const { w, h } = t;
    ctx.clearRect(0, 0, w, h);

    const padTop = h * 0.16;
    const padBottom = h * 0.1;
    const gap = (h - padTop - padBottom) / (ROWS - 1);
    const amp = gap * 3.1;

    for (let i = 0; i < ROWS; i++) {
      const baseline = padTop + i * gap;
      const noise = rows[i];
      ctx.beginPath();
      ctx.moveTo(0, baseline);
      for (let s = 0; s <= STEPS; s++) {
        const fx = s / STEPS;
        // A soft plateau keeps the action mid-tile; the pointer adds a local lift.
        let shape = Math.exp(-(((fx - 0.5) / 0.34) ** 4));
        if (t.pointer) {
          const gx = (fx - t.pointer.x / w) / 0.14;
          const gy = (baseline - t.pointer.y) / (gap * 3.5);
          shape += 1.4 * Math.exp(-(gx * gx + gy * gy));
        }
        const v = noise(fx * 7 + time * 0.5 + i * 3.17);
        ctx.lineTo(fx * w, baseline - v * shape * amp);
      }
      ctx.lineTo(w, baseline);
      ctx.closePath();
      ctx.fillStyle = viridis(i / (ROWS - 1));
      ctx.strokeStyle = theme.tile;
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();
    }
  };

  return { frame, click: reseed };
}

// ---------------------------------------------------------------------------
// Tile: tree — a random tree laid out by a live force simulation (springs on
// links, repulsion between nodes), colored by depth.
// ---------------------------------------------------------------------------

function setupTree(t) {
  const { ctx } = t;
  let nodes = null;
  let maxDepth = 1;

  const regrow = () => {
    const rng = mulberry32(freshSeed());
    const cx = t.w / 2;
    const cy = t.h / 2;
    nodes = [{ x: cx, y: cy, vx: 0, vy: 0, depth: 0, parent: -1 }];
    const queue = [0];
    const MAX = 64;
    while (queue.length && nodes.length < MAX) {
      const pi = queue.shift();
      const depth = nodes[pi].depth + 1;
      const kids = depth === 1
        ? 3 + Math.floor(rng() * 3)
        : (rng() < 0.85 - depth * 0.09 ? 1 + Math.floor(rng() * 3) : 0);
      for (let k = 0; k < kids && nodes.length < MAX; k++) {
        const angle = rng() * Math.PI * 2;
        nodes.push({
          x: nodes[pi].x + Math.cos(angle) * 12,
          y: nodes[pi].y + Math.sin(angle) * 12,
          vx: 0,
          vy: 0,
          depth,
          parent: pi,
        });
        queue.push(nodes.length - 1);
      }
    }
    maxDepth = Math.max(1, ...nodes.map(n => n.depth));
  };

  const frame = () => {
    const { w, h } = t;
    if (!nodes) {
      if (!w) return;
      regrow();
    }
    const n = nodes.length;

    // Pairwise repulsion.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = Math.max(30, dx * dx + dy * dy);
        const f = 750 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Springs along links + centering + pointer repulsion.
    const rest = Math.min(w, h) / 11;
    for (let i = 1; i < n; i++) {
      const a = nodes[i];
      const b = nodes[a.parent];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(1e-3, Math.sqrt(dx * dx + dy * dy));
      const f = (d - rest) * 0.06;
      a.vx += (dx / d) * f;
      a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f;
      b.vy -= (dy / d) * f;
    }
    for (const node of nodes) {
      node.vx += (w / 2 - node.x) * 0.0035;
      node.vy += (h / 2 - node.y) * 0.0035;
      if (t.pointer) {
        const dx = node.x - t.pointer.x;
        const dy = node.y - t.pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 90 * 90 && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const f = (1 - d / 90) * 2.4;
          node.vx += (dx / d) * f;
          node.vy += (dy / d) * f;
        }
      }
      node.vx *= 0.82;
      node.vy *= 0.82;
      node.x = Math.min(w - 8, Math.max(8, node.x + node.vx));
      node.y = Math.min(h - 8, Math.max(8, node.y + node.vy));
    }

    ctx.clearRect(0, 0, w, h);
    for (let i = 1; i < n; i++) {
      const a = nodes[i];
      const b = nodes[a.parent];
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(a.x, a.y);
      ctx.strokeStyle = viridis(a.depth / maxDepth);
      ctx.lineWidth = Math.max(1, 3.5 - a.depth * 0.5);
      ctx.stroke();
    }
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(3, 8 - node.depth * 1.1), 0, Math.PI * 2);
      ctx.fillStyle = viridis(node.depth / maxDepth);
      ctx.fill();
      ctx.strokeStyle = theme.tile;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  return { frame, click: regrow };
}

// ---------------------------------------------------------------------------
// Tile: distribution — samples from a random gaussian mixture stream into
// bins colored by count, with the true density overlaid; auto-remixes when
// the histogram fills up.
// ---------------------------------------------------------------------------

function setupHist(t) {
  const { ctx } = t;
  const BINS = 56;
  const CAP = 14000;
  let rng = null;
  let mixture = null;
  let counts = null;
  let total = 0;
  let holdUntil = 0;

  const remix = () => {
    rng = mulberry32(freshSeed());
    const k = 1 + Math.floor(rng() * 3);
    let comps = Array.from({ length: k }, () => ({
      mu: 0.16 + rng() * 0.68,
      sigma: 0.025 + rng() * 0.06,
      w: 0.2 + rng(),
    }));
    const sum = comps.reduce((s, c) => s + c.w, 0);
    comps = comps.map(c => ({ ...c, w: c.w / sum }));
    mixture = comps;
    counts = new Uint32Array(BINS);
    total = 0;
    holdUntil = 0;
  };
  remix();

  const sampleOne = () => {
    let pick = rng();
    let comp = mixture[mixture.length - 1];
    for (const c of mixture) {
      if ((pick -= c.w) <= 0) {
        comp = c;
        break;
      }
    }
    const gauss = Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
    return comp.mu + comp.sigma * gauss;
  };

  const pdf = (x) => {
    let v = 0;
    for (const c of mixture) {
      const z = (x - c.mu) / c.sigma;
      v += (c.w / (c.sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    }
    return v;
  };

  const frame = (time) => {
    const { w, h } = t;

    if (total >= CAP) {
      if (!holdUntil) holdUntil = time + 2.5;
      if (time >= holdUntil) remix();
    } else {
      for (let i = 0; i < 120 && total < CAP; i++) {
        const x = sampleOne();
        if (x >= 0 && x < 1) {
          counts[(x * BINS) | 0]++;
          total++;
        }
      }
    }

    ctx.clearRect(0, 0, w, h);
    const padBottom = 26;
    const plotH = h - padBottom - 8;
    const maxCount = Math.max(1, ...counts);
    const bw = w / BINS;

    for (let i = 0; i < BINS; i++) {
      const v = counts[i] / maxCount;
      const bh = v * plotH;
      ctx.fillStyle = viridis(v);
      ctx.fillRect(i * bw + 0.5, h - padBottom - bh, bw - 1, bh);
    }

    // True density, scaled to the same normalization as the tallest bin.
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const expected = pdf(x / w) * (total / BINS) / Math.max(1, maxCount);
      const y = h - padBottom - Math.min(1.05, expected) * plotH;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = inkA(0.4);
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = inkA(0.25);
    ctx.beginPath();
    ctx.moveTo(0, h - padBottom + 0.5);
    ctx.lineTo(w, h - padBottom + 0.5);
    ctx.stroke();

    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    const label = `${mixture.length} component${mixture.length > 1 ? 's' : ''} · n = ${total.toLocaleString()}`;
    ctx.fillText(label, w - 2, h - 8);
    ctx.textAlign = 'left';
  };

  return { frame, click: remix };
}

// ---------------------------------------------------------------------------
// Boot.
// ---------------------------------------------------------------------------

setupTheme();
setupStrip();
makeTile('tile-ramp', setupRamp);
makeTile('tile-voronoi', setupVoronoi);
makeTile('tile-field', setupField);
makeTile('tile-ridge', setupRidge);
makeTile('tile-tree', setupTree);
makeTile('tile-hist', setupHist);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const time = now / 1000;
  for (const tile of tiles) {
    if (tile.visible && tile.w) tile.api.frame(time, dt);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
