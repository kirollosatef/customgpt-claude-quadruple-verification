import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { estimateTokens, trackInjection, condenseIfOverBudget, getBudgetReport, resetBudget } from '../scripts/lib/prompt-budget.mjs';

describe('Prompt Budget Management', () => {

  beforeEach(() => {
    resetBudget();
  });

  describe('estimateTokens', () => {
    it('should estimate ~4 chars per token', () => {
      assert.equal(estimateTokens('abcd'), 1);
      assert.equal(estimateTokens('abcdefgh'), 2);
      assert.equal(estimateTokens('a'), 1);
    });

    it('should return 0 for empty/null input', () => {
      assert.equal(estimateTokens(''), 0);
      assert.equal(estimateTokens(null), 0);
      assert.equal(estimateTokens(undefined), 0);
    });

    it('should handle long strings', () => {
      const longStr = 'x'.repeat(2000);
      assert.equal(estimateTokens(longStr), 500);
    });
  });

  describe('trackInjection', () => {
    it('should track token count for a source', () => {
      const result = trackInjection('block-message', 'Hello world test message', { maxVerificationTokens: 500 });
      assert.ok(result.tokens > 0);
      assert.equal(result.overBudget, false);
    });

    it('should detect over-budget condition', () => {
      const longMsg = 'x'.repeat(2100); // 525 tokens
      const result = trackInjection('block-message', longMsg, { maxVerificationTokens: 500 });
      assert.equal(result.overBudget, true);
    });

    it('should accumulate across multiple injections', () => {
      trackInjection('block-message', 'x'.repeat(1200), { maxVerificationTokens: 500 });
      const result = trackInjection('stop-prompt', 'x'.repeat(1200), { maxVerificationTokens: 500 });
      assert.equal(result.overBudget, true);
    });

    it('should track per-source stats', () => {
      trackInjection('block-message', 'test1');
      trackInjection('block-message', 'test2');
      trackInjection('stop-prompt', 'test3');

      const report = getBudgetReport();
      assert.equal(report.sources['block-message'].count, 2);
      assert.equal(report.sources['stop-prompt'].count, 1);
    });

    it('should default maxVerificationTokens to 500', () => {
      const longMsg = 'x'.repeat(2100);
      const result = trackInjection('block-message', longMsg);
      assert.equal(result.overBudget, true);
    });
  });

  describe('condenseIfOverBudget', () => {
    it('should not condense when under budget', () => {
      trackInjection('block-message', 'short');
      const violations = [{ ruleId: 'test', message: 'A long detailed message about the violation' }];
      const result = condenseIfOverBudget(violations, { maxVerificationTokens: 500 });
      assert.equal(result[0].condensed, undefined);
    });

    it('should condense long messages when over budget', () => {
      trackInjection('block-message', 'x'.repeat(2100), { maxVerificationTokens: 500 });
      const longMessage = 'This is a very long violation message that contains lots of details about what went wrong and evidence and remediation steps that together exceed eighty characters';
      const violations = [{ ruleId: 'test', message: longMessage }];
      const result = condenseIfOverBudget(violations, { maxVerificationTokens: 500 });
      assert.equal(result[0].condensed, true);
      assert.ok(result[0].message.length <= 80);
      assert.ok(result[0].message.endsWith('...'));
    });

    it('should keep short messages unchanged when over budget', () => {
      trackInjection('block-message', 'x'.repeat(2100));
      const violations = [{ ruleId: 'test', message: 'Short msg' }];
      const result = condenseIfOverBudget(violations);
      assert.equal(result[0].message, 'Short msg');
      assert.equal(result[0].condensed, true);
    });

    it('should preserve ruleId and other fields', () => {
      trackInjection('block-message', 'x'.repeat(2100));
      const violations = [{ ruleId: 'no-eval', message: 'x'.repeat(100), severity: 'critical' }];
      const result = condenseIfOverBudget(violations);
      assert.equal(result[0].ruleId, 'no-eval');
      assert.equal(result[0].severity, 'critical');
    });
  });

  describe('getBudgetReport', () => {
    it('should return empty report initially', () => {
      const report = getBudgetReport();
      assert.equal(report.totalTokens, 0);
      assert.deepEqual(report.breakdown, []);
    });

    it('should include breakdown by source', () => {
      trackInjection('block-message', 'test message one');
      trackInjection('stop-prompt', 'another test');

      const report = getBudgetReport();
      assert.equal(report.breakdown.length, 2);
      assert.ok(report.totalTokens > 0);
      assert.ok(report.breakdown.some(b => b.source === 'block-message'));
      assert.ok(report.breakdown.some(b => b.source === 'stop-prompt'));
    });
  });

  describe('resetBudget', () => {
    it('should clear all tracked state', () => {
      trackInjection('block-message', 'x'.repeat(400));
      resetBudget();
      const report = getBudgetReport();
      assert.equal(report.totalTokens, 0);
      assert.deepEqual(report.breakdown, []);
    });
  });
});
