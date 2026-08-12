import { DeterministicRuleOutput, ClinicalPathwayId } from '../types/clinical';
import { CareService, PatientAccessContext, AccessEngineOutput, ClinicalCapability } from '../types/access';
import { SYNTHETIC_BC_CARE_SERVICES } from '../data/syntheticFacilities';

export class AccessMatchingEngine {
  static evaluateAccessAndServiceMatch(
    scenario: ClinicalPathwayId,
    ruleOutput: DeterministicRuleOutput,
    accessContext: PatientAccessContext
  ): AccessEngineOutput {
    // 1. Determine Required Clinical Capabilities
    const requiredCapabilities: ClinicalCapability[] = [];

    if (scenario === 'nail_puncture') {
      requiredCapabilities.push('physical_examination', 'wound_assessment', 'tetanus_immunization_assessment');
      if (ruleOutput.disposition === 'GO_TO_ED_NOW' || ruleOutput.disposition === 'CALL_911_NOW') {
        requiredCapabilities.push('emergency_physician_assessment', 'emergency_resuscitation');
      }
    } else if (scenario === 'headache') {
      if (ruleOutput.disposition === 'GO_TO_ED_NOW' || ruleOutput.disposition === 'CALL_911_NOW') {
        requiredCapabilities.push('emergency_physician_assessment', 'imaging_possible');
      } else {
        requiredCapabilities.push('primary_care_assessment');
      }
    } else if (scenario === 'fever') {
      if (ruleOutput.disposition === 'GO_TO_ED_NOW' || ruleOutput.disposition === 'CALL_911_NOW') {
        requiredCapabilities.push('emergency_physician_assessment', 'emergency_resuscitation');
      } else {
        requiredCapabilities.push('primary_care_assessment');
      }
    }

    // 2. Determine Virtual Care Replacement Eligibility
    // Hands-on physical exam (wounds, neuro deficits, severe fever instability) CANNOT be replaced by virtual care alone
    const requiresHandsOnExam =
      scenario === 'nail_puncture' && ruleOutput.disposition !== 'HOME_MONITOR_WITH_SAFETY_NET';

    const isEmergency =
      ruleOutput.disposition === 'CALL_911_NOW' || ruleOutput.disposition === 'GO_TO_ED_NOW';

    const virtualCareCanReplaceInPersonCare = !requiresHandsOnExam && !isEmergency;

    let virtualCareExplanation = '';
    if (requiresHandsOnExam) {
      virtualCareExplanation =
        'A virtual appointment cannot replace the hands-on wound, probe, or neurovascular physical examination recommended for this puncture wound injury.';
    } else if (isEmergency) {
      virtualCareExplanation =
        'Emergency warning signs require immediate in-person emergency department assessment. Virtual care cannot manage life-threatening emergencies.';
    } else {
      virtualCareExplanation =
        'Based on your reported symptoms and reassuring safety screening, virtual primary care may be a practical option if in-person clinics are closed or difficult to reach.';
    }

    // 3. Filter & Rank Care Services
    const options: CareService[] = [];

    // Always include HealthLink BC 8-1-1 as safety/navigation fallback
    const h811 = SYNTHETIC_BC_CARE_SERVICES.find(s => s.id === 'fac-healthlink-811');
    if (h811) options.push(h811);

    // Include FNHA Virtual Doctor if requested or appropriate
    if (accessContext.firstNationsServicesRequested) {
      const fnhaDoc = SYNTHETIC_BC_CARE_SERVICES.find(s => s.id === 'fac-fnha-doctor');
      if (fnhaDoc) options.push(fnhaDoc);
    }

    // Include Northern Health Virtual Clinic if Northern BC region and virtual care is relevant
    if (accessContext.healthAuthority === 'Northern Health' || accessContext.rurality === 'Remote' || accessContext.rurality === 'Rural') {
      const nhVirtual = SYNTHETIC_BC_CARE_SERVICES.find(s => s.id === 'fac-nh-virtual');
      if (nhVirtual) options.push(nhVirtual);
    }

    // Include In-Person Facilities matching location or capability
    const inPersonFacilities = SYNTHETIC_BC_CARE_SERVICES.filter(s => !s.isVirtual);
    for (const fac of inPersonFacilities) {
      if (isEmergency && fac.facilityType === 'Emergency Department') {
        options.push(fac);
      } else if (!isEmergency && (fac.facilityType === 'Urgent and Primary Care Centre' || fac.facilityType === 'Nursing Station / CHC' || fac.facilityType === 'Emergency Department')) {
        options.push(fac);
      }
    }

    return {
      clinicalDisposition: ruleOutput.disposition,
      clinicalDispositionChanged: false, // CRITICAL SAFETY RULE
      accessContext,
      requiredCapabilities,
      virtualCareCanReplaceInPersonCare,
      virtualCareExplanation,
      navigationOptions: options,
      conceptualHandoffNotice: 'Conceptual handoff only—no information has been transmitted.'
    };
  }
}
