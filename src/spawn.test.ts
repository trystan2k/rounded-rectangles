import { describe, expect, it } from 'vitest';
import { createSpawnData, SPAWN_LIMITS } from './spawn';

/** A deterministic random source returning the given values in order. */
const sequence = (...values: number[]) => {
  let calls = 0;
  return () => values[calls++ % values.length]!;
};

describe('createSpawnData', () => {
  it('rolls the maximum size and centers the rectangle', () => {
    expect(createSpawnData(0, 1280, 720, () => 1)).toEqual({
      id: 0,
      x: 480,
      y: 240,
      width: 320,
      height: 240,
      radius: 40,
    });
  });

  it('rolls the minimum size', () => {
    expect(createSpawnData(0, 1280, 720, () => 0)).toEqual({
      id: 0,
      x: 600,
      y: 330,
      width: 80,
      height: 60,
      radius: 8,
    });
  });

  it('clamps the radius so it always fits the rolled size', () => {
    // width/height roll their minimum (radius roll would exceed min/2 = 30).
    const data = createSpawnData(0, 1280, 720, sequence(0, 0, 1));
    expect(data.radius).toBe(30);
  });

  it('keeps every random size within the spawn limits', () => {
    for (let i = 0; i < 50; i += 1) {
      const { width, height, radius } = createSpawnData(i, 1280, 720);
      expect(width).toBeGreaterThanOrEqual(SPAWN_LIMITS.minWidth);
      expect(width).toBeLessThanOrEqual(SPAWN_LIMITS.maxWidth);
      expect(height).toBeGreaterThanOrEqual(SPAWN_LIMITS.minHeight);
      expect(height).toBeLessThanOrEqual(SPAWN_LIMITS.maxHeight);
      expect(radius).toBeGreaterThanOrEqual(0);
      expect(radius).toBeLessThanOrEqual(Math.min(width, height) / 2);
    }
  });

  it('cascades consecutive ids by a fixed step for identical sizes', () => {
    const first = createSpawnData(3, 1280, 720, () => 1);
    const second = createSpawnData(4, 1280, 720, () => 1);
    expect(second.x).toBe(first.x + 30);
    expect(second.y).toBe(first.y + 30);
  });

  it('wraps the cascade offset around after a full cycle', () => {
    const wrapped = createSpawnData(6, 1280, 720, () => 1);
    const first = createSpawnData(0, 1280, 720, () => 1);
    expect(wrapped.x).toBe(first.x);
    expect(wrapped.y).toBe(first.y);
  });

  it('never places a rectangle at a negative position on tiny stages', () => {
    const data = createSpawnData(0, 50, 40, () => 0);
    expect(data.x).toBeGreaterThanOrEqual(0);
    expect(data.y).toBeGreaterThanOrEqual(0);
  });
});
