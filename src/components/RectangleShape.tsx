import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DragMode } from '../types';
import type { Rectangle } from '../rectangle';
import type { RectangleColors } from '../palette';

const HANDLE_RADIUS = 5.5;
const HANDLE_HIT_RADIUS = 16;
// CSS custom property from index.css. Applied via inline style (not the stroke
// attribute) because SVG presentation attributes cannot hold var() references.
const DEFAULT_STROKE = 'var(--rectangle-stroke)';

interface RectangleShapeProps {
  // The rectangle to render.
  rectangle: Rectangle;
  // The colors to use for the rectangle.
  colors: RectangleColors;
  // Whether the rectangle is active, been dragged.
  active: boolean;
  // Called when the user starts dragging the rectangle, to the parent.
  // Returns true if the drag should continue, false otherwise.
  onDragStart: (
    rectangle: Rectangle,
    mode: DragMode,
    event: ReactPointerEvent<SVGElement>,
  ) => boolean;
}

/**
 * Renders one Rectangle as a group of SVG nodes. The component is purely
 * reactive: it never modifies the model, it only reads it (an ancestor
 * re-renders the whole stage whenever any model reports a change).
 */
export const RectangleShape = ({ rectangle, colors, active, onDragStart }: RectangleShapeProps) => {
  const { x, y, width, height, radius } = rectangle;
  const { fill, selectionStroke } = colors;
  const handleX = x + width - radius;
  const handleY = y + radius;

  return (
    <g
      className={active ? 'rectangle active' : 'rectangle'}
      aria-label={`Rectangle ${rectangle.id}`}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        style={{ fill, stroke: active ? selectionStroke : DEFAULT_STROKE }}
        onPointerDown={(event) => onDragStart(rectangle, 'move', event)}
      />
      {/* Invisible, generous touch target behind the visible handle (tablets). */}
      <circle
        className="radius-handle-hit"
        cx={handleX}
        cy={handleY}
        r={HANDLE_HIT_RADIUS}
        onPointerDown={(event) => onDragStart(rectangle, 'radius', event)}
      />
      <circle
        className="radius-handle"
        cx={handleX}
        cy={handleY}
        r={HANDLE_RADIUS}
        onPointerDown={(event) => onDragStart(rectangle, 'radius', event)}
      />
    </g>
  );
};
