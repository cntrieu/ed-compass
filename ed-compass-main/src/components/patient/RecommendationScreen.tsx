import React, { useState } from 'react';
import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { PatientAccessContext, AccessEngineOutput } from '../../types/access';
import { Agent1IntakeHandoff } from '../../types/agent';
import { LocalDemoAgentProvider } from '../../agents/localDemoAgentProvider';
import { SupportedLocale } from '../../types/i18n';
import { applyPlainLanguageFilter, getTranslation } from '../../locales';
import { AgentHandoffVisualizer } from '../common/AgentHandoffVisualizer';
import { AlertOctagon, ShieldAlert, CheckCircle2, Clock, MapPin, Phone, ExternalLink, HelpCircle, ArrowRight, Syringe, Bandage, Navigation, AlertTriangle, Video } from 'lucide-react';

interface RecommendationScreenProps {
  scenario: ClinicalPathwayId;
  answers: PatientAnswers;
  ruleOutput: DeterministicRuleOutput;
  accessContext?: PatientAccessContext;
  locale: SupportedLocale;
  isPlainLanguageMode: boolean;
  onProceedToAccessNavigation?: () => void;
  onProceedToTeachBack: () => void;
}

export const RecommendationScreen: React.FC<RecommendationScreenProps> = ({
  scenario,
  answers,
  ruleOutput,
  accessContext,
  locale,
  isPlainLanguageMode,
  onProceedToAccessNavigation,
  onProceedToTeachBack
}) => {
  const provider = new LocalDemoAgentProvider();
  const handoff: Agent1IntakeHandoff = {
    sessionId: `session-${Date.now()}`,
    scenario,
    answers,
    missingFields: [],
    uncertainties: [],
    emergencyStopDetected: false,
    preferredLanguage: locale,
    interpreterNeeded: false,
    agentVersion: 'intake-v1.1',
    timestamp: new Date().toISOString()
  };

  const agent2Output = provider.generateNavigationExplanation(handoff, ruleOutput, accessContext);
  const accessEngine: AccessEngineOutput | undefined = agent2Output.accessEngineOutput;

  const plainRationale = applyPlainLanguageFilter(ruleOutput.explanation, isPlainLanguageMode);

  const getUrgencyBannerClass = () => {
    switch (ruleOutput.disposition) {
      case 'CALL_911_NOW':
        return 'bg-red-600 border-red-700 text-white';
      case 'GO_TO_ED_NOW':
        return 'bg-red-600 border-red-700 text-white';
      case 'SAME_DAY_CLINICAL_ASSESSMENT':
        return 'bg-amber-500 border-amber-600 text-slate-900';
      case 'CONTACT_811_OR_PRIMARY_CARE':
        return 'bg-sky-600 border-sky-700 text-white';
      case 'HOME_MONITOR_WITH_SAFETY_NET':
        return 'bg-emerald-600 border-emerald-700 text-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Agent Visualizer */}
      <AgentHandoffVisualizer
        currentStage="navigation"
        ruleId={ruleOutput.ruleId}
        ruleVersion={ruleOutput.ruleVersion}
      />

      {/* Main Urgency Header Banner */}
      <div className={`rounded-2xl p-6 sm:p-8 border shadow-lg ${getUrgencyBannerClass()} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold tracking-wider uppercase bg-black/20 px-3 py-1 rounded-full">
            {(scenario === 'fever' || scenario === 'headache') && ruleOutput.ctasLevel
              ? `CTAS-inspired Urgency Estimate: Level ${ruleOutput.ctasLevel}`
              : `Deterministic Decision Output (Rule ${ruleOutput.ruleId} v${ruleOutput.ruleVersion})`}
          </span>
          <span className="text-xs font-semibold uppercase flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Timeframe: {ruleOutput.timing}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
          {agent2Output.displayTitle}
        </h1>

        <p className="text-sm sm:text-base opacity-95 font-medium leading-relaxed">
          {agent2Output.displaySubtitle}
        </p>

        <div className="bg-black/20 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{agent2Output.conceptualHandoffNotice}</span>
        </div>
      </div>

      {/* Rust Rule Explanation Banner */}
      {scenario === 'nail_puncture' && answers.rusty === 'Yes' && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 text-xs sm:text-sm leading-relaxed space-y-1 shadow-sm">
          <strong className="font-bold flex items-center gap-1.5 text-amber-950">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            Important Clinical Note Regarding Rusty Nails:
          </strong>
          <p>
            You reported that the nail looked rusty. Please note: <strong>Rust itself does not cause tetanus and has zero decision weight in this clinical recommendation.</strong> Tetanus is caused by bacterial spores found in soil, dirt, and dust. The key factors determining your recommendation are puncture wound depth, contamination, footwear penetration, and your reported vaccination history.
          </p>
        </div>
      )}

      {/* Nail Pathway Dual Output Boxes */}
      {scenario === 'nail_puncture' && ruleOutput.tetanusOutcome ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b pb-2 text-sm">
              <Bandage className="w-5 h-5 text-sky-600" />
              <span>WOUND URGENCY ASSESSMENT</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-800 text-sm">{ruleOutput.destinationType}</div>
              <p className="text-slate-600 leading-relaxed">{plainRationale}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 border-b pb-2 text-sm">
              <Syringe className="w-5 h-5 text-purple-600" />
              <span>BCCDC TETANUS PROPHYLAXIS ASSESSMENT</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-700">Tetanus Vaccine: </span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {ruleOutput.tetanusOutcome.vaccineRecommendation.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Tetanus Immune Globulin (TIg): </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {ruleOutput.tetanusOutcome.tigRecommendation.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                {ruleOutput.tetanusOutcome.explanation}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-sky-600" />
            <span>Why This Recommendation Was Selected</span>
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {plainRationale}
          </p>

          {ruleOutput.triggeredBy && ruleOutput.triggeredBy.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-600 block mb-1.5">Key patient-reported findings:</span>
              <div className="flex flex-wrap gap-1.5">
                {ruleOutput.triggeredBy
                  .filter((t) => t && t !== 'none' && t !== 'NONE_OF_THESE' && t !== 'null' && t !== 'false')
                  .map((t, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium">
                      {t}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Frameworks Applied Section */}
      {ruleOutput.frameworksApplied && ruleOutput.frameworksApplied.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            <span>Clinical Frameworks Applied</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {ruleOutput.frameworksApplied.map((fw, idx) => (
              <span key={idx} className="bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold px-3 py-1.5 rounded-lg">
                {fw}
              </span>
            ))}
          </div>
          {ruleOutput.mcIsaacScore !== undefined && (
            <p className="text-xs text-slate-600 pt-1">
              Calculated McIsaac sore throat score: <strong>{ruleOutput.mcIsaacScore}</strong>
            </p>
          )}
        </div>
      )}

      {/* CTAS Prototype Disclaimer */}
      {(scenario === 'fever' || scenario === 'headache') && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-slate-700 text-xs leading-relaxed space-y-1">
          <strong className="font-bold text-slate-900 block">CTAS Prototype Disclaimer:</strong>
          <p>
            This prototype does not assign an official CTAS level. Official CTAS levels are assigned by trained emergency-department clinicians after an assessment.
          </p>
        </div>
      )}

      {/* Safety Net Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <span>Safety Net: What to Watch For & When to Escalate Care</span>
        </h3>
        <p className="text-xs text-amber-900 font-medium leading-relaxed bg-amber-100/60 p-3 rounded-lg border border-amber-200/80">
          This recommendation is based only on the information entered and may not identify every serious condition. Seek urgent reassessment if symptoms worsen or new symptoms appear. Seek emergency assistance (call 9-1-1 or go to the nearest emergency department) for new serious symptoms such as new confusion, difficulty waking, severe breathing difficulty, severe chest pain, seizure, severe headache with neck stiffness, non-blanching purple rash, fainting, or inability to drink or swallow fluids.
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-amber-900 pt-1">
          {ruleOutput.safetyNet.map((net, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{applyPlainLanguageFilter(net, isPlainLanguageMode)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ACCESS-AWARE CARE NAVIGATION SECTION */}
      {!accessContext ? (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Navigation className="w-4 h-4" />
            <span>Access & Service Matching Engine (Optional)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Find Local Care Facilities & Virtual Service Options
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Your recommended course of action has been determined above. You can optionally enter your general location or travel preferences to view nearby, capable care facilities and BC virtual care options without altering your clinical urgency.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {onProceedToAccessNavigation && (
              <button
                onClick={onProceedToAccessNavigation}
                className="w-full sm:w-auto bg-sky-500 text-slate-950 font-extrabold text-sm px-6 py-3.5 rounded-xl hover:bg-sky-400 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Find Local Care & Service Options</span>
              </button>
            )}

            <button
              onClick={onProceedToTeachBack}
              className="w-full sm:w-auto bg-slate-800 text-slate-200 font-semibold text-xs px-5 py-3.5 rounded-xl hover:bg-slate-700 transition-colors text-center"
            >
              <span>Skip & Complete Teach-Back / Feedback</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 space-y-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Navigation className="w-4 h-4" />
                <span>Finding care that works where you are</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Access-Aware Navigation & Service Matching
              </h2>
              <p className="text-xs text-slate-400">
                Recommending realistic, capable care options tailored to your location, travel burden, and preference options.
              </p>
            </div>

            {onProceedToAccessNavigation && (
              <button
                onClick={onProceedToAccessNavigation}
                className="text-xs font-semibold text-sky-300 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors self-start sm:self-center shrink-0"
              >
                Change Location / Travel Options
              </button>
            )}
          </div>

          {/* Access Context Summary Box */}
          {accessEngine && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h3 className="font-bold text-sky-300 text-sm">Your Access Context:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Community:</span>
                  <span className="font-bold text-slate-200">{accessEngine.accessContext.communityName || 'BC Community'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Rurality Category:</span>
                  <span className="font-bold text-amber-400">{accessEngine.accessContext.rurality}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">Est. Travel Time:</span>
                  <span className="font-bold text-slate-200">{accessEngine.accessContext.travelTimeCategory.replace(/_/g, ' ')}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">First Nations Options:</span>
                  <span className="font-bold text-purple-400">{accessEngine.accessContext.firstNationsServicesRequested ? 'Requested' : 'Standard'}</span>
                </div>
              </div>

              {/* Virtual Care Assessment Notice */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs flex items-start gap-2">
                <Video className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200">Virtual Care Assessment:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {accessEngine.virtualCareExplanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Care Options List */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Ranked Care Options & Services:</h3>

            <div className="space-y-3">
              {accessEngine?.navigationOptions.map((fac) => (
                <div key={fac.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-base">{fac.name}</span>
                        {fac.isVirtual ? (
                          <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            VIRTUAL
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            IN PERSON
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] font-semibold">{fac.provider} ({fac.facilityType})</span>
                    </div>

                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {fac.isOpenNow ? 'OPEN NOW' : 'HOURS NOT VERIFIED'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-[11px]">
                    {fac.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {fac.address}, {fac.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-bold text-sky-400">
                      <Phone className="w-3.5 h-3.5" />
                      {fac.phone === '8-1-1' || fac.phone.startsWith('1-8') ? (
                        <a href={`tel:${fac.phone}`} className="underline hover:text-sky-300">{fac.phone}</a>
                      ) : (
                        fac.phone
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {fac.hours}
                    </span>
                  </div>

                  {fac.eligibilityNotes && (
                    <p className="text-purple-300 bg-purple-950/60 p-2 rounded border border-purple-800/80 text-[11px]">
                      ℹ️ <strong>Eligibility:</strong> {fac.eligibilityNotes}
                    </p>
                  )}

                  {fac.unverifiedWarning && (
                    <p className="text-amber-300 bg-amber-950/60 p-2 rounded border border-amber-800/80 text-[11px]">
                      ⚠️ {fac.unverifiedWarning}
                    </p>
                  )}

                  {/* Capability Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(fac.capabilities).map(([cap, status]) => (
                      <span
                        key={cap}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {cap}: {status}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <a
                href="https://www.healthlinkbc.ca/health-services/search"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
              >
                <span>Search Official HealthLink BC Directory</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Action Button to Teach-Back Check */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onProceedToTeachBack}
          className="w-full sm:w-auto bg-sky-600 text-white font-extrabold text-sm px-8 py-4 rounded-xl shadow-md hover:bg-sky-700 transition-all flex items-center justify-center gap-2"
        >
          <span>Complete Teach-Back & Feedback</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
