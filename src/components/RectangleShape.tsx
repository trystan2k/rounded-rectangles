import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DragMode } from '../types';
import type { Rectangle } from '../rectangle';
import type { RectangleColors } from '../palette';

const HANDLE_RADIUS = 5.5;
const HANDLE_HIT_RADIUS = 16;
const DEFAULT_STROKE = 'rgba(0, 0, 0, 0.35)';

interface RectangleShapeProps {
  rectangle: Rectangle;
  colors: RectangleColors;
  active: boolean;
  onDragStart: (
    rectangle: Rectangle,
    mode: DragMode,
    event: ReactPointerEvent<SVGElement>,
  ) => void;
}

/**
 * Renders one Rectangle as a group of SVG nodes. The component is purely
 * reactive: it never modifies the model, it only reads it (an ancestor
 * re-renders the whole stage whenever any model reports a change).
 */
export const RectangleShape = ({
  rectangle,
  colors,
  active,
  onDragStart,
}: RectangleShapeProps) => {
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
        fill={fill}
        stroke={active ? selectionStroke : DEFAULT_STROKE}
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
