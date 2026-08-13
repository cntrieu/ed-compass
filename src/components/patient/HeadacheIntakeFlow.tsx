import React, { useState } from 'react';
import { DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { evaluateClinicalRuleEngine } from '../../clinical/engine';
import { AuditService } from '../../services/auditService';
import { AgentHandoffVisualizer } from '../common/AgentHandoffVisualizer';
import { ArrowLeft, ArrowRight, Check, AlertCircle, Edit3 } from 'lucide-react';

interface HeadacheIntakeFlowProps {
  sessionId: string;
  onCompleteIntake: (answers: PatientAnswers, ruleOutput: DeterministicRuleOutput) => void;
  onBackToLanding: () => void;
}

type HeadacheStep =
  | 'LIFE_THREAT'
  | 'THUNDERCLAP'
  | 'NEUROLOGICAL'
  | 'EYE_EMERGENCY'
  | 'PREGNANCY'
  | 'HIGH_RISK'
  | 'TRAUMA'
  | 'TRAUMA_DETAILS'
  | 'AGE_GROUP'
  | 'AGE_50_DETAILS'
  | 'PATTERN_CHANGE'
  | 'POSITIONAL_EXERTIONAL'
  | 'VOMITING'
  | 'MIGRAINE_HISTORY';

export const HeadacheIntakeFlow: React.FC<HeadacheIntakeFlowProps> = ({
  sessionId,
  onCompleteIntake,
  onBackToLanding
}) => {
  const [currentStep, setCurrentStep] = useState<HeadacheStep>('LIFE_THREAT');
  const [answers, setAnswers] = useState<PatientAnswers>({});

  // Review drawer state
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  // Section helper
  const getSection = (step: HeadacheStep): 'Safety' | 'Health risks' | 'Headache features' | 'Recommendation' => {
    switch (step) {
      case 'LIFE_THREAT':
      case 'THUNDERCLAP':
      case 'NEUROLOGICAL':
      case 'EYE_EMERGENCY':
        return 'Safety';
      case 'PREGNANCY':
      case 'HIGH_RISK':
      case 'TRAUMA':
      case 'TRAUMA_DETAILS':
      case 'AGE_GROUP':
      case 'AGE_50_DETAILS':
        return 'Health risks';
      case 'PATTERN_CHANGE':
      case 'POSITIONAL_EXERTIONAL':
      case 'VOMITING':
      case 'MIGRAINE_HISTORY':
        return 'Headache features';
      default:
        return 'Headache features';
    }
  };

  const currentSection = getSection(currentStep);

  // Early-exit / evaluation runner
  const updateAndEvaluate = (updatedAnswers: PatientAnswers) => {
    setAnswers(updatedAnswers);
    AuditService.logEvent(sessionId, 'QUESTION_ANSWERED', { answers: updatedAnswers });

    const evaluation = evaluateClinicalRuleEngine('headache', updatedAnswers);

    // Immediate emergency exit checks
    if (
      evaluation.disposition === 'CALL_911_NOW' ||
      evaluation.disposition === 'GO_TO_ED_NOW'
    ) {
      onCompleteIntake(updatedAnswers, evaluation);
      return { shouldStop: true, evaluation };
    }

    return { shouldStop: false, evaluation };
  };

  // Helper for multi-select checkboxes with "None of these" rule
  const handleCheckboxToggle = (
    currentList: string[],
    selectedVal: string
  ): string[] => {
    if (selectedVal === 'NONE_OF_THESE' || selectedVal === 'none') {
      return ['NONE_OF_THESE'];
    }
    const filtered = currentList.filter(
      (v) => v !== 'NONE_OF_THESE' && v !== 'none'
    );
    if (filtered.includes(selectedVal)) {
      const remaining = filtered.filter((v) => v !== selectedVal);
      return remaining.length === 0 ? ['NONE_OF_THESE'] : remaining;
    } else {
      return [...filtered, selectedVal];
    }
  };

  // --- STEP 1: LIFE THREAT SUBMIT ---
  const handleLifeThreatSubmit = () => {
    const list = answers.lifeThreats || ['NONE_OF_THESE'];
    const updated = { ...answers, lifeThreats: list, selectedImmediateThreats: list };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('THUNDERCLAP');
  };

  // --- STEP 2: THUNDERCLAP SELECT ---
  const handleThunderclapSelect = (val: 'immediately' | 'gradual' | 'unsure') => {
    const updated = {
      ...answers,
      onset: val,
      suddenMaximalOnset: val === 'immediately' ? 'Yes' : 'No',
      thunderclap: val === 'immediately'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('NEUROLOGICAL');
  };

  // --- STEP 3: NEUROLOGICAL & SYSTEMIC SUBMIT ---
  const handleNeurologicalSubmit = () => {
    const list = answers.neurologicalFlags || ['NONE_OF_THESE'];
    const hasFeverStiffNeck = list.includes('fever_stiff_neck_rash');
    const systemicFlags = hasFeverStiffNeck ? ['fever_stiff_neck'] : ['NONE_OF_THESE'];

    const updated = {
      ...answers,
      neurologicalFlags: list,
      selectedNeurologicalSymptoms: list,
      systemicFlags: systemicFlags,
      selectedSystemicRedFlags: systemicFlags
    };

    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('EYE_EMERGENCY');
  };

  // --- STEP 4: EYE EMERGENCY SELECT ---
  const handleEyeEmergencySelect = (val: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      painfulRedEye: val,
      eyeVisionChange: val,
      visualDisturbance: val === 'Yes' ? 'halos' : 'none'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('PREGNANCY');
  };

  // --- STEP 5B: EYE VISION CHECK SELECT ---
  const handleEyeVisionCheckSelect = (val: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      painfulRedEye: 'Yes',
      eyeVisionChange: val,
      visualDisturbance: val === 'Yes' ? 'halos' : 'none'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('PREGNANCY');
  };

  // --- STEP 6: PREGNANCY SELECT ---
  const handlePregnancySelect = (val: 'pregnant' | 'postpartum' | 'neither') => {
    const updated = {
      ...answers,
      pregnancy: val,
      pregnancyStatus: val === 'pregnant' ? 'pregnant' : 'none',
      postpartumStatus: val === 'postpartum' ? 'postpartum' : 'none'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('HIGH_RISK');
  };

  // --- STEP 7: HIGH RISK SUBMIT ---
  const handleHighRiskSubmit = () => {
    const list = answers.highRiskConditions || ['NONE_OF_THESE'];
    const updated = {
      ...answers,
      highRiskConditions: list,
      cancerHistory: list.includes('cancer') ? 'Yes' : 'No',
      immunosuppression: list.includes('immunosuppression') ? 'Yes' : 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('TRAUMA');
  };

  // --- STEP 8: TRAUMA SELECT ---
  const handleTraumaSelect = (val: 'Yes' | 'No') => {
    if (val === 'Yes') {
      const updated = { ...answers, trauma: 'Yes', recentHeadTrauma: 'Yes' };
      setAnswers(updated);
      setCurrentStep('TRAUMA_DETAILS');
    } else {
      // Clear trauma details per back navigation / conditional rule
      const updated: PatientAnswers = {
        ...answers,
        trauma: 'No',
        recentHeadTrauma: 'No',
        traumaSymptoms: ['NONE_OF_THESE'],
        anticoagulants: 'No',
        anticoagulantUse: 'No'
      };
      const res = updateAndEvaluate(updated);
      if (!res.shouldStop) {
        if (updated.age !== undefined && updated.age !== null) {
          if (Number(updated.age) >= 50) {
            setCurrentStep('AGE_50_DETAILS');
          } else {
            setCurrentStep('PATTERN_CHANGE');
          }
        } else {
          setCurrentStep('AGE_GROUP');
        }
      }
    }
  };

  // --- STEP 8B: TRAUMA DETAILS SUBMIT ---
  const handleTraumaDetailsSubmit = (anticoag: 'Yes' | 'No', vomiting: 'Yes' | 'No') => {
    const updated: PatientAnswers = {
      ...answers,
      trauma: 'Yes',
      recentHeadTrauma: 'Yes',
      anticoagulants: anticoag,
      anticoagulantUse: anticoag === 'Yes' ? 'Yes' : 'No',
      vomiting: vomiting,
      persistentVomiting: vomiting === 'Yes' ? 'Yes' : 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) {
      if (updated.age !== undefined && updated.age !== null) {
        if (Number(updated.age) >= 50) {
          setCurrentStep('AGE_50_DETAILS');
        } else {
          setCurrentStep('PATTERN_CHANGE');
        }
      } else {
        setCurrentStep('AGE_GROUP');
      }
    }
  };

  // --- STEP 9: AGE GROUP SELECT ---
  const handleAgeGroupSelect = (val: '18_49' | '50_plus') => {
    const updated = { ...answers, ageGroup: val };
    setAnswers(updated);
    if (val === '50_plus') {
      setCurrentStep('AGE_50_DETAILS');
    } else {
      setCurrentStep('PATTERN_CHANGE');
    }
  };

  // --- STEP 9B: AGE 50 DETAILS SUBMIT ---
  const handleAge50DetailsSubmit = (isNew: 'Yes' | 'No', scalpJaw: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      firstOrWorst: isNew,
      newHeadacheAge50: isNew,
      scalpOrJaw: scalpJaw,
      scalpTenderness: scalpJaw === 'Yes' ? 'Yes' : 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('PATTERN_CHANGE');
  };

  // --- STEP 10: PATTERN CHANGE SELECT ---
  const handlePatternChangeSelect = (pattern: 'very_different' | 'somewhat_different' | 'usual' | 'no_usual') => {
    const updated = {
      ...answers,
      differentFromUsual: pattern === 'usual' ? 'No' : 'Yes',
      pattern: pattern === 'very_different' ? 'progressive' : 'stable',
      firstOrWorst: pattern === 'no_usual' ? 'Yes' : answers.firstOrWorst || 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('POSITIONAL_EXERTIONAL');
  };

  // --- STEP 11: POSITIONAL / EXERTIONAL SUBMIT ---
  const handlePositionalExertionalSubmit = (positional: 'Yes' | 'No', exertion: 'Yes' | 'No', progressive: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      positional: positional,
      positionalHeadache: positional === 'Yes' ? 'Yes' : 'No',
      exertionTrigger: exertion === 'Yes' ? ['exercise'] : ['none'],
      progressivelyWorsening: progressive === 'Yes' ? 'Yes' : 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('VOMITING');
  };

  // --- STEP 12: VOMITING SELECT ---
  const handleVomitingSelect = (val: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      vomiting: val,
      persistentVomiting: val === 'Yes' ? 'Yes' : 'No'
    };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('MIGRAINE_HISTORY');
  };

  // --- STEP 13: MIGRAINE HISTORY SUBMIT ---
  const handleMigraineHistorySubmit = (history: 'Yes' | 'No', feelsSame: 'Yes' | 'No') => {
    const updated = {
      ...answers,
      establishedHeadacheDiagnosis: history === 'Yes' ? 'Yes' : 'No',
      similarToUsualHeadache: feelsSame === 'Yes' ? 'Yes' : 'No',
      differentFromUsual: feelsSame === 'Yes' ? 'No' : 'Yes'
    };
    const evalRes = evaluateClinicalRuleEngine('headache', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Back Button Navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'LIFE_THREAT':
        onBackToLanding();
        break;
      case 'THUNDERCLAP':
        setCurrentStep('LIFE_THREAT');
        break;
      case 'NEUROLOGICAL':
        setCurrentStep('THUNDERCLAP');
        break;
      case 'EYE_EMERGENCY':
        setCurrentStep('NEUROLOGICAL');
        break;
      case 'PREGNANCY':
        setCurrentStep('EYE_EMERGENCY');
        break;
      case 'HIGH_RISK':
        setCurrentStep('PREGNANCY');
        break;
      case 'TRAUMA':
        setCurrentStep('HIGH_RISK');
        break;
      case 'TRAUMA_DETAILS':
        setCurrentStep('TRAUMA');
        break;
      case 'AGE_GROUP':
        setCurrentStep('TRAUMA');
        break;
      case 'AGE_50_DETAILS':
        setCurrentStep('AGE_GROUP');
        break;
      case 'PATTERN_CHANGE':
        if (answers.ageGroup === '50_plus') {
          setCurrentStep('AGE_50_DETAILS');
        } else {
          setCurrentStep('TRAUMA');
        }
        break;
      case 'POSITIONAL_EXERTIONAL':
        setCurrentStep('PATTERN_CHANGE');
        break;
      case 'VOMITING':
        setCurrentStep('POSITIONAL_EXERTIONAL');
        break;
      case 'MIGRAINE_HISTORY':
        setCurrentStep('VOMITING');
        break;
      default:
        onBackToLanding();
        break;
    }
  };

  const sections: Array<'Safety' | 'Health risks' | 'Headache features' | 'Recommendation'> = [
    'Safety',
    'Health risks',
    'Headache features',
    'Recommendation'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Agent Visualizer */}
      <AgentHandoffVisualizer currentStage="intake" />

      {/* Section Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 uppercase tracking-wider">
            Step: {currentSection}
          </span>

          <button
            onClick={() => setShowEditDrawer(!showEditDrawer)}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg border border-sky-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Review Answers</span>
          </button>
        </div>

        {/* Section Steps Breadcrumb */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {sections.map((sec, i) => {
            const isCurrent = sec === currentSection;
            const currentIndexSec = sections.indexOf(currentSection);
            const isCompleted = i < currentIndexSec;

            return (
              <div key={sec} className="space-y-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'bg-sky-600'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`block text-[11px] font-semibold text-center truncate ${
                    isCurrent ? 'text-sky-700 font-bold' : 'text-slate-500'
                  }`}
                >
                  {sec}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: IMMEDIATE LIFE THREAT */}
      {currentStep === 'LIFE_THREAT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-block">
              Safety Screening — Step 1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Is any of the following happening right now?
            </h2>
            <p className="text-xs text-slate-500">
              Select all that apply, or select "None of these".
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'unresponsive', label: 'I cannot stay awake, am very hard to wake, or am barely responding' },
              { id: 'seizure_now', label: 'A seizure is happening now' },
              { id: 'stroke_like', label: 'I have sudden new weakness, facial drooping, major difficulty speaking, walking, or keeping my balance' },
              { id: 'NONE_OF_THESE', label: 'None of these' }
            ].map((opt) => {
              const currentList = answers.lifeThreats || ['NONE_OF_THESE'];
              const isChecked = currentList.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newList = handleCheckboxToggle(currentList, opt.id);
                    setAnswers({ ...answers, lifeThreats: newList });
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-sky-50 border-sky-500 text-sky-900'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleLifeThreatSubmit}
            className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: SUDDEN / THUNDERCLAP HEADACHE */}
      {currentStep === 'THUNDERCLAP' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-block">
              Safety Screening — Step 2
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Did this headache reach its worst intensity immediately or within about one minute?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes (reached maximum intensity immediately or <1 min)', value: 'immediately' },
              { label: 'No, it built up gradually over minutes or hours', value: 'gradual' },
              { label: 'I’m not sure', value: 'unsure' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleThunderclapSelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: NEUROLOGICAL AND SYSTEMIC SYMPTOMS */}
      {currentStep === 'NEUROLOGICAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 inline-block">
              Safety Screening — Step 3
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Do you have any of these symptoms with your headache?
            </h2>
            <p className="text-xs text-slate-500">
              Select all that apply, or select "None of these".
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'numbness', label: 'New numbness' },
              { id: 'confusion', label: 'Confusion or unusual behaviour' },
              { id: 'fainting', label: 'Fainting or a seizure that has stopped' },
              { id: 'vision_loss_double', label: 'New loss of vision or double vision' },
              { id: 'fever_stiff_neck_rash', label: 'Fever with a stiff neck or a new red or purple rash that does not fade when pressed' },
              { id: 'NONE_OF_THESE', label: 'None of these' }
            ].map((opt) => {
              const currentList = answers.neurologicalFlags || ['NONE_OF_THESE'];
              const isChecked = currentList.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newList = handleCheckboxToggle(currentList, opt.id);
                    setAnswers({ ...answers, neurologicalFlags: newList });
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-sky-50 border-sky-500 text-sky-900'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNeurologicalSubmit}
            className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: EYE EMERGENCY SCREEN */}
      {currentStep === 'EYE_EMERGENCY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Eye Safety
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Do you have severe eye pain or a very painful red eye with your headache?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleEyeEmergencySelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: PREGNANCY SCREEN */}
      {currentStep === 'PREGNANCY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Health Risks — Step 6
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Are you currently pregnant, or have you recently given birth?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Currently pregnant', value: 'pregnant' },
              { label: 'Recently given birth (postpartum)', value: 'postpartum' },
              { label: 'No / Not applicable', value: 'neither' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePregnancySelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: HIGH RISK CONDITIONS SCREEN */}
      {currentStep === 'HIGH_RISK' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Health Risks — Step 7
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Do any of these apply to you?
            </h2>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'cancer', label: 'I currently have cancer or have recently been treated for cancer' },
              { id: 'immunosuppression', label: 'I have a significantly weakened immune system' },
              { id: 'hiv', label: 'I have HIV that affects my immune system' },
              { id: 'medication_suppression', label: 'I take medication that significantly suppresses my immune system' },
              { id: 'NONE_OF_THESE', label: 'None of these / I’m not sure' }
            ].map((opt) => {
              const currentList = answers.highRiskConditions || ['NONE_OF_THESE'];
              const isChecked = currentList.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newList = handleCheckboxToggle(currentList, opt.id);
                    setAnswers({ ...answers, highRiskConditions: newList });
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-sky-50 border-sky-500 text-sky-900'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleHighRiskSubmit}
            className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 8: HEAD OR NECK TRAUMA SCREEN */}
      {currentStep === 'TRAUMA' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Health Risks — Step 8
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Have you recently injured your head or neck?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes, recent head or neck injury', value: 'Yes' },
              { label: 'No head or neck injury', value: 'No' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleTraumaSelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 8B: TRAUMA DETAILS SCREEN */}
      {currentStep === 'TRAUMA_DETAILS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Trauma Screening — Step 8
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Post-Injury Details
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Do you take a prescription blood thinner (anticoagulant)?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const updated = { ...answers, anticoagulants: opt };
                      setAnswers(updated);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.anticoagulants === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                2. Have you experienced repeated vomiting since the injury?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const updated = { ...answers, vomiting: opt };
                      setAnswers(updated);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.vomiting === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!answers.anticoagulants || !answers.vomiting}
              onClick={() => handleTraumaDetailsSubmit(answers.anticoagulants, answers.vomiting)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: AGE GROUP SCREEN */}
      {currentStep === 'AGE_GROUP' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Health Risks — Step 9
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              What age group are you in?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: '18–49 years old', value: '18_49' },
              { label: '50 years of age or older', value: '50_plus' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAgeGroupSelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 9B: AGE 50 DETAILS SCREEN */}
      {currentStep === 'AGE_50_DETAILS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Age 50+ Screening — Step 9
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              New or Changed Headache Assessment
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Is this headache new for you or significantly different from your usual headaches?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const updated = { ...answers, firstOrWorst: opt };
                      setAnswers(updated);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.firstOrWorst === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                2. Do you have new scalp tenderness or jaw pain / tiredness while chewing?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const updated = { ...answers, scalpOrJaw: opt };
                      setAnswers(updated);
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.scalpOrJaw === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!answers.firstOrWorst || !answers.scalpOrJaw}
              onClick={() => handleAge50DetailsSubmit(answers.firstOrWorst, answers.scalpOrJaw)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 10: PATTERN CHANGE SCREEN */}
      {currentStep === 'PATTERN_CHANGE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Headache Features — Step 10
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Compared with your usual headaches, is this headache different?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes, very different', value: 'very_different' },
              { label: 'Somewhat different', value: 'somewhat_different' },
              { label: 'No, it feels like my usual headache', value: 'usual' },
              { label: 'I do not usually get headaches', value: 'no_usual' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePatternChangeSelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 11: POSITIONAL / EXERTIONAL SCREEN */}
      {currentStep === 'POSITIONAL_EXERTIONAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Headache Features — Step 11
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Triggers & Pattern Characteristics
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Does the headache become significantly worse when you stand up, lie down, or bend over?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers({ ...answers, positional: opt })}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.positional === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                2. Did this headache begin during or immediately after exercise, coughing, or straining?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers({ ...answers, exertion: opt })}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.exertion === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                3. Is the headache becoming progressively worse over days?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers({ ...answers, progressive: opt })}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.progressive === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!answers.positional || !answers.exertion || !answers.progressive}
              onClick={() => handlePositionalExertionalSubmit(answers.positional, answers.exertion, answers.progressive)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 12: VOMITING SCREEN */}
      {currentStep === 'VOMITING' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Headache Features — Step 12
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Have you been vomiting repeatedly or having trouble keeping fluids down?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes, repeated vomiting', value: 'Yes' },
              { label: 'No', value: 'No' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleVomitingSelect(opt.value as any)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 13: MIGRAINE HISTORY SCREEN */}
      {currentStep === 'MIGRAINE_HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Headache History — Step 13
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Previously Diagnosed Migraine or Headache Condition
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Have you previously been diagnosed with migraine or another recurring headache condition?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers({ ...answers, migraineHistory: opt })}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      answers.migraineHistory === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {answers.migraineHistory === 'Yes' && (
              <div className="space-y-2 animate-fade-in">
                <label className="block font-semibold text-sm text-slate-800">
                  2. Does this headache feel essentially the same as your usual headaches?
                </label>
                <div className="flex gap-3">
                  {['Yes', 'No'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, feelsSame: opt })}
                      className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                        answers.feelsSame === opt
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={!answers.migraineHistory || (answers.migraineHistory === 'Yes' && !answers.feelsSame)}
              onClick={() => handleMigraineHistorySubmit(answers.migraineHistory, answers.feelsSame || 'No')}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Submit & View Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* REVISION DRAWER */}
      {showEditDrawer && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span>Headache Answer Revision Drawer</span>
            </h3>
            <button
              onClick={() => setShowEditDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Drawer
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 text-xs">
            {Object.entries(answers).map(([key, val]) => (
              <div
                key={key}
                className="bg-slate-800 p-2.5 rounded border border-slate-700 flex items-center justify-between"
              >
                <span className="font-mono text-slate-300">{key}:</span>
                <span className="font-bold text-sky-400">
                  {Array.isArray(val) ? val.join(', ') : String(val ?? 'null')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
