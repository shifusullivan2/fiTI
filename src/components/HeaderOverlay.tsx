import React from 'react';
import { Sparkles, Compass, Eye, ShieldCheck } from 'lucide-react';
import { SubjectId } from '../three/sceneManager.ts';

interface HeaderOverlayProps {
  currentSubject: SubjectId;
  onOpenThinkingModal: () => void;
  isThinkingActive?: boolean;
}

export const HeaderOverlay: React.FC<HeaderOverlayProps> = ({
  currentSubject,
  onOpenThinkingModal,
}) => {
  const subjectMetadata: Record<SubjectId, { title: string; subtitle: string; spec: string }> = {
    chronos: {
      title: 'Chronos Celestial Tourbillon',
      subtitle: 'Multi-Axis Precision Escapement Movement',
      spec: '12-Part Composite Assembly · 3.5 Hz (25,200 vph) · Sapphire Crystal',
    },
    turbofan: {
      title: 'Quantum Turbofan Ion-Drive',
      subtitle: 'High-Bypass Transonic Aeropropulsion Stage',
      spec: '22 Titanium Aerofoils · Transonic Mach 0.92 Tip · Plasma Ring',
    },
    rover: {
      title: 'Kepler Mars Exploration Probe',
      subtitle: 'Articulated Rocker-Bogie Autonomous Rover',
      spec: '6-Wheel Independent Hub Drives · Gold MLI Shield · Mastcam 5-DOF',
    },
  };

  const meta = subjectMetadata[currentSubject];

  return (
    <header className="fixed top-4 left-6 right-6 pointer-events-none flex items-start justify-between z-20">
      {/* Top Left Title and Spec Badge */}
      <div className="pointer-events-auto bg-[#111622]/90 border border-slate-700/60 rounded-xl px-4 py-3 shadow-xl max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Compass className="w-3.5 h-3.5" />
          </span>
          <h1 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">
            {meta.title}
          </h1>
        </div>
        <p className="text-xs text-slate-400 font-medium">{meta.subtitle}</p>
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-mono text-slate-400">{meta.spec}</span>
        </div>
      </div>

      {/* Top Right Quick Actions: Gemini 4 Argon High Thinking & Controls Helper */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={onOpenThinkingModal}
          data-testid="open-thinking-button"
          className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg border border-blue-400/30 text-xs font-medium transition cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Gemini 4 Argon Thinking</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-900/80 text-blue-200 border border-blue-500/40 uppercase font-mono tracking-wider">
            HIGH
          </span>
        </button>
      </div>
    </header>
  );
};
