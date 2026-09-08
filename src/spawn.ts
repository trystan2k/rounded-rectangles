import type { RectangleData } from './rectangle';

// Max and min width and height of the generated rectangles.
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
 * Function to generate a new rectangle to be added to the application.
 *
 * It generates a rectangle with:
 * - Id: a unique number.
 * - Position: near the center of the stage, offset in a cascade (based on the id).
 * - Size: within the spawn limits, with a corner radius that always fits the spawn limits,
 */
export const createSpawnData = (
  id: number,
  stageWidth: number,
  stageHeight: number,
  random: () => number = Math.random,
): RectangleData => {
  // Generate random width and height within the spawn limits.
  const width = Math.round(randomBetween(SPAWN_LIMITS.minWidth, SPAWN_LIMITS.maxWidth, random));
  const height = Math.round(randomBetween(SPAWN_LIMITS.minHeight, SPAWN_LIMITS.maxHeight, random));

  // Get the min radius between the random radius and the size-based cap.
  const radius = Math.min(
    Math.round(MIN_RADIUS + random() * (MAX_RADIUS - MIN_RADIUS)),
    Math.floor(Math.min(width, height) / 2),
  );

  // Calculate the offset of the next rectangle in the cascade, so they are not overlapping completely.
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
