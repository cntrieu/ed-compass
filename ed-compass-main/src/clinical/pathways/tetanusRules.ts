import { TetanusOutcome, PatientAnswers } from '../../types/clinical';
import { BC_EVIDENCE_SOURCES } from '../evidenceMetadata';

export function evaluateTetanusRules(answers: PatientAnswers): TetanusOutcome {
  const primarySeries = answers.tetanusPrimarySeries; // 'Yes', 'No', 'Unsure'
  const lastDose = answers.tetanusLastDose; // 'less_than_5', '5_to_10', 'more_than_10', 'unknown'
  const immunocompromised = answers.highRiskConditions?.includes('immunosuppression') || false;

  const triggeredBy: string[] = [];
  let requiresHumanReview = immunocompromised;

  // Case 1: Less than 3 lifetime doses or unknown primary series
  if (primarySeries === 'No' || primarySeries === 'Unsure') {
    triggeredBy.push('primarySeriesUncertainOrIncomplete');
    if (lastDose) triggeredBy.push(`lastDose_${lastDose}`);

    return {
      vaccineRecommendation: 'INDICATED',
      tigRecommendation: 'MAY_BE_INDICATED',
      ruleId: 'TETANUS-T01',
      ruleVersion: '1.0',
      triggeredBy,
      requiresHumanReview: true,
      explanation:
        'Reported lifetime tetanus vaccination series is incomplete or uncertain. BCCDC guidelines recommend prompt clinical assessment for a tetanus-containing vaccine and consideration of Tetanus Immune Globulin (TIg).',
      evidenceSource: [BC_EVIDENCE_SOURCES.BCCDC_TETANUS_PROPHYLAXIS, BC_EVIDENCE_SOURCES.BCCDC_TIG]
    };
  }

  // Case 2: >=3 doses, last dose < 5 years ago
  if (lastDose === 'less_than_5') {
    triggeredBy.push('primarySeriesComplete', 'lastDoseUnder5Years');
    return {
      vaccineRecommendation: 'GENERALLY_NOT_INDICATED',
      tigRecommendation: 'GENERALLY_NOT_INDICATED',
      ruleId: 'TETANUS-T02',
      ruleVersion: '1.0',
      triggeredBy,
      requiresHumanReview,
      explanation:
        'Reported completed primary series with a booster received within the last 5 years. Routine booster and TIg are generally not indicated for this puncture wound based on BCCDC guidance.',
      evidenceSource: [BC_EVIDENCE_SOURCES.BCCDC_TETANUS_PROPHYLAXIS]
    };
  }

  // Case 3: >=3 doses, last dose 5 to < 10 years ago
  if (lastDose === '5_to_10') {
    triggeredBy.push('primarySeriesComplete', 'lastDose5to10Years');
    return {
      vaccineRecommendation: 'MAY_BE_RECOMMENDED',
      tigRecommendation: 'GENERALLY_NOT_INDICATED',
      ruleId: 'TETANUS-T03',
      ruleVersion: '1.0',
      triggeredBy,
      requiresHumanReview,
      explanation:
        'Reported completed primary series, but last tetanus vaccine was 5 to 10 years ago. BCCDC guidelines recommend a booster for tetanus-prone/puncture wounds if >5 years have elapsed.',
      evidenceSource: [BC_EVIDENCE_SOURCES.BCCDC_TETANUS_PROPHYLAXIS]
    };
  }

  // Case 4: >=3 doses, last dose >= 10 years ago or unknown timing
  triggeredBy.push('primarySeriesComplete', lastDose === 'more_than_10' ? 'lastDoseOver10Years' : 'lastDoseTimingUnknown');
  return {
    vaccineRecommendation: 'MAY_BE_RECOMMENDED',
    tigRecommendation: 'GENERALLY_NOT_INDICATED',
    ruleId: 'TETANUS-T04',
    ruleVersion: '1.0',
    triggeredBy,
    requiresHumanReview: true,
    explanation:
      'Reported completed primary series, but last tetanus booster was 10 or more years ago (or timeframe unknown). BCCDC guidelines recommend a tetanus-containing vaccine booster.',
    evidenceSource: [BC_EVIDENCE_SOURCES.BCCDC_TETANUS_PROPHYLAXIS]
  };
}
