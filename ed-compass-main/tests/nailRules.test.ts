import { describe, it, expect } from 'vitest';
import { evaluateClinicalRuleEngine } from '../src/clinical/engine';

describe('Nail Puncture & Tetanus Prophylaxis Deterministic Rules', () => {
  it('1. Severe uncontrolled bleeding triggers CALL_911_NOW (Rule NAIL-E01)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      bleeding: 'severe_uncontrolled'
    });
    expect(output.disposition).toBe('CALL_911_NOW');
    expect(output.ruleId).toBe('NAIL-E01');
    expect(output.triggeredBy).toContain('severeUncontrolledBleeding');
  });

  it('2. Cold pale foot / neurovascular compromise triggers GO_TO_ED_NOW (Rule NAIL-E02)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      circulation: 'Yes',
      movement: 'No'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ruleId).toBe('NAIL-E02');
  });

  it('3. Embedded foreign object triggers GO_TO_ED_NOW (Rule NAIL-E03)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      retainedObject: 'Yes'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ruleId).toBe('NAIL-E03');
  });

  it('4. Deep puncture near joint triggers GO_TO_ED_NOW (Rule NAIL-E04)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      location: 'joint'
    });
    expect(output.disposition).toBe('GO_TO_ED_NOW');
    expect(output.ruleId).toBe('NAIL-E04');
  });

  it('5. Puncture through running shoe sole triggers SAME_DAY_CLINICAL_ASSESSMENT (Rule NAIL-S01)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      footwear: 'Yes',
      depth: 'shallow',
      retainedObject: 'No',
      circulation: 'No',
      movement: 'Yes',
      sensation: 'No',
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.triggeredBy).toContain('punctureThroughShoeOrBoot');
  });

  it('6. Depth uncertain triggers SAME_DAY_CLINICAL_ASSESSMENT (Rule NAIL-S01)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      depth: 'cannot_tell',
      footwear: 'No',
      retainedObject: 'No',
      circulation: 'No',
      movement: 'Yes',
      sensation: 'No',
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
    expect(output.triggeredBy).toContain('puncturedDepthDeepOrUncertain');
  });

  it('7. High-risk host with diabetes triggers SAME_DAY_CLINICAL_ASSESSMENT (Rule NAIL-S01)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      highRiskConditions: ['diabetes'],
      retainedObject: 'No',
      circulation: 'No',
      movement: 'Yes',
      sensation: 'No',
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    });
    expect(output.disposition).toBe('SAME_DAY_CLINICAL_ASSESSMENT');
  });

  it('8. Unknown primary tetanus series outputs vaccine INDICATED & TIg MAY_BE_INDICATED (Rule TETANUS-T01)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      retainedObject: 'No',
      circulation: 'No',
      movement: 'Yes',
      sensation: 'No',
      tetanusPrimarySeries: 'Unsure',
      tetanusLastDose: 'unknown'
    });
    expect(output.tetanusOutcome?.vaccineRecommendation).toBe('INDICATED');
    expect(output.tetanusOutcome?.tigRecommendation).toBe('MAY_BE_INDICATED');
    expect(output.tetanusOutcome?.ruleId).toBe('TETANUS-T01');
  });

  it('9. Tetanus booster < 5 years ago outputs GENERALLY_NOT_INDICATED for both (Rule TETANUS-T02)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    });
    expect(output.tetanusOutcome?.vaccineRecommendation).toBe('GENERALLY_NOT_INDICATED');
    expect(output.tetanusOutcome?.tigRecommendation).toBe('GENERALLY_NOT_INDICATED');
    expect(output.tetanusOutcome?.ruleId).toBe('TETANUS-T02');
  });

  it('10. Tetanus booster 5-10 years ago outputs MAY_BE_RECOMMENDED (Rule TETANUS-T03)', () => {
    const output = evaluateClinicalRuleEngine('nail_puncture', {
      skinBroken: 'Yes',
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: '5_to_10'
    });
    expect(output.tetanusOutcome?.vaccineRecommendation).toBe('MAY_BE_RECOMMENDED');
    expect(output.tetanusOutcome?.tigRecommendation).toBe('GENERALLY_NOT_INDICATED');
  });

  it('11. CRITICAL RUST EQUIVALENCE: rusty=true vs rusty=false produce 100% IDENTICAL disposition and rule output', () => {
    const baseAnswers = {
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
      contamination: ['none'],
      cleaning: 'Yes',
      infectionSymptoms: ['none'],
      highRiskConditions: ['none'],
      tetanusPrimarySeries: 'Yes',
      tetanusLastDose: 'less_than_5'
    };

    const outRusty = evaluateClinicalRuleEngine('nail_puncture', { ...baseAnswers, rusty: 'Yes' });
    const outNotRusty = evaluateClinicalRuleEngine('nail_puncture', { ...baseAnswers, rusty: 'No' });

    expect(outRusty.disposition).toBe(outNotRusty.disposition);
    expect(outRusty.ruleId).toBe(outNotRusty.ruleId);
    expect(outRusty.tetanusOutcome?.vaccineRecommendation).toBe(outNotRusty.tetanusOutcome?.vaccineRecommendation);
    expect(outRusty.tetanusOutcome?.tigRecommendation).toBe(outNotRusty.tetanusOutcome?.tigRecommendation);
  });
});
