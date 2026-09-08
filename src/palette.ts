export interface RectangleColors {
  fill: string;
  /** Bright companion color, used for the border while the rectangle is selected. */
  selectionStroke: string;
}

/** Number of --palette-N-* color pairs defined in src/index.css. */
const PALETTE_SIZE = 6;

/**
 * Keyed by rectangle id (wrapping around the palette) so every rectangle keeps
 * a stable color, independent of its position in the render (z) order. The
 * values are references to the --palette-N-* CSS custom properties in
 * index.css, so the palette can be re-themed from CSS alone. SVG presentation
 * attributes cannot hold var(), so the view applies these via inline styles.
 */
export const colorsForId = (id: number): RectangleColors => {
  const index = ((id % PALETTE_SIZE) + PALETTE_SIZE) % PALETTE_SIZE;
  return {
    fill: `var(--palette-${index}-fill)`,
    selectionStroke: `var(--palette-${index}-selection)`,
  };
};
