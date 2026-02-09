import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCycle1 } from '../scripts/lib/rules-engine.mjs';

describe('Cycle 1 — Code Quality Rules', () => {
  describe('no-todo', () => {
    it('should block TODO comments', () => {
      const violations = runCycle1('// TODO: fix this later', '.js', 'file-write');
      assert.ok(violations.length > 0);
      assert.equal(violations[0].ruleId, 'no-todo');
    });

    it('should block FIXME comments', () => {
      const violations = runCycle1('# FIXME: broken logic', '.py', 'file-write');
      assert.ok(violations.length > 0);
      assert.equal(violations[0].ruleId, 'no-todo');
    });

    it('should block HACK comments', () => {
      const violations = runCycle1('// HACK: temporary workaround', '.js', 'file-write');
      assert.ok(violations.length > 0);
    });

    it('should block XXX comments', () => {
      const violations = runCycle1('# XXX: needs review', '.py', 'file-write');
      assert.ok(violations.length > 0);
    });

    it('should not block normal code', () => {
      const violations = runCycle1('const total = items.reduce((a, b) => a + b, 0);', '.js', 'file-write');
      const todoViolations = violations.filter(v => v.ruleId === 'no-todo');
      assert.equal(todoViolations.length, 0);
    });
  });

  describe('no-empty-pass', () => {
    it('should block bare pass in Python', () => {
      const violations = runCycle1('def foo():\n    pass\n', '.py', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-empty-pass'));
    });

    it('should not trigger for .js files', () => {
      const violations = runCycle1('pass\n', '.js', 'file-write');
      assert.ok(!violations.some(v => v.ruleId === 'no-empty-pass'));
    });
  });

  describe('no-not-implemented', () => {
    it('should block NotImplementedError', () => {
      const violations = runCycle1('raise NotImplementedError("coming soon")', '.py', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-not-implemented'));
    });
  });

  describe('no-ellipsis', () => {
    it('should block ellipsis placeholder', () => {
      const violations = runCycle1('def foo():\n    ...\n', '.py', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-ellipsis'));
    });

    it('should not trigger for non-Python files', () => {
      const violations = runCycle1('...\n', '.js', 'file-write');
      assert.ok(!violations.some(v => v.ruleId === 'no-ellipsis'));
    });
  });

  describe('no-placeholder-text', () => {
    it('should block "placeholder" text', () => {
      const violations = runCycle1('// This is a placeholder implementation', '.js', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-placeholder-text'));
    });

    it('should block "stub" text', () => {
      const violations = runCycle1('# stub function', '.py', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-placeholder-text'));
    });

    it('should block "implement this" text', () => {
      const violations = runCycle1('// implement this later', '.js', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-placeholder-text'));
    });
  });

  describe('no-throw-not-impl', () => {
    it('should block throw new Error not implemented in JS', () => {
      const violations = runCycle1('throw new Error("not implemented yet")', '.js', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-throw-not-impl'));
    });

    it('should block throw new Error not implemented in TS', () => {
      const violations = runCycle1('throw new Error(`not implemented`)', '.ts', 'file-write');
      assert.ok(violations.some(v => v.ruleId === 'no-throw-not-impl'));
    });

    it('should not trigger for Python files', () => {
      const violations = runCycle1('throw new Error("not implemented")', '.py', 'file-write');
      assert.ok(!violations.some(v => v.ruleId === 'no-throw-not-impl'));
    });
  });

  describe('context filtering', () => {
    it('should not run file-write rules in bash context', () => {
      const violations = runCycle1('TODO: fix this', '.sh', 'bash');
      assert.equal(violations.length, 0);
    });
  });

  describe('disabled rules', () => {
    it('should skip disabled rules', () => {
      const violations = runCycle1('// TODO: fix', '.js', 'file-write', { disabledRules: ['no-todo'] });
      assert.ok(!violations.some(v => v.ruleId === 'no-todo'));
    });
  });

  describe('clean code passes', () => {
    it('should approve clean TypeScript code', () => {
      const cleanCode = `
interface User {
  id: string;
  name: string;
}

function validateEmail(email: string): boolean {
  const pattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return pattern.test(email);
}
`;
      const violations = runCycle1(cleanCode, '.ts', 'file-write');
      assert.equal(violations.length, 0);
    });
  });
});
