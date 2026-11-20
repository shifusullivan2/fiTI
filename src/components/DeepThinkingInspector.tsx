import React, { useState } from 'react';
import { Sparkles, X, Brain, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Cpu } from 'lucide-react';
import { SubjectId } from '../three/sceneManager.ts';

interface DeepThinkingInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: SubjectId;
  kinematicsData: any;
  onApplyPresetAction?: (action: { explosion?: number; speed?: number; finish?: string }) => void;
}

export const DeepThinkingInspector: React.FC<DeepThinkingInspectorProps> = ({
  isOpen,
  onClose,
  currentSubject,
  kinematicsData,
  onApplyPresetAction,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analysis: string;
    elapsedMs: number;
    model: string;
    thinkingLevel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const subjectPresets: Record<SubjectId, string[]> = {
    chronos: [
      'Analyze tourbillon escapement impulse efficiency, beat error tolerance, and friction on the ruby pallet stones.',
      'Derive epicyclic planetary gear ratios and carrier torque distribution with a stationary outer ring gear.',
      'Evaluate thermal expansion effects on the balance spring oscillation frequency (25,200 vph) across -20°C to +50°C.',
    ],
    turbofan: [
      'Calculate aerodynamic blade tip Mach number, transonic shockwave generation, and centrifugal root stresses at 1,200 RPM.',
      'Analyze thermodynamic Brayton cycle efficiency and bypass airflow thrust contribution for this stage.',
      'Model variable-geometry exhaust petal actuation kinematics and vectoring gimbal moments.',
    ],
    rover: [
      'Calculate rocker-bogie passive differential articulation limits over a 30cm Martian boulder obstacle.',
      'Evaluate Bekker-Wong terramechanics regolith shear stress and cleated wheel traction coefficients.',
      'Determine robotic sample arm 5-DOF inverse kinematics and payload drill vibration damping.',
    ],
  };

  const currentPresets = subjectPresets[currentSubject] || [];

  const handleRunThinking = async (queryText?: string) => {
    const textToSubmit = queryText || prompt;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/deep-reason', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
          subjectId: currentSubject,
          kinematicsData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete deep reasoning.');
      }

      setResult({
        analysis: data.analysis,
        elapsedMs: data.elapsedMs,
        model: data.model || 'gemini-4-argon',
        thinkingLevel: data.thinkingLevel || 'HIGH',
      });
    } catch (err: any) {
      console.error('Deep reasoning error:', err);
      setError(err.message || 'An unexpected error occurred during deep reasoning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="thinking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#0F141F] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#131A29]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <Brain className="w-5 h-5 text-cyan-200" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="thinking-modal-title" className="text-base font-semibold text-white tracking-wide">
                  Gemini 4 Argon Deep Thinking Studio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-900/70 text-blue-200 border border-blue-500/40 font-mono uppercase tracking-wider">
                  ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Advanced structural mechanics, kinematics calculations &amp; physics modeling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close reasoning studio"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Active 3D Context Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Active Subject:</span>
              <span className="font-semibold text-slate-200 uppercase">{currentSubject}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span>Exploded: {Math.round((kinematicsData?.explosionFactor || 0) * 100)}%</span>
              <span>Speed: {kinematicsData?.speedMultiplier || 1}x</span>
              <span>Software GL: {kinematicsData?.isSoftwareGl ? 'Active' : 'GPU'}</span>
            </div>
          </div>

          {/* Quick Preset Prompts */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Complex Engineering Inquiry Presets:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {currentPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(preset);
                    handleRunThinking(preset);
                  }}
                  disabled={loading}
                  className="text-left p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-300 transition flex items-start gap-2.5 group cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition" />
                  <span className="group-hover:text-white">{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Query Textarea */}
          <div className="space-y-2">
            <label htmlFor="custom-query" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Or Inquire Custom Kinematics &amp; Stress Question:
            </label>
            <textarea
              id="custom-query"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Calculate the maximum Von Mises stress at the gear teeth roots during balance wheel reversal..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none font-sans"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleRunThinking()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deep Thinking in Progress...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Run High Thinking Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 rounded-xl bg-blue-950/20 border border-blue-800/40 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <Brain className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <p className="text-xs font-medium text-blue-200">
                Gemini 4 Argon is conducting high-depth reasoning (ThinkingLevel.HIGH)...
              </p>
              <p className="text-[11px] text-slate-400 max-w-md">
                Synthesizing multi-variable kinematic equations, material elasticity limits, and mechanical tolerances.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 flex items-start gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold mb-1">Reasoning Service Alert</p>
                <p>{error}</p>
                <p className="mt-1 text-slate-400 text-[11px]">
                  Ensure GEMINI_API_KEY is configured in the AI Studio Settings &gt; Secrets panel.
                </p>
              </div>
            </div>
          )}

          {/* Thinking Output Result */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deep Engineering Reasoning Complete</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Model: {result.model}</span>
                  <span>Latency: {(result.elapsedMs / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Formatted Analysis Content */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
                {result.analysis}
              </div>

              {/* Quick AI Presets Action */}
              {onApplyPresetAction && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs">
                  <span className="text-slate-300">
                    Apply Recommended 3D State: Set exploded inspection at 40% &amp; slow-motion 0.5x
                  </span>
                  <button
                    onClick={() => onApplyPresetAction({ explosion: 0.4, speed: 0.5 })}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition cursor-pointer"
                  >
                    Apply to 3D Scene
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
