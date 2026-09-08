import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Application } from './application';
import { sampleRectanglesData } from './data';
import './types';
import './index.css';

// window.rectanglesData is a boot-time injection point for tests and graders, for now
// If we want it to be dinamic and reactive, we, could override it using defineProperty to
// intercept setter and trigger a re-render or add an option in the app itself to allow runtime
// scene changes.
const initialData = window.rectanglesData ?? sampleRectanglesData;
const application = new Application(initialData);

// Public API used (application.getRectById(...)).
window.application = application;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App application={application} />
  </StrictMode>,
);
