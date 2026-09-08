import { describe, expect, it } from 'vitest';
import { colorsForId } from './palette';

describe('colorsForId', () => {
  it('returns a stable, valid color for any id', () => {
    expect(colorsForId(0).fill).toBe('#8e24aa');
    expect(colorsForId(6)).toEqual(colorsForId(0));
    expect(colorsForId(-1)).toEqual(colorsForId(5));
    expect(colorsForId(1234).selectionStroke).toMatch(/^#/);
  });
});
