export interface RectangleColors {
  fill: string;
  /** Bright companion color, used for the border while the rectangle is selected. */
  selectionStroke: string;
}

const RECTANGLE_COLORS: RectangleColors[] = [
  { fill: '#8e24aa', selectionStroke: '#e254ff' }, // purple
  { fill: '#1e88e5', selectionStroke: '#82b1ff' }, // blue
  { fill: '#43a047', selectionStroke: '#69f0ae' }, // green
  { fill: '#fb8c00', selectionStroke: '#ffd180' }, // orange
  { fill: '#00897b', selectionStroke: '#64ffda' }, // teal
  { fill: '#d81b60', selectionStroke: '#ff80ab' }, // pink
];

/**
 * Keyed by rectangle id (wrapping around the palette) so every rectangle keeps
 * a stable color, independent of its position in the render (z) order.
 */
export const colorsForId = (id: number): RectangleColors => {
  const count = RECTANGLE_COLORS.length;
  return RECTANGLE_COLORS[((id % count) + count) % count];
};
