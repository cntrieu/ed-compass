import React, { useState } from 'react';
import { AuditService } from '../../services/auditService';
import { AuditEvent } from '../../types/audit';
import { History, Search, Filter, ShieldCheck, Terminal } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const events = AuditService.getEvents();
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [filterSession, setFilterSession] = useState('');

  const filteredEvents = events.filter(e =>
    !filterSession || e.sessionId.toLowerCase().includes(filterSession.toLowerCase()) || e.eventType.toLowerCase().includes(filterSession.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/30 rounded-lg text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System Audit & Decision Provenance Trail</h2>
            <p className="text-xs text-slate-400">
              Reproducible audit logs tracking every question answered, emergency stop, rule evaluation, and feedback action.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-purple-400 bg-purple-950 px-3 py-1 rounded border border-purple-800">
          Total Logs: {events.length}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterSession}
            onChange={e => setFilterSession(e.target.value)}
            placeholder="Filter by Session ID or Event Type..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Table of Events */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEvents.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 text-[11px]">
                        {e.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{e.sessionId}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(e)}
                        className="text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Drawer */}
        <div className="bg-slate-950 text-white rounded-xl p-4 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-200">Event Payload Inspection</h3>
          </div>

          {selectedEvent ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-mono text-[10px]">Event ID: </span>
                <span className="font-mono text-purple-300">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px]">Session ID: </span>
                <span className="font-mono text-sky-300">{selectedEvent.sessionId}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px]">Event Type: </span>
                <span className="font-bold text-emerald-400">{selectedEvent.eventType}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-mono text-[10px]">JSON Payload Details:</span>
                <pre className="bg-slate-900 p-3 rounded-lg text-[10px] font-mono text-emerald-300 border border-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select an event from the table to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
