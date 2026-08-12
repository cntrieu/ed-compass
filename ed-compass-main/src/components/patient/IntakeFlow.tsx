import React, { useState } from 'react';
import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { LocalDemoAgentProvider } from '../../agents/localDemoAgentProvider';
import { evaluateClinicalRuleEngine } from '../../clinical/engine';
import { AuditService } from '../../services/auditService';
import { AgentHandoffVisualizer } from '../common/AgentHandoffVisualizer';
import { ArrowLeft, ArrowRight, Edit3, AlertOctagon, HelpCircle, ShieldAlert, Check } from 'lucide-react';

import { FeverIntakeFlow } from './FeverIntakeFlow';
import { HeadacheIntakeFlow } from './HeadacheIntakeFlow';

interface IntakeFlowProps {
  scenario: ClinicalPathwayId;
  sessionId: string;
  onCompleteIntake: (answers: PatientAnswers, ruleOutput: DeterministicRuleOutput) => void;
  onBackToLanding: () => void;
}

export const IntakeFlow: React.FC<IntakeFlowProps> = ({
  scenario,
  sessionId,
  onCompleteIntake,
  onBackToLanding
}) => {
  if (scenario === 'fever') {
    return (
      <FeverIntakeFlow
        sessionId={sessionId}
        onCompleteIntake={onCompleteIntake}
        onBackToLanding={onBackToLanding}
      />
    );
  }

  if (scenario === 'headache') {
    return (
      <HeadacheIntakeFlow
        sessionId={sessionId}
        onCompleteIntake={onCompleteIntake}
        onBackToLanding={onBackToLanding}
      />
    );
  }

  const provider = new LocalDemoAgentProvider();
  const questionSequence = provider.getQuestionSequence(scenario);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PatientAnswers>({});
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [emergencyStopRule, setEmergencyStopRule] = useState<DeterministicRuleOutput | null>(null);

  const currentQuestionId = questionSequence[currentIndex];
  const question = provider.getQuestionForPathway(scenario, currentQuestionId);

  const currentVal = answers[question?.id || ''];

  const handleSelectAnswer = (id: string, value: any) => {
    const updatedAnswers = { ...answers, [id]: value };
    setAnswers(updatedAnswers);

    AuditService.logEvent(sessionId, 'QUESTION_ANSWERED', { questionId: id, value });

    // Evaluate rules on updated answers to detect early emergency stop
    const evaluation = evaluateClinicalRuleEngine(scenario, updatedAnswers);

    if (evaluation.disposition === 'CALL_911_NOW' || evaluation.disposition === 'GO_TO_ED_NOW') {
      // Check if this rule is an emergency stop rule
      if (evaluation.ruleId.includes('-E') || evaluation.ruleId.includes('-H01') || evaluation.ruleId.includes('-E00')) {
        setEmergencyStopRule(evaluation);
        AuditService.logEvent(sessionId, 'EMERGENCY_STOP_TRIGGERED', {
          ruleId: evaluation.ruleId,
          disposition: evaluation.disposition
        });
        return;
      }
    }

    // Advance to next question if not at end
    if (currentIndex < questionSequence.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Complete flow
      AuditService.logEvent(sessionId, 'HANDOFF_VALIDATED', { answersCount: Object.keys(updatedAnswers).length });
      onCompleteIntake(updatedAnswers, evaluation);
    }
  };

  const handleNext = () => {
    if (currentIndex < questionSequence.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const evaluation = evaluateClinicalRuleEngine(scenario, answers);
      onCompleteIntake(answers, evaluation);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onBackToLanding();
    }
  };

  const handleProceedWithEmergencyStop = () => {
    if (emergencyStopRule) {
      onCompleteIntake(answers, emergencyStopRule);
    }
  };

  if (emergencyStopRule) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-6 animate-fade-in">
        <AgentHandoffVisualizer
          currentStage="engine"
          ruleId={emergencyStopRule.ruleId}
          ruleVersion={emergencyStopRule.ruleVersion}
        />

        <div className="bg-red-600 text-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-red-700 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-700/80 rounded-xl">
              <AlertOctagon className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div>
              <span className="bg-red-800 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Emergency Warning Sign Detected
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                {emergencyStopRule.disposition === 'CALL_911_NOW' ? 'CALL 9-1-1 IMMEDIATELY' : 'GO TO EMERGENCY DEPARTMENT NOW'}
              </h2>
            </div>
          </div>

          <div className="bg-red-900/60 p-4 rounded-xl border border-red-500/40 text-sm leading-relaxed space-y-2">
            <p className="font-bold text-red-100">
              Routine questioning has been stopped because a high-priority emergency condition was identified.
            </p>
            <p className="text-red-200">
              <strong>Triggered Finding:</strong> {emergencyStopRule.explanation}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleProceedWithEmergencyStop}
              className="w-full sm:w-auto bg-white text-red-700 font-extrabold px-6 py-3.5 rounded-xl hover:bg-red-50 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>View Immediate Emergency Guidance</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => setEmergencyStopRule(null)}
              className="w-full sm:w-auto bg-red-800/80 text-red-100 font-medium px-4 py-3.5 rounded-xl hover:bg-red-800 text-xs text-center transition-colors"
            >
              Revise Previous Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl border text-center space-y-4">
        <p className="text-slate-600">Questionnaire completed. Evaluating clinical rules...</p>
        <button
          onClick={() => onCompleteIntake(answers, evaluateClinicalRuleEngine(scenario, answers))}
          className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          View Recommendation
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questionSequence.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Agent Visualizer */}
      <AgentHandoffVisualizer currentStage="intake" />

      {/* Intake Progress Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex-1 max-w-md space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Safety Screening Question {currentIndex + 1} of {questionSequence.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-sky-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <button
          onClick={() => setShowEditDrawer(!showEditDrawer)}
          className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg border border-sky-200 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Review Answers</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
            Agent 1: Safety & Intake Screening
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
            {question.questionText}
          </h2>
          {question.helpText && (
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>{question.helpText}</span>
            </p>
          )}
        </div>

        {/* Question Input Renderers */}
        <div className="space-y-3 pt-2">
          {question.type === 'radio' && (
            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((opt, i) => {
                const isSelected = currentVal === opt.value;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(question.id, opt.value)}
                    className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'checkbox' && (
            <div className="space-y-2.5">
              {question.options.map((opt, i) => {
                const arrVal: string[] = Array.isArray(currentVal) ? currentVal : [];
                const isChecked = arrVal.includes(opt.value);

                const toggleCheckbox = (val: string) => {
                  let updated: string[];
                  if (val === 'none') {
                    updated = ['none'];
                  } else {
                    const filtered = arrVal.filter(v => v !== 'none');
                    if (isChecked) {
                      updated = filtered.filter(v => v !== val);
                    } else {
                      updated = [...filtered, val];
                    }
                  }
                  handleSelectAnswer(question.id, updated);
                };

                return (
                  <button
                    key={i}
                    onClick={() => toggleCheckbox(opt.value)}
                    className={`w-full text-left p-3.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-sky-50 border-sky-500 text-sky-900'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isChecked ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'number' && (
            <div className="space-y-4">
              <input
                type="number"
                value={currentVal || ''}
                onChange={e => handleSelectAnswer(question.id, parseFloat(e.target.value))}
                placeholder="Enter age in years..."
                className="w-full p-4 rounded-xl border border-slate-300 text-base font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={handleNext}
                disabled={currentVal === undefined || isNaN(currentVal)}
                className="w-full bg-sky-600 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Answer Revision Drawer */}
      {showEditDrawer && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-sky-400" />
              <span>Answer Revision Drawer</span>
            </h3>
            <button
              onClick={() => setShowEditDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Drawer
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {questionSequence.map((qId, idx) => {
              const qObj = provider.getQuestionForPathway(scenario, qId);
              const val = answers[qObj?.id || ''];
              if (!qObj) return null;

              return (
                <div
                  key={qId}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowEditDrawer(false);
                  }}
                  className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors text-xs"
                >
                  <div>
                    <span className="text-slate-400 font-mono text-[10px]">Q{idx + 1}: </span>
                    <span className="font-medium text-slate-200">{qObj.questionText}</span>
                  </div>
                  <span className="font-bold text-sky-400 ml-2 bg-sky-950 px-2 py-1 rounded">
                    {Array.isArray(val) ? val.join(', ') : String(val || 'Unanswered')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
