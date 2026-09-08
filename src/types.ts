import type { Application } from './application';
import type { RectangleData } from './rectangle';

export type DragMode = 'move' | 'radius';

declare global {
  interface Window {
    /** Optional list of rectangles used to initialise the application. */
    rectanglesData?: RectangleData[];
    /** Public API consumed by the automatic tests. */
    application?: Application;
  }
}
