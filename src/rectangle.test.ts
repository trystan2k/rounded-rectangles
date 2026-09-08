import { describe, expect, it } from 'vitest';
import { Rectangle } from './rectangle';

describe('Rectangle', () => {
  it('supports the scenario from the task description', () => {
    const rect = new Rectangle({ id: 1, x: 400, y: 150, width: 300, height: 100, radius: 50 });
    rect.setSize(100, 100);
    rect.setPosition(10, 10);
    rect.setCornerRadius(5);
    expect(rect.toJSON()).toEqual({
      id: 1,
      width: 100,
      height: 100,
      x: 10,
      y: 10,
      radius: 5,
    });
  });

  it('clamps the corner radius to [0, min(width, height) / 2]', () => {
    const rect = new Rectangle({ id: 2, x: 0, y: 0, width: 250, height: 150, radius: 20 });
    rect.setCornerRadius(500);
    expect(rect.radius).toBe(75);
    rect.setCornerRadius(-5);
    expect(rect.radius).toBe(0);
  });

  it('re-clamps an existing radius when the size shrinks', () => {
    const rect = new Rectangle({ id: 3, x: 0, y: 0, width: 300, height: 100, radius: 50 });
    rect.setSize(50, 60);
    expect(rect.radius).toBe(25);
  });

  it('clamps negative sizes to 0', () => {
    const rect = new Rectangle({ id: 4, x: 0, y: 0, width: 100, height: 100, radius: 0 });
    rect.setSize(-10, 30);
    expect(rect.width).toBe(0);
    expect(rect.height).toBe(30);
  });

  it('dispatches a change event for every mutation', () => {
    const rect = new Rectangle({ id: 5, x: 0, y: 0, width: 100, height: 100, radius: 0 });
    let changes = 0;
    rect.addEventListener('change', () => {
      changes += 1;
    });
    rect.setPosition(1, 2);
    rect.setCornerRadius(10);
    expect(changes).toBe(2);
  });
});
