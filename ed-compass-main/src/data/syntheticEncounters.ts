import { ClinicalPathwayId, Disposition } from '../types/clinical';
import { PatientFeedback, StaffReview, ImprovementItem } from '../types/feedback';

export interface SyntheticEncounter {
  sessionId: string;
  scenario: ClinicalPathwayId;
  disposition: Disposition;
  ruleId: string;
  ruleVersion: string;
  patientAnswers: Record<string, any>;
  triggeredBy: string[];
  rationale: string;
  patientFeedback?: PatientFeedback;
  staffReview?: StaffReview;
  createdAt: string;
}

export const INITIAL_SYNTHETIC_ENCOUNTERS: SyntheticEncounter[] = [
  {
    sessionId: 'syn-session-101',
    scenario: 'nail_puncture',
    disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
    ruleId: 'NAIL-S01',
    ruleVersion: '1.0',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: '2_to_6_hours',
      retainedObject: 'No',
      bleeding: 'mild',
      location: 'sole',
      footwear: 'Yes',
      depth: 'cannot_tell',
      retainedMaterial: 'Unsure',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_painful',
      painTrend: 'same',
      rusty: 'Yes',
      contamination: ['soil_dirt'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: '5_to_10'
    },
    triggeredBy: ['punctureThroughShoeOrBoot', 'puncturedDepthDeepOrUncertain', 'tetanusAssessmentIndicated'],
    rationale: 'Puncture wound penetrated running shoe sole with uncertain depth. Tetanus booster recommended as last vaccine was 7 years ago.',
    patientFeedback: {
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
      reportedBarriers: [],
      confusingOrMissingComments: 'Very clear explanation about why the shoe penetration matters.',
      thumbsUpOrDown: 'thumbs_up',
      timestamp: '2026-08-07T09:15:00Z'
    },
    staffReview: {
      id: 'sr-101',
      sessionId: 'syn-session-101',
      reviewerId: 'Dr. E. Campbell, MD (Emergency Physician)',
      dispositionAppropriate: 'Yes',
      essentialQuestionsAsked: 'Yes',
      explanationClear: 'Yes',
      unsafeFlag: false,
      tetanusAgreement: 'Yes',
      feedbackText: 'Appropriate same-day disposition given plantar puncture through footwear.',
      timestamp: '2026-08-07T10:00:00Z'
    },
    createdAt: '2026-08-07T09:10:00Z'
  },
  {
    sessionId: 'syn-session-102',
    scenario: 'headache',
    disposition: 'GO_TO_ED_NOW',
    ruleId: 'HEADACHE-E01',
    ruleVersion: '1.0',
    patientAnswers: {
      age: 42,
      onset: 'immediately',
      thunderclap: true,
      firstOrWorst: 'Yes',
      differentFromUsual: 'Yes',
      neurologicalFlags: ['none'],
      systemicFlags: ['none'],
      pregnancy: 'neither',
      onsetContext: ['exercise']
    },
    triggeredBy: ['thunderclapOnset'],
    rationale: 'Headache onset was sudden and reached maximum intensity within 1 minute while exercising. Emergency Department evaluation required to rule out subarachnoid hemorrhage.',
    patientFeedback: {
      sessionId: 'syn-session-102',
      scenario: 'headache',
      disposition: 'GO_TO_ED_NOW',
      ruleId: 'HEADACHE-E01',
      ruleVersion: '1.0',
      easyToUseScore: 5,
      nextStepClear: 'Yes',
      rationaleUnderstood: 'Yes',
      confidenceScore: 4,
      canFollowRecommendation: 'Yes',
      reportedBarriers: [],
      confusingOrMissingComments: 'Appreciated that it stopped questioning early when the emergency feature was flagged.',
      thumbsUpOrDown: 'thumbs_up',
      timestamp: '2026-08-07T10:45:00Z'
    },
    staffReview: {
      id: 'sr-102',
      sessionId: 'syn-session-102',
      reviewerId: 'RN M. Tremblay (Triage Nurse)',
      dispositionAppropriate: 'Yes',
      essentialQuestionsAsked: 'Yes',
      explanationClear: 'Yes',
      unsafeFlag: false,
      feedbackText: 'Thunderclap onset correctly triggered immediate ED escalation.',
      timestamp: '2026-08-07T11:15:00Z'
    },
    createdAt: '2026-08-07T10:40:00Z'
  },
  {
    sessionId: 'syn-session-103',
    scenario: 'fever',
    disposition: 'GO_TO_ED_NOW',
    ruleId: 'FEVER-H01',
    ruleVersion: '1.0',
    patientAnswers: {
      feverish: 'Yes',
      temperatureValue: 38.6,
      temperatureUnit: 'C',
      lifeThreats: ['none'],
      emergencyFlags: ['none'],
      highRiskHost: ['neutropenia', 'chemotherapy'],
      associatedBranch: 'general'
    },
    triggeredBy: ['knownNeutropeniaWithFever'],
    rationale: 'Measured temperature 38.6°C in a patient with known neutropenia and active chemotherapy. High risk for febrile neutropenia.',
    patientFeedback: {
      sessionId: 'syn-session-103',
      scenario: 'fever',
      disposition: 'GO_TO_ED_NOW',
      ruleId: 'FEVER-H01',
      ruleVersion: '1.0',
      easyToUseScore: 4,
      nextStepClear: 'Yes',
      rationaleUnderstood: 'Yes',
      confidenceScore: 5,
      canFollowRecommendation: 'Yes',
      reportedBarriers: [],
      confusingOrMissingComments: 'Glad it flagged oncology risk immediately.',
      thumbsUpOrDown: 'thumbs_up',
      timestamp: '2026-08-07T11:30:00Z'
    },
    createdAt: '2026-08-07T11:25:00Z'
  }
];

export const INITIAL_IMPROVEMENT_ITEMS: ImprovementItem[] = [
  {
    id: 'imp-001',
    sourceSessionId: 'syn-session-101',
    scenario: 'nail_puncture',
    feedbackTheme: 'Access Barrier: Rural Distance',
    currentRuleVersion: '1.0',
    proposedChange: 'Add explicit navigation support for remote First Nations nursing stations when patient reports >60 minutes travel time to nearest ED.',
    status: 'CLINICAL_REVIEW',
    reviewer: 'Clinical Governance Committee (EMHI1001H Panel)',
    createdAt: '2026-08-07T11:00:00Z',
    updatedAt: '2026-08-07T11:30:00Z'
  },
  {
    id: 'imp-002',
    sourceSessionId: 'syn-session-102',
    scenario: 'headache',
    feedbackTheme: 'Clarity & Comprehension Issue',
    currentRuleVersion: '1.0',
    proposedChange: 'Enhance plain-language explanation of exertional thunderclap headache triggers without causing panic.',
    status: 'APPROVED_FOR_TESTING',
    reviewer: 'Patient Advisory Working Group',
    createdAt: '2026-08-07T11:20:00Z',
    updatedAt: '2026-08-07T11:45:00Z'
  }
];
