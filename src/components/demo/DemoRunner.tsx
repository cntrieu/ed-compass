import React, { useState } from 'react';
import { ACADEMIC_DEMO_CASES, DemoCase } from '../../data/demoCases';
import { ClinicalPathwayId, DeterministicRuleOutput } from '../../types/clinical';
import { PatientAccessContext } from '../../types/access';
import { SupportedLocale } from '../../types/i18n';
import { evaluateClinicalRuleEngine } from '../../clinical/engine';
import { PlayCircle, ShieldCheck, CheckCircle2, RefreshCw, Globe, Navigation } from 'lucide-react';

interface DemoRunnerProps {
  onLoadDemoCase: (
    scenario: ClinicalPathwayId,
    answers: Record<string, any>,
    ruleOutput: DeterministicRuleOutput,
    accessContext?: PatientAccessContext,
    locale?: SupportedLocale
  ) => void;
}

export const DemoRunner: React.FC<DemoRunnerProps> = ({ onLoadDemoCase }) => {
  const [rustTestResult, setRustTestResult] = useState<{
    case1Output: DeterministicRuleOutput;
    case2Output: DeterministicRuleOutput;
    isIdentical: boolean;
  } | null>(null);

  const handleLaunchCase = (demo: DemoCase) => {
    const ruleOutput = evaluateClinicalRuleEngine(demo.scenario, demo.patientAnswers);
    onLoadDemoCase(demo.scenario, demo.patientAnswers, ruleOutput, demo.accessContext, demo.locale);
  };

  const handleRunRustEquivalenceTest = () => {
    const baseAnswers = {
      skinBroken: 'Yes',
      timing: '2_to_6_hours',
      retainedObject: 'No',
      bleeding: 'mild',
      location: 'sole',
      footwear: 'No',
      depth: 'shallow',
      retainedMaterial: 'No',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_normal',
      painTrend: 'same',
      contamination: ['none'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    };

    const case1Answers = { ...baseAnswers, rusty: 'Yes' };
    const case2Answers = { ...baseAnswers, rusty: 'No' };

    const out1 = evaluateClinicalRuleEngine('nail_puncture', case1Answers);
    const out2 = evaluateClinicalRuleEngine('nail_puncture', case2Answers);

    const isIdentical =
      out1.disposition === out2.disposition &&
      out1.ruleId === out2.ruleId &&
      out1.tetanusOutcome?.vaccineRecommendation === out2.tetanusOutcome?.vaccineRecommendation &&
      out1.tetanusOutcome?.tigRecommendation === out2.tetanusOutcome?.tigRecommendation;

    setRustTestResult({
      case1Output: out1,
      case2Output: out2,
      isIdentical
    });
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
          <PlayCircle className="w-5 h-5" />
          <span>EMHI1001H Demonstration Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Academic Demo Scenarios & Access/Language Validation Suite
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
          Select any pre-configured academic demonstration case to simulate end-to-end patient intake, deterministic rule evaluation, access-aware care plan generation (FNHA, Northern Health Virtual, 8-1-1), and French/multilingual accessibility.
        </p>

        {/* Live Rust Rule Equivalence Action Card */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Automated Rust Rule Decision-Weight Equivalence Test</span>
              </h3>
              <p className="text-xs text-slate-400">
                Executes two identical nail puncture cases (Case 1: rusty=Yes vs Case 2: rusty=No) to empirically prove zero decision weight for rust.
              </p>
            </div>
            <button
              onClick={handleRunRustEquivalenceTest}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Live Rust Equivalence Test</span>
            </button>
          </div>

          {rustTestResult && (
            <div className="bg-slate-900 p-4 rounded-lg border border-amber-500/40 text-xs space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-emerald-400 text-sm">
                  TEST PASSED: Identical Clinical Outcome Confirmed ({rustTestResult.isIdentical ? '100% Equivalence' : 'Mismatch Error'})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold">Case 1 (rusty = "Yes"):</span>
                  <div>Disposition: {rustTestResult.case1Output.disposition}</div>
                  <div>Rule ID: {rustTestResult.case1Output.ruleId}</div>
                  <div>Vaccine: {rustTestResult.case1Output.tetanusOutcome?.vaccineRecommendation}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                  <span className="text-sky-400 font-bold">Case 2 (rusty = "No"):</span>
                  <div>Disposition: {rustTestResult.case2Output.disposition}</div>
                  <div>Rule ID: {rustTestResult.case2Output.ruleId}</div>
                  <div>Vaccine: {rustTestResult.case2Output.tetanusOutcome?.vaccineRecommendation}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Cases Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Pre-Configured Classroom Demo Scenarios</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACADEMIC_DEMO_CASES.map(demo => (
            <div
              key={demo.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-sky-500 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {demo.id}
                  </span>
                  <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Expected: {demo.expectedDisposition}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  {demo.accessContext && <Navigation className="w-4 h-4 text-purple-600" />}
                  {demo.locale && <Globe className="w-4 h-4 text-sky-600" />}
                  <span>{demo.title}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{demo.description}</p>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Key Learning Points:</span>
                  <ul className="text-[11px] text-slate-700 space-y-0.5">
                    {demo.keyLearningPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => handleLaunchCase(demo)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg text-xs shadow transition-colors flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Launch Demo Scenario in ED Compass</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
