import React, { useState } from 'react';
import { ClinicalPathwayId } from '../../types/clinical';
import { ShieldCheck, ArrowRight, AlertTriangle, Syringe, Activity, Thermometer, CheckCircle2, Lock } from 'lucide-react';

interface LandingPageProps {
  onSelectPathway: (pathway: ClinicalPathwayId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectPathway }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);

  const handleStart = (pathway: ClinicalPathwayId) => {
    if (!consentGiven) {
      setShowConsentError(true);
      return;
    }
    setShowConsentError(false);
    onSelectPathway(pathway);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-slate-700">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>BC HealthLink 8-1-1 Inspired Concept</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            ED COMPASS: Governed Digital Front Door
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            An academic digital front door prototype designed to help patients safely navigate emergency care, understand urgency levels, identify warning signs, and connect with appropriate BC healthcare services.
          </p>

          {/* Key Principles Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Deterministic Rule Engine Ownership</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3 Shared AI Agents Across Pathways</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Governed Quality Improvement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Consent Card */}
      <div
        className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${
          showConsentError ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <h3 className="font-bold text-slate-900 text-base">Academic Prototype Notice & Consent</h3>
            <p>
              ED Compass is an academic prototype built for the University of Toronto EMHI1001H course. It is <strong>NOT a production clinical system</strong>, does <strong>NOT provide medical diagnosis</strong>, and does <strong>NOT replace 9-1-1, HealthLink BC 8-1-1, HEiDi, or Emergency Department evaluation</strong>.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200 hover:bg-sky-50/50 transition-colors">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={e => {
                  setConsentGiven(e.target.checked);
                  if (e.target.checked) setShowConsentError(false);
                }}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="font-medium text-slate-900">
                I understand that this is an academic prototype for demonstration purposes only, does not diagnose disease, and does not transmit data to emergency or health authority systems.
              </span>
            </label>
            {showConsentError && (
              <p className="text-red-600 font-semibold text-xs flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Please review and check the consent box above before selecting a scenario.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>Select Clinical Pathway Scenario</span>
          <span className="text-xs font-normal text-slate-500">(All pathways use identical 3-agent architecture)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pathway A: Stepping on a Nail */}
          <div
            onClick={() => handleStart('nail_puncture')}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Syringe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                Stepping on a Nail / Tetanus Assessment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates puncture wound urgency (ED vs Same-Day vs Home) and BCCDC post-wound tetanus vaccine & immune globulin (TIg) prophylaxis guidance.
              </p>
              <div className="bg-amber-50 text-amber-900 border border-amber-200 text-[11px] p-2 rounded font-medium">
                <strong>Key Feature:</strong> Rust has zero decision weight. Evaluates wound urgency & tetanus prophylaxis separately.
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Start Nail Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Pathway B: Adult Headache */}
          <div
            onClick={() => handleStart('headache')}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                Adult Headache Red-Flag Screening
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Screens for secondary headache red flags using SNOOP / SNNOOP10 concepts (thunderclap, focal neuro deficits, systemic flags, pregnancy/postpartum).
              </p>
              <div className="bg-purple-50 text-purple-900 border border-purple-200 text-[11px] p-2 rounded font-medium">
                <strong>Key Feature:</strong> Early emergency stop for thunderclap onset (HEADACHE-E01) without diagnosing disease.
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Start Headache Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>

          {/* Pathway C: Adult Fever */}
          <div
            onClick={() => handleStart('fever')}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-sky-500 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
                <Thermometer className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors">
                Adult Fever & Systemic Risk Screening
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates fever with life-threat screen, high-risk host screening (neutropenia FEVER-H01), measured qSOFA support, and McIsaac sore throat branch.
              </p>
              <div className="bg-red-50 text-red-900 border border-red-200 text-[11px] p-2 rounded font-medium">
                <strong>Key Feature:</strong> Life threats escalate immediately. McIsaac branch supports sore throat triage without diagnosing strep.
              </div>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Start Fever Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
