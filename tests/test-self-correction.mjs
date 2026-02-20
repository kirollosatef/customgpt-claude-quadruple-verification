import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCorrectionHint,
  trackCorrectionAttempt,
  escalateIfNeeded,
  getCorrectionState,
  resetCorrectionState
} from '../scripts/lib/self-correction.mjs';

describe('Self-Correction Loop', () => {

  beforeEach(() => {
    resetCorrectionState();
  });

  describe('buildCorrectionHint', () => {
    it('should build hints from violations', () => {
      const violations = [
        { ruleId: 'no-eval', message: 'eval detected', remediation: 'Use safer alternatives' },
        { ruleId: 'no-exec', message: 'exec detected', remediation: 'Use execFile instead' }
      ];
      const hint = buildCorrectionHint(violations);
      assert.ok(hint.includes('Correction hints'));
      assert.ok(hint.includes('no-eval'));
      assert.ok(hint.includes('Use safer alternatives'));
      assert.ok(hint.includes('no-exec'));
    });

    it('should use default remediation when not provided', () => {
      const violations = [{ ruleId: 'test-rule', message: 'problem found' }];
      const hint = buildCorrectionHint(violations);
      assert.ok(hint.includes('Review and fix'));
    });

    it('should return empty string for no violations', () => {
      assert.equal(buildCorrectionHint([]), '');
      assert.equal(buildCorrectionHint(null), '');
    });
  });

  describe('trackCorrectionAttempt', () => {
    it('should track first attempt', () => {
      const result = trackCorrectionAttempt('/test/file.js', [{ ruleId: 'r1', message: 'm1' }]);
      assert.equal(result.attempts, 1);
      assert.equal(result.isEscalated, false);
    });

    it('should escalate after 3 attempts', () => {
      trackCorrectionAttempt('/test/file.js', [{ ruleId: 'r1', message: 'm1' }]);
      trackCorrectionAttempt('/test/file.js', [{ ruleId: 'r1', message: 'm1' }]);
      const result = trackCorrectionAttempt('/test/file.js', [{ ruleId: 'r1', message: 'm1' }]);
      assert.equal(result.attempts, 3);
      assert.equal(result.isEscalated, true);
    });

    it('should track different files separately', () => {
      trackCorrectionAttempt('/file1.js', [{ ruleId: 'r1', message: 'm1' }]);
      trackCorrectionAttempt('/file1.js', [{ ruleId: 'r1', message: 'm1' }]);
      const result = trackCorrectionAttempt('/file2.js', [{ ruleId: 'r1', message: 'm1' }]);
      assert.equal(result.attempts, 1);
      assert.equal(result.isEscalated, false);
    });

    it('should limit history to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      }
      const state = getCorrectionState();
      assert.ok(state['/test.js'].history.length <= 10);
    });

    it('should handle missing filePath', () => {
      const result = trackCorrectionAttempt(null, [{ ruleId: 'r1', message: 'm1' }]);
      assert.equal(result.attempts, 1);
    });
  });

  describe('escalateIfNeeded', () => {
    it('should return empty string when not escalated', () => {
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      const msg = escalateIfNeeded('/test.js');
      assert.equal(msg, '');
    });

    it('should return escalation message after 3 attempts', () => {
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r2', message: 'm2' }]);
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      const msg = escalateIfNeeded('/test.js');
      assert.ok(msg.includes('ESCALATION'));
      assert.ok(msg.includes('3 times'));
      assert.ok(msg.includes('r1'));
      assert.ok(msg.includes('r2'));
    });

    it('should collect unique rule IDs from all attempts', () => {
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r2', message: 'm2' }]);
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r3', message: 'm3' }]);
      const msg = escalateIfNeeded('/test.js');
      assert.ok(msg.includes('r1'));
      assert.ok(msg.includes('r2'));
      assert.ok(msg.includes('r3'));
    });

    it('should return empty for unknown file', () => {
      const msg = escalateIfNeeded('/nonexistent.js');
      assert.equal(msg, '');
    });
  });

  describe('getCorrectionState', () => {
    it('should return empty state initially', () => {
      const state = getCorrectionState();
      assert.deepEqual(state, {});
    });

    it('should return state after tracking', () => {
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      const state = getCorrectionState();
      assert.ok('/test.js' in state);
      assert.equal(state['/test.js'].attempts, 1);
    });
  });

  describe('resetCorrectionState', () => {
    it('should clear all state', () => {
      trackCorrectionAttempt('/test.js', [{ ruleId: 'r1', message: 'm1' }]);
      resetCorrectionState();
      assert.deepEqual(getCorrectionState(), {});
    });
  });
});
