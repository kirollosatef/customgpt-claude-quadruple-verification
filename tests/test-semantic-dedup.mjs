import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { similarityRatio, detectEditLoop, detectRetryLoop } from '../scripts/lib/behavior-tracker.mjs';

describe('Semantic Duplicate Detection', () => {

  describe('similarityRatio', () => {
    it('should return 1 for identical strings', () => {
      assert.equal(similarityRatio('hello world', 'hello world'), 1);
    });

    it('should return 0 for completely different strings', () => {
      const ratio = similarityRatio('abcdef', 'zyxwvu');
      assert.ok(ratio < 0.2);
    });

    it('should return high ratio for similar strings', () => {
      const ratio = similarityRatio('const x = 42;', 'const x = 43;');
      assert.ok(ratio > 0.7);
    });

    it('should return 0 for null/empty input', () => {
      assert.equal(similarityRatio(null, 'test'), 0);
      assert.equal(similarityRatio('test', null), 0);
      assert.equal(similarityRatio('', 'test'), 0);
    });

    it('should handle single character strings', () => {
      assert.equal(similarityRatio('a', 'a'), 1);
      assert.equal(similarityRatio('a', 'b'), 0);
    });
  });

  describe('detectEditLoop', () => {
    it('should not warn on first edit', () => {
      const state = {};
      const warnings = detectEditLoop('/test.js', 'content here', state);
      assert.equal(warnings.length, 0);
    });

    it('should not warn on different content edits', () => {
      const state = {};
      detectEditLoop('/test.js', 'first version of the code', state);
      detectEditLoop('/test.js', 'completely different content xyz', state);
      const warnings = detectEditLoop('/test.js', 'yet another unique thing abc', state);
      assert.equal(warnings.length, 0);
    });

    it('should warn after 3+ similar edits', () => {
      const state = {};
      const base = 'const x = 42; function doSomething() { return x; }';
      detectEditLoop('/test.js', base, state);
      detectEditLoop('/test.js', base + ' ', state); // very similar
      const warnings = detectEditLoop('/test.js', base + '  ', state); // still very similar
      assert.ok(warnings.length > 0);
      assert.ok(warnings.some(w => w.pattern === 'edit-revert-loop'));
    });

    it('should handle null inputs gracefully', () => {
      const warnings = detectEditLoop(null, 'content', {});
      assert.deepEqual(warnings, []);
    });

    it('should track different files separately', () => {
      const state = {};
      const content = 'same content repeated many times here';
      detectEditLoop('/file1.js', content, state);
      detectEditLoop('/file1.js', content + ' ', state);
      const w1 = detectEditLoop('/file1.js', content + '  ', state);
      
      // file2 should start fresh
      const w2 = detectEditLoop('/file2.js', content, state);
      assert.equal(w2.length, 0);
    });
  });

  describe('detectRetryLoop', () => {
    it('should not warn on first command', () => {
      const state = {};
      const warnings = detectRetryLoop('npm test', state);
      assert.equal(warnings.length, 0);
    });

    it('should not warn on different commands', () => {
      const state = {};
      detectRetryLoop('npm test', state);
      detectRetryLoop('npm build', state);
      const warnings = detectRetryLoop('npm lint', state);
      assert.equal(warnings.length, 0);
    });

    it('should warn after 4+ consecutive identical commands', () => {
      const state = {};
      detectRetryLoop('npm test', state);
      detectRetryLoop('npm test', state);
      detectRetryLoop('npm test', state);
      const warnings = detectRetryLoop('npm test', state);
      assert.ok(warnings.length > 0);
      assert.ok(warnings.some(w => w.pattern === 'brute-force-retry'));
    });

    it('should reset count when different command intervenes', () => {
      const state = {};
      detectRetryLoop('npm test', state);
      detectRetryLoop('npm test', state);
      detectRetryLoop('npm build', state); // different command breaks the streak
      const warnings = detectRetryLoop('npm test', state);
      assert.equal(warnings.length, 0);
    });

    it('should handle null inputs', () => {
      const warnings = detectRetryLoop(null, {});
      assert.deepEqual(warnings, []);
    });
  });
});
