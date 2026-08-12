import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-4 py-2 text-xs md:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-slate-900" />
          <span>
            <strong>ACADEMIC PROTOTYPE ONLY (UofT EMHI1001H)</strong> — Not for clinical use. Does NOT diagnose or replace 9-1-1 / 8-1-1 / ED care.
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-600/30 px-2 py-0.5 rounded border border-amber-700/40 text-[11px] font-semibold tracking-wide uppercase">
          <AlertTriangle className="w-3 h-3 text-slate-900" />
          <span>Conceptual handoff only—no information has been transmitted</span>
        </div>
      </div>
    </div>
  );
};
