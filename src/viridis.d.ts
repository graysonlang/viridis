/**
 * Integer-valued target for the no-allocation overload of rgb() — the [0, 255]
 * bytes fit these without loss (ImageData's buffer is a Uint8ClampedArray).
 */
export type IntTarget = number[] | Uint8Array | Uint8ClampedArray;

/**
 * Float-valued target for the no-allocation overload of rgbf(). A byte buffer
 * would truncate the [0, 1] floats to 0, so it is intentionally excluded.
 */
export type FloatTarget = number[] | Float32Array | Float64Array;

/** The name of a colormap shipped with this library. */
export type ColormapName =
  | 'viridis'
  | 'magma'
  | 'plasma'
  | 'inferno'
  | 'cividis'
  | 'turbo'
  | 'mako'
  | 'rocket';

/**
 * A colormap: a callable sampler carrying the full API as properties.
 * Calling it samples at t in [0, 1] (clamped; non-finite maps to 0) and
 * returns a '#rrggbb' hex string.
 */
export interface Colormap {
  (t: number): string;

  /** The colormap's name, e.g. 'magma'. */
  readonly name: ColormapName;

  /**
   * Sample as [r, g, b] integers in [0, 255]. Pass `out` (length >= 3) to
   * write in place and avoid the allocation in hot loops.
   */
  rgb(t: number): [number, number, number];
  rgb<T extends IntTarget>(t: number, out: T): T;

  /**
   * Sample as [r, g, b] floats in [0, 1] — handy for WebGL and shaders. Pass
   * `out` (length >= 3) to write in place and avoid the allocation.
   */
  rgbf(t: number): [number, number, number];
  rgbf<T extends FloatTarget>(t: number, out: T): T;

  /**
   * Sample as a CSS 'rgb(r, g, b)' string.
   */
  css(t: number): string;

  /**
   * n hex colors evenly spaced over [start, end] (inclusive at both ends).
   */
  palette(n: number, start?: number, end?: number): string[];

  /**
   * The 256 canonical anchor colors as '#rrggbb' strings (frozen).
   */
  readonly colors: readonly string[];
}

export const viridis: Colormap;
export const magma: Colormap;
export const plasma: Colormap;
export const inferno: Colormap;
export const cividis: Colormap;
export const turbo: Colormap;
export const mako: Colormap;
export const rocket: Colormap;

/**
 * All colormaps by name (frozen), for selecting one at runtime:
 * colormaps[userChoice](t).
 */
export const colormaps: Readonly<Record<ColormapName, Colormap>>;

/**
 * Viridis-bound conveniences, kept for backward compatibility — identical to
 * viridis.rgb, viridis.rgbf, viridis.css, viridis.palette, viridis.colors.
 */
export const rgb: Colormap['rgb'];
export const rgbf: Colormap['rgbf'];
export const css: Colormap['css'];
export const palette: Colormap['palette'];
export const colors: readonly string[];

export default viridis;
