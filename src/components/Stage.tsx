import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Application } from '../application';
import type { Rectangle } from '../rectangle';
import type { DragMode } from '../types';
import { colorsForId } from '../palette';
import { RectangleShape } from './RectangleShape';

interface DragState {
  pointerId: number;
  rectangle: Rectangle;
  mode: DragMode;
  startPointerX: number;
  startPointerY: number;
  startPositionX: number;
  startPositionY: number;
  startCornerX: number;
  startCornerY: number;
}

interface StageProps {
  application: Application;
}

/**
 * The SVG stage: renders all rectangles and owns the pointer interactions
 * (drag body = move, drag corner handle = corner radius). Pointer capture on
 * the stage keeps the gesture running even when the pointer leaves the element
 * or the window. The SVG has no viewBox and fills the viewport, so 1 SVG unit
 * maps to 1 CSS pixel and no coordinate transform is needed.
 */
export const Stage = ({ application }: StageProps) => {
  const stageRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const rectangles = application.getRectangles();

  const handleDragStart = (
    rectangle: Rectangle,
    mode: DragMode,
    event: ReactPointerEvent<SVGElement>,
  ) => {
    const stage = stageRef.current;
    if (!stage || dragRef.current) return;
    event.preventDefault();

    stage.setPointerCapture(event.pointerId);
    application.bringToFront(rectangle.id);

    const bounds = stage.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      rectangle,
      mode,
      startPointerX: event.clientX - bounds.left,
      startPointerY: event.clientY - bounds.top,
      startPositionX: rectangle.x,
      startPositionY: rectangle.y,
      startCornerX: rectangle.x + rectangle.width,
      startCornerY: rectangle.y,
    };
    setActiveId(rectangle.id);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage || event.pointerId !== drag.pointerId) return;

    const bounds = stage.getBoundingClientRect();
    const pointX = event.clientX - bounds.left;
    const pointY = event.clientY - bounds.top;

    if (drag.mode === 'move') {
      drag.rectangle.setPosition(
        drag.startPositionX + (pointX - drag.startPointerX),
        drag.startPositionY + (pointY - drag.startPointerY),
      );
      return;
    }

    // The handle sits on the corner diagonal, at distance radius * sqrt(2)
    // from the corner, so the radius follows directly from the pointer
    // distance and the handle always stays under the pointer.
    const distance = Math.hypot(drag.startCornerX - pointX, drag.startCornerY - pointY);
    drag.rectangle.setCornerRadius(distance / Math.SQRT2);
  };

  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setActiveId(null);
  };

  return (
    <svg
      ref={stageRef}
      id="stage"
      role="application"
      aria-label="Rounded rectangle editor"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {rectangles.map((rectangle) => (
        <RectangleShape
          key={rectangle.id}
          rectangle={rectangle}
          colors={colorsForId(rectangle.id)}
          active={rectangle.id === activeId}
          onDragStart={handleDragStart}
        />
      ))}
    </svg>
  );
};
