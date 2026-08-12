import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers } from '../types/clinical';
import { Agent1IntakeHandoff, Agent2NavigationOutput, Agent3FeedbackSummary } from '../types/agent';
import { PatientFeedback } from '../types/feedback';
import { PatientAccessContext } from '../types/access';
import { SupportedLocale } from '../types/i18n';

export interface IntakeQuestionOption {
  label: string;
  value: any;
  isEmergencyStop?: boolean;
}

export interface IntakeQuestion {
  id: string;
  questionText: string;
  helpText?: string;
  options: IntakeQuestionOption[];
  type: 'radio' | 'checkbox' | 'number' | 'text' | 'select';
  scenario: ClinicalPathwayId;
}

export interface IAgentProvider {
  getQuestionForPathway(scenario: ClinicalPathwayId, questionId: string, locale?: SupportedLocale): IntakeQuestion | null;
  getQuestionSequence(scenario: ClinicalPathwayId): string[];
  generateIntakeHandoff(
    sessionId: string,
    scenario: ClinicalPathwayId,
    answers: PatientAnswers,
    preferredLanguage?: SupportedLocale,
    interpreterNeeded?: boolean
  ): Agent1IntakeHandoff;
  generateNavigationExplanation(
    handoff: Agent1IntakeHandoff,
    ruleOutput: DeterministicRuleOutput,
    accessContext?: PatientAccessContext
  ): Agent2NavigationOutput;
  summarizeFeedback(feedback: PatientFeedback): Agent3FeedbackSummary;
}
