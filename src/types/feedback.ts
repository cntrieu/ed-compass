import { ClinicalPathwayId, Disposition } from './clinical';
import { RuralityCategory } from './access';

export interface PatientFeedback {
  sessionId: string;
  scenario: ClinicalPathwayId;
  disposition: Disposition;
  ruleId: string;
  ruleVersion: string;
  easyToUseScore: number; // 1-5
  nextStepClear: 'Yes' | 'Mostly' | 'No';
  rationaleUnderstood: 'Yes' | 'Mostly' | 'No';
  confidenceScore: number; // 1-5
  canFollowRecommendation: 'Yes' | 'Maybe' | 'No';
  reportedBarriers: string[];
  confusingOrMissingComments?: string;
  thumbsUpOrDown?: 'thumbs_up' | 'thumbs_down';

  // Access & Equity Additions
  careOptionsRealistic?: 'Yes' | 'Mostly' | 'No';
  distanceBarrier?: boolean;
  transportationBarrier?: boolean;
  foundAppropriateService?: 'Yes' | 'No' | 'Unsure';
  languageEasyToUnderstand?: 'Yes' | 'Mostly' | 'No';
  neededLanguageOrCommSupport?: boolean;
  culturallyRespectful?: 'Yes' | 'Mostly' | 'No' | 'Prefer not to answer';
  ruralityCategory?: RuralityCategory;

  timestamp: string;
}

export type StaffDispositionAssessment = 'Yes' | 'Too cautious' | 'Potentially too low' | 'Unsure';

export interface StaffReview {
  id: string;
  sessionId: string;
  reviewerId: string;
  dispositionAppropriate: StaffDispositionAssessment;
  essentialQuestionsAsked: 'Yes' | 'No' | 'Unsure';
  explanationClear: 'Yes' | 'No';
  unsafeFlag: boolean;
  tetanusAgreement?: 'Yes' | 'No' | 'Unsure';
  accessAppropriatenessAgreement?: 'Yes' | 'No' | 'Unsure';
  feedbackText: string;
  timestamp: string;
}

export type ImprovementStatus =
  | 'NEW'
  | 'UNDER_REVIEW'
  | 'CLINICAL_REVIEW'
  | 'APPROVED_FOR_TESTING'
  | 'TESTING'
  | 'APPROVED'
  | 'IMPLEMENTED'
  | 'REJECTED';

export interface ImprovementItem {
  id: string;
  sourceSessionId: string;
  scenario: ClinicalPathwayId;
  feedbackTheme: string;
  currentRuleVersion: string;
  proposedChange: string;
  status: ImprovementStatus;
  reviewer: string;
  createdAt: string;
  updatedAt: string;
}
