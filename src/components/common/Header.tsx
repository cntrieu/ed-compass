import React from 'react';
import { Compass, ShieldCheck, PlayCircle, BarChart3, History, Stethoscope } from 'lucide-react';

interface HeaderProps {
  activeTab: 'patient' | 'demo' | 'staff' | 'audit';
  setActiveTab: (tab: 'patient' | 'demo' | 'staff' | 'audit') => void;
  resetPatientFlow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, resetPatientFlow }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              setActiveTab('patient');
              if (resetPatientFlow) resetPatientFlow();
            }}
          >
            <div className="bg-sky-600 p-2 rounded-xl text-white shadow-inner">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">ED COMPASS</span>
                <span className="bg-sky-950 text-sky-400 border border-sky-800/80 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                  Governed Front Door
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                BC-Inspired Emergency Care Navigation (UofT EMHI1001H)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveTab('patient');
                if (resetPatientFlow) resetPatientFlow();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'patient'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Patient Intake</span>
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'demo'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>Demo Cases</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'staff'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Staff Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'audit'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Audit Trail</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
