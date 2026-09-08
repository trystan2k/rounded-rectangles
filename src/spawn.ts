import type { RectangleData } from './rectangle';

/** Size limits for newly added rectangles (the model/API itself has no limits). */
export const SPAWN_LIMITS = {
  minWidth: 80,
  maxWidth: 320,
  minHeight: 60,
  maxHeight: 240,
} as const;

const MIN_RADIUS = 8;
const MAX_RADIUS = 40;
const CASCADE_STEP = 30;
const CASCADE_SLOTS = 6;

const randomBetween = (min: number, max: number, random: () => number) =>
  min + random() * (max - min);

/**
 * Data for a freshly added rectangle: a random size within the spawn limits,
 * a corner radius that always fits the rolled size, placed near the center of
 * the stage and offset in a cascade (based on the id) so consecutive
 * rectangles never overlap exactly.
 */
export const createSpawnData = (
  id: number,
  stageWidth: number,
  stageHeight: number,
  random: () => number = Math.random,
): RectangleData => {
  const width = Math.round(randomBetween(SPAWN_LIMITS.minWidth, SPAWN_LIMITS.maxWidth, random));
  const height = Math.round(randomBetween(SPAWN_LIMITS.minHeight, SPAWN_LIMITS.maxHeight, random));
  // Floor the size-based cap: rounding the radius itself could push it above
  // min(width, height) / 2 when that is fractional (e.g. height 69 -> 34.5).
  const radius = Math.min(
    Math.round(MIN_RADIUS + random() * (MAX_RADIUS - MIN_RADIUS)),
    Math.floor(Math.min(width, height) / 2),
  );

  const offset = (((id % CASCADE_SLOTS) + CASCADE_SLOTS) % CASCADE_SLOTS) * CASCADE_STEP;
  return {
    id,
    x: Math.round(Math.max(0, (stageWidth - width) / 2)) + offset,
    y: Math.round(Math.max(0, (stageHeight - height) / 2)) + offset,
    width,
    height,
    radius,
  };
};
