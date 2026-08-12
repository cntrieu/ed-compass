import React, { useState } from 'react';
import { ImprovementItem, ImprovementStatus } from '../../types/feedback';
import { StoreService } from '../../services/storeService';
import { ShieldCheck, Plus, ArrowRight, CheckCircle2, Clock, GitBranch, AlertTriangle } from 'lucide-react';

const STATUS_COLUMNS: { status: ImprovementStatus; label: string; color: string }[] = [
  { status: 'NEW', label: 'New Feedback Topic', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  { status: 'UNDER_REVIEW', label: 'Under Review', color: 'bg-sky-100 border-sky-300 text-sky-900' },
  { status: 'CLINICAL_REVIEW', label: 'Clinical Governance Review', color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { status: 'APPROVED_FOR_TESTING', label: 'Approved for Testing', color: 'bg-purple-100 border-purple-300 text-purple-900' },
  { status: 'IMPLEMENTED', label: 'Implemented & Released', color: 'bg-emerald-100 border-emerald-300 text-emerald-900' }
];

export const GovernedImprovementView: React.FC = () => {
  const [items, setItems] = useState<ImprovementItem[]>(StoreService.getImprovementItems());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTheme, setNewTheme] = useState('');
  const [newScenario, setNewScenario] = useState<'nail_puncture' | 'headache' | 'fever'>('nail_puncture');
  const [newProposedChange, setNewProposedChange] = useState('');

  const handleStatusChange = (id: string, nextStatus: ImprovementStatus) => {
    StoreService.updateImprovementStatus(id, nextStatus, 'Dr. C. Patel (Clinical Governance Lead)');
    setItems([...StoreService.getImprovementItems()]);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme || !newProposedChange) return;

    StoreService.createImprovementItem({
      sourceSessionId: `manual-prop-${Date.now()}`,
      scenario: newScenario,
      feedbackTheme: newTheme,
      currentRuleVersion: '1.0',
      proposedChange: newProposedChange,
      status: 'NEW',
      reviewer: 'Staff Panel Submission'
    });

    setItems([...StoreService.getImprovementItems()]);
    setShowCreateModal(false);
    setNewTheme('');
    setNewProposedChange('');
  };

  return (
    <div className="space-y-6">
      {/* Governance Notice Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex items-start gap-3 shadow-sm text-xs sm:text-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-white text-base">Governed Quality Improvement Process</strong>
          <p className="text-slate-300 leading-relaxed">
            Patient and staff feedback feed into this human-governed improvement workflow. <strong>Feedback NEVER automatically changes live clinical rules.</strong> Any rule change requires formal clinical review, testing against regression suites, and versioned approval.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-sky-600" />
          <span>Quality Improvement Proposal Board</span>
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Improvement Item</span>
        </button>
      </div>

      {/* Columns Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map(col => {
          const colItems = items.filter(i => i.status === col.status);
          return (
            <div key={col.status} className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
              <div className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between ${col.color}`}>
                <span>{col.label}</span>
                <span className="bg-white/60 px-1.5 py-0.5 rounded font-mono text-[10px]">{colItems.length}</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {colItems.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{item.id}</span>
                      <span className="uppercase text-sky-700 font-bold">{item.scenario.replace('_', ' ')}</span>
                    </div>

                    <div className="font-bold text-slate-900 text-xs">{item.feedbackTheme}</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2 rounded border">
                      {item.proposedChange}
                    </p>

                    <div className="text-[10px] text-slate-400 border-t pt-1.5 flex items-center justify-between">
                      <span>Reviewer: {item.reviewer.split(' ')[0]}</span>
                      {col.status !== 'IMPLEMENTED' && (
                        <button
                          onClick={() => {
                            const nextIdx = STATUS_COLUMNS.findIndex(c => c.status === col.status) + 1;
                            if (nextIdx < STATUS_COLUMNS.length) {
                              handleStatusChange(item.id, STATUS_COLUMNS[nextIdx].status);
                            }
                          }}
                          className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-0.5"
                        >
                          <span>Advance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colItems.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-[11px]">No items in state</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proposal Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProposal} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl border">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Propose Quality Improvement Item</h3>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Clinical Scenario</label>
              <select
                value={newScenario}
                onChange={e => setNewScenario(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              >
                <option value="nail_puncture">Stepping on a Nail</option>
                <option value="headache">Headache Red-Flag Screening</option>
                <option value="fever">Fever & Systemic Risk</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Feedback Theme / Access Barrier</label>
              <input
                type="text"
                value={newTheme}
                onChange={e => setNewTheme(e.target.value)}
                placeholder="e.g. Rural Travel Barrier, Plain-language improvement..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Proposed Rule or Navigation Change</label>
              <textarea
                rows={3}
                value={newProposedChange}
                onChange={e => setNewProposedChange(e.target.value)}
                placeholder="Detail the suggested enhancement to clinical rules or care navigation..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow"
              >
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
