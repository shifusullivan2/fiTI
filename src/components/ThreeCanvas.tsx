import React, { useEffect, useRef } from 'react';
import { SceneManager } from '../three/sceneManager.ts';

interface ThreeCanvasProps {
  onSceneReady?: (manager: SceneManager) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ onSceneReady }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize SceneManager once on mount
    const manager = new SceneManager({
      container: mountRef.current,
    });
    sceneManagerRef.current = manager;

    if (onSceneReady) {
      onSceneReady(manager);
    }

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="threejs-canvas-container"
      className="fixed inset-0 w-full h-full overflow-hidden bg-[#0A0D14] select-none"
    />
  );
};
