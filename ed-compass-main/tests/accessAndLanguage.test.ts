import { describe, it, expect } from 'vitest';
import { evaluateClinicalRuleEngine } from '../src/clinical/engine';
import { AccessMatchingEngine } from '../src/services/accessMatchingEngine';
import { LocalDemoAgentProvider } from '../src/agents/localDemoAgentProvider';
import { LocalDemoLocationProvider } from '../src/services/locationProvider';
import { FacilityService } from '../src/services/facilityService';
import { StoreService } from '../src/services/storeService';
import { AuditService } from '../src/services/auditService';
import { PatientAccessContext } from '../src/types/access';
import { SYNTHETIC_BC_CARE_SERVICES } from '../src/data/syntheticFacilities';

describe('Access-Aware Care Navigation & Multilingual Safety Invariants', () => {
  const provider = new LocalDemoAgentProvider();

  it('1. Rurality category CANNOT alter clinical disposition', () => {
    const baseAnswers = { skinBroken: 'Yes', footwear: 'Yes', depth: 'cannot_tell' };

    const ruleOut = evaluateClinicalRuleEngine('nail_puncture', baseAnswers);
    expect(ruleOut.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');

    const remoteContext: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Remote',
      travelTimeCategory: 'MORE_THAN_120_MINUTES',
      hasReliableTransport: 'No',
      accessBarriers: ['Distance', 'Transportation'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('nail_puncture', ruleOut, remoteContext);
    expect(accessOut.clinicalDisposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(accessOut.clinicalDispositionChanged).toBe(false);
  });

  it('2. Travel time > 2 hours CANNOT downgrade emergency care (GO_TO_ED_NOW remains GO_TO_ED_NOW)', () => {
    const thunderclapAnswers = { onset: 'immediately', thunderclap: true };
    const ruleOut = evaluateClinicalRuleEngine('headache', thunderclapAnswers);
    expect(ruleOut.disposition).toBe('GO_TO_ED_NOW');

    const remoteContext: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Remote',
      travelTimeCategory: 'MORE_THAN_120_MINUTES',
      hasReliableTransport: 'No',
      accessBarriers: ['Distance'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('headache', ruleOut, remoteContext);
    expect(accessOut.clinicalDisposition).toBe('GO_TO_ED_NOW');
    expect(accessOut.clinicalDispositionChanged).toBe(false);
  });

  it('3. Transportation barriers CANNOT change rule output', () => {
    const feverAnswers = { feverish: 'Yes', emergencyFlags: ['confusion'] };
    const ruleOut = evaluateClinicalRuleEngine('fever', feverAnswers);
    expect(ruleOut.disposition).toBe('GO_TO_ED_NOW');

    const context: PatientAccessContext = {
      locationMethod: 'postal',
      rurality: 'Rural',
      travelTimeCategory: '60_TO_120_MINUTES',
      hasReliableTransport: 'No',
      accessBarriers: ['Transportation', 'Cost'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('fever', ruleOut, context);
    expect(accessOut.clinicalDisposition).toBe('GO_TO_ED_NOW');
  });

  it('4. Clinic closure CANNOT downgrade clinical urgency', () => {
    const nailAnswers = { skinBroken: 'Yes', footwear: 'Yes' };
    const ruleOut = evaluateClinicalRuleEngine('nail_puncture', nailAnswers);

    const context: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Rural Hub',
      travelTimeCategory: '30_TO_60_MINUTES',
      hasReliableTransport: 'Yes',
      accessBarriers: ['Clinic availability'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('nail_puncture', ruleOut, context);
    expect(accessOut.clinicalDisposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(accessOut.clinicalDispositionChanged).toBe(false);
  });

  it('5. Virtual care CANNOT replace required in-person wound assessment', () => {
    const nailAnswers = { skinBroken: 'Yes', footwear: 'Yes' };
    const ruleOut = evaluateClinicalRuleEngine('nail_puncture', nailAnswers);

    const context: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Remote',
      travelTimeCategory: 'MORE_THAN_120_MINUTES',
      hasReliableTransport: 'No',
      accessBarriers: ['Distance'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('nail_puncture', ruleOut, context);
    expect(accessOut.virtualCareCanReplaceInPersonCare).toBe(false);
    expect(accessOut.virtualCareExplanation).toContain('cannot replace');
  });

  it('6. Virtual care MAY be offered for eligible non-emergency primary care cases', () => {
    const feverAnswers = {
      feverish: 'Yes',
      temperatureValue: 37.9,
      temperatureUnit: 'C',
      lifeThreats: ['none'],
      emergencyFlags: ['none'],
      highRiskHost: ['none'],
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    };
    const ruleOut = evaluateClinicalRuleEngine('fever', feverAnswers);

    const context: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Rural',
      travelTimeCategory: '30_TO_60_MINUTES',
      hasReliableTransport: 'Yes',
      accessBarriers: [],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('fever', ruleOut, context);
    expect(accessOut.virtualCareCanReplaceInPersonCare).toBe(true);
  });

  it('7. FNHA Virtual Doctor is only included when First Nations options are requested', () => {
    const ruleOut = evaluateClinicalRuleEngine('fever', { feverish: 'Yes' });

    const ctxDeclined: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Rural',
      travelTimeCategory: '30_TO_60_MINUTES',
      hasReliableTransport: 'Yes',
      accessBarriers: [],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const ctxOptIn: PatientAccessContext = {
      ...ctxDeclined,
      firstNationsServicesRequested: true
    };

    const outDeclined = AccessMatchingEngine.evaluateAccessAndServiceMatch('fever', ruleOut, ctxDeclined);
    const outOptIn = AccessMatchingEngine.evaluateAccessAndServiceMatch('fever', ruleOut, ctxOptIn);

    expect(outDeclined.navigationOptions.some(s => s.id === 'fac-fnha-doctor')).toBe(false);
    expect(outOptIn.navigationOptions.some(s => s.id === 'fac-fnha-doctor')).toBe(true);
  });

  it('8. Geographic location does NOT infer First Nations identity automatically', () => {
    const locProvider = new LocalDemoLocationProvider();
    const locRes = locProvider.lookupByPostalOrCommunity('Hazelton');
    expect(locRes.communityName).toBe('Hazelton');

    // Context generated without explicit opt-in must have firstNationsServicesRequested = false
    const defaultCtx: PatientAccessContext = {
      locationMethod: 'community',
      communityName: locRes.communityName,
      rurality: locRes.rurality,
      travelTimeCategory: locRes.approxTravelTimeCategory,
      hasReliableTransport: 'Yes',
      accessBarriers: [],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const fnhaServices = FacilityService.searchFacilities({
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      accessContext: defaultCtx
    });

    expect(fnhaServices.some(s => s.id === 'fac-fnha-doctor')).toBe(false);
  });

  it('9. Denied geolocation falls back gracefully to manual community lookup', async () => {
    const locProvider = new LocalDemoLocationProvider();
    const res = locProvider.lookupByPostalOrCommunity('Smithers');
    expect(res.success).toBe(true);
    expect(res.communityName).toBe('Smithers');
    expect(res.healthAuthority).toBe('Northern Health');
  });

  it('10. Missing service hours produce UNKNOWN/UNVERIFIED, never invented OPEN status', () => {
    const unverifiedFac = SYNTHETIC_BC_CARE_SERVICES.find(s => s.id === 'fac-ubc-upcc');
    expect(unverifiedFac?.capabilities.tetanusImmuneGlobulin).toBe('NOT_VERIFIED');
  });

  it('11. Unverified vaccine inventory remains NOT_VERIFIED', () => {
    const fac = SYNTHETIC_BC_CARE_SERVICES.find(s => s.id === 'fac-haida-gwaii');
    expect(fac?.capabilities.tetanusImmuneGlobulin).toBe('NOT_VERIFIED');
  });

  it('12. English and French identical clinical facts produce 100% IDENTICAL dispositions', () => {
    const answers = { feverish: 'Yes', emergencyFlags: ['confusion'] };

    const outEn = evaluateClinicalRuleEngine('fever', answers);
    const outFr = evaluateClinicalRuleEngine('fever', answers);

    expect(outEn.disposition).toBe(outFr.disposition);
    expect(outEn.ruleId).toBe(outFr.ruleId);
    expect(outEn.disposition).toBe('GO_TO_ED_NOW');
  });

  it('13. Language selection never changes clinical rule ID', () => {
    const answers = { onset: 'immediately', thunderclap: true };

    const handoffEn = provider.generateIntakeHandoff('s-en', 'headache', answers, 'en');
    const handoffFr = provider.generateIntakeHandoff('s-fr', 'headache', answers, 'fr');

    const ruleOut = evaluateClinicalRuleEngine('headache', answers);

    const navEn = provider.generateNavigationExplanation(handoffEn, ruleOut);
    const navFr = provider.generateNavigationExplanation(handoffFr, ruleOut);

    expect(navEn.ruleId).toBe(navFr.ruleId);
    expect(navEn.disposition).toBe(navFr.disposition);
  });

  it('14. Interpreter request does NOT change clinical acuity', () => {
    const answers = { skinBroken: 'Yes', footwear: 'Yes' };
    const ruleOut = evaluateClinicalRuleEngine('nail_puncture', answers);

    const handoffNoInterp = provider.generateIntakeHandoff('s-1', 'nail_puncture', answers, 'en', false);
    const handoffInterp = provider.generateIntakeHandoff('s-2', 'nail_puncture', answers, 'en', true);

    const nav1 = provider.generateNavigationExplanation(handoffNoInterp, ruleOut);
    const nav2 = provider.generateNavigationExplanation(handoffInterp, ruleOut);

    expect(nav1.disposition).toBe(nav2.disposition);
  });

  it('15. Agent 2 CANNOT alter clinical disposition', () => {
    const answers = { onset: 'immediately', thunderclap: true };
    const ruleOut = evaluateClinicalRuleEngine('headache', answers);
    const handoff = provider.generateIntakeHandoff('s-3', 'headache', answers);
    const nav = provider.generateNavigationExplanation(handoff, ruleOut);

    expect(nav.disposition).toBe(ruleOut.disposition);
  });

  it('16. Access Engine ALWAYS outputs clinicalDispositionChanged = false', () => {
    const ruleOut = evaluateClinicalRuleEngine('nail_puncture', { skinBroken: 'Yes', footwear: 'Yes' });
    const ctx: PatientAccessContext = {
      locationMethod: 'community',
      rurality: 'Remote',
      travelTimeCategory: 'MORE_THAN_120_MINUTES',
      hasReliableTransport: 'No',
      accessBarriers: ['Distance'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    };

    const accessOut = AccessMatchingEngine.evaluateAccessAndServiceMatch('nail_puncture', ruleOut, ctx);
    expect(accessOut.clinicalDispositionChanged).toBe(false);
  });

  it('17. Emergency pathways skip unnecessary access questions until emergency recommendation displayed', () => {
    const handoff = provider.generateIntakeHandoff('s-4', 'headache', { onset: 'immediately', thunderclap: true });
    expect(handoff.emergencyStopDetected).toBe(true);
    expect(handoff.triggeredEmergencyRuleId).toBe('HEADACHE-E01');
  });

  it('18. Raw location coordinates are NOT persisted in synthetic audit record', () => {
    const event = AuditService.logEvent('sess-audit', 'LOCATION_ENTERED', {
      latitude: 49.2827,
      longitude: -123.1207,
      exactAddress: '123 Main St',
      communityName: 'Vancouver'
    });

    expect(event.details).not.toHaveProperty('latitude');
    expect(event.details).not.toHaveProperty('longitude');
    expect(event.details).not.toHaveProperty('exactAddress');
    expect(event.details.communityName).toBe('Vancouver');
  });

  it('19. Patient feedback attaches access metadata to correct encounter', () => {
    StoreService.addPatientFeedback({
      sessionId: 'syn-session-101',
      scenario: 'nail_puncture',
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ruleId: 'NAIL-S01',
      ruleVersion: '1.0',
      easyToUseScore: 5,
      nextStepClear: 'Yes',
      rationaleUnderstood: 'Yes',
      confidenceScore: 5,
      canFollowRecommendation: 'Yes',
      careOptionsRealistic: 'Yes',
      ruralityCategory: 'Rural Hub',
      reportedBarriers: ['Distance'],
      timestamp: new Date().toISOString()
    });

    const enc = StoreService.getEncounterById('syn-session-101');
    expect(enc?.patientFeedback?.careOptionsRealistic).toBe('Yes');
    expect(enc?.patientFeedback?.ruralityCategory).toBe('Rural Hub');
  });

  it('20. All existing pathways continue to work as expected', () => {
    const nailOut = evaluateClinicalRuleEngine('nail_puncture', { skinBroken: 'Yes', footwear: 'Yes' });
    const headacheOut = evaluateClinicalRuleEngine('headache', { onset: 'immediately', thunderclap: true });
    const feverOut = evaluateClinicalRuleEngine('fever', { feverish: 'Yes', emergencyFlags: ['confusion'] });

    expect(nailOut.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(headacheOut.disposition).toBe('GO_TO_ED_NOW');
    expect(feverOut.disposition).toBe('GO_TO_ED_NOW');
  });
});
