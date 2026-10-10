// Sleeping or a long evening lets the clock run on instead of jumping, so sunset, blue hour, night, predawn and
// dawn play out as one continuous sky. The pace is four game hours per real second, slowed wherever the sky
// (key light direction, colours or night factor) would change by more than the per-frame limits in sky.js.
import { skyChange } from '../render/sky.js';
export const WARP_SPEED = 4, MIN_STEP = 0.002;
/** Hours to advance this frame (always > 0, never past `left` hours remaining). */
export function warpStep(hour, left, dt) {
  let step = dt * WARP_SPEED;
  for (let k = 0; k < 4; k++) { const m = skyChange(hour, hour + Math.min(step, left)); if (m <= 1) break; step /= Math.max(1.05, m); }
  return Math.min(left, Math.max(step, MIN_STEP));
}
