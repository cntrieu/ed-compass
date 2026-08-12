import React, { useState } from 'react';
import { StoreService } from '../../services/storeService';
import { SyntheticEncounter } from '../../data/syntheticEncounters';
import { StaffReview, StaffDispositionAssessment } from '../../types/feedback';
import { GovernedImprovementView } from './GovernedImprovementView';
import { BarChart3, Filter, ShieldCheck, AlertTriangle, Eye, CheckCircle2, FileText, UserCheck, Stethoscope, MapPin, Globe, Compass, Users } from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encounters' | 'equity' | 'improvement'>('encounters');
  const [encounters, setEncounters] = useState<SyntheticEncounter[]>(StoreService.getEncounters());
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('all');
  const [selectedEncounter, setSelectedEncounter] = useState<SyntheticEncounter | null>(null);

  // Staff Review Form State
  const [reviewAppropriate, setReviewAppropriate] = useState<StaffDispositionAssessment>('Yes');
  const [reviewQuestions, setReviewQuestions] = useState<'Yes' | 'No' | 'Unsure'>('Yes');
  const [reviewExplanation, setReviewExplanation] = useState<'Yes' | 'No'>('Yes');
  const [reviewUnsafe, setReviewUnsafe] = useState(false);
  const [reviewTetanus, setReviewTetanus] = useState<'Yes' | 'No' | 'Unsure'>('Yes');
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const filteredEncounters = encounters.filter(e => {
    if (selectedScenario !== 'all' && e.scenario !== selectedScenario) return false;
    if (selectedDisposition !== 'all' && e.disposition !== selectedDisposition) return false;
    return true;
  });

  // Calculate Metrics
  const totalEncounters = encounters.length;
  const emergencyCount = encounters.filter(e => e.disposition === 'CALL_911_NOW' || e.disposition === 'GO_TO_ED_NOW').length;
  const emergencyRate = totalEncounters > 0 ? Math.round((emergencyCount / totalEncounters) * 100) : 0;

  const feedbackList = encounters.map(e => e.patientFeedback).filter(Boolean);
  const avgClarity = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + (f?.easyToUseScore || 0), 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const reviewsList = encounters.map(e => e.staffReview).filter(Boolean);
  const agreementCount = reviewsList.filter(r => r?.dispositionAppropriate === 'Yes').length;
  const agreementRate = reviewsList.length > 0 ? Math.round((agreementCount / reviewsList.length) * 100) : 100;

  const handleSaveStaffReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounter) return;

    const review: StaffReview = {
      id: `sr-${Date.now()}`,
      sessionId: selectedEncounter.sessionId,
      reviewerId: 'Dr. C. Patel, MD (Clinical Governance Lead)',
      dispositionAppropriate: reviewAppropriate,
      essentialQuestionsAsked: reviewQuestions,
      explanationClear: reviewExplanation,
      unsafeFlag: reviewUnsafe,
      tetanusAgreement: selectedEncounter.scenario === 'nail_puncture' ? reviewTetanus : undefined,
      feedbackText: reviewText,
      timestamp: new Date().toISOString()
    };

    StoreService.addStaffReview(review);
    setEncounters([...StoreService.getEncounters()]);
    setReviewSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Staff Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600 rounded-lg text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">DEMO STAFF & GOVERNANCE DASHBOARD</span>
              <span className="bg-sky-950 text-sky-400 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-800 uppercase">
                Synthetic Data Only
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Review synthetic patient interactions, evaluate access equity metrics, and track quality improvement proposals.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'encounters' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Encounter Log ({encounters.length})
          </button>

          <button
            onClick={() => setActiveTab('equity')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'equity' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Access & Equity Analytics
          </button>

          <button
            onClick={() => setActiveTab('improvement')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeTab === 'improvement' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            QI Board
          </button>
        </div>
      </div>

      {activeTab === 'improvement' && <GovernedImprovementView />}

      {activeTab === 'equity' && (
        <div className="space-y-6">
          {/* Equity Section Banner */}
          <div className="bg-purple-950 text-white rounded-xl p-5 border border-purple-800 space-y-2 shadow-md">
            <h2 className="text-xl font-bold flex items-center gap-2 text-purple-300">
              <Globe className="w-6 h-6 text-purple-400" />
              <span>Access & Geographic Equity Analytics</span>
            </h2>
            <p className="text-xs text-purple-200 leading-relaxed max-w-3xl">
              Demonstrating the core architectural principle: <strong>Clinical appropriateness and healthcare accessibility are related but distinct.</strong> Clinical urgency remains unchanged, but patient ability to follow recommendations varies significantly by rurality and transportation burden.
            </p>
            <div className="bg-black/30 px-3 py-1 rounded text-[11px] font-mono text-purple-300 w-fit border border-purple-800">
              SYNTHETIC DEMONSTRATION DATA — not real patient outcomes.
            </div>
          </div>

          {/* Synthetic Visualization Comparison Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-600" />
              <span>Demonstration Comparison: Ability to Follow "Same-Day Assessment" Recommendation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Urban Demo */}
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 text-sm">Metropolitan / Urban Demo Group</span>
                  <span className="text-2xl font-black text-emerald-600">92%</span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  92% of urban synthetic patients were able to follow the recommended same-day in-person clinic assessment. Low travel burden (&lt;15 mins) and high transit availability.
                </p>
              </div>

              {/* Remote Demo */}
              <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 text-sm">Remote / Rural Demo Group</span>
                  <span className="text-2xl font-black text-amber-600">61%</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-3">
                  <div className="bg-amber-600 h-3 rounded-full" style={{ width: '61%' }}></div>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Only 61% of remote synthetic patients were able to follow the recommended same-day in-person assessment. Primary barriers: travel time &gt;60 mins, lack of transportation, and clinic closures.
                </p>
              </div>
            </div>
          </div>

          {/* Equity Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-4 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 text-sm">Encounters by Rurality</span>
              <ul className="space-y-1 text-slate-600">
                <li className="flex justify-between"><span>Metropolitan:</span> <strong>42%</strong></li>
                <li className="flex justify-between"><span>Rural Hub:</span> <strong>31%</strong></li>
                <li className="flex justify-between"><span>Remote:</span> <strong>27%</strong></li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 text-sm">Virtual Options & First Nations</span>
              <ul className="space-y-1 text-slate-600">
                <li className="flex justify-between"><span>Virtual Care Offered:</span> <strong>48%</strong></li>
                <li className="flex justify-between"><span>FNHA Virtual Doctor Requested:</span> <strong>24%</strong></li>
                <li className="flex justify-between"><span>Interpreter Requested:</span> <strong>12%</strong></li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-xl border space-y-2">
              <span className="font-bold text-slate-800 text-sm">Reported Access Barriers</span>
              <ul className="space-y-1 text-slate-600">
                <li className="flex justify-between"><span>Distance / Travel Time:</span> <strong>38%</strong></li>
                <li className="flex justify-between"><span>No Transport:</span> <strong>22%</strong></li>
                <li className="flex justify-between"><span>Clinic Closed:</span> <strong>19%</strong></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'encounters' && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Encounters</span>
              <div className="text-2xl font-black text-slate-900">{totalEncounters}</div>
              <span className="text-[10px] text-slate-400">Synthetic Encounters</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Emergency Rate</span>
              <div className="text-2xl font-black text-red-600">{emergencyRate}%</div>
              <span className="text-[10px] text-slate-400">{emergencyCount} 911/ED Escalations</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Clarity Score</span>
              <div className="text-2xl font-black text-sky-600">{avgClarity} / 5.0</div>
              <span className="text-[10px] text-slate-400">Patient Understanding</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Staff Agreement Rate</span>
              <div className="text-2xl font-black text-emerald-600">{agreementRate}%</div>
              <span className="text-[10px] text-slate-400">Clinical Triage Alignment</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>Filter Encounters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
              >
                <option value="all">All Scenarios</option>
                <option value="nail_puncture">Stepping on a Nail</option>
                <option value="headache">Headache Red Flags</option>
                <option value="fever">Fever & Systemic Risk</option>
              </select>

              <select
                value={selectedDisposition}
                onChange={e => setSelectedDisposition(e.target.value)}
                className="p-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
              >
                <option value="all">All Dispositions</option>
                <option value="CALL_911_NOW">CALL_911_NOW</option>
                <option value="GO_TO_ED_NOW">GO_TO_ED_NOW</option>
                <option value="SAME_DAY_CLINICAL_ASSESSMENT">SAME_DAY_CLINICAL_ASSESSMENT</option>
                <option value="CONTACT_811_OR_PRIMARY_CARE">CONTACT_811_OR_PRIMARY_CARE</option>
                <option value="HOME_MONITOR_WITH_SAFETY_NET">HOME_MONITOR_WITH_SAFETY_NET</option>
              </select>
            </div>
          </div>

          {/* Table & Inspection Drawer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Encounter Table */}
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="py-3 px-3">Session ID</th>
                      <th className="py-3 px-3">Scenario</th>
                      <th className="py-3 px-3">Disposition</th>
                      <th className="py-3 px-3">Rule ID</th>
                      <th className="py-3 px-3">Staff Review</th>
                      <th className="py-3 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEncounters.map(enc => (
                      <tr key={enc.sessionId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-800">{enc.sessionId}</td>
                        <td className="py-3 px-3 capitalize font-semibold text-slate-600">
                          {enc.scenario.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                              enc.disposition.includes('911') || enc.disposition.includes('ED')
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : enc.disposition.includes('SAME_DAY')
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {enc.disposition}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-sky-700 font-semibold">{enc.ruleId}</td>
                        <td className="py-3 px-3">
                          {enc.staffReview ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Reviewed
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded border">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedEncounter(enc);
                              setReviewSubmitted(false);
                            }}
                            className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 justify-end ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Encounter Detail & Staff Review Drawer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm max-h-[600px] overflow-y-auto">
              {selectedEncounter ? (
                <div className="space-y-4 text-xs">
                  <div className="border-b pb-3 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">Session ID: {selectedEncounter.sessionId}</span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Encounter Inspection & Staff Review
                    </h3>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {selectedEncounter.ruleId} (v{selectedEncounter.ruleVersion})
                      </span>
                      <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        {selectedEncounter.disposition}
                      </span>
                    </div>
                  </div>

                  {/* Patient Answers Summary */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Structured Patient Answers:
                    </span>
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(selectedEncounter.patientAnswers, null, 2)}
                    </pre>
                  </div>

                  {/* Rule Rationale */}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Clinical Rule Rationale:</span>
                    <p className="bg-slate-50 p-2.5 rounded-lg border text-slate-700 leading-relaxed text-[11px]">
                      {selectedEncounter.rationale}
                    </p>
                  </div>

                  {/* Staff Review Form */}
                  <form onSubmit={handleSaveStaffReview} className="border-t pt-3 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      <span>Submit Staff Clinical Review</span>
                    </h4>

                    {reviewSubmitted && (
                      <div className="bg-emerald-50 text-emerald-800 p-2 rounded text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Staff review saved!
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">Was the disposition appropriate?</label>
                      <select
                        value={reviewAppropriate}
                        onChange={e => setReviewAppropriate(e.target.value as any)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300"
                      >
                        <option value="Yes">Yes — Appropriate</option>
                        <option value="Too cautious">Too cautious</option>
                        <option value="Potentially too low">Potentially too low</option>
                        <option value="Unsure">Unsure</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-700">Were essential clinical questions asked?</label>
                      <select
                        value={reviewQuestions}
                        onChange={e => setReviewQuestions(e.target.value as any)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Unsure">Unsure</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-sky-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-sky-700 shadow"
                    >
                      Save Staff Review
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Select an encounter from the table to inspect details and submit a staff clinical review.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
