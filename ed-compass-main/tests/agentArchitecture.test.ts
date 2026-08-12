import { describe, it, expect } from 'vitest';
import { LocalDemoAgentProvider } from '../src/agents/localDemoAgentProvider';
import { evaluateClinicalRuleEngine, compareDispositions } from '../src/clinical/engine';
import { StoreService } from '../src/services/storeService';
import { AuditService } from '../src/services/auditService';

describe('Three Shared Agent Architecture & Governance Constraints', () => {
  const provider = new LocalDemoAgentProvider();

  it('26. Agent 1 Intake Handoff does NOT contain disposition', () => {
    const handoff = provider.generateIntakeHandoff('sess-001', 'nail_puncture', {
      skinBroken: 'Yes',
      bleeding: 'mild'
    });
    expect(handoff).not.toHaveProperty('disposition');
    expect(handoff.scenario).toBe('nail_puncture');
    expect(handoff.agentVersion).toContain('intake-v1.');
  });

  it('27. Agent 2 Navigation explanation PRESERVES exact deterministic disposition without override', () => {
    const ruleOut = evaluateClinicalRuleEngine('headache', {
      onset: 'immediately',
      thunderclap: true
    });
    const handoff = provider.generateIntakeHandoff('sess-002', 'headache', { onset: 'immediately' });
    const nav = provider.generateNavigationExplanation(handoff, ruleOut);

    expect(nav.disposition).toBe('GO_TO_ED_NOW');
    expect(nav.ruleId).toBe('HEADACHE-E01');
    expect(nav.conceptualHandoffNotice).toContain('Conceptual handoff only');
  });

  it('28. Agent 3 feedback submission attaches metadata without modifying live clinical rules', () => {
    const initialRule = evaluateClinicalRuleEngine('nail_puncture', { skinBroken: 'Yes', footwear: 'Yes' });
    const initialDisp = initialRule.disposition;

    // Submit negative feedback
    StoreService.addPatientFeedback({
      sessionId: 'sess-003',
      scenario: 'nail_puncture',
      disposition: initialDisp,
      ruleId: initialRule.ruleId,
      ruleVersion: '1.0',
      easyToUseScore: 1,
      nextStepClear: 'No',
      rationaleUnderstood: 'No',
      confidenceScore: 1,
      canFollowRecommendation: 'No',
      reportedBarriers: ['Rural distance'],
      confusingOrMissingComments: 'Too far to travel',
      timestamp: new Date().toISOString()
    });

    // Re-evaluating the rule engine with identical facts MUST yield identical outcome
    const postFeedbackRule = evaluateClinicalRuleEngine('nail_puncture', { skinBroken: 'Yes', footwear: 'Yes' });
    expect(postFeedbackRule.disposition).toBe(initialDisp);
    expect(postFeedbackRule.ruleId).toBe(initialRule.ruleId);
  });

  it('29. Priority comparator guarantees emergency rules override lower-acuity rules', () => {
    expect(compareDispositions('CALL_911_NOW', 'GO_TO_ED_NOW')).toBeGreaterThan(0);
    expect(compareDispositions('GO_TO_ED_NOW', 'SAME_DAY_CLINICAL_ASSESSMENT')).toBeGreaterThan(0);
    expect(compareDispositions('SAME_DAY_CLINICAL_ASSESSMENT', 'HOME_MONITOR_WITH_SAFETY_NET')).toBeGreaterThan(0);
  });

  it('30. Audit logging captures event sequence reproducibly', () => {
    AuditService.logEvent('sess-004', 'CONSENT_GIVEN', { accepted: true });
    AuditService.logEvent('sess-004', 'RULE_EVALUATED', { ruleId: 'NAIL-S01' });

    const logs = AuditService.getEvents('sess-004');
    expect(logs.length).toBeGreaterThanOrEqual(2);
  });
});
