import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers, Disposition } from '../types/clinical';
import { evaluateNailPunctureRules } from './pathways/nailPunctureRules';
import { evaluateHeadacheRules } from './pathways/headacheRules';
import { evaluateFeverRules } from './pathways/feverRules';

export const DISPOSITION_PRIORITY: Record<Disposition, number> = {
  CALL_911_NOW: 5,
  GO_TO_ED_NOW: 4,
  SAME_DAY_CLINICAL_ASSESSMENT: 3,
  CONTACT_811_OR_PRIMARY_CARE: 2,
  HOME_MONITOR_WITH_SAFETY_NET: 1
};

export function evaluateClinicalRuleEngine(
  scenario: ClinicalPathwayId,
  answers: PatientAnswers
): DeterministicRuleOutput {
  switch (scenario) {
    case 'nail_puncture':
      return evaluateNailPunctureRules(answers);
    case 'headache':
      return evaluateHeadacheRules(answers);
    case 'fever':
      return evaluateFeverRules(answers);
    default:
      throw new Error(`Unknown clinical pathway scenario: ${scenario}`);
  }
}

export function compareDispositions(a: Disposition, b: Disposition): number {
  return DISPOSITION_PRIORITY[a] - DISPOSITION_PRIORITY[b];
}
