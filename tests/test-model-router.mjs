import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { determineVerificationLevel, getVerificationConfig } from '../scripts/lib/model-router.mjs';

describe('Model Router', () => {

  describe('determineVerificationLevel', () => {
    it('should return standard when routing disabled', () => {
      const level = determineVerificationLevel('Bash', { command: 'ls' }, {});
      assert.equal(level, 'standard');
    });

    it('should return standard when modelRouting.enabled is false', () => {
      const level = determineVerificationLevel('Bash', { command: 'ls' }, { modelRouting: { enabled: false } });
      assert.equal(level, 'standard');
    });

    it('should return light for short simple bash commands', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Bash', { command: 'ls -la' }, config);
      assert.equal(level, 'light');
    });

    it('should return strict for sensitive bash commands', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Bash', { command: 'cat /etc/passwd' }, config);
      assert.equal(level, 'strict');
    });

    it('should return strict for ssh-related commands', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Bash', { command: 'cat .ssh/id_rsa' }, config);
      assert.equal(level, 'strict');
    });

    it('should return standard for complex bash commands', () => {
      const config = { modelRouting: { enabled: true } };
      const cmd = 'cat file1.txt | grep pattern | sort | uniq -c | head -20';
      const level = determineVerificationLevel('Bash', { command: cmd }, config);
      assert.equal(level, 'standard');
    });

    it('should return light for small Write operations', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Write', { content: 'hello world' }, config);
      assert.equal(level, 'light');
    });

    it('should return standard for large Write operations', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Write', { content: 'x'.repeat(500) }, config);
      assert.equal(level, 'standard');
    });

    it('should return light for small Edit operations', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('Edit', { new_string: 'fix' }, config);
      assert.equal(level, 'light');
    });

    it('should return standard for MCP tools', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('mcp__test__tool', { query: 'test' }, config);
      assert.equal(level, 'standard');
    });

    it('should return standard for unknown tools', () => {
      const config = { modelRouting: { enabled: true } };
      const level = determineVerificationLevel('UnknownTool', {}, config);
      assert.equal(level, 'standard');
    });
  });

  describe('getVerificationConfig', () => {
    it('should set light mode flags', () => {
      const config = getVerificationConfig('light', { disabledRules: ['no-any-type'] });
      assert.equal(config._verificationLevel, 'light');
      assert.equal(config._lightMode, true);
    });

    it('should enable all rules for strict mode', () => {
      const config = getVerificationConfig('strict', { disabledRules: ['no-any-type', 'no-eval'] });
      assert.equal(config._verificationLevel, 'strict');
      assert.deepEqual(config.disabledRules, []);
    });

    it('should preserve config for standard mode', () => {
      const config = getVerificationConfig('standard', { disabledRules: ['no-any-type'] });
      assert.equal(config._verificationLevel, 'standard');
      assert.deepEqual(config.disabledRules, ['no-any-type']);
    });

    it('should not mutate original config', () => {
      const original = { disabledRules: ['no-any-type'] };
      getVerificationConfig('strict', original);
      assert.deepEqual(original.disabledRules, ['no-any-type']);
    });
  });
});
