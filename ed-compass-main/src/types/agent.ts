import { ClinicalPathwayId, Disposition, DeterministicRuleOutput, PatientAnswers } from './clinical';
import { PatientAccessContext, AccessEngineOutput } from './access';
import { SupportedLocale } from './i18n';

export interface Agent1IntakeHandoff {
  sessionId: string;
  scenario: ClinicalPathwayId;
  answers: PatientAnswers;
  missingFields: string[];
  uncertainties: string[];
  emergencyStopDetected: boolean;
  triggeredEmergencyRuleId?: string;
  preferredLanguage: SupportedLocale;
  otherLanguageName?: string;
  interpreterNeeded: boolean;
  agentVersion: string;
  timestamp: string;
}

export interface Agent2NavigationOutput {
  sessionId: string;
  disposition: Disposition;
  displayTitle: string;
  displaySubtitle: string;
  plainLanguageRationale: string;
  triggeredPatientFacts: string[];
  nextSteps: string[];
  safetyNetInstructions: string[];
  careCategoryOptions: string[];
  accessBarriers: string[];
  conceptualHandoffNotice: string;
  ruleId: string;
  ruleVersion: string;
  requiresHumanReview: boolean;
  accessEngineOutput?: AccessEngineOutput;
}

export interface Agent3FeedbackSummary {
  sessionId: string;
  scenario: ClinicalPathwayId;
  disposition: Disposition;
  ruleId: string;
  ruleVersion: string;
  clarityRating: number; // 1-5
  rationaleUnderstood: 'Yes' | 'Mostly' | 'No';
  confidenceScore: number; // 1-5
  canFollowRecommendation: 'Yes' | 'Maybe' | 'No';
  reportedBarriers: string[];
  feedbackTheme: string;
  patientComments: string;
  accessRealismScore?: 'Yes' | 'Mostly' | 'No';
  culturalSafetyScore?: 'Yes' | 'Mostly' | 'No' | 'Prefer not to answer';
  timestamp: string;
}
