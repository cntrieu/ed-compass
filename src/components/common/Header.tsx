import React from 'react';
import { Compass, PlayCircle, BarChart3, History, Stethoscope, User, ShieldAlert } from 'lucide-react';
import { useViewMode } from '../../context/ViewModeContext';

interface HeaderProps {
  activeTab: 'patient' | 'demo' | 'staff' | 'audit';
  setActiveTab: (tab: 'patient' | 'demo' | 'staff' | 'audit') => void;
  resetPatientFlow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, resetPatientFlow }) => {
  const { viewMode, setViewMode } = useViewMode();

  const handleSwitchMode = (mode: 'patient' | 'staff') => {
    setViewMode(mode);
    if (mode === 'patient') {
      setActiveTab('patient');
      if (resetPatientFlow) resetPatientFlow();
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 sm:py-0 sm:h-16 gap-2 sm:gap-4">
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
                  {viewMode === 'staff' ? 'Governed Front Door (Staff View)' : 'Emergency Care Navigator'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                {viewMode === 'staff'
                  ? 'BC-Inspired Emergency Care Navigation (UofT EMHI1001H)'
                  : 'Fast, confidential emergency triage & care navigation'}
              </p>
            </div>
          </div>

          {/* Navigation Links & View Mode Toggle Switch */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Top Navigation Links - HIPPED / HIDDEN IN PATIENT VIEW */}
            {viewMode === 'staff' && (
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => {
                    setActiveTab('patient');
                    if (resetPatientFlow) resetPatientFlow();
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'patient'
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Patient Intake</span>
                </button>

                <button
                  onClick={() => setActiveTab('demo')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'demo'
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Demo Cases</span>
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'staff'
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Staff Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'audit'
                      ? 'bg-sky-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden md:inline">Audit Trail</span>
                </button>
              </nav>
            )}

            {/* TOP RIGHT VIEW MODE TOGGLE SWITCH */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => handleSwitchMode('patient')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'patient'
                    ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient View</span>
              </button>

              <button
                onClick={() => handleSwitchMode('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'staff'
                    ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>Staff View</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
