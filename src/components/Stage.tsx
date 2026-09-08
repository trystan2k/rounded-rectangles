import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Application } from '../application';
import type { Rectangle } from '../rectangle';
import type { DragMode } from '../types';
import { colorsForId } from '../palette';
import { RectangleShape } from './RectangleShape';

interface DragState {
  // The pointer ID of the current drag.
  pointerId: number;
  // The rectangle being dragged.
  rectangle: Rectangle;
  // The drag mode of the current drag, if user is dragging the rectangle itself or the radius handle.
  mode: DragMode;
  // The mouse pointer start postition in X axis, in stage container coordinates. Used to calculate how much
  // the pointer moved since drag started
  startPointerX: number;
  // The mouse pointer start postition in Y axis, in stage container coordinates. Used to calculate how much
  // the pointer moved since drag started
  startPointerY: number;
  // The start position in X axis of the rectangle. Used to calculate how much
  // the rectangle moved since drag started
  startPositionX: number;
  // The start position in Y axis of the rectangle. Used to calculate how much
  // the rectangle moved since drag started
  startPositionY: number;
  // The start position in X axis of the right corner of the rectangle. Base point of the radious dragger, to
  // calculate the new radius of the rectangle.
  startCornerX: number;
  // The start position in Y axis of the right corner of the rectangle. Base point of the radious dragger, to
  // calculate the new radius of the rectangle.
  startCornerY: number;
}

interface StageProps {
  application: Application;
}

/**
 * The Stage: renders all rectangles and owns the pointer interactions
 * (drag body = move, drag corner handle = corner radius). Pointer capture on
 * the stage keeps the gesture running even when the pointer leaves the element
 * or the window. The SVG has no viewBox and fills the viewport, so 1 SVG unit
 * maps to 1 CSS pixel and no coordinate transform is needed.
 */
export const Stage = ({ application }: StageProps) => {
  const stageRef = useRef<SVGSVGElement>(null);

  // This is where all drag information (startPosition, startPointer, startCorner) is stored.
  // It uses a useRef instead of useState to avoid re-renders while the rectangle is being dragged.
  // The values stored in here are then used to calculate the new position of the rectangle once drag ends.
  const dragRef = useRef<DragState | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const rectangles = application.getRectangles();

  // Called when user starts to drag the rectangle. Store the initial position of the rectangle.
  // Returns true if the drag was started, false when it was rejected
  // (another drag is already running, or the stage is not mounted yet).
  const handleDragStart = (
    rectangle: Rectangle,
    mode: DragMode,
    event: ReactPointerEvent<SVGElement>,
  ): boolean => {
    const stage = stageRef.current;
    if (!stage || dragRef.current) return false;
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
    return true;
  };

  // This is executed everytime the mouse pointer moves dragging the rectangle or the border radius handler.
  // It keeps updating the rectangle position and the radius handler position while the user moves the mouse pointer
  // .
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

    // Handle lies on the 45° corner diagonal at distance = r*SQRT2 from the corner.
    // Measure pointer distance via hypot(), then divide by SQRT2 to recover r so
    // the handle stays exactly under the cursor during the drag.
    const distance = Math.hypot(drag.startCornerX - pointX, drag.startCornerY - pointY);
    drag.rectangle.setCornerRadius(distance / Math.SQRT2);
  };

  // This is when user release drag. It resets the drag state and the activeId.
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
