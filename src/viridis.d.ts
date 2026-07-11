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

/**
 * Sample the viridis colormap at t in [0, 1] (clamped; non-finite maps to 0)
 * as a '#rrggbb' hex string.
 */
export function viridis(t: number): string;

/**
 * Sample as [r, g, b] integers in [0, 255]. Pass `out` (length >= 3) to write
 * in place and avoid the allocation in hot loops.
 */
export function rgb(t: number): [number, number, number];
export function rgb<T extends IntTarget>(t: number, out: T): T;

/**
 * Sample as [r, g, b] floats in [0, 1] — handy for WebGL and shaders. Pass
 * `out` (length >= 3) to write in place and avoid the allocation.
 */
export function rgbf(t: number): [number, number, number];
export function rgbf<T extends FloatTarget>(t: number, out: T): T;

/**
 * Sample as a CSS 'rgb(r, g, b)' string.
 */
export function css(t: number): string;

/**
 * n hex colors evenly spaced over [start, end] (inclusive at both ends).
 */
export function palette(n: number, start?: number, end?: number): string[];

/**
 * The 256 canonical anchor colors as '#rrggbb' strings (frozen).
 */
export const colors: readonly string[];

export default viridis;
