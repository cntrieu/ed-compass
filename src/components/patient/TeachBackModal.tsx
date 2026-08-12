import React, { useState } from 'react';
import { Disposition } from '../../types/clinical';
import { SupportedLocale } from '../../types/i18n';
import { HelpCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface TeachBackModalProps {
  recommendedDisposition: Disposition;
  locale?: SupportedLocale;
  onProceedToFeedback: () => void;
}

export const TeachBackModal: React.FC<TeachBackModalProps> = ({
  recommendedDisposition,
  locale = 'en',
  onProceedToFeedback
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);

    // Check if patient selected a lower-acuity plan than recommended
    const isHigherRecommendation = recommendedDisposition === 'CALL_911_NOW' || recommendedDisposition === 'GO_TO_ED_NOW';
    const isLowerPlan = plan === 'home_monitor' || plan === 'wait_and_see' || plan === 'call_811_later';

    if (isHigherRecommendation && isLowerPlan) {
      setShowMismatchWarning(true);
    } else {
      setShowMismatchWarning(false);
    }
  };

  const isFrench = locale === 'fr';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-2 border-b pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
            Agent 2 Teach-Back Verification
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-sky-600" />
            <span>
              {isFrench
                ? "Vérification de compréhension (Teach-Back)"
                : "Teach-Back Comprehension Check"}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {isFrench
              ? "Pour s'assurer que j'ai expliqué cette recommandation clairement, **que prévoyez-vous faire ensuite?**"
              : "To make sure I explained this recommendation clearly, **what are you planning to do next?**"}
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              label: isFrench
                ? 'Appeler le 9-1-1 ou aller directement aux urgences'
                : 'Call 9-1-1 or go directly to the Emergency Department',
              value: 'ed_now'
            },
            {
              label: isFrench
                ? 'Consulter un centre de soins d urgence ou une clinique sans rendez-vous aujourd hui'
                : 'Visit an Urgent and Primary Care Centre or walk-in clinic today',
              value: 'same_day'
            },
            {
              label: isFrench
                ? 'Appeler HealthLink BC au 8-1-1 ou consulter mon médecin de famille'
                : 'Call HealthLink BC at 8-1-1 or see my family doctor',
              value: 'call_811'
            },
            {
              label: isFrench
                ? 'Me reposer et surveiller mes symptômes à la maison'
                : 'Rest and monitor my symptoms at home',
              value: 'home_monitor'
            },
            {
              label: isFrench
                ? 'Attendre quelques jours pour voir si les symptômes s améliorent'
                : 'Wait a few days to see if symptoms improve',
              value: 'wait_and_see'
            }
          ].map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPlan(opt.value)}
              className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                selectedPlan === opt.value
                  ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Safety Warning for Mismatched Lower-Acuity Plan */}
        {showMismatchWarning && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-xs sm:text-sm text-red-900 space-y-2 animate-shake">
            <div className="font-bold flex items-center gap-2 text-red-950">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Clarification Required — High Urgency Recommendation</span>
            </div>
            <p>
              {isFrench
                ? "La recommandation est d être évalué aux urgences maintenant plutôt que d attendre à demain."
                : `You selected a home or delayed care option, but your assessment identified warning signs requiring emergency care (${recommendedDisposition.replace(/_/g, ' ')}).`}
            </p>
            <p className="font-semibold text-red-950 bg-red-100 p-2 rounded border border-red-200">
              Note: ED Compass preserves your original clinical disposition and cannot downgrade emergency guidance. Please consider seeking emergency care immediately.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onProceedToFeedback}
            disabled={!selectedPlan}
            className="w-full sm:w-auto bg-sky-600 disabled:bg-slate-300 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>Proceed to Service Feedback</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
