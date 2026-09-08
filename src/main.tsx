import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Application } from './application';
import { sampleRectanglesData } from './data';
import './types';
import './index.css';

const initialData = window.rectanglesData ?? sampleRectanglesData;
const application = new Application(initialData);

// Public API used by the automatic tests (application.getRectById(...)).
window.application = application;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App application={application} />
  </StrictMode>,
);
