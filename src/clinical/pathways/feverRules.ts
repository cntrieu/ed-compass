import { DeterministicRuleOutput, PatientAnswers } from '../../types/clinical';
import { BC_EVIDENCE_SOURCES } from '../evidenceMetadata';

function cleanSelections(arr: any): string[] {
  if (!arr) return [];
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter((item) => item && item !== 'none' && item !== 'NONE_OF_THESE');
}

export function evaluateFeverRules(answers: PatientAnswers): DeterministicRuleOutput {
  // Normalize temperature value to Celsius
  let tempC: number | null = null;
  if (answers.temperatureCelsius !== undefined && answers.temperatureCelsius !== null) {
    tempC = Number(answers.temperatureCelsius);
  } else if (answers.temperatureValue !== undefined && answers.temperatureValue !== null && answers.temperatureValue !== '') {
    const val = Number(answers.temperatureValue);
    if (!isNaN(val)) {
      if (answers.temperatureUnit === 'F') {
        tempC = ((val - 32) * 5) / 9;
      } else {
        tempC = val;
      }
    }
  }

  if (answers.temperatureMeasured === false || answers.feverish === 'No') {
    tempC = null;
  }

  // --- 1. IMMEDIATE LIFE THREAT SCREEN (CTAS Level 1) ---
  const lifeThreats = cleanSelections(answers.lifeThreats);
  if (lifeThreats.length > 0) {
    const labelMap: Record<string, string> = {
      unresponsive: 'Unresponsive, cannot be awakened, or unable to stay awake',
      cannot_awaken: 'Unresponsive, cannot be awakened, or unable to stay awake',
      not_breathing: 'Not breathing normally, severe difficulty breathing, or gasping',
      seizure_now: 'A seizure is happening now',
      blue_lips: 'Blue or grey lips or skin',
      collapsed: 'Collapsed and appears critically unwell'
    };
    const mappedTriggers = lifeThreats.map((t) => labelMap[t] || t);

    return {
      disposition: 'CALL_911_NOW',
      ctasLevel: 1,
      timing: 'immediately',
      destinationType: 'Emergency Department / 9-1-1',
      ruleId: 'FEVER-E00',
      ruleVersion: '1.0',
      triggeredBy: mappedTriggers,
      safetyNet: [
        'Call 9-1-1 immediately.',
        'Begin CPR if trained and the person is not breathing normally.',
        'Do not attempt to transport the person yourself if they are unstable.'
      ],
      requiresHumanReview: false,
      explanation: `Immediate life-threatening finding detected: ${mappedTriggers.join(', ')}. Emergency 9-1-1 response required.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 2. EMERGENCY RED FLAGS SCREEN (CTAS Level 2 / Escalation to Level 1) ---
  const emergencyFlags = cleanSelections(answers.emergencyFlags);
  if (emergencyFlags.length > 0) {
    const isLevel1Escalation =
      emergencyFlags.includes('not_breathing') ||
      emergencyFlags.includes('severe_breathing') ||
      emergencyFlags.includes('cannot_awaken') ||
      emergencyFlags.includes('seizure_now');

    const flagLabelMap: Record<string, string> = {
      confusion: 'New confusion, unusual behaviour, extreme drowsiness, fainting, or a new seizure',
      confusion_fainting: 'New confusion, unusual behaviour, extreme drowsiness, fainting, or a new seizure',
      stiff_neck: 'Severe headache with a stiff neck or light hurting your eyes',
      stiff_neck_headache: 'Severe headache with a stiff neck or light hurting your eyes',
      purple_rash: 'A purple or bruise-like rash that does not fade when pressed, or unusual bleeding/bruising',
      chest_pain: 'Severe difficulty breathing or severe/persistent chest pain or pressure',
      severe_breathing_chest: 'Severe difficulty breathing or severe/persistent chest pain or pressure',
      severe_skin_pain: 'Severe or rapidly worsening pain, redness, swelling, or skin discoloration',
      unable_to_swallow: 'Unable to swallow liquids, drooling, or severe throat swelling',
      throat_swallowing_emergency: 'Unable to swallow liquids, drooling, or severe throat swelling'
    };
    const mappedFlags = emergencyFlags.map((f) => flagLabelMap[f] || f);

    if (isLevel1Escalation) {
      return {
        disposition: 'CALL_911_NOW',
        ctasLevel: 1,
        timing: 'immediately',
        destinationType: 'Emergency Department / 9-1-1',
        ruleId: 'FEVER-E00',
        ruleVersion: '1.0',
        triggeredBy: mappedFlags,
        safetyNet: ['Call 9-1-1 immediately.', 'Do not drive yourself.'],
        requiresHumanReview: false,
        explanation: `Emergency warning sign requiring immediate 9-1-1 response: ${mappedFlags.join(', ')}.`,
        evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
        frameworksApplied: ['CTAS-inspired Urgency Estimate']
      };
    }

    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'FEVER-E01',
      ruleVersion: '1.0',
      triggeredBy: mappedFlags,
      safetyNet: [
        'Proceed directly to the nearest Emergency Department.',
        'Do not wait for a clinic appointment.',
        'Have someone else drive you if possible.'
      ],
      requiresHumanReview: false,
      explanation: `Fever accompanied by high-risk emergency warning sign(s): ${mappedFlags.join(', ')}. Immediate emergency medical evaluation required.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 3. HIGH-RISK HOST SCREEN ---
  const highRiskHost = cleanSelections(answers.highRiskHost);
  const hasFever = (tempC !== null && tempC >= 38.0) || answers.feverish === 'Yes' || answers.temperatureMeasured === true || answers.subjectiveFever === true;

  if (highRiskHost.includes('neutropenia') && hasFever) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department / Oncology Emergency',
      ruleId: 'FEVER-H01',
      ruleVersion: '1.0',
      triggeredBy: ['Possible febrile neutropenia (known neutropenia with fever)'],
      safetyNet: [
        'Contact oncology team immediately or proceed directly to an Emergency Department.',
        'Inform triage staff immediately of neutropenia upon arrival.'
      ],
      requiresHumanReview: true,
      explanation: 'Known neutropenia with fever (suspected febrile neutropenia). Requires immediate emergency medical assessment and broad-spectrum antibiotic evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  if (highRiskHost.includes('chemotherapy')) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department / Oncology Clinic',
      ruleId: 'FEVER-H02',
      ruleVersion: '1.0',
      triggeredBy: ['Recent or current chemotherapy recipient with fever'],
      safetyNet: [
        'Contact your oncology team immediately or proceed to an Emergency Department.',
        'Do not delay seeking care.'
      ],
      requiresHumanReview: true,
      explanation: 'Recent or current chemotherapy recipient with fever requires prompt emergency or oncology evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 4. MEASURED qSOFA SUPPORTING CRITERIA (BACKGROUND ONLY) ---
  let qSOFACount = 0;
  const qSOFATriggers: string[] = [];

  if (answers.alteredMentalStatus === 'Yes') {
    qSOFACount++;
    qSOFATriggers.push('Altered mental status');
  }
  if (answers.measuredRR !== undefined && answers.measuredRR !== null && answers.measuredRR >= 22) {
    qSOFACount++;
    qSOFATriggers.push(`Measured respiratory rate ${answers.measuredRR}/min (≥22)`);
  }
  if (answers.measuredSystolicBP !== undefined && answers.measuredSystolicBP !== null && answers.measuredSystolicBP <= 100) {
    qSOFACount++;
    qSOFATriggers.push(`Measured systolic BP ${answers.measuredSystolicBP} mmHg (≤100)`);
  }

  if (qSOFACount >= 2) {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'FEVER-Q01',
      ruleVersion: '1.0',
      triggeredBy: qSOFATriggers,
      safetyNet: ['Proceed immediately to an Emergency Department.'],
      requiresHumanReview: false,
      explanation: `Multiple measured qSOFA criteria present (${qSOFATriggers.join(', ')}). Immediate emergency department evaluation required.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      qSOFAStatus: 'COMPLETE',
      frameworksApplied: ['qSOFA (Quick Sequential Organ Failure Assessment)', 'CTAS-inspired Urgency Estimate']
    };
  }

  // --- 5. HYDRATION AND GENERAL STABILITY ---
  if (answers.fluidStatus === 'cannot_swallow') {
    return {
      disposition: 'GO_TO_ED_NOW',
      ctasLevel: 2,
      timing: 'now',
      destinationType: 'Emergency Department',
      ruleId: 'FEVER-ST-E01',
      ruleVersion: '1.0',
      triggeredBy: ['Inability to swallow fluids or drooling'],
      safetyNet: ['Seek immediate emergency medical evaluation.'],
      requiresHumanReview: false,
      explanation: 'Inability to swallow fluids or drooling suggests potential airway or severe throat compromise requiring emergency evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  const hasHydrationOrPainIssue =
    answers.fluidStatus === 'cannot_keep_down' ||
    answers.urineStatus === 'very_little' ||
    answers.rapidlyWorsening === 'Yes' ||
    answers.rapidlyWorsening === true ||
    answers.severePain === 'Yes' ||
    answers.severePain === true ||
    (tempC !== null && tempC >= 40.0);

  if (hasHydrationOrPainIssue) {
    const reasons: string[] = [];
    if (answers.fluidStatus === 'cannot_keep_down') reasons.push('Repeated vomiting / unable to keep fluids down');
    if (answers.urineStatus === 'very_little') reasons.push('Very little or no urine output');
    if (answers.rapidlyWorsening === 'Yes' || answers.rapidlyWorsening === true) reasons.push('Symptoms worsening quickly');
    if (answers.severePain === 'Yes' || answers.severePain === true) reasons.push('Severe pain present');
    if (tempC !== null && tempC >= 40.0) reasons.push(`High persistent temperature (${tempC.toFixed(1)}°C)`);

    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ctasLevel: 3,
      timing: 'today',
      destinationType: 'Urgent Care / Primary Care / Walk-in Clinic',
      ruleId: 'FEVER-D01',
      ruleVersion: '1.0',
      triggeredBy: reasons,
      safetyNet: [
        'Seek urgent same-day clinical assessment today.',
        'Try small frequent sips of fluid if tolerated.',
        'Escalate to the Emergency Department if confusion, severe breathing difficulty, or fainting occurs.'
      ],
      requiresHumanReview: false,
      explanation: `Urgent findings present: ${reasons.join(', ')}. Same-day medical evaluation is recommended.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 6. MAIN ASSOCIATED SYMPTOM BRANCHES ---
  const branch = answers.associatedBranch || answers.mainAssociatedSymptom;

  // 6A. Sore Throat Branch & McIsaac Calculation
  if (branch === 'sore_throat') {
    if (answers.throatEmergency === 'Yes') {
      return {
        disposition: 'GO_TO_ED_NOW',
        ctasLevel: 2,
        timing: 'now',
        destinationType: 'Emergency Department',
        ruleId: 'FEVER-ST-E01',
        ruleVersion: '1.0',
        triggeredBy: ['Airway or severe throat swelling emergency'],
        safetyNet: ['Seek immediate emergency care.'],
        requiresHumanReview: false,
        explanation: 'Difficulty breathing, severe swelling, or inability to swallow liquids requires immediate emergency evaluation.',
        evidenceSource: [BC_EVIDENCE_SOURCES.MCISAAC_SORE_THROAT],
        frameworksApplied: ['CTAS-inspired Urgency Estimate']
      };
    }

    // Calculate McIsaac Score
    let mcIsaac = 0;
    if (tempC !== null && tempC > 38.0) mcIsaac += 1;
    if (answers.hasCough === 'No') mcIsaac += 1;
    if (answers.swollenGlands === 'Yes') mcIsaac += 1;
    if (answers.tonsilExudate === 'Yes') mcIsaac += 1;

    let ageVal: number | null = null;
    if (answers.age !== undefined && answers.age !== null) {
      ageVal = Number(answers.age);
    }
    if (ageVal !== null && !isNaN(ageVal)) {
      if (ageVal >= 45) mcIsaac -= 1;
    } else if (answers.ageGroup === '45_plus') {
      mcIsaac -= 1;
    }

    if (mcIsaac >= 4) {
      return {
        disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
        ctasLevel: 3,
        timing: 'today',
        destinationType: 'Primary Care / Urgent Care / Walk-in Clinic',
        ruleId: 'FEVER-ST-M04',
        ruleVersion: '1.0',
        triggeredBy: [`McIsaac sore throat score: ${mcIsaac}`],
        safetyNet: ['Obtain prompt clinical assessment for diagnostic evaluation and possible strep testing.'],
        requiresHumanReview: false,
        explanation: `McIsaac score is ${mcIsaac} (higher probability of streptococcal pharyngitis). Clinical assessment today or next day for possible strep testing is recommended.`,
        evidenceSource: [BC_EVIDENCE_SOURCES.MCISAAC_SORE_THROAT],
        mcIsaacScore: mcIsaac,
        frameworksApplied: ['McIsaac Sore Throat Clinical Framework', 'CTAS-inspired Urgency Estimate']
      };
    }

    if (mcIsaac >= 2) {
      return {
        disposition: 'CONTACT_811_OR_PRIMARY_CARE',
        ctasLevel: 4,
        timing: 'within 24-48 hours',
        destinationType: 'Primary Care / Walk-in Clinic / Virtual Care / HealthLink BC 8-1-1',
        ruleId: 'FEVER-ST-M02',
        ruleVersion: '1.0',
        triggeredBy: [`McIsaac sore throat score: ${mcIsaac}`],
        safetyNet: ['Contact primary care, a walk-in clinic, or 8-1-1 if symptoms worsen or fever persists.'],
        requiresHumanReview: false,
        explanation: `McIsaac score is ${mcIsaac}. Clinical assessment within 24–48 hours for possible strep testing is recommended.`,
        evidenceSource: [BC_EVIDENCE_SOURCES.MCISAAC_SORE_THROAT],
        mcIsaacScore: mcIsaac,
        frameworksApplied: ['McIsaac Sore Throat Clinical Framework', 'CTAS-inspired Urgency Estimate']
      };
    }

    if (highRiskHost.length > 0) {
      return {
        disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
        ctasLevel: 3,
        timing: 'today',
        destinationType: 'Urgent Care / Primary Care Clinic',
        ruleId: 'FEVER-H03',
        ruleVersion: '1.0',
        triggeredBy: ['High-risk medical context with fever'],
        safetyNet: ['Obtain same-day medical assessment.'],
        requiresHumanReview: false,
        explanation: 'High-risk medical context with fever warrants same-day clinical assessment.',
        evidenceSource: [BC_EVIDENCE_SOURCES.MCISAAC_SORE_THROAT],
        mcIsaacScore: mcIsaac,
        frameworksApplied: ['McIsaac Sore Throat Clinical Framework', 'CTAS-inspired Urgency Estimate']
      };
    }

    return {
      disposition: 'HOME_MONITOR_WITH_SAFETY_NET',
      ctasLevel: 5,
      timing: 'routine',
      destinationType: 'Home Care with Safety Net',
      ruleId: 'FEVER-ST-M00',
      ruleVersion: '1.0',
      triggeredBy: [`McIsaac sore throat score: ${mcIsaac}`],
      safetyNet: ['Rest, maintain fluid intake, and re-evaluate if symptoms progress.'],
      requiresHumanReview: false,
      explanation: `McIsaac score is ${mcIsaac}. Low score suggests viral sore throat; home care and symptom monitoring are reasonable at this time.`,
      evidenceSource: [BC_EVIDENCE_SOURCES.MCISAAC_SORE_THROAT],
      mcIsaacScore: mcIsaac,
      frameworksApplied: ['McIsaac Sore Throat Clinical Framework', 'CTAS-inspired Urgency Estimate']
    };
  }

  // 6B. Urinary Branch
  if (branch === 'urinary') {
    if (answers.flankPain === 'Yes' || answers.urinaryVomiting === 'Yes') {
      return {
        disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
        ctasLevel: 3,
        timing: 'today',
        destinationType: 'Urgent Care / Primary Care Clinic',
        ruleId: 'FEVER-UTI-S01',
        ruleVersion: '1.0',
        triggeredBy: ['Fever with back/flank pain or vomiting'],
        safetyNet: ['Seek same-day clinical assessment for urine testing and treatment.'],
        requiresHumanReview: false,
        explanation: 'Fever accompanied by back/flank pain or vomiting suggests upper urinary tract involvement requiring same-day clinical assessment.',
        evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
        frameworksApplied: ['CTAS-inspired Urgency Estimate']
      };
    }

    return {
      disposition: 'CONTACT_811_OR_PRIMARY_CARE',
      ctasLevel: 4,
      timing: 'today or within 24 hours',
      destinationType: 'Urgent Care / Walk-in Clinic / Primary Care',
      ruleId: 'FEVER-UTI-C01',
      ruleVersion: '1.0',
      triggeredBy: ['Fever with urinary discomfort'],
      safetyNet: ['Seek clinical assessment today or within 24 hours for urine testing.'],
      requiresHumanReview: false,
      explanation: 'Fever with urinary symptoms generally warrants clinical assessment for diagnosis and urine testing.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // 6C. Abdominal Pain Branch
  if (branch === 'abdominal') {
    if (answers.abdominalSevere === 'Yes' || answers.abdominalRigid === 'Yes') {
      return {
        disposition: 'GO_TO_ED_NOW',
        ctasLevel: 2,
        timing: 'now',
        destinationType: 'Emergency Department',
        ruleId: 'FEVER-ABD-E01',
        ruleVersion: '1.0',
        triggeredBy: ['Severe abdominal pain or rigid abdomen with fever'],
        safetyNet: ['Proceed directly to an Emergency Department.'],
        requiresHumanReview: false,
        explanation: 'Fever accompanied by severe abdominal pain or abdominal rigidity requires emergency evaluation.',
        evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
        frameworksApplied: ['CTAS-inspired Urgency Estimate']
      };
    }

    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ctasLevel: 3,
      timing: 'today',
      destinationType: 'Urgent Care / Primary Care Clinic',
      ruleId: 'FEVER-ABD-S01',
      ruleVersion: '1.0',
      triggeredBy: ['Abdominal pain with fever'],
      safetyNet: ['Seek urgent same-day medical assessment.'],
      requiresHumanReview: false,
      explanation: 'Abdominal pain with fever warrants same-day medical assessment.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // 6D. Skin / Soft Tissue Branch
  if (branch === 'skin') {
    if (answers.skinPurple === 'Yes' || answers.skinSevere === 'Yes') {
      return {
        disposition: 'GO_TO_ED_NOW',
        ctasLevel: 2,
        timing: 'now',
        destinationType: 'Emergency Department',
        ruleId: 'FEVER-SKIN-E01',
        ruleVersion: '1.0',
        triggeredBy: ['Rapidly spreading skin redness, purple discoloration, or severe skin pain'],
        safetyNet: ['Proceed directly to an Emergency Department.'],
        requiresHumanReview: false,
        explanation: 'Fever with rapidly spreading skin changes, purple discoloration, or severe pain requires emergency evaluation.',
        evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
        frameworksApplied: ['CTAS-inspired Urgency Estimate']
      };
    }

    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ctasLevel: 3,
      timing: 'today',
      destinationType: 'Urgent Care / Primary Care / Walk-in Clinic',
      ruleId: 'FEVER-SKIN-S01',
      ruleVersion: '1.0',
      triggeredBy: ['Skin redness, wound, or localized infection with fever'],
      safetyNet: ['Seek same-day clinical assessment.'],
      requiresHumanReview: false,
      explanation: 'Skin redness or wound infection with fever warrants same-day medical evaluation.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // 6E. Cough / Breathing Branch
  if (branch === 'cough' || branch === 'cough_breathing') {
    return {
      disposition: 'CONTACT_811_OR_PRIMARY_CARE',
      ctasLevel: 4,
      timing: 'within 24 hours',
      destinationType: 'Primary Care / Walk-in Clinic / Virtual Care / HealthLink BC 8-1-1',
      ruleId: 'FEVER-RESP-S01',
      ruleVersion: '1.0',
      triggeredBy: ['Stable respiratory symptoms with fever'],
      safetyNet: ['Seek clinical review within 24 hours if symptoms persist or worsen.'],
      requiresHumanReview: false,
      explanation: 'Respiratory symptoms with fever should be evaluated by a healthcare provider within 24 hours.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 7. HIGH-RISK HOST FALLBACK (IF LEVEL 3 NEEDED) ---
  if (highRiskHost.length > 0) {
    return {
      disposition: 'SAME_DAY_CLINICAL_ASSESSMENT',
      ctasLevel: 3,
      timing: 'today',
      destinationType: 'Urgent Care / Primary Care Clinic',
      ruleId: 'FEVER-H03',
      ruleVersion: '1.0',
      triggeredBy: ['High-risk medical context with fever'],
      safetyNet: [
        'Obtain urgent same-day medical assessment.',
        'Monitor temperature and symptoms closely.'
      ],
      requiresHumanReview: true,
      explanation: 'High-risk medical context (immune compromise, pregnancy/postpartum, or age ≥65) with fever warrants urgent same-day medical assessment.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // --- 8. REASSURING LOWER-RISK FEVER (CTAS Level 5) ---
  const isReassuring =
    (answers.alertness === 'normal' || answers.alertness === undefined) &&
    (answers.breathing === 'normal' || answers.breathing === undefined) &&
    (answers.fluidStatus === 'drinking_normally' || answers.fluidStatus === undefined) &&
    answers.rapidlyWorsening !== 'Yes' &&
    answers.severePain !== 'Yes';

  if (isReassuring) {
    return {
      disposition: 'HOME_MONITOR_WITH_SAFETY_NET',
      ctasLevel: 5,
      timing: 'routine',
      destinationType: 'Home Care with Safety Net',
      ruleId: 'FEVER-L01',
      ruleVersion: '1.0',
      triggeredBy: ['Normal alertness', 'Comfortable breathing', 'Adequate fluid intake', 'No emergency warning signs'],
      safetyNet: [
        'Maintain fluid intake, rest, and monitor temperature.',
        'Seek immediate emergency evaluation if confusion, severe breathing difficulty, severe chest pain, seizure, stiff neck, or purple rash develops.'
      ],
      requiresHumanReview: false,
      explanation: 'No emergency warning signs or high-risk features identified. Symptom monitoring and home care measures are reasonable at this time.',
      evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
      frameworksApplied: ['CTAS-inspired Urgency Estimate']
    };
  }

  // Fallback (CTAS Level 4)
  return {
    disposition: 'CONTACT_811_OR_PRIMARY_CARE',
    ctasLevel: 4,
    timing: 'within 24 hours',
    destinationType: 'Primary Care / HealthLink BC 8-1-1',
    ruleId: 'FEVER-C01',
    ruleVersion: '1.0',
    triggeredBy: ['Fever needing clinical review'],
    safetyNet: ['Contact HealthLink BC 8-1-1 or a primary care provider.'],
    requiresHumanReview: true,
    explanation: 'Fever scenario requires clinical review with HealthLink BC 8-1-1 or a healthcare provider.',
    evidenceSource: [BC_EVIDENCE_SOURCES.QSOFA_SIRS_EVIDENCE],
    frameworksApplied: ['CTAS-inspired Urgency Estimate']
  };
}
