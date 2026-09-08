export interface RectangleData {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

/**
 * Data model of a single rounded rectangle.
 *
 * The model is completely independent from React and the DOM: views subscribe
 * to its "change" events and re-render. All setters clamp values so the model
 * always describes a rectangle that can be drawn exactly as specified.
 */
export class Rectangle extends EventTarget {
  readonly id: number;

  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;

  constructor(data: RectangleData) {
    super();
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.radius = data.radius;
  }

  /** The largest corner radius that still produces a well-formed rounded rect. */
  get maxRadius(): number {
    return Math.min(this.width, this.height) / 2;
  }

  /** Sets the position. Returns the rectangle, so calls can be chained. */
  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this.emitChange();
  }

  /**
   * Sets the size (values below 0 are clamped to 0). An existing radius that
   * no longer fits the new size is clamped to the new maximum.
   */
  setSize(width: number, height: number): this {
    this.width = Math.max(0, width);
    this.height = Math.max(0, height);
    this.radius = this.clampRadius(this.radius);
    return this.emitChange();
  }

  /** Sets the corner radius of all four corners, clamped to [0, maxRadius]. */
  setCornerRadius(radius: number): this {
    this.radius = this.clampRadius(radius);
    return this.emitChange();
  }

  toJSON(): RectangleData {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      radius: this.radius,
    };
  }

  private clampRadius(radius: number): number {
    return Math.min(Math.max(radius, 0), this.maxRadius);
  }

  private emitChange(): this {
    this.dispatchEvent(new Event('change'));
    return this;
  }
}
