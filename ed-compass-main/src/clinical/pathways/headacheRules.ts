import { DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { BC_EVIDENCE_SOURCES } from '../evidenceMetadata';

function cleanSelections(arr: any): string[] {
  if (!arr) return [];
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter((item) => item && item !== 'none' && item !== 'NONE_OF_THESE');
}

export function evaluateHeadacheRules(answers: PatientAnswers): DeterministicRuleOutput {
  // --- 1. IMMEDIATE LIFE THREAT SCREEN (CTAS Level 1 / CALL_911_NOW) ---
  const lifeThreats = cleanSelections(answers.lifeThreats || answers.selectedImmediateThreats);
  if (lifeThreats.length > 0) {
    const labelMap: Record<string, string> = {
      unresponsive: 'Difficult to wake, cannot stay awake, or lost consciousness',
      lost_consciousness: 'Difficult to wake, cannot stay awake, or lost consciousness',
      seizure_now: 'A seizure is happening now',
      stroke_like: 'Sudden new weakness on one side, facial drooping, or major difficulty speaking',
      severe_imbalance: 'Suddenly cannot walk safely or severe loss of balance',
      critically_unwell: 'Appears critically unwell or rapidly becoming less responsive'
    };
    const mappedTriggers = lifeThreats.map((t) => labelMap[t] || t);

    return {
      disposition: 'CALL_911_NOW',
      ctasLevel: 1,
      timing: 'immediately',
      destinationType: 'Emergency Department / 9-1-1',
      ruleId: 'HEADACHE-E00',
      ruleVersion: '1.0',
      triggeredBy: mappedTriggers,
      safetyNet: [
        'Call 9-1-1 immediately.',
        'Do not drive yourself. Have someone stay with the patient.',
        'Keep the patient safe from injury if a seizure occurred.'
      ],
      requiresHumanReview: false,
      explanation: `Immediate life-threatening neurological or systemic finding detected: ${mappedTriggers.join(', ')}. Emergency 9-1-1 response required.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 2. SUDDEN / THUNDERCLAP HEADACHE SCREEN (CTAS Level 2 / GO_TO_ED_NOW) ---
  if (
    answers.onset === 'immediately' ||
    answers.thunderclap === true ||
    answers.suddenMaximalOnset === 'Yes' ||
    answers.suddenMaximalOnset === true
  ) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'HEADACHE-E01',
      ruleVersion: '1.0',
      triggeredBy: ['Your headache became severe suddenly and reached its maximum intensity within about one minute.'],
      safetyNet: [
        'Do not drive yourself. Have someone drive you or call 9-1-1 if needed.',
        'Proceed immediately to the nearest Emergency Department.'
      ],
      requiresHumanReview: false,
      explanation: 'Headache onset was sudden and reached maximum intensity within about one minute (thunderclap onset). Immediate emergency evaluation is required.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 3. NEW NEUROLOGICAL AND MAJOR VISUAL SYMPTOMS ---
  const neuroRedFlags = cleanSelections(answers.neurologicalFlags || answers.selectedNeurologicalSymptoms);
  
  // Check if any life-threatening neuro findings present
  if (
    neuroRedFlags.includes('active_seizure') ||
    neuroRedFlags.includes('unconscious') ||
    neuroRedFlags.includes('cannot_awaken') ||
    neuroRedFlags.includes('stroke_severe')
  ) {
    return {
      disposition: 'CALL_911_NOW',
      ctasLevel: 1,
      timing: 'immediately',
      destinationType: 'Emergency Department / 9-1-1',
      ruleId: 'HEADACHE-E00',
      ruleVersion: '1.0',
      triggeredBy: ['Critical neurological threat detected'],
      safetyNet: ['Call 9-1-1 immediately.', 'Do not drive yourself.'],
      requiresHumanReview: false,
      explanation: 'Headache with critical neurological impairment requires immediate emergency 9-1-1 response.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // Check emergency focal neuro red flags
  const emergencyNeuroTriggers: string[] = [];
  const neuroLabelMap: Record<string, string> = {
    weakness: 'You reported new weakness or numbness with your headache.',
    numbness: 'You reported new weakness or numbness with your headache.',
    facial_droop: 'You reported new facial drooping with your headache.',
    speech_difficulty: 'You reported new difficulty speaking or understanding speech.',
    imbalance: 'You reported new severe difficulty walking or major loss of balance.',
    confusion: 'You reported new confusion or unusual behaviour with your headache.',
    fainting: 'You reported fainting or loss of consciousness with your headache.',
    seizure: 'You reported a new seizure with your headache.',
    vision_loss: 'You reported new loss of vision with your headache.',
    double_vision: 'You reported new double vision with your headache.'
  };

  neuroRedFlags.forEach((flag) => {
    if (neuroLabelMap[flag]) {
      emergencyNeuroTriggers.push(neuroLabelMap[flag]);
    }
  });

  if (emergencyNeuroTriggers.length > 0) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'HEADACHE-E02',
      ruleVersion: '1.0',
      triggeredBy: emergencyNeuroTriggers,
      safetyNet: [
        'Do not drive yourself. Have someone drive you to an Emergency Department or call 9-1-1.',
        'Seek immediate emergency medical evaluation.'
      ],
      requiresHumanReview: false,
      explanation: `New significant neurological or visual symptoms detected: ${emergencyNeuroTriggers.join(' ')}. Emergency medical assessment is required immediately.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 4. SERIOUS INFECTION / SYSTEMIC RED FLAGS ---
  const systemicFlags = cleanSelections(answers.systemicFlags || answers.selectedSystemicRedFlags);
  if (
    systemicFlags.includes('fever_stiff_neck') ||
    systemicFlags.includes('fever_rash') ||
    systemicFlags.includes('fever_confusion') ||
    systemicFlags.includes('fever_severely_unwell') ||
    (systemicFlags.includes('fever') && (systemicFlags.includes('neck_stiffness') || systemicFlags.includes('rash')))
  ) {
    const isLevel1 = systemicFlags.includes('fever_confusion') || systemicFlags.includes('unresponsive');
    return {
      disposition: isLevel1 ? 'CALL_911_NOW' : 'GO_TO_ED_NOW',
      ctasLevel: isLevel1 ? 1 : 2,
      timing: isLevel1 ? 'immediately' : 'now',
      destinationType: isLevel1 ? 'Emergency Department / 9-1-1' : 'Emergency Department',
      ruleId: 'HEADACHE-E04',
      ruleVersion: '1.0',
      triggeredBy: ['You reported fever combined with neck stiffness, unusual rash, or severe illness.'],
      safetyNet: ['Proceed directly to the nearest Emergency Department.', 'Do not wait for a clinic appointment.'],
      requiresHumanReview: false,
      explanation: 'Headache combined with fever and neck stiffness, rash, or severe illness requires urgent emergency evaluation for potential central nervous system infection.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 5. PAINFUL RED EYE / EYE EMERGENCY ---
  const eyePain = answers.painfulRedEye === 'Yes' || answers.painfulRedEye === true;
  const visualDisturbance = answers.visualDisturbance === 'Yes' || answers.visualDisturbance === 'halos' || answers.visualDisturbance === 'blurred' || answers.visualDisturbance === 'loss';
  
  if (eyePain && (visualDisturbance || answers.eyeVisionChange === 'Yes')) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'HEADACHE-E06',
      ruleVersion: '1.0',
      triggeredBy: ['You reported severe eye pain or a very painful red eye accompanied by visual disturbance.'],
      safetyNet: ['Seek immediate emergency ocular and medical evaluation.'],
      requiresHumanReview: false,
      explanation: 'Headache accompanied by a painful red eye and visual changes (halos, blurred vision, or vision loss) requires immediate emergency evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 6. PREGNANCY / POSTPARTUM EMERGENCY RED FLAGS ---
  const isPregnantOrPostpartum = answers.pregnancy === 'pregnant' || answers.pregnancy === 'postpartum' || answers.pregnancyStatus === 'pregnant' || answers.postpartumStatus === 'postpartum';
  
  if (isPregnantOrPostpartum) {
    const pregEmergency =
      answers.pregnancyEmergency === 'Yes' ||
      answers.firstOrWorst === 'Yes' ||
      answers.differentFromUsual === 'Yes' ||
      answers.headacheOnsetTime === 'sudden';

    if (pregEmergency && (neuroRedFlags.length > 0 || systemicFlags.length > 0 || answers.onset === 'immediately')) {
      return {
        disposition: 'GO_TO_ED_NOW',
        ctasLevel: 2,
        timing: 'now',
        destinationType: 'Emergency Department',
        ruleId: 'HEADACHE-E07',
        ruleVersion: '1.0',
        triggeredBy: ['You reported a severe new headache during pregnancy or the postpartum period with concerning features.'],
        safetyNet: ['Seek immediate emergency medical/obstetrical evaluation.'],
        requiresHumanReview: true,
        explanation: 'New or severe headache during pregnancy or the postpartum period with concerning symptoms requires emergency medical assessment.',
        evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
        frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
      };
    }
  }

  // --- 7. HEAD OR NECK TRAUMA EMERGENCY ---
  const recentTrauma = answers.trauma === 'Yes' || answers.recentHeadTrauma === 'Yes' || answers.recentHeadTrauma === true;
  if (recentTrauma) {
    const traumaEmergencyTriggers = cleanSelections(answers.traumaSymptoms);
    const takingBloodThinners = answers.anticoagulants === 'Yes' || answers.anticoagulantUse === 'Yes' || answers.anticoagulantUse === true;
    const traumaVomiting = answers.vomiting === 'Yes' || answers.persistentVomiting === 'Yes' || answers.persistentVomiting === true;
    const traumaConfusion = traumaEmergencyTriggers.includes('confusion') || traumaEmergencyTriggers.includes('fainting') || neuroRedFlags.length > 0;

    if (takingBloodThinners || traumaVomiting || traumaConfusion || traumaEmergencyTriggers.length > 0) {
      return {
        disposition: 'GO_TO_ED_NOW',
        ctasLevel: 2,
        timing: 'now',
        destinationType: 'Emergency Department',
        ruleId: 'HEADACHE-E08',
        ruleVersion: '1.0',
        triggeredBy: ['You reported a headache following head/neck injury with concerning symptoms or blood-thinner use.'],
        safetyNet: ['Proceed directly to the Emergency Department.'],
        requiresHumanReview: false,
        explanation: 'Headache following head or neck trauma in a patient taking prescription blood thinners or experiencing vomiting/neurological symptoms requires emergency neuroimaging.',
        evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
        frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
      };
    }
  }

  // --- 8. SUDDEN EXERTIONAL TRIGGERED HEADACHE ---
  const triggerContext = cleanSelections(answers.onsetContext || answers.exertionTrigger);
  const isExertionalTrigger =
    triggerContext.includes('exercise') ||
    triggerContext.includes('coughing') ||
    triggerContext.includes('straining') ||
    triggerContext.includes('sexual_activity');

  if (isExertionalTrigger && (answers.onset === 'immediately' || answers.suddenMaximalOnset === 'Yes' || answers.thunderclap === true)) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'HEADACHE-E05',
      ruleVersion: '1.0',
      triggeredBy: ['You reported a sudden headache reaching maximum intensity immediately during or after exertion, coughing, straining, or sexual activity.'],
      safetyNet: ['Avoid physical exertion.', 'Proceed to an Emergency Department.'],
      requiresHumanReview: false,
      explanation: 'Sudden severe headache precipitated by exercise, coughing, straining, or sexual activity is an emergency red flag requiring urgent evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 9. SAME-DAY ASSESSMENT RULES (CTAS Level 3) ---
  const sameDayTriggers: string[] = [];

  // Age 50 or older with new or changed headache
  let patientAge: number | null = null;
  if (answers.age !== undefined && answers.age !== null) {
    patientAge = Number(answers.age);
  }
  const isAge50Plus = (patientAge !== null && patientAge >= 50) || answers.ageGroup === '50_plus' || answers.ageGroup === '50_or_older';
  const isNewOrChanged = answers.firstOrWorst === 'Yes' || answers.differentFromUsual === 'Yes' || answers.newHeadacheAge50 === 'Yes';

  if (isAge50Plus && isNewOrChanged) {
    sameDayTriggers.push('New or significantly changed headache at age 50 or older');
  }

  // Progressive worsening
  if (answers.pattern === 'progressive' || answers.progressivelyWorsening === 'Yes' || answers.progressivelyWorsening === true) {
    sameDayTriggers.push('Headache is progressively worsening in severity or frequency over days');
  }

  // Cancer or Immunosuppression
  const highRiskConditions = cleanSelections(answers.highRiskConditions);
  if (
    answers.cancerHistory === 'Yes' ||
    answers.immunosuppression === 'Yes' ||
    highRiskConditions.includes('cancer') ||
    highRiskConditions.includes('immunosuppression') ||
    highRiskConditions.includes('hiv')
  ) {
    sameDayTriggers.push('History of cancer or significant immune-system suppression');
  }

  // Pregnancy / Postpartum without emergency features
  if (isPregnantOrPostpartum) {
    sameDayTriggers.push('New headache during pregnancy or the postpartum period');
  }

  // Trauma without emergency features
  if (recentTrauma) {
    sameDayTriggers.push('Headache following recent head or neck trauma');
  }

  // Positional headache
  if (answers.positional === 'Yes' || answers.positionalHeadache === 'Yes' || answers.positionalHeadache === true) {
    sameDayTriggers.push('Headache becomes significantly worse when standing, lying down, or changing position');
  }

  // Recurrent non-sudden exertional / cough trigger
  if (isExertionalTrigger) {
    sameDayTriggers.push('Headache repeatedly triggered by coughing, straining, or exercise');
  }

  // Persistent vomiting
  if (answers.vomiting === 'Yes' || answers.persistentVomiting === 'Yes' || answers.persistentVomiting === true) {
    sameDayTriggers.push('Persistent vomiting with headache');
  }

  // New visual symptom (not usual aura)
  if (
    answers.newVisualSymptom === 'Yes' ||
    (answers.visualDisturbance && answers.visualDisturbance !== 'none' && answers.usualAura !== 'Yes')
  ) {
    sameDayTriggers.push('New visual disturbance or visual symptom');
  }

  // Major pattern change / Scalp tenderness or jaw pain
  if (answers.scalpOrJaw === 'Yes' || answers.scalpTenderness === 'Yes' || answers.jawPainWithChewing === 'Yes') {
    sameDayTriggers.push('New scalp tenderness or jaw tiredness while chewing');
  }

  if (sameDayTriggers.length > 0) {
    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ctasLevel: 3,
      timing: 'today',
      destinationType: 'Urgent Care / Primary Care / Same-Day Clinic',
      ruleId: 'HEADACHE-S01',
      ruleVersion: '1.0',
      triggeredBy: sameDayTriggers,
      safetyNet: [
        'Obtain urgent same-day medical assessment today.',
        'Seek emergency care immediately if you develop sudden worsening, fever with stiff neck, weakness, numbness, speech changes, or vision loss.',
        'Do not drive yourself if feeling uncoordinated or severely unwell.'
      ],
      requiresHumanReview: false,
      explanation: `Urgent same-day clinical assessment is recommended due to concerning features: ${sameDayTriggers.join('; ')}.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 10. COMMUNITY CLINICAL ASSESSMENT (CTAS Level 4) ---
  if (
    answers.medicationOveruse === 'Yes' ||
    answers.medicationChange === 'Yes' ||
    answers.differentFromUsual === 'Somewhat'
  ) {
    return {
      disposition: 'CONTACT_811_OR_PRIMARY_CARE',
      ctasLevel: 4,
      timing: 'within 24 hours',
      destinationType: 'Primary Care / Walk-in Clinic / HealthLink BC 8-1-1',
      ruleId: 'HEADACHE-C01',
      ruleVersion: '1.0',
      triggeredBy: ['Headache needing clinical review or medication evaluation'],
      safetyNet: [
        'Contact HealthLink BC 8-1-1 or your primary care provider for clinical review.',
        'Do not abruptly stop prescription medications without consulting a healthcare professional.'
      ],
      requiresHumanReview: true,
      explanation: 'Clinical review within 24 hours is recommended to evaluate headache symptoms or medication management.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 11. REASSURING LOWER-RISK / ESTABLISHED HEADACHE (CTAS Level 5) ---
  const isReassuringUsualPattern =
    (answers.firstOrWorst === 'No' || answers.firstOrWorst === undefined) &&
    (answers.differentFromUsual === 'No' || answers.differentFromUsual === undefined || answers.similarToUsualHeadache === 'Yes') &&
    (answers.onset === 'gradual' || answers.onset === undefined) &&
    answers.positional !== 'Yes' &&
    answers.vomiting !== 'Yes';

  if (isReassuringUsualPattern) {
    return {
      disposition: 'HOME_MONITOR_WITH_SAFETY_NET',
      ctasLevel: 5,
      timing: 'routine',
      destinationType: 'Home Care with Safety Net',
      ruleId: 'HEADACHE-H01',
      ruleVersion: '1.0',
      triggeredBy: ['Headache resembles your established usual pattern with gradual onset and negative red-flag screen.'],
      safetyNet: [
        'No emergency warning signs were identified from the information provided. You may follow your established clinician-approved headache plan.',
        'Seek emergency care immediately if the headache becomes suddenly severe or you develop new weakness, numbness, difficulty speaking, confusion, fainting, seizure, fever with neck stiffness, persistent vomiting, or a new serious visual problem.',
        'Consult a primary care provider if headaches become more frequent or do not respond to usual measures.'
      ],
      requiresHumanReview: false,
      explanation: 'The information provided describes a headache resembling your established usual pattern with gradual onset and no emergency warning signs identified. Symptom monitoring or following your established headache plan is reasonable at this time.',
      evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
      frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
    };
  }

  // Fallback (CTAS Level 4)
  return {
    disposition: 'CONTACT_811_OR_PRIMARY_CARE',
    ctasLevel: 4,
    timing: 'within 24 hours',
    destinationType: 'Primary Care / HealthLink BC 8-1-1',
    ruleId: 'HEADACHE-C01',
    ruleVersion: '1.0',
    triggeredBy: ['Unspecified headache pattern requiring clinical review'],
    safetyNet: [
      'Contact HealthLink BC 8-1-1 or a primary care provider for clinical guidance.'
    ],
    requiresHumanReview: true,
    explanation: 'Clinical features require review. Contact HealthLink BC 8-1-1 or a primary care provider for guidance.',
    evidenceSource: [BC_EVIDENCE_SOURCES.SNOOP_HEADACHE],
    frameworksApplied: ['SNOOP / SNNOOP10 Red-Flag Screening', 'CTAS-inspired Urgency Estimate']
  };
}
