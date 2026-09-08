import { useSyncExternalStore } from 'react';
import type { Application } from './application';
import { Stage } from './components/Stage';
import { Toolbar } from './components/Toolbar';
import { createSpawnData } from './spawn';

interface AppProps {
  application: Application;
}

export const App = ({ application }: AppProps) => {
  // Re-render the stage whenever any rectangle model reports a change.
  useSyncExternalStore(application.subscribe, application.getVersion);

  const handleAdd = () => {
    application.addRectangle(
      createSpawnData(application.nextId(), window.innerWidth, window.innerHeight),
    );
  };

  return (
    <>
      <Stage application={application} />
      <Toolbar onAdd={handleAdd} />
      <p className="hint">
        Drag a rectangle to move it · drag its corner handle to change the corner radius
      </p>
    </>
  );
};
