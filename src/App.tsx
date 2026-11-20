/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas.tsx';
import { HeaderOverlay } from './components/HeaderOverlay.tsx';
import { ControlDock } from './components/ControlDock.tsx';
import { DeepThinkingInspector } from './components/DeepThinkingInspector.tsx';
import { SceneManager, SubjectId, CameraPreset } from './three/sceneManager.ts';
import { FinishPreset } from './three/materials.ts';

export default function App() {
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [currentSubject, setCurrentSubject] = useState<SubjectId>('chronos');
  const [explosionFactor, setExplosionFactor] = useState(0.0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [currentFinish, setCurrentFinish] = useState<FinishPreset>('rose-gold');
  const [currentCameraPreset, setCurrentCameraPreset] = useState<CameraPreset>('hero');
  const [isWireframe, setIsWireframe] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [kinematicsData, setKinematicsData] = useState<any>({});

  // Capture SceneManager instance when WebGL canvas mounts
  const handleSceneReady = useCallback((manager: SceneManager) => {
    sceneManagerRef.current = manager;
    setKinematicsData(manager.getCurrentKinematicsData());
  }, []);

  // Sync state changes to Three.js SceneManager
  const handleSelectSubject = (id: SubjectId) => {
    setCurrentSubject(id);
    sceneManagerRef.current?.setSubject(id);
    if (sceneManagerRef.current) {
      setKinematicsData(sceneManagerRef.current.getCurrentKinematicsData());
    }
  };

  const handleChangeExplosion = (val: number) => {
    setExplosionFactor(val);
    sceneManagerRef.current?.setExplosionFactor(val);
  };

  const handleChangeSpeed = (val: number) => {
    setSpeedMultiplier(val);
    sceneManagerRef.current?.setSpeedMultiplier(val);
  };

  const handleSelectFinish = (finish: FinishPreset) => {
    setCurrentFinish(finish);
    sceneManagerRef.current?.setFinish(finish);
  };

  const handleSelectCameraPreset = (preset: CameraPreset) => {
    setCurrentCameraPreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  };

  const handleToggleWireframe = () => {
    const next = !isWireframe;
    setIsWireframe(next);
    sceneManagerRef.current?.setWireframe(next);
  };

  const handleOpenThinking = () => {
    if (sceneManagerRef.current) {
      setKinematicsData(sceneManagerRef.current.getCurrentKinematicsData());
    }
    setIsThinkingOpen(true);
  };

  const handleApplyPresetAction = (action: { explosion?: number; speed?: number; finish?: string }) => {
    if (action.explosion !== undefined) {
      handleChangeExplosion(action.explosion);
    }
    if (action.speed !== undefined) {
      handleChangeSpeed(action.speed);
    }
    if (action.finish) {
      handleSelectFinish(action.finish as FinishPreset);
    }
    setIsThinkingOpen(false);
  };

  // Support ?autostart=1 query parameter per ultra-mode testability guidelines
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subject') === 'turbofan') {
      handleSelectSubject('turbofan');
    } else if (params.get('subject') === 'rover') {
      handleSelectSubject('rover');
    }
  }, []);

  return (
    <main
      data-testid="app-root"
      data-subject={currentSubject}
      className="relative w-screen h-screen overflow-hidden bg-[#0A0D14] font-sans select-none"
    >
      {/* 1. Full-Bleed Three.js Canvas Container (Outside React re-renders) */}
      <ThreeCanvas onSceneReady={handleSceneReady} />

      {/* 2. Top Header Spec & Branding Overlay */}
      <HeaderOverlay
        currentSubject={currentSubject}
        onOpenThinkingModal={handleOpenThinking}
      />

      {/* 3. Consolidated Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <ControlDock
        currentSubject={currentSubject}
        onSelectSubject={handleSelectSubject}
        explosionFactor={explosionFactor}
        onChangeExplosion={handleChangeExplosion}
        speedMultiplier={speedMultiplier}
        onChangeSpeed={handleChangeSpeed}
        currentFinish={currentFinish}
        onSelectFinish={handleSelectFinish}
        currentCameraPreset={currentCameraPreset}
        onSelectCameraPreset={handleSelectCameraPreset}
        isWireframe={isWireframe}
        onToggleWireframe={handleToggleWireframe}
        onOpenThinking={handleOpenThinking}
      />

      {/* 4. Gemini 4 Argon High Thinking Engineering Inspector Modal */}
      <DeepThinkingInspector
        isOpen={isThinkingOpen}
        onClose={() => setIsThinkingOpen(false)}
        currentSubject={currentSubject}
        kinematicsData={kinematicsData}
        onApplyPresetAction={handleApplyPresetAction}
      />
    </main>
  );
}
