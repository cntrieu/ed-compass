import React, { useState } from 'react';
import { PatientAccessContext, TravelTimeCategory } from '../../types/access';
import { LocalDemoLocationProvider } from '../../services/locationProvider';
import { AuditService } from '../../services/auditService';
import { MapPin, Navigation, Compass, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface AccessLocationStepProps {
  sessionId: string;
  onCompleteAccessContext: (accessContext: PatientAccessContext) => void;
  onSkipAccessContext?: () => void;
}

export const AccessLocationStep: React.FC<AccessLocationStepProps> = ({
  sessionId,
  onCompleteAccessContext,
  onSkipAccessContext
}) => {
  const locationProvider = new LocalDemoLocationProvider();

  const [locationMethod, setLocationMethod] = useState<'geolocation' | 'postal' | 'community' | 'skipped'>('community');
  const [manualInput, setManualInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Derived location result state
  const [derivedCommunity, setDerivedCommunity] = useState<string>('Smithers');
  const [derivedHA, setDerivedHA] = useState<string>('Northern Health');
  const [derivedRurality, setDerivedRurality] = useState<any>('Rural Hub');

  // Access burden state
  const [travelTime, setTravelTime] = useState<TravelTimeCategory>('60_TO_120_MINUTES');
  const [hasTransport, setHasTransport] = useState<'Yes' | 'No' | 'Difficulty' | 'Not_Applicable'>('Difficulty');
  const [selectedBarriers, setSelectedBarriers] = useState<string[]>(['Distance', 'Transportation']);
  const [fnOptIn, setFnOptIn] = useState<boolean>(true);

  const handleRequestGeolocation = async () => {
    setIsLocating(true);
    setGeoNotice(null);
    AuditService.logEvent(sessionId, 'LOCATION_PERMISSION_REQUESTED');

    const res = await locationProvider.getCurrentLocation();
    setIsLocating(false);

    if (res.success) {
      AuditService.logEvent(sessionId, 'LOCATION_PERMISSION_GRANTED', { community: res.communityName });
      setLocationMethod('geolocation');
      setDerivedCommunity(res.communityName);
      setDerivedHA(res.healthAuthority);
      setDerivedRurality(res.rurality);
    } else {
      AuditService.logEvent(sessionId, 'LOCATION_PERMISSION_DENIED');
      setGeoNotice(res.errorNotice || 'Browser location permission denied. Please select postal code or community.');
      setLocationMethod('community');
    }
  };

  const handleManualLookup = () => {
    if (!manualInput.trim()) return;
    const res = locationProvider.lookupByPostalOrCommunity(manualInput);
    setLocationMethod(res.locationMethod);
    setDerivedCommunity(res.communityName);
    setDerivedHA(res.healthAuthority);
    setDerivedRurality(res.rurality);
    AuditService.logEvent(sessionId, 'LOCATION_ENTERED', { input: manualInput, rurality: res.rurality });
  };

  const toggleBarrier = (b: string) => {
    if (selectedBarriers.includes(b)) {
      setSelectedBarriers(selectedBarriers.filter(x => x !== b));
    } else {
      setSelectedBarriers([...selectedBarriers, b]);
    }
  };

  const handleSubmitAccessContext = () => {
    const accessContext: PatientAccessContext = {
      locationMethod,
      communityName: derivedCommunity,
      healthAuthority: derivedHA,
      rurality: derivedRurality,
      travelTimeCategory: travelTime,
      hasReliableTransport: hasTransport,
      accessBarriers: selectedBarriers,
      firstNationsServicesRequested: fnOptIn,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    AuditService.logEvent(sessionId, 'ACCESS_CONTEXT_CALCULATED', {
      rurality: accessContext.rurality,
      travelTime: accessContext.travelTimeCategory,
      fnOptIn: accessContext.firstNationsServicesRequested
    });

    onCompleteAccessContext(accessContext);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2 border-b pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 inline-block">
            Access & Navigation Engine
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-sky-600" />
            <span>Would you like help finding care that is realistic for where you are?</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Your clinical recommendation has been determined. Providing your general location helps us identify nearby care facilities and virtual options without altering your urgency.
          </p>
        </div>

        {/* Location Method Options */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-800">Select general location method:</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleRequestGeolocation}
              disabled={isLocating}
              className={`p-4 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between ${
                locationMethod === 'geolocation'
                  ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Use approximate device location</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">Uses browser Geolocation API</span>
              </div>
              {isLocating && <span className="animate-spin text-sky-600">🌀</span>}
            </button>

            <button
              onClick={() => setLocationMethod('skipped')}
              className={`p-4 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between ${
                locationMethod === 'skipped'
                  ? 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <div className="space-y-1">
                <div className="font-bold text-slate-800">Skip location lookup</div>
                <span className="text-[11px] text-slate-500 font-normal">View general BC care options</span>
              </div>
            </button>
          </div>

          {geoNotice && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{geoNotice}</span>
            </div>
          )}

          {/* Postal Code or Community Manual Input */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">Or enter BC postal code prefix (e.g. V0J) or community name:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="Smithers, Hazelton, Terrace, V0J..."
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={handleManualLookup}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs shadow transition-colors"
              >
                Set Location
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
              <span>Derived Context:</span>
              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border">{derivedCommunity} ({derivedHA})</span>
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{derivedRurality}</span>
            </div>
          </div>
        </div>

        {/* Access Burden Assessment */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-bold text-slate-900">Access Burden & Travel Assessment</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">How long would it normally take to reach healthcare?</label>
              <select
                value={travelTime}
                onChange={e => setTravelTime(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              >
                <option value="UNDER_15_MINUTES">&lt; 15 minutes</option>
                <option value="15_TO_30_MINUTES">15 to 30 minutes</option>
                <option value="30_TO_60_MINUTES">30 to 60 minutes</option>
                <option value="60_TO_120_MINUTES">1 to 2 hours</option>
                <option value="MORE_THAN_120_MINUTES">&gt; 2 hours (Remote)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Do you have reliable transportation right now?</label>
              <select
                value={hasTransport}
                onChange={e => setHasTransport(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
              >
                <option value="Yes">Yes, available</option>
                <option value="No">No transportation</option>
                <option value="Difficulty">Difficulty arranging transport</option>
                <option value="Not_Applicable">Not applicable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Are any of these making it difficult to access care?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {['Distance', 'Transportation', 'Weather or road conditions', 'Childcare or caregiving', 'Mobility or disability', 'Cost', 'Clinic availability'].map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBarrier(b)}
                  className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                    selectedBarriers.includes(b)
                      ? 'bg-sky-50 border-sky-500 text-sky-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* First Nations Opt-In Question */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-purple-950">
            <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <strong className="font-bold text-purple-950">First Nations-Specific Health Service Options</strong>
              <p className="text-purple-900 text-xs">
                Would you like me to include First Nations-specific health services (such as the FNHA First Nations Virtual Doctor of the Day) that may be available to you or your family in BC?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs pt-1">
            <label className="flex items-center gap-1.5 font-bold text-purple-900 cursor-pointer">
              <input
                type="radio"
                name="fnOptIn"
                checked={fnOptIn === true}
                onChange={() => setFnOptIn(true)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span>Yes, include First Nations services</span>
            </label>

            <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="fnOptIn"
                checked={fnOptIn === false}
                onChange={() => setFnOptIn(false)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span>No, do not include</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onSkipAccessContext && (
            <button
              onClick={onSkipAccessContext}
              className="w-full sm:w-auto text-slate-600 hover:text-slate-900 font-semibold text-xs px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <span>Back to Recommendation (Skip)</span>
            </button>
          )}

          <button
            onClick={handleSubmitAccessContext}
            className="w-full sm:w-auto bg-sky-600 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
          >
            <span>View Access-Aware Care Plan</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
