import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Palette,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Box,
} from 'lucide-react';
import { SubjectId, CameraPreset } from '../three/sceneManager.ts';
import { FinishPreset } from '../three/materials.ts';

interface ControlDockProps {
  currentSubject: SubjectId;
  onSelectSubject: (id: SubjectId) => void;
  explosionFactor: number;
  onChangeExplosion: (val: number) => void;
  speedMultiplier: number;
  onChangeSpeed: (val: number) => void;
  currentFinish: FinishPreset;
  onSelectFinish: (finish: FinishPreset) => void;
  currentCameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  isWireframe: boolean;
  onToggleWireframe: () => void;
  onOpenThinking: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  currentSubject,
  onSelectSubject,
  explosionFactor,
  onChangeExplosion,
  speedMultiplier,
  onChangeSpeed,
  currentFinish,
  onSelectFinish,
  currentCameraPreset,
  onSelectCameraPreset,
  isWireframe,
  onToggleWireframe,
  onOpenThinking,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'kinematics' | 'finishes' | 'views'>('kinematics');

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const finishSwatches: { id: FinishPreset; label: string; color: string }[] = [
    { id: 'rose-gold', label: 'Rose Gold', color: '#E5A47C' },
    { id: 'titanium', label: 'Titanium Gr5', color: '#94A3B8' },
    { id: 'blued-steel', label: 'Blued Steel', color: '#1D4ED8' },
    { id: 'obsidian', label: 'Obsidian Carbon', color: '#27272A' },
    { id: 'cyber-emerald', label: 'Kinetic Emerald', color: '#10B981' },
  ];

  const cameraPresets: { id: CameraPreset; label: string }[] = [
    { id: 'hero', label: 'Isometric 45°' },
    { id: 'macro', label: 'Macro Escapement' },
    { id: 'ortho-top', label: 'Top Blueprint' },
    { id: 'low-rake', label: 'Low Cinematic' },
  ];

  return (
    <div
      data-testid="bottom-control-dock"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out flex flex-col items-center ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
      style={{ maxWidth: 'min(940px, 94vw)', width: '100%' }}
    >
      {/* Collapse / Expand Toggle Button pinned to top of dock */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Show Controls' : 'Hide Controls'}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-[#111622]/95 hover:bg-[#1a2133] border border-slate-700/80 rounded-full text-[11px] font-medium text-slate-300 shadow-md transition cursor-pointer select-none"
      >
        {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />}
        <span>{isCollapsed ? 'Show Controls (H)' : 'Hide Controls (H)'}</span>
      </button>

      {/* Main Glassmorphic Control Dock Panel */}
      <div className="w-full bg-[#111622]/95 border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 backdrop-blur-none text-slate-100 flex flex-col gap-3">
        {/* Top Row: Subject Switcher & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          {/* Subject Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectSubject('chronos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentSubject === 'chronos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Tourbillon
            </button>
            <button
              onClick={() => onSelectSubject('turbofan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentSubject === 'turbofan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Turbofan
            </button>
            <button
              onClick={() => onSelectSubject('rover')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                currentSubject === 'rover'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Kepler Rover
            </button>
          </div>

          {/* Dock Category Tabs */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('kinematics')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'kinematics'
                  ? 'bg-slate-800 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Exploded &amp; Speed</span>
            </button>
            <button
              onClick={() => setActiveTab('finishes')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'finishes'
                  ? 'bg-slate-800 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Finishes</span>
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTab === 'views'
                  ? 'bg-slate-800 text-blue-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cameras</span>
            </button>
          </div>

          {/* Quick Wireframe & AI Thinking button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleWireframe}
              title="Toggle Wireframe inspection"
              className={`px-2.5 py-1.5 rounded-lg text-xs border font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isWireframe
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Wireframe</span>
            </button>

            <button
              onClick={onOpenThinking}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>AI Thinking</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'kinematics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Exploded View Slider */}
            <div className="flex items-center gap-3 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-medium">Exploded Disassembly</span>
                  <span className="font-mono text-blue-400">{Math.round(explosionFactor * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explosionFactor}
                  onChange={(e) => onChangeExplosion(parseFloat(e.target.value))}
                  aria-label="Exploded disassembly slider"
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
              <button
                onClick={() => onChangeExplosion(explosionFactor > 0.5 ? 0 : 1)}
                className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition cursor-pointer"
              >
                {explosionFactor > 0.5 ? 'Reset' : 'Full'}
              </button>
            </div>

            {/* Kinematic Speed Multiplier */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">Kinematic Speed</span>
              <div className="flex items-center gap-1.5">
                {[0, 0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onChangeSpeed(spd)}
                    aria-label={spd === 0 ? 'Pause simulation' : `Speed ${spd}x`}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      speedMultiplier === spd
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd === 0 ? <Pause className="w-3 h-3" /> : `${spd}x`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finishes' && (
          <div className="flex flex-wrap items-center justify-center gap-2 py-1">
            {finishSwatches.map((swatch) => (
              <button
                key={swatch.id}
                onClick={() => onSelectFinish(swatch.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                  currentFinish === swatch.id
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200 shadow-sm'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner"
                  style={{ backgroundColor: swatch.color }}
                />
                <span className="font-medium">{swatch.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'views' && (
          <div className="flex flex-wrap items-center justify-center gap-2 py-1">
            {cameraPresets.map((cam) => (
              <button
                key={cam.id}
                onClick={() => onSelectCameraPreset(cam.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                  currentCameraPreset === cam.id
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200 shadow-sm font-semibold'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
