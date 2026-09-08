import type { RectangleData } from './rectangle';
import { Rectangle } from './rectangle';

type StoreListener = () => void;

/**
 * Owns the rectangle collection, exposes the public API (getRectById) and acts
 * as a tiny external store for React (subscribe / getVersion, consumed via
 * useSyncExternalStore). Every model mutation notifies the subscribers, so
 * edits made through the API are reflected in the UI exactly like drags are.
 */
export class Application {
  private readonly rectangles = new Map<number, Rectangle>();
  private readonly listeners = new Set<StoreListener>();
  private version = 0;

  constructor(initialData: RectangleData[]) {
    initialData.forEach((data) => this.addRectangle(data));
  }

  getRectById(id: number): Rectangle | null {
    return this.rectangles.get(id) ?? null;
  }

  /** The next free rectangle id (largest existing id + 1). */
  nextId(): number {
    return this.rectangles.size === 0 ? 0 : Math.max(...this.rectangles.keys()) + 1;
  }

  /** Rectangles in render order (SVG paints in document order). */
  getRectangles(): Rectangle[] {
    return [...this.rectangles.values()];
  }

  addRectangle(data: RectangleData): Rectangle {
    const rect = new Rectangle(data);
    rect.addEventListener('change', this.handleRectangleChange);
    this.rectangles.set(rect.id, rect);
    this.notify();
    return rect;
  }

  /** Brings a rectangle to the front of the render order, so it is rendered
   * on top of all other rectangles and make the UX more intuitive, specially when dragging.
   * And since we use a map to render them, remove and add it again, will move it to the last
   * position of the map, which will be the last rendered and so on top of all other rectangles.
   */
  bringToFront(id: number): void {
    const rect = this.rectangles.get(id);
    if (!rect) return;
    this.rectangles.delete(id);
    this.rectangles.set(id, rect);
    this.notify();
  }

  // Create a subscribe function to allow React to subscribe to the store.
  subscribe = (listener: StoreListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private handleRectangleChange = (): void => {
    this.notify();
  };

  // Notify all subscribers that the model has changed.
  private notify(): void {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }
}
