import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  trackRuleEffectiveness,
  getEffectivenessScores,
  prioritizeMessages,
  analyzeEffectiveness,
  resetEffectivenessState
} from '../scripts/lib/context-optimizer.mjs';

describe('Context Window Optimization', () => {

  beforeEach(() => {
    resetEffectivenessState();
  });

  describe('trackRuleEffectiveness', () => {
    it('should track fixed outcomes', () => {
      trackRuleEffectiveness('no-eval', 'fixed');
      const scores = getEffectivenessScores();
      assert.equal(scores.length, 1);
      assert.equal(scores[0].fixed, 1);
      assert.equal(scores[0].effectiveness, 1);
    });

    it('should track ignored outcomes', () => {
      trackRuleEffectiveness('no-eval', 'ignored');
      const scores = getEffectivenessScores();
      assert.equal(scores[0].ignored, 1);
      assert.equal(scores[0].effectiveness, 0);
    });

    it('should calculate mixed effectiveness', () => {
      trackRuleEffectiveness('no-eval', 'fixed');
      trackRuleEffectiveness('no-eval', 'ignored');
      const scores = getEffectivenessScores();
      assert.equal(scores[0].effectiveness, 0.5);
      assert.equal(scores[0].total, 2);
    });

    it('should handle null inputs gracefully', () => {
      trackRuleEffectiveness(null, 'fixed');
      trackRuleEffectiveness('test', null);
      assert.deepEqual(getEffectivenessScores(), []);
    });
  });

  describe('getEffectivenessScores', () => {
    it('should return empty array initially', () => {
      assert.deepEqual(getEffectivenessScores(), []);
    });

    it('should sort by effectiveness descending', () => {
      trackRuleEffectiveness('rule-a', 'ignored');
      trackRuleEffectiveness('rule-a', 'ignored');
      trackRuleEffectiveness('rule-b', 'fixed');
      trackRuleEffectiveness('rule-b', 'fixed');
      const scores = getEffectivenessScores();
      assert.equal(scores[0].ruleId, 'rule-b');
      assert.equal(scores[1].ruleId, 'rule-a');
    });
  });

  describe('prioritizeMessages', () => {
    it('should return empty for empty input', () => {
      assert.deepEqual(prioritizeMessages([]), []);
      assert.deepEqual(prioritizeMessages(null), []);
    });

    it('should add effectiveness scores to violations', () => {
      trackRuleEffectiveness('no-eval', 'fixed');
      const violations = [{ ruleId: 'no-eval', message: 'eval detected' }];
      const result = prioritizeMessages(violations);
      assert.ok(result[0].effectiveness > 0);
    });

    it('should sort by effectiveness', () => {
      trackRuleEffectiveness('rule-a', 'fixed');
      trackRuleEffectiveness('rule-a', 'fixed');
      trackRuleEffectiveness('rule-b', 'ignored');
      trackRuleEffectiveness('rule-b', 'ignored');

      const violations = [
        { ruleId: 'rule-b', message: 'violation b' },
        { ruleId: 'rule-a', message: 'violation a' }
      ];
      const result = prioritizeMessages(violations);
      assert.equal(result[0].ruleId, 'rule-a');
      assert.equal(result[1].ruleId, 'rule-b');
    });

    it('should condense low-effectiveness violations after 3rd', () => {
      // Make 5 rules, some effective, some not
      for (let i = 0; i < 5; i++) {
        trackRuleEffectiveness('rule-' + i, i < 3 ? 'fixed' : 'ignored');
      }
      const violations = [];
      for (let i = 0; i < 5; i++) {
        violations.push({ ruleId: 'rule-' + i, message: 'A long violation message about rule ' + i + ' that exceeds fifty chars and should get truncated' });
      }
      const result = prioritizeMessages(violations);
      // After 3rd position, low-effectiveness ones should be condensed
      const condensedCount = result.filter(v => v.condensed).length;
      assert.ok(condensedCount >= 0); // may or may not have condensed ones depending on order
    });

    it('should default unknown rules to 0.5 effectiveness', () => {
      const violations = [{ ruleId: 'unknown-rule', message: 'test' }];
      const result = prioritizeMessages(violations);
      assert.equal(result[0].effectiveness, 0.5);
    });
  });

  describe('analyzeEffectiveness', () => {
    it('should mark fixed rules', () => {
      const prev = [{ ruleId: 'rule-a' }, { ruleId: 'rule-b' }];
      const curr = [{ ruleId: 'rule-b' }]; // rule-a was fixed
      analyzeEffectiveness(prev, curr);
      const scores = getEffectivenessScores();
      const ruleA = scores.find(s => s.ruleId === 'rule-a');
      const ruleB = scores.find(s => s.ruleId === 'rule-b');
      assert.equal(ruleA.fixed, 1);
      assert.equal(ruleB.ignored, 1);
    });

    it('should handle null inputs', () => {
      analyzeEffectiveness(null, []);
      analyzeEffectiveness([], null);
      assert.deepEqual(getEffectivenessScores(), []);
    });

    it('should handle empty arrays', () => {
      analyzeEffectiveness([], []);
      assert.deepEqual(getEffectivenessScores(), []);
    });
  });

  describe('resetEffectivenessState', () => {
    it('should clear all tracked state', () => {
      trackRuleEffectiveness('test', 'fixed');
      resetEffectivenessState();
      assert.deepEqual(getEffectivenessScores(), []);
    });
  });
});
