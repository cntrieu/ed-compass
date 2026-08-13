import React, { useState } from 'react';
import { DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { evaluateClinicalRuleEngine } from '../../clinical/engine';
import { AuditService } from '../../services/auditService';
import { AgentHandoffVisualizer } from '../common/AgentHandoffVisualizer';
import { ArrowLeft, ArrowRight, Check, AlertCircle, Edit3, HelpCircle } from 'lucide-react';

interface FeverIntakeFlowProps {
  sessionId: string;
  onCompleteIntake: (answers: PatientAnswers, ruleOutput: DeterministicRuleOutput) => void;
  onBackToLanding: () => void;
}

type FeverStep =
  | 'TEMP_CONFIRM'
  | 'TEMP_INPUT'
  | 'LIFE_THREAT'
  | 'EMERGENCY_FLAGS'
  | 'HIGH_RISK'
  | 'HYDRATION'
  | 'URINATION'
  | 'ASSOCIATED_SYMPTOM'
  | 'SORE_THROAT_AGE'
  | 'SORE_THROAT_QUESTIONS'
  | 'URINARY_QUESTIONS'
  | 'ABDOMINAL_QUESTIONS'
  | 'SKIN_QUESTIONS'
  | 'COUGH_QUESTIONS';

export const FeverIntakeFlow: React.FC<FeverIntakeFlowProps> = ({
  sessionId,
  onCompleteIntake,
  onBackToLanding
}) => {
  const [currentStep, setCurrentStep] = useState<FeverStep>('TEMP_CONFIRM');
  const [answers, setAnswers] = useState<PatientAnswers>({});

  // Temperature input state
  const [tempValueInput, setTempValueInput] = useState<string>('');
  const [tempUnitInput, setTempUnitInput] = useState<'C' | 'F'>('C');
  const [tempError, setTempError] = useState<string | null>(null);

  // Sore throat branch state
  const [soreThroatAgeGroup, setSoreThroatAgeGroup] = useState<string | null>(null);
  const [hasCough, setHasCough] = useState<string | null>(null);
  const [swollenGlands, setSwollenGlands] = useState<string | null>(null);
  const [tonsilExudate, setTonsilExudate] = useState<string | null>(null);

  // Urinary branch state
  const [flankPain, setFlankPain] = useState<string | null>(null);
  const [urinaryVomiting, setUrinaryVomiting] = useState<string | null>(null);

  // Abdominal branch state
  const [abdominalSevere, setAbdominalSevere] = useState<string | null>(null);
  const [abdominalRigid, setAbdominalRigid] = useState<string | null>(null);

  // Skin branch state
  const [skinPurple, setSkinPurple] = useState<string | null>(null);
  const [skinSevere, setSkinSevere] = useState<string | null>(null);

  // Cough branch state
  const [coughSeverity, setCoughSeverity] = useState<string | null>(null);

  // Revision drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  // Section helper
  const getSection = (step: FeverStep): 'Safety' | 'Health risks' | 'Symptoms' | 'Recommendation' => {
    switch (step) {
      case 'TEMP_CONFIRM':
      case 'TEMP_INPUT':
      case 'LIFE_THREAT':
      case 'EMERGENCY_FLAGS':
        return 'Safety';
      case 'HIGH_RISK':
        return 'Health risks';
      case 'HYDRATION':
      case 'URINATION':
      case 'ASSOCIATED_SYMPTOM':
      case 'SORE_THROAT_AGE':
      case 'SORE_THROAT_QUESTIONS':
      case 'URINARY_QUESTIONS':
      case 'ABDOMINAL_QUESTIONS':
      case 'SKIN_QUESTIONS':
      case 'COUGH_QUESTIONS':
        return 'Symptoms';
      default:
        return 'Symptoms';
    }
  };

  const currentSection = getSection(currentStep);

  // Early-exit / evaluation runner
  const updateAndEvaluate = (updatedAnswers: PatientAnswers) => {
    setAnswers(updatedAnswers);
    AuditService.logEvent(sessionId, 'QUESTION_ANSWERED', { answers: updatedAnswers });

    const evaluation = evaluateClinicalRuleEngine('fever', updatedAnswers);

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

  // Step 1: Temperature Confirm
  const handleTempConfirmSelect = (val: 'yes' | 'feverish' | 'no') => {
    if (val === 'yes') {
      const updated = {
        ...answers,
        feverish: 'Yes',
        temperatureMeasured: true
      };
      setAnswers(updated);
      setCurrentStep('TEMP_INPUT');
    } else if (val === 'feverish') {
      // Clear temperature values per back-navigation / conditional rule
      const updated = {
        ...answers,
        feverish: 'No_feeling_feverish',
        temperatureMeasured: false,
        temperatureValue: null,
        temperatureUnit: null,
        temperatureCelsius: null,
        subjectiveFever: true
      };
      setTempValueInput('');
      const res = updateAndEvaluate(updated);
      if (!res.shouldStop) setCurrentStep('LIFE_THREAT');
    } else {
      // No
      const updated = {
        ...answers,
        feverish: 'No',
        temperatureMeasured: false,
        temperatureValue: null,
        temperatureUnit: null,
        temperatureCelsius: null,
        subjectiveFever: false
      };
      setTempValueInput('');
      const res = updateAndEvaluate(updated);
      if (!res.shouldStop) setCurrentStep('LIFE_THREAT');
    }
  };

  // Step 1b: Temperature Input Submit
  const handleTempInputSubmit = () => {
    setTempError(null);
    const num = parseFloat(tempValueInput);
    if (isNaN(num) || num <= 20 || num >= 50 && tempUnitInput === 'C' || num >= 120 && tempUnitInput === 'F') {
      setTempError('Please enter your temperature as a valid number, for example 38.5.');
      return;
    }

    let cVal = num;
    if (tempUnitInput === 'F') {
      cVal = ((num - 32) * 5) / 9;
    }

    const updated = {
      ...answers,
      feverish: 'Yes',
      temperatureMeasured: true,
      temperatureValue: num,
      temperatureUnit: tempUnitInput,
      temperatureCelsius: Number(cVal.toFixed(1))
    };

    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('LIFE_THREAT');
  };

  // Step 2: Life Threat Submit
  const handleLifeThreatSubmit = () => {
    const list = answers.lifeThreats || ['NONE_OF_THESE'];
    const updated = { ...answers, lifeThreats: list };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('EMERGENCY_FLAGS');
  };

  // Step 3: Emergency Flags Submit
  const handleEmergencyFlagsSubmit = () => {
    const list = answers.emergencyFlags || ['NONE_OF_THESE'];
    const updated = { ...answers, emergencyFlags: list };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('HIGH_RISK');
  };

  // Step 4: High Risk Submit
  const handleHighRiskSubmit = () => {
    const list = answers.highRiskHost || ['NONE_OF_THESE'];
    const updated = { ...answers, highRiskHost: list };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('HYDRATION');
  };

  // Step 5a: Hydration Select
  const handleHydrationSelect = (val: string) => {
    const updated = { ...answers, fluidStatus: val };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('URINATION');
  };

  // Step 5b: Urination Select
  const handleUrinationSelect = (val: string) => {
    const updated = { ...answers, urineStatus: val };
    const res = updateAndEvaluate(updated);
    if (!res.shouldStop) setCurrentStep('ASSOCIATED_SYMPTOM');
  };

  // Step 6: Associated Symptom Select
  const handleAssociatedSymptomSelect = (symptom: string) => {
    const updated: PatientAnswers = { ...answers, associatedBranch: symptom, mainAssociatedSymptom: symptom };
    setAnswers(updated);

    if (symptom === 'sore_throat') {
      // If age is already present, skip age question
      if (updated.age !== undefined && updated.age !== null) {
        setCurrentStep('SORE_THROAT_QUESTIONS');
      } else {
        setCurrentStep('SORE_THROAT_AGE');
      }
    } else if (symptom === 'urinary') {
      setCurrentStep('URINARY_QUESTIONS');
    } else if (symptom === 'abdominal') {
      setCurrentStep('ABDOMINAL_QUESTIONS');
    } else if (symptom === 'skin') {
      setCurrentStep('SKIN_QUESTIONS');
    } else if (symptom === 'cough' || symptom === 'cough_breathing') {
      setCurrentStep('COUGH_QUESTIONS');
    } else {
      // General fever / chills / body aches / something else
      const evalRes = evaluateClinicalRuleEngine('fever', updated);
      onCompleteIntake(updated, evalRes);
    }
  };

  // Sore Throat Branch Handlers
  const handleSoreThroatAgeSelect = (ageGroup: string) => {
    setSoreThroatAgeGroup(ageGroup);
    const updated = { ...answers, ageGroup };
    setAnswers(updated);
    setCurrentStep('SORE_THROAT_QUESTIONS');
  };

  const handleSoreThroatQuestionsSubmit = (cough: string, glands: string, exudate: string) => {
    const updated = {
      ...answers,
      hasCough: cough,
      swollenGlands: glands,
      tonsilExudate: exudate
    };
    const evalRes = evaluateClinicalRuleEngine('fever', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Urinary Branch Submit
  const handleUrinarySubmit = (flank: string, vomiting: string) => {
    const updated = {
      ...answers,
      flankPain: flank,
      urinaryVomiting: vomiting
    };
    const evalRes = evaluateClinicalRuleEngine('fever', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Abdominal Branch Submit
  const handleAbdominalSubmit = (severe: string, rigid: string) => {
    const updated = {
      ...answers,
      abdominalSevere: severe,
      abdominalRigid: rigid
    };
    const evalRes = evaluateClinicalRuleEngine('fever', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Skin Branch Submit
  const handleSkinSubmit = (purple: string, severe: string) => {
    const updated = {
      ...answers,
      skinPurple: purple,
      skinSevere: severe
    };
    const evalRes = evaluateClinicalRuleEngine('fever', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Cough Branch Submit
  const handleCoughSubmit = (severity: string) => {
    const updated = {
      ...answers,
      coughSeverity: severity
    };
    const evalRes = evaluateClinicalRuleEngine('fever', updated);
    onCompleteIntake(updated, evalRes);
  };

  // Back Button Navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'TEMP_CONFIRM':
        onBackToLanding();
        break;
      case 'TEMP_INPUT':
        setCurrentStep('TEMP_CONFIRM');
        break;
      case 'LIFE_THREAT':
        if (answers.temperatureMeasured) {
          setCurrentStep('TEMP_INPUT');
        } else {
          setCurrentStep('TEMP_CONFIRM');
        }
        break;
      case 'EMERGENCY_FLAGS':
        setCurrentStep('LIFE_THREAT');
        break;
      case 'HIGH_RISK':
        setCurrentStep('EMERGENCY_FLAGS');
        break;
      case 'HYDRATION':
        setCurrentStep('HIGH_RISK');
        break;
      case 'URINATION':
        setCurrentStep('HYDRATION');
        break;
      case 'ASSOCIATED_SYMPTOM':
        setCurrentStep('URINATION');
        break;
      case 'SORE_THROAT_AGE':
      case 'SORE_THROAT_QUESTIONS':
      case 'URINARY_QUESTIONS':
      case 'ABDOMINAL_QUESTIONS':
      case 'SKIN_QUESTIONS':
      case 'COUGH_QUESTIONS':
        setCurrentStep('ASSOCIATED_SYMPTOM');
        break;
      default:
        onBackToLanding();
        break;
    }
  };

  const sections: Array<'Safety' | 'Health risks' | 'Symptoms' | 'Recommendation'> = [
    'Safety',
    'Health risks',
    'Symptoms',
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

      {/* STEP 1A: CONFIRM FEVER */}
      {currentStep === 'TEMP_CONFIRM' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Fever Assessment — Step 1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Have you measured your temperature?
            </h2>
            <p className="text-xs text-slate-500">
              Please select whether you have taken a temperature reading with a thermometer.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleTempConfirmSelect('yes')}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
            >
              <span>Yes, measured with a thermometer</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => handleTempConfirmSelect('feverish')}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
            >
              <span>No, but I feel feverish or have chills</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => handleTempConfirmSelect('no')}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
            >
              <span>No</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1B: TEMPERATURE ENTRY SCREEN */}
      {currentStep === 'TEMP_INPUT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Fever Assessment — Step 1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              What was your temperature?
            </h2>
            <p className="text-xs text-slate-500">
              Enter the numeric reading from your thermometer (decimals like 38.5 or 100.4 are supported).
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                value={tempValueInput}
                onChange={(e) => {
                  setTempValueInput(e.target.value);
                  setTempError(null);
                }}
                placeholder="e.g. 38.5 or 100.4"
                className="flex-1 p-4 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />

              <div className="flex rounded-xl border border-slate-300 overflow-hidden bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setTempUnitInput('C')}
                  className={`px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                    tempUnitInput === 'C'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnitInput('F')}
                  className={`px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                    tempUnitInput === 'F'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>

            {tempError && (
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tempError}</span>
              </p>
            )}

            <button
              onClick={handleTempInputSubmit}
              disabled={!tempValueInput.trim()}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: IMMEDIATE EMERGENCY SCREEN */}
      {currentStep === 'LIFE_THREAT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100 inline-block">
              Step 2 — Immediate emergency
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
              { id: 'unresponsive', label: 'Unresponsive or cannot be awakened' },
              { id: 'not_breathing', label: 'Not breathing normally, gasping, or blue/grey lips or skin' },
              { id: 'seizure_now', label: 'A seizure is happening now' },
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

      {/* STEP 3: SERIOUS FEVER SYMPTOMS SCREEN */}
      {currentStep === 'EMERGENCY_FLAGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 inline-block">
              Step 3 — Serious fever symptoms
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Do you have any of these symptoms with your fever?
            </h2>
            <p className="text-xs text-slate-500">
              Select all that apply, or select "None of these".
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'confusion', label: 'New confusion, fainting, or a recent seizure' },
              { id: 'chest_pain', label: 'New or worsening shortness of breath or chest pain/pressure' },
              { id: 'stiff_neck', label: 'Severe headache with stiff neck or light sensitivity' },
              { id: 'purple_rash', label: 'Purple rash that doesn’t fade when pressed, or unusual bleeding/bruising' },
              { id: 'severe_skin_pain', label: 'Rapidly worsening severe pain/swelling, or purple/black skin or blistering' },
              { id: 'unable_to_swallow', label: 'Unable to swallow liquids, drooling, or severe throat swelling' },
              { id: 'NONE_OF_THESE', label: 'None of these' }
            ].map((opt) => {
              const currentList = answers.emergencyFlags || ['NONE_OF_THESE'];
              const isChecked = currentList.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newList = handleCheckboxToggle(currentList, opt.id);
                    setAnswers({ ...answers, emergencyFlags: newList });
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
            onClick={handleEmergencyFlagsSubmit}
            className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: HEALTH RISKS SCREENING */}
      {currentStep === 'HIGH_RISK' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
              Step 4 — Health risks screening
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Do any of these medical contexts apply to you?
            </h2>
            <p className="text-xs text-slate-500">
              Select all that apply, or select "None of these".
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { id: 'chemo_neutropenia', label: 'I have neutropenia or am currently/recently receiving chemotherapy' },
              { id: 'transplant', label: 'I have had an organ or stem-cell transplant' },
              { id: 'immunosuppressed', label: 'My immune system is significantly weakened by medication or a medical condition' },
              { id: 'pregnancy_postpartum', label: 'I am pregnant or recently gave birth' },
              { id: 'NONE_OF_THESE', label: 'None of these' }
            ].map((opt) => {
              const currentList = answers.highRiskHost || ['NONE_OF_THESE'];
              const isChecked = currentList.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newList = handleCheckboxToggle(currentList, opt.id);
                    setAnswers({ ...answers, highRiskHost: newList });
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

      {/* STEP 5A: HYDRATION SCREEN */}
      {currentStep === 'HYDRATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              General Stability — Step 5
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Are you able to drink and keep fluids down?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes, normally', value: 'drinking_normally' },
              { label: 'Yes, but less than normal', value: 'drinking_less' },
              { label: 'No, I keep vomiting', value: 'cannot_keep_down' },
              { label: 'I cannot swallow fluids', value: 'cannot_swallow' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleHydrationSelect(opt.value)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5B: URINATION SCREEN */}
      {currentStep === 'URINATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              General Stability — Step 5
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Are you urinating about as much as usual?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Yes', value: 'normal' },
              { label: 'Less than usual', value: 'less' },
              { label: 'Very little or not at all', value: 'very_little' },
              { label: 'I’m not sure', value: 'unsure' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleUrinationSelect(opt.value)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: ASSOCIATED SYMPTOM SCREEN */}
      {currentStep === 'ASSOCIATED_SYMPTOM' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Symptoms — Step 6
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Other than fever, which symptom is bothering you the most?
            </h2>
            <p className="text-xs text-slate-500">
              Select the main symptom to open its relevant safety branch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Sore throat', value: 'sore_throat' },
              { label: 'Cough or breathing symptoms', value: 'cough' },
              { label: 'Vomiting or diarrhea', value: 'vomiting_diarrhea' },
              { label: 'Abdominal pain', value: 'abdominal' },
              { label: 'Pain or burning when urinating', value: 'urinary' },
              { label: 'Back or side pain', value: 'back_side' },
              { label: 'Rash, redness, wound or swelling', value: 'skin' },
              { label: 'Headache', value: 'headache' },
              { label: 'Chills or body aches', value: 'chills_body_aches' },
              { label: 'Something else', value: 'something_else' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAssociatedSymptomSelect(opt.value)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SORE THROAT BRANCH — AGE GROUP (IF NOT ALREADY PROVIDED) */}
      {currentStep === 'SORE_THROAT_AGE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Sore Throat Branch — McIsaac Framework
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              What age group are you in?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSoreThroatAgeSelect('18_44')}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
            >
              <span>18–44 years old</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>

            <button
              onClick={() => handleSoreThroatAgeSelect('45_plus')}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
            >
              <span>45 years of age or older</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
            </button>
          </div>
        </div>
      )}

      {/* SORE THROAT BRANCH — MCISAAC QUESTIONS */}
      {currentStep === 'SORE_THROAT_QUESTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Sore Throat Branch
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Sore Throat Symptoms
            </h2>
            <p className="text-xs text-slate-500">
              Answer the following three questions regarding your sore throat.
            </p>
          </div>

          <div className="space-y-6">
            {/* Cough Question */}
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Do you have a cough?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHasCough(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      hasCough === opt
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Swollen Glands Question */}
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                2. Are the glands at the front of your neck swollen or tender?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No', 'I’m not sure'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSwollenGlands(opt === 'I’m not sure' ? 'Unsure' : opt)}
                    className={`flex-1 py-3 px-3 rounded-xl border font-medium text-xs sm:text-sm transition-all ${
                      swollenGlands === (opt === 'I’m not sure' ? 'Unsure' : opt)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Tonsils Question */}
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                3. Do you see white patches, pus, or significant swelling on your tonsils?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No', 'I’m not sure'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTonsilExudate(opt === 'I’m not sure' ? 'Unsure' : opt)}
                    className={`flex-1 py-3 px-3 rounded-xl border font-medium text-xs sm:text-sm transition-all ${
                      tonsilExudate === (opt === 'I’m not sure' ? 'Unsure' : opt)
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
              disabled={!hasCough || !swollenGlands || !tonsilExudate}
              onClick={() => handleSoreThroatQuestionsSubmit(hasCough!, swollenGlands!, tonsilExudate!)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Submit & View Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* URINARY BRANCH QUESTIONS */}
      {currentStep === 'URINARY_QUESTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Urinary Branch
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Urinary & Back Pain Assessment
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Do you have back, side, or flank pain?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFlankPain(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      flankPain === opt
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
                2. Have you had repeated vomiting with these symptoms?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setUrinaryVomiting(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      urinaryVomiting === opt
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
              disabled={!flankPain || !urinaryVomiting}
              onClick={() => handleUrinarySubmit(flankPain!, urinaryVomiting!)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Submit & View Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ABDOMINAL BRANCH QUESTIONS */}
      {currentStep === 'ABDOMINAL_QUESTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Abdominal Symptom Branch
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Abdominal Pain Assessment
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Is your abdominal pain severe or rapidly worsening?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAbdominalSevere(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      abdominalSevere === opt
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
                2. Is your abdomen extremely tender to touch or rigid/hard?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAbdominalRigid(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      abdominalRigid === opt
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
              disabled={!abdominalSevere || !abdominalRigid}
              onClick={() => handleAbdominalSubmit(abdominalSevere!, abdominalRigid!)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Submit & View Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SKIN BRANCH QUESTIONS */}
      {currentStep === 'SKIN_QUESTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Skin & Soft Tissue Branch
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Skin & Wound Assessment
            </h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block font-semibold text-sm text-slate-800">
                1. Is the skin becoming purple, black, or blistered?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSkinPurple(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      skinPurple === opt
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
                2. Is redness or swelling spreading quickly, or is pain severe?
              </label>
              <div className="flex gap-3">
                {['Yes', 'No'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSkinSevere(opt)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-medium text-sm transition-all ${
                      skinSevere === opt
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
              disabled={!skinPurple || !skinSevere}
              onClick={() => handleSkinSubmit(skinPurple!, skinSevere!)}
              className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Submit & View Recommendation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* COUGH BRANCH QUESTIONS */}
      {currentStep === 'COUGH_QUESTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
              Cough & Respiratory Branch
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              Respiratory Symptom Assessment
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Mild cough, breathing comfortably', value: 'mild' },
              { label: 'Moderate cough with phlegm or mild tightness', value: 'moderate' },
              { label: 'Severe breathing difficulty or gasping', value: 'severe' }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleCoughSubmit(opt.value)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-sm text-slate-800 flex items-center justify-between group"
              >
                <span>{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* REVISION DRAWER */}
      {showEditDrawer && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span>Fever Answer Revision Drawer</span>
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
