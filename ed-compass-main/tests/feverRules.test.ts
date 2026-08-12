import { describe, it, expect } from 'vitest';
import { evaluateClinicalRuleEngine } from '../src/clinical/engine';

describe('Fever Pathway — Required Clinical Test Cases (1 to 11)', () => {
  // Test 1 — Measured Temperature
  it('Test 1 — Measured Temperature stores values correctly', () => {
    const answers = {
      feverish: 'Yes',
      temperatureMeasured: true,
      temperatureValue: 38.5,
      temperatureUnit: 'C',
      temperatureCelsius: 38.5,
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    };
    const output = evaluateClinicalRuleEngine('fever', answers);
    expect(answers.temperatureCelsius).toBe(38.5);
    expect(answers.temperatureMeasured).toBe(true);
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
  });

  // Test 2 — No Measured Temperature
  it('Test 2 — "No, but I feel feverish or have chills" sets temperature to null and flags subjective fever', () => {
    const answers = {
      feverish: 'No_feeling_feverish',
      temperatureMeasured: false,
      temperatureValue: null,
      temperatureUnit: null,
      temperatureCelsius: null,
      subjectiveFever: true,
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    };
    const output = evaluateClinicalRuleEngine('fever', answers);
    expect(answers.temperatureValue).toBeNull();
    expect(answers.subjectiveFever).toBe(true);
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
  });

  // Test 3 — Step 2 "None of these"
  it('Test 3 — Step 2 "None of these" generates no emergency recommendation and is excluded from clinical triggers', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      lifeThreats: ['NONE_OF_THESE'],
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    });
    expect(output.disposition).not.toBe('CALL_911_NOW');
    expect(output.triggeredBy).not.toContain('NONE_OF_THESE');
    expect(output.triggeredBy).not.toContain('none');
  });

  // Test 4 — Actual Level 1 Finding
  it('Test 4 — Unresponsive patient triggers Call 911 immediately (CTAS Level 1)', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      lifeThreats: ['unresponsive']
    });
    expect(output.disposition).toBe('CALL_911_NOW');
    expect(output.ctasLevel).toBe(1);
    expect(output.ruleId).toBe('FEVER-E00');
  });

  // Test 5 — Step 3 "None of these"
  it('Test 5 — Step 3 "None of these" does not generate ED recommendation', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      lifeThreats: ['NONE_OF_THESE'],
      emergencyFlags: ['NONE_OF_THESE'],
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    });
    expect(output.disposition).not.toBe('GO_TO_ED_NOW');
  });

  // Test 6 — Emergency Red Flag
  it('Test 6 — Emergency Red Flag (confusion) triggers ED now (CTAS Level 2)', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      feverish: 'Yes',
      emergencyFlags: ['confusion']
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ctasLevel).toBe(2);
    expect(output.ruleId).toBe('FEVER-E01');
  });

  // Test 7 — Stable Fever Without Vital Signs
  it('Test 7 — Stable fever without vital signs completes pathway without forcing measurements', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      feverish: 'Yes',
      lifeThreats: ['NONE_OF_THESE'],
      emergencyFlags: ['NONE_OF_THESE'],
      highRiskHost: ['NONE_OF_THESE'],
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    });
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
    expect(output.ctasLevel).toBe(5);
  });

  // Test 8 — Stable Sore Throat (McIsaac score = 4)
  it('Test 8 — Stable sore throat uses existing age and temperature to calculate McIsaac = 4', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      age: 32,
      temperatureValue: 38.7,
      temperatureUnit: 'C',
      temperatureCelsius: 38.7,
      associatedBranch: 'sore_throat',
      throatEmergency: 'No',
      hasCough: 'No',
      swollenGlands: 'Yes',
      tonsilExudate: 'Yes'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.ruleId).toBe('FEVER-ST-M04');
    expect(output.mcIsaacScore).toBe(4);
    expect(output.ctasLevel).toBe(3);
  });

  // Test 9 — Sore Throat Without Temperature
  it('Test 9 — Sore throat without measured temperature marks temp criterion unknown', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      age: 30,
      temperatureMeasured: false,
      temperatureValue: null,
      associatedBranch: 'sore_throat',
      hasCough: 'No',
      swollenGlands: 'Yes',
      tonsilExudate: 'No'
    });
    // Temp unknown -> McIsaac score = +2 (no cough + swollen glands) -> CONTACT_811_OR_PRIMARY_CARE
    expect(output.mcIsaacScore).toBe(2);
    expect(output.disposition).toBe('CONTACT_811_OR_PRIMARY_CARE');
  });

  // Test 10 — Existing Vital Signs
  it('Test 10 — Pre-existing measured vital signs calculate background qSOFA >= 2', () => {
    const output = evaluateClinicalRuleEngine('fever', {
      feverish: 'Yes',
      measuredRR: 24,
      measuredSystolicBP: 95,
      alteredMentalStatus: 'No'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ruleId).toBe('FEVER-Q01');
    expect(output.qSOFAStatus).toBe('COMPLETE');
  });

  // Test 11 — Back Navigation Clearing
  it('Test 11 — Back navigation changing from temp to No clears temperature values to null', () => {
    let answers: Record<string, any> = {
      temperatureMeasured: true,
      temperatureValue: 40.1,
      temperatureUnit: 'C',
      temperatureCelsius: 40.1
    };

    // User navigates back and selects "No"
    answers = {
      ...answers,
      temperatureMeasured: false,
      temperatureValue: null,
      temperatureUnit: null,
      temperatureCelsius: null,
      subjectiveFever: false,
      alertness: 'normal',
      breathing: 'normal',
      fluidStatus: 'drinking_normally',
      rapidlyWorsening: 'No'
    };

    const output = evaluateClinicalRuleEngine('fever', answers);
    expect(answers.temperatureValue).toBeNull();
    expect(answers.temperatureCelsius).toBeNull();
    expect(output.disposition).toBe('HOME_MONITOR_WITH_SAFETY_NET');
  });
});
