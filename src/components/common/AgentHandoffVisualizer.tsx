import React from 'react';
import { ShieldCheck, Cpu, Navigation, MessageSquareHeart, ArrowRight } from 'lucide-react';

interface VisualizerProps {
  currentStage: 'intake' | 'engine' | 'navigation' | 'feedback';
  scenarioName?: string;
  ruleId?: string;
  ruleVersion?: string;
}

export const AgentHandoffVisualizer: React.FC<VisualizerProps> = ({
  currentStage,
  scenarioName,
  ruleId,
  ruleVersion
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-sm mb-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Governed Agentic Flow Architecture
          </span>
        </div>
        {ruleId && (
          <div className="text-[11px] font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
            Engine Rule: {ruleId} (v{ruleVersion || '1.0'})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        {/* Stage 1: Agent 1 */}
        <div
          className={`p-2.5 rounded-lg border transition-all ${
            currentStage === 'intake'
              ? 'bg-sky-950/80 border-sky-500 shadow-md shadow-sky-950'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Agent 1</span>
          </div>
          <p className="font-medium text-slate-200">Safety & Intake</p>
          <p className="text-[10px] text-slate-400 mt-1">Collects & validates structured patient facts</p>
        </div>

        {/* Stage 2: Clinical Rule Engine */}
        <div
          className={`p-2.5 rounded-lg border transition-all ${
            currentStage === 'engine'
              ? 'bg-emerald-950/80 border-emerald-500 shadow-md shadow-emerald-950'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Rule Engine</span>
          </div>
          <p className="font-medium text-slate-200">Deterministic DST</p>
          <p className="text-[10px] text-slate-400 mt-1">Assigns urgency & rule ID (AI cannot override)</p>
        </div>

        {/* Stage 3: Agent 2 */}
        <div
          className={`p-2.5 rounded-lg border transition-all ${
            currentStage === 'navigation'
              ? 'bg-amber-950/80 border-amber-500 shadow-md shadow-amber-950'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <Navigation className="w-4 h-4 shrink-0" />
            <span>Agent 2</span>
          </div>
          <p className="font-medium text-slate-200">Care Navigation</p>
          <p className="text-[10px] text-slate-400 mt-1">Explains rationale & local care options</p>
        </div>

        {/* Stage 4: Agent 3 */}
        <div
          className={`p-2.5 rounded-lg border transition-all ${
            currentStage === 'feedback'
              ? 'bg-purple-950/80 border-purple-500 shadow-md shadow-purple-950'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
            <MessageSquareHeart className="w-4 h-4 shrink-0" />
            <span>Agent 3</span>
          </div>
          <p className="font-medium text-slate-200">Feedback & Quality</p>
          <p className="text-[10px] text-slate-400 mt-1">Feeds human-governed QI dashboard</p>
        </div>
      </div>
    </div>
  );
};
