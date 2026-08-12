import React from 'react';
import { BookOpen, ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">
              University of Toronto — EMHI1001H Academic Capstone Prototype
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>BCCDC Tetanus Framework</span>
            <span>•</span>
            <span>SNOOP Headache Framework</span>
            <span>•</span>
            <span>qSOFA / McIsaac Framework</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] leading-relaxed text-slate-400">
          <div>
            <h4 className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Governed Clinical Architecture
            </h4>
            <p>
              ED Compass enforces a strict physical boundary between LLM/AI conversational agents and a version-controlled, deterministic clinical rule engine. AI agents collect facts and explain outputs but NEVER independently determine clinical disposition or modify rules.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" /> Non-Production Academic Disclaimer
            </h4>
            <p>
              This is a conceptual academic prototype built strictly for demonstration purposes. It does not provide medical diagnosis, assign official CTAS emergency triage scores, or transmit data to 9-1-1, HealthLink BC 8-1-1, HEiDi, Emergency Care BC, or any provincial health authority.
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
          © 2026 ED COMPASS Academic Project • University of Toronto Master of Health Informatics (EMHI) Program
        </div>
      </div>
    </footer>
  );
};
