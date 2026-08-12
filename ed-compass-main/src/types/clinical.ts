export type Disposition =
  | 'CALL_911_NOW'
  | 'GO_TO_ED_NOW'
  | 'SAME_DAY_CLINICAL_ASSESSMENT'
  | 'CONTACT_811_OR_PRIMARY_CARE'
  | 'HOME_MONITOR_WITH_SAFETY_NET';

export type ClinicalPathwayId = 'nail_puncture' | 'headache' | 'fever';

export type VaccineRecommendationStatus =
  | 'INDICATED'
  | 'MAY_BE_RECOMMENDED'
  | 'GENERALLY_NOT_INDICATED'
  | 'CLINICIAN_CONFIRMATION_REQUIRED';

export type TIgRecommendationStatus =
  | 'MAY_BE_INDICATED'
  | 'GENERALLY_NOT_INDICATED'
  | 'CLINICIAN_CONFIRMATION_REQUIRED';

export interface EvidenceSource {
  title: string;
  organization: string;
  url?: string;
  versionOrDate: string;
  notes?: string;
}

export interface TetanusOutcome {
  vaccineRecommendation: VaccineRecommendationStatus;
  tigRecommendation: TIgRecommendationStatus;
  ruleId: string;
  ruleVersion: string;
  triggeredBy: string[];
  requiresHumanReview: boolean;
  explanation: string;
  evidenceSource: EvidenceSource[];
}

export interface DeterministicRuleOutput {
  disposition: Disposition;
  timing: string;
  destinationType: string;
  ruleId: string;
  ruleVersion: string;
  messageKey?: string;
  triggeredBy: string[];
  safetyNet: string[];
  requiresHumanReview: boolean;
  explanation: string;
  evidenceSource: EvidenceSource[];
  tetanusOutcome?: TetanusOutcome; // Present specifically in Nail Puncture pathway
  qSOFAStatus?: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  mcIsaacScore?: number;
  ctasLevel?: number;
  frameworksApplied?: string[];
}

export type PatientAnswers = Record<string, any>;
