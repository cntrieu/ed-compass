import { DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { evaluateTetanusRules } from './tetanusRules';
import { BC_EVIDENCE_SOURCES } from '../evidenceMetadata';

export function evaluateNailPunctureRules(answers: PatientAnswers): DeterministicRuleOutput {
  const tetanusOutcome = evaluateTetanusRules(answers);

  // If skin broken is NO -> minor skin care
  if (answers.skinBroken === 'No') {
    return {
      disposition: 'HOME_MONITOR_WITH_SAFETY_NET',
      timing: 'routine',
      destinationType: 'Home Care',
      ruleId: 'NAIL-H00',
      ruleVersion: '1.0',
      triggeredBy: ['skinNotBroken'],
      safetyNet: [
        'Monitor skin for redness, swelling, or pain.',
        'Keep skin clean and dry.',
        'Seek medical evaluation if skin breaks or symptoms develop.'
      ],
      requiresHumanReview: false,
      explanation: 'The nail or object did not break the skin. Minor superficial skin hygiene and routine monitoring are indicated.',
      evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE],
      tetanusOutcome
    };
  }

  // --- 1. EMERGENCY RULES ---

  // NAIL-E01: Severe uncontrolled bleeding
  if (answers.bleeding === 'severe_uncontrolled') {
    return {
      disposition: 'CALL_911_NOW',
      timing: 'immediately',
      destinationType: 'Emergency Department / 9-1-1',
      ruleId: 'NAIL-E01',
      ruleVersion: '1.0',
      triggeredBy: ['severeUncontrolledBleeding'],
      safetyNet: [
        'Apply firm, continuous direct pressure with a clean cloth.',
        'Keep patient still and calm.',
        'Call 9-1-1 immediately.'
      ],
      requiresHumanReview: false,
      explanation: 'Severe uncontrolled bleeding requires immediate emergency medical services and transport.',
      evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE],
      tetanusOutcome
    };
  }

  // NAIL-E02: Neurovascular compromise (cold/blue foot, major loss of movement, major numbness)
  const neurovascularTriggers: string[] = [];
  if (answers.circulation === 'Yes') neurovascularTriggers.push('coldPaleBlueFoot');
  if (answers.movement === 'No') neurovascularTriggers.push('inabilityToMoveToesOrFoot');
  if (answers.sensation === 'Yes') neurovascularTriggers.push('newNumbnessOrTingling');

  if (neurovascularTriggers.length > 0) {
    return {
      disposition: 'GO_TO_ED_NOW',
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'NAIL-E02',
      ruleVersion: '1.0',
      triggeredBy: neurovascularTriggers,
      safetyNet: [
        'Do not put weight on the injured foot.',
        'Do not attempt to massage or force movement.',
        'Proceed immediately to an Emergency Department.'
      ],
      requiresHumanReview: false,
      explanation: `Emergency red flag detected: ${neurovascularTriggers.join(', ')}. Neurovascular evaluation is required immediately.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE, BC_EVIDENCE_SOURCES.BC_WOUND_COMMITTEE],
      tetanusOutcome
    };
  }

  // NAIL-E03: Retained large/deep foreign object
  if (answers.retainedObject === 'Yes') {
    return {
      disposition: 'GO_TO_ED_NOW',
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'NAIL-E03',
      ruleVersion: '1.0',
      triggeredBy: ['retainedForeignObject'],
      safetyNet: [
        'DO NOT attempt to pull out or remove the embedded object yourself.',
        'Stabilize the object with clean padding if necessary without pushing it deeper.',
        'Go directly to the Emergency Department.'
      ],
      requiresHumanReview: false,
      explanation: 'A nail or foreign object remains embedded in the foot. Immediate professional removal and exploration are required.',
      evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE],
      tetanusOutcome
    };
  }

  // NAIL-E04: Joint involvement or severe rapidly worsening pain
  const jointOrTendonTriggers: string[] = [];
  if (answers.location === 'joint') jointOrTendonTriggers.push('woundNearJoint');
  if (answers.painTrend === 'worsening' && (answers.painScore ?? 0) >= 8) jointOrTendonTriggers.push('severeRapidlyWorseningPain');

  if (jointOrTendonTriggers.length > 0) {
    return {
      disposition: 'GO_TO_ED_NOW',
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'NAIL-E04',
      ruleVersion: '1.0',
      triggeredBy: jointOrTendonTriggers,
      safetyNet: [
        'Elevate the foot and avoid weight bearing.',
        'Proceed directly to the nearest Emergency Department.'
      ],
      requiresHumanReview: false,
      explanation: 'Puncture wound involves or is adjacent to a joint, or involves severe rapidly worsening pain requiring emergency exploration.',
      evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE],
      tetanusOutcome
    };
  }

  // --- 2. SAME-DAY ASSESSMENT RULES ---

  const sameDayTriggers: string[] = [];

  if (answers.footwear === 'Yes') sameDayTriggers.push('punctureThroughShoeOrBoot');
  if (answers.depth === 'deep' || answers.depth === 'cannot_tell' || answers.depth === 'Unsure') {
    sameDayTriggers.push('puncturedDepthDeepOrUncertain');
  }
  if (answers.retainedMaterial === 'Yes' || answers.retainedMaterial === 'Unsure') {
    sameDayTriggers.push('possibleRetainedDebris');
  }
  if (answers.contamination && answers.contamination.length > 0 && !answers.contamination.includes('none')) {
    sameDayTriggers.push(`contamination_${answers.contamination.join('_')}`);
  }
  if (answers.cleaning === 'No' || answers.cleaning === 'Not yet') sameDayTriggers.push('woundNotThoroughlyCleaned');
  if (answers.infectionSymptoms && answers.infectionSymptoms.length > 0 && !answers.infectionSymptoms.includes('none')) {
    sameDayTriggers.push(`infection_${answers.infectionSymptoms.join('_')}`);
  }
  if (answers.highRiskConditions && answers.highRiskConditions.length > 0 && !answers.highRiskConditions.includes('none')) {
    sameDayTriggers.push(`highRiskHost_${answers.highRiskConditions.join('_')}`);
  }
  if (answers.weightBearing === 'No') sameDayTriggers.push('inabilityToBearWeight');

  // Also check if tetanus vaccine or TIg is indicated/recommended
  if (tetanusOutcome.vaccineRecommendation === 'INDICATED' || tetanusOutcome.vaccineRecommendation === 'MAY_BE_RECOMMENDED' || tetanusOutcome.tigRecommendation === 'MAY_BE_INDICATED') {
    sameDayTriggers.push('tetanusAssessmentIndicated');
  }

  if (sameDayTriggers.length > 0) {
    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      timing: 'today',
      destinationType: 'Urgent Care Centre / Primary Care / Walk-in Clinic',
      ruleId: 'NAIL-S01',
      ruleVersion: '1.0',
      triggeredBy: sameDayTriggers,
      safetyNet: [
        'Clean wound gently with clean running water and soap.',
        'Cover with a clean dressing.',
        'Do not dig into the wound.',
        'Seek emergency care if redness spreads, fever develops, or severe pain occurs.'
      ],
      requiresHumanReview: tetanusOutcome.requiresHumanReview,
      explanation: `Same-day in-person clinical assessment is recommended due to: ${sameDayTriggers.join(', ')}.`,
      evidenceSource: [
        BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE,
        BC_EVIDENCE_SOURCES.BC_WOUND_COMMITTEE,
        BC_EVIDENCE_SOURCES.BCCDC_TETANUS_PROPHYLAXIS
      ],
      tetanusOutcome
    };
  }

  // --- 3. HOME CARE PATHWAY ---
  return {
    disposition: 'HOME_MONITOR_WITH_SAFETY_NET',
    timing: 'routine',
    destinationType: 'Home Care with Safety Net',
    ruleId: 'NAIL-H01',
    ruleVersion: '1.0',
    triggeredBy: ['minorShallowCleanPuncture', 'reassuringNeurovascular', 'reassuringTetanusHistory'],
    safetyNet: [
      'Gently clean wound with soap and clean running water.',
      'Apply a dry sterile dressing and keep dry.',
      'Seek urgent medical review if you develop worsening pain, spreading redness, pus, fever, numbness, or inability to bear weight.'
    ],
    requiresHumanReview: false,
    explanation: 'Minor superficial puncture with reassuring examination features and up-to-date reported tetanus protection.',
    evidenceSource: [BC_EVIDENCE_SOURCES.HEALTHLINK_BC_PUNCTURE],
    tetanusOutcome
  };
}
