import { ClinicalPathwayId, Disposition } from '../types/clinical';
import { PatientAccessContext } from '../types/access';
import { SupportedLocale } from '../types/i18n';

export interface DemoCase {
  id: string;
  title: string;
  scenario: ClinicalPathwayId;
  description: string;
  patientAnswers: Record<string, any>;
  expectedDisposition: Disposition;
  expectedRuleId: string;
  accessContext?: PatientAccessContext;
  locale?: SupportedLocale;
  keyLearningPoints: string[];
}

export const ACADEMIC_DEMO_CASES: DemoCase[] = [
  {
    id: 'DEMO-A1',
    title: 'DEMO A1 — Nail Through Running Shoe',
    scenario: 'nail_puncture',
    description: 'Adult stepped on a nail through a running shoe 2 hours ago. Nail removed, bleeding stopped, normal movement & sensation, depth uncertain. Tetanus series complete, last vaccine 7 years ago.',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: 'under_2_hours',
      retainedObject: 'No',
      bleeding: 'unsure',
      location: 'sole',
      footwear: 'Yes',
      depth: 'cannot_tell',
      retainedMaterial: 'No',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_painful',
      painTrend: 'same',
      rusty: 'No',
      contamination: ['none'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: '5_to_10'
    },
    expectedDisposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
    expectedRuleId: 'NAIL-S01',
    keyLearningPoints: [
      'Same-day assessment triggered by footwear penetration and uncertain depth.',
      'Tetanus vaccine booster recommended as >5 years elapsed since last dose.',
      'Tetanus Immune Globulin (TIg) not routinely indicated for completed primary series.'
    ]
  },
  {
    id: 'DEMO-A2',
    title: 'DEMO A2 — Unknown Tetanus Immunization History',
    scenario: 'nail_puncture',
    description: 'Moderate puncture wound. No emergency neurovascular findings. Tetanus primary immunization history unknown.',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: '2_to_6_hours',
      retainedObject: 'No',
      bleeding: 'mild',
      location: 'sole',
      footwear: 'No',
      depth: 'shallow',
      retainedMaterial: 'No',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_normal',
      painTrend: 'improving',
      rusty: 'No',
      contamination: ['soil_dirt'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Unsure',
      tetanusLastDose: 'unknown'
    },
    expectedDisposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
    expectedRuleId: 'NAIL-S01',
    keyLearningPoints: [
      'Uncertain primary immunization series triggers conservative clinician assessment.',
      'Tetanus vaccine indicated; TIg assessment flagged for clinician confirmation (Rule TETANUS-T01).'
    ]
  },
  {
    id: 'DEMO-A3',
    title: 'DEMO A3 — Nail Emergency (Neurovascular Compromise)',
    scenario: 'nail_puncture',
    description: 'Deep puncture wound followed by pale/cold toes and loss of sensation/movement.',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: 'under_2_hours',
      retainedObject: 'No',
      bleeding: 'moderate',
      location: 'sole',
      footwear: 'No',
      depth: 'deep',
      retainedMaterial: 'No',
      movement: 'No',
      sensation: 'Yes',
      circulation: 'Yes',
      weightBearing: 'No',
      painTrend: 'worsening',
      rusty: 'No',
      contamination: ['none'],
      cleaning: 'No',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    },
    expectedDisposition: 'GO_TO_ED_NOW',
    expectedRuleId: 'NAIL-E02',
    keyLearningPoints: [
      'Early emergency stop triggered by cold/pale foot and loss of normal movement/sensation.',
      'Routine questioning is halted immediately for emergency redirection.'
    ]
  },
  {
    id: 'DEMO-A4',
    title: 'DEMO A4 — Rust Rule Equivalence Test',
    scenario: 'nail_puncture',
    description: 'Runs identical clinical cases with rusty=true vs rusty=false to prove zero independent decision weight for rust.',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: '2_to_6_hours',
      retainedObject: 'No',
      bleeding: 'mild',
      location: 'sole',
      footwear: 'No',
      depth: 'shallow',
      retainedMaterial: 'No',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_normal',
      painTrend: 'same',
      rusty: 'Yes',
      contamination: ['none'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    },
    expectedDisposition: 'HOME_MONITOR_WITH_SAFETY_NET',
    expectedRuleId: 'NAIL-H01',
    keyLearningPoints: [
      'Proves rust has ZERO decision weight in clinical disposition.',
      'Explains patient-facing distinction between tetanus bacteria habitat vs rust oxidation.'
    ]
  },
  {
    id: 'DEMO-B1',
    title: 'DEMO B1 — Thunderclap Headache Emergency',
    scenario: 'headache',
    description: 'Adult reports sudden severe headache reaching maximum intensity in <1 minute while exercising. "Worst headache of my life."',
    patientAnswers: {
      age: 38,
      onset: 'immediately',
      thunderclap: true,
      firstOrWorst: 'Yes',
      differentFromUsual: 'Yes',
      neurologicalFlags: ['none'],
      systemicFlags: ['none'],
      pregnancy: 'neither',
      onsetContext: ['exercise']
    },
    expectedDisposition: 'GO_TO_ED_NOW',
    expectedRuleId: 'HEADACHE-E01',
    keyLearningPoints: [
      'Rule HEADACHE-E01 triggers GO_TO_ED_NOW immediately.',
      'Early emergency stop halts remaining headache questions.',
      'Explains thunderclap warning sign without giving diagnostic labels.'
    ]
  },
  {
    id: 'DEMO-B2',
    title: 'DEMO B2 — Lower-Risk Established Headache',
    scenario: 'headache',
    description: 'Adult reports headache identical to usual previously diagnosed migraines. Gradual onset, no red flags, no neuro deficits.',
    patientAnswers: {
      age: 34,
      onset: 'gradual',
      firstOrWorst: 'No',
      differentFromUsual: 'No',
      neurologicalFlags: ['none'],
      systemicFlags: ['none'],
      pregnancy: 'neither',
      onsetContext: ['none']
    },
    expectedDisposition: 'HOME_MONITOR_WITH_SAFETY_NET',
    expectedRuleId: 'HEADACHE-H01',
    keyLearningPoints: [
      'Lower-acuity home monitoring requires negative red-flag screen and usual pattern.',
      'Reinforces clear limitations and emergency safety-net warning signs.'
    ]
  },
  {
    id: 'DEMO-C1',
    title: 'DEMO C1 — Fever with New Confusion',
    scenario: 'fever',
    description: 'Adult with measured temperature 38.8°C presenting with new confusion and drowsiness.',
    patientAnswers: {
      feverish: 'Yes',
      temperatureValue: 38.8,
      temperatureUnit: 'C',
      lifeThreats: ['none'],
      emergencyFlags: ['confusion'],
      highRiskHost: ['none'],
      associatedBranch: 'general'
    },
    expectedDisposition: 'GO_TO_ED_NOW',
    expectedRuleId: 'FEVER-E01',
    keyLearningPoints: [
      'New confusion with fever triggers emergency escalation (Rule FEVER-E01).',
      'Halts lower-acuity question branches.'
    ]
  },

  // --- NEW ACCESS-AWARE & MULTILINGUAL DEMO CASES ---
  {
    id: 'REMOTE-DEMO-1',
    title: 'REMOTE DEMO 1 — Nail Puncture in Rural Northern BC',
    scenario: 'nail_puncture',
    description: 'Patient stepped on a nail through a shoe in Hazelton, BC (>60 mins travel time to hospital, limited transport, FNHA options requested).',
    patientAnswers: {
      skinBroken: 'Yes',
      timing: '2_to_6_hours',
      retainedObject: 'No',
      bleeding: 'mild',
      location: 'sole',
      footwear: 'Yes',
      depth: 'cannot_tell',
      retainedMaterial: 'No',
      movement: 'Yes',
      sensation: 'No',
      circulation: 'No',
      weightBearing: 'Yes_painful',
      rusty: 'No',
      contamination: ['none'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: '5_to_10'
    },
    expectedDisposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
    expectedRuleId: 'NAIL-S01',
    accessContext: {
      locationMethod: 'community',
      communityName: 'Hazelton',
      healthAuthority: 'Northern Health',
      rurality: 'Remote',
      travelTimeCategory: '60_TO_120_MINUTES',
      hasReliableTransport: 'Difficulty',
      accessBarriers: ['Distance', 'Transportation'],
      firstNationsServicesRequested: true,
      communicationSupportNeeded: false,
      interpreterRequested: false
    },
    keyLearningPoints: [
      'Clinical urgency remains SAME_DAY_CLINICAL_ASSESSMENT despite remote geography.',
      'Identifies requirement for in-person wound exam; virtual care CANNOT replace hands-on exam.',
      'FNHA Virtual Doctor of the Day displayed as additional navigation/support.'
    ]
  },
  {
    id: 'REMOTE-DEMO-2',
    title: 'REMOTE DEMO 2 — Lower-Risk Fever in Northern Health Region',
    scenario: 'fever',
    description: 'Stable adult fever in Smithers region. Clinical result: CONTACT_811_OR_PRIMARY_CARE. Local clinic closed.',
    patientAnswers: {
      feverish: 'Yes',
      temperatureValue: 38.1,
      temperatureUnit: 'C',
      lifeThreats: ['none'],
      emergencyFlags: ['none'],
      highRiskHost: ['none'],
      associatedBranch: 'general',
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    },
    expectedDisposition: 'HOME_MONITOR_WITH_SAFETY_NET',
    expectedRuleId: 'FEVER-L01',
    accessContext: {
      locationMethod: 'community',
      communityName: 'Smithers',
      healthAuthority: 'Northern Health',
      rurality: 'Rural Hub',
      travelTimeCategory: '30_TO_60_MINUTES',
      hasReliableTransport: 'Yes',
      accessBarriers: ['Clinic availability'],
      firstNationsServicesRequested: true,
      communicationSupportNeeded: false,
      interpreterRequested: false
    },
    keyLearningPoints: [
      'Virtual care is considered appropriate for non-emergency primary care guidance.',
      'Presents Northern Health Virtual Clinic and FNHA Virtual Doctor of the Day as realistic access pathways.',
      'Clinical disposition is preserved unchanged.'
    ]
  },
  {
    id: 'REMOTE-DEMO-3',
    title: 'REMOTE DEMO 3 — Emergency Headache >90 Mins From ED',
    scenario: 'headache',
    description: 'Thunderclap headache in remote Northern BC (>90 mins from nearest Emergency Department).',
    patientAnswers: {
      age: 45,
      onset: 'immediately',
      thunderclap: true,
      firstOrWorst: 'Yes',
      differentFromUsual: 'Yes',
      neurologicalFlags: ['none'],
      systemicFlags: ['none']
    },
    expectedDisposition: 'GO_TO_ED_NOW',
    expectedRuleId: 'HEADACHE-E01',
    accessContext: {
      locationMethod: 'community',
      communityName: 'Remote Northern BC',
      healthAuthority: 'Northern Health',
      rurality: 'Remote',
      travelTimeCategory: 'MORE_THAN_120_MINUTES',
      hasReliableTransport: 'Difficulty',
      accessBarriers: ['Distance'],
      firstNationsServicesRequested: false,
      communicationSupportNeeded: false,
      interpreterRequested: false
    },
    keyLearningPoints: [
      'Emergency disposition GO_TO_ED_NOW remains prominent.',
      'Distance from hospital does NOT lower clinical urgency or delay emergency messaging.',
      'Virtual care is explicitly NOT presented as a replacement for emergency care.'
    ]
  },
  {
    id: 'LANGUAGE-DEMO-1',
    title: 'LANGUAGE DEMO 1 — French Static UI Pathway',
    scenario: 'fever',
    description: 'Runs fever emergency screening in French locale. Proves identical canonical variable evaluation.',
    locale: 'fr',
    patientAnswers: {
      feverish: 'Yes',
      emergencyFlags: ['confusion']
    },
    expectedDisposition: 'GO_TO_ED_NOW',
    expectedRuleId: 'FEVER-E01',
    keyLearningPoints: [
      'Renders translated French UI text while operating on canonical structured inputs.',
      'Proves language selection produces 100% IDENTICAL clinical disposition.'
    ]
  },
  {
    id: 'LANGUAGE-DEMO-2',
    title: 'LANGUAGE DEMO 2 — Other Language 8-1-1 Interpreter Pathway',
    scenario: 'nail_puncture',
    description: 'Patient selects Punjabi / Other Language. Activates 8-1-1 translation pathway notice and call button.',
    locale: 'other',
    patientAnswers: {
      skinBroken: 'Yes',
      footwear: 'Yes',
      depth: 'cannot_tell',
      retainedObject: 'No',
      circulation: 'No',
      movement: 'Yes'
    },
    expectedDisposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
    expectedRuleId: 'NAIL-S01',
    keyLearningPoints: [
      'Displays unvalidated translation disclaimer.',
      'Directs patient to HealthLink BC 8-1-1 for 24/7 translation support in >130 languages.',
      'Emergency actions and clinical recommendation remain fully visible.'
    ]
  }
];
