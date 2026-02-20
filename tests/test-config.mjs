import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deepMerge, loadJSONFile, getTrustLevel } from '../scripts/lib/config-loader.mjs';

describe('Config Loader', () => {
  describe('deepMerge', () => {
    it('should merge flat objects', () => {
      const base = { a: 1, b: 2 };
      const override = { b: 3, c: 4 };
      const result = deepMerge(base, override);
      assert.deepEqual(result, { a: 1, b: 3, c: 4 });
    });

    it('should deep merge nested objects', () => {
      const base = { a: { x: 1, y: 2 }, b: 3 };
      const override = { a: { y: 5, z: 6 } };
      const result = deepMerge(base, override);
      assert.deepEqual(result, { a: { x: 1, y: 5, z: 6 }, b: 3 });
    });

    it('should replace arrays (not concatenate)', () => {
      const base = { rules: ['a', 'b', 'c'] };
      const override = { rules: ['x', 'y'] };
      const result = deepMerge(base, override);
      assert.deepEqual(result, { rules: ['x', 'y'] });
    });

    it('should handle null override', () => {
      const base = { a: 1 };
      const result = deepMerge(base, null);
      assert.deepEqual(result, { a: 1 });
    });

    it('should handle null base', () => {
      const override = { a: 1 };
      const result = deepMerge(null, override);
      assert.deepEqual(result, { a: 1 });
    });

    it('should not mutate original objects', () => {
      const base = { a: { x: 1 } };
      const override = { a: { y: 2 } };
      deepMerge(base, override);
      assert.deepEqual(base, { a: { x: 1 } });
    });
  });

  describe('leanMode', () => {
    it('should default leanMode to false', () => {
      const base = { version: '1.3.0' };
      const result = deepMerge(base, {});
      assert.equal(result.leanMode, undefined);
    });

    it('should accept leanMode override', () => {
      const base = { leanMode: false };
      const override = { leanMode: true };
      const result = deepMerge(base, override);
      assert.equal(result.leanMode, true);
    });
  });

  describe('loadJSONFile', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), 'config-test-'));
    });

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should load valid JSON file', () => {
      const filePath = join(tempDir, 'test.json');
      writeFileSync(filePath, JSON.stringify({ key: 'value' }));
      const result = loadJSONFile(filePath);
      assert.deepEqual(result, { key: 'value' });
    });

    it('should return empty object for non-existent file', () => {
      const result = loadJSONFile(join(tempDir, 'missing.json'));
      assert.deepEqual(result, {});
    });

    it('should return empty object for invalid JSON', () => {
      const filePath = join(tempDir, 'invalid.json');
      writeFileSync(filePath, 'not valid json{{{');
      const result = loadJSONFile(filePath);
      assert.deepEqual(result, {});
    });
  });

  describe('getTrustLevel', () => {
    it('should default to standard', () => {
      assert.equal(getTrustLevel({}), 'standard');
      assert.equal(getTrustLevel(null), 'standard');
    });

    it('should accept valid trust levels', () => {
      assert.equal(getTrustLevel({ trustLevel: 'minimal' }), 'minimal');
      assert.equal(getTrustLevel({ trustLevel: 'strict' }), 'strict');
      assert.equal(getTrustLevel({ trustLevel: 'standard' }), 'standard');
    });

    it('should reject invalid trust levels', () => {
      assert.equal(getTrustLevel({ trustLevel: 'invalid' }), 'standard');
    });
  });

});
