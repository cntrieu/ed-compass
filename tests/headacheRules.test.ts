import { describe, it, expect } from 'vitest';
import { evaluateClinicalRuleEngine } from '../src/clinical/engine';

describe('Headache Pathway — Required Clinical Test Cases (1 to 17)', () => {
  // Test 1 — Thunderclap Headache
  it('Test 1 — Thunderclap onset (<= 1 min) triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      onset: 'immediately',
      thunderclap: true
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('HEADACHE-E01');
    expect(output.triggeredBy[0]).toContain('maximum intensity within about one minute');
  });

  // Test 2 — New Stroke-Like Symptoms
  it('Test 2 — Sudden new stroke-like symptoms (facial droop, speech difficulty) trigger CALL_911_NOW (CTAS Level 1)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      lifeThreats: ['stroke_like']
    });
    expect(output.disposition).toBe('CALL_911_NOW');
    expect(output.ctasLevel).toBe(1);
    expect(output.ruleId).toBe('HEADACHE-E00');
  });

  // Test 3 — Fever With Neck Stiffness
  it('Test 3 — Fever with neck stiffness triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      onset: 'gradual',
      systemicFlags: ['fever_stiff_neck']
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('HEADACHE-E04');
  });

  // Test 4 — Painful Red Eye
  it('Test 4 — Severe painful red eye with visual halos triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      painfulRedEye: 'Yes',
      visualDisturbance: 'halos',
      eyeVisionChange: 'Yes'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('HEADACHE-E06');
  });

  // Test 5 — Pregnancy Without Emergency Features
  it('Test 5 — New headache during pregnancy without emergency red flags triggers SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      pregnancy: 'pregnant',
      onset: 'gradual',
      firstOrWorst: 'No'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
  });

  // Test 6 — New Headache After Age 50
  it('Test 6 — New headache at age 58 triggers SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      age: 58,
      firstOrWorst: 'Yes',
      onset: 'gradual'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
    expect(output.triggeredBy[0]).toContain('age 50 or older');
  });

  // Test 7 — Progressive Headache
  it('Test 7 — Progressively worsening headache over days triggers SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      pattern: 'progressive',
      onset: 'gradual'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
  });

  // Test 8 — Sudden Exertional Headache
  it('Test 8 — Sudden exertional headache during exercise triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      onset: 'immediately',
      onsetContext: ['exercise']
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
  });

  // Test 9 — Recurrent Cough-Triggered Headache
  it('Test 9 — Recurrent cough-triggered headache (gradual) triggers SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      onset: 'gradual',
      exertionTrigger: ['coughing']
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
  });

  // Test 10 — Trauma With Neurological Symptoms
  it('Test 10 — Head trauma with new confusion triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      trauma: 'Yes',
      neurologicalFlags: ['confusion']
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('HEADACHE-E02');
  });

  // Test 11 — Trauma With Repeated Vomiting
  it('Test 11 — Head trauma with repeated vomiting triggers GO_TO_ED_NOW (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      trauma: 'Yes',
      vomiting: 'Yes'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('HEADACHE-E08');
  });

  // Test 12 — Established Migraine Pattern
  it('Test 12 — Previously diagnosed usual migraine with zero red flags triggers HOME_MONITOR_WITH_SAFETY_NET (CTAS Level 5)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      age: 34,
      onset: 'gradual',
      firstOrWorst: 'No',
      differentFromUsual: 'No',
      establishedHeadacheDiagnosis: 'Yes',
      similarToUsualHeadache: 'Yes',
      lifeThreats: ['NONE_OF_THESE'],
      neurologicalFlags: ['NONE_OF_THESE'],
      systemicFlags: ['NONE_OF_THESE']
    });
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
    expect(output.ctasLevel).toBe(5);
    expect(output.ruleId).toBe('HEADACHE-H01');
  });

  // Test 13 — Typical Migraine Aura
  it('Test 13 — Usual migraine aura does not trigger emergency when identical to typical pattern', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      age: 32,
      onset: 'gradual',
      firstOrWorst: 'No',
      differentFromUsual: 'No',
      usualAura: 'Yes',
      establishedHeadacheDiagnosis: 'Yes',
      similarToUsualHeadache: 'Yes'
    });
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
    expect(output.ctasLevel).toBe(5);
  });

  // Test 14 — New Visual Symptom
  it('Test 14 — New visual disturbance triggers SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      onset: 'gradual',
      newVisualSymptom: 'Yes',
      usualAura: 'No'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
  });

  // Test 15 — Back Navigation Clearing
  it('Test 15 — Back navigation changing recentHeadTrauma from Yes to No clears trauma state', () => {
    let answers: Record<string, any> = {
      trauma: 'Yes',
      recentHeadTrauma: true,
      anticoagulantUse: true,
      vomiting: 'Yes'
    };

    // Patient returns and changes trauma to No
    answers = {
      ...answers,
      trauma: 'No',
      recentHeadTrauma: 'No',
      anticoagulants: 'No',
      anticoagulantUse: 'No',
      vomiting: 'No',
      onset: 'gradual',
      firstOrWorst: 'No',
      differentFromUsual: 'No'
    };

    const output = evaluateClinicalRuleEngine('headache', answers);
    expect(answers.trauma).toBe('No');
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
  });

  // Test 16 — "None of These" Rule
  it('Test 16 — "None of these" is not stored as a clinical symptom or trigger', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      lifeThreats: ['NONE_OF_THESE'],
      neurologicalFlags: ['NONE_OF_THESE'],
      systemicFlags: ['NONE_OF_THESE'],
      onset: 'gradual',
      firstOrWorst: 'No',
      differentFromUsual: 'No'
    });
    expect(output.triggeredBy).not.toContain('NONE_OF_THESE');
    expect(output.triggeredBy).not.toContain('none');
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
  });

  // Test 17 — Same-Day Early Exit
  it('Test 17 — Positional headache locks SAME_DAY_CLINICAL_ASSESSMENT (CTAS Level 3)', () => {
    const output = evaluateClinicalRuleEngine('headache', {
      positional: 'Yes',
      positionalHeadache: 'Yes',
      onset: 'gradual'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ctasLevel).toBe(3);
  });
});
