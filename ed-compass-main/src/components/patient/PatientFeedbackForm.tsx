import React, { useState } from 'react';
import { ClinicalPathwayId, Disposition } from '../../types/clinical';
import { PatientFeedback } from '../../types/feedback';
import { StoreService } from '../../services/storeService';
import { AgentHandoffVisualizer } from '../common/AgentHandoffVisualizer';
import { MessageSquareHeart, ThumbsUp, ThumbsDown, CheckCircle2, Send, Star, ShieldCheck } from 'lucide-react';

interface PatientFeedbackFormProps {
  sessionId: string;
  scenario: ClinicalPathwayId;
  disposition: Disposition;
  ruleId: string;
  ruleVersion: string;
  onFeedbackSubmitted: () => void;
}

export const PatientFeedbackForm: React.FC<PatientFeedbackFormProps> = ({
  sessionId,
  scenario,
  disposition,
  ruleId,
  ruleVersion,
  onFeedbackSubmitted
}) => {
  const [easyToUseScore, setEasyToUseScore] = useState(5);
  const [nextStepClear, setNextStepClear] = useState<'Yes' | 'Mostly' | 'No'>('Yes');
  const [rationaleUnderstood, setRationaleUnderstood] = useState<'Yes' | 'Mostly' | 'No'>('Yes');
  const [confidenceScore, setConfidenceScore] = useState(5);
  const [canFollowRecommendation, setCanFollowRecommendation] = useState<'Yes' | 'Maybe' | 'No'>('Yes');
  const [careOptionsRealistic, setCareOptionsRealistic] = useState<'Yes' | 'Mostly' | 'No'>('Yes');
  const [languageEasyToUnderstand, setLanguageEasyToUnderstand] = useState<'Yes' | 'Mostly' | 'No'>('Yes');
  const [culturallyRespectful, setCulturallyRespectful] = useState<'Yes' | 'Mostly' | 'No' | 'Prefer not to answer'>('Yes');
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>([]);
  const [confusingComments, setConfusingComments] = useState('');
  const [thumbs, setThumbs] = useState<'thumbs_up' | 'thumbs_down' | undefined>('thumbs_up');
  const [submitted, setSubmitted] = useState(false);

  const toggleBarrier = (barrier: string) => {
    if (selectedBarriers.includes(barrier)) {
      setSelectedBarriers(selectedBarriers.filter(b => b !== barrier));
    } else {
      setSelectedBarriers([...selectedBarriers, barrier]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const feedback: PatientFeedback = {
      sessionId,
      scenario,
      disposition,
      ruleId,
      ruleVersion,
      easyToUseScore,
      nextStepClear,
      rationaleUnderstood,
      confidenceScore,
      canFollowRecommendation,
      careOptionsRealistic,
      languageEasyToUnderstand,
      culturallyRespectful,
      reportedBarriers: selectedBarriers,
      confusingOrMissingComments: confusingComments,
      thumbsUpOrDown: thumbs,
      timestamp: new Date().toISOString()
    };

    StoreService.addPatientFeedback(feedback);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8 text-center animate-fade-in">
        <AgentHandoffVisualizer
          currentStage="feedback"
          ruleId={ruleId}
          ruleVersion={ruleVersion}
        />

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Thank You for Your Feedback!</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your evaluation has been attached to Session <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sky-700 font-mono">{sessionId}</code> and fed into the <strong>Human-Governed Quality Improvement Store</strong>.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border text-xs text-slate-500 max-w-sm mx-auto">
            <strong>Governance Note:</strong> Patient feedback is aggregated for review by health informatics staff. Feedback never automatically modifies clinical decision rules.
          </div>

          <div className="pt-4">
            <button
              onClick={onFeedbackSubmitted}
              className="bg-sky-600 text-white font-bold px-6 py-3 rounded-xl shadow hover:bg-sky-700 transition-colors text-xs"
            >
              Return to ED Compass Landing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <AgentHandoffVisualizer
        currentStage="feedback"
        ruleId={ruleId}
        ruleVersion={ruleVersion}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1 border-b pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100 inline-block">
            Agent 3: Feedback & Quality Evaluation
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareHeart className="w-6 h-6 text-purple-600" />
            <span>Was the Guidance Understandable & Realistic?</span>
          </h2>
          <p className="text-xs text-slate-500">
            Help our health informatics team improve ED Compass safety, care navigation, and language accessibility.
          </p>
        </div>

        {/* 1. Ease of Use */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">How easy was this tool to use? (1 = Very Hard, 5 = Very Easy)</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setEasyToUseScore(star)}
                className={`p-3 rounded-xl border flex-1 font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                  easyToUseScore === star
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Star className={`w-4 h-4 ${easyToUseScore >= star ? 'fill-current' : ''}`} />
                <span>{star}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Care Options Realism */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">Were the care options realistic for where you live?</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Yes', 'Mostly', 'No'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setCareOptionsRealistic(opt)}
                className={`py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                  careOptionsRealistic === opt
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Language Clarity */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">Was the language used easy to understand?</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Yes', 'Mostly', 'No'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setLanguageEasyToUnderstand(opt)}
                className={`py-2.5 rounded-xl border font-semibold text-xs transition-all ${
                  languageEasyToUnderstand === opt
                    ? 'bg-sky-600 text-white border-sky-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Cultural Safety & Respect */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">Did the care options feel respectful of your needs and preferences?</label>
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            {(['Yes', 'Mostly', 'No', 'Prefer not to answer'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setCulturallyRespectful(opt)}
                className={`py-2.5 px-1 rounded-xl border font-semibold transition-all ${
                  culturallyRespectful === opt
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Access Barriers Checklist */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">Did you encounter any access barriers?</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'distance', label: 'Rural distance / travel time' },
              { id: 'transportation', label: 'Transportation / No car' },
              { id: 'weather', label: 'Severe weather / road conditions' },
              { id: 'childcare', label: 'Childcare / caregiving' },
              { id: 'mobility', label: 'Mobility / disability barrier' },
              { id: 'language', label: 'Language / communication' },
              { id: 'cost', label: 'Cost / financial barrier' },
              { id: 'trust', label: 'Cultural safety / trust concerns' }
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBarrier(b.label)}
                className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                  selectedBarriers.includes(b.label)
                    ? 'bg-purple-50 border-purple-500 text-purple-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Comments */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-800">Was anything confusing or missing? (Optional comment)</label>
          <textarea
            rows={3}
            value={confusingComments}
            onChange={e => setConfusingComments(e.target.value)}
            placeholder="Share any thoughts on clarity, language, or care navigation..."
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Thumbs Up / Down */}
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-xs font-bold text-slate-700">Overall Rating:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setThumbs('thumbs_up')}
              className={`p-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                thumbs === 'thumbs_up' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful</span>
            </button>
            <button
              type="button"
              onClick={() => setThumbs('thumbs_down')}
              className={`p-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all ${
                thumbs === 'thumbs_down' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Needs Improvement</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-extrabold py-3.5 rounded-xl shadow hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Send className="w-4 h-4" />
          <span>Submit Feedback to Governance Store</span>
        </button>
      </form>
    </div>
  );
};
