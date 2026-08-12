import { IAgentProvider, IntakeQuestion } from './agentProvider';
import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers } from '../types/clinical';
import { Agent1IntakeHandoff, Agent2NavigationOutput, Agent3FeedbackSummary } from '../types/agent';
import { PatientFeedback } from '../types/feedback';
import { PatientAccessContext } from '../types/access';
import { SupportedLocale } from '../types/i18n';
import { AccessMatchingEngine } from '../services/accessMatchingEngine';
import { getTranslation, translateEmergencyTitle } from '../locales';

export class LocalDemoAgentProvider implements IAgentProvider {
  private questions: Record<string, IntakeQuestion> = {
    // === NAIL PATHWAY QUESTIONS ===
    'nail_skin_broken': {
      id: 'skinBroken',
      scenario: 'nail_puncture',
      questionText: 'Did the nail or sharp object break the skin?',
      helpText: 'Superficial skin scrapes without breaking the skin layer do not require puncture triage.',
      type: 'radio',
      options: [
        { label: 'Yes, it broke the skin', value: 'Yes' },
        { label: 'No, it did not break the skin', value: 'No' },
        { label: 'I’m not sure', value: 'Unsure' }
      ]
    },
    'nail_timing': {
      id: 'timing',
      scenario: 'nail_puncture',
      questionText: 'When did this puncture happen?',
      type: 'radio',
      options: [
        { label: 'Less than 2 hours ago', value: 'under_2_hours' },
        { label: '2 to 6 hours ago', value: '2_to_6_hours' },
        { label: '6 to 24 hours ago', value: '6_to_24_hours' },
        { label: '1 to 3 days ago', value: '1_to_3_days' },
        { label: 'More than 3 days ago', value: 'over_3_days' },
        { label: 'I’m not sure', value: 'Unsure' }
      ]
    },
    'nail_retained_object': {
      id: 'retainedObject',
      scenario: 'nail_puncture',
      questionText: 'Is the nail or another object still stuck in your foot?',
      helpText: 'If a large or deeply embedded object remains, DO NOT try to remove it yourself.',
      type: 'radio',
      options: [
        { label: 'Yes, object is stuck in foot', value: 'Yes', isEmergencyStop: true },
        { label: 'No, object is out', value: 'No' },
        { label: 'I’m not sure', value: 'Unsure' }
      ]
    },
    'nail_bleeding': {
      id: 'bleeding',
      scenario: 'nail_puncture',
      questionText: 'Is the wound bleeding now?',
      type: 'radio',
      options: [
        { label: 'Mild bleeding and stops with pressure', value: 'mild' },
        { label: 'Moderate bleeding and restarts', value: 'moderate' },
        { label: 'Severe bleeding / does not stop with firm pressure', value: 'severe_uncontrolled', isEmergencyStop: true },
        { label: 'Unsure / not bleeding currently', value: 'unsure' }
      ]
    },
    'nail_location': {
      id: 'location',
      scenario: 'nail_puncture',
      questionText: 'Where is the puncture wound located?',
      type: 'radio',
      options: [
        { label: 'Sole / bottom of foot', value: 'sole' },
        { label: 'Heel', value: 'heel' },
        { label: 'Toe', value: 'toe' },
        { label: 'Top or side of foot', value: 'top_side' },
        { label: 'Near or inside a joint', value: 'joint', isEmergencyStop: true },
        { label: 'Other / Unsure', value: 'other' }
      ]
    },
    'nail_footwear': {
      id: 'footwear',
      scenario: 'nail_puncture',
      questionText: 'Did the nail go through a shoe or boot before entering your foot?',
      helpText: 'Punctures through footwear carry higher risk of specific bacterial contaminants like Pseudomonas.',
      type: 'radio',
      options: [
        { label: 'Yes, through shoe or boot', value: 'Yes' },
        { label: 'No, bare foot or sock only', value: 'No' },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_depth': {
      id: 'depth',
      scenario: 'nail_puncture',
      questionText: 'How deep does the puncture seem?',
      type: 'radio',
      options: [
        { label: 'Barely broke skin', value: 'barely' },
        { label: 'Shallow puncture', value: 'shallow' },
        { label: 'Deep puncture', value: 'deep' },
        { label: 'I cannot tell', value: 'cannot_tell' }
      ]
    },
    'nail_retained_material': {
      id: 'retainedMaterial',
      scenario: 'nail_puncture',
      questionText: 'Could part of the nail, shoe, sock, wood, metal, or dirt still be inside?',
      type: 'radio',
      options: [
        { label: 'Yes, possible retained debris', value: 'Yes' },
        { label: 'No', value: 'No' },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_movement': {
      id: 'movement',
      scenario: 'nail_puncture',
      questionText: 'Can you move your toes and foot normally?',
      type: 'radio',
      options: [
        { label: 'Yes, normal movement', value: 'Yes' },
        { label: 'No, restricted/cannot move', value: 'No', isEmergencyStop: true },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_sensation': {
      id: 'sensation',
      scenario: 'nail_puncture',
      questionText: 'Do you have new numbness, tingling, or loss of feeling?',
      type: 'radio',
      options: [
        { label: 'Yes, new numbness or tingling', value: 'Yes', isEmergencyStop: true },
        { label: 'No, normal feeling', value: 'No' }
      ]
    },
    'nail_circulation': {
      id: 'circulation',
      scenario: 'nail_puncture',
      questionText: 'Are your toes or foot unusually pale, blue, cold, or discoloured?',
      type: 'radio',
      options: [
        { label: 'Yes, cold/pale/blue', value: 'Yes', isEmergencyStop: true },
        { label: 'No, normal colour and warmth', value: 'No' },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_weight_bearing': {
      id: 'weightBearing',
      scenario: 'nail_puncture',
      questionText: 'Can you put weight on the foot?',
      type: 'radio',
      options: [
        { label: 'Yes, normally', value: 'Yes_normal' },
        { label: 'Yes, but painful', value: 'Yes_painful' },
        { label: 'No, cannot bear weight', value: 'No' },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_pain': {
      id: 'painTrend',
      scenario: 'nail_puncture',
      questionText: 'Is the pain improving, about the same, or getting worse?',
      type: 'radio',
      options: [
        { label: 'Improving', value: 'improving' },
        { label: 'About the same', value: 'same' },
        { label: 'Getting worse', value: 'worsening' }
      ]
    },
    'nail_rusty': {
      id: 'rusty',
      scenario: 'nail_puncture',
      questionText: 'Did the nail or object look rusty?',
      helpText: 'Note: Rust itself does not cause tetanus or alter urgency. Tetanus spores live in dirt and environment.',
      type: 'radio',
      options: [
        { label: 'Yes, nail was rusty', value: 'Yes' },
        { label: 'No, not rusty', value: 'No' },
        { label: 'Unsure', value: 'Unsure' }
      ]
    },
    'nail_contamination': {
      id: 'contamination',
      scenario: 'nail_puncture',
      questionText: 'Did the puncture involve any of these environment exposures?',
      type: 'checkbox',
      options: [
        { label: 'Soil / dirt / mud', value: 'soil_dirt' },
        { label: 'Animal or human waste', value: 'waste' },
        { label: 'Saliva / animal bite', value: 'saliva' },
        { label: 'Dirty or stagnant water', value: 'dirty_water' },
        { label: 'None of these', value: 'none' }
      ]
    },
    'nail_cleaning': {
      id: 'cleaning',
      scenario: 'nail_puncture',
      questionText: 'Were you able to thoroughly wash the wound with soap and water?',
      type: 'radio',
      options: [
        { label: 'Yes, washed thoroughly', value: 'Yes' },
        { label: 'No', value: 'No' },
        { label: 'Not yet', value: 'Not yet' }
      ]
    },
    'nail_infection_symptoms': {
      id: 'infectionSymptoms',
      scenario: 'nail_puncture',
      questionText: 'Are any of these infection symptoms happening now?',
      type: 'checkbox',
      options: [
        { label: 'Increasing redness or warmth', value: 'redness_warmth' },
        { label: 'Swelling or pus/drainage', value: 'pus_drainage' },
        { label: 'Red streaking up foot/leg', value: 'red_streaks' },
        { label: 'Fever or chills', value: 'fever' },
        { label: 'None of these', value: 'none' }
      ]
    },
    'nail_high_risk': {
      id: 'highRiskConditions',
      scenario: 'nail_puncture',
      questionText: 'Do you have any of these high-risk health conditions?',
      type: 'checkbox',
      options: [
        { label: 'Diabetes', value: 'diabetes' },
        { label: 'Poor circulation / peripheral artery disease', value: 'poor_circulation' },
        { label: 'Immunosuppression / chemotherapy / steroid medication', value: 'immunosuppression' },
        { label: 'Blood thinner use', value: 'blood_thinners' },
        { label: 'Surgical hardware (plates/screws/joint replacement) near wound', value: 'hardware' },
        { label: 'None of these', value: 'none' }
      ]
    },
    'nail_tetanus_series': {
      id: 'tetanusPrimarySeries',
      scenario: 'nail_puncture',
      questionText: 'Have you received at least three tetanus-containing vaccine doses in your lifetime?',
      type: 'radio',
      options: [
        { label: 'Yes, 3 or more lifetime doses', value: 'Yes' },
        { label: 'No, fewer than 3 doses', value: 'No' },
        { label: 'I’m not sure', value: 'Unsure' }
      ]
    },
    'nail_tetanus_last_dose': {
      id: 'tetanusLastDose',
      scenario: 'nail_puncture',
      questionText: 'When was your most recent tetanus-containing vaccine (e.g. Tdap, Td)?',
      type: 'radio',
      options: [
        { label: 'Less than 5 years ago', value: 'less_than_5' },
        { label: '5 to less than 10 years ago', value: '5_to_10' },
        { label: '10 or more years ago', value: 'more_than_10' },
        { label: 'I don’t know', value: 'unknown' }
      ]
    },

    // === HEADACHE PATHWAY QUESTIONS ===
    'headache_age': {
      id: 'age',
      scenario: 'headache',
      questionText: 'How old are you?',
      type: 'number',
      options: []
    },
    'headache_onset': {
      id: 'onset',
      scenario: 'headache',
      questionText: 'Did the headache build gradually, or did it reach maximum intensity immediately (within ~1 minute)?',
      type: 'radio',
      options: [
        { label: 'Gradually over minutes or hours', value: 'gradual' },
        { label: 'Immediately / within 1 minute (Thunderclap)', value: 'immediately', isEmergencyStop: true },
        { label: 'Unsure', value: 'unsure' }
      ]
    },
    'headache_first_worst': {
      id: 'firstOrWorst',
      scenario: 'headache',
      questionText: 'Is this your first severe headache or the worst headache you have ever experienced?',
      type: 'radio',
      options: [
        { label: 'Yes, first severe or worst headache of my life', value: 'Yes' },
        { label: 'No, I have had similar severe headaches before', value: 'No' }
      ]
    },
    'headache_different': {
      id: 'differentFromUsual',
      scenario: 'headache',
      questionText: 'Is this headache significantly different from headaches you usually get?',
      type: 'radio',
      options: [
        { label: 'Yes, significantly different', value: 'Yes' },
        { label: 'No, feels like my typical headache', value: 'No' }
      ]
    },
    'headache_neuro_flags': {
      id: 'neurologicalFlags',
      scenario: 'headache',
      questionText: 'Are any of these neurological warning symptoms happening now?',
      type: 'checkbox',
      options: [
        { label: 'New weakness in face, arm, or leg', value: 'weakness', isEmergencyStop: true },
        { label: 'New numbness or loss of feeling', value: 'numbness', isEmergencyStop: true },
        { label: 'Facial drooping', value: 'facial_droop', isEmergencyStop: true },
        { label: 'Difficulty speaking or understanding speech', value: 'speech_difficulty', isEmergencyStop: true },
        { label: 'Confusion, unusual behavior, or disorientation', value: 'confusion', isEmergencyStop: true },
        { label: 'Severe imbalance or inability to walk', value: 'imbalance', isEmergencyStop: true },
        { label: 'Fainting, blackout, or seizure', value: 'fainting', isEmergencyStop: true },
        { label: 'New vision loss or double vision', value: 'vision_loss', isEmergencyStop: true },
        { label: 'None of these', value: 'none' }
      ]
    },
    'headache_systemic_flags': {
      id: 'systemicFlags',
      scenario: 'headache',
      questionText: 'Are any of these systemic or infection symptoms present?',
      type: 'checkbox',
      options: [
        { label: 'Fever or chills', value: 'fever' },
        { label: 'Stiff neck (cannot touch chin to chest)', value: 'neck_stiffness', isEmergencyStop: true },
        { label: 'New concerning non-blanching rash', value: 'rash', isEmergencyStop: true },
        { label: 'None of these', value: 'none' }
      ]
    },
    'headache_pregnancy': {
      id: 'pregnancy',
      scenario: 'headache',
      questionText: 'Are you currently pregnant or have you recently given birth (within 6 weeks)?',
      type: 'radio',
      options: [
        { label: 'Currently pregnant', value: 'pregnant' },
        { label: 'Recently given birth (postpartum)', value: 'postpartum' },
        { label: 'No / Not applicable', value: 'neither' }
      ]
    },
    'headache_onset_context': {
      id: 'onsetContext',
      scenario: 'headache',
      questionText: 'Did the headache begin during or immediately after any of these activities?',
      type: 'checkbox',
      options: [
        { label: 'Strenuous exercise or heavy lifting', value: 'exercise' },
        { label: 'Coughing, sneezing, or straining', value: 'coughing' },
        { label: 'Sexual activity', value: 'sexual_activity' },
        { label: 'None of these', value: 'none' }
      ]
    },

    // === FEVER PATHWAY QUESTIONS ===
    'fever_confirm': {
      id: 'feverish',
      scenario: 'fever',
      questionText: 'Have you measured your body temperature?',
      type: 'radio',
      options: [
        { label: 'Yes, measured with a thermometer', value: 'Yes' },
        { label: 'No, but I feel feverish or have chills', value: 'No_feeling_feverish' },
        { label: 'No', value: 'No' }
      ]
    },
    'fever_life_threat': {
      id: 'lifeThreats',
      scenario: 'fever',
      questionText: 'Is any of the following happening right now?',
      type: 'checkbox',
      options: [
        { label: 'Person is unresponsive or unawakable', value: 'unresponsive', isEmergencyStop: true },
        { label: 'Severe breathing difficulty, gasping, or blue lips', value: 'not_breathing', isEmergencyStop: true },
        { label: 'Seizure happening right now', value: 'seizure_now', isEmergencyStop: true },
        { label: 'Collapsed and appears critically unwell', value: 'collapsed', isEmergencyStop: true },
        { label: 'None of these', value: 'none' }
      ]
    },
    'fever_emergency_flags': {
      id: 'emergencyFlags',
      scenario: 'fever',
      questionText: 'Is your fever accompanied by any of these warning signs?',
      type: 'checkbox',
      options: [
        { label: 'New confusion or strange behavior', value: 'confusion', isEmergencyStop: true },
        { label: 'Severe headache with stiff neck', value: 'stiff_neck', isEmergencyStop: true },
        { label: 'Purple or non-blanching bruise-like rash', value: 'purple_rash', isEmergencyStop: true },
        { label: 'Severe persistent chest pain or pressure', value: 'chest_pain', isEmergencyStop: true },
        { label: 'Unable to swallow liquids or drooling', value: 'unable_to_swallow', isEmergencyStop: true },
        { label: 'None of these', value: 'none' }
      ]
    },
    'fever_high_risk': {
      id: 'highRiskHost',
      scenario: 'fever',
      questionText: 'Do any of these high-risk medical contexts apply to you?',
      type: 'checkbox',
      options: [
        { label: 'Known low white blood cell count (neutropenia)', value: 'neutropenia', isEmergencyStop: true },
        { label: 'Currently or recently receiving chemotherapy', value: 'chemotherapy', isEmergencyStop: true },
        { label: 'Organ or stem-cell transplant recipient', value: 'transplant' },
        { label: 'Taking immunosuppressive medications', value: 'immunosuppressed' },
        { label: 'Pregnant or recently postpartum', value: 'pregnancy' },
        { label: 'Age 65 or older', value: 'age_65' },
        { label: 'None of these', value: 'none' }
      ]
    },
    'fever_associated_branch': {
      id: 'associatedBranch',
      scenario: 'fever',
      questionText: 'Which associated symptom is most concerning alongside your fever?',
      type: 'radio',
      options: [
        { label: 'Sore throat', value: 'sore_throat' },
        { label: 'Cough or breathing symptoms', value: 'cough' },
        { label: 'Urinary symptoms (burning, frequency, flank pain)', value: 'urinary' },
        { label: 'Abdominal pain', value: 'abdominal' },
        { label: 'Skin redness, wound, or swelling', value: 'skin' },
        { label: 'General fever / chills without localizing symptoms', value: 'general' }
      ]
    }
  };

  getQuestionForPathway(scenario: ClinicalPathwayId, questionId: string, locale: SupportedLocale = 'en'): IntakeQuestion | null {
    const q = this.questions[questionId];
    if (!q) return null;

    if (locale === 'fr') {
      // Basic French translation overlay for question prompts
      return {
        ...q,
        questionText: getTranslation('fr', questionId as any) || q.questionText
      };
    }

    return q;
  }

  getQuestionSequence(scenario: ClinicalPathwayId): string[] {
    switch (scenario) {
      case 'nail_puncture':
        return [
          'nail_skin_broken',
          'nail_timing',
          'nail_retained_object',
          'nail_bleeding',
          'nail_location',
          'nail_footwear',
          'nail_depth',
          'nail_retained_material',
          'nail_movement',
          'nail_sensation',
          'nail_circulation',
          'nail_weight_bearing',
          'nail_pain',
          'nail_rusty',
          'nail_contamination',
          'nail_cleaning',
          'nail_infection_symptoms',
          'nail_high_risk',
          'nail_tetanus_series',
          'nail_tetanus_last_dose'
        ];
      case 'headache':
        return [
          'headache_age',
          'headache_onset',
          'headache_first_worst',
          'headache_different',
          'headache_neuro_flags',
          'headache_systemic_flags',
          'headache_pregnancy',
          'headache_onset_context'
        ];
      case 'fever':
        return [
          'fever_confirm',
          'fever_life_threat',
          'fever_emergency_flags',
          'fever_high_risk',
          'fever_associated_branch'
        ];
      default:
        return [];
    }
  }

  generateIntakeHandoff(
    sessionId: string,
    scenario: ClinicalPathwayId,
    answers: PatientAnswers,
    preferredLanguage: SupportedLocale = 'en',
    interpreterNeeded: boolean = false
  ): Agent1IntakeHandoff {
    const missingFields: string[] = [];
    const uncertainties: string[] = [];
    let emergencyStopDetected = false;
    let triggeredEmergencyRuleId: string | undefined;

    // Check emergency stops
    if (scenario === 'nail_puncture') {
      if (answers.bleeding === 'severe_uncontrolled') {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'NAIL-E01';
      } else if (answers.retainedObject === 'Yes') {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'NAIL-E03';
      } else if (answers.circulation === 'Yes' || answers.movement === 'No' || answers.sensation === 'Yes') {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'NAIL-E02';
      }
    } else if (scenario === 'headache') {
      if (answers.onset === 'immediately') {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'HEADACHE-E01';
      } else if (answers.neurologicalFlags && answers.neurologicalFlags.some((f: string) => f !== 'none')) {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'HEADACHE-E02';
      }
    } else if (scenario === 'fever') {
      if (answers.lifeThreats && answers.lifeThreats.some((f: string) => f !== 'none')) {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'FEVER-E00';
      } else if (answers.emergencyFlags && answers.emergencyFlags.some((f: string) => f !== 'none')) {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'FEVER-E01';
      } else if (answers.highRiskHost && answers.highRiskHost.includes('neutropenia')) {
        emergencyStopDetected = true;
        triggeredEmergencyRuleId = 'FEVER-H01';
      }
    }

    return {
      sessionId,
      scenario,
      answers,
      missingFields,
      uncertainties,
      emergencyStopDetected,
      triggeredEmergencyRuleId,
      preferredLanguage,
      interpreterNeeded,
      agentVersion: 'intake-v1.1',
      timestamp: new Date().toISOString()
    };
  }

  generateNavigationExplanation(
    handoff: Agent1IntakeHandoff,
    ruleOutput: DeterministicRuleOutput,
    accessContext?: PatientAccessContext
  ): Agent2NavigationOutput {
    const locale = handoff.preferredLanguage || 'en';
    const displayTitle = translateEmergencyTitle(locale, ruleOutput.messageKey);
    let displaySubtitle = '';
    let plainLanguageRationale = ruleOutput.explanation;
    const nextSteps: string[] = [];

    switch (ruleOutput.disposition) {
      case 'CALL_911_NOW':
        displaySubtitle = getTranslation(locale, 'CALL_911_NOW_SUBTITLE');
        nextSteps.push('Call 9-1-1 or have someone call for you immediately.');
        nextSteps.push('Stay calm and follow dispatcher instructions.');
        break;
      case 'GO_TO_ED_NOW':
        displaySubtitle = getTranslation(locale, 'GO_TO_ED_NOW_SUBTITLE');
        nextSteps.push('Proceed directly to the nearest Emergency Department.');
        nextSteps.push('Do not drive yourself if feeling uncoordinated, confused, or severely unwell.');
        break;
      case 'SAME_DAY_CLINICAL_ASSESSMENT':
        displaySubtitle = getTranslation(locale, 'SAME_DAY_ASSESSMENT_SUBTITLE');
        nextSteps.push('Visit an Urgent and Primary Care Centre (UPCC), walk-in clinic, or primary care provider today.');
        nextSteps.push('Call HealthLink BC at 8-1-1 if you need help finding an open facility.');
        break;
      case 'CONTACT_811_OR_PRIMARY_CARE':
        displaySubtitle = getTranslation(locale, 'CONTACT_811_SUBTITLE');
        nextSteps.push('Call HealthLink BC at 8-1-1 to speak with a Registered Nurse.');
        nextSteps.push('Book an appointment with your family physician or nurse practitioner.');
        break;
      case 'HOME_MONITOR_WITH_SAFETY_NET':
        displaySubtitle = getTranslation(locale, 'HOME_MONITOR_SUBTITLE');
        nextSteps.push('Follow general home care measures as outlined.');
        nextSteps.push('Monitor closely for any new or worsening symptoms.');
        break;
    }

    // Default access context if omitted
    const effectiveAccessContext: PatientAccessContext = accessContext || {
      locationMethod: 'skipped',
      rurality: 'Unknown',
      travelTimeCategory: 'UNKNOWN',
      hasReliableTransport: 'Not_Applicable',
      accessBarriers: [],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: handoff.interpreterNeeded,
      interpreterRequested: handoff.interpreterNeeded
    };

    // Evaluate Access & Service Match Engine
    const accessEngineOutput = AccessMatchingEngine.evaluateAccessAndServiceMatch(
      handoff.scenario,
      ruleOutput,
      effectiveAccessContext
    );

    return {
      sessionId: handoff.sessionId,
      disposition: ruleOutput.disposition, // GUARANTEED UNCHANGED
      displayTitle,
      displaySubtitle,
      plainLanguageRationale,
      triggeredPatientFacts: ruleOutput.triggeredBy,
      nextSteps,
      safetyNetInstructions: ruleOutput.safetyNet,
      careCategoryOptions: [ruleOutput.destinationType],
      accessBarriers: effectiveAccessContext.accessBarriers,
      conceptualHandoffNotice: getTranslation(locale, 'conceptualNotice'),
      ruleId: ruleOutput.ruleId,
      ruleVersion: ruleOutput.ruleVersion,
      requiresHumanReview: ruleOutput.requiresHumanReview,
      accessEngineOutput
    };
  }

  summarizeFeedback(feedback: PatientFeedback): Agent3FeedbackSummary {
    let theme = 'General User Experience';
    if (feedback.reportedBarriers && feedback.reportedBarriers.length > 0) {
      theme = `Access Barrier: ${feedback.reportedBarriers.join(', ')}`;
    } else if (feedback.nextStepClear === 'No' || feedback.rationaleUnderstood === 'No') {
      theme = 'Clarity & Comprehension Issue';
    } else if (feedback.careOptionsRealistic === 'No') {
      theme = 'Unrealistic Care Recommendation in Community';
    } else if (feedback.confidenceScore <= 2) {
      theme = 'Low Confidence Recommendation';
    }

    return {
      sessionId: feedback.sessionId,
      scenario: feedback.scenario,
      disposition: feedback.disposition,
      ruleId: feedback.ruleId,
      ruleVersion: feedback.ruleVersion,
      clarityRating: feedback.easyToUseScore,
      rationaleUnderstood: feedback.rationaleUnderstood,
      confidenceScore: feedback.confidenceScore,
      canFollowRecommendation: feedback.canFollowRecommendation,
      reportedBarriers: feedback.reportedBarriers || [],
      feedbackTheme: theme,
      patientComments: feedback.confusingOrMissingComments || '',
      accessRealismScore: feedback.careOptionsRealistic,
      culturalSafetyScore: feedback.culturallyRespectful,
      timestamp: feedback.timestamp
    };
  }
}
