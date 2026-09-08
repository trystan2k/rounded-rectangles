import { describe, expect, it, vi } from 'vitest';
import { Application } from './application';

const initialData = [
  { id: 0, x: 100, y: 100, width: 200, height: 150, radius: 10 },
  { id: 1, x: 400, y: 150, width: 300, height: 100, radius: 50 },
];

describe('Application', () => {
  it('returns rectangles by id and null for unknown ids', () => {
    const app = new Application(initialData);
    expect(app.getRectById(1)?.toJSON()).toEqual(initialData[1]);
    expect(app.getRectById(99)).toBeNull();
  });

  it('notifies subscribers and bumps the version when a rectangle changes', () => {
    const app = new Application(initialData);
    const listener = vi.fn();
    app.subscribe(listener);
    const versionBefore = app.getVersion();

    app.getRectById(0)!.setPosition(5, 6);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(app.getVersion()).toBe(versionBefore + 1);
  });

  it('stops notifying after unsubscribe', () => {
    const app = new Application(initialData);
    const listener = vi.fn();
    const unsubscribe = app.subscribe(listener);
    unsubscribe();

    app.getRectById(0)!.setPosition(5, 6);

    expect(listener).not.toHaveBeenCalled();
  });

  it('bringToFront moves the rectangle to the end of the render order', () => {
    const app = new Application(initialData);
    app.bringToFront(0);
    expect(app.getRectangles().map((rect) => rect.id)).toEqual([1, 0]);
    expect(app.getRectById(0)?.toJSON()).toEqual(initialData[0]);
  });

  it('nextId returns 0 for an empty application', () => {
    expect(new Application([]).nextId()).toBe(0);
  });

  it('nextId returns the largest existing id + 1', () => {
    const app = new Application(initialData);
    expect(app.nextId()).toBe(2);
    app.addRectangle({ id: 42, x: 0, y: 0, width: 10, height: 10, radius: 0 });
    expect(app.nextId()).toBe(43);
  });

  it('addRectangle registers a new rectangle and notifies subscribers', () => {
    const app = new Application(initialData);
    const listener = vi.fn();
    app.subscribe(listener);

    const rect = app.addRectangle({ id: 5, x: 1, y: 2, width: 30, height: 20, radius: 4 });

    expect(app.getRectById(5)?.toJSON()).toEqual({
      id: 5,
      x: 1,
      y: 2,
      width: 30,
      height: 20,
      radius: 4,
    });
    expect(app.getRectangles()).toHaveLength(3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(rect.id).toBe(5);
  });
});
