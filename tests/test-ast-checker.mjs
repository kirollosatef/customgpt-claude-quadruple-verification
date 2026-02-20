import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLanguage,
  stripJsCommentsAndStrings,
  stripPyCommentsAndStrings,
  stripCommentsAndStrings,
  isInCommentOrString
} from '../scripts/lib/ast-checker.mjs';

describe('AST Checker', () => {
  describe('detectLanguage', () => {
    it('should detect JS extensions', () => {
      assert.equal(detectLanguage('.js'), 'js');
      assert.equal(detectLanguage('.ts'), 'js');
      assert.equal(detectLanguage('.mjs'), 'js');
      assert.equal(detectLanguage('.tsx'), 'js');
    });

    it('should detect Python extensions', () => {
      assert.equal(detectLanguage('.py'), 'python');
      assert.equal(detectLanguage('.pyi'), 'python');
    });

    it('should return unknown for other extensions', () => {
      assert.equal(detectLanguage('.rs'), 'unknown');
      assert.equal(detectLanguage('.go'), 'unknown');
    });
  });

  describe('stripJsCommentsAndStrings', () => {
    it('should strip single-line comments', () => {
      const result = stripJsCommentsAndStrings('code // comment here\nmore');
      assert.ok(!result.includes('comment here'));
      assert.ok(result.includes('code'));
      assert.ok(result.includes('more'));
    });

    it('should strip multi-line comments', () => {
      const result = stripJsCommentsAndStrings('before /* block\ncomment */ after');
      assert.ok(!result.includes('block'));
      assert.ok(result.includes('before'));
      assert.ok(result.includes('after'));
    });

    it('should strip string literals', () => {
      const result = stripJsCommentsAndStrings('const x = "dangerous_word";');
      assert.ok(!result.includes('dangerous_word'));
      assert.ok(result.includes('const x'));
    });

    it('should strip template literals', () => {
      const result = stripJsCommentsAndStrings('const x = `template ${val}`;');
      assert.ok(!result.includes('template'));
    });

    it('should preserve content length', () => {
      const input = 'code // comment\nmore';
      const result = stripJsCommentsAndStrings(input);
      assert.equal(result.length, input.length);
    });
  });

  describe('stripPyCommentsAndStrings', () => {
    it('should strip hash comments', () => {
      const result = stripPyCommentsAndStrings('code # comment here\nmore');
      assert.ok(!result.includes('comment here'));
      assert.ok(result.includes('code'));
    });

    it('should strip triple-quoted strings', () => {
      const result = stripPyCommentsAndStrings('x = """multi\nline\nstring"""\ncode');
      assert.ok(!result.includes('multi'));
      assert.ok(result.includes('code'));
    });

    it('should strip single-quoted strings', () => {
      const result = stripPyCommentsAndStrings("x = 'dangerous'");
      assert.ok(!result.includes('dangerous'));
    });
  });

  describe('isInCommentOrString', () => {
    it('should detect match inside JS comment', () => {
      const code = 'good // bad_word here';
      const idx = code.indexOf('bad_word');
      assert.equal(isInCommentOrString(code, idx, '.js'), true);
    });

    it('should not flag match in real code', () => {
      const code = 'const bad_word = 1;';
      const idx = code.indexOf('bad_word');
      assert.equal(isInCommentOrString(code, idx, '.js'), false);
    });

    it('should detect match inside Python string', () => {
      const code = "x = 'bad_word'";
      const idx = code.indexOf('bad_word');
      assert.equal(isInCommentOrString(code, idx, '.py'), true);
    });

    it('should detect match inside Python comment', () => {
      const code = 'x = 1 # bad_word here';
      const idx = code.indexOf('bad_word');
      assert.equal(isInCommentOrString(code, idx, '.py'), true);
    });
  });
});
